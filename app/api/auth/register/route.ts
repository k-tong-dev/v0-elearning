import { NextRequest, NextResponse } from 'next/server'
import { UserService, hashPassword } from '@/lib/auth'
import { createAuthResponse } from '@/lib/auth-middleware'
import jwt from 'jsonwebtoken'
import { UserRole, UserPreferences } from '@/types/auth' // Import from new types file

export async function POST(request: NextRequest) {
    console.log('--- HITTING /api/auth/register POST endpoint ---'); // Added for debugging
    try {
        const body = await request.json()
        const { email, password, name, role, preferences } = body // Destructure new fields

        // Validate required fields
        if (!email || !password || !name || !role || !preferences) { // Ensure new fields are present
            console.log('--- /api/auth/register: Missing fields ---');
            return NextResponse.json(
                { error: 'Email, password, name, role, and preferences are required for email registration.' },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            )
        }

        // Validate password strength
        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await hashPassword(password)

        // Create user with new fields
        const user = await UserService.createUser({
            email: email.toLowerCase(),
            name,
            provider: 'email',
            isVerified: false,
            password: hashedPassword,
            role, // Pass role
            preferences // Pass preferences
        } as any)

        // Generate JWT token to automatically log user in
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                name: user.name,
                provider: user.provider || 'email',
                role: user.role // Include role in JWT
            },
            process.env.NEXTAUTH_SECRET || 'fallback-secret',
            { expiresIn: '7d' }
        )

        // Remove password from response
        const { password: _, ...userResponse } = user as any

        return createAuthResponse(userResponse, token)

    } catch (error: any) {
        console.error('--- /api/auth/register: Error in handler ---', error);

        if (error.message === 'User already exists with this email') {
            return NextResponse.json(
                { error: 'User already exists with this email' },
                { status: 409 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}