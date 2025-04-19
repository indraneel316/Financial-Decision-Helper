import Transaction from '../models/Transaction.js';
import BudgetCycle from '../models/BudgetCycle.js';


import {processTransactionRecommendationAsync} from './transactionRecommendation.js';
import {scheduleAnalyticsUpdateForUser} from './scheduleAnalyticsUpdate.js';
import budgetCycle from "../models/BudgetCycle.js";

/**
 * Create a new transaction and trigger recommendation processing and analytics update asynchronously.
 *
 * @param {Object} transactionData - Data for the new transaction.
 * @returns {Promise<Object>} The saved transaction document.
 */
export const createTransaction = async (transactionData) => {

    // const transactionId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    //
    // const transactionInput = {
    //     ...transactionData,
    //     transactionId // Add the generated transactionId
    // };

    const transaction = new Transaction(transactionData);

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
    console.log('updateTransaction started:', { transactionId, updates });

    try {
        // Fetch original transaction and update in one step
        console.log('Fetching and updating transaction:', { transactionId });
        const previousTransaction = await Transaction.findOneAndUpdate(
            { transactionId },
            updates,
            { new: false, returnOriginal: true }
        );
        if (!previousTransaction) {
            console.error('Transaction not found:', { transactionId });
            throw new Error('Transaction not found');
        }
        console.log('Previous transaction:', { previousTransaction });

        // Fetch updated transaction
        console.log('Fetching updated transaction:', { transactionId });
        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction) {
            console.error('Updated transaction not found:', { transactionId });
            throw new Error('Updated transaction not found');
        }
        console.log('Transaction updated:', { transaction });

        // Handle isTransactionPerformedAfterRecommendation
        if (updates.hasOwnProperty('isTransactionPerformedAfterRecommendation')) {
            console.log('Processing isTransactionPerformedAfterRecommendation:', {
                isTransactionPerformedAfterRecommendation: transaction.isTransactionPerformedAfterRecommendation,
                purchaseAmount: transaction.purchaseAmount,
                purchaseCategory: transaction.purchaseCategory,
                budgetCycleId: transaction.budgetCycleId,
            });

            // Fetch BudgetCycle
            console.log('Fetching BudgetCycle:', { budgetCycleId: transaction.budgetCycleId });
            const budgetCycle = await BudgetCycle.findOne({ budgetCycleId: transaction.budgetCycleId });
            if (!budgetCycle) {
                console.error('Budget Cycle not found:', { budgetCycleId: transaction.budgetCycleId });
                throw new Error('Budget Cycle not found');
            }
            console.log('BudgetCycle fetched:', { budgetCycle });

            const update = {};

            if (transaction.isTransactionPerformedAfterRecommendation === 'yes') {
                console.log('Recommendation set to yes, incrementing spent:', {
                    purchaseAmount: transaction.purchaseAmount,
                    purchaseCategory: transaction.purchaseCategory,
                });
                update.$inc = {
                    spentSoFar: transaction.purchaseAmount,
                    [`categorySpent.${transaction.purchaseCategory}`]: transaction.purchaseAmount,
                };
            } else if (transaction.isTransactionPerformedAfterRecommendation === 'no' && budgetCycle.spentSoFar > 0) {
                console.log('Recommendation set to no, decrementing spent:', {
                    purchaseAmount: transaction.purchaseAmount,
                    purchaseCategory: transaction.purchaseCategory,
                    currentSpentSoFar: budgetCycle.spentSoFar,
                    currentCategorySpent: budgetCycle.categorySpent[transaction.purchaseCategory] || 0,
                });
                update.$inc = {
                    spentSoFar: -Math.min(transaction.purchaseAmount, budgetCycle.spentSoFar),
                    [`categorySpent.${transaction.purchaseCategory}`]: -Math.min(
                        transaction.purchaseAmount,
                        (budgetCycle.categorySpent[transaction.purchaseCategory] || 0)
                    ),
                };
            }

            // Apply BudgetCycle update
            if (Object.keys(update).length > 0) {
                console.log('Updating BudgetCycle:', { budgetCycleId: transaction.budgetCycleId, update });
                await BudgetCycle.findOneAndUpdate({ budgetCycleId: transaction.budgetCycleId }, update);
                console.log('BudgetCycle updated successfully');
            } else {
                console.log('No BudgetCycle update needed for isTransactionPerformedAfterRecommendation');
            }
        } else {
            console.log('isTransactionPerformedAfterRecommendation not updated');
        }

        // Handle purchaseAmount or purchaseCategory changes
        if (updates.purchaseAmount || updates.purchaseCategory) {
            console.log('Processing purchaseAmount or purchaseCategory update:', {
                purchaseAmount: transaction.purchaseAmount,
                purchaseCategory: transaction.purchaseCategory,
                budgetCycleId: transaction.budgetCycleId,
                previousPurchaseAmount: previousTransaction.purchaseAmount,
                previousPurchaseCategory: previousTransaction.purchaseCategory,
            });

            // Fetch BudgetCycle
            console.log('Fetching BudgetCycle for amount/category:', { budgetCycleId: transaction.budgetCycleId });
            const budgetCycle = await BudgetCycle.findOne({ budgetCycleId: transaction.budgetCycleId });
            if (!budgetCycle) {
                console.error('Budget Cycle not found for amount/category:', { budgetCycleId: transaction.budgetCycleId });
                throw new Error('Budget Cycle not found');
            }
            console.log('BudgetCycle fetched for amount/category:', { budgetCycle });

            const update = {};

            // Adjust for purchaseAmount or purchaseCategory change
            if (
                previousTransaction.purchaseAmount !== transaction.purchaseAmount ||
                previousTransaction.purchaseCategory !== transaction.purchaseCategory
            ) {
                const amountDifference = transaction.purchaseAmount - (previousTransaction.purchaseAmount || 0);
                console.log('Amount or category changed:', { amountDifference });

                // Adjust spentSoFar
                const newSpentSoFar = Math.max(budgetCycle.spentSoFar + amountDifference, 0);
                update.$inc = { spentSoFar: newSpentSoFar - budgetCycle.spentSoFar };
                console.log('Adjusting spentSoFar:', { newSpentSoFar, increment: newSpentSoFar - budgetCycle.spentSoFar });

                // Adjust old category (subtract previous amount)
                if (previousTransaction.purchaseCategory) {
                    update.$inc[`categorySpent.${previousTransaction.purchaseCategory}`] =
                        -(previousTransaction.purchaseAmount || 0);
                    console.log('Subtracting from old category:', {
                        category: previousTransaction.purchaseCategory,
                        amount: -(previousTransaction.purchaseAmount || 0),
                    });
                }

                // Adjust new category (add new amount)
                update.$inc[`categorySpent.${transaction.purchaseCategory}`] = transaction.purchaseAmount;
                console.log('Adding to new category:', {
                    category: transaction.purchaseCategory,
                    amount: transaction.purchaseAmount,
                });
            }

            // Apply BudgetCycle update
            if (Object.keys(update).length > 0) {
                console.log('Updating BudgetCycle for amount/category:', { budgetCycleId: transaction.budgetCycleId, update });
                await BudgetCycle.findOneAndUpdate({ budgetCycleId: transaction.budgetCycleId }, update);
                console.log('BudgetCycle updated successfully for amount/category');
            } else {
                console.log('No BudgetCycle update needed for purchaseAmount or purchaseCategory');
            }
        } else {
            console.log('purchaseAmount and purchaseCategory not updated');
        }

        // Schedule analytics update
        if (Object.keys(updates).length > 0) {
            console.log('Scheduling analytics update:', { userId: transaction.userId, purchaseCategory: transaction.purchaseCategory });
            setImmediate(async () => {
                try {
                    await scheduleAnalyticsUpdateForUser(transaction.userId, transaction.purchaseCategory);
                    console.log('Analytics update scheduled successfully');
                } catch (error) {
                    console.error('Error scheduling analytics update:', {
                        message: error.message,
                        stack: error.stack,
                    });
                }
            });
        } else {
            console.log('No updates, skipping analytics');
        }

        // Process transaction recommendation
        console.log('Scheduling transaction recommendation:', { transactionId });
        setImmediate(async () => {
            try {
                await processTransactionRecommendationAsync(transaction);
                console.log('Transaction recommendation processed successfully');
            } catch (error) {
                console.error('Error processing transaction recommendation:', {
                    message: error.message,
                    stack: error.stack,
                });
            }
        });

        console.log('updateTransaction completed:', { transaction });
        return transaction;
    } catch (error) {
        console.error('updateTransaction error:', {
            message: error.message,
            stack: error.stack,
            transactionId,
            updates,
        });
        throw error;
    }
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
export const getTransactionsForCycleId = async (budgetCycleId) => {

    return Transaction.find({budgetCycleId});
}
export const getTransactions = async (userId) => {
    return Transaction.find({userId});

};