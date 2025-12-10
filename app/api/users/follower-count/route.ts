import { NextRequest, NextResponse } from 'next/server';
import { getUserFollowerCount, getUserFollowingCount } from '@/integrations/strapi/user';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        const [followers, following] = await Promise.all([
            getUserFollowerCount(userId),
            getUserFollowingCount(userId)
        ]);

        return NextResponse.json({ followers, following });
    } catch (error: any) {
        console.error('Error fetching follower counts:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch follower counts' },
            { status: 500 }
        );
    }
}

