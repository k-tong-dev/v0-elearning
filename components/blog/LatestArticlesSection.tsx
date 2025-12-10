"use client";

import React from "react";
import { motion } from "framer-motion";
import {BookOpen, Clock, Eye, Heart} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlogPost, BlogCategory } from "@/types/blog";
import { BlogPostCard } from "./BlogPostCard";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/getAvatarUrl";

interface LatestArticlesSectionProps {
    regularPosts: BlogPost[];
    postsToShow: number;
    categories: BlogCategory[];
    formatDate: (dateString: string) => string;
    onClearFilters: () => void;
}

export function LatestArticlesSection({
                                          regularPosts,
                                          postsToShow,
                                          categories,
                                          formatDate,
                                          onClearFilters,
                                      }: LatestArticlesSectionProps) {
    const displayedPosts = regularPosts.slice(0, postsToShow);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Latest Articles</h2>
                <div className="text-sm text-muted-foreground">
                    Showing {Math.min(postsToShow, regularPosts.length)} of {regularPosts.length} articles
                </div>
            </div>

            {displayedPosts.length > 0 ? (
                <div className="space-y-6">
                    {displayedPosts.map((post, index) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * (index % 4), duration: 0.3 }}
                            className="group"
                        >
                            <Card
                                className="hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer overflow-hidden"
                                onClick={() => window.location.href = `/blog/${post.documentId || post.slug || post.id}`} // Use documentId first to prevent duplicates
                            >
                                <CardContent className="p-0">
                                    <div className="md:flex">
                                        <div className="md:w-1/3 relative">
                                            {post.coverImage && typeof post.coverImage === 'string' && post.coverImage.trim() !== '' ? (
                                            <img
                                                    src={post.coverImage}
                                                alt={post.title}
                                                className="w-full h-48 md:h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            ) : (
                                                <div className="w-full h-48 md:h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 group-hover:scale-110 transition-transform duration-500 relative overflow-hidden">
                                                    {/* Animated gradient overlay for depth */}
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/50 via-transparent to-purple-600/50 animate-pulse" />
                                                    {/* Decorative pattern */}
                                                    <div className="absolute inset-0 opacity-20">
                                                        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                                                        <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-300/20 rounded-full blur-3xl" />
                                                    </div>
                                                    {/* Title overlay for visual interest */}
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="text-white/30 font-bold text-4xl md:text-5xl select-none">
                                                            {post.title.charAt(0).toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:w-2/3 p-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant="outline">
                                                            {post.categoryData?.name || categories.find(c => c.id === post.category)?.name || post.category}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDate(post.publishedAt)}
                                                        </span>
                                                    </div>

                                                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                                        {post.title}
                                                    </h3>

                                                    <p className="text-muted-foreground line-clamp-2">
                                                        {post.excerpt}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-8 h-8">
                                                            <AvatarImage src={getAvatarUrl(post.author.avatar) || "/images/Avatar.jpg"} />
                                                            <AvatarFallback>
                                                                {post.author.name.split(" ").map(n => n[0]).join("")}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="text-sm font-medium">{post.author.name}</div>
                                                            <Badge variant="outline" className="text-xs">
                                                                {post.author.role}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {post.readTime} min
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="w-3 h-3" />
                                                            {post.views}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Heart className="w-3 h-3" />
                                                            {post.likes}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-1">
                                                    {post.tags.map(tag => (
                                                        <Badge key={tag} variant="secondary" className="text-xs">
                                                            #{tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                >
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                    <p className="text-muted-foreground mb-4">
                        Try adjusting your search terms or filters
                    </p>
                    <Button onClick={onClearFilters}>
                        Clear Filters
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}