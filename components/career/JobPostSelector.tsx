"use client";

import { useState } from "react";
import { useJobPosts, useJobPost } from "@/hooks/use-job-posts";
import { JobPost } from "@/integrations/strapi/job";

/**
 * Example component demonstrating how to use the job posts API on the client side
 * This component shows a job selector/dropdown that fetches jobs from Strapi
 */
export function JobPostSelector() {
    const [selectedJobSlug, setSelectedJobSlug] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLocation, setSelectedLocation] = useState<string>("");
    const [selectedJobType, setSelectedJobType] = useState<string>("");

    // Fetch all job posts with filters
    const { jobs, loading, error, pagination, fetchJobs } = useJobPosts({
        autoFetch: true,
        initialFilters: {
            jobStatus: "open",
            pageSize: 50,
        },
    });

    // Fetch selected job details
    const { job: selectedJob, loading: loadingJob } = useJobPost(selectedJobSlug);

    // Handle search
    const handleSearch = () => {
        fetchJobs({
            search: searchTerm || undefined,
            location: selectedLocation || undefined,
            jobType: selectedJobType as any || undefined,
            jobStatus: "open",
            pageSize: 50,
        });
    };

    // Get unique locations from jobs
    const locations = Array.from(new Set(jobs.map((job) => job.location))).filter(Boolean);

    if (error) {
        return (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200">Error loading jobs: {error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search and Filter Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                    Find Your Dream Job
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Search Input */}
                    <div>
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Search Jobs
                        </label>
                        <input
                            id="search"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="e.g., Software Engineer"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {/* Location Filter */}
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Location
                        </label>
                        <select
                            id="location"
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">All Locations</option>
                            {locations.map((location) => (
                                <option key={location} value={location}>
                                    {location}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Job Type Filter */}
                    <div>
                        <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Job Type
                        </label>
                        <select
                            id="jobType"
                            value={selectedJobType}
                            onChange={(e) => setSelectedJobType(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">All Types</option>
                            <option value="full-time">Full Time</option>
                            <option value="part-time">Part Time</option>
                            <option value="contract">Contract</option>
                            <option value="internship">Internship</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? "Searching..." : "Search Jobs"}
                </button>
            </div>

            {/* Results Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Job List */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                        Available Jobs
                        {pagination && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                ({pagination.total} found)
                            </span>
                        )}
                    </h3>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading jobs...</p>
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600 dark:text-gray-400">No jobs found. Try adjusting your filters.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {jobs.map((job) => (
                                <button
                                    key={job.id}
                                    onClick={() => setSelectedJobSlug(job.slug)}
                                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                                        selectedJobSlug === job.slug
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    }`}
                                >
                                    <h4 className="font-semibold text-gray-900 dark:text-white">{job.title}</h4>
                                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        {job.department && (
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                                {job.department.name}
                                            </span>
                                        )}
                                        <span>{job.location}</span>
                                        <span>•</span>
                                        <span className="capitalize">{job.jobType.replace("-", " ")}</span>
                                        {(job.salaryMin || job.salaryMax) && (
                                            <>
                                                <span>•</span>
                                                <span>
                                                    ${job.salaryMin?.toLocaleString() || "N/A"}
                                                    {job.salaryMax && ` - $${job.salaryMax.toLocaleString()}`}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Selected Job Details */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                        Job Details
                    </h3>

                    {loadingJob ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading job details...</p>
                        </div>
                    ) : selectedJob ? (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    {selectedJob.title}
                                </h4>
                                <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {selectedJob.department && (
                                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                            {selectedJob.department.name}
                                        </span>
                                    )}
                                    <span>{selectedJob.location}</span>
                                    <span>•</span>
                                    <span className="capitalize">{selectedJob.jobType.replace("-", " ")}</span>
                                </div>
                            </div>

                            {(selectedJob.salaryMin || selectedJob.salaryMax) && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Salary Range
                                    </p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        ${selectedJob.salaryMin?.toLocaleString() || "N/A"}
                                        {selectedJob.salaryMax && ` - $${selectedJob.salaryMax.toLocaleString()}`}
                                    </p>
                                </div>
                            )}

                            <div>
                                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h5>
                                <div
                                    className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                                    dangerouslySetInnerHTML={{ __html: selectedJob.description }}
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <a
                                    href={`/career/jobs/${selectedJob.slug}/apply`}
                                    className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                                >
                                    Apply Now
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-600 dark:text-gray-400">
                                Select a job from the list to view details
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

