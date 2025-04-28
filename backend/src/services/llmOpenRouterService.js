import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Calls the OpenRouter API to generate a response using the x-ai/grok-3-beta model.
 *
 * @param {string} prompt - The prompt to send to the LLM.
 * @returns {Promise<string>} The generated response content.
 * @throws {Error} If the API key is missing, the request fails, or the response is invalid.
 */
export async function callOpenRouterLLM(prompt) {
    // Validate input
    if (!prompt || typeof prompt !== 'string') {
        throw new Error('Invalid or missing prompt');
    }

    // Retrieve API key from environment
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    try {
        // Make POST request to OpenRouter API using Axios
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'x-ai/grok-3-beta',
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
            }
        );

        // Log raw response for debugging
        console.log('OpenRouter API response:', JSON.stringify(response.data, null, 2));

        // Validate response structure
        if (!response.data || !response.data.choices || !Array.isArray(response.data.choices) || response.data.choices.length === 0) {
            throw new Error('Invalid response structure: No choices found');
        }

        const content = response.data.choices[0].message?.content;
        if (!content || typeof content !== 'string') {
            throw new Error('Invalid response: No valid content in choices[0].message');
        }

        // Log extracted content
        console.log('Extracted LLM content:', content);

        return content;
    } catch (error) {
        // Handle Axios errors
        let errorMessage = 'Failed to generate LLM response';
        if (error.response) {
            errorMessage += `: ${error.response.status} ${error.response.statusText} - ${JSON.stringify(error.response.data)}`;
        } else if (error.request) {
            errorMessage += ': No response received from OpenRouter API';
        } else {
            errorMessage += `: ${error.message}`;
        }

        console.error('Error calling OpenRouter API:', errorMessage);
        throw new Error(errorMessage);
    }
}