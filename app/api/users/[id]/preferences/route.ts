import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-middleware';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
    const tokenUser = await verifyAuthToken(request);

    if (!tokenUser || tokenUser.id !== params.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, preferences } = await request.json();

    const token = request.cookies.get('auth-token')?.value;

    const response = await fetch(`${STRAPI_URL}/api/users/${params.userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            role,
            preferences,
            // Optionally update other defaults if needed, e.g., settings
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        return NextResponse.json({ error: data.error?.message || 'Update failed' }, { status: 400 });
    }

    return NextResponse.json({ user: data, message: 'Preferences updated successfully' });
}