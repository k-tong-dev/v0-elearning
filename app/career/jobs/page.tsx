'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getJobs, getDepartments, getJobLocations } from '@/lib/api/career';
import { Job, JobFilters, Department } from '@/types/career';
import { JobFilters as JobFiltersComponent } from '@/components/career/JobFilters';
import { JobList } from '@/components/career/JobList';
import { Pagination } from '@/components/career/Pagination';
import { Briefcase } from 'lucide-react';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Ensure we only show 'open' jobs on the public jobs page
  const [filters, setFilters] = useState<JobFilters>({ page: 1, pageSize: 12, jobStatus: 'open' });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    pageCount: 1,
    total: 0,
  });

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getJobs(filters);
      setJobs(response.data);
      setPagination(response.meta.pagination);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    // Fetch departments and locations
    const fetchData = async () => {
      try {
        // Use Promise.allSettled to handle individual failures gracefully
        const [deptsResult, locsResult] = await Promise.allSettled([
          getDepartments(),
          getJobLocations(),
        ]);
        
        // Set departments if successful
        if (deptsResult.status === 'fulfilled') {
          setDepartments(deptsResult.value);
        } else if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to fetch departments:', deptsResult.reason);
        }
        
        // Set locations if successful
        if (locsResult.status === 'fulfilled') {
          setLocations(locsResult.value);
        } else if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to fetch locations:', locsResult.reason);
        }
      } catch (error) {
        // This should rarely happen now, but keep as fallback
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching filter data:', error);
        }
      }
    };
    fetchData();
  }, []);

  const handleFilterChange = useCallback((newFilters: JobFilters) => {
    setFilters((prevFilters) => ({ ...newFilters, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prevFilters) => ({ ...prevFilters, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Memoize departments array to prevent unnecessary re-renders
  const departmentsForFilters = useMemo(() => {
    return departments.map((dept) => ({
      slug: dept.slug,
      name: dept.name,
    }));
  }, [departments]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Briefcase className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  Open Positions
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {pagination.total > 0 && `${pagination.total} position${pagination.total !== 1 ? 's' : ''} available`}
                </p>
              </div>
            </div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
            Discover exciting career opportunities and find your next role with us.
          </p>
        </div>

        {/* Filters */}
        <JobFiltersComponent
          onFilterChange={handleFilterChange}
          locations={locations}
          departments={departmentsForFilters}
          isLoading={isLoading}
        />

        {/* Results Count */}
        {!isLoading && jobs.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold">{jobs.length}</span> of{' '}
              <span className="font-semibold">{pagination.total}</span> position{pagination.total !== 1 ? 's' : ''}
            </div>
            {pagination.pageCount > 1 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Page {pagination.page} of {pagination.pageCount}
              </div>
            )}
          </div>
        )}

        {/* Job List */}
        <JobList jobs={jobs} isLoading={isLoading} />

        {/* Pagination */}
        {!isLoading && pagination.pageCount > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pageCount}
            onPageChange={handlePageChange}
            isLoading={isLoading}
          />
        )}
        </div>
      </div>
    </div>
  );
}

