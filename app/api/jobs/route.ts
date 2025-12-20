import { NextRequest, NextResponse } from 'next/server';
import { Job, JobsResponse } from '@/types/career';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

/**
 * GET /api/jobs
 * Fetches jobs from Strapi with optional filters
 * Query parameters:
 * - search: Search in job title
 * - location: Filter by location
 * - jobType: Filter by job type (full-time, part-time, etc.)
 * - department: Filter by department slug
 * - page: Page number for pagination
 * - pageSize: Items per page
 * - jobStatus: Filter by job status (defaults to 'open')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build query parameters for Strapi
    const params = new URLSearchParams();
    
    // Search filter
    if (searchParams.get('search')) {
      params.append('filters[title][$containsi]', searchParams.get('search')!);
    }
    
    // Location filter
    if (searchParams.get('location')) {
      params.append('filters[location][$eq]', searchParams.get('location')!);
    }
    
    // Job type filter
    if (searchParams.get('jobType')) {
      params.append('filters[jobType][$eq]', searchParams.get('jobType')!);
    }
    
    // Job status filter (default to 'open' if not specified, but allow 'all' to fetch all statuses)
    const jobStatus = searchParams.get('jobStatus');
    if (jobStatus && jobStatus !== 'all') {
      params.append('filters[jobStatus][$eq]', jobStatus);
    } else if (!jobStatus || jobStatus === 'open') {
      // Default to 'open' for public pages if not specified or explicitly 'open'
      params.append('filters[jobStatus][$eq]', 'open');
    }
    // If jobStatus === 'all', don't add the filter, which will return all jobs
    
    // Populate department and orgLogo relations (Strapi v5 format)
    params.append('populate', '*');
    
    // Sorting (newest first)
    params.append('sort', 'createdAt:desc');
    
    // Pagination
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '10';
    params.append('pagination[page]', page);
    params.append('pagination[pageSize]', pageSize);
    
    // Build Strapi URL
    const strapiUrl = `${STRAPI_URL}/api/jobs?${params.toString()}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Jobs API] Fetching from Strapi:', strapiUrl);
    }
    
    // Fetch from Strapi with timeout - increased timeout for better reliability
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let response: Response;
    try {
      response = await fetch(strapiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Always fetch fresh data
        next: { revalidate: 0 }, // No caching
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle timeout or network errors
      if (fetchError.name === 'AbortError') {
        console.error('[Jobs API] Request timeout');
      } else {
        console.error('[Jobs API] Network error:', fetchError.message);
      }
      
      // Return empty response on network errors
      return NextResponse.json({
        data: [],
        meta: {
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            pageCount: 0,
            total: 0,
          },
        },
      });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Jobs API] Strapi error (${response.status}):`, errorText);
      
      // If Strapi is not available, return empty response instead of error
      if (response.status === 404 || response.status >= 500) {
        return NextResponse.json({
          data: [],
          meta: {
            pagination: {
              page: parseInt(page),
              pageSize: parseInt(pageSize),
              pageCount: 0,
              total: 0,
            },
          },
        });
      }
      
      return NextResponse.json(
        {
          error: 'Failed to fetch jobs from Strapi',
          message: `Strapi responded with ${response.status}`,
          details: errorText,
        },
        { status: response.status }
      );
    }
    
    let strapiData: any;
    try {
      strapiData = await response.json();
    } catch (parseError) {
      console.error('[Jobs API] Failed to parse Strapi response as JSON');
      return NextResponse.json({
        data: [],
        meta: {
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            pageCount: 0,
            total: 0,
          },
        },
      });
    }
    
    // Validate response structure
    if (!strapiData) {
      console.error('[Jobs API] No response data from Strapi');
      return NextResponse.json({
        data: [],
        meta: {
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            pageCount: 0,
            total: 0,
          },
        },
      });
    }
    
    // Handle both array and object responses from Strapi
    const strapiDataArray = Array.isArray(strapiData.data) 
      ? strapiData.data 
      : (strapiData.data ? [strapiData.data] : []);
    
    if (!strapiDataArray || strapiDataArray.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Jobs API] No jobs found in Strapi response');
      }
      return NextResponse.json({
        data: [],
        meta: strapiData.meta || {
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            pageCount: 0,
            total: 0,
          },
        },
      });
    }
    
    // Transform Strapi response to match our Job interface
    // Handle Strapi v5 format: { data: [{ id, documentId, attributes: {...} }] }
    const jobs: Job[] = strapiDataArray
      .map((item: any) => {
        if (!item) return null;
        
        try {
          // Strapi v5 structure: item has id, documentId, and attributes
          // Handle both v4 (item directly has properties) and v5 (item.attributes)
          const attrs = item.attributes || item;
          const itemId = item.id;
          const itemDocumentId = item.documentId || itemId?.toString();
      
          // Validate required fields
          if (!attrs.title && !item.title) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[Jobs API] Job missing title, skipping:', itemId || itemDocumentId);
            }
            return null;
          }
      
          // Extract jobStatus - check multiple possible locations
          let jobStatusValue: string | undefined = undefined;
          
          // Check in order of likelihood (Strapi v5 uses attributes, v4 might use direct properties)
          if (attrs.jobStatus !== undefined && attrs.jobStatus !== null && attrs.jobStatus !== '') {
            jobStatusValue = String(attrs.jobStatus);
          } else if (item.jobStatus !== undefined && item.jobStatus !== null && item.jobStatus !== '') {
            jobStatusValue = String(item.jobStatus);
          } else if (attrs.status !== undefined && attrs.status !== null && attrs.status !== '') {
            jobStatusValue = String(attrs.status);
          } else if (item.status !== undefined && item.status !== null && item.status !== '') {
            jobStatusValue = String(item.status);
          }
          
          // Normalize job status - handle different casings from Strapi
          const normalizedStatus = jobStatusValue 
            ? String(jobStatusValue).trim().toLowerCase()
            : 'draft';
          
          // Ensure it's one of the valid values
          const finalStatus = (normalizedStatus === 'draft' || normalizedStatus === 'open' || normalizedStatus === 'closed')
            ? normalizedStatus as 'draft' | 'open' | 'closed'
            : 'draft' as 'draft' | 'open' | 'closed';
          
          // Determine numeric ID - prefer numeric id, fallback to parsing documentId if needed
          let numericId: number;
          if (typeof itemId === 'number') {
            numericId = itemId;
          } else if (itemId && !isNaN(Number(itemId))) {
            numericId = Number(itemId);
          } else if (itemDocumentId && !isNaN(Number(itemDocumentId))) {
            numericId = Number(itemDocumentId);
          } else {
            numericId = 0; // Fallback
          }
          
          // Extract orgLogo - handle Strapi v5 structure with data wrapper
          let orgLogoData: any = undefined;
          try {
            const logoNode = attrs.orgLogo?.data || attrs.orgLogo || item.orgLogo?.data || item.orgLogo;
            if (logoNode) {
              // Handle both v4 (direct properties) and v5 (attributes wrapper)
              const logoAttrs = logoNode.attributes || logoNode;
              const logoUrl = logoAttrs?.url || logoAttrs?.formats?.medium?.url || logoAttrs?.formats?.small?.url || '';
              
              if (logoUrl) {
                // Convert relative URL to absolute URL if needed
                const absoluteUrl = logoUrl.startsWith('http') 
                  ? logoUrl 
                  : `${STRAPI_URL}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
                
                orgLogoData = {
                  id: logoNode.id || logoNode.documentId || logoAttrs?.id || 0,
                  url: absoluteUrl,
                  name: logoAttrs?.name || logoAttrs?.alternativeText || logoAttrs?.caption || 'Company logo',
                };
              }
            }
          } catch (logoError) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[Jobs API] Error processing logo:', logoError);
            }
          }
          
          return {
            id: numericId,
            documentId: itemDocumentId || numericId.toString(),
            title: attrs.title || item.title || '',
            slug: attrs.slug || item.slug || '',
            description: attrs.description || item.description || '',
            location: attrs.location || item.location || '',
            jobType: (attrs.jobType || item.jobType || 'full-time') as 'full-time' | 'part-time' | 'contract' | 'internship',
            salaryMin: attrs.salaryMin || item.salaryMin || attrs.salary_min || item.salary_min,
            salaryMax: attrs.salaryMax || item.salaryMax || attrs.salary_max || item.salary_max,
            jobStatus: finalStatus,
            publishedAt: attrs.publishedAt || item.publishedAt || attrs.published_at || item.published_at,
            orgName: attrs.orgName || item.orgName || attrs.org_name || item.org_name,
            orgLogo: orgLogoData,
            createdAt: attrs.createdAt || item.createdAt || attrs.created_at || item.created_at || new Date().toISOString(),
            updatedAt: attrs.updatedAt || item.updatedAt || attrs.updated_at || item.updated_at || new Date().toISOString(),
          };
        } catch (mapError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[Jobs API] Error mapping job item:', mapError, item);
          }
          return null;
        }
      })
      .filter((job: Job | null): job is Job => job !== null); // Remove any null entries
    
    // Return in the same format as the frontend expects
    return NextResponse.json({
      data: jobs,
      meta: strapiData.meta || {
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          pageCount: 0,
          total: 0,
        },
      },
    } as JobsResponse);
    
  } catch (error: any) {
    console.error('[Jobs API] Error fetching jobs:', error);
    
    // Return empty response on error instead of failing
    return NextResponse.json({
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 10,
          pageCount: 0,
          total: 0,
        },
      },
    });
  }
}

/**
 * POST /api/jobs
 * Creates a new job in Strapi
 * Accepts multipart/form-data with:
 * - data[title]: Job title (required)
 * - data[description]: Job description (required)
 * - data[location]: Job location (required)
 * - data[jobType]: Job type (required)
 * - data[jobStatus]: Job status (optional, default: draft)
 * - data[orgName]: Organization name (required)
 * - data[salaryMin]: Minimum salary (optional, integer)
 * - data[salaryMax]: Maximum salary (optional, integer)
 * - files.orgLogo: Organization logo file (required, image)
 */
export async function POST(request: NextRequest) {
  try {
    // Get authorization header from request (required for creating jobs)
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required', message: 'Please log in to create a job posting' },
        { status: 401 }
      );
    }

    // Get the Content-Type header to check if it's multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    
    // Get the raw request body as an ArrayBuffer to preserve the multipart format
    const bodyBuffer = await request.arrayBuffer();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Jobs API] Creating job in Strapi');
      console.log('[Jobs API] Content-Type:', contentType);
      console.log('[Jobs API] Body size:', bodyBuffer.byteLength, 'bytes');
    }
    
    // Build Strapi URL
    const strapiUrl = `${STRAPI_URL}/api/jobs`;
    
    // Prepare headers for Strapi request
    // Preserve the Content-Type header with boundary from the original request
    const headers: HeadersInit = {
      'Authorization': authHeader,
      'Content-Type': contentType, // Preserve Content-Type with boundary
    };
    
    // Fetch from Strapi with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for file uploads
    
    let response: Response;
    try {
      response = await fetch(strapiUrl, {
        method: 'POST',
        headers,
        body: bodyBuffer, // Forward the raw body buffer to preserve multipart format
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('[Jobs API] Request timeout');
        return NextResponse.json(
          { error: 'Request timeout. Please try again.' },
          { status: 504 }
        );
      } else {
        console.error('[Jobs API] Network error:', fetchError.message);
        return NextResponse.json(
          { error: 'Network error. Please check if Strapi is running.', message: fetchError.message },
          { status: 503 }
        );
      }
    }
    
    // Try to parse response as JSON, but handle errors
    let responseData: any;
    try {
      const responseText = await response.text();
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('[Jobs API] Failed to parse response:', parseError);
      return NextResponse.json(
        { error: 'Invalid response from Strapi', message: 'Failed to parse response' },
        { status: 500 }
      );
    }
    
    if (!response.ok) {
      console.error(`[Jobs API] Strapi error (${response.status}):`, JSON.stringify(responseData, null, 2));
      
      return NextResponse.json(
        {
          error: 'Failed to create job in Strapi',
          message: responseData.error?.message || responseData.message || `Strapi responded with ${response.status}`,
          details: responseData.error?.details || responseData.error || responseData,
          fullResponse: process.env.NODE_ENV === 'development' ? responseData : undefined,
        },
        { status: response.status }
      );
    }
    
    // Return the Strapi response
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error('[Jobs API] Error creating job:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create job', 
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

