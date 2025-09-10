"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Eye, MessageCircle } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ForumPost } from "@/types/forum";

interface ForumPostContentProps {
    post: ForumPost;
    onLikePost: () => void;
    onDislikePost: () => void;
}

export function ForumPostContent({ post, onLikePost, onDislikePost }: ForumPostContentProps) {
    return (
        <div className="p-6 pt-0">
            <div className="prose max-w-none mb-6 dark:prose-invert">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                                <SyntaxHighlighter
                                    style={atomDark}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            ) : (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            );
                        },
                    }}
                >
                    {post.content}
                </ReactMarkdown>
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