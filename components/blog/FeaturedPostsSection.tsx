"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { BlogPost, BlogCategory } from "@/types/blog";
import { BlogPostCard } from "./BlogPostCard";

interface FeaturedPostsSectionProps {
    featuredPosts: BlogPost[];
    categories: BlogCategory[];
    formatDate: (dateString: string) => string;
}

export function FeaturedPostsSection({ featuredPosts, categories, formatDate }: FeaturedPostsSectionProps) {
    if (featuredPosts.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
        >
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" />
                Featured Articles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredPosts.map((post, index) => (
                    <BlogPostCard
                        key={post.id}
                        post={post}
                        categories={categories}
                        formatDate={formatDate}
                        isFeatured={true}
                        delay={0.1 * index}
                    />
                ))}
            </div>
        </motion.div>
    );
}