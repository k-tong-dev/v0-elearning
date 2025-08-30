import { NextRequest, NextResponse } from 'next/server'
import { UserService, hashPassword } from '@/lib/auth'
import { createAuthResponse } from '@/lib/auth-middleware'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await UserService.createUser({
      email: email.toLowerCase(),
      name,
      provider: 'email',
      isVerified: false,
      // Store hashed password (you might want to add this field to the User interface)
      password: hashedPassword
    } as any)

    // Generate JWT token to automatically log user in
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
    const { password: _, ...userResponse } = user as any
    
    return createAuthResponse(userResponse, token)

  } catch (error: any) {
    console.error('Registration error:', error)
    
    if (error.message === 'User already exists with this email') {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
