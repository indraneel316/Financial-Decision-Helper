import BudgetCycle from '../models/BudgetCycle.js';
import User from '../models/User.js';
import { DateTime } from 'luxon';
import {updateUserAnalyticsIfThresholdMet} from "./updateUserAnalyticsIfThreshold.js";

export const CycleCompletionScheduler = () => {
    const ONE_HOUR = 60 * 60 * 1000;

    async function checkCycleCompletion() {
        try {
            // Find active cycles
            const activeCycles = await BudgetCycle.find({
                status: 'active',
            });

            if (!activeCycles.length) {
                console.log('No active cycles found.');
                return;
            }

            // Group cycles by userId to fetch users in bulk
            const userIds = [...new Set(activeCycles.map(cycle => cycle.userId))];
            const users = await User.find({ userId: { $in: userIds } }).select('userId timeZone');
            const userTimezoneMap = users.reduce((map, user) => {
                map[user.userId] = user.timezone || 'UTC';
                return map;
            }, {});

            const overdueCycles = [];
            const currentDate = DateTime.utc();

            // Check each cycle's endDate in the user's local timezone
            for (const cycle of activeCycles) {
                const userTimezone = userTimezoneMap[cycle.userId] || 'UTC';
                const endDate = DateTime.fromJSDate(cycle.endDate, { zone: 'UTC' });
                const currentDateInUserTimezone = currentDate.setZone(userTimezone);

                // If current time in user's timezone is past endDate, mark as overdue
                if (currentDateInUserTimezone >= endDate) {
                    overdueCycles.push(cycle);
                }
            }

            if (!overdueCycles.length) {
                console.log('No overdue cycles found.');
            } else {
                console.log(`Found ${overdueCycles.length} overdue cycles.`);
            }

            for (const cycle of overdueCycles) {
                await BudgetCycle.updateOne(
                    { budgetCycleId: cycle.budgetCycleId },
                    { $set: { status: 'completed', updatedAt: new Date() } }
                );
                console.log(`Cycle ${cycle.budgetCycleId} marked as completed for user ${cycle.userId}`);

                // Schedule analytics update for the user (assumed to exist)
                await updateUserAnalyticsIfThresholdMet(cycle.userId);
            }
        } catch (err) {
            console.error('Error in cycle completion scheduler:', err);
        } finally {
            setTimeout(checkCycleCompletion, ONE_HOUR);
        }
    }

    // Start the scheduler
    console.log('Starting cycle completion scheduler (every 1 hour)...');
    checkCycleCompletion();
};