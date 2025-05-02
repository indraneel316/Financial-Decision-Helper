import { updateUserAnalyticsIfThresholdMet } from './updateUserAnalyticsIfThreshold.js';
import user from "../models/User.js";

/**
 * Schedule an update of the user's analytics for a specific category 10 minutes after a transaction is made.
 *
 * @param {Number} userId - The user's custom numeric ID.
 * @param {String} category - The spending category to update analytics for.
 */
export async function scheduleAnalyticsUpdateForUser(userId, category) {

    try {
        const result = await updateUserAnalyticsIfThresholdMet(userId);
        console.log(`Analytics updated for user ${userId} in category ${category} immediately.`);
        return result;
    } catch (err) {
        console.error(`Error updating analytics for user ${userId} in category ${category}:`, err.message);
        throw err;
    }
}