import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || 'fallback-secret';

export async function POST(request: NextRequest) {
    try {
        const { email, name, avatar } = await request.json();
        
        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        console.log('[Google Auth] Processing authentication for:', email);

        // Check if user exists in Strapi
        const checkResponse = await fetch(
            `${STRAPI_URL}/api/users?filters[email][$eq]=${encodeURIComponent(email)}&populate=*`,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!checkResponse.ok) {
            console.error('[Google Auth] Failed to check user:', await checkResponse.text());
            throw new Error('Failed to check user existence');
        }

        const existingUsers = await checkResponse.json();
        const existingUser = existingUsers.length > 0 ? existingUsers[0] : null;

        let jwtToken: string;
        let user: any;
        let newUser = false;

        if (existingUser) {
            // User exists - generate JWT for existing user
            console.log('[Google Auth] User exists:', existingUser.username);
            
            // Check if user has completed profile setup
            newUser = !existingUser.role || !existingUser.preferences;
            
            // Use Strapi's auth endpoint to get a proper JWT
            // Try to use Google OAuth password if set, otherwise generate JWT
            const googlePassword = process.env.GOOGLE_AUTH_BYPASS_PASSWORD || `google-oauth-${email}`;
            
            const loginResponse = await fetch(`${STRAPI_URL}/api/auth/local`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier: email,
                    password: googlePassword,
                }),
            });

            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                jwtToken = loginData.jwt;
                user = loginData.user;
            } else {
                // If password login fails, generate a temporary JWT
                // This is for users who signed up with Google and don't have a password
                console.log('[Google Auth] Password login failed, generating JWT for OAuth user');
                
                jwtToken = jwt.sign(
                    {
                        id: existingUser.id,
                        email: existingUser.email,
                        username: existingUser.username,
                    },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                );
                user = existingUser;
            }
        } else {
            // New user - register them
            console.log('[Google Auth] New user, creating account');
            newUser = true;

            const username = name?.replace(/\s+/g, '_').toLowerCase() || email.split('@')[0];
            const googlePassword = process.env.GOOGLE_AUTH_BYPASS_PASSWORD || `google-oauth-${email}`;

            const registerResponse = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    password: googlePassword,
                    confirmed: true,
                    avatar,
                    provider: 'google',
                }),
            });

            if (!registerResponse.ok) {
                const errorData = await registerResponse.json();
                console.error('[Google Auth] Registration failed:', errorData);
                throw new Error(errorData.error?.message || 'Failed to register user');
            }

            const registerData = await registerResponse.json();
            jwtToken = registerData.jwt;
            user = registerData.user;
        }

        console.log('[Google Auth] Authentication successful, newUser:', newUser, 'userId:', user.id);

        // Return the response with JWT token
        return NextResponse.json({
            jwt: jwtToken,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                name: user.username || user.email,
                avatar: user.avatar || avatar,
                role: user.role,
                preferences: user.preferences,
                provider: user.provider || 'google',
            },
            newUser,
        });
    } catch (error: any) {
        console.error('[Google Auth] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Google authentication failed' },
            { status: 400 }
        );
    }
}