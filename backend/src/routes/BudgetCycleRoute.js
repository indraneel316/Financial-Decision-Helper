import express from 'express';
import {
    createBudgetHandler,
    updateBudgetHandler,
    deleteBudgetHandler,
    getBudgetHandler,
} from '../controllers/budgetController.js';

const router = express.Router();

router.post('/', createBudgetHandler);
router.put('/:budgetCycleId', updateBudgetHandler);
router.delete('/:budgetCycleId', deleteBudgetHandler);
router.get('/:budgetCycleId', getBudgetHandler);

export default router;