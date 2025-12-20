"use client";

import { useState, useEffect, useCallback } from "react";
import {
    getJobPosts,
    getJobPostBySlug,
    getJobPostById,
    getJobPostsByDepartment,
    getJobPostsByLocation,
    getJobPostsByType,
    getOpenJobPosts,
    type JobPost,
    type JobFilters,
    type JobsResponse,
} from "@/integrations/strapi/job";

interface UseJobPostsOptions {
    autoFetch?: boolean;
    initialFilters?: JobFilters;
    showToast?: boolean;
}

/**
 * Custom hook for fetching job posts from Strapi
 * 
 * @example
 * ```tsx
 * // Basic usage - fetch all open jobs
 * const { jobs, loading, error, refetch } = useJobPosts();
 * 
 * // With filters
 * const { jobs, loading, error, refetch } = useJobPosts({
 *   initialFilters: {
 *     location: 'New York',
 *     jobType: 'full-time',
 *     page: 1,
 *     pageSize: 10
 *   }
 * });
 * 
 * // Manual fetch
 * const { jobs, loading, error, fetchJobs } = useJobPosts({
 *   autoFetch: false
 * });
 * 
 * useEffect(() => {
 *   fetchJobs({ search: 'developer' });
 * }, []);
 * ```
 */
export function useJobPosts(options?: UseJobPostsOptions) {
    const { autoFetch = true, initialFilters, showToast = false } = options || {};
    const [jobs, setJobs] = useState<JobPost[]>([]);
    const [loading, setLoading] = useState(autoFetch);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<JobsResponse["meta"]["pagination"] | null>(null);

    const fetchJobs = useCallback(async (filters?: JobFilters) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getJobPosts(filters || initialFilters);
            setJobs(response.data);
            setPagination(response.meta.pagination);
        } catch (err: any) {
            const errorMessage = err.message || "Failed to load job posts";
            setError(errorMessage);
            if (showToast) {
                // You can add toast notification here if needed
                console.error("Error fetching job posts:", errorMessage);
            }
        } finally {
            setLoading(false);
        }
    }, [initialFilters, showToast]);

    useEffect(() => {
        if (autoFetch) {
            fetchJobs();
        }
    }, [autoFetch, fetchJobs]);

    const refetch = useCallback(() => {
        fetchJobs(initialFilters);
    }, [fetchJobs, initialFilters]);

    return {
        jobs,
        loading,
        error,
        pagination,
        fetchJobs,
        refetch,
    };
}

/**
 * Custom hook for fetching a single job post by slug
 * 
 * @example
 * ```tsx
 * const { job, loading, error } = useJobPost('software-engineer');
 * ```
 */
export function useJobPost(slug: string | null) {
    const [job, setJob] = useState<JobPost | null>(null);
    const [loading, setLoading] = useState(!!slug);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) {
            setJob(null);
            setLoading(false);
            return;
        }

        const fetchJob = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getJobPostBySlug(slug);
                setJob(data);
                if (!data) {
                    setError("Job post not found");
                }
            } catch (err: any) {
                const errorMessage = err.message || "Failed to load job post";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [slug]);

    return { job, loading, error };
}

/**
 * Custom hook for fetching a single job post by ID
 * 
 * @example
 * ```tsx
 * const { job, loading, error } = useJobPostById(123);
 * ```
 */
export function useJobPostById(id: number | string | null) {
    const [job, setJob] = useState<JobPost | null>(null);
    const [loading, setLoading] = useState(!!id);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setJob(null);
            setLoading(false);
            return;
        }

        const fetchJob = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getJobPostById(id);
                setJob(data);
                if (!data) {
                    setError("Job post not found");
                }
            } catch (err: any) {
                const errorMessage = err.message || "Failed to load job post";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [id]);

    return { job, loading, error };
}

/**
 * Custom hook for fetching job posts by department
 * 
 * @example
 * ```tsx
 * const { jobs, loading, error } = useJobPostsByDepartment('engineering');
 * ```
 */
export function useJobPostsByDepartment(departmentSlug: string | null, filters?: Omit<JobFilters, 'department'>) {
    const [jobs, setJobs] = useState<JobPost[]>([]);
    const [loading, setLoading] = useState(!!departmentSlug);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!departmentSlug) {
            setJobs([]);
            setLoading(false);
            return;
        }

        const fetchJobs = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getJobPostsByDepartment(departmentSlug, filters);
                setJobs(response.data);
            } catch (err: any) {
                const errorMessage = err.message || "Failed to load job posts";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [departmentSlug, JSON.stringify(filters)]);

    return { jobs, loading, error };
}

/**
 * Custom hook for fetching job posts by location
 * 
 * @example
 * ```tsx
 * const { jobs, loading, error } = useJobPostsByLocation('New York');
 * ```
 */
export function useJobPostsByLocation(location: string | null, filters?: Omit<JobFilters, 'location'>) {
    const [jobs, setJobs] = useState<JobPost[]>([]);
    const [loading, setLoading] = useState(!!location);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!location) {
            setJobs([]);
            setLoading(false);
            return;
        }

        const fetchJobs = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getJobPostsByLocation(location, filters);
                setJobs(response.data);
            } catch (err: any) {
                const errorMessage = err.message || "Failed to load job posts";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [location, JSON.stringify(filters)]);

    return { jobs, loading, error };
}

/**
 * Custom hook for fetching job posts by type
 * 
 * @example
 * ```tsx
 * const { jobs, loading, error } = useJobPostsByType('full-time');
 * ```
 */
export function useJobPostsByType(
    jobType: 'full-time' | 'part-time' | 'contract' | 'internship' | null,
    filters?: Omit<JobFilters, 'jobType'>
) {
    const [jobs, setJobs] = useState<JobPost[]>([]);
    const [loading, setLoading] = useState(!!jobType);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!jobType) {
            setJobs([]);
            setLoading(false);
            return;
        }

        const fetchJobs = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getJobPostsByType(jobType, filters);
                setJobs(response.data);
            } catch (err: any) {
                const errorMessage = err.message || "Failed to load job posts";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [jobType, JSON.stringify(filters)]);

    return { jobs, loading, error };
}

/**
 * Custom hook for fetching only open job posts
 * 
 * @example
 * ```tsx
 * const { jobs, loading, error } = useOpenJobPosts({
 *   location: 'Remote',
 *   pageSize: 20
 * });
 * ```
 */
export function useOpenJobPosts(filters?: Omit<JobFilters, 'jobStatus'>) {
    const [jobs, setJobs] = useState<JobPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getOpenJobPosts(filters);
                setJobs(response.data);
            } catch (err: any) {
                const errorMessage = err.message || "Failed to load job posts";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [JSON.stringify(filters)]);

    return { jobs, loading, error };
}

