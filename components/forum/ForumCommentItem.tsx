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
    Edit,
    Trash2,
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
    onEditComment?: (commentId: string, newContent: string) => void;
    onDeleteComment?: (commentId: string) => void;
    onEditReply?: (commentId: string, replyId: string, newContent: string) => void;
    onDeleteReply?: (commentId: string, replyId: string) => void;
    depth?: number;
    allowComments?: boolean; // Whether new comments/replies are allowed
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
                                     onEditComment,
                                     onDeleteComment,
                                     onEditReply,
                                     onDeleteReply,
                                     depth = 0,
                                     allowComments = true, // Default to allowing comments
                                 }: ForumCommentItemProps) {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [currentReplyContent, setCurrentReplyContent] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Check if current user is the comment author
    const isCommentOwner = currentUser.id && comment.author.id && 
                          (currentUser.id === comment.author.id || String(currentUser.id) === String(comment.author.id));

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

    const handleEditClick = () => {
        setIsEditing(true);
        setEditContent(comment.content);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditContent(comment.content);
    };

    const handleSaveEdit = () => {
        if (editContent.trim() && onEditComment) {
            onEditComment(comment.id, editContent.trim());
            setIsEditing(false);
        }
    };

    const handleDeleteClick = () => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            if (onDeleteComment) {
                setIsDeleting(true);
                onDeleteComment(comment.id);
            }
        }
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

            <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 mb-1.5">
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

                <div className="text-sm prose dark:prose-invert max-w-none">
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
                            {currentUser.id && reply.author.id && 
                             (currentUser.id === reply.author.id || String(currentUser.id) === String(reply.author.id)) && (
                                <>
                                    {onEditReply && (
                                        <DropdownMenuItem onClick={() => {
                                            // TODO: Implement reply edit
                                            console.log('Edit reply:', reply.id);
                                        }}>
                                            <Edit className="w-3 h-3 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                    )}
                                    {onDeleteReply && (
                                        <DropdownMenuItem 
                                            className="text-red-600" 
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to delete this reply?')) {
                                                    onDeleteReply(comment.id, reply.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-3 h-3 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    )}
                                </>
                            )}
                            {(!currentUser.id || !reply.author.id || 
                              (currentUser.id !== reply.author.id && String(currentUser.id) !== String(reply.author.id))) && (
                                <>
                                    <DropdownMenuItem onClick={() => onShareToPlatform("copy")}>
                                        <Share2 className="w-3 h-3 mr-2" />
                                        Share
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={() => onReport(reply.id, 'reply')}>
                                        <Flag className="w-3 h-3 mr-2" />
                                        Report
                                    </DropdownMenuItem>
                                </>
                            )}
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
            className={`space-y-4 ${depth > 0 ? 'ml-6 mt-4' : ''}`}
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
                    <div className="pb-3">
                        <div className="flex items-center gap-2 mb-2">
                            <span
                                className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                                onClick={() => onUserClick(comment.author.id)}
                            >
                                {comment.author.name}
                            </span>
                            <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50">
                                {comment.author.role}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {comment.createdAt}
                            </span>
                        </div>

                        {isEditing ? (
                            <div className="space-y-3">
                                <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="min-h-24 resize-none"
                                    placeholder="Edit your comment..."
                                />
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleSaveEdit}
                                        disabled={!editContent.trim() || editContent.trim() === comment.content}
                                        className="h-8 px-4"
                                    >
                                        Save
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCancelEdit}
                                        className="h-8 px-4"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm leading-relaxed prose dark:prose-invert max-w-none">
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
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onLikeComment(comment.id)}
                                className={`text-xs ${comment.isLiked ? "text-green-500" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                <ThumbsUp className={`w-3.5 h-3.5 mr-1.5 ${comment.isLiked ? 'fill-current' : ''}`} />
                                {comment.likes}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDislikeComment(comment.id)}
                                className={`text-xs ${comment.isDisliked ? "text-red-500" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                <ThumbsDown className={`w-3.5 h-3.5 mr-1.5 ${comment.isDisliked ? 'fill-current' : ''}`} />
                                {comment.dislikes}
                            </Button>

                            {/* Reply button - always visible */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleReplyClick}
                                disabled={!allowComments}
                                className={`text-xs font-medium ${allowComments ? "text-primary hover:text-primary/80 hover:bg-primary/10" : "text-muted-foreground opacity-60 cursor-not-allowed"}`}
                            >
                                <Reply className="w-3.5 h-3.5 mr-1.5" />
                                Reply
                            </Button>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={isDeleting}>
                                    <MoreVertical className="w-3 h-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {isCommentOwner && onEditComment && (
                                    <DropdownMenuItem onClick={handleEditClick} disabled={isEditing}>
                                        <Edit className="w-3 h-3 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                )}
                                {isCommentOwner && onDeleteComment && (
                                    <DropdownMenuItem 
                                        className="text-red-600" 
                                        onClick={handleDeleteClick}
                                        disabled={isDeleting}
                                    >
                                        <Trash2 className="w-3 h-3 mr-2" />
                                        {isDeleting ? "Deleting..." : "Delete"}
                                    </DropdownMenuItem>
                                )}
                                {!isCommentOwner && (
                                    <>
                                        <DropdownMenuItem onClick={() => onShareToPlatform("copy")}>
                                            <Share2 className="w-3 h-3 mr-2" />
                                            Share
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600" onClick={() => onReport(comment.id, 'comment')}>
                                            <Flag className="w-3 h-3 mr-2" />
                                            Report
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Reply Input - Only show if comments are allowed */}
                    <AnimatePresence>
                        {showReplyInput && allowComments && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pl-6"
                            >
                                <div className="flex items-start gap-3">
                                    <ForumUserAvatar 
                                        user={currentUser}
                                        size="sm"
                                    />

                                    <div className="flex-1 space-y-3">
                                        <Textarea
                                            placeholder={`Reply to ${comment.author.name}...`}
                                            value={currentReplyContent}
                                            onChange={(e) => setCurrentReplyContent(e.target.value)}
                                            className="min-h-20 resize-none"
                                        />

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={handleLinkClick} className="h-8 w-8 p-0">
                                                    <LinkIcon className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={handleEmojiClick} className="h-8 w-8 p-0">
                                                    <Smile className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={handleSubmitReply}
                                                    disabled={!currentReplyContent.trim()}
                                                    className="h-8 px-4"
                                                >
                                                    Reply
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowReplyInput(false)}
                                                    className="h-8 px-4"
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
                        <div className="mt-4 pl-6 space-y-4">
                            {comment.replies.map((reply, replyIndex) => renderReply(reply, replyIndex))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}