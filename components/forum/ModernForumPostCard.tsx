"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Eye, Clock, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface ModernForumPostCardProps {
  post: {
    id: number | string;
    documentId?: string; // Add documentId for stable routing
    title: string;
    content: string;
    author: {
      id?: number;
      name: string;
      avatar?: string;
      role?: string;
    };
    category: string;
    replies: number;
    views: number;
    likes: number;
    dislikes?: number;
    isPinned?: boolean;
    isAnswered?: boolean;
    createdAt: string;
    lastActivity: string;
    tags: string[];
    status?: string;
  };
  onPostClick: (postId: number | string, documentId?: string) => void;
  onAuthorClick: (authorId?: number | string) => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
}

export function ModernForumPostCard({
  post,
  onPostClick,
  onAuthorClick,
  onLike,
  onComment,
  onShare,
}: ModernForumPostCardProps) {
  // Strip HTML from content for preview
  const stripHtml = (html: string): string => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const previewText = stripHtml(post.content);
  const timeAgo = post.createdAt || post.lastActivity;

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-white dark:bg-gray-900 cursor-pointer group"
      onClick={() => onPostClick(post.documentId || post.id, post.documentId)}
    >
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar 
              className="w-12 h-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onAuthorClick(post.author.id);
              }}
            >
              <AvatarImage src={post.author.avatar || "/images/Avatar.jpg"} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                {post.author.name.split(" ").map(n => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span 
                    className="font-semibold text-sm hover:text-primary transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAuthorClick(post.author.id);
                    }}
                  >
                    {post.author.name}
                  </span>
                  {post.author.role && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {post.author.role}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo}
                  </span>
                </div>
                
                <h3 
                  className="font-semibold text-lg leading-tight hover:text-primary transition-colors cursor-pointer mb-2"
                  onClick={() => onPostClick(post.documentId || post.id, post.documentId)}
                >
                  {post.title}
                </h3>
              </div>
              
              {post.isPinned && (
                <Badge className="bg-blue-500 text-white text-xs flex-shrink-0">
                  Pinned
                </Badge>
              )}
            </div>

            {/* Content Preview */}
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {previewText}
            </p>

            {/* Tags and Category */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                variant="secondary" 
                className="text-xs font-medium"
              >
                {post.category}
              </Badge>
              {post.tags.slice(0, 3).map((tag, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className="text-xs"
                >
                  #{tag}
                </Badge>
              ))}
              {post.isAnswered && (
                <Badge className="bg-green-500 text-white text-xs">
                  ✓ Answered
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950"
                onClick={(e) => {
                  e.stopPropagation();
                  onLike?.();
                }}
              >
                <ThumbsUp className="w-4 h-4 mr-1.5" />
                <span className="text-sm">{post.likes}</span>
              </Button>

              {post.dislikes !== undefined && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={(e) => {
                    e.stopPropagation();
                    // You can add onDislike handler if needed
                  }}
                >
                  <ThumbsDown className="w-4 h-4 mr-1.5" />
                  <span className="text-sm">{post.dislikes}</span>
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
                onClick={(e) => {
                  e.stopPropagation();
                  onComment?.();
                }}
              >
                <MessageCircle className="w-4 h-4 mr-1.5" />
                <span className="text-sm">{post.replies} {post.replies === 1 ? 'Comment' : 'Comments'}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.();
                }}
              >
                <Share2 className="w-4 h-4 mr-1.5" />
                <span className="text-sm">Share</span>
              </Button>

              <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{post.views}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

