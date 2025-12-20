'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getJobById } from '@/lib/api/career';
import { JobDetailContent } from '@/components/career/JobDetailContent';
import { HeaderUltra } from '@/components/ui/headers/HeaderUltra';
import { Footer } from '@/components/ui/footers/footer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageLoading } from '@/components/page-loading';
import { Job } from '@/types/career';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.documentId) {
      loadJob();
    }
  }, [params.documentId]);

  const loadJob = async () => {
    try {
      // Get the job ID from the route parameter (can be numeric ID or documentId)
      const jobId = params.documentId as string;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[JobDetailPage] Loading job with ID:', jobId);
      }
      
      const jobData = await getJobById(jobId);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[JobDetailPage] Job loaded:', jobData ? 'Success' : 'Not found');
      }
      
      setJob(jobData);
    } catch (error) {
      console.error('[JobDetailPage] Error loading job:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <HeaderUltra />
        <PageLoading />
        <Footer />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <HeaderUltra />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Job Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The job you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/career">
              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                Back to Career
              </button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <HeaderUltra />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/career"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Career
          </Link>

          <JobDetailContent job={job} />
        </div>
      </div>
      <Footer />
    </div>
  );
}

