import { strapiPublic } from './client';

export interface Department {
    id: number;
    documentId?: string;
    name: string;
    description?: string;
    slug: string;
}

export interface JobPost {
    id: number;
    documentId?: string;
    title: string;
    slug: string;
    description: string;
    location: string;
    jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
    salaryMin?: number;
    salaryMax?: number;
    jobStatus: 'draft' | 'open' | 'closed';
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface JobFilters {
    search?: string;
    location?: string;
    jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
    jobStatus?: 'draft' | 'open' | 'closed';
    page?: number;
    pageSize?: number;
    sort?: string;
}

export interface JobsResponse {
    data: JobPost[];
    meta: {
        pagination: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
        };
    };
}

/**
 * Get all job posts from Strapi with optional filters
 * @param filters - Optional filters for searching, filtering, and pagination
 * @returns Promise<JobsResponse> - List of job posts with pagination metadata
 */
export async function getJobPosts(filters?: JobFilters): Promise<JobsResponse> {
    try {
        const params: Record<string, string> = {};

        // Search filter
        if (filters?.search) {
            params['filters[title][$containsi]'] = filters.search;
        }

        // Location filter
        if (filters?.location) {
            params['filters[location][$eq]'] = filters.location;
        }

        // Job type filter
        if (filters?.jobType) {
            params['filters[jobType][$eq]'] = filters.jobType;
        }

        // Department filter (by slug)
        if (filters?.department) {
            params['filters[department][slug][$eq]'] = filters.department;
        }

        // JobStatus filter (default to 'open' if not specified)
        if (filters?.jobStatus) {
            params['filters[jobStatus][$eq]'] = filters.jobStatus;
        } else {
            params['filters[jobStatus][$eq]'] = 'open'; // Default to open jobs only
        }

        // Populate department relation
        params['populate'] = 'department';

        // Sorting (default to newest first)
        params['sort'] = filters?.sort || 'createdAt:desc';

        // Pagination
        if (filters?.page) {
            params['pagination[page]'] = filters.page.toString();
        }
        if (filters?.pageSize) {
            params['pagination[pageSize]'] = filters.pageSize.toString();
        } else {
            params['pagination[pageSize]'] = '10'; // Default page size
        }

        const response = await strapiPublic.get<JobsResponse>('/api/jobs', {
            params,
            timeout: 10000, // 10 second timeout
        });

        if (!response.data || !response.data.data) {
            console.warn('No job posts data found in response:', response.data);
            return {
                data: [],
                meta: {
                    pagination: {
                        page: filters?.page || 1,
                        pageSize: filters?.pageSize || 10,
                        pageCount: 0,
                        total: 0,
                    },
                },
            };
        }

        // Map the response data to match our interface
        const mappedJobs = response.data.data.map((item: any) => {
            const attrs = item.attributes || item;

            return {
                id: item.id || item.documentId || 0,
                documentId: item.documentId,
                title: attrs.title || '',
                slug: attrs.slug || '',
                description: attrs.description || '',
                location: attrs.location || '',
                jobType: (attrs.jobType || 'full-time') as 'full-time' | 'part-time' | 'contract' | 'internship',
                salaryMin: attrs.salaryMin || attrs.salary_min,
                salaryMax: attrs.salaryMax || attrs.salary_max,
                jobStatus: (attrs.jobStatus || attrs.status || 'draft') as 'draft' | 'open' | 'closed', // Support both jobStatus and status for migration
                publishedAt: attrs.publishedAt || attrs.published_at,
                createdAt: attrs.createdAt || attrs.created_at || new Date().toISOString(),
                updatedAt: attrs.updatedAt || attrs.updated_at || new Date().toISOString(),
            };
        });

        return {
            data: mappedJobs,
            meta: response.data.meta || {
                pagination: {
                    page: filters?.page || 1,
                    pageSize: filters?.pageSize || 10,
                    pageCount: 0,
                    total: mappedJobs.length,
                },
            },
        };
    } catch (error: any) {
        // Silently fail and return empty response - component will handle gracefully
        if (process.env.NODE_ENV === 'development') {
            if (error.response) {
                console.warn('[Job Posts] API Error - Status:', error.response.status);
                console.warn('[Job Posts] Response:', error.response.data);
            } else if (error.request) {
                console.warn('[Job Posts] No response received - Strapi may not be running or endpoint not available');
            } else {
                console.warn('[Job Posts] Error:', error.message);
            }
        }
        // Return empty response structure
        return {
            data: [],
            meta: {
                pagination: {
                    page: filters?.page || 1,
                    pageSize: filters?.pageSize || 10,
                    pageCount: 0,
                    total: 0,
                },
            },
        };
    }
}

/**
 * Get a single job post by slug
 * @param slug - The slug of the job post
 * @returns Promise<JobPost | null> - The job post or null if not found
 */
export async function getJobPostBySlug(slug: string): Promise<JobPost | null> {
    try {
        const response = await strapiPublic.get<JobsResponse>('/api/jobs', {
            params: {
                'filters[slug][$eq]': slug,
                'populate': 'department',
            },
            timeout: 10000,
        });

        if (!response.data?.data || response.data.data.length === 0) {
            return null;
        }

        const item: any = response.data.data[0];
        const attrs = item.attributes || item;
        const dept = attrs.department?.data || attrs.department;

        return {
            id: typeof (item.id || item.documentId) === 'number' ? (item.id || item.documentId) : parseInt(String(item.id || item.documentId || 0)),
            documentId: item.documentId,
            title: attrs.title || '',
            slug: attrs.slug || '',
            description: attrs.description || '',
            department: dept ? {
                id: dept.id || dept.documentId || 0,
                documentId: dept.documentId,
                name: dept.attributes?.name || dept.name || '',
                description: dept.attributes?.description || dept.description,
                slug: dept.attributes?.slug || dept.slug || '',
            } : undefined,
            location: attrs.location || '',
            jobType: (attrs.jobType || 'full-time') as 'full-time' | 'part-time' | 'contract' | 'internship',
            salaryMin: attrs.salaryMin || attrs.salary_min,
            salaryMax: attrs.salaryMax || attrs.salary_max,
            jobStatus: (attrs.jobStatus || attrs.status || 'draft') as 'draft' | 'open' | 'closed', // Support both for migration
            publishedAt: attrs.publishedAt || attrs.published_at,
            createdAt: attrs.createdAt || attrs.created_at || new Date().toISOString(),
            updatedAt: attrs.updatedAt || attrs.updated_at || new Date().toISOString(),
        };
    } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
            if (error.response) {
                console.warn('[Job Post] API Error - Status:', error.response.status);
                console.warn('[Job Post] Response:', error.response.data);
            } else if (error.request) {
                console.warn('[Job Post] No response received - Strapi may not be running');
            } else {
                console.warn('[Job Post] Error:', error.message);
            }
        }
        return null;
    }
}

/**
 * Get a single job post by ID
 * @param id - The ID of the job post
 * @returns Promise<JobPost | null> - The job post or null if not found
 */
export async function getJobPostById(id: number | string): Promise<JobPost | null> {
    try {
        const response = await strapiPublic.get<{ data: JobPost }>(`/api/jobs/${id}`, {
            params: {
                'populate': 'department',
            },
            timeout: 10000,
        });

        if (!response.data?.data) {
            return null;
        }

        const item: any = response.data.data;
        const attrs = item.attributes || item;

        return {
            id: typeof (item.id || item.documentId) === 'number' ? (item.id || item.documentId) : parseInt(String(item.id || item.documentId || 0)),
            documentId: item.documentId,
            title: attrs.title || '',
            slug: attrs.slug || '',
            description: attrs.description || '',
            location: attrs.location || '',
            jobType: (attrs.jobType || 'full-time') as 'full-time' | 'part-time' | 'contract' | 'internship',
            salaryMin: attrs.salaryMin || attrs.salary_min,
            salaryMax: attrs.salaryMax || attrs.salary_max,
            jobStatus: (attrs.jobStatus || attrs.status || 'draft') as 'draft' | 'open' | 'closed', // Support both for migration
            publishedAt: attrs.publishedAt || attrs.published_at,
            createdAt: attrs.createdAt || attrs.created_at || new Date().toISOString(),
            updatedAt: attrs.updatedAt || attrs.updated_at || new Date().toISOString(),
        };
    } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
            if (error.response) {
                console.warn('[Job Post] API Error - Status:', error.response.status);
                console.warn('[Job Post] Response:', error.response.data);
            } else if (error.request) {
                console.warn('[Job Post] No response received - Strapi may not be running');
            } else {
                console.warn('[Job Post] Error:', error.message);
            }
        }
        return null;
    }
}

/**
 * Get job posts by department slug
 * @param departmentSlug - The slug of the department
 * @param filters - Optional additional filters
 * @returns Promise<JobsResponse> - List of job posts in the department
 */
export async function getJobPostsByDepartment(
    departmentSlug: string,
    filters?: Omit<JobFilters, 'department'>
): Promise<JobsResponse> {
    return getJobPosts({
        ...filters,
        department: departmentSlug,
    });
}

/**
 * Get job posts by location
 * @param location - The location to filter by
 * @param filters - Optional additional filters
 * @returns Promise<JobsResponse> - List of job posts in the location
 */
export async function getJobPostsByLocation(
    location: string,
    filters?: Omit<JobFilters, 'location'>
): Promise<JobsResponse> {
    return getJobPosts({
        ...filters,
        location,
    });
}

/**
 * Get job posts by job type
 * @param jobType - The job type to filter by
 * @param filters - Optional additional filters
 * @returns Promise<JobsResponse> - List of job posts of the specified type
 */
export async function getJobPostsByType(
    jobType: 'full-time' | 'part-time' | 'contract' | 'internship',
    filters?: Omit<JobFilters, 'jobType'>
): Promise<JobsResponse> {
    return getJobPosts({
        ...filters,
        jobType,
    });
}

/**
 * Get all open job posts (convenience function)
 * @param filters - Optional filters (status will be overridden to 'open')
 * @returns Promise<JobsResponse> - List of open job posts
 */
export async function getOpenJobPosts(filters?: Omit<JobFilters, 'jobStatus'>): Promise<JobsResponse> {
    return getJobPosts({
        ...filters,
        jobStatus: 'open',
    });
}

