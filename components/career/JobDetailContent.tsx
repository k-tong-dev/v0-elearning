'use client';

import { Job } from '@/types/career';
import { MapPin, Briefcase, DollarSign, Building2 } from 'lucide-react';
import Image from 'next/image';

interface JobDetailContentProps {
  job: Job;
}

export function JobDetailContent({ job }: JobDetailContentProps) {

  const formatSalary = () => {
    if (!job.salaryMin && !job.salaryMax) return null;
    if (job.salaryMin && job.salaryMax) {
      return `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
    }
    if (job.salaryMin) {
      return `From $${job.salaryMin.toLocaleString()}`;
    }
    return `Up to $${job.salaryMax?.toLocaleString()}`;
  };

  const formatJobType = (type: string) => {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get description - handle both string and HTML content
  const description = job.description || '';
  
  return (
    <div className="space-y-6">
      {/* Job Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-6 md:p-8">
          {/* Organization Logo and Name */}
          {(job.orgLogo || job.orgName) && (
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              {job.orgLogo && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                  <Image
                    src={job.orgLogo.url}
                    alt={job.orgLogo.name || job.orgName || 'Company logo'}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              {job.orgName && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {job.orgName}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Job Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            {job.title}
          </h1>

          {/* Job Details */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <MapPin className="w-5 h-5" />
              <span className="font-medium">{job.location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Briefcase className="w-5 h-5" />
              <span className="font-medium">{formatJobType(job.jobType)}</span>
            </div>
            {formatSalary() && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <DollarSign className="w-5 h-5" />
                <span className="font-medium">{formatSalary()}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                job.jobStatus === 'open'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  : job.jobStatus === 'closed'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              }`}>
                {job.jobStatus === 'open' ? 'Open' : job.jobStatus === 'closed' ? 'Closed' : 'Draft'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Job Description Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Job Description
          </h2>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {description ? (
              <div
                dangerouslySetInnerHTML={{ __html: description }}
                className="text-gray-700 dark:text-gray-300 leading-relaxed"
              />
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                No description available for this position.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

