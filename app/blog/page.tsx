"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra";
import { Footer } from "@/components/ui/footers/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, Plus, X, ArrowLeft, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

// Import new modular components
import { BlogStatsBar } from "@/components/blog/BlogStatsBar";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { FeaturedPostsSection } from "@/components/blog/FeaturedPostsSection";
import { LatestArticlesSection } from "@/components/blog/LatestArticlesSection";
import { BlogNewsletterSignup } from "@/components/blog/BlogNewsletterSignup";
import { BlogCreateForm } from "@/components/blog/BlogCreateForm";

// Import types
import { BlogPost, BlogCategory } from "@/types/blog";

// Import Strapi functions
import { getBlogPosts, BlogPost as StrapiBlogPost } from "@/integrations/strapi/blog";
import { getBlogCategories as getStrapiCategories, BlogCategory as StrapiBlogCategory } from "@/integrations/strapi/blogCategory";

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [postsToShow, setPostsToShow] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [strapiPosts, setStrapiPosts] = useState<StrapiBlogPost[]>([]);
  const [strapiCategories, setStrapiCategories] = useState<StrapiBlogCategory[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch data from Strapi
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [postsResult, categoriesData] = await Promise.all([
          getBlogPosts(undefined, { field: 'publishedAt', order: 'desc' }),
          getStrapiCategories()
        ]);
        
        setStrapiPosts(postsResult.data);
        setStrapiCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching blog data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Map Strapi categories to BlogCategory format
  const categories: BlogCategory[] = useMemo(() => {
    return strapiCategories.map(cat => ({
      id: cat.slug || String(cat.id),
      name: cat.name,
      description: cat.description || "",
      postCount: cat.postCount || 0,
      color: cat.color || "bg-blue-500"
    }));
  }, [strapiCategories]);

  // Map Strapi posts to BlogPost format
  const blogPosts: BlogPost[] = useMemo(() => {
    return strapiPosts.map(post => ({
      id: post.slug || String(post.id),
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      author: {
        id: post.author.id,
        name: post.author.name,
        avatar: post.author.avatar || "/images/Avatar.jpg",
        role: post.author.role || "Author",
        bio: post.author.bio,
        reputation: post.author.reputation,
        postCount: post.author.postCount
      },
      category: post.category.slug || String(post.category.id),
      categoryData: {
        id: post.category.id,
        name: post.category.name,
        slug: post.category.slug,
        color: post.category.color
      },
      tags: post.tags || [],
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      readTime: post.readTime,
      views: post.views,
      likes: post.likes,
      comments: post.commentsCount,
      commentsCount: post.commentsCount,
      featured: post.isFeatured,
      isFeatured: post.isFeatured,
      coverImage: post.coverImage || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop",
      slug: post.slug,
      documentId: post.documentId, // Include documentId for routing
      seo: post.seo
    }));
  }, [strapiPosts]);

  // No refetch on filter changes - all filtering is client-side for instant response

  // Popular tags calculation
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

  // Client-side filtering - instant response without page refresh
  const filteredPosts = useMemo(() => {
    return blogPosts.filter(post => {
      // Search filter
      const matchesSearch = !searchQuery || 
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [blogPosts, searchQuery, selectedCategory]);

  const sortedPosts = useMemo(() => {
    // If we're filtering by category, Strapi already sorted, but we can re-sort client-side if needed
    return [...filteredPosts].sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b.likes + (b.commentsCount || b.comments)) - (a.likes + (a.commentsCount || a.comments));
        case "views":
          return b.views - a.views;
        case "oldest":
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        default: // recent
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
    });
  }, [filteredPosts, sortBy]);

  const featuredPosts = useMemo(() => sortedPosts.filter(post => post.featured || post.isFeatured), [sortedPosts]);
  const regularPosts = useMemo(() => sortedPosts.filter(post => !post.featured && !post.isFeatured), [sortedPosts]);

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

  const handleCreateSuccess = async () => {
    setShowCreateForm(false);
    // Refresh the blog posts list
    setIsLoading(true);
    try {
      const postsResult = await getBlogPosts(undefined, { field: 'publishedAt', order: 'desc' });
      setStrapiPosts(postsResult.data);
    } catch (error) {
      console.error("Error refreshing blog posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show create form if toggled
  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderUltra />
        <div className="container mx-auto pt-24">
          <div className="max-w-5xl mx-auto">
            {/* Breadcrumb Navigation */}
            <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
              <button 
                onClick={() => setShowCreateForm(false)}
                className="hover:text-foreground transition-colors"
              >
                Blog
              </button>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium">Create New Post</span>
            </nav>

            {/* Form Container with Clean Design */}
            <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
              {/* Header Section */}
              <div className="bg-card px-8 py-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground mb-1">Create New Blog Post</h1>
                    <p className="text-muted-foreground text-sm">Share your knowledge with the community</p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowCreateForm(false)}
                    className="hover:bg-accent"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-8">
                <BlogCreateForm
                  categories={categories}
                  onCancel={() => setShowCreateForm(false)}
                  onSuccess={handleCreateSuccess}
                />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading && blogPosts.length === 0) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <HeaderUltra />
        <div className="container flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading blog posts...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br bg-transparent dark:bg-black">
        <HeaderUltra />

        {/* Hero Section - Clean and Minimal */}
        <div className="relative pt-24 pb-12 md:pt-32 md:pb-16 bg-transparent dark:bg-black">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <BookOpen className="w-4 h-4" />
                  Knowledge Hub
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
                  Development <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Blog</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Discover insights, tutorials, and industry trends from our community of developers and experts
                </p>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
          {/* Stats Bar */}
          {/*<BlogStatsBar posts={blogPosts} />*/}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
            <BlogSidebar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                sortBy={sortBy}
                setSortBy={setSortBy}
                categories={categories}
                popularTags={popularTags}
                  onCreatePost={() => setShowCreateForm(true)}
            />
            </div>

            {/* Main Content */}
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

        {/* Floating Create Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <Button
              onClick={() => setShowCreateForm(true)}
              size="md"
              className="group relative rounded-full h-16 px-6 shadow-2xl bg-black text-white  border-0 overflow-hidden transition-all duration-300"
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
              
              {/* Button content */}
              <div className="relative flex items-center gap-2 z-10">
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </div>
              
              {/* Shine effect on hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </Button>
          </motion.div>
        </motion.div>

        <Footer />
      </div>
  );
}