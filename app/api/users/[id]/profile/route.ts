import { NextRequest, NextResponse } from 'next/server';
import { strapi, strapiPublic } from '@/integrations/strapi/client';
import { getAccessToken } from '@/lib/cookies';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    // Explicitly await params to resolve the proxy object if necessary
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.id;
    console.log(`--- STARTING /api/users/${userId}/profile PUT endpoint ---`);
    
    try {
        // Validate userId is a number
        if (!userId || isNaN(Number(userId))) {
            console.error(`--- /api/users/${userId}/profile: Invalid User ID format ---`);
            return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
        }

        // Get access token from cookies
        const accessToken = getAccessToken();
        if (!accessToken) {
            console.error(`--- /api/users/${userId}/profile: No access token found ---`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let body;
        try {
            body = await request.json();
        } catch (jsonError: any) {
            console.error(`--- /api/users/${userId}/profile: Failed to parse JSON body ---`, jsonError);
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }

        console.log(`--- /api/users/${userId}/profile: Request body received ---`, body);

        const { name, email, bio, location, website, socialLinks, role, avatar, settings, skills, badgeIds, username, preferences } = body;

        // Fetch current user from Strapi
        const userResponse = await strapiPublic.get(`/api/users/${userId}?populate=*`);
        const existingUser = userResponse.data;
        
        if (!existingUser) {
            console.error(`--- /api/users/${userId}/profile: User not found for update ---`);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prepare update data for Strapi
        const updateData: any = {};
        
        // Update username if provided
        if (username !== undefined) updateData.username = username;
        if (email !== undefined) updateData.email = email;
        
        // Update avatar
        if (avatar !== undefined) updateData.avatar = avatar;
        
        // Update role if provided
        if (role !== undefined) updateData.role = role;
        
        // Merge preferences (settings, skills, etc.)
        if (preferences !== undefined || settings !== undefined || skills !== undefined) {
            updateData.preferences = {
                ...existingUser.preferences,
                ...(preferences || {}),
                ...(settings ? { settings } : {}),
                ...(skills ? { skills } : {}),
            };
        }
        
        // Store profile information in preferences or custom fields
        if (bio !== undefined || location !== undefined || website !== undefined || socialLinks !== undefined) {
            updateData.preferences = {
                ...updateData.preferences,
                bio: bio !== undefined ? bio : existingUser.preferences?.bio,
                location: location !== undefined ? location : existingUser.preferences?.location,
                website: website !== undefined ? website : existingUser.preferences?.website,
                socialLinks: socialLinks !== undefined ? socialLinks : existingUser.preferences?.socialLinks,
            };
        }

        console.log(`--- /api/users/${userId}/profile: Constructed updateData ---`, updateData);

        // Update user in Strapi
        const updateResponse = await strapi.put(
            `/api/users/${userId}`,
            updateData,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        const updatedUser = updateResponse.data;
        
        if (!updatedUser) {
            console.error(`--- /api/users/${userId}/profile: User not found or update failed in Strapi ---`);
            return NextResponse.json({ error: 'User not found or update failed' }, { status: 404 });
        }

        console.log(`--- /api/users/${userId}/profile: User updated successfully ---`, updatedUser);

        return NextResponse.json({
            message: 'User profile updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                username: updatedUser.username,
                name: updatedUser.username || updatedUser.email,
                avatar: updatedUser.avatar,
                role: updatedUser.role,
                preferences: updatedUser.preferences,
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