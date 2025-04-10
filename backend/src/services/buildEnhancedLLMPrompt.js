import BudgetCycle from '../models/BudgetCycle.js';
import Transaction from '../models/transaction.js';
import User from '../models/User.js';

/**
 * Build an enhanced LLM prompt that combines:
 * - Current cycle metrics (including day-of-cycle and spentSoFar).
 * - Category-specific spending details.
 * - Historical behavioral insights from UserAnalytics.
 * - User profile information.
 *
 * If the mlSummary field in historical insights is non-empty, only that summary is used;
 * otherwise, all individual historical attributes are included.
 *
 * @param {String} currentCycleId - The current budget cycle's custom ID.
 * @param {Number} userId - The user's custom numeric ID.
 * @param {Object} newTxn - New transaction details:
 *                          { purchaseDescription, purchaseCategory, purchaseAmount, transactionTimestamp }.
 * @returns {Promise<String>} The final prompt string.
 */
export async function buildEnhancedLLMPrompt(currentCycleId, userId, newTxn) {
    // Retrieve current cycle data.
    const currentCycle = await BudgetCycle.findOne({ budgetCycleId: currentCycleId, userId });
    if (!currentCycle) throw new Error(`Budget cycle ${currentCycleId} not found for user ${userId}`);

    // Retrieve user profile data.
    const userProfile = await User.findOne({ userId });
    const age = userProfile && userProfile.age != null ? userProfile.age : "N/A";
    const incomeLevel = userProfile ? userProfile.incomeLevel : "N/A";
    const occupationLevel = userProfile ? userProfile.occupationLevel : "N/A";
    const maritalStatus = userProfile ? userProfile.maritalStatus : "N/A";
    const familySize = userProfile ? userProfile.familySize : "N/A";
    const timeZone = userProfile ? userProfile.timeZone : "N/A";
    const currency = userProfile ? userProfile.currency : "N/A";
    const psychologicalNotes = userProfile ? userProfile.psychologicalNotes || "None" : "N/A";

    // Calculate day-of-cycle.
    let dayOfCycle = "N/A";
    if (currentCycle.startDate) {
        const txnDate = new Date(newTxn.transactionTimestamp || Date.now());
        dayOfCycle = Math.floor((txnDate - new Date(currentCycle.startDate)) / (1000 * 3600 * 24)) + 1;
    }

    // Retrieve all transactions in the current cycle.
    const currentTxns = await Transaction.find({ budgetCycleId: currentCycleId });
    const currentTotalSpent = currentTxns.reduce((sum, txn) => sum + (txn.purchaseAmount || 0), 0);
    const newTotalSpent = currentTotalSpent + newTxn.purchaseAmount;
    const newRemainingBudget = currentCycle.totalMoneyAllocation - newTotalSpent;
    const savingsTargetMet = newRemainingBudget >= currentCycle.savingsTarget;

    // Category-specific metrics.
    const categoryTxns = currentTxns.filter(txn => txn.purchaseCategory === newTxn.purchaseCategory);
    const currentCategorySpent = categoryTxns.reduce((sum, txn) => sum + (txn.purchaseAmount || 0), 0);
    const newCategorySpent = currentCategorySpent + newTxn.purchaseAmount;

    const allocatedMapping = {
        "Entertainment": currentCycle.allocatedEntertainment,
        "Groceries": currentCycle.allocatedGroceries,
        "Utilities": currentCycle.allocatedUtilities,
        "Commute": currentCycle.allocatedCommute,
        "Shopping": currentCycle.allocatedShopping,
        "Dining Out": currentCycle.allocatedDiningOut,
        "Medical Expense": currentCycle.allocatedMedicalExpense,
        "Accommodation": currentCycle.allocatedAccommodation,
        "Vacation": currentCycle.allocatedVacation,
        "Other Expenses": currentCycle.allocatedOtherExpenses
    };
    const allocatedForCategory = allocatedMapping[newTxn.purchaseCategory] || 0;

    // Retrieve historical behavioral insights from UserAnalytics.
    const UserAnalytics = (await import('../models/UserAnalytics.js')).default;
    const historicalInsights = await UserAnalytics.findOne({ userId, category: newTxn.purchaseCategory });

    // Build historical insights section:
    let historicalSection = "";
    if (historicalInsights && historicalInsights.mlSummary && historicalInsights.mlSummary.trim() !== "") {
        historicalSection = `- ML Narrative Summary: ${historicalInsights.mlSummary}`;
    } else {
        historicalSection = `
- Completed Cycles: ${historicalInsights ? historicalInsights.cycleCount : "N/A"}
- Average Spending per Cycle: $${historicalInsights ? historicalInsights.avgSpentPerCycle : "N/A"}
- Savings Achievement Rate: ${historicalInsights ? historicalInsights.savingsAchievementRate : "N/A"}
- Average Transactions per Cycle: ${historicalInsights ? historicalInsights.avgTxnCount : "N/A"}
- Average Transaction Day: ${historicalInsights ? historicalInsights.avgTxnDay : "N/A"}
- Maximum Transaction Amount: $${historicalInsights ? historicalInsights.maxTxnAmount : "N/A"}
- Minimum Transaction Amount: $${historicalInsights ? historicalInsights.minTxnAmount : "N/A"}
- Median Transaction Amount: $${historicalInsights ? historicalInsights.medianTxnAmount : "N/A"}
- Category Insights: ${historicalInsights && historicalInsights.categories ? JSON.stringify(historicalInsights.categories) : "N/A"}`;
    }

    // Build the final prompt string.
    const prompt = `
USER PROFILE:
- Age: ${age}
- Income Level: ${incomeLevel}
- Occupation Level: ${occupationLevel}
- Marital Status: ${maritalStatus}
- Family Size: ${familySize}
- Time Zone: ${timeZone}
- Currency: ${currency}
- Psychological Notes: ${psychologicalNotes}

CURRENT BUDGET CYCLE:
- Cycle Duration: ${currentCycle.budgetCycleDuration}
- Cycle Start Date: ${currentCycle.startDate ? new Date(currentCycle.startDate).toLocaleDateString() : "N/A"}
- Cycle End Date: ${currentCycle.endDate ? new Date(currentCycle.endDate).toLocaleDateString() : "Ongoing"}
- Transaction Day of Cycle: ${dayOfCycle}
- Total Allocation: $${currentCycle.totalMoneyAllocation}
- Savings Target: $${currentCycle.savingsTarget}
- Current Total Spent: $${currentTotalSpent} (spentSoFar: $${currentCycle.spentSoFar || currentTotalSpent})
- New Transaction Amount: $${newTxn.purchaseAmount}
- New Total Spent (if approved): $${newTotalSpent}
- New Remaining Budget: $${newRemainingBudget}
- Savings Target Met: ${savingsTargetMet ? 'Yes' : 'No'}

CURRENT CYCLE DETAILS:
- Cycle Status: ${currentCycle.status}
- Allocations:
   - Entertainment: $${currentCycle.allocatedEntertainment}
   - Groceries: $${currentCycle.allocatedGroceries}
   - Utilities: $${currentCycle.allocatedUtilities}
   - Commute: $${currentCycle.allocatedCommute}
   - Shopping: $${currentCycle.allocatedShopping}
   - Dining Out: $${currentCycle.allocatedDiningOut}
   - Medical Expense: $${currentCycle.allocatedMedicalExpense}
   - Accommodation: $${currentCycle.allocatedAccommodation}
   - Vacation: $${currentCycle.allocatedVacation}
   - Other Expenses: $${currentCycle.allocatedOtherExpenses}

CATEGORY DETAILS (${newTxn.purchaseCategory}):
- Allocated Amount: $${allocatedForCategory}
- Current Spending: $${currentCategorySpent}
- New Spending (if approved): $${newCategorySpent}

HISTORICAL TRENDS & BEHAVIORAL INSIGHTS:
${historicalSection}

TRANSACTION DETAILS:
- Provided Description: ${newTxn.purchaseDescription || "[No description provided]"}

QUESTION:
Based on the above data—including user profile, current cycle metrics, detailed cycle allocations, category details, and historical behavioral insights—should this transaction be APPROVED, DELAYED, or RECONSIDERED? Provide a detailed, step-by-step chain-of-thought explanation.
  `;

    return prompt;
}
