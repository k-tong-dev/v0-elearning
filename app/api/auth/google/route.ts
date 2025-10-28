import { NextRequest, NextResponse } from 'next/server';
import { createAuthResponse } from '@/lib/auth-middleware';

const NEXT_PUBLIC_STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export async function POST(request: NextRequest) {
    try {
        const { credential } = await request.json();
        console.log('Received credential:', credential);

        const response = await fetch(`${NEXT_PUBLIC_STRAPI_URL}/api/auth/google/callback`);

        console.log('Strapi response status:', response.status);
        const text = await response.text();
        console.log('Strapi response text:', text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse Strapi response:', text);
            throw new Error(`Invalid response from Strapi: ${text}`);
        }

        if (!response.ok) {
            throw new Error(data.error?.message || 'Google login failed');
        }

        const resData = {
            ...createAuthResponse(data.user, data.jwt),
            newUser: !data.user.role
        };

        const res = NextResponse.json(resData);

        res.cookies.set('auth-token', data.jwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
        });

        return res;
    } catch (error: any) {
        console.error('Google auth error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}