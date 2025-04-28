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

Instructions:
- Summarize the data and numbers for each field and what does it indicate
- For new users (no transactions or cycles), use demographics to suggest realistic category budgets and savings goals (e.g., higher savings for high earners, modest budgets for young users, family-oriented expenses for larger families).
- For users with transactions, analyze spending patterns, savings performance, and category assignments, factoring in demographics (e.g., young singles may prioritize discretionary spending, larger families may focus on shared expenses). Identify recurring habits (high descriptionPercentage or descriptionCount) and distinguish essential vs. non-essential spending within categories (e.g., groceries vs. chocolates in Groceries, movies vs. microtransactions in Entertainment).
- If a transaction description suggests a category mismatch or excessive spending, highlight it and suggest reclassification or behavioral change. Examples:
  - "chocolate stash" in Groceries (80% of transactions): Suggest reclassifying to Discretionary and reducing chocolate purchases.
  - "vape again" in Groceries: Recommend moving to Discretionary and cutting back on vaping.
  - "in-game purchase" in Entertainment (high frequency): Propose a separate Gaming category and limiting microtransactions.
- For any recurring description without a matching example, suggest reclassification to a relevant category (e.g., Discretionary, Subscriptions) or reducing spending if it appears non-essential or excessive, considering income, age, and family size.
- Use psychologicalNotes cautiously to inform tone or priorities (e.g., stress-prone users may need simpler recommendations), but do not over-interpret vague notes.
- Address warnings (e.g., overspending, data inconsistencies).
- Ensure analytics are robust for all edge cases.

Generate a concise narrative summary (100-150 words) describing the user's financial behavior, tailored to their demographics. Include:
- Key spending or budgeting patterns (e.g., overspending, category mismatches, recurring habits).
- Savings performance relative to the target, considering income and life stage.
- Any critical warnings or edge cases (e.g., gaming microtransactions).
- One specific, actionable recommendation using app features (e.g., "Reclassify gaming transactions to Discretionary," "Reduce chocolate spending") or behavioral advice (e.g., "Cut back on microtransactions"), aligned with user details.

Ensure the tone is clear, encouraging, and focused on in-app actions or practical changes.
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