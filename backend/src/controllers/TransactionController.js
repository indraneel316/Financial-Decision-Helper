import {
    createTransaction,
    deleteTransaction,
    getTransactions, getTransactionsForCycleId,
    updateTransaction
} from '../services/transactionService.js';

export const createTransactionHandler = async (req, res) => {
    try {

        const transaction = await createTransaction(req.body);

        console.log("TRACK DATA 23 ", transaction);
        res.status(201).json({ transaction });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateTransactionHandler = async (req, res) => {
    try {
        const { transactionId } = req.params;

        console.log("TRACK DATA 4 ", transactionId)
        const updates = req.body;

        console.log("TRACK DATA 5 ", updates)
        const updatedTransaction = await updateTransaction(transactionId, updates);
        console.log("TRACK DATA 6", updatedTransaction)

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
        console.log("TRACK DATA 45 ", budgetCycleId)
        const transactions = await getTransactionsForCycleId(budgetCycleId);
        console.log(transactions)
        res.status(200).json(transactions);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};