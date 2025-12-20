'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Loader2, AlertCircle, Upload, X, Building2 } from 'lucide-react';
import axios from 'axios';
import { getAccessToken } from '@/lib/cookies';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export function DashboardCreatePosition() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    jobType: 'full-time',
    salaryMin: '',
    salaryMax: '',
    jobStatus: 'draft',
    orgName: '',
    orgLogo: null as File | null,
  });

  // No need to store token in state - get it fresh when needed

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, orgLogo: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get fresh token from cookies
    const accessToken = getAccessToken();
    
    // Debug: Log token status
    if (process.env.NODE_ENV === 'development') {
      console.log('[DashboardCreatePosition] Token check:', {
        hasToken: !!accessToken,
        tokenLength: accessToken?.length,
        hasUser: !!user,
        isAuthenticated,
      });
    }
    
    // Check if user is authenticated and has a token
    if (!isAuthenticated || !accessToken) {
      const errorMsg = 'Authentication required. Please refresh the page and try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('[DashboardCreatePosition] No access token or user not authenticated');
      return;
    }

    // Validate required fields
    if (!formData.title.trim()) {
      setError('Job Title is required');
      toast.error('Job Title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Job Description is required');
      toast.error('Job Description is required');
      return;
    }

    if (!formData.location.trim()) {
      setError('Location is required');
      toast.error('Location is required');
      return;
    }

    if (!formData.orgName || !formData.orgName.trim()) {
      setError('Organization Name is required');
      toast.error('Organization Name is required');
      return;
    }

    if (!formData.orgLogo) {
      setError('Organization Logo is required');
      toast.error('Organization Logo is required. Please upload a logo image.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Add all required and optional form fields in Strapi format
      formDataToSend.append('data[title]', formData.title.trim());
      formDataToSend.append('data[description]', formData.description.trim());
      formDataToSend.append('data[location]', formData.location.trim());
      formDataToSend.append('data[jobType]', formData.jobType);
      formDataToSend.append('data[jobStatus]', formData.jobStatus);
      formDataToSend.append('data[orgName]', formData.orgName.trim());
      
      // Add optional salary fields (as integers)
      if (formData.salaryMin && formData.salaryMin.trim()) {
        const salaryMinNum = parseInt(formData.salaryMin);
        if (!isNaN(salaryMinNum)) {
          formDataToSend.append('data[salaryMin]', salaryMinNum.toString());
        }
      }
      
      if (formData.salaryMax && formData.salaryMax.trim()) {
        const salaryMaxNum = parseInt(formData.salaryMax);
        if (!isNaN(salaryMaxNum)) {
          formDataToSend.append('data[salaryMax]', salaryMaxNum.toString());
        }
      }
      
      // Add logo file (required)
      formDataToSend.append('files.orgLogo', formData.orgLogo);

      // Use API route instead of calling Strapi directly
      const apiBaseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'http://localhost:3000';

      // Prepare headers - don't set Content-Type, let axios set it automatically with boundary for FormData
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${accessToken}`, // Token is guaranteed to exist here due to check above
      };

      const response = await axios.post(
        `${apiBaseUrl}/api/jobs`,
        formDataToSend,
        { headers }
      );

      toast.success('Job posting created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        location: '',
        jobType: 'full-time',
        salaryMin: '',
        salaryMax: '',
        jobStatus: 'draft',
        orgName: '',
        orgLogo: null,
      });
      
      // Optionally refresh or navigate
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating job:', error);
      
      // Handle 401 Unauthorized specifically
      if (error.response?.status === 401) {
        const errorMsg = 'Authentication failed. Please refresh the page and try again.';
        setError(errorMsg);
        toast.error(errorMsg);
        console.error('[DashboardCreatePosition] 401 Unauthorized - Token may be expired or invalid');
      } else {
        const errorMessage = error.response?.data?.error?.message 
          || error.response?.data?.message 
          || error.message 
          || 'Failed to create job posting';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
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
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Create New Position
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Phnom Penh, Cambodia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobType">Job Type *</Label>
                <Select
                  value={formData.jobType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, jobType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salaryMin">Minimum Salary</Label>
                <Input
                  id="salaryMin"
                  name="salaryMin"
                  type="number"
                  value={formData.salaryMin}
                  onChange={handleInputChange}
                  placeholder="e.g., 500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salaryMax">Maximum Salary</Label>
                <Input
                  id="salaryMax"
                  name="salaryMax"
                  type="number"
                  value={formData.salaryMax}
                  onChange={handleInputChange}
                  placeholder="e.g., 2000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobStatus">Status</Label>
                <Select
                  value={formData.jobStatus}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, jobStatus: value as 'draft' | 'open' | 'closed' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  name="orgName"
                  value={formData.orgName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Company Name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={8}
                placeholder="Enter detailed job description..."
                className="min-h-[200px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgLogo">Organization Logo *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="orgLogo"
                  name="orgLogo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                  className="cursor-pointer"
                />
                {formData.orgLogo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, orgLogo: null }))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    title: '',
                    description: '',
                    location: '',
                    jobType: 'full-time',
                    salaryMin: '',
                    salaryMax: '',
                    jobStatus: 'draft',
                    orgName: '',
                    orgLogo: null,
                  });
                }}
              >
                Reset
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Position
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

