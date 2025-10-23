// Updated file: app/api/auth/register/route.ts
// (Kept the route as is, but updated body to match Strapi v5 requirements: username from name)
import { NextRequest, NextResponse } from 'next/server';
import { createAuthResponse } from '@/lib/auth-middleware';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function POST(request: NextRequest) {
    try {
        const { name, email, password, role, preferences } = await request.json();

        const response = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: name,
                email,
                password,
                name,
                role,
                preferences,
                settings: {
                    theme: 'system',
                    notifications: { newEnrollments: true, courseReviews: true, paymentNotifications: true, weeklyAnalytics: true },
                    newsletter: false,
                    skills: []
                },
                badgeIds: [],
                confirmed: true,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Registration failed');
        }

        return createAuthResponse(data.user, data.jwt);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}