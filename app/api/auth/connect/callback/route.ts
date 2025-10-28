import { NextRequest, NextResponse } from 'next/server';

const NEXT_PUBLIC_STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code'); // Google auth code
    const state = searchParams.get('state'); // Optional state for security

    if (!code) {
        console.error('No auth code received from Google');
        return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
    }

    try {
        // Exchange code for tokens via Strapi
        const tokenResponse = await fetch(`${NEXT_PUBLIC_STRAPI_URL}/api/connect/google/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, state }),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error('Strapi callback failed:', errorData);
            return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
        }

        const { jwt, user } = await tokenResponse.json();

        // Check if user needs profile completion (e.g., role/preferences)
        const fullUserResponse = await fetch(`${NEXT_PUBLIC_STRAPI_URL}/users/me`, {
            headers: { Authorization: `Bearer ${jwt}` },
        });
        const fullUser = await fullUserResponse.json();

        const redirectUrl = fullUser.role && fullUser.preferences ? '/dashboard' : `/google-preferences?userId=${fullUser.id}`;

        const response = NextResponse.redirect(new URL(redirectUrl, request.url));
        response.cookies.set('auth-token', jwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Callback error:', error);
        return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
    }
}