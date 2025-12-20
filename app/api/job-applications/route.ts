import { NextRequest, NextResponse } from 'next/server';
import { JobApplication } from '@/types/career';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

/**
 * GET /api/job-applications
 * Fetches job applications from Strapi with optional filters
 * Query parameters:
 * - job: Filter by job ID
 * - applyStatus: Filter by application status
 * - page: Page number for pagination
 * - pageSize: Items per page
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build query parameters for Strapi
    const params = new URLSearchParams();
    
    // Job filter
    if (searchParams.get('job')) {
      params.append('filters[job][id][$eq]', searchParams.get('job')!);
    }
    
    // ApplyStatus filter
    if (searchParams.get('applyStatus')) {
      params.append('filters[applyStatus][$eq]', searchParams.get('applyStatus')!);
    }
    
    // Email filter (for filtering by user's email)
    if (searchParams.get('email')) {
      params.append('filters[email][$eq]', searchParams.get('email')!);
    }
    
    // Populate relations - use wildcard to populate all relations including resume media
    params.append('populate', '*');
    
    // Sorting (newest first)
    params.append('sort', 'createdAt:desc');
    
    // Pagination
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '25';
    params.append('pagination[page]', page);
    params.append('pagination[pageSize]', pageSize);
    
    // Build Strapi URL
    const strapiUrl = `${STRAPI_URL}/api/job-applications?${params.toString()}`;
    
    console.log('[Job Applications API] GET request received');
    console.log('[Job Applications API] Strapi URL:', strapiUrl);
    console.log('[Job Applications API] STRAPI_URL env:', STRAPI_URL);
    
    // Fetch from Strapi with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    let response: Response;
    try {
      response = await fetch(strapiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        next: { revalidate: 0 },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('[Job Applications API] Request timeout');
      } else {
        console.error('[Job Applications API] Network error:', fetchError.message);
      }
      
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
      console.error(`[Job Applications API] Strapi error (${response.status}):`, errorText);
      console.error(`[Job Applications API] Error details:`, {
        status: response.status,
        statusText: response.statusText,
        url: strapiUrl,
        errorBody: errorText,
      });
      
      // Return error response with details for debugging
      return NextResponse.json(
        {
          error: 'Failed to fetch job applications from Strapi',
          message: `Strapi responded with ${response.status}: ${response.statusText}`,
          details: errorText,
          data: [],
          meta: {
            pagination: {
              page: parseInt(page),
              pageSize: parseInt(pageSize),
              pageCount: 0,
              total: 0,
            },
          },
        },
        { status: response.status }
      );
    }
    
    const strapiData = await response.json();
    console.log('[Job Applications API] Strapi response received:', {
      hasData: !!strapiData.data,
      dataLength: strapiData.data?.length || 0,
      hasMeta: !!strapiData.meta,
    });
    
    // Transform Strapi response to match our JobApplication interface
    const applications: JobApplication[] = (strapiData.data || []).map((item: any) => {
      const attrs = item.attributes || item;
      
      // Debug: Log resume data structure
      if (attrs.resume) {
        console.log('[Job Applications API] Resume data structure:', JSON.stringify(attrs.resume, null, 2));
      }
      
      // Helper function to extract resume URL from various Strapi formats
      const getResumeUrl = (resumeField: any): { url: string; name: string; id: number } | undefined => {
        if (!resumeField) return undefined;
        
        // Try different structures that Strapi might use
        let resumeData = resumeField.data || resumeField;
        let resumeAttrs = resumeData?.attributes || resumeData;
        
        // Handle array case (shouldn't happen for single file, but just in case)
        if (Array.isArray(resumeData)) {
          resumeData = resumeData[0];
          resumeAttrs = resumeData?.attributes || resumeData;
        }
        
        if (!resumeData && !resumeAttrs) return undefined;
        
        // Try to get URL from various possible locations
        let resumeUrl = resumeAttrs?.url || 
                       resumeData?.url || 
                       resumeAttrs?.formats?.large?.url ||
                       resumeAttrs?.formats?.medium?.url ||
                       resumeAttrs?.formats?.small?.url ||
                       resumeAttrs?.formats?.thumbnail?.url;
        
        // If still no URL, try direct access
        if (!resumeUrl && typeof resumeData === 'object') {
          resumeUrl = (resumeData as any).url;
        }
        
        if (!resumeUrl) {
          console.warn('[Job Applications API] No resume URL found in structure:', JSON.stringify(resumeField, null, 2));
          return undefined;
        }
        
        // If URL is relative, prepend Strapi base URL
        if (!resumeUrl.startsWith('http')) {
          resumeUrl = resumeUrl.startsWith('/') 
            ? `${STRAPI_URL}${resumeUrl}` 
            : `${STRAPI_URL}/${resumeUrl}`;
        }
        
        const resumeId = resumeData?.id || resumeData?.documentId || resumeAttrs?.id || 0;
        const resumeName = resumeAttrs?.name || resumeData?.name || resumeAttrs?.filename || 'resume.pdf';
        
        return {
          id: typeof resumeId === 'number' ? resumeId : parseInt(String(resumeId || 0)),
          url: resumeUrl,
          name: resumeName,
        };
      };
      
      return {
        id: typeof (item.id || item.documentId) === 'number'
          ? (item.id || item.documentId)
          : parseInt(String(item.id || item.documentId || 0)),
        documentId: item.documentId || item.id?.toString(),
        fullName: attrs.fullName || '',
        email: attrs.email || '',
        phone: attrs.phone,
        resume: getResumeUrl(attrs.resume),
        coverLetter: attrs.coverLetter,
        portfolioUrl: attrs.portfolioUrl,
        applyStatus: (attrs.applyStatus || attrs.status || 'new') as 'new' | 'review' | 'shortlisted' | 'rejected' | 'hired',
        job: attrs.job?.data
          ? {
              id: attrs.job.data.id || attrs.job.data.documentId,
              documentId: attrs.job.data.documentId || attrs.job.data.id?.toString(),
              title: attrs.job.data.attributes?.title || attrs.job.data.title || '',
              slug: attrs.job.data.attributes?.slug || attrs.job.data.slug || '',
              description: attrs.job.data.attributes?.description || attrs.job.data.description || '',
              location: attrs.job.data.attributes?.location || attrs.job.data.location || '',
              jobType: (attrs.job.data.attributes?.jobType || attrs.job.data.jobType || 'full-time') as 'full-time' | 'part-time' | 'contract' | 'internship',
              jobStatus: (attrs.job.data.attributes?.jobStatus || attrs.job.data.jobStatus || 'draft') as 'draft' | 'open' | 'closed',
            }
          : undefined,
        createdAt: attrs.createdAt || attrs.created_at || new Date().toISOString(),
        updatedAt: attrs.updatedAt || attrs.updated_at || new Date().toISOString(),
      };
    });
    
    console.log('[Job Applications API] Returning applications:', {
      count: applications.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
    
    return NextResponse.json({
      data: applications,
      meta: strapiData.meta || {
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          pageCount: 0,
          total: 0,
        },
      },
    });
    
  } catch (error: any) {
    console.error('[Job Applications API] Error fetching applications:', error);
    console.error('[Job Applications API] Error stack:', error.stack);
    console.error('[Job Applications API] Error details:', {
      name: error.name,
      message: error.message,
      cause: error.cause,
    });
    
    return NextResponse.json(
      {
        error: 'Failed to fetch job applications',
        message: error.message || 'An unexpected error occurred',
        data: [],
        meta: {
          pagination: {
            page: 1,
            pageSize: 25,
            pageCount: 0,
            total: 0,
          },
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/job-applications
 * Submits a job application to Strapi
 * Accepts multipart/form-data with:
 * - data: JSON string containing application fields (fullName, email, phone, coverLetter, portfolioUrl, job)
 * - files.resume: Resume file (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Get the Content-Type header to preserve the multipart boundary
    const contentType = request.headers.get('content-type') || '';
    
    // Get the raw request body as an ArrayBuffer to preserve the multipart format
    // IMPORTANT: Read body only once - cannot read both formData() and arrayBuffer()
    const bodyBuffer = await request.arrayBuffer();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Job Applications API] POST request received');
      console.log('[Job Applications API] Content-Type:', contentType);
      console.log('[Job Applications API] Body size:', bodyBuffer.byteLength, 'bytes');
    }
    
    // Forward the form data to Strapi
    const strapiUrl = `${STRAPI_URL}/api/job-applications`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Job Applications API] Forwarding to Strapi:', strapiUrl);
    }
    
    // Fetch from Strapi with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for file uploads
    
    let response: Response;
    try {
      // Forward the request body directly to Strapi, preserving the multipart format
      response = await fetch(strapiUrl, {
        method: 'POST',
        headers: {
          // Preserve the Content-Type header with boundary from the original request
          'Content-Type': contentType,
        },
        body: bodyBuffer, // Forward the body buffer directly
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle timeout or network errors
      if (fetchError.name === 'AbortError') {
        console.error('[Job Applications API] Request timeout');
        return NextResponse.json(
          {
            error: 'Request timeout',
            message: 'The request took too long. Please check your connection and try again.',
          },
          { status: 408 }
        );
      } else {
        console.error('[Job Applications API] Network error:', fetchError.message);
        return NextResponse.json(
          {
            error: 'Network error',
            message: 'Network error. Please ensure Strapi is running and try again.',
          },
          { status: 503 }
        );
      }
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      console.error(`[Job Applications API] Strapi error (${response.status}):`, errorData);
      
      return NextResponse.json(
        {
          error: 'Failed to submit application',
          message: errorData?.error?.message || errorData?.message || `Strapi responded with ${response.status}`,
          details: errorData,
        },
        { status: response.status }
      );
    }
    
    const strapiData = await response.json();
    
    // Transform Strapi response to match our JobApplication interface
    const applicationData = strapiData.data || strapiData;
    const attrs = applicationData.attributes || applicationData;
    
    // Helper function to extract resume URL from various Strapi formats
    const getResumeUrl = (resumeField: any): { url: string; name: string; id: number } | undefined => {
      if (!resumeField) return undefined;
      
      let resumeData = resumeField.data || resumeField;
      let resumeAttrs = resumeData?.attributes || resumeData;
      
      if (Array.isArray(resumeData)) {
        resumeData = resumeData[0];
        resumeAttrs = resumeData?.attributes || resumeData;
      }
      
      if (!resumeData && !resumeAttrs) return undefined;
      
      let resumeUrl = resumeAttrs?.url || 
                     resumeData?.url || 
                     resumeAttrs?.formats?.large?.url ||
                     resumeAttrs?.formats?.medium?.url ||
                     resumeAttrs?.formats?.small?.url ||
                     resumeAttrs?.formats?.thumbnail?.url;
      
      if (!resumeUrl && typeof resumeData === 'object') {
        resumeUrl = (resumeData as any).url;
      }
      
      if (!resumeUrl) return undefined;
      
      if (!resumeUrl.startsWith('http')) {
        resumeUrl = resumeUrl.startsWith('/') 
          ? `${STRAPI_URL}${resumeUrl}` 
          : `${STRAPI_URL}/${resumeUrl}`;
      }
      
      const resumeId = resumeData?.id || resumeData?.documentId || resumeAttrs?.id || 0;
      const resumeName = resumeAttrs?.name || resumeData?.name || resumeAttrs?.filename || 'resume.pdf';
      
      return {
        id: typeof resumeId === 'number' ? resumeId : parseInt(String(resumeId || 0)),
        url: resumeUrl,
        name: resumeName,
      };
    };
    
    const application: JobApplication = {
      id: typeof (applicationData.id || applicationData.documentId) === 'number'
        ? (applicationData.id || applicationData.documentId)
        : parseInt(String(applicationData.id || applicationData.documentId || 0)),
      documentId: applicationData.documentId || applicationData.id?.toString(),
      fullName: attrs.fullName || '',
      email: attrs.email || '',
      phone: attrs.phone,
      resume: getResumeUrl(attrs.resume),
      coverLetter: attrs.coverLetter,
      portfolioUrl: attrs.portfolioUrl,
      applyStatus: (attrs.applyStatus || attrs.status || 'new') as 'new' | 'review' | 'shortlisted' | 'rejected' | 'hired',
      job: attrs.job?.data
        ? {
            id: attrs.job.data.id || attrs.job.data.documentId,
            documentId: attrs.job.data.documentId || attrs.job.data.id?.toString(),
            title: attrs.job.data.attributes?.title || attrs.job.data.title || '',
            slug: attrs.job.data.attributes?.slug || attrs.job.data.slug || '',
            description: attrs.job.data.attributes?.description || attrs.job.data.description || '',
            location: attrs.job.data.attributes?.location || attrs.job.data.location || '',
            jobType: (attrs.job.data.attributes?.jobType || attrs.job.data.jobType || 'full-time') as 'full-time' | 'part-time' | 'contract' | 'internship',
            jobStatus: (attrs.job.data.attributes?.jobStatus || attrs.job.data.jobStatus || 'draft') as 'draft' | 'open' | 'closed',
          }
        : undefined,
      createdAt: attrs.createdAt || attrs.created_at || new Date().toISOString(),
      updatedAt: attrs.updatedAt || attrs.updated_at || new Date().toISOString(),
    };
    
    // Return in the same format as the frontend expects
    return NextResponse.json({
      data: application,
    });
    
  } catch (error: any) {
    console.error('[Job Applications API] Error submitting application:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to submit application',
        message: error.message || 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
