import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export interface AuthUser {
  userId: string
  id: string  // Alias for userId for compatibility
  email: string
  name: string
  provider: string
}

export async function verifyAuthToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    // First try legacy auth-token cookie
    const legacyToken = request.cookies.get('auth-token')?.value
    if (legacyToken) {
      try {
        const decoded = jwt.verify(
          legacyToken,
          process.env.NEXTAUTH_SECRET || 'fallback-secret'
        ) as any

        return {
          userId: decoded.userId,
          id: decoded.userId, // Alias for compatibility
          email: decoded.email,
          name: decoded.name,
          provider: decoded.provider || 'email'
        }
      } catch (error) {
        // Legacy token invalid, continue to Strapi token check
      }
    }

    // Try Strapi access_token cookie
    const accessTokenCookie = request.cookies.get('access_token')?.value
    if (!accessTokenCookie) {
      return null
    }

    // Parse Strapi token (may be JSON with token and expiry, or plain string)
    let strapiToken: string
    try {
      const parsed = JSON.parse(accessTokenCookie)
      if (parsed.token && Date.now() < parsed.expiry) {
        strapiToken = parsed.token
      } else {
        return null // Token expired
      }
    } catch {
      // Not JSON, use as plain string
      strapiToken = accessTokenCookie
    }

    if (!strapiToken) {
      return null
    }

    // Verify token with Strapi by calling /api/users/me
    const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'
    const userResponse = await fetch(`${STRAPI_URL}/api/users/me?populate=*`, {
      headers: {
        'Authorization': `Bearer ${strapiToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!userResponse.ok) {
      return null
    }

    const strapiUser = await userResponse.json()

    const userId = strapiUser.id?.toString() || ''
    return {
      userId,
      id: userId, // Alias for compatibility
      email: strapiUser.email || '',
      name: strapiUser.name || strapiUser.username || strapiUser.email || '',
      provider: 'strapi'
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export function withAuth(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await verifyAuthToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return handler(request, user)
  }
}

export function createAuthResponse(user: any, token: string) {
  const response = NextResponse.json({
    message: 'Authentication successful',
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
    maxAge: 60 * 60 * 24 * 7
  })

  return response
}
