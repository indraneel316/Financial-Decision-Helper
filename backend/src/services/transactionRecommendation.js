import { buildEnhancedLLMPrompt } from './buildEnhancedLLMPrompt.js';
import { callLLMAPI } from './llmService.js';


export const processTransactionRecommendationAsync = async (transaction) => {
    try {
        const prompt = await buildEnhancedLLMPrompt(transaction.budgetCycleId, transaction.userId, transaction);
        const llmResponse = await callLLMAPI(prompt);
        transaction.recommendation = llmResponse.recommendation;
        transaction.reasoning = llmResponse.reasoning;
        transaction.promptUsed = prompt;
        await transaction.save();
    } catch (err) {
        console.error("Error processing transaction recommendation:", err);
    }
};
