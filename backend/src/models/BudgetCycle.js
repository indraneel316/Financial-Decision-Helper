// models/BudgetCycle.js
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const BudgetCycleSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    budgetCycleId: {
        type: String,
        required: true,
        unique: true
    },
    cycleName: {
        type: String
    },
    budgetCycleDuration: {
        type: String,
        required: true
    },
    startDate: { type: Date },
    endDate: { type: Date },
    totalMoneyAllocation: {
        type: Number,
        required: true
    },
    savingsTarget: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    allocatedEntertainment: { type: Number, default: 0 },
    allocatedGroceries:     { type: Number, default: 0 },
    allocatedUtilities:     { type: Number, default: 0 },
    allocatedCommute:       { type: Number, default: 0 },
    allocatedShopping:      { type: Number, default: 0 },
    allocatedDiningOut:     { type: Number, default: 0 },
    allocatedMedicalExpenses: { type: Number, default: 0 },
    allocatedAccommodation: { type: Number, default: 0 },
    allocatedVacation:      { type: Number, default: 0 },
    allocatedOtherExpenses: { type: Number, default: 0 },
    spentSoFar: { type: Number, default: 0 },
    categorySpent: { type: Map, of: Number, default: {} },
    status: { type: String, enum: ['active', 'completed'], default: 'active' }
}, { timestamps: true });

BudgetCycleSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: 'userId',
    justOne: true
});

export default model('BudgetCycle', BudgetCycleSchema);
