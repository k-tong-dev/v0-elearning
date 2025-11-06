"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra";
import { Footer } from "@/components/ui/footers/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

// Import new modular components
import { BlogHeroSection } from "@/components/blog/BlogHeroSection";
import { BlogStatsBar } from "@/components/blog/BlogStatsBar";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { FeaturedPostsSection } from "@/components/blog/FeaturedPostsSection";
import { LatestArticlesSection } from "@/components/blog/LatestArticlesSection";
import { BlogNewsletterSignup } from "@/components/blog/BlogNewsletterSignup";

// Import types
import { BlogPost, BlogCategory } from "@/types/blog";

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [postsToShow, setPostsToShow] = useState(10); // State for infinite scroll

  const categories: BlogCategory[] = [
    {
      id: "web-development",
      name: "Web Development",
      description: "Frontend and backend development tutorials",
      postCount: 45,
      color: "bg-blue-500"
    },
    {
      id: "mobile-development",
      name: "Mobile Development",
      description: "iOS, Android, and cross-platform development",
      postCount: 23,
      color: "bg-green-500"
    },
    {
      id: "design",
      name: "Design",
      description: "UI/UX design principles and tutorials",
      postCount: 31,
      color: "bg-purple-500"
    },
    {
      id: "career",
      name: "Career",
      description: "Career advice and industry insights",
      postCount: 18,
      color: "bg-orange-500"
    },
    {
      id: "tutorials",
      name: "Tutorials",
      description: "Step-by-step coding tutorials",
      postCount: 67,
      color: "bg-purple-500"
    },
    {
      id: "industry-news",
      name: "Industry News",
      description: "Latest trends and tech news",
      postCount: 29,
      color: "bg-blue-500"
    }
  ];

  const blogPosts: BlogPost[] = [
    {
      id: "1",
      title: "Building Modern React Applications with TypeScript",
      excerpt: "Learn how to leverage TypeScript's powerful type system to build more reliable and maintainable React applications.",
      content: "Full article content here...",
      author: {
        id: "1",
        name: "Emma Rodriguez",
        avatar: "/images/Avatar.jpg",
        role: "Expert"
      },
      category: "web-development",
      tags: ["React", "TypeScript", "JavaScript", "Frontend"],
      publishedAt: "2024-01-15",
      readTime: 8,
      views: 1240,
      likes: 89,
      comments: 23,
      featured: true,
      coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop"
    },
    {
      id: "2",
      title: "The Complete Guide to CSS Grid Layout",
      excerpt: "Master CSS Grid with practical examples and real-world use cases. From basics to advanced techniques.",
      content: "Full article content here...",
      author: {
        id: "2",
        name: "Mike Chen",
        avatar: "/images/Avatar.jpg",
        role: "Mentor"
      },
      category: "web-development",
      tags: ["CSS", "Grid", "Layout", "Design"],
      publishedAt: "2024-01-12",
      readTime: 12,
      views: 956,
      likes: 67,
      comments: 18,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop"
    },
    {
      id: "3",
      title: "Mobile-First Design Principles",
      excerpt: "Understanding how to design for mobile devices first and scale up to larger screens effectively.",
      content: "Full article content here...",
      author: {
        id: "3",
        name: "Lisa Wang",
        avatar: "/images/Avatar.jpg",
        role: "Expert"
      },
      category: "design",
      tags: ["Mobile", "Design", "UX", "Responsive"],
      publishedAt: "2024-01-10",
      readTime: 6,
      views: 723,
      likes: 45,
      comments: 12,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=400&fit=crop"
    },
    {
      id: "4",
      title: "Career Transition: From Bootcamp to Tech Job",
      excerpt: "Real stories and practical advice for breaking into tech after completing a coding bootcamp.",
      content: "Full article content here...",
      author: {
        id: "4",
        name: "David Park",
        avatar: "/images/Avatar.jpg",
        role: "Student"
      },
      category: "career",
      tags: ["Career", "Bootcamp", "Job Search", "Advice"],
      publishedAt: "2024-01-08",
      readTime: 10,
      views: 1456,
      likes: 124,
      comments: 45,
      featured: true,
      coverImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop"
    },
    {
      id: "5",
      title: "Introduction to Machine Learning with Python",
      excerpt: "Get started with machine learning using Python. Cover basic concepts and build your first ML model.",
      content: "Full article content here...",
      author: {
        id: "5",
        name: "Alex Thompson",
        avatar: "/images/Avatar.jpg",
        role: "Student"
      },
      category: "tutorials",
      tags: ["Python", "Machine Learning", "AI", "Data Science"],
      publishedAt: "2024-01-05",
      readTime: 15,
      views: 892,
      likes: 78,
      comments: 31,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop"
    },
    {
      id: "6",
      title: "Understanding Asynchronous JavaScript",
      excerpt: "A deep dive into callbacks, Promises, and async/await for cleaner asynchronous code.",
      content: "Full article content here...",
      author: {
        id: "1",
        name: "Emma Rodriguez",
        avatar: "/images/Avatar.jpg",
        role: "Expert"
      },
      category: "web-development",
      tags: ["JavaScript", "Async", "Promises"],
      publishedAt: "2023-12-28",
      readTime: 9,
      views: 1100,
      likes: 75,
      comments: 20,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&h=400&fit=crop"
    },
    {
      id: "7",
      title: "Getting Started with Next.js",
      excerpt: "Build server-rendered React applications with Next.js for better performance and SEO.",
      content: "Full article content here...",
      author: {
        id: "2",
        name: "Mike Chen",
        avatar: "/images/Avatar.jpg",
        role: "Mentor"
      },
      category: "web-development",
      tags: ["Next.js", "React", "SSR"],
      publishedAt: "2023-12-20",
      readTime: 11,
      views: 1300,
      likes: 90,
      comments: 25,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1605379399642-870262d3d051?w=800&h=400&fit=crop"
    },
    {
      id: "8",
      title: "Introduction to Docker for Developers",
      excerpt: "Containerize your applications with Docker for consistent environments and easier deployment.",
      content: "Full article content here...",
      author: {
        id: "3",
        name: "Lisa Wang",
        avatar: "/images/Avatar.jpg",
        role: "Expert"
      },
      category: "tutorials",
      tags: ["Docker", "DevOps", "Deployment"],
      publishedAt: "2023-12-15",
      readTime: 10,
      views: 980,
      likes: 60,
      comments: 15,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&h=400&fit=crop"
    },
    {
      id: "9",
      title: "Effective State Management in React",
      excerpt: "Explore various state management patterns in React, from useState to Redux and Context API.",
      content: "Full article content here...",
      author: {
        id: "1",
        name: "Emma Rodriguez",
        avatar: "/images/Avatar.jpg",
        role: "Expert"
      },
      category: "web-development",
      tags: ["React", "State Management", "Redux"],
      publishedAt: "2023-12-10",
      readTime: 13,
      views: 1500,
      likes: 110,
      comments: 30,
      featured: true,
      coverImage: "https://images.unsplash.com/photo-1618354691948-af73ad896656?w=800&h=400&fit=crop"
    },
    {
      id: "10",
      title: "Building RESTful APIs with Node.js and Express",
      excerpt: "A comprehensive guide to creating robust and scalable RESTful APIs using Node.js and Express.",
      content: "Full article content here...",
      author: {
        id: "2",
        name: "Mike Chen",
        avatar: "/images/Avatar.jpg",
        role: "Mentor"
      },
      category: "web-development",
      tags: ["Node.js", "Express", "API"],
      publishedAt: "2023-12-05",
      readTime: 14,
      views: 1200,
      likes: 85,
      comments: 22,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1593642532400-2660d3d6d9?w=800&h=400&fit=crop"
    },
    {
      id: "11",
      title: "Introduction to Data Structures and Algorithms",
      excerpt: "Understand fundamental data structures and algorithms to improve your problem-solving skills.",
      content: "Full article content here...",
      author: {
        id: "5",
        name: "Alex Thompson",
        avatar: "/images/Avatar.jpg",
        role: "Student"
      },
      category: "tutorials",
      tags: ["Algorithms", "Data Structures", "Computer Science"],
      publishedAt: "2023-11-30",
      readTime: 16,
      views: 1050,
      likes: 70,
      comments: 18,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1517694454-ea0f10221040?w=800&h=400&fit=crop"
    },
    {
      id: "12",
      title: "Mastering Tailwind CSS for Rapid UI Development",
      excerpt: "Learn how to build beautiful and responsive user interfaces quickly with Tailwind CSS.",
      content: "Full article content here...",
      author: {
        id: "3",
        name: "Lisa Wang",
        avatar: "/images/Avatar.jpg",
        role: "Expert"
      },
      category: "design",
      tags: ["Tailwind CSS", "UI", "CSS"],
      publishedAt: "2023-11-25",
      readTime: 8,
      views: 900,
      likes: 55,
      comments: 10,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1610563166150-b34df4f3dd69?w=800&h=400&fit=crop"
    },
    {
      id: "13",
      title: "Advanced SQL for Data Analysis",
      excerpt: "Take your SQL skills to the next level for complex data querying and analysis.",
      content: "Full article content here...",
      author: {
        id: "4",
        name: "David Park",
        avatar: "/images/Avatar.jpg",
        role: "Student"
      },
      category: "data-science",
      tags: ["SQL", "Data Analysis", "Database"],
      publishedAt: "2023-11-20",
      readTime: 12,
      views: 800,
      likes: 50,
      comments: 15,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1542744095-291d1f67b221?w=800&h=400&fit=crop"
    },
    {
      id: "14",
      title: "Introduction to Cybersecurity",
      excerpt: "Learn the basics of protecting digital systems from cyber threats and attacks.",
      content: "Full article content here...",
      author: {
        id: "2",
        name: "Mike Chen",
        avatar: "/images/Avatar.jpg",
        role: "Mentor"
      },
      category: "industry-news",
      tags: ["Cybersecurity", "Security", "Networking"],
      publishedAt: "2023-11-15",
      readTime: 10,
      views: 750,
      likes: 40,
      comments: 10,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop"
    },
    {
      id: "15",
      title: "Building a Portfolio Website with HTML, CSS, and JavaScript",
      excerpt: "Create a stunning personal portfolio website from scratch to showcase your projects.",
      content: "Full article content here...",
      author: {
        id: "1",
        name: "Emma Rodriguez",
        avatar: "/images/Avatar.jpg",
        role: "Expert"
      },
      category: "web-development",
      tags: ["HTML", "CSS", "JavaScript", "Portfolio"],
      publishedAt: "2023-11-10",
      readTime: 7,
      views: 1150,
      likes: 80,
      comments: 20,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=400&fit=crop"
    },
    {
      id: "16",
      title: "The Future of AI in Education",
      excerpt: "Exploring how artificial intelligence is set to revolutionize the learning landscape.",
      content: "Full article content here...",
      author: {
        id: "3",
        name: "Lisa Wang",
        avatar: "/images/Avatar.jpg",
        role: "Expert"
      },
      category: "industry-news",
      tags: ["AI", "Education", "Future Tech"],
      publishedAt: "2023-11-05",
      readTime: 10,
      views: 950,
      likes: 65,
      comments: 15,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1518770660439-4630ee7ba252?w=800&h=400&fit=crop"
    },
    {
      id: "17",
      title: "Mastering Git and GitHub for Version Control",
      excerpt: "A complete guide to using Git and GitHub for collaborative development and version control.",
      content: "Full article content here...",
      author: {
        id: "2",
        name: "Mike Chen",
        avatar: "/images/Avatar.jpg",
        role: "Mentor"
      },
      category: "tutorials",
      tags: ["Git", "GitHub", "Version Control"],
      publishedAt: "2023-10-30",
      readTime: 11,
      views: 1000,
      likes: 70,
      comments: 18,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1584968159000-d3d0c825a7d8?w=800&h=400&fit=crop"
    },
    {
      id: "18",
      title: "Responsive Web Design with Bootstrap 5",
      excerpt: "Build responsive and mobile-first websites quickly using Bootstrap 5 framework.",
      content: "Full article content here...",
      author: {
        id: "1",
        name: "Emma Rodriguez",
        avatar: "/images/Avatar.jpg",
        role: "Expert"
      },
      category: "web-development",
      tags: ["Bootstrap", "Responsive Design", "CSS"],
      publishedAt: "2023-10-25",
      readTime: 9,
      views: 850,
      likes: 50,
      comments: 12,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop"
    },
    {
      id: "19",
      title: "Career Paths in Tech: A Comprehensive Guide",
      excerpt: "Explore different career paths in the technology industry and how to get started.",
      content: "Full article content here...",
      author: {
        id: "4",
        name: "David Park",
        avatar: "/images/Avatar.jpg",
        role: "Student"
      },
      category: "career",
      tags: ["Career", "Tech Industry", "Job Search"],
      publishedAt: "2023-10-20",
      readTime: 10,
      views: 1300,
      likes: 95,
      comments: 28,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=400&fit=crop"
    },
    {
      id: "20",
      title: "Introduction to Cloud Computing with AWS",
      excerpt: "Get started with Amazon Web Services (AWS) and understand cloud computing fundamentals.",
      content: "Full article content here...",
      author: {
        id: "5",
        name: "Alex Thompson",
        avatar: "/images/Avatar.jpg",
        role: "Student"
      },
      category: "tutorials",
      tags: ["AWS", "Cloud Computing", "DevOps"],
      publishedAt: "2023-10-15",
      readTime: 12,
      views: 1100,
      likes: 70,
      comments: 15,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1593642532400-2660d3d6d9?w=800&h=400&fit=crop"
    }
  ];

  const popularTags = useMemo(() => {
    const allTags = blogPosts.flatMap(post => post.tags);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]).slice(0, 8);
  }, [blogPosts]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredPosts = useMemo(() => {
    return blogPosts.filter(post => {
      const matchesSearch =
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [blogPosts, searchQuery, selectedCategory]);

  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b.likes + b.comments) - (a.likes + a.comments);
        case "views":
          return b.views - a.views;
        case "oldest":
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        default: // recent
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
    });
  }, [filteredPosts, sortBy]);

  const featuredPosts = useMemo(() => sortedPosts.filter(post => post.featured), [sortedPosts]);
  const regularPosts = useMemo(() => sortedPosts.filter(post => !post.featured), [sortedPosts]);

  const handleScroll = useCallback(() => {
    if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 100 && // 100px buffer from bottom
        postsToShow < regularPosts.length
    ) {
      setPostsToShow(prev => prev + 10);
    }
  }, [postsToShow, regularPosts.length]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("recent");
    setPostsToShow(10);
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <HeaderUltra />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <BlogHeroSection
              title="Development Blog"
              description="Discover insights, tutorials, and industry trends from our community of developers and experts"
          />

          <BlogStatsBar posts={blogPosts} />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <BlogSidebar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                sortBy={sortBy}
                setSortBy={setSortBy}
                categories={categories}
                popularTags={popularTags}
            />

            <div className="lg:col-span-3 space-y-8">
              <FeaturedPostsSection
                  featuredPosts={featuredPosts}
                  categories={categories}
                  formatDate={formatDate}
              />

              <LatestArticlesSection
                  regularPosts={regularPosts}
                  postsToShow={postsToShow}
                  categories={categories}
                  formatDate={formatDate}
                  onClearFilters={handleClearFilters}
              />

              {/* Loading indicator for infinite scroll */}
              {postsToShow < regularPosts.length && (
                  <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-center mt-8"
                  >
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                    <p className="text-muted-foreground text-sm mt-2">Loading more articles...</p>
                  </motion.div>
              )}
            </div>
          </div>

          <BlogNewsletterSignup />
        </div>

        <Footer />
      </div>
  );
}