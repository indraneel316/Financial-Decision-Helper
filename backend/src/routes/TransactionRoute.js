import express from 'express';
import {
    createTransactionHandler,
    deleteTransactionHandler, getTransactionsForBudgetCycleId,
    getTransactionsHandler,
    updateTransactionHandler
} from '../controllers/transactionController.js';

const router = express.Router();

router.post('/', createTransactionHandler);
router.delete('/:transactionId', deleteTransactionHandler);
router.put('/:transactionId', updateTransactionHandler);

router.get('/:userId', getTransactionsHandler);
router.get('/budget-cycle/:budgetCycleId', getTransactionsForBudgetCycleId);


export default router;