import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/auth'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { credential, clientId } = body

    if (!credential) {
      return NextResponse.json(
        { error: 'Google credential is required' },
        { status: 400 }
      )
    }

    // Verify Google JWT token
    // In a real implementation, you would verify the token with Google
    // For now, we'll decode it (NOT SECURE - just for demo)
    const base64Payload = credential.split('.')[1]
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString())

    // Mock Google profile (replace with actual Google token verification)
    const googleProfile = {
      sub: payload.sub || 'mock-google-id',
      email: payload.email || 'user@example.com',
      name: payload.name || 'Google User',
      picture: payload.picture || ''
    }

    // Find or create user
    const user = await UserService.findOrCreateGoogleUser(googleProfile)

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        name: user.name,
        provider: 'google'
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Set cookie and return response
    const response = NextResponse.json({
      message: 'Google authentication successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider
      },
      token
    })

    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response

  } catch (error: any) {
    console.error('Google authentication error:', error)
    
    return NextResponse.json(
      { error: 'Failed to authenticate with Google' },
      { status: 500 }
    )
  }
}

// Handle Google OAuth redirect
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/?error=google_auth_failed', request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=missing_code', request.url))
  }

  try {
    // Exchange code for tokens (implement based on your Google OAuth setup)
    // This is a placeholder - implement actual Google OAuth flow
    
    return NextResponse.redirect(new URL('/dashboard?success=google_auth', request.url))
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(new URL('/?error=google_auth_callback_failed', request.url))
  }
}
