import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { UserRole, UserSettings } from '@/types/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    // Explicitly await params to resolve the proxy object if necessary
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.id;
    console.log(`--- STARTING /api/users/${userId}/profile PUT endpoint ---`);
    try {
        if (!userId || !ObjectId.isValid(userId)) {
            console.error(`--- /api/users/${userId}/profile: Invalid User ID format ---`);
            return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
        }

        let body;
        try {
            body = await request.json();
        } catch (jsonError: any) {
            console.error(`--- /api/users/${userId}/profile: Failed to parse JSON body ---`, jsonError);
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }

        console.log(`--- /api/users/${userId}/profile: Request body received ---`, body);

        const { name, email, bio, location, website, socialLinks, role, avatar, settings, skills, badgeIds } = body; // Add badgeIds

        // Fetch current user to merge settings and profile correctly
        const existingUser = await UserService.findUserById(userId);
        if (!existingUser) {
            console.error(`--- /api/users/${userId}/profile: User not found for update ---`);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updateData: { [key: string]: any } = { updatedAt: new Date() };
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;

        // Merge existing profile with new data
        updateData.profile = {
            ...existingUser.profile, // Preserve existing profile fields
            bio: bio !== undefined ? bio : existingUser.profile?.bio,
            location: location !== undefined ? location : existingUser.profile?.location,
            website: website !== undefined ? website : existingUser.profile?.website,
            social: socialLinks !== undefined ? socialLinks : existingUser.profile?.social,
        };

        // Update top-level fields
        if (role !== undefined) updateData.role = role as UserRole;
        if (avatar !== undefined) updateData.avatar = avatar;

        // Merge existing settings with new data, including skills
        updateData.settings = {
            ...existingUser.settings, // Preserve existing settings
            ...settings, // Overwrite with new settings if provided
            skills: skills !== undefined ? skills : existingUser.settings?.skills, // Explicitly handle skills
        };

        // Explicitly handle badgeIds
        if (badgeIds !== undefined) updateData.badgeIds = badgeIds;

        console.log(`--- /api/users/${userId}/profile: Constructed updateData ---`, updateData);

        const updatedUser = await UserService.updateUser(userId, updateData);

        if (!updatedUser) {
            console.error(`--- /api/users/${userId}/profile: User not found or update failed in DB ---`);
            return NextResponse.json({ error: 'User not found or update failed' }, { status: 404 });
        }

        console.log(`--- /api/users/${userId}/profile: User updated successfully ---`, updatedUser);

        return NextResponse.json({
            message: 'User profile updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                avatar: updatedUser.avatar,
                role: updatedUser.role,
                profile: updatedUser.profile,
                settings: updatedUser.settings,
                badgeIds: updatedUser.badgeIds, // Include badgeIds in the response
            },
        });

    } catch (error: any) {
        console.error('--- /api/users/[id]/profile: UNEXPECTED ERROR during profile update ---', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error during profile update' },
            { status: 500 }
        );
    }
}