import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-middleware';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function GET(request: NextRequest) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const response = await fetch(`${STRAPI_URL}/users/me`, {
    headers: { Authorization: `Bearer ${request.cookies.get('auth-token')?.value}` },
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }

  return NextResponse.json({ user: { ...data, id: data.id.toString() } });
}