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
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div>
                            <div className="text-2xl font-bold text-cyan-600">{posts.length}</div>
                            <div className="text-sm text-muted-foreground">Total Articles</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-emerald-600">
                                {totalViews.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Views</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-purple-600">
                                {uniqueContributors}
                            </div>
                            <div className="text-sm text-muted-foreground">Contributors</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-orange-600">
                                {avgReadTime}
                            </div>
                            <div className="text-sm text-muted-foreground">Avg. Read Time (min)</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}