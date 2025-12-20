# Career Module Documentation

Complete Career module for the eLearning platform with job listings, applications, and admin management.

## Features

✅ Job listing page with search and filters  
✅ Job detail pages with rich text descriptions  
✅ Application form with file upload  
✅ Admin panel for managing jobs and applications  
✅ Responsive design  
✅ SEO optimized  
✅ TypeScript support  

## File Structure

```
v0-elearning/
├── app/
│   └── career/
│       ├── page.tsx                    # Landing page
│       └── jobs/
│           ├── page.tsx                # Job listing
│           └── [slug]/
│               ├── page.tsx            # Job detail
│               └── apply/
│                   └── page.tsx        # Application form
├── components/
│   └── career/
│       ├── JobCard.tsx                 # Job card component
│       ├── JobFilters.tsx              # Filter component
│       ├── JobList.tsx                 # Job list component
│       ├── JobDetailContent.tsx        # Job detail content
│       ├── ApplicationForm.tsx         # Application form
│       └── Pagination.tsx              # Pagination component
├── lib/
│   └── api/
│       └── career.ts                   # API functions
└── types/
    └── career.ts                       # TypeScript types
```

## Usage

### View Jobs

```typescript
import { getJobs } from '@/lib/api/career';

const jobs = await getJobs({
  search: 'developer',
  location: 'Remote',
  jobType: 'full-time',
  page: 1,
});
```

### Get Single Job

```typescript
import { getJobBySlug } from '@/lib/api/career';

const job = await getJobBySlug('senior-developer');
```

### Submit Application

```typescript
import { submitJobApplication } from '@/lib/api/career';

const formData = new FormData();
formData.append('data', JSON.stringify({
  fullName: 'John Doe',
  email: 'john@example.com',
  job: jobId,
}));
formData.append('files.resume', resumeFile);

await submitJobApplication(formData);
```

## Routes

- `/career` - Landing page
- `/career/jobs` - Job listing with filters
- `/career/jobs/[slug]` - Job detail page
- `/career/jobs/[slug]/apply` - Application form

## Components

All components are in `components/career/` and are reusable:

- `<JobCard />` - Display job in card format
- `<JobFilters />` - Search and filter interface
- `<JobList />` - List of jobs with loading/empty states
- `<ApplicationForm />` - Application submission form
- `<Pagination />` - Page navigation

## Strapi Setup

See `eLearningAdmin/docs/CAREER_SETUP.md` for complete Strapi configuration.

## Environment Variables

```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

## Customization

All components use Tailwind CSS and can be easily customized. Modify the components in `components/career/` to match your design system.

