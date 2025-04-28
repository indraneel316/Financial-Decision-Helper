// services/userService.js
import User from '../models/User.js';

import mongoose from 'mongoose';
import UserAnalytics from '../models/UserAnalytics.js';

// Fetch analytics by userId
export async function getAnalyticsByUserId(userId) {
    try {
        // Validate userId
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid userId');
        }

        // Fetch analytics from MongoDB
        const analytics = await UserAnalytics.findOne({ userId }).lean();

        if (!analytics) {
            throw new Error('Analytics not found');
        }
        return analytics;
    } catch (error) {
        console.error('Error in getAnalyticsByUserId:', error.message);
        throw error;
    }
}

/**
 * Fetches a user with all associated budget cycles and transactions.
 *
 * @param {Number} userId - The user's custom numeric ID.
 * @returns {Promise<Object>} The user object with nested cycles and transactions.
 * @throws {Error} If the user is not found or an error occurs during aggregation.
 */
export async function getUserWithAllCycles(userId) {
    try {
        const pipeline = [
            // Match the user by userId
            { $match: { userId } },
            {
                $lookup: {
                    from: 'budgetcycles',
                    let: { uId: '$userId' },
                    pipeline: [
                        {
                            $match: { $expr: { $eq: ['$userId', '$$uId'] } }
                        },
                        {
                            $lookup: {
                                from: 'transactions',
                                let: { bcId: '$budgetCycleId' },
                                pipeline: [
                                    {
                                        $match: { $expr: { $eq: ['$budgetCycleId', '$$bcId'] } }
                                    }
                                ],
                                as: 'transactions'
                            }
                        }
                    ],
                    as: 'cycles'
                }
            }
        ];

        const result = await mongoose.model('users').aggregate(pipeline);

        if (!result || result.length === 0) {
            throw new Error(`User with userId ${userId} not found`);
        }

        // Manually convert Mongoose documents to plain objects
        const plainResult = JSON.parse(JSON.stringify(result[0]));

        // Log the result for debugging
        console.debug(`Fetched user ${userId}:`, JSON.stringify(plainResult, null, 2));

        // Ensure the result is JSON-serializable
        JSON.stringify(plainResult); // Throws if circular reference exists

        return plainResult;
    } catch (error) {
        console.error(`Error fetching user with userId ${userId}:`, error.message);
        throw error;
    }
}


export async function getUserWithActiveCycles(email) {
    const pipeline = [
        // Match the user by userId
        { $match: { email } },
        {
            $lookup: {
                from: 'budgetcycles',
                let: { uId: '$userId' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$userId', '$$uId'] }, // Match userId
                                    { $eq: ['$status', 'active'] } // Only active cycles
                                ]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'transactions',
                            let: { bcId: '$budgetCycleId' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$budgetCycleId', '$$bcId'] } // Match budget cycle
                                            ]
                                        }
                                    }
                                }
                            ],
                            as: 'transactions'
                        }
                    }
                ],
                as: 'cycle'
            }
        }
    ];

    const result = await User.aggregate(pipeline);
    if (!result || result.length === 0) {
        throw new Error(`User with userId ${userId} not found`);
    }
    return result[0];
}


/**
 * Update a user by userId.
 */
export async function updateUserById(userId, updateData) {
    const updated = await User.findOneAndUpdate({ userId }, { $set: updateData }, { new: true });
    if (!updated) {
        throw new Error(`User with userId ${userId} not found.`);
    }
    return updated;
}

/**
 * Delete a user by userId.
 */
export async function deleteUserById(userId) {
    const deleted = await User.findOneAndDelete({ userId });
    if (!deleted) {
        throw new Error(`User with userId ${userId} not found.`);
    }
    return deleted;
}
