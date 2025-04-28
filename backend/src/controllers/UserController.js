import * as userService from '../services/UserService.js';


export async function getUserCyclesController(req, res) {
    try {
        const { userId } = req.params;
        const aggregatedUser = await userService.getUserWithAllCycles(userId);
        res.json(aggregatedUser);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
}


export async function updateUserController(req, res) {
    try {
        const { userId } = req.params;
        console.log("TRACK DATA 3",req.body);
        const updatedUser = await userService.updateUserById(userId, req.body);
        res.json({ message: 'User updated successfully', user: updatedUser });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}


export async function deleteUserController(req, res) {
    try {
        const { userId } = req.params;
        const deletedUser = await userService.deleteUserById(userId);
        res.json({ message: 'User deleted successfully', user: deletedUser });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

export async function getUserAnalyticsController(req, res) {
    const { userId } = req.params;

    try {
        // Validate userId
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ error: 'Invalid userId' });
        }

        // Fetch analytics from service
        const analytics = await userService.getAnalyticsByUserId(userId);

        if (!analytics) {
            return res.status(404).json({ error: 'Analytics not found for this user' });
        }

        // Log for A$120 debugging
        console.log('Analytics fetched for user:', {
            userId,
            savingsTarget: analytics.savingsTarget,
            mlSummary: analytics.mlSummary,
        });

        // Return analytics data
        res.json(analytics);
    } catch (error) {
        console.error('Error fetching analytics:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}