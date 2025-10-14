"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ForumUserAvatar } from "@/components/ui/enhanced-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    ThumbsUp,
    ThumbsDown,
    Reply,
    MoreVertical,
    Share2,
    Flag,
    Link as LinkIcon,
    Smile,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { Comment, User, Reply as ReplyType } from "@/types/forum";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ForumCommentItemProps {
    comment: Comment;
    currentUser: User;
    onLikeComment: (commentId: string) => void;
    onDislikeComment: (commentId: string) => void;
    onLikeReply: (commentId: string, replyId: string) => void;
    onUserClick: (userId: string) => void;
    onReplySubmit: (commentId: string, replyContent: string) => void;
    onShareToPlatform: (platform: string) => void;
    onReport: (id: string, type: 'comment' | 'reply') => void;
    depth?: number;
}

export function ForumCommentItem({
                                     comment,
                                     currentUser,
                                     onLikeComment,
                                     onDislikeComment,
                                     onLikeReply,
                                     onUserClick,
                                     onReplySubmit,
                                     onShareToPlatform,
                                     onReport,
                                     depth = 0,
                                 }: ForumCommentItemProps) {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [currentReplyContent, setCurrentReplyContent] = useState("");

    const handleReplyClick = () => {
        setShowReplyInput((prev) => !prev);
        setCurrentReplyContent("");
    };

    const handleSubmitReply = () => {
        if (currentReplyContent.trim()) {
            onReplySubmit(comment.id, currentReplyContent);
            setShowReplyInput(false);
            setCurrentReplyContent("");
        }
    };

    const handleLinkClick = () => {
        // Placeholder for link functionality
        console.log("Link button clicked");
    };

    const handleEmojiClick = () => {
        // Placeholder for emoji functionality
        console.log("Emoji button clicked");
    };

    const renderReply = (reply: ReplyType, replyIndex: number) => (
        <motion.div
            key={reply.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: replyIndex * 0.1 }}
            className="flex items-start gap-3"
        >
            <ForumUserAvatar 
                user={reply.author}
                size="sm"
                onClick={() => onUserClick(reply.author.id)}
            />

            <div className="flex-1 bg-background rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                    <span
                        className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                        onClick={() => onUserClick(reply.author.id)}
                    >
                        {reply.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {reply.createdAt}
                    </span>
                </div>

                <div className="text-sm prose dark:prose-invert">
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
                        {reply.content}
                    </ReactMarkdown>
                </div>

                <div className="flex items-center gap-2 mt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onLikeReply(comment.id, reply.id)}
                        className={reply.isLiked ? "text-green-500" : ""}
                    >
                        <ThumbsUp className={`w-3 h-3 mr-1 ${reply.isLiked ? 'fill-current' : ''}`} />
                        {reply.likes}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreVertical className="w-3 h-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onShareToPlatform("copy")}>
                                <Share2 className="w-3 h-3 mr-2" />
                                Share
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => onReport(reply.id, 'reply')}>
                                <Flag className="w-3 h-3 mr-2" />
                                Report
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </motion.div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: depth * 0.05 }}
            className={`space-y-4 ${depth > 0 ? 'ml-8 mt-4' : ''}`}
        >
            <div className="flex items-start gap-4">
                <div className="relative">
                    <ForumUserAvatar 
                        user={comment.author}
                        size="md"
                        onClick={() => onUserClick(comment.author.id)}
                    />
                </div>

                <div className="flex-1">
                    <div className={`
                    bg-gray-200/90 rounded-lg p-4
                    dark:bg-transparent
                    `
                    }>
                        <div className="flex items-center gap-2 mb-2">
                            <span
                                className="font-semibold cursor-pointer hover:text-primary transition-colors"
                                onClick={() => onUserClick(comment.author.id)}
                            >
                                {comment.author.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                                {comment.author.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                {comment.createdAt}
                            </span>
                        </div>

                        <div className="text-sm leading-relaxed prose dark:prose-invert">
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
                                {comment.content}
                            </ReactMarkdown>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onLikeComment(comment.id)}
                                className={comment.isLiked ? "text-green-500" : ""}
                            >
                                <ThumbsUp className={`w-3 h-3 mr-1 ${comment.isLiked ? 'fill-current' : ''}`} />
                                {comment.likes}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDislikeComment(comment.id)}
                                className={comment.isDisliked ? "text-red-500" : ""}
                            >
                                <ThumbsDown className={`w-3 h-3 mr-1 ${comment.isDisliked ? 'fill-current' : ''}`} />
                                {comment.dislikes}
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleReplyClick}
                            >
                                <Reply className="w-3 h-3 mr-1" />
                                Reply
                            </Button>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-3 h-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => onShareToPlatform("copy")}>
                                    <Share2 className="w-3 h-3 mr-2" />
                                    Share
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => onReport(comment.id, 'comment')}>
                                    <Flag className="w-3 h-3 mr-2" />
                                    Report
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Reply Input */}
                    <AnimatePresence>
                        {showReplyInput && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pl-4 border-l-2 border-accent"
                            >
                                <div className="flex items-start gap-3">
                                    <ForumUserAvatar 
                                        user={currentUser}
                                        size="sm"
                                    />

                                    <div className="flex-1 space-y-2">
                                        <Textarea
                                            placeholder={`Reply to ${comment.author.name}...`}
                                            value={currentReplyContent}
                                            onChange={(e) => setCurrentReplyContent(e.target.value)}
                                            className="min-h-16"
                                        />

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={handleLinkClick}>
                                                    <LinkIcon className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={handleEmojiClick}>
                                                    <Smile className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={handleSubmitReply}
                                                    disabled={!currentReplyContent.trim()}
                                                >
                                                    Reply
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowReplyInput(false)}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Replies */}
                    {comment.replies.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-accent space-y-3">
                            {comment.replies.map((reply, replyIndex) => renderReply(reply, replyIndex))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}