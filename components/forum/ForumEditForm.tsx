"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, FileText, Tag, Settings, CheckCircle2, Sparkles, Loader2, FileEdit, Globe, Archive, Lock } from "lucide-react";
import { toast } from "sonner";
import { ForumCategory } from "@/integrations/strapi/forum";
import { updateForumPost } from "@/integrations/strapi/forum";
import { ArticleEditor } from "@/components/dashboard/course-form/ArticleEditor";
import { strapiPublic } from "@/integrations/strapi/client";
import { ForumPost } from "@/types/forum";

interface ForumEditFormProps {
  post: ForumPost;
  categories: ForumCategory[];
  onCancel: () => void;
  onSuccess: () => void;
}

export function ForumEditForm({ post, categories, onCancel, onSuccess }: ForumEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTags, setAvailableTags] = useState<Array<{id: number; name: string; code?: string}>>([]);
  
  // Get description from post prop (it's added as (post as any).description in the detail page)
  const postDescription = (post as any).description || "";
  
  // Normalize category value to match dropdown values (slug or name)
  const normalizeCategoryValue = React.useCallback((categoryValue: string | undefined, cats: ForumCategory[]): string => {
    if (!categoryValue) return "";
    if (!cats || cats.length === 0) return categoryValue; // Return original if categories not loaded yet
    
    // First try to find exact match by slug or name
    const matchedCategory = cats.find(
      cat => cat.slug === categoryValue || cat.name === categoryValue
    );
    if (matchedCategory) {
      return matchedCategory.slug || matchedCategory.name || categoryValue;
    }
    // If no match, return the original value (it might still work if it's an enum value)
    return categoryValue;
  }, []);
  
  const [formData, setFormData] = useState({
    name: post.title || "",
    description: postDescription,
    content: post.content || "",
    category: normalizeCategoryValue(post.category, categories),
    tags: post.tags?.join(", ") || "",
    status: "published" as "draft" | "published" | "archived" | "closed",
    isAnswered: post.isAnswered || false,
  });

  // Update formData when post prop or categories change
  useEffect(() => {
    const currentDescription = (post as any).description || "";
    const normalizedCategory = normalizeCategoryValue(post.category, categories);
    
    setFormData(prev => ({
      ...prev,
      description: currentDescription || prev.description,
      category: normalizedCategory || prev.category,
    }));
  }, [post, categories, normalizeCategoryValue]);

  // Fetch forum tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await strapiPublic.get('/api/forum-tags?pagination[pageSize]=100');
        const tags = (response.data?.data ?? []).map((tag: any) => ({
          id: tag.id,
          name: tag.attributes?.name ?? tag.name ?? '',
          code: tag.attributes?.code ?? tag.code,
        }));
        setAvailableTags(tags);
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };
    fetchTags();
  }, []);

  // Fetch post details (description, status, and category) if not already in post prop
  useEffect(() => {
    const fetchPostDetails = async () => {
      // If description is already available from post prop and not empty, skip fetch
      if (postDescription && postDescription.trim()) {
        return;
      }
      
      try {
        // Try using documentId if available, otherwise use numeric id
        const postId = (post as any).documentId || post.id;
        
        // Check if postId is numeric or documentId format
        const isNumericId = /^\d+$/.test(String(postId));
        
        let response;
        if (isNumericId) {
          // Use filter query for numeric IDs
          response = await strapiPublic.get(`/api/forum-forums?filters[id][$eq]=${postId}&populate=*`);
          const posts = response.data?.data ?? [];
          if (posts.length > 0) {
            const postData = posts[0];
            const attrs = postData.attributes || postData;
            const updates: Partial<typeof formData> = {};
            
            if (attrs.description) {
              updates.description = attrs.description;
            }
            if (attrs.forum_status) {
              updates.status = attrs.forum_status as typeof formData.status;
            }
            if (attrs.category) {
              updates.category = normalizeCategoryValue(attrs.category, categories);
            }
            
            if (Object.keys(updates).length > 0) {
              setFormData(prev => ({ ...prev, ...updates }));
            }
          }
        } else {
          // Use direct lookup for documentId
          response = await strapiPublic.get(`/api/forum-forums/${postId}?populate=*`);
          const postData = response.data?.data;
          if (postData) {
            const attrs = postData.attributes || postData;
            const updates: Partial<typeof formData> = {};
            
            if (attrs.description) {
              updates.description = attrs.description;
            }
            if (attrs.forum_status) {
              updates.status = attrs.forum_status as typeof formData.status;
            }
            if (attrs.category) {
              updates.category = normalizeCategoryValue(attrs.category, categories);
            }
            
            if (Object.keys(updates).length > 0) {
              setFormData(prev => ({ ...prev, ...updates }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching post details:', error);
      }
    };
    fetchPostDetails();
  }, [post.id, postDescription, categories, normalizeCategoryValue]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Subject/Title is required");
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error("Description is required");
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
      // Use documentId if available, otherwise use id
      const postId = (post as any).documentId || post.id;
      
      // Process tags
      const tagInputs = formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(t => t) : [];
      const tags = tagInputs.length > 0 ? tagInputs : undefined;

      await updateForumPost(postId, {
        name: formData.name,
        description: formData.description,
        content: formData.content,
        category: formData.category as any,
        tags: tags,
        status: formData.status,
        isAnswered: formData.isAnswered,
      });

      toast.success("Discussion updated successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Error updating forum post:", error);
      toast.error(error.message || "Failed to update discussion");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-background via-background to-accent/5">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Edit Discussion
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Update your discussion and engage with the community
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={onCancel} className="hover:bg-accent/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Discussion
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Subject/Title */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Subject / Title *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter a clear, descriptive subject..."
                required
                className="h-12 text-base border-2 focus:border-primary/50"
              />
            </div>

            {/* Description with Rich Text Editor */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-base font-semibold">
                Description *
              </Label>
              <div className="rounded-lg overflow-hidden shadow-sm hover:border-primary/30 transition-colors">
                <ArticleEditor
                  value={formData.description}
                  onChange={(value) => handleInputChange("description", value)}
                  placeholder="Brief description of your discussion topic..."
                />
              </div>
            </div>

            {/* Content with Rich Text Editor */}
            <div className="space-y-3">
              <Label htmlFor="content" className="text-base font-semibold">
                Content *
              </Label>
              <div className="rounded-lg overflow-hidden shadow-sm hover:border-primary/30 transition-colors">
                <ArticleEditor
                  value={formData.content}
                  onChange={(value) => handleInputChange("content", value)}
                  placeholder="What would you like to discuss? Be as detailed as possible..."
                />
              </div>
            </div>

            {/* Category and Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div className="space-y-3">
                <Label htmlFor="category" className="text-base font-semibold flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Category *
                </Label>
                <Select 
                  value={formData.category || undefined} 
                  onValueChange={(value) => handleInputChange("category", value)}
                >
                  <SelectTrigger className="h-12 border-2">
                    <SelectValue placeholder="Select a category">
                      {formData.category ? categories.find(c => (c.slug || c.name) === formData.category)?.name || formData.category : "Select a category"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length > 0 ? (
                      categories.map((category) => {
                        const categoryValue = category.slug || category.name;
                        return (
                          <SelectItem key={categoryValue} value={categoryValue}>
                            {category.name}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No categories available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Status - Button-based State Machine */}
              <div className="space-y-3">
                <Label htmlFor="status" className="text-base font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  Status
                </Label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { 
                      value: 'draft', 
                      label: 'Draft', 
                      description: 'Save for later',
                      icon: FileEdit,
                      activeGradient: 'from-amber-500 via-amber-600 to-orange-600',
                      inactiveBg: 'bg-amber-50 dark:bg-amber-950/20',
                      inactiveBorder: 'border-amber-200 dark:border-amber-800',
                      inactiveText: 'text-amber-700 dark:text-amber-400',
                      inactiveHover: 'hover:from-amber-100 hover:to-amber-50 dark:hover:from-amber-950/40 dark:hover:to-amber-950/20'
                    },
                    { 
                      value: 'published', 
                      label: 'Published', 
                      description: 'Visible to everyone',
                      icon: Globe,
                      activeGradient: 'from-green-500 via-emerald-600 to-teal-600',
                      inactiveBg: 'bg-green-50 dark:bg-green-950/20',
                      inactiveBorder: 'border-green-200 dark:border-green-800',
                      inactiveText: 'text-green-700 dark:text-green-400',
                      inactiveHover: 'hover:from-green-100 hover:to-green-50 dark:hover:from-green-950/40 dark:hover:to-green-950/20'
                    },
                    { 
                      value: 'archived', 
                      label: 'Archived', 
                      description: 'Hidden from main view',
                      icon: Archive,
                      activeGradient: 'from-slate-500 via-gray-600 to-zinc-600',
                      inactiveBg: 'bg-slate-50 dark:bg-slate-950/20',
                      inactiveBorder: 'border-slate-200 dark:border-slate-800',
                      inactiveText: 'text-slate-700 dark:text-slate-400',
                      inactiveHover: 'hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-950/40 dark:hover:to-slate-950/20'
                    },
                    { 
                      value: 'closed', 
                      label: 'Closed', 
                      description: 'No new replies',
                      icon: Lock,
                      activeGradient: 'from-red-500 via-rose-600 to-pink-600',
                      inactiveBg: 'bg-red-50 dark:bg-red-950/20',
                      inactiveBorder: 'border-red-200 dark:border-red-800',
                      inactiveText: 'text-red-700 dark:text-red-400',
                      inactiveHover: 'hover:from-red-100 hover:to-red-50 dark:hover:from-red-950/40 dark:hover:to-red-950/20'
                    },
                  ].map((statusOption) => {
                    const Icon = statusOption.icon;
                    const isActive = formData.status === statusOption.value;
                    const shadowClass = isActive ? (
                      statusOption.value === 'draft' ? 'shadow-amber-500/50' :
                      statusOption.value === 'published' ? 'shadow-green-500/50' :
                      statusOption.value === 'archived' ? 'shadow-slate-500/50' :
                      'shadow-red-500/50'
                    ) : '';
                    return (
                      <Button
                        key={statusOption.value}
                        type="button"
                        onClick={() => handleInputChange("status", statusOption.value as typeof formData.status)}
                        className={`
                          h-14 px-5 flex items-center gap-2.5 transition-all duration-200 transform hover:scale-105 active:scale-95
                          ${isActive 
                            ? `bg-gradient-to-r ${statusOption.activeGradient} text-white shadow-lg ${shadowClass} border-2 border-transparent` 
                            : `${statusOption.inactiveBg} ${statusOption.inactiveBorder} border-2 ${statusOption.inactiveText} ${statusOption.inactiveHover}`
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                        <div className="flex flex-col items-start">
                          <span className={`text-sm font-bold leading-tight ${isActive ? 'text-white' : ''}`}>
                            {statusOption.label}
                          </span>
                          <span className={`text-xs leading-tight ${isActive ? 'text-white/90' : 'text-muted-foreground'}`}>
                            {statusOption.description}
                          </span>
                        </div>
                        {isActive && (
                          <CheckCircle2 className="w-4 h-4 ml-auto text-white/90" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <Label htmlFor="tags" className="text-base font-semibold flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                Tags (Optional)
              </Label>
              
              {/* Selected Tags Display - Always show if tags exist */}
              {formData.tags && formData.tags.split(",").map(t => t.trim()).filter(Boolean).length > 0 && (
                <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-r from-primary/5 via-primary/5 to-transparent rounded-lg border-2 border-primary/20">
                  {formData.tags.split(",").map(t => t.trim()).filter(Boolean).map((tag, idx) => {
                    const tagInfo = availableTags.find(t => (t.code || t.name) === tag);
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary/15 text-primary rounded-md border border-primary/30 font-medium shadow-sm"
                      >
                        {tagInfo?.name || tag}
                        <button
                          type="button"
                          onClick={() => {
                            const currentTags = formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
                            const newTags = currentTags.filter(t => t !== tag).join(", ");
                            handleInputChange("tags", newTags);
                          }}
                          className="ml-1 hover:text-destructive transition-colors text-base leading-none"
                          aria-label={`Remove ${tagInfo?.name || tag} tag`}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              
              {/* Tag Selection Dropdown */}
              {availableTags.length > 0 ? (
                <Select
                  value=""
                  onValueChange={(value) => {
                    const currentTags = formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
                    if (value && !currentTags.includes(value)) {
                      const newTags = [...currentTags, value].join(", ");
                      handleInputChange("tags", newTags);
                    }
                  }}
                >
                  <SelectTrigger className="h-12 border-2">
                    <SelectValue placeholder={formData.tags && formData.tags.split(",").map(t => t.trim()).filter(Boolean).length > 0 ? "Add more tags..." : "Select or search tags"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags
                      .filter(tag => {
                        const currentTags = formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
                        return !currentTags.includes(tag.code || tag.name);
                      })
                      .map(tag => (
                        <SelectItem key={tag.code || tag.name} value={tag.code || tag.name}>
                          {tag.name}
                        </SelectItem>
                      ))}
                    {formData.tags && formData.tags.split(",").map(t => t.trim()).filter(Boolean).length >= availableTags.length && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                        All tags selected
                      </div>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-12 border-2 border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">Loading tags...</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Add relevant tags to help others find your discussion
              </p>
            </div>

            {/* Mark as Answered */}
            <div className="flex items-center justify-between p-6 border-2 border-border/50 rounded-xl bg-gradient-to-r from-primary/5 via-primary/5 to-transparent hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="isAnswered" className="cursor-pointer text-base font-semibold">
                    Mark as Answered
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    Toggle this if your question has been resolved
                  </span>
                </div>
              </div>
              <Switch
                id="isAnswered"
                checked={formData.isAnswered}
                onCheckedChange={(checked) => handleInputChange("isAnswered", checked)}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="group relative flex-1 h-16 overflow-hidden text-base font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-2xl shadow-purple-500/50 hover:shadow-purple-600/60 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {/* Animated background shine effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                
                {isSubmitting ? (
                  <span className="relative flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Updating Discussion...</span>
                  </span>
                ) : (
                  <span className="relative flex items-center justify-center gap-3">
                    <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-lg">Update Discussion</span>
                    <Sparkles className="w-4 h-4 opacity-80" />
                  </span>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel} 
                disabled={isSubmitting}
                className="h-16 px-10 border-2 border-border hover:bg-muted/80 hover:border-muted-foreground/50 transition-all duration-200 font-medium"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

