'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getJobs, getJobLocations } from '@/lib/api/career';
import { Job, JobFilters } from '@/types/career';
import { JobFilters as JobFiltersComponent } from '@/components/career/JobFilters';
import { JobList } from '@/components/career/JobList';
import { Pagination } from '@/components/career/Pagination';
import { HeaderUltra } from '@/components/ui/headers/HeaderUltra';
import { Footer } from '@/components/ui/footers/footer';
import { Briefcase, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CareerPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    const fetchData = async () => {
      try {
        const locsResult = await Promise.allSettled([getJobLocations()]);
        
        if (locsResult[0].status === 'fulfilled') {
          setLocations(locsResult[0].value);
        } else if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to fetch locations:', locsResult[0].reason);
        }
      } catch (error) {
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

  const handleJobClick = (job: Job) => {
    router.push(`/career/${job.documentId}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 relative">
      <HeaderUltra />
      
      {/* Hero Section */}
      <div className="relative pt-24 pb-12 md:pt-32 md:pb-16 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Briefcase className="w-4 h-4" />
                Career Opportunities
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                Find Your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Dream Job</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Discover exciting career opportunities and find your next role with us. Join a team of passionate professionals.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <JobFiltersComponent
            onFilterChange={handleFilterChange}
            locations={locations}
            isLoading={isLoading}
          />
        </motion.div>

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <JobList jobs={jobs} isLoading={isLoading} />
        </motion.div>

        {/* Pagination */}
        {!isLoading && pagination.pageCount > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pageCount}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
