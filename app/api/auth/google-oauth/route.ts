import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/auth'
import jwt from 'jsonwebtoken'
import { UserRole, UserPreferences } from '@/types/auth' // Import from new types file

export async function POST(request: NextRequest) {
    console.log('--- HITTING /api/auth/google-oauth POST endpoint ---');
    try {
        const body = await request.json()
        const { credential } = body

        if (!credential) {
            console.log('--- /api/auth/google-oauth: Missing credential ---');
            return NextResponse.json(
                { error: 'Google credential is required for Google OAuth registration.' },
                { status: 400 }
            )
        }

        // Verify Google JWT token
        // In a real implementation, you would verify the token with Google
        // For now, we'll decode it (NOT SECURE - just for demo)
        const base64Payload = credential.split('.')[1]
        const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString())

        // Mock Google profile (replace with actual Google token verification)
        const googleProfile = {
            sub: payload.sub || 'mock-google-id',
            email: payload.email || 'user@example.com',
            name: payload.name || 'Google User',
            picture: payload.picture || ''
        }
        console.log('--- /api/auth/google-oauth: Google Profile Decoded ---', googleProfile.email);

        // Find or create user. We'll let UserService handle if it's a new user or not.
        const { user, isNewUser } = await UserService.findOrCreateGoogleUser(googleProfile);
        console.log('--- /api/auth/google-oauth: User found/created ---', user?.email, 'isNewUser:', isNewUser);

        if (!user) {
            console.error('--- /api/auth/google-oauth: Failed to find or create user ---');
            return NextResponse.json(
                { error: 'Failed to find or create user during Google authentication.' },
                { status: 500 }
            )
        }

        // Generate JWT token
        const jwtSecret = process.env.NEXTAUTH_SECRET;
        if (!jwtSecret) {
            console.error('--- /api/auth/google-oauth: NEXTAUTH_SECRET is not defined ---');
            return NextResponse.json(
                { error: 'Server configuration error: JWT secret is missing.' },
                { status: 500 }
            );
        }

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                name: user.name,
                provider: 'google',
                role: user.role
            },
            jwtSecret, // Use the validated secret
            { expiresIn: '7d' }
        )
        console.log('--- /api/auth/google-oauth: JWT Token Generated ---');

        // Set cookie
        const response = NextResponse.json({
            message: 'Google authentication successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                provider: user.provider,
                role: user.role
            },
            token
        })

        response.cookies.set({
            name: 'auth-token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        })
        console.log('--- /api/auth/google-oauth: Auth Token Cookie Set ---');

        // If it's a new user and they haven't set role/preferences, redirect them to the preferences page
        // This logic needs to be careful about the redirect.
        // The client-side fetch is set to 'manual' redirect, so we return the redirect response.
        // The client-side will then manually navigate.
        if (isNewUser && (!user.role || user.role === 'student' && (!user.preferences || (user.preferences.learningGoals?.length === 0 && user.preferences.learningStyle?.length === 0 && user.preferences.topicsOfInterest?.length === 0)))) {
            console.log('--- /api/auth/google-oauth: New Google user, returning redirect to preferences setup ---');
            return NextResponse.redirect(new URL(`/signup/google-preferences?userId=${user.id}`, request.url), { status: 307 }); // Use 307 for temporary redirect
        }

        // For existing users or new users who already have preferences (e.g., from a previous flow), redirect to dashboard
        console.log('--- /api/auth/google-oauth: Returning redirect to dashboard ---');
        return NextResponse.redirect(new URL('/dashboard', request.url), { status: 307 }); // Use 307 for temporary redirect

    } catch (error: any) {
        console.error('--- /api/auth/google-oauth: Caught error in POST handler ---', error);
        // Ensure a JSON response is always returned on error
        return NextResponse.json(
            { error: error.message || 'Failed to authenticate with Google due to an unexpected server error.' },
            { status: 500 }
        )
    }
}

// Handle Google OAuth redirect (if using traditional OAuth flow, not GSI)
export async function GET(request: NextRequest) {
    console.log('--- HITTING /api/auth/google-oauth GET endpoint ---');
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
        console.log('--- /api/auth/google-oauth GET: Error param received ---', error);
        return NextResponse.redirect(new URL('/?error=google_auth_failed', request.url))
    }

    if (!code) {
        console.log('--- /api/auth/google-oauth GET: Missing code param ---');
        return NextResponse.redirect(new URL('/?error=missing_code', request.url))
    }

    try {
        // Exchange code for tokens (implement based on your Google OAuth setup)
        // This is a placeholder - implement actual Google OAuth flow
        console.log('--- /api/auth/google-oauth GET: Attempting to exchange code (placeholder) ---');

        return NextResponse.redirect(new URL('/dashboard?success=google_auth', request.url))
    } catch (error) {
        console.error('--- /api/auth/google-oauth GET: Google OAuth callback error ---', error)
        return NextResponse.redirect(new URL('/?error=google_auth_callback_failed', request.url))
    }
}