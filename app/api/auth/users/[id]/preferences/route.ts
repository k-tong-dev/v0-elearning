import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/auth';
import { UserRole, UserPreferences } from '@/types/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    console.log(`--- HITTING /api/users/${params.id}/preferences PUT endpoint ---`);
    try {
        const userId = params.id;
        const body = await request.json();
        const { role, preferences } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        if (!role || !preferences) {
            return NextResponse.json({ error: 'Role and preferences are required' }, { status: 400 });
        }

        const updatedUser = await UserService.updateUser(userId, {
            role: role as UserRole,
            preferences: preferences as UserPreferences,
        });

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found or update failed' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'User preferences updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                role: updatedUser.role,
                preferences: updatedUser.preferences,
            },
        });

    } catch (error: any) {
        console.error('Error updating user preferences:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}