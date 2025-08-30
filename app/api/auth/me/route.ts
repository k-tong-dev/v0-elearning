import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthToken } from '@/lib/auth-middleware'
import { UserService } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyAuthToken(request)
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get full user details from database
    const user = await UserService.findUserById(authUser.userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider,
        isVerified: user.isVerified,
        preferences: user.preferences,
        subscription: user.subscription
      }
    })

  } catch (error: any) {
    console.error('Get user error:', error)
    
    return NextResponse.json(
      { error: 'Failed to get user information' },
      { status: 500 }
    )
  }
}
