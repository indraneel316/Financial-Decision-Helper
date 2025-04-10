import mongoose from 'mongoose';
import express from 'express';
import authController from '../controllers/UserAuth.js'

const userAuthRouter = express.Router();

userAuthRouter.post('/signup', authController.signup);
userAuthRouter.post('/signin', authController.signin);

export default userAuthRouter;