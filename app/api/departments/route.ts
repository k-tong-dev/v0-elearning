import { NextRequest, NextResponse } from 'next/server';
import { Department } from '@/types/career';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

/**
 * GET /api/departments
 * Fetches all departments from Strapi
 */
export async function GET(request: NextRequest) {
  try {
    // Build Strapi URL with pagination
    const params = new URLSearchParams();
    params.append('pagination[pageSize]', '100');
    params.append('sort', 'name:asc');
    
    const strapiUrl = `${STRAPI_URL}/api/departments?${params.toString()}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Departments API] Fetching from Strapi:', strapiUrl);
    }
    
    // Fetch from Strapi with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    let response: Response;
    try {
      response = await fetch(strapiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('[Departments API] Request timeout');
      } else {
        console.error('[Departments API] Network error:', fetchError.message);
      }
      
      return NextResponse.json({ data: [] });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Departments API] Strapi error (${response.status}):`, errorText);
      
      return NextResponse.json({ data: [] });
    }
    
    const strapiData = await response.json();
    
    // Transform Strapi response to match our Department interface
    const departments: Department[] = (strapiData.data || []).map((item: any) => {
      const attrs = item.attributes || item;
      
      return {
        id: typeof (item.id || item.documentId) === 'number' 
          ? (item.id || item.documentId) 
          : parseInt(String(item.id || item.documentId || 0)),
        documentId: item.documentId || item.id?.toString(),
        name: attrs.name || '',
        description: attrs.description || '',
        slug: attrs.slug || '',
      };
    });
    
    return NextResponse.json({ data: departments });
    
  } catch (error: any) {
    console.error('[Departments API] Error fetching departments:', error);
    return NextResponse.json({ data: [] });
  }
}
