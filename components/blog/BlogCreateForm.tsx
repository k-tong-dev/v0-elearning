"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { BlogCategory } from "@/types/blog";
import { createBlogPost } from "@/integrations/strapi/blog";
import { ArticleEditor } from "@/components/dashboard/course-form/ArticleEditor";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileUpload } from "@/components/ui/file-upload";

interface BlogCreateFormProps {
  categories: BlogCategory[];
  onCancel: () => void;
  onSuccess: () => void;
}

export function BlogCreateForm({ categories, onCancel, onSuccess }: BlogCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeoOpen, setIsSeoOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    tags: "",
    readTime: 0,
    isFeatured: false,
    coverImage: null as File | null,
    seo: {
      metaTitle: "",
      metaDescription: "",
      keywords: "",
      ogImage: null as File | null,
      ogType: "article" as "article" | "website",
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCoverImageChange = (files: File[]) => {
    setFormData(prev => ({
      ...prev,
      coverImage: files[0] || null,
    }));
  };

  const handleSeoOgImageChange = (files: File[]) => {
    setFormData(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        ogImage: files[0] || null,
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
      // Parse tags
      const tags = formData.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Find category - can be found by slug or id
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

      // Use documentId if available, otherwise use numeric id
      const categoryIdentifier = selectedCategory.documentId || selectedCategory.id;

      // Create blog post
      await createBlogPost({
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        categoryId: categoryIdentifier,
        tags,
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

      toast.success("Blog post created successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Error creating blog post:", error);
      toast.error(error.message || "Failed to create blog post");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                placeholder="Write a brief, engaging description that will appear in blog listings..."
                rows={4}
                className="text-base resize-none"
                required
              />
              <p className="text-sm text-muted-foreground">A short summary that captures the essence of your post</p>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-base font-semibold">Content *</Label>
              <div className="rounded-lg overflow-hidden">
                <ArticleEditor
                  value={formData.content}
                  onChange={(value) => handleContentChange(value)}
                  placeholder="Start writing your blog post content here. You can use markdown formatting..."
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

            {/* Category and Tags Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-base font-semibold">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange("tags", e.target.value)}
                  placeholder="react, typescript, tutorial"
                  className="h-12 text-base"
                />
                <p className="text-sm text-muted-foreground">Separate tags with commas</p>
              </div>
            </div>


            {/* Cover Image */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Cover Image</Label>
              <FileUpload
                accept="image/*"
                multiple={false}
                maxSize={5 * 1024 * 1024} // 5MB
                onChange={handleCoverImageChange}
                value={formData.coverImage ? [formData.coverImage] : undefined}
                placeholder="Upload cover image"
                description="Drag or drop your cover image here or click to upload. Recommended: 1200x600px (JPG, PNG)"
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
                    {/* Meta Title */}
                    <div className="space-y-2">
                      <Label htmlFor="seoMetaTitle" className="text-base font-semibold">Meta Title</Label>
                      <Input
                        id="seoMetaTitle"
                        value={formData.seo.metaTitle}
                        onChange={(e) => handleInputChange("seo", { ...formData.seo, metaTitle: e.target.value })}
                        placeholder="SEO optimized title (defaults to post title if empty)"
                        className="h-12 text-base"
                      />
                      <p className="text-sm text-muted-foreground">Recommended: 50-60 characters</p>
                    </div>

                    {/* Meta Description */}
                    <div className="space-y-2">
                      <Label htmlFor="seoMetaDescription" className="text-base font-semibold">Meta Description</Label>
                      <Textarea
                        id="seoMetaDescription"
                        value={formData.seo.metaDescription}
                        onChange={(e) => handleInputChange("seo", { ...formData.seo, metaDescription: e.target.value })}
                        placeholder="SEO description for search results (defaults to excerpt if empty)"
                        rows={3}
                        className="text-base resize-none"
                      />
                      <p className="text-sm text-muted-foreground">Recommended: 150-160 characters</p>
                    </div>

                    {/* Keywords */}
                    <div className="space-y-2">
                      <Label htmlFor="seoKeywords" className="text-base font-semibold">Keywords</Label>
                      <Input
                        id="seoKeywords"
                        value={formData.seo.keywords}
                        onChange={(e) => handleInputChange("seo", { ...formData.seo, keywords: e.target.value })}
                        placeholder="comma, separated, keywords"
                        className="h-12 text-base"
                      />
                      <p className="text-sm text-muted-foreground">Separate keywords with commas</p>
                    </div>

                    {/* OG Image */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Open Graph Image</Label>
                      <FileUpload
                        accept="image/*"
                        multiple={false}
                        maxSize={5 * 1024 * 1024} // 5MB
                        onChange={handleSeoOgImageChange}
                        value={formData.seo.ogImage ? [formData.seo.ogImage] : undefined}
                        placeholder="Upload OG image"
                        description="Image for social media sharing (defaults to cover image if empty)"
                        showFileList={true}
                        showFileDetails={true}
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* OG Type */}
                    <div className="space-y-2">
                      <Label htmlFor="seoOgType" className="text-base font-semibold">OG Type</Label>
                      <Select
                        value={formData.seo.ogType}
                        onValueChange={(value: "article" | "website") => handleInputChange("seo", { ...formData.seo, ogType: value })}
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
            <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Publish Post"
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel} 
                disabled={isSubmitting}
                className="h-12 px-8 text-base"
              >
                Cancel
              </Button>
            </div>
          </form>
  );
}

