"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ForumUserAvatar } from "@/components/ui/enhanced-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    MessageCircle,
    ThumbsUp,
    ThumbsDown,
    Share2,
    Flag,
    Eye,
    Clock,
    MoreVertical,
    Heart,
    Bookmark,
    Star
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ForumPost, User } from "@/types/forum";
import { toast } from "sonner";

interface ForumPostHeaderProps {
    post: ForumPost;
    onLikePost: () => void;
    onDislikePost: () => void;
    onBookmarkPost: () => void;
    onUserClick: (userId: string) => void;
    onShare: () => void;
    onReport: () => void;
}

export function ForumPostHeader({
                                    post,
                                    onLikePost,
                                    onDislikePost,
                                    onBookmarkPost,
                                    onUserClick,
                                    onShare,
                                    onReport,
                                }: ForumPostHeaderProps) {
    return (
        <div className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>

            <div className="p-6 pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                        <div className="relative">
                            <ForumUserAvatar 
                                user={post.author}
                                size="lg"
                                onClick={() => onUserClick(post.author.id)}
                            />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold">{post.title}</h1>
                                {post.isPinned && <Badge variant="outline" className="text-blue-500">Pinned</Badge>}
                                {post.isAnswered && <Badge className="bg-green-500 text-white">Answered</Badge>}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span
                                    className="hover:text-foreground cursor-pointer transition-colors"
                                    onClick={() => onUserClick(post.author.id)}
                                >
                                    by {post.author.name}
                                </span>
                                <Badge variant="outline">{post.author.role}</Badge>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {post.createdAt}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onShare}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onBookmarkPost}>
                                <Bookmark className={`w-4 h-4 mr-2 ${post.isBookmarked ? 'fill-current' : ''}`} />
                                {post.isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={onReport}
                                className="text-red-600"
                            >
                                <Flag className="w-4 h-4 mr-2" />
                                Report
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}