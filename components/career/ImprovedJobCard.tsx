'use client';

import { useRouter } from 'next/navigation';
import { Job } from '@/types/career';
import { MapPin, Briefcase, DollarSign, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface JobCardProps {
  job: Job;
  onEdit?: (job: Job) => void;
  onDelete?: (jobId: number) => void;
}

export function ImprovedJobCard({ job, onEdit, onDelete }: JobCardProps) {
  const router = useRouter();
  
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

  const handleViewDetail = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Use job.documentId to navigate to detail page
    const jobId = job.documentId || job.id;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[ImprovedJobCard] Navigating to job detail with ID:', jobId);
    }
    
    router.push(`/career/${jobId}`);
  };

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden h-full flex flex-col">
      <div className="p-6 flex flex-col flex-1">
        {/* Organization Logo and Name */}
        {(job.orgLogo || job.orgName) && (
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            {job.orgLogo && (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
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
                <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {job.orgName}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {job.title}
          </h3>
        </div>

        {/* Job Details */}
        <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300 mb-4">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-1">{job.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 flex-shrink-0" />
            <span>{formatJobType(job.jobType)}</span>
          </div>
          {formatSalary() && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 flex-shrink-0" />
              <span>{formatSalary()}</span>
            </div>
          )}
        </div>

        {/* Status Badge and Actions */}
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
              {job.jobStatus === 'open' ? 'Open' : job.jobStatus === 'closed' ? 'Closed' : 'Draft'}
            </span>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={handleViewDetail}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            See Detail
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

