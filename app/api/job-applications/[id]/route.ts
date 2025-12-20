import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

/**
 * PUT /api/job-applications/[id]
 * Updates a job application (e.g., status) in Strapi
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params.id;
    const body = await request.json();
    
    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
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
    const strapiUrl = `${STRAPI_URL}/api/job-applications/${applicationId}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Job Applications API] Updating application in Strapi:', strapiUrl);
      console.log('[Job Applications API] Request body:', JSON.stringify(body, null, 2));
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
        console.error('[Job Applications API] Request timeout');
        return NextResponse.json(
          { error: 'Request timeout. Please try again.' },
          { status: 504 }
        );
      } else {
        console.error('[Job Applications API] Network error:', fetchError.message);
        return NextResponse.json(
          { error: 'Network error. Please check if Strapi is running.', message: fetchError.message },
          { status: 503 }
        );
      }
    }
    
    // Try to parse response as JSON
    let responseData: any;
    try {
      const responseText = await response.text();
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('[Job Applications API] Failed to parse response:', parseError);
      return NextResponse.json(
        { error: 'Invalid response from Strapi', message: 'Failed to parse response' },
        { status: 500 }
      );
    }
    
    if (!response.ok) {
      console.error(`[Job Applications API] Strapi error (${response.status}):`, JSON.stringify(responseData, null, 2));
      
      return NextResponse.json(
        {
          error: 'Failed to update application in Strapi',
          message: responseData.error?.message || responseData.message || `Strapi responded with ${response.status}`,
          details: responseData.error?.details || responseData.error || responseData,
        },
        { status: response.status }
      );
    }
    
    // Transform Strapi response to match our JobApplication interface
    const applicationData = responseData.data || responseData;
    const attrs = applicationData.attributes || applicationData;
    
    const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
    
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
    
    const application = {
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
    
    // Return the transformed response
    return NextResponse.json({ data: application });
    
  } catch (error: any) {
    console.error('[Job Applications API] Error updating application:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update application', 
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

