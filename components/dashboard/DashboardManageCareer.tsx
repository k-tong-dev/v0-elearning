'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getJobs, getDepartments } from '@/lib/api/career';
import { Job, Department, JobApplication } from '@/types/career';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';

const API_BASE_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : 'http://localhost:3000';

export function DashboardManageCareer() {
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
  const [selectedJob, setSelectedJob] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  const fetchJobs = useCallback(async () => {
    setIsJobsLoading(true);
    try {
      const response = await getJobs({ jobStatus: 'all', pageSize: 100 });
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setIsJobsLoading(false);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    setIsApplicationsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('applyStatus', filter);
      }
      if (selectedJob !== 'all') {
        params.append('job', selectedJob);
      }

      const response = await axios.get<{ data: JobApplication[] }>(
        `${API_BASE_URL}/api/job-applications?${params.toString()}`
      );
      
      setApplications(response.data.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setIsApplicationsLoading(false);
    }
  }, [filter, selectedJob]);

  useEffect(() => {
    fetchJobs();
    getDepartments().then(setDepartments).catch(console.error);
  }, [fetchJobs]);

  useEffect(() => {
    if (activeTab === 'applications') {
      fetchApplications();
    }
  }, [activeTab, fetchApplications]);

  const handleStatusUpdate = async (applicationId: number, newStatus: string) => {
    setUpdatingStatus(applicationId);
    try {
      const token = getAccessToken();
      await axios.put(
        `${API_BASE_URL}/api/job-applications/${applicationId}`,
        { applyStatus: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success('Application status updated');
      fetchApplications();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'shortlisted': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'hired': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="w-4 h-4" />;
      case 'review': return <Mail className="w-4 h-4" />;
      case 'shortlisted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'hired': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const uniqueJobs = Array.from(new Map(jobs.map(job => [job.id, job])).values());

  return (
    <div className="space-y-6">
      <Card className="liquid-glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Manage Career
          </CardTitle>
        </CardHeader>
        <CardContent>
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

            <TabsContent value="jobs" className="mt-0">
              {isJobsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No jobs posted yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Get started by posting your first job opening.
                  </p>
                   <Link href="/dashboard?tab=career/admin/jobs/new">
                    <Button>
                      <Plus className="w-5 h-5 mr-2" />
                      Post Your First Job
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <Card key={job.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-semibold">{job.title}</h3>
                              <Badge className={
                                job.jobStatus === 'open'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : job.jobStatus === 'closed'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }>
                                {job.jobStatus ? job.jobStatus.charAt(0).toUpperCase() + job.jobStatus.slice(1) : 'Draft'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">Department:</span> {job.department?.name || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Location:</span> {job.location}
                              </div>
                              <div>
                                <span className="font-medium">Type:</span> {job.jobType}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Link href={`/career/${job.documentId}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link href={`/career/admin/jobs/${job.id}/edit`}>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="applications" className="mt-0">
              {isApplicationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-4 items-end mb-6">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium mb-2">
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
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    {uniqueJobs.length > 0 && (
                      <div className="min-w-[200px]">
                        <label className="block text-sm font-medium mb-2">Job Position</label>
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

                  {applications.length === 0 ? (
                    <div className="text-center py-12">
                      <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-semibold mb-2">No applications found</p>
                      <p className="text-muted-foreground">
                        {filter === 'all' 
                          ? "No job applications have been submitted yet."
                          : `No applications with status "${filter}" found.`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications.map((application) => (
                        <Card key={application.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                  <h3 className="text-xl font-semibold">
                                    {application.job?.title || 'Unknown Job'}
                                  </h3>
                                  <Badge className={getStatusColor(application.applyStatus)}>
                                    {getStatusIcon(application.applyStatus)}
                                    <span className="ml-1">
                                      {application.applyStatus.charAt(0).toUpperCase() + application.applyStatus.slice(1)}
                                    </span>
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
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
                                  <div className="mt-4 p-4 bg-muted rounded-lg">
                                    <p className="text-sm font-medium mb-2">Cover Letter:</p>
                                    <p className="text-sm line-clamp-3">
                                      {application.coverLetter}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-3 min-w-[200px]">
                                <div>
                                  <label className="block text-xs font-medium mb-1">Update Status</label>
                                  <Select
                                    value={application.applyStatus}
                                    onValueChange={(value) => handleStatusUpdate(application.id, value)}
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
                                {application.resume && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(application.resume?.url, '_blank')}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    View Resume
                                  </Button>
                                )}
                                {application.job && (
                                  <Link href={`/career/${application.job.documentId}`}>
                                    <Button variant="outline" size="sm" className="w-full">
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Job
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

