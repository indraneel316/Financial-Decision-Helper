import express from 'express';
import {
    createTransactionHandler,
    deleteTransactionHandler,
    getTransactionsHandler,
    getTransactionsForBudgetCycleId,
    updateTransactionHandler,
} from '../controllers/transactionController.js';

const router = express.Router();

// Factory function to inject io
const withIo = (handler, io) => (req, res) => handler(req, res, io);

// Routes
export default (io) => {
    router.post('/', withIo(createTransactionHandler, io));
    router.put('/:transactionId', withIo(updateTransactionHandler, io));
    router.delete('/:transactionId', deleteTransactionHandler);
    router.get('/:userId', getTransactionsHandler);
    router.get('/budget-cycle/:budgetCycleId', getTransactionsForBudgetCycleId);
    return router;
};