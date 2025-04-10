import {
    createBudget,
    updateBudget,
    deleteBudget,
    getBudget,
} from '../services/BudgetCycleService.js';

export const createBudgetHandler = async (req, res) => {
    try {
        console.log("TRACK DATA 22 ", req.body);
        const budget = await createBudget(req.body);
        res.status(201).json({ message: 'Budget created successfully', budget });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateBudgetHandler = async (req, res) => {
    try {
        const { budgetCycleId } = req.params;
        const budget = await updateBudget(budgetCycleId, req.body);
        res.status(200).json({ message: 'Budget updated successfully', budget });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteBudgetHandler = async (req, res) => {
    try {
        const { budgetCycleId } = req.params;
        await deleteBudget(budgetCycleId);
        res.status(200).json({ message: 'Budget deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getBudgetHandler = async (req, res) => {
    try {
        const { budgetCycleId } = req.params;
        const budget = await getBudget(budgetCycleId);
        res.status(200).json(budget);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};