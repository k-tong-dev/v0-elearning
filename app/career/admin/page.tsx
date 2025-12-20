'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getJobs, getDepartments } from '@/lib/api/career';
import { Job, Department, JobApplication } from '@/types/career';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Briefcase, 
  Edit, 
  Eye, 
  Loader2,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Download,
  Filter,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { getAccessToken } from '@/lib/cookies';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const API_BASE_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : 'http://localhost:3000';

export default function CareerAdminPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('jobs');
  
  // Jobs state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isJobsLoading, setIsJobsLoading] = useState(true);
  
  // Applications state
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isApplicationsLoading, setIsApplicationsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'review' | 'shortlisted' | 'rejected' | 'hired'>('all');
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  const fetchJobs = async () => {
    setIsJobsLoading(true);
    try {
      const [jobsResponse, depts] = await Promise.all([
        getJobs({ pageSize: 100, jobStatus: 'all' as any }),
        getDepartments(),
      ]);
      setJobs(jobsResponse.data);
      setDepartments(depts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsJobsLoading(false);
    }
  };

  const fetchApplications = useCallback(async () => {
    setIsApplicationsLoading(true);
    try {
      const params = new URLSearchParams();
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
      setIsApplicationsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'jobs') {
      fetchJobs();
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'applications') {
      fetchApplications();
    }
  }, [isAuthenticated, activeTab, fetchApplications]);

  const handleStatusUpdate = async (applicationId: number, newStatus: 'new' | 'review' | 'shortlisted' | 'rejected' | 'hired') => {
    setUpdatingStatus(applicationId);
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error('Authentication required. Please log in again.');
        router.push('/auth/start');
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/job-applications/${applicationId}`,
        {
          data: {
            applyStatus: newStatus,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(`Application status updated to ${newStatus}`);
      fetchApplications();
    } catch (error: any) {
      console.error('Error updating application status:', error);
      toast.error(error.response?.data?.message || 'Failed to update application status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Fetch data when tab changes or filter changes
  useEffect(() => {
    if (isAuthenticated && activeTab === 'jobs') {
      fetchJobs();
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'applications') {
      fetchApplications();
    }
  }, [isAuthenticated, activeTab, fetchApplications]);

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

  // Filter applications by selected job
  const filteredApplications = selectedJob === 'all' 
    ? applications 
    : applications.filter(app => app.job?.id?.toString() === selectedJob);

  // Get unique jobs for filter
  const uniqueJobs = Array.from(
    new Map(applications.map(app => [app.job?.id, app.job]).filter(([id, job]) => id && job))
      .values()
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Manage Career
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage job postings and candidate applications
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Jobs
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Applications
              </TabsTrigger>
            </TabsList>

            {/* Jobs Tab */}
            <TabsContent value="jobs" className="mt-0">
              {isJobsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <JobsList jobs={jobs} onRefresh={fetchJobs} />
              )}
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications" className="mt-0">
              {isApplicationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  {/* Filters */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
                    <div className="flex flex-wrap gap-4 items-end">
                      {/* Status Filter */}
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Filter className="w-4 h-4 inline mr-1" />
                          Status
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {(['all', 'new', 'review', 'shortlisted', 'rejected', 'hired'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => setFilter(status)}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                                filter === status
                                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Job Filter */}
                      {uniqueJobs.length > 0 && (
                        <div className="min-w-[200px]">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Job Position
                          </label>
                          <Select value={selectedJob} onValueChange={setSelectedJob}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Jobs" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Jobs</SelectItem>
                              {uniqueJobs.map((job) => (
                                <SelectItem key={job.id} value={job.id.toString()}>
                                  {job.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Applications List */}
                  {filteredApplications.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                      <Briefcase className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">No applications found</p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {filter === 'all' 
                          ? "No job applications have been submitted yet."
                          : `No applications with status "${filter}" found.`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredApplications.map((application) => (
                        <div
                          key={application.id}
                          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                  {application.job?.title || 'Unknown Job'}
                                </h3>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.applyStatus)}`}>
                                  {getStatusIcon(application.applyStatus)}
                                  {application.applyStatus.charAt(0).toUpperCase() + application.applyStatus.slice(1)}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  <span className="font-medium">{application.fullName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  <span>{application.email}</span>
                                </div>
                                {application.phone && (
                                  <div className="flex items-center gap-2">
                                    <span>📞</span>
                                    <span>{application.phone}</span>
                                  </div>
                                )}
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
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cover Letter:</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                                    {application.coverLetter}
                                  </p>
                                </div>
                              )}

                              {application.portfolioUrl && (
                                <div className="mt-2">
                                  <a
                                    href={application.portfolioUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                  >
                                    View Portfolio →
                                  </a>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-3 min-w-[200px]">
                              {/* Status Update Dropdown */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Update Status
                                </label>
                                <Select
                                  value={application.applyStatus}
                                  onValueChange={(value) => handleStatusUpdate(application.id, value as any)}
                                  disabled={updatingStatus === application.id}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="review">Review</SelectItem>
                                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="hired">Hired</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Actions */}
                              <div className="flex flex-col gap-2">
                                {application.resume && (
                                  <>
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
                                  </>
                                )}
                                {application.job && (
                                  <Link
                                    href={`/career/jobs/${application.job.slug}`}
                                    className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View Job
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function JobsList({ jobs, onRefresh }: { jobs: Job[]; onRefresh: () => void }) {
  if (jobs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
        <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No jobs posted yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Get started by posting your first job opening.
        </p>
        <Link href="/dashboard?tab=create-job">
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            Post Your First Job
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Job Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {job.title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {job.jobType}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {job.department?.name || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {job.location}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      job.jobStatus === 'open'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : job.jobStatus === 'closed'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {job.jobStatus ? job.jobStatus.charAt(0).toUpperCase() + job.jobStatus.slice(1) : 'Draft'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Link href={`/career/jobs/${job.slug}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/career/admin/jobs/${job.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
