import Transaction from '../models/Transaction.js';
import BudgetCycle from '../models/BudgetCycle.js';


import {processTransactionRecommendationAsync} from './transactionRecommendation.js';
import {scheduleAnalyticsUpdateForUser} from './scheduleAnalyticsUpdate.js';

/**
 * Create a new transaction and trigger recommendation processing and analytics update asynchronously.
 *
 * @param {Object} transactionData - Data for the new transaction.
 * @returns {Promise<Object>} The saved transaction document.
 */
export const createTransaction = async (transactionData) => {

    const transactionId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const transactionInput = {
        ...transactionData,
        transactionId // Add the generated transactionId
    };

    const transaction = new Transaction(transactionInput);

    await transaction.save();
    // Trigger the recommendation logic asynchronously.
    setImmediate(() => {
        processTransactionRecommendationAsync(transaction);
    });
    // Schedule the analytics update 10 minutes later.
    scheduleAnalyticsUpdateForUser(transaction.userId, transaction.purchaseCategory);
    return transaction;
};

/**
 * Update an existing transaction and trigger recommendation processing and analytics update asynchronously.
 *
 * @param {String} transactionId - The transaction document ID.
 * @param {Object} updates - The fields to update.
 * @returns {Promise<Object>} The updated transaction document.
 */

export const updateTransaction = async (transactionId, updates) => {
    const transaction = await Transaction.findByIdAndUpdate(transactionId, updates, { new: true });
    if (!transaction) throw new Error('Transaction not found');

    // Initialize previous transaction data for comparison
    const previousTransaction = await Transaction.findById(transactionId);

    // Check if `isTransactionPerformedAfterRecommendation` is in the updates
    if (updates.hasOwnProperty('isTransactionPerformedAfterRecommendation')) {
        const { isTransactionPerformedAfterRecommendation, purchaseAmount, purchaseCategory, budgetCycleId } = transaction;

        // Fetch the corresponding BudgetCycle
        const budgetCycle = await BudgetCycle.findOne({ budgetCycleId });
        if (!budgetCycle) throw new Error("Budget Cycle not found");

        const update = {};

        if (isTransactionPerformedAfterRecommendation === 'yes') {
            // Add purchaseAmount to spentSoFar and categorySpent
            update.$inc = {
                spentSoFar: purchaseAmount,
                [`categorySpent.${purchaseCategory}`]: purchaseAmount
            };
        } else if (isTransactionPerformedAfterRecommendation === 'no' && budgetCycle.spentSoFar > 0) {
            // Subtract purchaseAmount from spentSoFar and categorySpent (if spentSoFar is not 0)
            update.$inc = {
                spentSoFar: -Math.min(purchaseAmount, budgetCycle.spentSoFar),
                [`categorySpent.${purchaseCategory}`]: -Math.min(purchaseAmount, (budgetCycle.categorySpent[purchaseCategory] || 0))
            };
        }

        // Update the BudgetCycle
        await BudgetCycle.findOneAndUpdate({ budgetCycleId }, update);
    }

    // Check for changes to `purchaseAmount` or `purchaseCategory`
    if (updates.purchaseAmount || updates.purchaseCategory) {
        const { purchaseAmount, purchaseCategory, budgetCycleId } = transaction;

        // Fetch the corresponding BudgetCycle
        const budgetCycle = await BudgetCycle.findOne({ budgetCycleId });
        if (!budgetCycle) throw new Error("Budget Cycle not found");

        const update = {};

        // If purchaseAmount is changed, update spentSoFar and the categorySpent
        if (previousTransaction.purchaseAmount !== purchaseAmount) {
            const amountDifference = purchaseAmount - previousTransaction.purchaseAmount;

            // Adjust spentSoFar by the difference, ensuring it doesn't go negative
            const newSpentSoFar = Math.max(budgetCycle.spentSoFar + amountDifference, 0);
            update.$inc = { spentSoFar: newSpentSoFar - budgetCycle.spentSoFar };

            // Adjust the old category (subtract previousAmount)
            if (previousTransaction.purchaseCategory) {
                update.$inc[`categorySpent.${previousTransaction.purchaseCategory}`] = -previousTransaction.purchaseAmount;
            }

            // Adjust the new category (add newAmount)
            if (purchaseCategory !== previousTransaction.purchaseCategory) {
                update.$inc[`categorySpent.${purchaseCategory}`] = amountDifference;
            }
        }

        // Update the BudgetCycle with the changes
        await BudgetCycle.findOneAndUpdate({ budgetCycleId }, update);
    }

    // Perform immediate analytics asynchronously if any field was updated
    if (Object.keys(updates).length > 0) {
        setImmediate(async () => {
            await scheduleAnalyticsUpdateForUser(transaction.userId, transaction.purchaseCategory);
        });
    }

    // Process transaction recommendation AFTER analytics update completes
    setImmediate(async () => {
        await processTransactionRecommendationAsync(transaction);
    });

    return transaction;
};





export const deleteTransaction = async (transactionId) => {
    try {
        // Fetch the transaction to be deleted
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) throw new Error("Transaction not found");

        const { purchaseAmount, purchaseCategory, budgetCycleId } = transaction;

        // Fetch the corresponding BudgetCycle
        const budgetCycle = await BudgetCycle.findOne({ budgetCycleId });
        if (!budgetCycle) throw new Error("Budget Cycle not found");

        // Prepare the update for the BudgetCycle
        const update = {};

        // Subtract the purchaseAmount from spentSoFar and categorySpent
        update.$inc = {
            spentSoFar: -Math.min(purchaseAmount, budgetCycle.spentSoFar),
            [`categorySpent.${purchaseCategory}`]: -Math.min(purchaseAmount, (budgetCycle.categorySpent[purchaseCategory] || 0))
        };

        // Update the BudgetCycle after deletion
        await BudgetCycle.findOneAndUpdate({ budgetCycleId }, update);

        setImmediate(async () => {
            await scheduleAnalyticsUpdateForUser(transaction.userId, transaction.purchaseCategory);
        });

        return await Transaction.findByIdAndDelete(transactionId);
    } catch (error) {
        throw new Error(`Error deleting transaction: ${error.message}`);
    }

};

export const getTransactions = async (userId) => {
    return Transaction.find({userId});
};