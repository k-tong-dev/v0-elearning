import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export interface AuthUser {
  userId: string
  email: string
  name: string
  provider: string
}

export async function verifyAuthToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    ) as any

    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      provider: decoded.provider || 'email'
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
