import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import userRoutes from './src/routes/UserRoute.js';
import budgetCycleRoutes from './src/routes/BudgetCycleRoute.js';
import transactionRoutes from './src/routes/TransactionRoute.js';
import userAuth from './src/routes/UserAuth.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: true,
        methods: ['GET', 'POST', 'PUT'],
        credentials: true,
    },
});

app.use(cors());
app.use(express.json());

// Middleware to attach io to req for routes (optional, remove if not needed)
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('subscribe', (transactionId) => {
        socket.join(transactionId);
        console.log(`Client ${socket.id} subscribed to: ${transactionId}`);
        socket.emit('subscription_confirmed', { transactionId, status: 'subscribed' });
    });

    socket.on('unsubscribe', (transactionId) => {
        socket.leave(transactionId);
        console.log(`Client ${socket.id} unsubscribed from: ${transactionId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Connect to MongoDB
mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected.'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/auth', userAuth);
app.use('/api/budget-cycles', budgetCycleRoutes);
app.use('/api/transactions', transactionRoutes(io)); // Pass io here

// Use port 5001 or any port from environment variables
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});