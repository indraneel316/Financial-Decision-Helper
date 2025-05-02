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


export async function getPastCycles(req, res) {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Validate pagination parameters
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({ error: 'Page must be a positive integer' });
        }
        if (isNaN(limitNum) || limitNum < 1) {
            return res.status(400).json({ error: 'Limit must be a positive integer' });
        }

        // Calculate skip for pagination
        const skip = (pageNum - 1) * limitNum;

        // Fetch paginated cycles and total count
        const { cycles, totalCycles } = await userService.getPastCycles(userId, skip, limitNum);

        // Calculate total pages
        const totalPages = Math.ceil(totalCycles / limitNum);

        // Prepare response
        const response = {
            cycles: cycles || [],
            pagination: {
                currentPage: pageNum,
                limit: limitNum,
                totalCycles,
                totalPages,
            },
        };

        res.json(response);
    } catch (err) {
        console.error(`Error fetching cycles for user ${req.params.userId}:`, err.message);
        res.status(404).json({ error: err.message });
    }
}


export async function updateUserController(req, res) {
    try {
        const { userId } = req.params;
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