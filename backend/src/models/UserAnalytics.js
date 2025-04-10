// models/UserAnalytics.js
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

// Define a sub-schema for per-category summaries.
const CategorySummarySchema = new Schema(
    {
        category: { type: String, required: true },
        totalSpent: { type: Number, default: 0 },
        txnCount: { type: Number, default: 0 },
        percentUsed: { type: String, default: "N/A" },
        commonDescription: { type: String, default: "None" },
        spendingPattern: { type: String, default: "No historical data" }
    },
    { _id: false }
);

const UserAnalyticsSchema = new Schema(
    {
        userId: { type: Number, required: true },
        // Overall user metrics across budget cycles.
        cycleCount: { type: Number, default: 0 },
        avgSpentPerCycle: { type: String, default: "N/A" },
        savingsAchievementRate: { type: String, default: "N/A" },
        avgTxnCount: { type: String, default: "N/A" },
        avgTxnDay: { type: String, default: "N/A" },
        maxTxnAmount: { type: String, default: "N/A" },
        minTxnAmount: { type: String, default: "N/A" },
        medianTxnAmount: { type: String, default: "N/A" },
        // Array for per-category analytics.
        categories: { type: [CategorySummarySchema], default: [] },
        // A narrative summary from an ML model.
        mlSummary: { type: String, default: "" },
        lastUpdated: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

export default model("UserAnalytics", UserAnalyticsSchema);
