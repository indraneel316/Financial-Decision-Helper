import {
    createTransaction,
    deleteTransaction,
    getTransactions,
    getTransactionsForCycleId,
    updateTransaction,
} from '../services/transactionService.js';

// Pass io to createTransaction and updateTransaction
export const createTransactionHandler = async (req, res, io) => {
    try {
        const transaction = await createTransaction(req.body, io);
        console.log("TRACK DATA 23 ", transaction);
        res.status(201).json({ transaction });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateTransactionHandler = async (req, res, io) => {
    try {
        const { transactionId } = req.params;
        console.log("TRACK DATA 4 ", transactionId);
        const updates = req.body;
        console.log("TRACK DATA 5 ", updates);
        const updatedTransaction = await updateTransaction(transactionId, updates, io);
        console.log("TRACK DATA 6", updatedTransaction);
        res.status(200).json({
            message: 'Transaction updated successfully',
            transaction: updatedTransaction,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteTransactionHandler = async (req, res) => {
    try {
        const { transactionId } = req.params;
        await deleteTransaction(transactionId);
        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getTransactionsHandler = async (req, res) => {
    try {
        const { userId } = req.params;
        const transactions = await getTransactions(userId);
        res.status(200).json(transactions);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getTransactionsForBudgetCycleId = async (req, res) => {
    try {
        const { budgetCycleId } = req.params;
        const { page = 1, limit = 10 } = req.query; // Default to page 1, 10 items per page
        console.log("TRACK DATA 45 ", budgetCycleId, { page, limit });
        const result = await getTransactionsForCycleId(budgetCycleId, parseInt(page), parseInt(limit));
        console.log("Transactions fetched:", result);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};