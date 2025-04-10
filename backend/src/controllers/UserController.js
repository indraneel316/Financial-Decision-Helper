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

export async function getUserData(req, res) {
    try {
        const { userId } = req.params;
        const aggregatedUser = await userService.getUserWithActiveCycles(userId);
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
