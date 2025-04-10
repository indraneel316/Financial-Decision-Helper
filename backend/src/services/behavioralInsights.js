import { getUserWithAllCycles } from "./UserService.js";

/**
 * Derives historical behavioral insights for a user by calculating key metrics
 * across all their budget cycles and transactions.
 *
 * Overall Metrics:
 *  - cycleCount: Number of completed budget cycles.
 *  - avgSpentPerCycle: Average total spending per cycle.
 *  - savingsAchievementRate: Percentage of cycles where the user met their savings target.
 *  - avgTxnCount: Average number of transactions per cycle.
 *  - avgTxnDay: Average day of the cycle when transactions occur.
 *  - maxTxnAmount: Maximum transaction amount observed.
 *  - minTxnAmount: Minimum transaction amount observed.
 *  - medianTxnAmount: Median transaction amount.
 *
 * Category-Specific Metrics (in categorySummaries):
 *  For each spending category, an object containing:
 *    - totalSpent: Total amount spent in that category.
 *    - txnCount: Total number of transactions in that category.
 *    - percentUsed: Percentage of the allocated budget used (if available).
 *    - commonDescription: The most frequently used transaction description.
 *    - spendingPattern: A derived pattern ("Bulk Purchase", "Frequent Small Purchases", or "Regular Spending").
 *
 * @param {Number} userId - The user's custom numeric ID.
 * @returns {Promise<Object>} An object containing all computed metrics.
 */
export async function deriveBehavioralInsights(userId) {
    // Retrieve aggregated user data (including cycles and their transactions)
    const aggregatedUser = await getUserWithAllCycles(userId);
    const cycles = aggregatedUser.cycles || [];
    const cycleCount = cycles.length;

    let totalSpentAcrossCycles = 0;
    let cyclesMeetingSavings = 0;
    let totalTxnCount = 0;
    let totalTxnDays = 0;
    let allTxnAmounts = [];

    // Container for per-category metrics.
    const categoryMetrics = {};

    cycles.forEach(cycle => {
        // Use pre-aggregated spentSoFar if available; otherwise, calculate from transactions.
        const cycleSpent =
            cycle.spentSoFar ||
            (cycle.transactions ? cycle.transactions.reduce((sum, txn) => sum + (txn.purchaseAmount || 0), 0) : 0);
        totalSpentAcrossCycles += cycleSpent;

        // Check if the cycle meets the savings target.
        if (cycle.totalMoneyAllocation - cycleSpent >= cycle.savingsTarget) {
            cyclesMeetingSavings++;
        }

        const transactions = cycle.transactions || [];
        totalTxnCount += transactions.length;

        transactions.forEach(txn => {
            // Record each transaction amount.
            allTxnAmounts.push(txn.purchaseAmount);

            // Calculate transaction day relative to cycle start if available.
            if (cycle.startDate) {
                const dayOfCycle = Math.floor((new Date(txn.transactionTimestamp) - new Date(cycle.startDate)) / (1000 * 3600 * 24)) + 1;
                totalTxnDays += dayOfCycle;
            }

            // Group metrics by spending category.
            const cat = txn.purchaseCategory;
            if (!categoryMetrics[cat]) {
                // Use allocated amount from this cycle (you might want to average if multiple cycles exist).
                categoryMetrics[cat] = {
                    totalSpent: 0,
                    txnCount: 0,
                    allocated: cycle[`allocated${cat}`] || 0,
                    descriptions: []
                };
            }
            categoryMetrics[cat].totalSpent += txn.purchaseAmount;
            categoryMetrics[cat].txnCount += 1;
            const desc = txn.purchaseDescription ? txn.purchaseDescription.trim() : "None";
            categoryMetrics[cat].descriptions.push(desc);
        });
    });

    // Overall Metrics
    const avgSpentPerCycle = cycleCount > 0 ? (totalSpentAcrossCycles / cycleCount).toFixed(2) : "N/A";
    const savingsAchievementRate =
        cycleCount > 0 ? ((cyclesMeetingSavings / cycleCount) * 100).toFixed(1) + "%" : "N/A";
    const avgTxnCount = cycleCount > 0 ? (totalTxnCount / cycleCount).toFixed(2) : "N/A";
    const avgTxnDay = totalTxnCount > 0 ? (totalTxnDays / totalTxnCount).toFixed(1) : "N/A";
    const maxTxnAmount = allTxnAmounts.length > 0 ? Math.max(...allTxnAmounts) : "N/A";
    const minTxnAmount = allTxnAmounts.length > 0 ? Math.min(...allTxnAmounts) : "N/A";
    let medianTxnAmount = "N/A";
    if (allTxnAmounts.length > 0) {
        allTxnAmounts.sort((a, b) => a - b);
        const mid = Math.floor(allTxnAmounts.length / 2);
        medianTxnAmount =
            allTxnAmounts.length % 2 !== 0 ? allTxnAmounts[mid] : ((allTxnAmounts[mid - 1] + allTxnAmounts[mid]) / 2).toFixed(2);
    }

    // Compute per-category summaries.
    const categorySummaries = {};
    for (const cat in categoryMetrics) {
        const metrics = categoryMetrics[cat];
        const allocated = metrics.allocated;
        const percentUsed = allocated > 0 ? ((metrics.totalSpent / allocated) * 100).toFixed(1) + "%" : "N/A";

        // Compute the most common description.
        const freq = {};
        metrics.descriptions.forEach(desc => {
            freq[desc] = (freq[desc] || 0) + 1;
        });
        const commonDescription = Object.keys(freq).reduce((a, b) => (freq[a] >= freq[b] ? a : b), "None");

        // Derive spending pattern.
        const avgTxnAmount = metrics.txnCount > 0 ? (metrics.totalSpent / metrics.txnCount) : 0;
        let spendingPattern = "Regular Spending";
        if (allocated > 0) {
            if (avgTxnAmount > allocated * 0.5) {
                spendingPattern = "Bulk Purchase";
            } else if (metrics.txnCount > 2) {
                spendingPattern = "Frequent Small Purchases";
            }
        }

        categorySummaries[cat] = {
            totalSpent: metrics.totalSpent,
            txnCount: metrics.txnCount,
            percentUsed,
            commonDescription,
            spendingPattern
        };
    }

    return {
        cycleCount,
        avgSpentPerCycle,
        savingsAchievementRate,
        avgTxnCount,
        avgTxnDay,
        maxTxnAmount,
        minTxnAmount,
        medianTxnAmount,
        categorySummaries
    };
}
