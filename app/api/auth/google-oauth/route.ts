import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/auth'
import jwt from 'jsonwebtoken'
import { UserRole, UserPreferences } from '@/types/auth'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { credential } = body // No longer expecting role and preferences directly here

        if (!credential) {
            return NextResponse.json(
                { error: 'Google credential is required for Google OAuth registration.' },
                { status: 400 }
            )
        }

        const base64Payload = credential.split('.')[1]
        const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString())

        const googleProfile = {
            sub: payload.sub || 'mock-google-id',
            email: payload.email || 'user@example.com',
            name: payload.name || 'Google User',
            picture: payload.picture || ''
        }

        // Find or create user, and get the isNewUser flag
        const { user, isNewUser } = await UserService.findOrCreateGoogleUser(googleProfile);

        if (!user) {
            return NextResponse.json(
                { error: 'Failed to find or create user during Google authentication.' },
                { status: 500 }
            )
        }

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                name: user.name,
                provider: 'google',
                role: user.role
            },
            process.env.NEXTAUTH_SECRET || 'fallback-secret',
            { expiresIn: '7d' }
        )

        // Determine redirect URL based on whether it's a new user
        let redirectPath = '/dashboard';
        if (isNewUser) {
            redirectPath = `/signup/google-preferences?userId=${user.id}`;
        }

        const redirectUrl = new URL(redirectPath, request.url);
        const response = NextResponse.redirect(redirectUrl, { status: 302 });

        response.cookies.set({
            name: 'auth-token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;

    } catch (error: any) {
        console.error('Google OAuth error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to authenticate with Google' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
        return NextResponse.redirect(new URL('/?error=google_auth_failed', request.url))
    }

    if (!code) {
        return NextResponse.redirect(new URL('/?error=missing_code', request.url))
    }

    try {
        // Exchange code for tokens (implement based on your Google OAuth setup)
        // This is a placeholder - implement actual Google OAuth flow

        return NextResponse.redirect(new URL('/dashboard?success=google_auth', request.url))
    } catch (error) {
        console.error('Google OAuth callback error:', error)
        return NextResponse.redirect(new URL('/?error=google_auth_callback_failed', request.url))
    }
}