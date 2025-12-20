import axios from 'axios';
import { Job, JobsResponse, JobApplication, Department, JobFilters } from '@/types/career';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

// Use Next.js API route instead of calling Strapi directly
// This works on both client and server side
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client side - use current origin (localhost:3000 in dev)
    return window.location.origin;
  }
  // Server side - use localhost:3000 or environment variable
  return process.env.NEXT_PUBLIC_APP_URL 
    ? (process.env.NEXT_PUBLIC_APP_URL.startsWith('http') 
        ? process.env.NEXT_PUBLIC_APP_URL 
        : `http://${process.env.NEXT_PUBLIC_APP_URL}`)
    : 'http://localhost:3000';
};

// Get all jobs with filters
// Uses Next.js API route (/api/jobs) instead of calling Strapi directly
export async function getJobs(filters?: JobFilters): Promise<JobsResponse> {
  try {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }
    
    if (filters?.location) {
      params.append('location', filters.location);
    }
    
    if (filters?.jobType) {
      params.append('jobType', filters.jobType);
    }
    
    if (filters?.department) {
      params.append('department', filters.department);
    }
    
    // Job status filter (default to 'open' for public pages, but allow override for admin)
    // Pass 'all' to fetch all jobs regardless of status (for admin pages)
    if (filters?.jobStatus) {
      params.append('jobStatus', filters.jobStatus);
    } else {
      // Default to 'open' for public viewing
      params.append('jobStatus', 'open');
    }
    
    // Pagination
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.pageSize) {
      params.append('pageSize', filters.pageSize.toString());
    } else {
      params.append('pageSize', '10');
    }

    // Use Next.js API route instead of calling Strapi directly
    const apiBaseUrl = getApiBaseUrl();
    const response = await axios.get<JobsResponse>(
      `${apiBaseUrl}/api/jobs?${params.toString()}`,
      {
        timeout: 30000, // 30 second timeout - increased for better reliability
      }
    );
    return response.data;
  } catch (error: any) {
    // Return empty response structure on error
    if (process.env.NODE_ENV === 'development') {
      if (error.code === 'ECONNABORTED') {
        console.warn('[Career API] Request timeout while fetching jobs');
      } else if (error.message === 'Network Error' || !error.response) {
        // Show helpful warning (only in dev mode)
        console.warn(
          '[Career API] Network error - Strapi may not be running.\n' +
          '  → Start Strapi: cd eLearningAdmin && pnpm run develop\n' +
          '  → The page will work with empty data until Strapi is available.'
        );
      } else {
        console.warn('[Career API] Error fetching jobs:', error.message);
      }
    }
    // Return empty response structure
    return {
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 10,
          pageCount: 0,
          total: 0,
        },
      },
    };
  }
}

// Get single job by slug
export async function getJobBySlug(slug: string): Promise<Job | null> {
  try {
    const response = await axios.get<{ data: Job }>(
      `${STRAPI_URL}/api/jobs?filters[slug][$eq]=${slug}&populate=department`,
      {
        timeout: 30000, // 30 second timeout - increased for better reliability
      }
    );
    
    if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      return response.data.data[0];
    }
    return null;
  } catch (error: any) {
    // Silently fail - return null
    if (process.env.NODE_ENV === 'development') {
      if (error.code === 'ECONNABORTED') {
        console.warn('[Career API] Request timeout while fetching job');
      } else if (error.message === 'Network Error' || !error.response) {
        // Warning already shown by getJobs, so skip duplicate
      } else {
        console.warn('[Career API] Error fetching job:', error.message);
      }
    }
    return null;
  }
}

// Get single job by ID or documentId
// Uses Next.js API route (/api/jobs/[id]) instead of calling Strapi directly
export async function getJobById(id: number | string): Promise<Job | null> {
  try {
    // Use Next.js API route instead of calling Strapi directly
    const apiBaseUrl = getApiBaseUrl();
    const response = await axios.get<{ data: Job }>(
      `${apiBaseUrl}/api/jobs/${id}`,
      {
        timeout: 30000, // 30 second timeout - increased for better reliability
      }
    );
    
    return response.data.data || null;
  } catch (error: any) {
    // Return null on error (not found, network error, etc.)
    if (process.env.NODE_ENV === 'development') {
      if (error.code === 'ECONNABORTED') {
        console.warn('[Career API] Request timeout while fetching job');
      } else if (error.message === 'Network Error' || !error.response) {
        console.warn(
          '[Career API] Network error - Strapi may not be running.\n' +
          '  → Start Strapi: cd eLearningAdmin && npm run develop\n' +
          '  → The page will show "Job Not Found" until Strapi is available.'
        );
      } else if (error.response?.status === 404) {
        console.warn('[Career API] Job not found:', id);
      } else {
        console.warn('[Career API] Error fetching job:', error.message);
      }
    }
    return null;
  }
}

// Get all departments
// Uses Next.js API route (/api/departments) instead of calling Strapi directly
export async function getDepartments(): Promise<Department[]> {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const response = await axios.get<{ data: Department[] }>(
      `${apiBaseUrl}/api/departments`,
      {
        timeout: 30000, // 30 second timeout - increased for better reliability
      }
    );
    return response.data.data || [];
  } catch (error: any) {
    // Silently fail - return empty array
    if (process.env.NODE_ENV === 'development') {
      if (error.code === 'ECONNABORTED') {
        console.warn('[Career API] Request timeout while fetching departments');
      } else if (error.message === 'Network Error' || !error.response) {
        console.warn('[Career API] Network error while fetching departments');
      } else {
        console.warn('[Career API] Error fetching departments:', error.message);
      }
    }
    return [];
  }
}

// Get unique locations from jobs
export async function getJobLocations(): Promise<string[]> {
  try {
    const response = await axios.get<JobsResponse>(
      `${STRAPI_URL}/api/jobs?filters[jobStatus][$eq]=open&pagination[pageSize]=1000&populate=department`,
      {
        timeout: 30000, // 30 second timeout - increased for better reliability
      }
    );
    
    if (!response.data?.data) {
      return [];
    }
    
    const locations = new Set<string>();
    response.data.data.forEach((job) => {
      if (job.location) {
        locations.add(job.location);
      }
    });
    
    return Array.from(locations).sort();
  } catch (error: any) {
    // Silently fail - return empty array
    if (process.env.NODE_ENV === 'development') {
      if (error.code === 'ECONNABORTED') {
        console.warn('[Career API] Request timeout while fetching locations');
      } else if (error.message === 'Network Error' || !error.response) {
        // Warning already shown by getJobs, so skip duplicate
      } else {
        console.warn('[Career API] Error fetching locations:', error.message);
      }
    }
    return [];
  }
}

// Submit job application
// Uses Next.js API route (/api/job-applications) instead of calling Strapi directly
export async function submitJobApplication(
  applicationData: FormData
): Promise<JobApplication> {
  try {
    // Use Next.js API route instead of calling Strapi directly
    const apiBaseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL
        ? (process.env.NEXT_PUBLIC_APP_URL.startsWith('http')
            ? process.env.NEXT_PUBLIC_APP_URL
            : `http://${process.env.NEXT_PUBLIC_APP_URL}`)
        : 'http://localhost:3000';
    
    const response = await axios.post<{ data: JobApplication }>(
      `${apiBaseUrl}/api/job-applications`,
      applicationData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout for file uploads
      }
    );
    
    return response.data.data;
  } catch (error: any) {
    // Re-throw with better error message
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection and try again.');
    } else if (error.message === 'Network Error' || !error.response) {
      throw new Error('Network error. Please ensure Strapi is running and try again.');
    } else if (error.response) {
      const errorMessage = error.response.data?.error?.message || 
                          error.response.data?.message || 
                          'Failed to submit application';
      throw new Error(errorMessage);
    } else {
      throw new Error('Failed to submit application. Please try again.');
    }
  }
}

