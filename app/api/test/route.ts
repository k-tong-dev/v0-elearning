import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Simulate a potential error for testing purposes, if needed
        // throw new Error("Simulated error in test API route");
        return NextResponse.json({ message: 'Test API route is working!' });
    } catch (error: any) {
        console.error('Error in /api/test route:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}