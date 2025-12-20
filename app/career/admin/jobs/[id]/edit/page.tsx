'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getDepartments } from '@/lib/api/career';
import { Department, Job } from '@/types/career';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import axios from 'axios';
import { getAccessToken } from '@/lib/cookies';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export default function EditJobPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [originalStatus, setOriginalStatus] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    jobType: 'full-time' as 'full-time' | 'part-time' | 'contract' | 'internship',
    department: '',
    salaryMin: '',
    salaryMax: '',
    jobStatus: 'draft' as 'draft' | 'open' | 'closed', // Always initialize with 'draft'
    metaTitle: '',
    metaDescription: '',
  });
  
  // Debug: Log jobStatus changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('FormData jobStatus changed:', formData.jobStatus);
    }
  }, [formData.jobStatus]);

  useEffect(() => {
    // Only fetch data if authenticated and jobId exists
    if (isAuthenticated && jobId) {
      fetchJobAndDepartments();
    }
  }, [isAuthenticated, jobId]);


  const fetchJobAndDepartments = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = getAccessToken();
      if (!token) {
        setError('Authentication required. Please log in again.');
        setIsLoading(false);
        return;
      }

      // Use Next.js API route for consistent data transformation
      const apiBaseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'http://localhost:3000';
      
      const [jobResponse, depts] = await Promise.all([
        // Use Next.js API route instead of calling Strapi directly
        // Pass auth token so API route can forward it to Strapi
        axios.get<{ data: Job }>(`${apiBaseUrl}/api/jobs/${jobId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          timeout: 15000, // 15 second timeout
        }).catch((err) => {
          // Log detailed error for debugging
          if (process.env.NODE_ENV === 'development') {
            console.error('[Edit Job] API error:', {
              status: err.response?.status,
              statusText: err.response?.statusText,
              data: err.response?.data,
              message: err.message,
              url: `${apiBaseUrl}/api/jobs/${jobId}`,
            });
          }
          throw err;
        }),
        getDepartments(),
      ]);

      // Job data is already transformed by the API route
      const job = jobResponse.data?.data || jobResponse.data;
      
      if (!job) {
        setError('Job not found');
        setIsLoading(false);
        return;
      }

      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('[Edit Job] Job loaded:', {
          id: job.id,
          title: job.title,
          department: job.department,
          departmentId: job.department?.id,
          jobStatus: job.jobStatus,
        });
      }

      setDepartments(depts);
      
      // Extract department ID - use numeric id for consistency
      // Match the department from the list to get the correct id
      const jobDeptId = job.department?.id;
      const matchedDept = depts.find(dept => dept.id === jobDeptId);
      const departmentValue = matchedDept?.id?.toString() || jobDeptId?.toString() || '';
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Edit Job] Department extraction:', {
          jobDeptId,
          jobDeptDocId,
          matchedDept: matchedDept?.name,
          departmentValue,
          deptsAvailable: depts.length,
          deptNames: depts.map(d => d.name),
        });
      }
      
      // Normalize jobStatus
      const jobStatus = (job.jobStatus || 'draft').toString().toLowerCase();
      const validLoadedStatus = ['draft', 'open', 'closed'].includes(jobStatus) 
        ? jobStatus as 'draft' | 'open' | 'closed'
        : 'draft';
      
      setOriginalStatus(validLoadedStatus);
      
      // Populate form with existing job data
      setFormData({
        title: job.title || '',
        description: job.description || '',
        location: job.location || '',
        jobType: (job.jobType || 'full-time') as 'full-time' | 'part-time' | 'contract' | 'internship',
        department: departmentValue,
        salaryMin: job.salaryMin?.toString() || '',
        salaryMax: job.salaryMax?.toString() || '',
        jobStatus: validLoadedStatus,
        metaTitle: job.metaTitle || '',
        metaDescription: job.metaDescription || '',
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Edit Job] Form data populated:', {
          id: rawJob.id || rawJob.documentId,
          title: attrs.title || rawJob.title,
          departmentId,
          jobStatus: validLoadedStatus,
        });
      }
    } catch (error: any) {
      console.error('[Edit Job] Error fetching job:', error);
      
      // Better error handling
      let errorMessage = 'Failed to load job. Please try again.';
      
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.response.status === 404) {
          errorMessage = 'Job not found. It may have been deleted.';
        } else if (error.response.data?.error?.message) {
          errorMessage = `Error: ${error.response.data.error.message}`;
        } else if (error.response.data?.message) {
          errorMessage = `Error: ${error.response.data.message}`;
        }
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Ensure jobStatus always has a valid value
    if (name === 'jobStatus') {
      const validStatus = ['draft', 'open', 'closed'].includes(value) ? value : 'draft';
      setFormData((prev) => ({ ...prev, [name]: validStatus }));
      return;
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Auto-generate slug from title
    if (name === 'title') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      // Note: Slug update would need separate API call if needed
    }
    
    // Auto-generate meta fields
    if (name === 'title') {
      setFormData((prev) => ({
        ...prev,
        metaTitle: value ? `${value} - Careers` : '',
      }));
    }
    if (name === 'title' || name === 'location') {
      setFormData((prev) => ({
        ...prev,
        metaDescription: prev.title && prev.location
          ? `Apply for ${prev.title} position at ${prev.location}`
          : '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Get auth token from cookies
      const token = getAccessToken();
      
      // Check if user is admin (only admins need to login to update jobs)
      const isAdmin = user?.role === 'admin' || user?.role?.type === 'admin' || (user as any)?.role?.name === 'Administrator';

      // Only require login if user is admin trying to update a job
      if (isAdmin && !token && !isAuthenticated) {
        setError('Please log in to update this job.');
        toast.error('Please log in to update this job.');
        setIsSubmitting(false);
        router.push(`/auth/start?redirect=/career/admin/jobs/${jobId}/edit`);
        return;
      }

      // If token is missing but user appears authenticated, warn but proceed
      if (!token && isAuthenticated && isAdmin) {
        console.warn('[Edit Job] Token missing but admin user appears authenticated');
        toast.warning('Session may have expired. If update fails, please refresh and try again.');
      }

      // Validate required fields first
      if (!formData.title || !formData.description || !formData.location) {
        setError('Please fill in all required fields (Title, Description, Location)');
        setIsSubmitting(false);
        return;
      }

      // CRITICAL: Ensure jobStatus is ALWAYS valid and never empty
      // Get current jobStatus from form, fallback to original, then to draft
      const currentStatus = formData.jobStatus || originalStatus || 'draft';
      const statusValue = String(currentStatus).trim().toLowerCase();
      
      // Validate status is one of the allowed enum values
      let validStatus: 'draft' | 'open' | 'closed';
      if (['draft', 'open', 'closed'].includes(statusValue)) {
        validStatus = statusValue as 'draft' | 'open' | 'closed';
      } else {
        // Invalid status - use original or default to draft
        validStatus = (originalStatus as 'draft' | 'open' | 'closed') || 'draft';
        console.warn(`Invalid status "${statusValue}", using "${validStatus}"`);
      }

      // Log status for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Status validation:', {
          formDataStatus: formData.status,
          originalStatus: originalStatus,
          currentStatus: currentStatus,
          statusValue: statusValue,
          validStatus: validStatus,
        });
      }

      // Build job data object - ALWAYS include status
      const jobData: any = {
        data: {
          title: formData.title.trim(),
          description: formData.description.trim(),
          location: formData.location.trim(),
          jobType: formData.jobType || 'full-time',
          jobStatus: validStatus, // ALWAYS include jobStatus - this is required by Strapi
          slug: formData.title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
        },
      };

      // Add optional fields only if they have values
      // For Strapi v5 many-to-one relations, use numeric ID
      if (formData.department) {
        // Find the department to ensure we have the correct ID
        const selectedDept = departments.find(dept => 
          dept.id.toString() === formData.department || 
          dept.documentId === formData.department
        );
        if (selectedDept) {
          // Use numeric id for Strapi relations (Strapi v5 typically uses numeric IDs for relations)
          jobData.data.department = selectedDept.id;
          if (process.env.NODE_ENV === 'development') {
            console.log('[Edit Job] Setting department:', {
              deptName: selectedDept.name,
              deptId: selectedDept.id,
              documentId: selectedDept.documentId,
            });
          }
        } else {
          // Fallback: try parsing as number
          const deptId = parseInt(formData.department);
          if (!isNaN(deptId)) {
            jobData.data.department = deptId;
          } else {
            console.warn('[Edit Job] Could not find department or parse ID:', formData.department);
          }
        }
      }
      
      if (formData.salaryMin) {
        const minSalary = parseInt(formData.salaryMin);
        if (!isNaN(minSalary)) {
          jobData.data.salaryMin = minSalary;
        }
      }
      
      if (formData.salaryMax) {
        const maxSalary = parseInt(formData.salaryMax);
        if (!isNaN(maxSalary)) {
          jobData.data.salaryMax = maxSalary;
        }
      }
      
      if (formData.metaTitle?.trim()) {
        jobData.data.metaTitle = formData.metaTitle.trim();
      }
      
      if (formData.metaDescription?.trim()) {
        jobData.data.metaDescription = formData.metaDescription.trim();
      }

      // If status is changing to 'open', include publishedAt in the update
      if (validStatus === 'open' && originalStatus !== 'open') {
        jobData.data.publishedAt = new Date().toISOString();
      }
      
      // If status is changing from 'open' to something else, unpublish
      if (originalStatus === 'open' && validStatus !== 'open') {
        jobData.data.publishedAt = null;
      }

      // CRITICAL: Double-check jobStatus is valid before sending
      if (!jobData.data.jobStatus || !['draft', 'open', 'closed'].includes(jobData.data.jobStatus)) {
        console.error('Invalid jobStatus before sending:', jobData.data.jobStatus);
        setError(`Invalid status value: ${jobData.data.jobStatus}. Please select a valid status.`);
        setIsSubmitting(false);
        return;
      }

      // Log what we're sending for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Updating job with data:', JSON.stringify(jobData, null, 2));
        console.log('JobStatus being sent:', jobData.data.jobStatus);
        console.log('JobStatus validation:', {
          value: jobData.data.jobStatus,
          isValid: ['draft', 'open', 'closed'].includes(jobData.data.jobStatus),
          type: typeof jobData.data.jobStatus,
        });
        console.log('JobStatus change:', { from: originalStatus, to: validStatus });
      }

      // Update the job (including publish/unpublish status)
      // Use Next.js API route instead of calling Strapi directly to avoid CORS issues
      const apiBaseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'http://localhost:3000';
      
      const updateResponse = await axios.put(
        `${apiBaseUrl}/api/jobs/${jobId}`,
        jobData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Verify the update was successful and update form state with saved data
      // Handle both response structures: { data: { data: {...} } } or { data: {...} }
      const updatedJob = updateResponse.data?.data || updateResponse.data;
      
      // Extract saved jobStatus from response - use what we sent if response doesn't have it
      const savedStatus = updatedJob?.jobStatus || updatedJob?.attributes?.jobStatus || updatedJob?.status || updatedJob?.attributes?.status || validStatus; // Support both for migration
      
      // CRITICAL: Always preserve the status we sent (validStatus) as it's guaranteed to be valid
      // Only use response status if it's also valid
      const finalStatus = (['draft', 'open', 'closed'].includes(savedStatus) 
        ? savedStatus 
        : validStatus) as 'draft' | 'open' | 'closed';
      
      // CRITICAL: Always update form state with the status to prevent it from being lost
      setFormData((prev) => {
        const updated = {
          ...prev,
          jobStatus: finalStatus, // Always use the validated jobStatus
          // Update other fields from response to ensure consistency
          title: updatedJob?.title || updatedJob?.attributes?.title || prev.title,
          location: updatedJob?.location || updatedJob?.attributes?.location || prev.location,
          jobType: (updatedJob?.jobType || updatedJob?.attributes?.jobType || prev.jobType) as 'full-time' | 'part-time' | 'contract' | 'internship',
        };
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Updating form state with status:', finalStatus);
        }
        
        return updated;
      });
      
      // Update originalStatus to reflect the new saved status
      setOriginalStatus(finalStatus);

      if (process.env.NODE_ENV === 'development') {
        console.log('Job update response:', updateResponse.data);
        console.log('Updated job status:', savedStatus);
        console.log('Published at:', updatedJob?.publishedAt || updatedJob?.attributes?.publishedAt);
        console.log('Form state updated - status preserved as:', savedStatus || validStatus);
      }

      // If jobStatus is 'open', also try to publish using Strapi's publish endpoint
      if (validStatus === 'open' && originalStatus !== 'open') {
        try {
          // Try Strapi's publish endpoint (more reliable)
          await axios.post(
            `${STRAPI_URL}/api/jobs/${jobId}/actions/publish`,
            {},
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log('Job published successfully via publish endpoint');
        } catch (publishError: any) {
          // If publish endpoint doesn't exist or fails, the publishedAt we set above should work
          if (process.env.NODE_ENV === 'development') {
            console.warn('Publish endpoint not available or failed:', {
              status: publishError.response?.status,
              message: publishError.message,
              data: publishError.response?.data,
            });
          }
          // The publishedAt we set in jobData should still work
          // But log the error for debugging
          if (publishError.response?.status !== 404) {
            console.error('Publish error details:', publishError.response?.data || publishError.message);
          }
        }
      }

      // If jobStatus changed from 'open' to draft/closed, try to unpublish
      if (originalStatus === 'open' && validStatus !== 'open') {
        try {
          // Try Strapi's unpublish endpoint
          await axios.post(
            `${STRAPI_URL}/api/jobs/${jobId}/actions/unpublish`,
            {},
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log('Job unpublished successfully');
        } catch (unpublishError: any) {
          // If unpublish endpoint doesn't exist, the publishedAt: null we set above should work
          if (process.env.NODE_ENV === 'development') {
            console.warn('Unpublish endpoint not available, using publishedAt: null');
          }
        }
      }

      // Show success message
      if (validStatus === 'open' && originalStatus !== 'open') {
        toast.success('Job updated and published successfully! It is now visible on the job list.');
      } else if (originalStatus === 'open' && validStatus !== 'open') {
        toast.success('Job updated and unpublished. It is no longer visible on the job list.');
      } else {
        toast.success(`Job updated successfully! Status: ${validStatus}`);
      }

      // Don't redirect immediately - let user see the updated form
      // They can manually navigate back if needed
      // This prevents the status from appearing to be lost
      // setTimeout(() => {
      //   router.push('/career/admin');
      // }, 1000);
    } catch (error: any) {
      console.error('Error updating job:', error);
      
      // Handle authentication errors - only redirect if user is admin
      const isAdmin = user?.role === 'admin' || user?.role?.type === 'admin' || (user as any)?.role?.name === 'Administrator';
      if ((error.response?.status === 401 || error.response?.status === 403) && isAdmin) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => {
          router.push(`/auth/start?redirect=/career/admin/jobs/${jobId}/edit`);
        }, 2000);
        return;
      }
      
      // Handle network errors
      if (error.message === 'Network Error' || !error.response) {
        setError('Network error. Please check if Strapi is running and try again.');
        return;
      }
      
      // Handle validation errors - especially status errors
      if (error.response?.data?.error) {
        const strapiError = error.response.data.error;
        
        // Check if it's a status validation error
        if (strapiError.message?.toLowerCase().includes('status') || 
            strapiError.message?.toLowerCase().includes('invalid')) {
          console.error('Status validation error:', {
            message: strapiError.message,
            details: strapiError.details,
            statusSent: validStatus,
            formDataJobStatus: formData.jobStatus,
            originalStatus: originalStatus,
          });
          setError(`Status validation error: ${strapiError.message}. Status sent: "${validStatus}". Please try again or contact support.`);
        } else if (strapiError.details?.errors) {
          const validationErrors = strapiError.details.errors
            .map((err: any) => {
              const field = err.path?.join('.') || 'unknown';
              const message = err.message || 'Invalid value';
              return `${field}: ${message}`;
            })
            .join(', ');
          setError(`Validation error: ${validationErrors}`);
        } else {
          setError(strapiError.message || 'Validation error occurred');
        }
      } else {
        setError(
          error.response?.data?.message ||
          error.message ||
          'Failed to update job. Please try again.'
        );
      }
      
      // Always log full error for debugging
      console.error('Job update error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        statusSent: validStatus,
        formDataStatus: formData.status,
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error response:', error.response?.data);
        console.error('Request that failed:', {
          url: `${STRAPI_URL}/api/jobs/${jobId}`,
          data: jobData,
          status: validStatus,
        });
      }
    } finally {
      setIsSubmitting(false);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/career/admin"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Career Management
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Edit Job
          </h1>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-200">Error</p>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Senior Full-Stack Developer"
                disabled={isSubmitting}
              />
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting || isLoading}
              >
                <option value="">Select Department</option>
                {departments.length === 0 && !isLoading ? (
                  <option value="" disabled>No departments available</option>
                ) : (
                  departments.map((dept) => (
                    <option key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </option>
                  ))
                )}
              </select>
              {departments.length === 0 && !isLoading && (
                <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                  No departments found. Please create departments in Strapi first.
                </p>
              )}
            </div>

            {/* Location & Job Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <Input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Remote, New York, NY"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="jobType"
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>

            {/* Salary Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Salary
                </label>
                <Input
                  id="salaryMin"
                  name="salaryMin"
                  type="number"
                  value={formData.salaryMin}
                  onChange={handleChange}
                  placeholder="e.g., 80000"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Salary
                </label>
                <Input
                  id="salaryMax"
                  name="salaryMax"
                  type="number"
                  value={formData.salaryMax}
                  onChange={handleChange}
                  placeholder="e.g., 120000"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter detailed job description..."
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                You can use HTML tags for formatting
              </p>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="jobStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="jobStatus"
                name="jobStatus"
                value={formData.jobStatus || 'draft'}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="draft">Draft (Hidden from public)</option>
                <option value="open">Open (Visible on job list)</option>
                <option value="closed">Closed (Hidden from public)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.jobStatus === 'draft' && 'Job will be hidden from public job listings'}
                {formData.jobStatus === 'open' && 'Job will be visible on public job listings and can accept applications'}
                {formData.jobStatus === 'closed' && 'Job will be hidden from public job listings (position filled or deadline passed)'}
              </p>
            </div>

            {/* SEO Fields */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                SEO Settings (Optional)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meta Title
                  </label>
                  <Input
                    id="metaTitle"
                    name="metaTitle"
                    type="text"
                    value={formData.metaTitle}
                    onChange={handleChange}
                    placeholder="Auto-generated from job title"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    id="metaDescription"
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Auto-generated from job title and location"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link href="/career/admin">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Job
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

