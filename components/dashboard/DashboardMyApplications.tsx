'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { JobApplication } from '@/types/career';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Loader2, Mail, CheckCircle, XCircle, Clock, User, Download, FileText } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const API_BASE_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : 'http://localhost:3000';

export function DashboardMyApplications() {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="liquid-glass-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              My Applications
            </CardTitle>
            <Link href="/career">
              <Button variant="outline" size="sm">
                <Briefcase className="w-4 h-4 mr-2" />
                Browse Jobs
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
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

          {/* Applications List */}
          {applications.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">No applications found</p>
              <p className="text-muted-foreground mb-6">
                {filter === 'all' 
                  ? "You haven't submitted any job applications yet."
                  : `No applications with status "${filter}" found.`}
              </p>
              <Link href="/career">
                <Button>
                  <Briefcase className="w-4 h-4 mr-2" />
                  Browse Available Jobs
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
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
                          <p className="mt-4 text-sm line-clamp-2">
                            {application.coverLetter}
                          </p>
                        )}
                      </div>
                      
                      {application.resume && (
                        <div className="ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(application.resume?.url, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Resume
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

