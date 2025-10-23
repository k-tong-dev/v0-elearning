import { NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function GET() {
    console.log('Initiating Google OAuth via Strapi:', `${STRAPI_URL}/api/connect/google`);
    return NextResponse.redirect(`${STRAPI_URL}/api/connect/google`);
}