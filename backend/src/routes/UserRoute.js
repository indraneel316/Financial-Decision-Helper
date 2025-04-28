// routes/userRoutes.js
import express from 'express';
import {

    getUserCyclesController,
    updateUserController,
    deleteUserController, getUserAnalyticsController
} from '../controllers/UserController.js';
import {getUserWithActiveCycles} from "../services/UserService.js";

const router = express.Router();



router.get('/:userId/cycles', getUserCyclesController);

router.put('/:userId', updateUserController);

router.delete('/:userId', deleteUserController);

router.get(':/userId/data', getUserWithActiveCycles)

router.get('/:userId/analytics', getUserAnalyticsController)

export default router;
