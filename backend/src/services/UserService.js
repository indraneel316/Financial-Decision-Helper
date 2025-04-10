// services/userService.js
import User from '../models/User.js';


export async function getUserWithAllCycles(userId) {
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

    const result = await User.aggregate(pipeline);
    if (!result || result.length === 0) {
        throw new Error(`User with userId ${userId} not found`);
    }
    return result[0];
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
