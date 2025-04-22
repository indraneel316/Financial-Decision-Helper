export async function callLLMAPI(prompt) {
    console.log('callLLMAPI called with prompt:', { prompt });

    // Simulate API latency (500ms)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock response
    const mockResponse = {
        recommendation: 'APPROVED',
        reasoning: 'The transaction for $5 on "Coffee" in the "DiningOut" category contributes to a high spending trend in this category. Reducing discretionary spending can help maintain budget adherence.',
        promptUsed: prompt,
    };

    console.log('callLLMAPI returning mock response:', mockResponse);
    return mockResponse;
}