"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { BlogCategory } from "@/types/blog";
import { updateBlogPost, getBlogPostById, getBlogPostBySlug, getBlogPostByDocumentId, isBlogPostAuthor } from "@/integrations/strapi/blog";
import { ArticleEditor } from "@/components/dashboard/course-form/ArticleEditor";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileUpload } from "@/components/ui/file-upload";
import { BlogPost } from "@/types/blog";

interface BlogEditFormProps {
  postId: string | number;
  categories: BlogCategory[];
  onCancel: () => void;
  onSuccess: () => void;
}

export function BlogEditForm({ postId, categories, onCancel, onSuccess }: BlogEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeoOpen, setIsSeoOpen] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [postNumericId, setPostNumericId] = useState<string | number | null>(null);
  const [postAuthorId, setPostAuthorId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    tags: "",
    readTime: 0,
    isFeatured: false,
    coverImage: null as File | null,
    coverImageUrl: null as string | null,
    seo: {
      metaTitle: "",
      metaDescription: "",
      keywords: "",
      ogImage: null as File | null,
      ogImageUrl: null as string | null,
      ogType: "article" as "article" | "website",
    },
  });

  // Load existing post data
  useEffect(() => {
    async function loadPost() {
      // Wait for categories to be loaded
      if (categories.length === 0) {
        return;
      }

      try {
        setIsLoading(true);
        
        // Load post data - try documentId first (if it looks like one), then slug, then numeric ID
        let post = null;
        const looksLikeDocumentId = typeof postId === 'string' && postId.includes('-') && postId.length > 20;
        
        if (looksLikeDocumentId) {
          // Try documentId first if it looks like one
          post = await getBlogPostByDocumentId(postId);
        }
        
        // If not found yet, try slug or numeric ID
        if (!post) {
          post = await getBlogPostBySlug(postId) || await getBlogPostById(postId);
        }
        
        // Last resort: try documentId even if it doesn't look like one (in case it's a short UUID)
        if (!post) {
          post = await getBlogPostByDocumentId(postId);
        }
        
        if (!post) {
          toast.error("Blog post not found");
          setIsLoading(false);
          return;
        }
        
        // Store numeric ID and author ID for later use
        setPostNumericId(post.id);
        setPostAuthorId(post.author.id);
        
        // Check if user can edit - pass author ID to avoid refetching
        const canEditPost = await isBlogPostAuthor(post.id, post.author.id);
        if (!canEditPost) {
          toast.error("You don't have permission to edit this post");
          setCanEdit(false);
          setIsLoading(false);
          return;
        }
        
        setCanEdit(true);

        // Find the matching category from the categories list
        // The post.category might have id, slug, or documentId
        let selectedCategoryValue = "";
        if (post.category && categories.length > 0) {
          // Try to find matching category by id, slug, or documentId
          const matchingCategory = categories.find(cat => 
            String(cat.id) === String(post.category?.id) ||
            cat.slug === post.category?.slug ||
            (post.category?.documentId && cat.documentId === post.category.documentId)
          );
          
          if (matchingCategory) {
            // Use documentId if available, otherwise use id (matching Select option values)
            selectedCategoryValue = matchingCategory.documentId || String(matchingCategory.id);
          } else if (post.category?.slug) {
            // Fallback: try to find by slug
            const slugMatch = categories.find(cat => cat.slug === post.category?.slug);
            if (slugMatch) {
              selectedCategoryValue = slugMatch.documentId || String(slugMatch.id);
            }
          } else if (post.category?.id) {
            // Fallback: use the id directly (try to match)
            const idMatch = categories.find(cat => String(cat.id) === String(post.category?.id));
            if (idMatch) {
              selectedCategoryValue = idMatch.documentId || String(idMatch.id);
            } else {
              // Last resort: use the id as-is
              selectedCategoryValue = String(post.category.id);
            }
          }
        }

        // Populate form with existing data
        setFormData({
          title: post.title || "",
          excerpt: post.excerpt || "",
          content: post.content || "",
          category: selectedCategoryValue,
          tags: post.tags?.join(", ") || "",
          readTime: post.readTime || 0,
          isFeatured: post.isFeatured || false,
          coverImage: null,
          coverImageUrl: post.coverImage || null,
          seo: {
            metaTitle: post.seo?.metaTitle || "",
            metaDescription: post.seo?.metaDescription || "",
            keywords: post.seo?.keywords || "",
            ogImage: null,
            ogImageUrl: post.seo?.ogImage || null,
            ogType: (post.seo?.ogType as "article" | "website") || "article",
          },
        });
      } catch (error: any) {
        console.error("Error loading post:", error);
        toast.error(error.message || "Failed to load post");
      } finally {
        setIsLoading(false);
      }
    }

    loadPost();
  }, [postId, categories]);

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith("seo.")) {
      const seoField = field.split(".")[1];
      setFormData(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          [seoField]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCoverImageChange = (files: File[]) => {
    setFormData(prev => ({
      ...prev,
      coverImage: files[0] || null,
      coverImageUrl: files[0] ? URL.createObjectURL(files[0]) : prev.coverImageUrl,
    }));
  };

  const handleSeoOgImageChange = (files: File[]) => {
    setFormData(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        ogImage: files[0] || null,
        ogImageUrl: files[0] ? URL.createObjectURL(files[0]) : prev.seo.ogImageUrl,
      },
    }));
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const handleContentChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      content: value,
      readTime: calculateReadTime(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    
    if (!formData.excerpt.trim()) {
      toast.error("Excerpt is required");
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error("Content is required");
      return;
    }
    
    if (!formData.category) {
      toast.error("Category is required");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Find category
      const selectedCategory = categories.find(cat => 
        cat.slug === formData.category || 
        String(cat.id) === formData.category ||
        cat.documentId === formData.category
      );
      if (!selectedCategory) {
        toast.error("Invalid category selected");
        setIsSubmitting(false);
        return;
      }

      const categoryIdentifier = selectedCategory.documentId || selectedCategory.id;

      // Update blog post
      await updateBlogPost(postId, {
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        categoryId: categoryIdentifier,
        readTime: formData.readTime || calculateReadTime(formData.content),
        isFeatured: formData.isFeatured,
        coverImage: formData.coverImage,
        seo: formData.seo.metaTitle || formData.seo.metaDescription || formData.seo.keywords || formData.seo.ogImage
          ? {
              metaTitle: formData.seo.metaTitle || undefined,
              metaDescription: formData.seo.metaDescription || undefined,
              keywords: formData.seo.keywords || undefined,
              ogImage: formData.seo.ogImage || undefined,
              ogType: formData.seo.ogType,
            }
          : undefined,
      });

      toast.success("Blog post updated successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Error updating blog post:", error);
      toast.error(error.message || "Failed to update blog post");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-screen flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">You don't have permission to edit this post.</p>
        <Button onClick={onCancel} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-semibold">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          placeholder="Enter a compelling blog post title..."
          className="h-12 text-base"
          required
        />
      </div>

      {/* Excerpt */}
      <div className="space-y-2">
        <Label htmlFor="excerpt" className="text-base font-semibold">Excerpt *</Label>
        <Textarea
          id="excerpt"
          value={formData.excerpt}
          onChange={(e) => handleInputChange("excerpt", e.target.value)}
          placeholder="Write a brief, engaging description..."
          rows={4}
          className="text-base resize-none"
          required
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content" className="text-base font-semibold">Content *</Label>
        <div className="rounded-lg overflow-hidden">
          <ArticleEditor
            value={formData.content}
            onChange={(value) => handleContentChange(value)}
            placeholder="Start writing your blog post content here..."
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Estimated read time: <span className="font-semibold text-foreground">{formData.readTime} minutes</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {formData.content.trim().split(/\s+/).filter(Boolean).length} words
          </p>
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category" className="text-base font-semibold">Category *</Label>
        <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem 
                key={category.id} 
                value={category.documentId || String(category.id)}
              >
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cover Image */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Cover Image</Label>
        {formData.coverImageUrl && !formData.coverImage && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Current cover image:</p>
            <img 
              src={formData.coverImageUrl} 
              alt="Current cover" 
              className="w-full max-w-md h-48 object-cover rounded-lg border"
            />
          </div>
        )}
        <FileUpload
          accept="image/*"
          multiple={false}
          maxSize={5 * 1024 * 1024}
          onChange={handleCoverImageChange}
          value={formData.coverImage ? [formData.coverImage] : undefined}
          placeholder="Upload cover image"
          description="Drag or drop your cover image here or click to upload"
          showFileList={true}
          showFileDetails={true}
          disabled={isSubmitting}
        />
      </div>

      {/* SEO Section */}
      <Collapsible open={isSeoOpen} onOpenChange={setIsSeoOpen}>
        <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="flex flex-col gap-1">
                <Label className="text-base font-semibold cursor-pointer">
                  SEO Settings (Optional)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Optimize your post for search engines and social media
                </p>
              </div>
              {isSeoOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0 space-y-4 border-t border-slate-200 dark:border-slate-700">
              <div className="space-y-2">
                <Label htmlFor="seoMetaTitle">Meta Title</Label>
                <Input
                  id="seoMetaTitle"
                  value={formData.seo.metaTitle}
                  onChange={(e) => handleInputChange("seo.metaTitle", e.target.value)}
                  placeholder="SEO optimized title"
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoMetaDescription">Meta Description</Label>
                <Textarea
                  id="seoMetaDescription"
                  value={formData.seo.metaDescription}
                  onChange={(e) => handleInputChange("seo.metaDescription", e.target.value)}
                  placeholder="SEO description"
                  rows={3}
                  className="text-base resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoKeywords">Keywords</Label>
                <Input
                  id="seoKeywords"
                  value={formData.seo.keywords}
                  onChange={(e) => handleInputChange("seo.keywords", e.target.value)}
                  placeholder="comma, separated, keywords"
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Open Graph Image</Label>
                {formData.seo.ogImageUrl && !formData.seo.ogImage && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Current OG image:</p>
                    <img 
                      src={formData.seo.ogImageUrl} 
                      alt="Current OG image" 
                      className="w-full max-w-md h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}
                <FileUpload
                  accept="image/*"
                  multiple={false}
                  maxSize={5 * 1024 * 1024}
                  onChange={handleSeoOgImageChange}
                  value={formData.seo.ogImage ? [formData.seo.ogImage] : undefined}
                  placeholder="Upload OG image"
                  showFileList={true}
                  showFileDetails={true}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoOgType">OG Type</Label>
                <Select
                  value={formData.seo.ogType}
                  onValueChange={(value: "article" | "website") => handleInputChange("seo.ogType", value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Featured Toggle */}
      <div className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
        <div className="flex flex-col gap-1">
          <Label htmlFor="isFeatured" className="text-base font-semibold cursor-pointer">
            Mark as Featured Post
          </Label>
          <p className="text-sm text-muted-foreground">
            Featured posts appear prominently on the blog homepage
          </p>
        </div>
        <Switch
          id="isFeatured"
          checked={formData.isFeatured}
          onCheckedChange={(checked) => handleInputChange("isFeatured", checked)}
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-4 pt-6  border-slate-200 dark:border-slate-700">
        <Button
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          disabled={isSubmitting}
          className="py-3 px-8 text-base"
        >
          Cancel
        </Button>
        <Button
            type="submit"
            disabled={isSubmitting}
            className="flex py-3 text-md text-white font-normal bg-green-600 shadow-none hover:shadow-none"
        >
          {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Updating...
              </>
          ) : (
              "Update Post"
          )}
        </Button>
      </div>
    </form>
  );
}

