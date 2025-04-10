// user.js
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const UserSchema = new Schema(
    {
        userId: {
            type: String,
            unique: true,
        },
        email: {
            type: String,
            unique: true,
            required: true
        },
        passwordHash: {
            type: String
        },

        age: {
            type: Number,
            default: null
        },
        incomeLevel: {
            type: String,
            default: 0
        },
        occupationLevel: {
            type: String,
            default: ''
        },
        maritalStatus: {
            type: String,
            default: ''
        },
        familySize: {
            type: Number,
            default: 1
        },
        timeZone: {
            type: String,
            default: 'UTC'
        },
        currency: {
            type: String,
            default: 'USD'
        },
        psychologicalNotes: {
            type: String,
            default: ''
        }
    },
    { timestamps: true }
);



export default model('users', UserSchema);
