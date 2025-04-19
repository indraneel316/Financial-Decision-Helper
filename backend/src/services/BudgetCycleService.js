import Budget from '../models/BudgetCycle.js';
import Transaction from "../models/Transaction.js";

export const createBudget = async (budgetData) => {

    // const budgetCycleId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    //
    // const budgetInputData = {
    //     ...budgetData,
    //     budgetCycleIdd
    // };
    const budget = new Budget(budgetData);
    await budget.save();
    return budget;
};

export const updateBudget = async (budgetCycleId, updates) => {
    return Budget.findOneAndUpdate({budgetCycleId}, updates, {
        new: true,
        upsert: false
    });
};

export const deleteBudget = async (budgetCycleId) => {
    return Budget.findOneAndDelete({budgetCycleId});
};

export const getBudget = async (budgetCycleId) => {
    return Budget.findOne({budgetCycleId});
};