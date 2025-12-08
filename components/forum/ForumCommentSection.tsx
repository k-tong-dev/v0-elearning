"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Link as LinkIcon, Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ForumCommentItem } from "./ForumCommentItem";
import { Comment, User } from "@/types/forum";

interface ForumCommentSectionProps {
    comments: Comment[];
    currentUser: User;
    newComment: string;
    setNewComment: (content: string) => void;
    handleCommentSubmit: () => void;
    handleLikeComment: (commentId: string) => void;
    handleDislikeComment: (commentId: string) => void;
    handleReplySubmit: (commentId: string, replyContent: string) => void;
    handleLikeReply: (commentId: string, replyId: string) => void;
    handleUserClick: (userId: string) => void;
    handleShareToPlatform: (platform: string) => void;
    handleReport: (id: string, type: 'comment' | 'reply') => void;
    handleEditComment?: (commentId: string, newContent: string) => void;
    handleDeleteComment?: (commentId: string) => void;
    handleEditReply?: (commentId: string, replyId: string, newContent: string) => void;
    handleDeleteReply?: (commentId: string, replyId: string) => void;
    allowComments?: boolean; // Whether new comments are allowed
}

export function ForumCommentSection({
                                        comments,
                                        currentUser,
                                        newComment,
                                        setNewComment,
                                        handleCommentSubmit,
                                        handleLikeComment,
                                        handleDislikeComment,
                                        handleReplySubmit,
                                        handleLikeReply,
                                        handleUserClick,
                                        handleShareToPlatform,
                                        handleReport,
                                        handleEditComment,
                                        handleDeleteComment,
                                        handleEditReply,
                                        handleDeleteReply,
                                        allowComments = true, // Default to allowing comments
                                    }: ForumCommentSectionProps) {
    const handleLinkClick = () => {
        // Placeholder for link functionality
        console.log("Link button clicked");
    };

    const handleEmojiClick = () => {
        // Placeholder for emoji functionality
        console.log("Emoji button clicked");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
            </div>

            <div className="space-y-6">
                {/* Add Comment - Always show, but disable if comments not allowed */}
                <div className="space-y-4">
                    {!allowComments && (
                        <div className="rounded-md bg-muted/30 p-3 text-center mb-2">
                            <p className="text-xs text-muted-foreground">
                                This discussion has been marked as answered. New comments are no longer allowed.
                            </p>
                        </div>
                    )}
                    <div className="flex items-start gap-4">
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={currentUser.avatar} />
                            <AvatarFallback>You</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-3">
                            <Textarea
                                placeholder={allowComments ? "Share your thoughts..." : "Comments are disabled for this discussion"}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                disabled={!allowComments}
                                className={`min-h-20 resize-none ${!allowComments ? "opacity-60 cursor-not-allowed" : ""}`}
                            />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={handleLinkClick} 
                                        className="h-8 w-8 p-0"
                                        disabled={!allowComments}
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={handleEmojiClick} 
                                        className="h-8 w-8 p-0"
                                        disabled={!allowComments}
                                    >
                                        <Smile className="w-4 h-4" />
                                    </Button>
                                </div>

                                <Button
                                    onClick={handleCommentSubmit}
                                    disabled={!newComment.trim() || !allowComments}
                                    className={`h-9 px-4 ${allowComments ? "bg-primary hover:bg-primary/90" : "bg-muted opacity-60 cursor-not-allowed"}`}
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Comment
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comments List - Always show if there are comments */}
                {comments.length > 0 ? (
                    <div className="space-y-6">
                        <AnimatePresence>
                            {comments.map((comment) => (
                                <ForumCommentItem
                                    key={comment.id}
                                    comment={comment}
                                    currentUser={currentUser}
                                    onLikeComment={handleLikeComment}
                                    onDislikeComment={handleDislikeComment}
                                    onLikeReply={handleLikeReply}
                                    onUserClick={handleUserClick}
                                onReplySubmit={handleReplySubmit}
                                onShareToPlatform={handleShareToPlatform}
                                onReport={handleReport}
                                onEditComment={handleEditComment}
                                onDeleteComment={handleDeleteComment}
                                onEditReply={handleEditReply}
                                onDeleteReply={handleDeleteReply}
                                allowComments={allowComments}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No comments yet. Be the first to comment!</p>
                    </div>
                )}
            </div>
        </div>
    );
}