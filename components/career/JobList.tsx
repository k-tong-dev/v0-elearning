'use client';

import { Job } from '@/types/career';
import { ImprovedJobCard } from './ImprovedJobCard';
import { Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import axios from 'axios';
import { getAccessToken } from '@/lib/cookies';
import { toast } from 'sonner';

interface JobListProps {
  jobs: Job[];
  isLoading?: boolean;
}

export function JobList({ jobs, isLoading }: JobListProps) {
  const { isAuthenticated } = useAuth();
  
  const handleDelete = async (jobId: number) => {
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
      await axios.delete(`${STRAPI_URL}/api/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success('Job deleted successfully');
      // Refresh the page to update the list
      window.location.reload();
    } catch (error: any) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job. Please try again.');
    }
  };
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 animate-pulse"
          >
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <Briefcase className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No jobs found</h3>
        <p className="text-gray-600 dark:text-gray-400">
          We don't have any open positions matching your criteria at the moment.
        </p>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Check back later or try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobs.map((job) => (
        <ImprovedJobCard 
          key={job.id} 
          job={job}
          onDelete={isAuthenticated ? handleDelete : undefined}
        />
      ))}
    </div>
  );
}

