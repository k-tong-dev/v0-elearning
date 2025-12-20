# Career Admin UI - Access Guide

## 🎯 Overview

The Career Admin UI allows HR/Admin users to post and manage jobs directly from the frontend, without needing to access Strapi admin panel.

## 📍 Access URLs

### Main Admin Dashboard
```
http://localhost:3000/career/admin
```

### Post New Job
```
http://localhost:3000/career/admin/jobs/new
```

## 🔐 Authentication

The admin pages require authentication:
- Users must be logged in to access
- If not authenticated, users are redirected to login page
- After login, users are redirected back to the admin page

## ✨ Features

### 1. Job Management Dashboard (`/career/admin`)
- View all jobs in a table format
- See job status (draft, open, closed)
- Quick actions:
  - View job (public page)
  - Edit job
- Tab to switch between Jobs and Applications

### 2. Post New Job (`/career/admin/jobs/new`)
- Complete job posting form with:
  - Job title (required)
  - Department selection
  - Location (required)
  - Job type (required)
  - Salary range (optional)
  - Rich text description (required)
  - Status (draft, open, closed)
  - SEO fields (meta title, meta description)
- Auto-generates slug from title
- Auto-generates SEO fields
- Publishes job automatically if status is "open"

## 🚀 How to Use

### Posting a New Job

1. **Navigate to Admin Dashboard**
   - Go to `/career/admin`
   - Click "Post New Job" button

2. **Fill Out the Form**
   - Enter job title
   - Select department (optional)
   - Enter location
   - Choose job type
   - Add salary range (optional)
   - Write job description (HTML supported)
   - Choose status:
     - **Draft**: Not visible to public
     - **Open**: Published and visible
     - **Closed**: No longer accepting applications

3. **Submit**
   - Click "Create Job"
   - Job will be created and published (if status is "open")
   - You'll be redirected back to admin dashboard

### Managing Jobs

1. **View All Jobs**
   - Go to `/career/admin`
   - See all jobs in a table
   - Filter by status using the status column

2. **View Job Details**
   - Click the eye icon to view public job page
   - Opens in new tab

3. **Edit Job**
   - Click the edit icon
   - (Edit page coming soon - currently redirects)

## 🔧 Technical Details

### Authentication
- Uses cookie-based authentication
- Token stored in `auth-token` cookie
- Automatically included in API requests

### API Integration
- Creates jobs via Strapi REST API
- Requires authentication token
- Publishes jobs automatically if status is "open"

### Status Workflow
- **Draft**: Created but not published
- **Open**: Published and visible to public
- **Closed**: Published but not accepting applications

## 📝 Notes

- **Applications Management**: Currently, applications are managed through Strapi Admin Panel
- **Edit Functionality**: Edit page is coming soon
- **Permissions**: Currently, any authenticated user can access. You may want to add role-based access control.

## 🔐 Security Considerations

1. **Add Role-Based Access**: Restrict admin access to HR/Admin users only
2. **API Permissions**: Ensure Strapi permissions are set correctly
3. **Validation**: Add server-side validation for job creation

## 🎨 UI Features

- Modern, responsive design
- Dark mode support
- Loading states
- Error handling
- Form validation
- Auto-generated fields (slug, SEO)

## 📱 Responsive Design

- Works on mobile, tablet, and desktop
- Table scrolls horizontally on mobile
- Forms adapt to screen size

## 🚧 Future Enhancements

- [ ] Edit job functionality
- [ ] Delete job functionality
- [ ] Application management UI
- [ ] Bulk operations
- [ ] Job analytics
- [ ] Role-based access control
- [ ] Email notifications

## 🔗 Related Pages

- Public Job Listing: `/career/jobs`
- Job Detail: `/career/jobs/[slug]`
- Application Form: `/career/jobs/[slug]/apply`
- Career Landing: `/career`

