import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/cookies';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

/**
 * Track career page visits
 * POST /api/career/track-visit
 */
export async function POST(request: NextRequest) {
  try {
    const { pathname, userId, timestamp } = await request.json();

    // Verify user is authenticated
    const token = getAccessToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user matches the userId in request
    const userResponse = await fetch(`${STRAPI_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = await userResponse.json();
    if (String(currentUser.id) !== String(userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Log the visit (you can store this in a database if needed)
    console.log('[Career Visit]', {
      userId,
      pathname,
      timestamp,
      userEmail: currentUser.email,
    });

    // Optionally: Store in Strapi or analytics service
    // For now, we'll just log it
    // You can create a "career-visit" content type in Strapi if needed

    return NextResponse.json({
      success: true,
      message: 'Visit tracked',
    });
  } catch (error: any) {
    console.error('Error tracking career visit:', error);
    return NextResponse.json(
      { error: 'Failed to track visit' },
      { status: 500 }
    );
  }
}

