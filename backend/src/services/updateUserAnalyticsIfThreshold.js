import { deriveBehavioralInsights } from "./behavioralInsights.js";
import UserAnalytics from "../models/UserAnalytics.js";
import { callOpenRouterLLM } from "./llmOpenRouterService.js";

/**
 * Updates user analytics for a given category:
 * 1. Computes historical insights using deriveBehavioralInsights.
 * 2. Upserts these insights into the UserAnalytics collection.
 * 3. Builds a prompt based on these insights and calls the ML Model API.
 * 4. Updates the same document with the ML-generated summary.
 *
 * @param {Number} userId - The user's custom numeric ID.
 * @param {String} category - The spending category to update analytics for.
 * @returns {Promise<Object>} The updated UserAnalytics document.
 */
export async function updateUserAnalyticsIfThresholdMet(userId, category) {
    // 1. Compute historical insights across all cycles.
    const insights = await deriveBehavioralInsights(userId);

    // 2. Upsert the computed insights into the UserAnalytics collection.
    let analyticsDoc = await UserAnalytics.findOneAndUpdate(
        { userId, category },
        { ...insights, userId, category, lastUpdated: new Date() },
        { upsert: true, new: true }
    );

    // 3. Build a prompt using the insights for the ML model.
    const prompt = `User Analytics for category "${category}": ${JSON.stringify(insights)}`;

    // 4. Call the ML Model API (open router) to generate a narrative summary.
    const mlResponse = await callOpenRouterLLM(prompt);

    // 5. Update the UserAnalytics document with the ML summary.
    analyticsDoc = await UserAnalytics.findOneAndUpdate(
        { userId, category },
        { mlSummary: mlResponse.insights, lastUpdated: new Date() },
        { new: true }
    );

    console.log(`UserAnalytics updated for user ${userId} and category ${category}.`);
    return analyticsDoc;
}
