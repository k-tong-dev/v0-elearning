// Updated file: app/api/auth/login/route.ts
// (Kept the route as is)
import { NextRequest, NextResponse } from 'next/server';
import { createAuthResponse } from '@/lib/auth-middleware';

const NEXT_PUBLIC_STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const response = await fetch(`${NEXT_PUBLIC_STRAPI_URL}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Login failed');
    }

    return createAuthResponse(data.user, data.jwt);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}