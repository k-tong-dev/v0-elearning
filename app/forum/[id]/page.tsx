"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import { Footer } from "@/components/ui/footers/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

import { ForumPostHeader } from "@/components/forum/ForumPostHeader"
import { ForumPostContent } from "@/components/forum/ForumPostContent"
import { ForumCommentSection } from "@/components/forum/ForumCommentSection"
import { ForumSidebarAuthorInfo } from "@/components/forum/ForumSidebarAuthorInfo"
import { ForumSidebarRelatedDiscussions } from "@/components/forum/ForumSidebarRelatedDiscussions"
import { ForumShareDialog } from "@/components/forum/ForumShareDialog"
import { ForumReportDialog } from "@/components/forum/ForumReportDialog"

// Import types
import { ForumPost, User, Comment, Reply } from "@/types/forum"
import ShareForm from "@/components/ui/share-form";
import ReportForm from "@/components/ui/report-form";

export default function ForumDetailPage() {
    const { id } = useParams()
    const router = useRouter()

    const [post, setPost] = useState<ForumPost | null>(null)
    const [newComment, setNewComment] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [showShareDialog, setShowShareDialog] = useState(false)
    const [showReportDialog, setShowReportDialog] = useState(false)
    const [reportDetails, setReportDetails] = useState<{ itemId: string; itemType: 'post' | 'comment' | 'reply'; } | null>(null);

    // Mock current user for comments/replies
    const currentUser: User = {
        id: "current-user",
        name: "You",
        avatar: "/images/Avatar.jpg", // Placeholder for current user's avatar
        role: "Student",
        joinDate: "Today",
        postCount: 0,
        reputation: 0,
        isOnline: true
    }

    // Mock data - In real app, fetch from API
    useEffect(() => {
        const mockPost: ForumPost = {
            id: id as string,
            title: "How to deploy React app to production?",
            content: "I'm having trouble deploying my React application to production. I've tried various methods but keep running into issues with environment variables and build optimization. Can someone help me with the best practices?\n\nSpecifically, I'm looking for:\n1. How to properly set up environment variables\n2. Build optimization techniques\n3. Deployment platform recommendations\n4. Common pitfalls to avoid\n\nAny help would be greatly appreciated!",
            author: {
                id: "1",
                name: "Sarah Johnson",
                avatar: "/images/Avatar.jpg",
                role: "Student",
                joinDate: "March 2024",
                postCount: 15,
                reputation: 245,
                isOnline: true
            },
            category: "technical",
            replies: 12,
            views: 245,
            likes: 18,
            dislikes: 2,
            isPinned: false,
            isAnswered: true,
            createdAt: "2 hours ago",
            lastActivity: "30 minutes ago",
            tags: ["react", "deployment", "production"],
            isLiked: false,
            isDisliked: false,
            isBookmarked: false,
            comments: [
                {
                    id: "c1",
                    content: "For deployment, I highly recommend using Vercel or Netlify. They have excellent integration with React apps and handle environment variables seamlessly.",
                    author: {
                        id: "2",
                        name: "Mike Chen",
                        avatar: "/images/Avatar.jpg",
                        role: "Mentor",
                        joinDate: "January 2023",
                        postCount: 156,
                        reputation: 1240,
                        isOnline: true
                    },
                    createdAt: "1 hour ago",
                    likes: 8,
                    dislikes: 0,
                    isLiked: false,
                    isDisliked: false,
                    replies: [
                        {
                            id: "r1",
                            content: "Thanks Mike! I'll try Vercel. Do you have any specific configuration tips?",
                            author: {
                                id: "1",
                                name: "Sarah Johnson",
                                avatar: "/images/Avatar.jpg",
                                role: "Student",
                                joinDate: "March 2024",
                                postCount: 15,
                                reputation: 245,
                                isOnline: true
                            },
                            createdAt: "45 minutes ago",
                            likes: 2,
                            isLiked: false
                        }
                    ]
                },
                {
                    id: "c2",
                    content: "Make sure you're using process.env properly and have a .env.example file in your repo. Also, run 'npm run build' locally first to catch any build issues.",
                    author: {
                        id: "3",
                        name: "Emma Rodriguez",
                        avatar: "/images/Avatar.jpg",
                        role: "Expert",
                        joinDate: "October 2022",
                        postCount: 289,
                        reputation: 2150,
                        isOnline: false
                    },
                    createdAt: "45 minutes ago",
                    likes: 12,
                    dislikes: 1,
                    isLiked: true,
                    isDisliked: false,
                    replies: []
                }
            ]
        }

        setTimeout(() => {
            setPost(mockPost)
            setIsLoading(false)
        }, 1000)
    }, [id])

    const relatedPosts = [
        { id: "rp1", title: "Best practices for React performance optimization", replies: 8, views: 124 },
        { id: "rp2", title: "Understanding asynchronous JavaScript", replies: 5, views: 98 },
        { id: "rp3", title: "Getting started with Node.js and Express", replies: 10, views: 150 },
    ];

    const handleLikePost = () => {
        setPost(prev => prev ? {
            ...prev,
            likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
            dislikes: prev.isDisliked ? prev.dislikes - 1 : prev.dislikes,
            isLiked: !prev.isLiked,
            isDisliked: false
        } : null)
    }

    const handleDislikePost = () => {
        setPost(prev => prev ? {
            ...prev,
            dislikes: prev.isDisliked ? prev.dislikes - 1 : prev.dislikes + 1,
            likes: prev.isLiked ? prev.likes - 1 : prev.likes,
            isDisliked: !prev.isDisliked,
            isLiked: false
        } : null)
    }

    const handleBookmarkPost = () => {
        setPost(prev => prev ? {
            ...prev,
            isBookmarked: !prev.isBookmarked
        } : null)
        toast.info(post?.isBookmarked ? "Bookmark removed!" : "Post bookmarked!", {
            position: "top-center",
            action: {
                label: "Close",
                onClick: () => {},
            },
            closeButton: false,
        });
    }

    const handleCommentSubmit = () => {
        if (!newComment.trim() || !post) return

        const newCommentObj: Comment = {
            id: Date.now().toString(),
            content: newComment,
            author: currentUser,
            createdAt: "Just now",
            likes: 0,
            dislikes: 0,
            isLiked: false,
            isDisliked: false,
            replies: []
        }

        setPost(prev => prev ? {
            ...prev,
            comments: [...prev.comments, newCommentObj],
            replies: prev.replies + 1
        } : null)

        setNewComment("")
        toast.success("Comment posted!", {
            position: "top-center",
            action: {
                label: "Close",
                onClick: () => {},
            },
            closeButton: false,
        })
    }

    const handleReplySubmit = (commentId: string, replyContent: string) => {
        if (!replyContent.trim() || !post) return

        const newReply: Reply = {
            id: Date.now().toString(),
            content: replyContent,
            author: currentUser,
            createdAt: "Just now",
            likes: 0,
            isLiked: false
        }

        setPost(prev => prev ? {
            ...prev,
            comments: prev.comments.map(comment =>
                comment.id === commentId
                    ? { ...comment, replies: [...comment.replies, newReply] }
                    : comment
            ),
            replies: prev.replies + 1
        } : null)

        toast.success("Reply posted!", {
            position: "top-center",
            action: {
                label: "Close",
                onClick: () => {},
            },
            closeButton: false,
        })
    }

    const handleLikeComment = (commentId: string) => {
        setPost(prev => prev ? {
            ...prev,
            comments: prev.comments.map(comment => {
                if (comment.id === commentId) {
                    return {
                        ...comment,
                        likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
                        dislikes: comment.isDisliked ? comment.dislikes - 1 : comment.dislikes,
                        isLiked: !comment.isLiked,
                        isDisliked: false
                    }
                }
                return comment
            })
        } : null)
    }

    const handleDislikeComment = (commentId: string) => {
        setPost(prev => prev ? {
            ...prev,
            comments: prev.comments.map(comment => {
                if (comment.id === commentId) {
                    return {
                        ...comment,
                        dislikes: comment.isDisliked ? comment.dislikes - 1 : comment.dislikes + 1,
                        likes: comment.isLiked ? comment.likes - 1 : comment.likes,
                        isDisliked: !comment.isDisliked,
                        isLiked: false
                    }
                }
                return comment
            })
        } : null)
    }

    const handleLikeReply = (commentId: string, replyId: string) => {
        setPost(prev => prev ? {
            ...prev,
            comments: prev.comments.map(comment => {
                if (comment.id === commentId) {
                    return {
                        ...comment,
                        replies: comment.replies.map(reply => {
                            if (reply.id === replyId) {
                                return {
                                    ...reply,
                                    likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                                    isLiked: !reply.isLiked
                                }
                            }
                            return reply
                        })
                    }
                }
                return comment
            })
        } : null)
    }

    const handleUserClick = (userId: string) => {
        router.push(`/users/${userId}`)
    }

    const handleSharePost = () => {
        setShowShareDialog(true);
    };

    const handleReportContent = (itemId: string, itemType: 'post' | 'comment' | 'reply') => {
        setReportDetails({ itemId, itemType });
        setShowReportDialog(true);
    };

    const handleReportSubmit = (itemId: string, itemType: 'post' | 'comment' | 'reply', reason: string) => {
        console.log(`Reporting ${itemType} ${itemId} for reason: ${reason}`);
        toast.success(`${itemType} reported successfully. We'll review it shortly.`, {
            position: "top-center",
            action: {
                label: "Close",
                onClick: () => {},
            },
            closeButton: false,
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
                <HeaderUltra />
                <div className="container mx-auto px-4 py-8 pt-24 text-center">
                    <h1 className="text-2xl font-bold mb-4">Post not found</h1>
                    <Button onClick={() => router.back()}>Go Back</Button>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            <HeaderUltra />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-6"
                >
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-muted-foreground"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Forum
                    </Button>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Original Post */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="relative overflow-hidden py-0">
                                <ForumPostHeader
                                    post={post}
                                    onLikePost={handleLikePost}
                                    onDislikePost={handleDislikePost}
                                    onBookmarkPost={handleBookmarkPost}
                                    onUserClick={handleUserClick}
                                    onShare={handleSharePost}
                                    onReport={() => handleReportContent(post.id, 'post')}
                                />
                                <ForumPostContent
                                    post={post}
                                    onLikePost={handleLikePost}
                                    onDislikePost={handleDislikePost}
                                />
                            </Card>
                        </motion.div>

                        {/* Comments Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <ForumCommentSection
                                comments={post.comments}
                                currentUser={currentUser}
                                newComment={newComment}
                                setNewComment={setNewComment}
                                handleCommentSubmit={handleCommentSubmit}
                                handleLikeComment={handleLikeComment}
                                handleDislikeComment={handleDislikeComment}
                                handleReplySubmit={handleReplySubmit}
                                handleLikeReply={handleLikeReply}
                                handleUserClick={handleUserClick}
                                handleShareToPlatform={handleSharePost}
                                handleReport={handleReportContent}
                            />
                        </motion.div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Post Author Info */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <ForumSidebarAuthorInfo
                                author={post.author}
                                onUserClick={handleUserClick}
                            />
                        </motion.div>

                        {/* Related Posts */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <ForumSidebarRelatedDiscussions
                                relatedPosts={relatedPosts}
                                onPostClick={(postId) => router.push(`/forum/${postId}`)}
                            />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Share Dialog */}
            {post && (
                <ShareForm
                    isOpen={showShareDialog}
                    onOpenChange={setShowShareDialog}
                    url={window.location.href}
                    title={post.title}
                />
            )}

            {/* Report Dialog */}
            {reportDetails && (
                <ReportForm
                    isOpen={showReportDialog}
                    onOpenChange={setShowReportDialog}
                    title={post.title}
                    onSubmit={handleReportContent}
                />

                )}

            <Footer />
        </div>
    )
}