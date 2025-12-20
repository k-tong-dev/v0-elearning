export interface Department {
  id: number;
  documentId: string;
  name: string;
  description?: string;
  slug: string;
}

export interface Job {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  salaryMin?: number;
  salaryMax?: number;
  jobStatus: 'draft' | 'open' | 'closed';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  orgName?: string;
  orgLogo?: {
    id: number;
    url: string;
    name: string;
  };
}

export interface JobApplication {
  id: number;
  documentId: string;
  fullName: string;
  email: string;
  phone?: string;
  resume?: {
    id: number;
    url: string;
    name: string;
  };
  coverLetter?: string;
  portfolioUrl?: string;
  applyStatus: 'new' | 'review' | 'shortlisted' | 'rejected' | 'hired';
  job?: Job;
  createdAt: string;
  updatedAt: string;
}

export interface JobFilters {
  search?: string;
  location?: string;
  jobType?: string;
  jobStatus?: 'draft' | 'open' | 'closed' | 'all';
  page?: number;
  pageSize?: number;
}

export interface JobsResponse {
  data: Job[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

