"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Eye, Users, Clock } from "lucide-react";
import { BlogPost } from "@/types/blog";

interface BlogStatsBarProps {
    posts: BlogPost[];
}

export function BlogStatsBar({ posts }: BlogStatsBarProps) {
    const totalViews = posts.reduce((sum, post) => sum + post.views, 0);
    const uniqueContributors = new Set(posts.map(post => post.author.id)).size;
    const totalReadTime = posts.reduce((sum, post) => sum + post.readTime, 0);
    const avgReadTime = posts.length > 0 ? Math.round(totalReadTime / posts.length) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
        >
            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div className="space-y-2">
                            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                                {posts.length}
                            </div>
                            <div className="text-sm font-medium text-muted-foreground">Total Articles</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                                {totalViews.toLocaleString()}
                            </div>
                            <div className="text-sm font-medium text-muted-foreground">Total Views</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                                {uniqueContributors}
                            </div>
                            <div className="text-sm font-medium text-muted-foreground">Contributors</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                                {avgReadTime}
                            </div>
                            <div className="text-sm font-medium text-muted-foreground">Avg. Read Time (min)</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}