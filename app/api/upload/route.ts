import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

/**
 * POST /api/upload
 * Proxies file uploads to Strapi to avoid CORS issues
 */
export async function POST(request: NextRequest) {
  try {
    // Get authorization header from request (if provided)
    const authHeader = request.headers.get('authorization');
    
    // Build Strapi URL
    const strapiUrl = `${STRAPI_URL}/api/upload`;
    
    // Get the FormData from the request
    const formData = await request.formData();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Upload API] Uploading file to Strapi:', strapiUrl);
    }
    
    // Prepare headers for Strapi request (don't set Content-Type, let fetch set it with boundary)
    const headers: HeadersInit = {};
    
    // Forward authorization header if provided
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // Fetch from Strapi with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for file uploads
    
    let response: Response;
    try {
      response = await fetch(strapiUrl, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('[Upload API] Request timeout');
        return NextResponse.json(
          { error: 'Upload timeout. Please try again.' },
          { status: 504 }
        );
      } else {
        console.error('[Upload API] Network error:', fetchError.message);
        return NextResponse.json(
          { error: 'Network error. Please check if Strapi is running.', message: fetchError.message },
          { status: 503 }
        );
      }
    }
    
    // Parse response
    let responseData: any;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('[Upload API] Failed to parse response:', parseError);
      return NextResponse.json(
        { error: 'Invalid response from Strapi', message: 'Failed to parse response' },
        { status: 500 }
      );
    }
    
    if (!response.ok) {
      console.error(`[Upload API] Strapi error (${response.status}):`, JSON.stringify(responseData, null, 2));
      
      return NextResponse.json(
        {
          error: 'Failed to upload file to Strapi',
          message: responseData.error?.message || responseData.message || `Strapi responded with ${response.status}`,
          details: responseData.error?.details || responseData.error || responseData,
        },
        { status: response.status }
      );
    }
    
    // Return the Strapi response
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error('[Upload API] Error uploading file:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to upload file', 
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

