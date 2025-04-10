// server.js

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import userRoutes from './src/routes/UserRoute.js';
import budgetCycleRoutes from './src/routes/BudgetCycleRoute.js';
import transactionRoutes from './src/routes/TransactionRoute.js';
import userAuth from "./src/routes/UserAuth.js";

import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());


// Connect to MongoDB
mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('MongoDB connected.'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Mount routes
// Adjust the base paths ("/api/users", etc.) as desired
app.use('/api/users', userRoutes);
app.use('/api/auth', userAuth);
app.use('/api/budget-cycles', budgetCycleRoutes);
app.use('/api/transactions', transactionRoutes);



// Use port 5001 or any port from environment variables
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
