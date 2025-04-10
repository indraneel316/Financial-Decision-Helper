import {
    createTransaction,
    deleteTransaction,
    getTransactions,
    updateTransaction
} from '../services/transactionService.js';

export const createTransactionHandler = async (req, res) => {
    try {

        const transaction = await createTransaction(req.body);
        res.status(201).json({ message: 'Transaction logged', transaction });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateTransactionHandler = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const updates = req.body;
        const updatedTransaction = await updateTransaction(transactionId, updates);
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