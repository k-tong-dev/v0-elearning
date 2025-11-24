import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
    console.log('--- HITTING /api/chat POST endpoint ---');
    try {
        if (!process.env.OPENROUTER_API_KEY) {
            console.error('OpenRouter API key not configured.');
            return NextResponse.json(
                { error: 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY in your .env file.' },
                { status: 500 }
            );
        }

        const { messages } = await request.json();

        const conversation = [
            {
                role: 'system',
                content:
                    'You are NEXT4LEARN AI, a helpful and knowledgeable assistant for an e-learning platform. Your goal is to assist users with questions about courses, learning paths, technical topics, and general inquiries related to online education. Be friendly, encouraging, and provide concise, accurate information.',
            },
            ...messages,
        ];

        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'qwen/qwen3-vl-30b-a3b-instruct',
                messages: conversation,
                temperature: 1,
                max_tokens: 500,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'https://camedu.vercel.app',
                },
            }
        );

        const botMessage = response.data.choices[0].message.content;
        return NextResponse.json({ response: botMessage });
    } catch (error: any) {
        console.error('Error calling OpenRouter API:', error);
        return NextResponse.json(
            { error: 'Failed to get response from AI. Check console for details.' },
            { status: 500 }
        );
    }
}
