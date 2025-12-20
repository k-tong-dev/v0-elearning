'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getJobBySlug } from '@/lib/api/career';
import { JobDetailContent } from '@/components/career/JobDetailContent';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageLoading } from '@/components/page-loading';
import { Job } from '@/types/career';

export default function JobDetailPage() {
  const params = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.slug) {
      loadJob();
    }
  }, [params.slug]);

  const loadJob = async () => {
    try {
      const jobData = await getJobBySlug(params.slug as string);
      setJob(jobData);
    } catch (error) {
      console.error('Error loading job:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Job Not Found
          </h2>
          <Link href="/career/jobs">
            <button className="text-blue-600 hover:text-blue-700">Back to Jobs</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/career/jobs"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Link>

          <JobDetailContent job={job} />
        </div>
      </div>
    </div>
  );
}

