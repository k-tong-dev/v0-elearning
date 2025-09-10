"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Eye } from "lucide-react";

interface RelatedDiscussion {
    id: string;
    title: string;
    replies: number;
    views: number;
}

interface ForumSidebarRelatedDiscussionsProps {
    relatedPosts: RelatedDiscussion[];
    onPostClick: (postId: string) => void;
}

export function ForumSidebarRelatedDiscussions({ relatedPosts, onPostClick }: ForumSidebarRelatedDiscussionsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Related Discussions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {relatedPosts.map((item) => (
                    <div
                        key={item.id}
                        className="space-y-2 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => onPostClick(item.id)}
                    >
                        <h5 className="text-sm font-medium line-clamp-2">
                            {item.title}
                        </h5>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MessageCircle className="w-3 h-3" />
                            <span>{item.replies} replies</span>
                            <Eye className="w-3 h-3" />
                            <span>{item.views} views</span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}