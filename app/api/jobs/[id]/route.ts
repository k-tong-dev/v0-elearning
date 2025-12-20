import { NextRequest, NextResponse } from 'next/server';
import { Job } from '@/types/career';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

/**
 * GET /api/jobs/[id]
 * Fetches a single job by ID from Strapi
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Check if it's a documentId (UUID format) or numeric ID
    // documentIds in Strapi v5 are UUIDs (e.g., "550e8400-e29b-41d4-a716-446655440000")
    // Numeric IDs are simple numbers (e.g., "1", "123")
    const isNumericId = /^\d+$/.test(jobId);
    const isDocumentId = !isNumericId; // If it's not numeric, assume it's a documentId (UUID)
    
    // Build Strapi URL - use documentId filter if it's a documentId, otherwise use direct ID
    const strapiUrl = isDocumentId 
      ? `${STRAPI_URL}/api/jobs?filters[documentId][$eq]=${encodeURIComponent(jobId)}&populate=*`
      : `${STRAPI_URL}/api/jobs/${jobId}?populate=*`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Job API] Fetching from Strapi:', strapiUrl, 'isDocumentId:', isDocumentId);
    }
    
    // Get authorization header from request (if provided)
    const authHeader = request.headers.get('authorization');
    
    // Fetch from Strapi with timeout - increased timeout for better reliability
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Forward authorization header if provided
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    let response: Response;
    try {
      response = await fetch(strapiUrl, {
        method: 'GET',
        headers,
        cache: 'no-store',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('[Job API] Request timeout');
      } else {
        console.error('[Job API] Network error:', fetchError.message);
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch job from Strapi', message: fetchError.message },
        { status: 500 }
      );
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Job API] Strapi error (${response.status}):`, errorText);
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch job from Strapi', message: errorText },
        { status: response.status }
      );
    }
    
    let strapiData: any;
    try {
      strapiData = await response.json();
    } catch (parseError) {
      console.error('[Job API] Failed to parse Strapi response as JSON');
      return NextResponse.json(
        { error: 'Invalid response from Strapi' },
        { status: 500 }
      );
    }
    
    // Transform Strapi response to match our Job interface
    // If we queried by documentId, the response is an array with data[0]
    // If we queried by ID, the response has data object directly
    let rawJob: any;
    if (isDocumentId && Array.isArray(strapiData.data) && strapiData.data.length > 0) {
      rawJob = strapiData.data[0];
    } else if (!isDocumentId && strapiData.data) {
      rawJob = strapiData.data;
    } else {
      console.error('[Job API] No job data in response:', strapiData);
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    if (!rawJob) {
      console.error('[Job API] No job data in response:', strapiData);
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    try {
      // Handle both Strapi v4 (direct properties) and v5 (attributes wrapper)
      const attrs = rawJob.attributes || rawJob;
      const rawJobId = rawJob.id;
      const rawJobDocumentId = rawJob.documentId || rawJobId?.toString();
    
      // Extract jobStatus - check multiple possible locations
      let jobStatusValue: string | undefined = undefined;
      
      if (attrs.jobStatus !== undefined && attrs.jobStatus !== null && attrs.jobStatus !== '') {
        jobStatusValue = String(attrs.jobStatus);
      } else if (rawJob.jobStatus !== undefined && rawJob.jobStatus !== null && rawJob.jobStatus !== '') {
        jobStatusValue = String(rawJob.jobStatus);
      } else if (attrs.status !== undefined && attrs.status !== null && attrs.status !== '') {
        jobStatusValue = String(attrs.status);
      } else if (rawJob.status !== undefined && rawJob.status !== null && rawJob.status !== '') {
        jobStatusValue = String(rawJob.status);
      }
      
      // Normalize job status
      const normalizedStatus = jobStatusValue 
        ? jobStatusValue.toString().trim().toLowerCase()
        : 'draft';
      
      const finalStatus = (normalizedStatus === 'draft' || normalizedStatus === 'open' || normalizedStatus === 'closed')
        ? normalizedStatus as 'draft' | 'open' | 'closed'
        : 'draft' as 'draft' | 'open' | 'closed';
      
      // Determine numeric ID - prefer numeric id, fallback to parsing documentId if needed
      let numericId: number;
      if (typeof rawJobId === 'number') {
        numericId = rawJobId;
      } else if (rawJobId && !isNaN(Number(rawJobId))) {
        numericId = Number(rawJobId);
      } else if (rawJobDocumentId && !isNaN(Number(rawJobDocumentId))) {
        numericId = Number(rawJobDocumentId);
      } else {
        numericId = 0; // Fallback
      }
      
      // Extract orgLogo - handle Strapi v5 structure with data wrapper
      let orgLogoData: any = undefined;
      try {
        const logoNode = attrs.orgLogo?.data || attrs.orgLogo || rawJob.orgLogo?.data || rawJob.orgLogo;
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
          console.warn('[Job API] Error processing logo:', logoError);
        }
      }
    
      const job: Job = {
        id: numericId,
        documentId: rawJobDocumentId || numericId.toString(),
        title: attrs.title || rawJob.title || '',
        slug: attrs.slug || rawJob.slug || '',
        description: attrs.description || rawJob.description || '',
        location: attrs.location || rawJob.location || '',
        jobType: (attrs.jobType || rawJob.jobType || 'full-time') as 'full-time' | 'part-time' | 'contract' | 'internship',
        salaryMin: attrs.salaryMin || rawJob.salaryMin || attrs.salary_min || rawJob.salary_min,
        salaryMax: attrs.salaryMax || rawJob.salaryMax || attrs.salary_max || rawJob.salary_max,
        jobStatus: finalStatus,
        publishedAt: attrs.publishedAt || rawJob.publishedAt || attrs.published_at || rawJob.published_at,
        orgName: attrs.orgName || rawJob.orgName || attrs.org_name || rawJob.org_name,
        orgLogo: orgLogoData,
        createdAt: attrs.createdAt || rawJob.createdAt || attrs.created_at || rawJob.created_at || new Date().toISOString(),
        updatedAt: attrs.updatedAt || rawJob.updatedAt || attrs.updated_at || rawJob.updated_at || new Date().toISOString(),
      };
    
      return NextResponse.json({ data: job });
    } catch (mapError) {
      console.error('[Job API] Error mapping job data:', mapError, rawJob);
      return NextResponse.json(
        { error: 'Failed to process job data', message: mapError instanceof Error ? mapError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('[Job API] Error fetching job:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch job', 
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/jobs/[id]
 * Updates an existing job in Strapi
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body = await request.json();
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }
    
    // Get authorization header from request (required for updates)
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }
    
    // Build Strapi URL
    const strapiUrl = `${STRAPI_URL}/api/jobs/${jobId}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Job API] Updating job in Strapi:', strapiUrl);
    }
    
    // Prepare headers for Strapi request
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    };
    
    // Fetch from Strapi with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    let response: Response;
    try {
      response = await fetch(strapiUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('[Job API] Request timeout');
        return NextResponse.json(
          { error: 'Request timeout. Please try again.' },
          { status: 504 }
        );
      } else {
        console.error('[Job API] Network error:', fetchError.message);
        return NextResponse.json(
          { error: 'Network error. Please check if Strapi is running.', message: fetchError.message },
          { status: 503 }
        );
      }
    }
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error(`[Job API] Strapi error (${response.status}):`, responseData);
      
      return NextResponse.json(
        {
          error: 'Failed to update job in Strapi',
          message: responseData.error?.message || responseData.message || `Strapi responded with ${response.status}`,
          details: responseData.error?.details || responseData,
        },
        { status: response.status }
      );
    }
    
    // Return the Strapi response
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error('[Job API] Error updating job:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update job', 
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

