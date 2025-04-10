import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const signup = async ({ name, email, password }) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('User already exists');
    const hashedPassword = await bcrypt.hash(password, 10);
    const userIdGenerated = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newUser = new User({ name, email, passwordHash: hashedPassword, userId: userIdGenerated });
    return await newUser.save();    return await newUser.save();
};

const signin = async ({ email, password }) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new Error('Invalid credentials');
    return jwt.sign({ userId: user.userId }, 'b7a8bfe2d46d98f5cb38761e7638cc4e2c95abf5f88dbb65f1e0d5602a8e60d8', { expiresIn: '1h' });
};

export default { signup, signin };