import mongoose from 'mongoose';
const { Schema, model } = mongoose;

// Define a sub-schema for per-category summaries
const CategorySummarySchema = new Schema(
    {
            totalSpentOriginal: { type: String, default: '0.00' }, // Spending in original currency
            totalSpentBase: { type: String, default: '0.00' }, // Spending in base currency
            currencies: { type: String, default: '' }, // Comma-separated list of currencies
            rateSource: { type: String, default: '' }, // Comma-separated list of rate sources
            transactionCount: { type: Number, default: 0 }, // Number of transactions
            percentUsed: { type: String, default: 'N/A' }, // Percentage of allocated budget used
            commonDescription: { type: String, default: 'None' }, // Most frequent purchase description
            descriptionCount: { type: Number, default: 0 }, // Count of common description
            descriptionPercentage: { type: Number, default: 0 }, // Percentage of transactions with common description
            spendingPattern: { type: String, default: 'No historical data' }, // Spending pattern (e.g., Minimal Spending)
            largeTransactionThreshold: { type: String, default: '0.00' }, // Threshold for large transactions
            categorySpent: { type: String, default: '0.00' }, // Total spent in category (from BudgetCycle)
            allocation: { type: String, default: '0.00' } // Budget allocated to category
    },
    { _id: false }
);

const UserAnalyticsSchema = new Schema(
    {
            userId: { type: String, required: true }, // Changed to String to match userId format
            cycleCount: { type: Number, default: 0 },
            baseCurrency: { type: String, default: 'USD' },
            spentSoFar: { type: String, default: '0.00' }, // Total spending across cycles
            categorySpent: { type: Map, of: String, default: {} }, // Per-category spending
            totalMoneyAllocation: { type: String, default: '0.00' }, // Total budget
            savingsTarget: { type: String, default: '0.00' }, // Total savings goal
            // allocationByCategory: { type: Map, of: String, default: {} }, // Per-category budget allocation
            avgSpentPerCycle: { type: String, default: '0.00' }, // Average spending per cycle
            savingsAchievementRate: { type: String, default: 'N/A' }, // Percentage of budget spent
            totalSavingsBase: { type: String, default: '0.00' }, // Total savings in base currency
            avgSavingsPerCycle: { type: String, default: '0.00' }, // Average savings per cycle
            savingsProgress: { type: String, default: 'Neutral' }, // Savings performance (Positive/Neutral/Negative)
            spendingTrend: { type: String, default: 'Stable' }, // Spending direction
            savingsTrend: { type: String, default: 'Stable' }, // Savings direction
            predictedSpendingNextCycle: { type: String, default: '0.00' }, // Forecasted spending
            predictedSavingsProbability: { type: String, default: 'N/A' }, // Likelihood of meeting savings
            avgTxnCount: { type: String, default: '0.00' }, // Average transactions per cycle
            avgTxnDay: { type: String, default: 'N/A' }, // Average transaction day
            maxTxnAmount: { type: String, default: '0.00' }, // Largest transaction
            minTxnAmount: { type: String, default: '0.00' }, // Smallest transaction
            medianTxnAmount: { type: String, default: '0.00' }, // Median transaction
            categorySummaries: { type: Map, of: CategorySummarySchema, default: {} }, // Map of category to summary
            warnings: { type: [String], default: [] }, // Financial alerts
            mlSummary: { type: String, default: 'No summary available' }, // Narrative summary
            lastUpdated: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

// Ensure unique index on userId
UserAnalyticsSchema.index({ userId: 1 }, { unique: true });

export default mongoose.models.UserAnalytics || model('UserAnalytics', UserAnalyticsSchema);