import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const TransactionSchema = new Schema(
    {
        userId: {
            type: String,
            required: true
        },
        transactionId: {
            type: String,
            required: true
        },
        budgetCycleId: {
            type: String,
            required: true
        },
        purchaseDescription: {
            type: String,
            required: true
        },
        purchaseCategory: {
            type: String,
            required: true
        },
        purchaseAmount: {
            type: Number,
            required: true
        },
        recommendation: {
            type: String
        },
        reasoning: {
            type: String
        },
        chainOfThought: {
            type: String
        },
        promptUsed: {
            type: String
        },
        llmConfidenceScore: {
            type: Number
        },
        isTransactionPerformedAfterRecommendation: {
            type: String,
            default: 'yes'
        },
        transactionTimestamp: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);


TransactionSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: 'userId',
    justOne: true
});


TransactionSchema.virtual('budgetCycle', {
    ref: 'BudgetCycle',
    localField: 'budgetCycleId',
    foreignField: 'budgetCycleId',
    justOne: true
});



// TransactionSchema.post('save', async function(doc) {
//     try {
//         const BudgetCycle = mongoose.model('BudgetCycle');
//         // Update overall spending
//         await BudgetCycle.findOneAndUpdate(
//             { budgetCycleId: doc.budgetCycleId },
//             { $inc: { spentSoFar: doc.purchaseAmount } }
//         );
//
//         const update = {};
//         update[`categorySpent.${doc.purchaseCategory}`] = doc.purchaseAmount;
//         await BudgetCycle.findOneAndUpdate(
//             { budgetCycleId: doc.budgetCycleId },
//             { $inc: update }
//         );
//     } catch (err) {
//         console.error("Error updating aggregated budget cycle:", err);
//     }
// });

export default mongoose.models.Transaction || model('Transaction', TransactionSchema);
