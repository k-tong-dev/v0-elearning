"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Eye, MessageCircle } from "lucide-react";
import { ForumPost } from "@/types/forum";
import { ForumContentRenderer } from "./ForumContentRenderer";

interface ForumPostContentProps {
    post: ForumPost;
    onLikePost: () => void;
    onDislikePost: () => void;
}

export function ForumPostContent({ post, onLikePost, onDislikePost }: ForumPostContentProps) {
    // Get description from post if available (may need to fetch from Strapi)
    const description = (post as any).description || "";
    
    return (
        <div className="p-6 pt-0">
            {/* Description if available */}
            {description && (
                <div className="mb-6">
                    <ForumContentRenderer content={description} />
                </div>
            )}
            
            {/* Main Content */}
            <div className="mb-6">
                <ForumContentRenderer content={post.content} />
            </div>

            <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">{post.category}</Badge>
                {post.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                    </Badge>
                ))}
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onLikePost}
                            className={post.isLiked ? "text-green-500" : ""}
                        >
                            <ThumbsUp className={`w-4 h-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                            {post.likes}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDislikePost}
                            className={post.isDisliked ? "text-red-500" : ""}
                        >
                            <ThumbsDown className={`w-4 h-4 mr-1 ${post.isDisliked ? 'fill-current' : ''}`} />
                            {post.dislikes}
                        </Button>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {post.views} views
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {post.replies} replies
                        </span>
                    </div>
                </div>

                <div className="text-xs text-muted-foreground">
                    Last activity {post.lastActivity}
                </div>
            </div>
        </div>
    );
}