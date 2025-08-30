import { NextRequest, NextResponse } from 'next/server'
import { UserService, verifyPassword } from '@/lib/auth'
import { createAuthResponse } from '@/lib/auth-middleware'
import jwt from 'jsonwebtoken'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await UserService.findUserByEmail(email.toLowerCase())
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const userWithPassword = user as any
    if (!userWithPassword.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const isPasswordValid = await verifyPassword(password, userWithPassword.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider || 'email'
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Remove password from response
    const { password: _, ...userResponse } = userWithPassword
    
    return createAuthResponse(userResponse, token)

  } catch (error: any) {
    console.error('Login error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
