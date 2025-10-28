import { NextResponse } from 'next/server';

const NEXT_PUBLIC_STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export async function GET() {
    console.log('Initiating Google OAuth via Strapi:', `${NEXT_PUBLIC_STRAPI_URL}/api/connect/google`);
    return NextResponse.redirect(`${NEXT_PUBLIC_STRAPI_URL}/api/connect/google`);
}