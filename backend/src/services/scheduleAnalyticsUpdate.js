import { updateUserAnalyticsIfThresholdMet } from './updateUserAnalyticsIfThreshold.js';

/**
 * Schedule an update of the user's analytics for a specific category 10 minutes after a transaction is made.
 *
 * @param {Number} userId - The user's custom numeric ID.
 * @param {String} category - The spending category to update analytics for.
 */
export const scheduleAnalyticsUpdateForUser = (userId, category) => {
    // 10 minutes in milliseconds.
    const TEN_MINUTES = 10 * 60 * 1000;
    setTimeout(async () => {
        try {
            await updateUserAnalyticsIfThresholdMet(userId, category);
            console.log(`Analytics updated for user ${userId} in category ${category} after 10 minutes.`);
        } catch (err) {
            console.error("Error updating analytics after 10 minutes:", err);
        }
    }, TEN_MINUTES);
};
