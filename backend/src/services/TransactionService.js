import Transaction from '../models/Transaction.js';
import BudgetCycle from '../models/BudgetCycle.js';
import { processTransactionRecommendationAsync } from './transactionRecommendation.js';
import { scheduleAnalyticsUpdateForUser } from './scheduleAnalyticsUpdate.js';

/**
 * Create a new transaction and trigger recommendation processing and analytics update asynchronously.
 *
 * @param {Object} transactionData - Data for the new transaction.
 * @param {Object} io - Socket.IO instance.
 * @returns {Promise<Object>} The saved transaction document.
 */
export const createTransaction = async (transactionData, io) => {
    console.log('createTransaction started:', { transactionData });

    try {
        const transaction = new Transaction(transactionData);
        await transaction.save();
        console.log('Transaction saved:', { transactionId: transaction.transactionId });

        // Trigger recommendation logic asynchronously
        setImmediate(async () => {
            try {
                console.log('Processing recommendation for:', { transactionId: transaction.transactionId });
                await processTransactionRecommendationAsync(transaction);
                console.log('Recommendation processed:', { transactionId: transaction.transactionId });
                if (io && transaction.recommendation) {
                    console.log('Emitting recommendation via Socket.IO:', { transactionId: transaction.transactionId });
                    io.to(`recommendation:${transaction.transactionId}`).emit('recommendation', {
                        transactionId: transaction.transactionId,
                        recommendationText: transaction.recommendation,
                        reasoning: transaction.reasoning,
                    });
                } else {
                    console.warn('No recommendation or io missing:', { transactionId: transaction.transactionId });
                }
            } catch (error) {
                console.error('Error processing recommendation:', {
                    message: error.message,
                    stack: error.stack,
                });
            }
        });

        // Schedule analytics update
        console.log('Scheduling analytics update:', { userId: transaction.userId, purchaseCategory: transaction.purchaseCategory });
        scheduleAnalyticsUpdateForUser(transaction.userId, transaction.purchaseCategory);

        return transaction;
    } catch (error) {
        console.error('createTransaction error:', {
            message: error.message,
            stack: error.stack,
            transactionData,
        });
        throw error;
    }
};

/**
 * Update an existing transaction and trigger recommendation processing and analytics update asynchronously.
 *
 * @param {String} transactionId - The transaction ID.
 * @param {Object} updates - The fields to update.
 * @param {Object} io - Socket.IO instance.
 * @returns {Promise<Object>} The updated transaction document.
 */
export const updateTransaction = async (transactionId, updates, io) => {
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

            // Fetch BudgetCycle
            const budgetCycle = await BudgetCycle.findOne({ budgetCycleId: transaction.budgetCycleId });
            if (!budgetCycle) {
                console.error('Budget Cycle not found:', { budgetCycleId: transaction.budgetCycleId });
                throw new Error('Budget Cycle not found');
            }

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
                console.log('Processing recommendation for:', { transactionId });
                await processTransactionRecommendationAsync(transaction);
                console.log('Recommendation processed:', { transactionId });
                console.log("TRANSACTION TRACK REASONING ", transaction.reasoning)
                if (io && transaction.recommendation && transaction.reasoning) {
                    console.log('Emitting recommendation via Socket.IO:', { transactionId: transaction.transactionId });
                    io.to(`recommendation:${transaction.transactionId}`).emit('recommendation', {
                        transactionId: transaction.transactionId,
                        recommendationText: transaction.recommendation,
                        reasoning: transaction.reasoning,
                    });
                } else {
                    console.warn('No recommendation or io missing:', { transactionId: transaction.transactionId });
                }
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

/**
 * Delete an existing transaction and update BudgetCycle.
 *
 * @param {String} transactionId - The transaction ID.
 * @returns {Promise<Object>} The deleted transaction document.
 */
export const deleteTransaction = async (transactionId) => {
    console.log('deleteTransaction started:', { transactionId });

    try {
        // Fetch the transaction to be deleted
        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction) {
            console.error('Transaction not found:', { transactionId });
            throw new Error('Transaction not found');
        }
        console.log('Transaction fetched:', { transaction });

        const { purchaseAmount, purchaseCategory, budgetCycleId, userId } = transaction;

        // Fetch the corresponding BudgetCycle
        console.log('Fetching BudgetCycle:', { budgetCycleId });
        const budgetCycle = await BudgetCycle.findOne({ budgetCycleId });
        if (!budgetCycle) {
            console.error('Budget Cycle not found:', { budgetCycleId });
            throw new Error('Budget Cycle not found');
        }
        console.log('BudgetCycle fetched:', { budgetCycle });

        // Prepare the update for the BudgetCycle
        const update = {};

        // Subtract the purchaseAmount from spentSoFar and categorySpent
        update.$inc = {
            spentSoFar: -Math.min(purchaseAmount, budgetCycle.spentSoFar),
            [`categorySpent.${purchaseCategory}`]: -Math.min(purchaseAmount, (budgetCycle.categorySpent[purchaseCategory] || 0)),
        };
        console.log('Preparing BudgetCycle update:', { update });

        // Update the BudgetCycle
        console.log('Updating BudgetCycle:', { budgetCycleId, update });
        await BudgetCycle.findOneAndUpdate({ budgetCycleId }, update);
        console.log('BudgetCycle updated successfully');

        // Delete the transaction
        console.log('Deleting transaction:', { transactionId });
        await Transaction.deleteOne({ transactionId });
        console.log('Transaction deleted');

        // Schedule analytics update
        console.log('Scheduling analytics update:', { userId, purchaseCategory });
        setImmediate(async () => {
            try {
                await scheduleAnalyticsUpdateForUser(userId, purchaseCategory);
                console.log('Analytics update scheduled successfully');
            } catch (error) {
                console.error('Error scheduling analytics update:', {
                    message: error.message,
                    stack: error.stack,
                });
            }
        });

        return transaction;
    } catch (error) {
        console.error('deleteTransaction error:', {
            message: error.message,
            stack: error.stack,
            transactionId,
        });
        throw new Error(`Error deleting transaction: ${error.message}`);
    }
};

/**
 * Get paginated transactions for a budget cycle.
 *
 * @param {String} budgetCycleId - The budget cycle ID.
 * @param {Number} page - The page number (1-based).
 * @param {Number} limit - The number of transactions per page.
 * @returns {Promise<Object>} Object containing transactions and pagination metadata.
 */
export const getTransactionsForCycleId = async (budgetCycleId, page = 1, limit = 10) => {
    console.log('getTransactionsForCycleId started:', { budgetCycleId, page, limit });

    try {
        const skip = (page - 1) * limit;
        const transactions = await Transaction.find({ budgetCycleId })
            .skip(skip)
            .limit(limit)
            .sort({ transactionTimestamp: -1 }); // Sort by newest first
        const totalTransactions = await Transaction.countDocuments({ budgetCycleId });

        console.log('Transactions fetched:', { count: transactions.length, page, limit, totalTransactions });

        return {
            transactions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalTransactions / limit),
                totalTransactions,
                limit,
            },
        };
    } catch (error) {
        console.error('getTransactionsForCycleId error:', {
            message: error.message,
            stack: error.stack,
            budgetCycleId,
            page,
            limit,
        });
        throw error;
    }
};

/**
 * Get transactions for a user.
 *
 * @param {String} userId - The user ID.
 * @returns {Promise<Array>} Array of transaction documents.
 */
export const getTransactions = async (userId) => {
    console.log('getTransactions started:', { userId });

    try {
        const transactions = await Transaction.find({ userId });
        console.log('Transactions fetched:', { count: transactions.length });
        return transactions;
    } catch (error) {
        console.error('getTransactions error:', {
            message: error.message,
            stack: error.stack,
            userId,
        });
        throw error;
    }
};