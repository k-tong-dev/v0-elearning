"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Comments ({comments.length})
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Add Comment */}
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={currentUser.avatar} />
                            <AvatarFallback>You</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-3">
                            <Textarea
                                placeholder="Share your thoughts..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="min-h-20"
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

                                <Button
                                    onClick={handleCommentSubmit}
                                    disabled={!newComment.trim()}
                                    className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Comment
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Comments List */}
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
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
}