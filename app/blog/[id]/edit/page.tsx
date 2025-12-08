"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra";
import { Footer } from "@/components/ui/footers/footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BlogEditForm } from "@/components/blog/BlogEditForm";
import { getBlogCategories } from "@/integrations/strapi/blogCategory";
import { BlogCategory } from "@/types/blog";
import { motion } from "framer-motion";

export default function BlogEditPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await getBlogCategories();
        setCategories(cats);
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCategories();
  }, []);

  const handleSuccess = () => {
    router.push(`/blog/${postId}`);
  };

  const handleCancel = () => {
    router.push(`/blog/${postId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderUltra />
        <div className="container pt-24 min-h-screen flex justify-center items-center">
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HeaderUltra />

      <div className="container pt-24 pb-12">
        {/* Back Button */}
        <div className="mb-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto"
          >
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="flex items-center gap-2 hover:bg-accent/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Post
            </Button>
          </motion.div>
        </div>

        {/* Edit Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Edit Blog Post
            </h1>
            <p className="text-muted-foreground">Update your blog post content and settings</p>
          </div>
          
          <BlogEditForm
            postId={postId}
            categories={categories}
            onCancel={handleCancel}
            onSuccess={handleSuccess}
          />
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

