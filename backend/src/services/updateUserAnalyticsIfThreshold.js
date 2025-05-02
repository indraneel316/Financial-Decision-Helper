import { deriveBehavioralInsights } from "./behavioralInsights.js";
import UserAnalytics from "../models/UserAnalytics.js";
import User from "../models/User.js";
import { callOpenRouterLLM } from "./llmOpenRouterService.js";

export async function updateUserAnalyticsIfThresholdMet(userId) {
    if (!userId) {
        throw new Error('userId is required');
    }

    try {
        console.log(`Starting analytics update for user ${userId}`);

        // Fetch user details
        const userDetails = await User.findOne({ userId }, {
            incomeLevel: 1,
            age: 1,
            occupation: 1,
            maritalStatus: 1,
            familySize: 1,
            currency: 1,
            psychologicalNotes: 1
        }).lean();

        if (!userDetails) {
            console.warn(`No user details found for user ${userId}. Proceeding with defaults.`);
        }

        const insights = await deriveBehavioralInsights(userId);
        if (insights.cycleCount === 0 || Object.keys(insights.categorySummaries).length === 0) {
            console.warn(`No transactions found for user ${userId} after recommendations.`);
            insights.userDetails = userDetails || {
                incomeLevel: 'N/A',
                age: 'N/A',
                occupation: 'N/A',
                maritalStatus: 'N/A',
                familySize: 'N/A',
                currency: userDetails?.currency || 'N/A', // Use userDetails.currency
                psychologicalNotes: 'N/A'
            };
        } else {
            insights.userDetails = userDetails || {
                incomeLevel: 'N/A',
                age: 'N/A',
                occupation: 'N/A',
                maritalStatus: 'N/A',
                familySize: 'N/A',
                currency: userDetails?.currency || 'N/A', // Use userDetails.currency
                psychologicalNotes: 'N/A'
            };
        }

        // Log for spentSoFar debugging
        console.log(`Insights for user ${userId}:`, {
            spentSoFar: insights.spentSoFar,
            categorySpent: insights.categorySpent,
            transactionCount: Object.values(insights.categorySummaries).reduce((sum, s) => sum + s.transactionCount, 0)
        });

        const categorySummaries = {};
        for (const [cat, summary] of Object.entries(insights.categorySummaries)) {
            categorySummaries[cat] = {
                totalSpentOriginal: summary.totalSpentOriginal,
                totalSpentBase: summary.totalSpentBase,
                currencies: summary.currencies,
                rateSource: summary.rateSource,
                transactionCount: summary.transactionCount,
                percentUsed: summary.percentUsed,
                commonDescription: summary.commonDescription,
                descriptionCount: summary.descriptionCount,
                descriptionPercentage: summary.descriptionPercentage,
                spendingPattern: summary.spendingPattern,
                largeTransactionThreshold: summary.largeTransactionThreshold,
                categorySpent: summary.categorySpent,
                allocation: summary.allocation
            };
        }

        const prompt = `
You are an assistant for a financial budgeting app. Analyze the following user spending analytics to generate personalized insights, considering user demographics and all cases, including new users with no transactions and edge cases like inappropriate category assignments or excessive spending (e.g., gaming microtransactions in Entertainment). Do NOT suggest using a budgeting app, as the user is already using one. Focus on in-app actions (e.g., adjusting category budgets, reclassifying transactions, setting savings goals) and behavioral changes (e.g., reducing non-essential spending like gaming or chocolates).

User Details:
- Monthly Income: ${insights.userDetails.incomeLevel} ${insights.userDetails.currency}
- Age: ${insights.userDetails.age}
- Occupation: ${insights.userDetails.occupation}
- Marital Status: ${insights.userDetails.maritalStatus}
- Family Size: ${insights.userDetails.familySize}
- Preferred Currency: ${insights.userDetails.currency}
- Psychological Notes: ${insights.userDetails.psychologicalNotes || 'None'}

User Analytics:
- Total Money Allocation: ${insights.totalMoneyAllocation} ${insights.userCurrency}
- Spent So Far: ${insights.spentSoFar} ${insights.userCurrency}
- Savings Target: ${insights.savingsTarget} ${insights.userCurrency}
- Category Budgets: ${JSON.stringify(insights.allocationByCategory)}
- Category Spent: ${JSON.stringify(insights.categorySpent)}
- Average Spending per Cycle: ${insights.avgSpentPerCycle} ${insights.userCurrency}
- Savings Achievement Rate: ${insights.savingsAchievementRate}
- Total Savings: ${insights.totalSavingsBase} ${insights.userCurrency}
- Savings Progress: ${insights.savingsProgress} (Positive/Neutral/Negative)
- Spending Trend: ${insights.spendingTrend}
- Savings Trend: ${insights.savingsTrend}
- Predicted Spending Next Cycle: ${insights.predictedSpendingNextCycle} ${insights.userCurrency}
- Predicted Savings Probability: ${insights.predictedSavingsProbability}
- Transaction Count: ${Object.values(insights.categorySummaries).reduce((sum, s) => sum + s.transactionCount, 0)}
- Average Transaction Day: ${insights.avgTxnDay}
- Categories: ${Object.keys(insights.categorySummaries).join(', ') || 'None'}
- Category Breakdown:
${Object.entries(insights.categorySummaries).length > 0 ?
            Object.entries(insights.categorySummaries).map(([cat, summary]) =>
                `  - ${cat}: Spent ${summary.totalSpentBase} ${insights.userCurrency}, Budget ${summary.allocation} ${insights.userCurrency}, ${summary.transactionCount} transactions, ${summary.commonDescription || 'N/A'} (${summary.descriptionPercentage}%, ${summary.descriptionCount} occurrences), Pattern: ${summary.spendingPattern}`
            ).join('\n') : '  - No transaction data available'}
- Warnings: ${insights.warnings.join('; ') || 'None'}

Objective: Generate personalized financial insights for a budgeting app user, analyzing spending analytics and demographics, focusing on 10 categories: Entertainment, Groceries, Utilities, Commute, Shopping, DiningOut, Medical Expenses, Accommodation, Vacation, Other Expenses.

Instructions:

Summarize Data: Condense each field's data (e.g., spending, savings, categories) and interpret its significance.
New Users (No Transactions/Cycles): Suggest realistic category budgets and savings goals based on demographics (e.g., higher savings for high earners, family-focused budgets for larger households, modest budgets for young users).
Users with Transactions:
Analyze spending patterns, savings performance, and category assignments, considering demographics (e.g., young singles favor discretionary spending, families prioritize shared expenses).
Identify recurring habits via high descriptionPercentage or descriptionCount, distinguishing essential (e.g., groceries) vs. non-essential (e.g., chocolates in Groceries, microtransactions in Entertainment) spending.
Detect mismatches between transaction descriptions and categories (e.g., "chocolate stash" in Groceries, "in-game purchase" in Entertainment). Suggest reclassification to a suitable category (e.g., Other Expenses for non-essential items) or reducing excessive spending (e.g., gaming microtransactions).
Examples of mismatches:
"chocolate stash" in Groceries (high frequency): Reclassify to Other Expenses, reduce purchases.
"vape again" in Groceries: Move to Other Expenses, cut back on vaping.
"in-game purchase" in Entertainment (high count): Consider a Gaming sub-category, limit microtransactions.
For unmatched recurring descriptions, recommend reclassification to Other Expenses or reduction if non-essential, factoring in income, age, and family size.
Psychological Notes: Use cautiously to adjust tone (e.g., simpler advice for stress-prone users), avoiding over-interpretation.
Warnings: Address issues like overspending or category inconsistencies.
Edge Cases: Ensure robustness for new users, zero transactions, or excessive spending (e.g., microtransactions).
Output:

Format: Pointer-based summary (100-150 words) tailored to demographics.
Content:
Key spending patterns (e.g., overspending, mismatches, recurring habits).
Savings performance vs. target, aligned with income and life stage.
Critical warnings or edge cases (e.g., gaming microtransactions).
One actionable in-app recommendation (e.g., "Reclassify 'chocolate stash' to Other Expenses") or behavioral change (e.g., "Reduce microtransactions"), suited to user details.
Tone: Clear, encouraging, focused on in-app actions (e.g., reclassify transactions, adjust budgets) or practical changes.
Constraints: Avoid suggesting app adoption (user is already using it). Only use specified categories.
        `;

        let mlSummary = 'No summary available';
        try {
            const llmResponse = await callOpenRouterLLM(prompt);
            console.log(`Raw LLM response:`, llmResponse);

            if (typeof llmResponse === 'string' && llmResponse.trim()) {
                mlSummary = llmResponse;
            } else {
                console.error(`Invalid LLM response:`, llmResponse);
                mlSummary = 'No summary available';
            }
            console.log(`General ML summary: ${mlSummary}`);
        } catch (error) {
            console.error(`Error generating general ML summary:`, error.message);
            mlSummary = 'No summary available';
        }

        const update = {
            userId,
            cycleCount: insights.cycleCount,
            baseCurrency: insights.userCurrency,
            spentSoFar: insights.spentSoFar,
            categorySpent: insights.categorySpent,
            totalMoneyAllocation: insights.totalMoneyAllocation,
            savingsTarget: insights.savingsTarget,
            allocationByCategory: insights.allocationByCategory,
            avgSpentPerCycle: insights.avgSpentPerCycle,
            savingsAchievementRate: insights.savingsAchievementRate,
            totalSavingsBase: insights.totalSavingsBase,
            avgSavingsPerCycle: insights.avgSavingsPerCycle,
            savingsProgress: insights.savingsProgress,
            spendingTrend: insights.spendingTrend,
            savingsTrend: insights.savingsTrend,
            predictedSpendingNextCycle: insights.predictedSpendingNextCycle,
            predictedSavingsProbability: insights.predictedSavingsProbability,
            avgTxnCount: insights.avgTxnCount,
            avgTxnDay: insights.avgTxnDay,
            maxTxnAmount: insights.maxTxnAmount,
            minTxnAmount: insights.minTxnAmount,
            medianTxnAmount: insights.medianTxnAmount,
            categorySummaries,
            warnings: insights.warnings,
            mlSummary,
            lastUpdated: new Date()
        };

        console.log(`Updating UserAnalytics with:`, JSON.stringify(update, null, 2));
        const analyticsDoc = await UserAnalytics.findOneAndUpdate(
            { userId },
            { $set: update },
            { upsert: true, new: true }
        );

        console.log(`UserAnalytics updated for user ${userId} with ${Object.keys(categorySummaries).length} categories.`);
        return analyticsDoc;
    } catch (error) {
        console.error(`Failed to update UserAnalytics for user ${userId}:`, error.message);
        throw error;
    }
}