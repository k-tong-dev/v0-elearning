import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    console.log('--- HITTING /api/chat POST endpoint ---'); // Added for debugging
    try {
        // Check for API key
        if (!process.env.OPENAI_API_KEY) {
            console.error('OpenAI API key not configured.');
            return NextResponse.json(
                { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.' },
                { status: 500 }
            );
        }

        const { messages } = await request.json();

        // Add a system message to guide the AI's behavior
        const conversation = [
            {
                role: 'system',
                content: 'You are CamEdu AI, a helpful and knowledgeable assistant for an e-learning platform. Your goal is to assist users with questions about courses, learning paths, technical topics, and general inquiries related to online education. Be friendly, encouraging, and provide concise, accurate information. If a user asks for something outside your scope, politely redirect them to relevant resources or suggest contacting human support.'
            },
            ...messages,
        ];

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // You can choose other models like 'gpt-4' if available and preferred
            messages: conversation,
            temperature: 0.7, // Controls randomness: lower for more focused, higher for more creative
            max_tokens: 500,
        });

        const botMessage = completion.choices[0].message.content;

        return NextResponse.json({ response: botMessage });
    } catch (error: any) {
        console.error('Error calling OpenAI API:', error);
        let errorMessage = 'Failed to get response from AI.';
        let statusCode = 500;

        if (error instanceof OpenAI.APIError) {
            console.error('OpenAI API Error Details:', error.status, error.name, error.message, error.code, error.type);
            errorMessage = `OpenAI API Error: ${error.message}`;
            statusCode = error.status || 500;
            if (error.code === 'invalid_api_key' || error.type === 'authentication_error') {
                errorMessage = 'Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.';
                statusCode = 401;
            }
        } else if (error.response) {
            // Generic HTTP error response from fetch
            console.error('API Response Status:', error.response.status);
            console.error('API Response Data:', error.response.data);
            errorMessage = `Server Error: ${error.response.statusText || 'Unknown'}`;
            statusCode = error.response.status || 500;
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: statusCode }
        );
    }
}