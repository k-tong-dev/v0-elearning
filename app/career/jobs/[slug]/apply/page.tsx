import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getJobBySlug } from '@/lib/api/career';
import { EnhancedApplicationForm as ApplicationForm } from '@/components/career/EnhancedApplicationForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface JobApplyPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: JobApplyPageProps): Promise<Metadata> {
  const job = await getJobBySlug(params.slug);

  if (!job) {
    return {
      title: 'Job Not Found',
    };
  }

  return {
    title: `Apply for ${job.title} - Careers`,
    description: `Submit your application for ${job.title} position`,
  };
}

export default async function JobApplyPage({ params }: JobApplyPageProps) {
  const job = await getJobBySlug(params.slug);

  if (!job) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href={`/career/jobs/${params.slug}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Job Details
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Apply for {job.title}
            </h1>
            <p className="text-gray-600">
              {job.location} • {job.department?.name || 'General'}
            </p>
          </div>

          <ApplicationForm jobId={job.id} jobTitle={job.title} />
        </div>
      </div>
    </div>
  );
}

