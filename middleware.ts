import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Configure headers to allow Google Sign-In cross-origin communication
  // This fixes the Cross-Origin-Opener-Policy error with Google Sign-In
  response.headers.set(
    'Cross-Origin-Opener-Policy',
    'same-origin-allow-popups'
  )
  
  // Also set COEP to allow Google's resources
  response.headers.set(
    'Cross-Origin-Embedder-Policy',
    'unsafe-none'
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
