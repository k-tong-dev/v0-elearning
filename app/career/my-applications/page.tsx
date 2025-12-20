'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { JobApplication } from '@/types/career';
import { Button } from '@/components/ui/button';
import { Briefcase, Loader2, Mail, CheckCircle, XCircle, Clock, User, Download, FileText } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { getAccessToken } from '@/lib/cookies';
import { toast } from 'sonner';

const API_BASE_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : 'http://localhost:3000';

export default function MyApplicationsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'review' | 'shortlisted' | 'rejected' | 'hired'>('all');

  const fetchApplications = useCallback(async () => {
    if (!isAuthenticated || !user?.email) {
      setIsLoading(false);
      setApplications([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Filter by user's email to only show their own applications
      params.append('email', user.email);
      
      if (filter !== 'all') {
        params.append('applyStatus', filter);
      }

      const response = await axios.get<{ data: JobApplication[] }>(
        `${API_BASE_URL}/api/job-applications?${params.toString()}`
      );
      
      setApplications(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, [filter, isAuthenticated, user?.email]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated, fetchApplications]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'shortlisted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'hired':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="w-4 h-4" />;
      case 'review':
        return <Mail className="w-4 h-4" />;
      case 'shortlisted':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'hired':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">My Applications</h1>
          <Link href="/career/jobs">
            <Button variant="outline">
              <Briefcase className="w-4 h-4 mr-2" />
              Browse Jobs
            </Button>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'new', 'review', 'shortlisted', 'rejected', 'hired'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filter === status
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <Briefcase className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">No applications found</p>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {filter === 'all' 
                ? "You haven't submitted any job applications yet."
                : `No applications with status "${filter}" found.`}
            </p>
            <Link href="/career/jobs">
              <Button>
                <Briefcase className="w-4 h-4 mr-2" />
                Browse Available Jobs
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {application.job?.title || 'Unknown Job'}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.applyStatus)}`}>
                        {getStatusIcon(application.applyStatus)}
                        {application.applyStatus.charAt(0).toUpperCase() + application.applyStatus.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{application.fullName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{application.email}</span>
                      </div>
                      {application.job?.location && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          <span>{application.job.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Applied {new Date(application.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {application.coverLetter && (
                      <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {application.coverLetter}
                      </p>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    {application.resume && (
                      <div className="flex flex-col gap-2">
                        <a
                          href={application.resume.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Download className="w-4 h-4" />
                          View/Download Resume
                        </a>
                        <button
                          onClick={() => {
                            if (application.resume?.url) {
                              const printWindow = window.open(application.resume.url, '_blank');
                              if (printWindow) {
                                printWindow.onload = () => {
                                  setTimeout(() => {
                                    printWindow.print();
                                  }, 500);
                                };
                              }
                            }
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          Print Resume
                        </button>
                        <a
                          href={application.resume.url}
                          download={application.resume.name || 'resume.pdf'}
                          className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download to File
                        </a>
                      </div>
                    )}
                    {application.job && (
                      <Link
                        href={`/career/jobs/${application.job.slug}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm text-center"
                      >
                        View Job
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

