'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle, X, FileText } from 'lucide-react';
import { submitJobApplication } from '@/lib/api/career';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ApplicationFormProps {
  jobId: number;
  jobTitle: string;
  onSuccess?: () => void;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  resume?: string;
  coverLetter?: string;
  portfolioUrl?: string;
}

export function EnhancedApplicationForm({ jobId, jobTitle, onSuccess }: ApplicationFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    coverLetter: '',
    portfolioUrl: '',
  });
  const [resume, setResume] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) {
          return 'Full name is required';
        }
        if (value.trim().length < 2) {
          return 'Full name must be at least 2 characters';
        }
        break;
      case 'email':
        if (!value.trim()) {
          return 'Email is required';
        }
        if (!validateEmail(value)) {
          return 'Please enter a valid email address';
        }
        break;
      case 'phone':
        // Phone is optional, but if provided, validate format
        if (value && value.trim().length > 0) {
          const phoneRegex = /^[\d\s\-\+\(\)]+$/;
          if (!phoneRegex.test(value)) {
            return 'Please enter a valid phone number';
          }
        }
        break;
      case 'portfolioUrl':
        if (value && !validateUrl(value)) {
          return 'Please enter a valid URL';
        }
        break;
    }
    return undefined;
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      const allowedExtensions = ['.pdf', '.doc', '.docx'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        setErrors((prev) => ({
          ...prev,
          resume: 'Please upload a PDF, DOC, or DOCX file',
        }));
        setResume(null);
        setResumeName('');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          resume: 'File size must be less than 5MB',
        }));
        setResume(null);
        setResumeName('');
        return;
      }
      
      setResume(file);
      setResumeName(file.name);
      setErrors((prev) => ({ ...prev, resume: undefined }));
      setErrorMessage('');
    }
  };

  const removeResume = () => {
    setResume(null);
    setResumeName('');
    setErrors((prev) => ({ ...prev, resume: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validate all fields
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
      }
    });
    
    // Validate resume (optional but recommended)
    if (!resume) {
      // Resume is optional, but we can show a warning
    }
    
    setErrors(newErrors);
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      coverLetter: true,
      portfolioUrl: true,
    });
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setStatus('idle');
    
    if (!validateForm()) {
      setStatus('error');
      setErrorMessage('Please fix the errors in the form before submitting.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      // Append data fields
      formDataToSend.append('data', JSON.stringify({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || '',
        coverLetter: formData.coverLetter.trim() || '',
        portfolioUrl: formData.portfolioUrl.trim() || '',
        job: jobId,
      }));
      
      // Append file (Strapi v5 format)
      if (resume) {
        formDataToSend.append('files.resume', resume);
      }

      await submitJobApplication(formDataToSend);
      
      setStatus('success');
      
      // Show success notification
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.success('Application submitted successfully! You will receive a confirmation email shortly.');
      }
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        coverLetter: '',
        portfolioUrl: '',
      });
      setResume(null);
      setResumeName('');
      setErrors({});
      setTouched({});
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (error: any) {
      setStatus('error');
      const errorMsg = error.message || 
        error.response?.data?.error?.message || 
        'Failed to submit application. Please try again.';
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <h3 className="text-2xl font-semibold text-green-900 mb-2">
          Application Submitted Successfully!
        </h3>
        <p className="text-green-700 mb-4">
          Thank you for your interest in the <strong>{jobTitle}</strong> position.
        </p>
        <p className="text-sm text-green-600">
          We've received your application and will review it shortly. We'll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {status === 'error' && errorMessage && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
          Full Name <span className="text-red-500">*</span>
        </label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          value={formData.fullName}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder="John Doe"
          required
          className={errors.fullName ? 'border-red-500 focus:ring-red-500' : ''}
          disabled={isSubmitting}
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.fullName}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address <span className="text-red-500">*</span>
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder="john.doe@example.com"
          required
          className={errors.email ? 'border-red-500 focus:ring-red-500' : ''}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder="+1 (555) 123-4567"
          className={errors.phone ? 'border-red-500 focus:ring-red-500' : ''}
          disabled={isSubmitting}
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.phone}
          </p>
        )}
      </div>

      {/* Resume Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resume/CV <span className="text-gray-500 text-xs">(PDF, DOC, DOCX - Max 5MB)</span>
        </label>
        {!resume ? (
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="resume-upload"
                  className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="resume-upload"
                    name="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="sr-only"
                    disabled={isSubmitting}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 5MB</p>
            </div>
          </div>
        ) : (
          <div className="mt-1 flex items-center justify-between p-4 bg-gray-50 border border-gray-300 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">{resumeName}</p>
                <p className="text-xs text-gray-500">
                  {(resume.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeResume}
              className="text-red-600 hover:text-red-700 p-1"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {errors.resume && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.resume}
          </p>
        )}
      </div>

      {/* Cover Letter */}
      <div>
        <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-2">
          Cover Letter
        </label>
        <textarea
          id="coverLetter"
          name="coverLetter"
          value={formData.coverLetter}
          onChange={handleInputChange}
          onBlur={handleBlur}
          rows={6}
          placeholder="Tell us why you're interested in this position..."
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
            errors.coverLetter ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isSubmitting}
        />
        {errors.coverLetter && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.coverLetter}
          </p>
        )}
      </div>

      {/* Portfolio URL */}
      <div>
        <label htmlFor="portfolioUrl" className="block text-sm font-medium text-gray-700 mb-2">
          Portfolio URL
        </label>
        <Input
          id="portfolioUrl"
          name="portfolioUrl"
          type="url"
          value={formData.portfolioUrl}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder="https://yourportfolio.com"
          className={errors.portfolioUrl ? 'border-red-500 focus:ring-red-500' : ''}
          disabled={isSubmitting}
        />
        {errors.portfolioUrl && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.portfolioUrl}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting Application...
            </>
          ) : (
            'Submit Application'
          )}
        </Button>
        <p className="mt-2 text-xs text-gray-500 text-center">
          By submitting this form, you agree to our privacy policy and terms of service.
        </p>
      </div>
    </form>
  );
}

