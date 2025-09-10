"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, Eye, Heart, MessageCircle, TrendingUp, Award, Tag } from "lucide-react";
import { BlogPost, BlogCategory } from "@/types/blog";

interface BlogPostCardProps {
    post: BlogPost;
    categories: BlogCategory[];
    formatDate: (dateString: string) => string;
    isFeatured?: boolean;
    delay?: number;
}

export function BlogPostCard({ post, categories, formatDate, isFeatured = false, delay = 0 }: BlogPostCardProps) {
    const router = useRouter();
    const category = categories.find(c => c.id === post.category);

    const handlePostClick = () => {
        router.push(`/blog/${post.id}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.3 }}
            className="group"
        >
            <Card
                className="h-full hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer overflow-hidden"
                onClick={handlePostClick}
            >
                <div className="relative">
                    <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                        {isFeatured && (
                            <Badge className="bg-yellow-500 text-black font-semibold">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                            </Badge>
                        )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                {post.title}
                            </h3>
                            <p className="text-muted-foreground text-sm line-clamp-3">
                                {post.excerpt}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={post.author.avatar} />
                                <AvatarFallback>
                                    {post.author.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="text-sm font-medium">{post.author.name}</div>
                                <div className="text-xs text-muted-foreground">{formatDate(post.publishedAt)}</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {post.readTime} min read
                                </span>
                                <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {post.views}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <Heart className="w-3 h-3" />
                                    {post.likes}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MessageCircle className="w-3 h-3" />
                                    {post.comments}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {post.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                    #{tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}