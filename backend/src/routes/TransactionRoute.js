import express from 'express';
import {
    createTransactionHandler,
    deleteTransactionHandler,
    getTransactionsHandler,
    updateTransactionHandler
} from '../controllers/transactionController.js';

const router = express.Router();

router.post('/', createTransactionHandler);
router.delete('/:transactionId', deleteTransactionHandler);
router.put('/:transactionId', updateTransactionHandler);

router.get('/:userId', getTransactionsHandler);

export default router;