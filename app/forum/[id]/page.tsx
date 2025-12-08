"use client"

import React, { useState, useEffect, useMemo } from "react"
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
import { getForumPost, incrementForumPostViews, createForumComment, getForumPosts, getForumCategories, likeForumComment, dislikeForumComment, unlikeForumComment, undislikeForumComment, updateForumCommentContent, deleteForumComment, type ForumPost as StrapiForumPost, type ForumCategory } from "@/integrations/strapi/forum"
import { formatDistanceToNow } from "date-fns"
import { Loader2, Edit } from "lucide-react"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import { useAuth } from "@/hooks/use-auth"
import { ForumEditForm } from "@/components/forum/ForumEditForm"

export default function ForumDetailPage() {
    const params = useParams()
    const router = useRouter()
    
    // Ensure id is stable and doesn't change
    // CRITICAL: This ID must NEVER be modified - it comes directly from the URL route parameter
    const id = useMemo(() => {
        const paramId = params?.id;
        if (Array.isArray(paramId)) {
            return paramId[0];
        }
        return paramId;
    }, [params?.id]);
    
    // Add a safeguard: if the URL changes unexpectedly, log it
    useEffect(() => {
        if (typeof window !== 'undefined' && id) {
            const currentPath = window.location.pathname;
            const expectedPath = `/forum/${id}`;
            if (currentPath !== expectedPath) {
                console.warn('[ForumDetailPage] URL mismatch detected! Expected:', expectedPath, 'Actual:', currentPath);
            }
        }
    }, [id]);

    const [post, setPost] = useState<ForumPost | null>(null)
    const [newComment, setNewComment] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmittingComment, setIsSubmittingComment] = useState(false)
    const [showShareDialog, setShowShareDialog] = useState(false)
    const [showReportDialog, setShowReportDialog] = useState(false)
    const [reportDetails, setReportDetails] = useState<{ itemId: string; itemType: 'post' | 'comment' | 'reply'; } | null>(null);
    const [relatedPosts, setRelatedPosts] = useState<Array<{ id: string; title: string; replies: number; views: number }>>([])
    const [showEditForm, setShowEditForm] = useState(false)
    const [categories, setCategories] = useState<ForumCategory[]>([])

    const { user } = useAuth()
    
    // Current user for comments/replies
    const currentUser: User = user ? {
        id: user.id || "",
        name: user.name || user.username || "You",
        avatar: user.avatar || "/images/Avatar.jpg",
        role: "Student",
        joinDate: "Today",
        postCount: 0,
        reputation: 0,
        isOnline: true
    } : {
        id: "",
        name: "Guest",
        avatar: "/images/Avatar.jpg",
        role: "Guest",
        joinDate: "Today",
        postCount: 0,
        reputation: 0,
        isOnline: false
    }

    // Check if current user is the owner
    const isOwner = user && post && (user.id === post.author.id || String(user.id) === String(post.author.id))

    // Transform Strapi comment to UI Comment type
    const transformComment = (comment: any, isReply = false): Comment | Reply => {
        // Handle Strapi v5 structure
        // The comment content field is named 'attributes' (richtext type)
        // In Strapi v5, comment.attributes can be:
        // 1. A string (the richtext content directly) - when the field name conflicts with wrapper
        // 2. An object with { attributes: "...", author: {...}, ... } - normal structure
        
        // Extract comment ID
        const commentId = comment.id?.toString() ?? "";
        
        // Extract comment content
        // If comment.attributes is a string, that's the content directly
        // If comment.attributes is an object, then comment.attributes.attributes is the richtext field
        let commentContent = "";
        
        if (typeof comment.attributes === 'string') {
            // The richtext field value is directly in comment.attributes (string)
            commentContent = comment.attributes;
        } else if (comment.attributes && typeof comment.attributes === 'object') {
            // Normal structure: comment.attributes.attributes is the richtext field
            const richtextField = comment.attributes.attributes;
            if (typeof richtextField === 'string') {
                commentContent = richtextField;
            } else if (richtextField && typeof richtextField === 'object') {
                // Richtext might be an object
                if (richtextField.text) {
                    commentContent = richtextField.text;
                } else if (richtextField.content) {
                    commentContent = typeof richtextField.content === 'string' 
                        ? richtextField.content 
                        : String(richtextField.content);
                } else if (richtextField.html) {
                    commentContent = richtextField.html;
                }
            }
        }
        
        // Get the comment wrapper (for accessing other fields like author)
        // If comment.attributes is a string, use comment directly, otherwise use comment.attributes
        const commentWrapper = typeof comment.attributes === 'string' 
            ? comment 
            : (comment.attributes ?? comment);
        
        // Handle author data - can be in different formats from Strapi
        let authorData: any = null;
        let authorAttrs: any = {};
        
        if (commentWrapper.author) {
            // Try multiple formats that Strapi might return
            if (commentWrapper.author.data) {
                // Strapi v4/v5 format: author.data (could be single object or array)
                authorData = Array.isArray(commentWrapper.author.data) 
                    ? commentWrapper.author.data[0] 
                    : commentWrapper.author.data;
                authorAttrs = authorData?.attributes ?? authorData ?? {};
            } else if (Array.isArray(commentWrapper.author)) {
                // Array format
                authorData = commentWrapper.author[0];
                authorAttrs = authorData?.attributes ?? authorData ?? {};
            } else if (commentWrapper.author.id || commentWrapper.author.documentId) {
                // Direct author object with id/documentId
                authorData = commentWrapper.author;
                authorAttrs = authorData.attributes ?? authorData;
            } else if (commentWrapper.author.attributes) {
                // Nested attributes
                authorData = commentWrapper.author;
                authorAttrs = authorData.attributes;
            } else {
                // Direct author object
                authorData = commentWrapper.author;
                authorAttrs = authorData;
            }
        }
        
        // Extract author fields - try multiple possible locations
        const authorId = authorAttrs.id?.toString() 
            ?? authorData?.id?.toString() 
            ?? authorAttrs.documentId 
            ?? authorData?.documentId 
            ?? commentWrapper.author?.id?.toString()
            ?? commentWrapper.author?.documentId
            ?? "";
        
        const authorName = authorAttrs.name 
            ?? authorAttrs.username 
            ?? authorData?.name 
            ?? authorData?.username
            ?? commentWrapper.author?.name
            ?? commentWrapper.author?.username
            ?? (commentWrapper.author?.data ? (commentWrapper.author.data.name || commentWrapper.author.data.username) : null)
            ?? "Anonymous";
        
        // Use getAvatarUrl helper for proper avatar URL resolution
        const avatarSource = authorAttrs.avatar ?? authorData?.avatar;
        const commentAuthorAvatarUrl = getAvatarUrl(avatarSource);
        
        const author: User = {
            id: authorId,
            name: authorName,
            avatar: commentAuthorAvatarUrl || "/images/Avatar.jpg",
            role: authorAttrs.role?.name ?? authorAttrs.role ?? authorData?.role?.name ?? authorData?.role ?? "Student",
            joinDate: authorAttrs.createdAt 
                ? formatDistanceToNow(new Date(authorAttrs.createdAt), { addSuffix: false }) 
                : "Recently",
            postCount: 0,
            reputation: 0,
            isOnline: false,
        };

        // Extract createdAt, likes, dislikes from the correct location
        const createdAt = comment.createdAt ?? commentWrapper.createdAt;
        const likes = comment.likes ?? commentWrapper.likes ?? 0;
        const dislikes = comment.dislikes ?? commentWrapper.dislikes ?? 0;

        if (isReply) {
            return {
                id: commentId,
                content: commentContent,
                author,
                createdAt: createdAt 
                    ? formatDistanceToNow(new Date(createdAt), { addSuffix: true })
                    : "Recently",
                likes: likes,
                isLiked: false,
            } as Reply;
        }

        // Transform replies
        const replies: Reply[] = [];
        const repliesData = comment.replies?.data ?? commentWrapper.replies?.data ?? comment.replies ?? commentWrapper.replies ?? [];
        if (Array.isArray(repliesData)) {
            replies.push(...repliesData.map((r: any) => transformComment(r, true) as Reply));
        }

        return {
            id: commentId,
            content: commentContent,
            author,
            createdAt: createdAt 
                ? formatDistanceToNow(new Date(createdAt), { addSuffix: true })
                : "Recently",
            likes: likes,
            dislikes: dislikes,
            isLiked: false,
            isDisliked: false,
            replies,
        } as Comment;
    };

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const fetchedCategories = await getForumCategories();
                setCategories(fetchedCategories);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    // Fetch post from Strapi
    useEffect(() => {
        const fetchPost = async () => {
            // Ensure id is a string and stable
            const postId = Array.isArray(id) ? id[0] : id;
            if (!postId) return;
            
            // Convert to string to ensure consistency - NEVER modify this value
            const stableId = String(postId);
            
            // Debug: Log the stable ID to track if it's changing
            console.log('[ForumDetailPage] Fetching post with stableId:', stableId, 'from route param:', params?.id);
            
            setIsLoading(true);
            try {
                // Clear cache to ensure fresh data when navigating back
                // This ensures comments show correct author information
                const strapiPost = await getForumPost(stableId);
                
                if (!strapiPost) {
                    console.warn('[ForumDetailPage] Post not found for ID:', stableId);
                    setIsLoading(false);
                    return;
                }

                // CRITICAL: Verify that we're using the route parameter ID, not the Strapi post ID
                // If they don't match, log a warning but still use the route parameter ID
                if (strapiPost.id && String(strapiPost.id) !== stableId) {
                    console.warn('[ForumDetailPage] ID mismatch! Route param:', stableId, 'Strapi post ID:', strapiPost.id, '- Using route param ID');
                }

                // Increment view count only once per session (use sessionStorage to track)
                // This prevents multiple increments when the component re-renders
                // CRITICAL: Use stableId (route parameter) to ensure we're incrementing views for the correct post
                if (typeof window !== 'undefined') {
                    const viewKey = `forum_viewed_${stableId}`;
                    const hasViewed = sessionStorage.getItem(viewKey);
                    if (!hasViewed) {
                        sessionStorage.setItem(viewKey, 'true');
                        // Use stableId (route parameter) - incrementForumPostViews will resolve documentId internally
                        incrementForumPostViews(stableId).catch((error) => {
                            console.warn('[ForumDetailPage] Failed to increment views (non-critical):', error);
                        });
                    }
                } else {
                    // Fallback for SSR
                    incrementForumPostViews(stableId).catch((error) => {
                        console.warn('[ForumDetailPage] Failed to increment views (non-critical):', error);
                    });
                }

                // Transform author - use getAvatarUrl helper for proper avatar URL resolution
                const authorAvatarUrl = getAvatarUrl(strapiPost.author?.avatar);
                const author: User = {
                    id: strapiPost.author?.id?.toString() ?? "",
                    name: strapiPost.author?.name ?? strapiPost.author?.username ?? "Anonymous",
                    avatar: authorAvatarUrl || "/images/Avatar.jpg",
                    role: "Student",
                    joinDate: strapiPost.author?.id ? "Member" : "Recently",
                    postCount: 0,
                    reputation: 0,
                    isOnline: false,
                };

                // Transform comments
                const comments: Comment[] = [];
                const commentsData = strapiPost.comments ?? [];
                if (Array.isArray(commentsData)) {
                    // Filter out replies (they should be nested in parent comments)
                    // Also track comment IDs to prevent duplicates
                    const seenCommentIds = new Set<string>();
                    
                    const topLevelComments = commentsData.filter((c: any) => {
                        // Check if comment has a parent - handle both string and object formats
                        const attrs = typeof c.attributes === 'string' ? c : (c.attributes ?? c);
                        const hasParent = attrs.parentComment?.data || attrs.parentComment || c.parentComment?.data || c.parentComment;
                        
                        // Get comment ID to check for duplicates
                        const commentId = c.id?.toString() ?? c.documentId?.toString() ?? '';
                        
                        // Skip if it has a parent (it's a reply) or if we've already seen this comment
                        if (hasParent || seenCommentIds.has(commentId)) {
                            return false;
                        }
                        
                        seenCommentIds.add(commentId);
                        return true;
                    });
                    
                    const transformedComments = topLevelComments.map((c: any) => {
                        const comment = transformComment(c) as Comment;
                        // Check localStorage for user's like/dislike state
                        if (user?.id && typeof window !== 'undefined') {
                            const likeKey = `forum_comment_like_${user.id}_${comment.id}`;
                            const dislikeKey = `forum_comment_dislike_${user.id}_${comment.id}`;
                            const hasLiked = localStorage.getItem(likeKey) === 'true';
                            const hasDisliked = localStorage.getItem(dislikeKey) === 'true';
                            if (hasLiked) {
                                comment.isLiked = true;
                                comment.isDisliked = false;
                            } else if (hasDisliked) {
                                comment.isDisliked = true;
                                comment.isLiked = false;
                            }
                        }
                        return comment;
                    });
                    comments.push(...transformedComments);
                }

                // Transform to UI ForumPost type
                // CRITICAL: ALWAYS use the stable ID from the route parameter, NEVER use strapiPost.id
                // This ensures the URL ID stays constant and matches what was requested
                // Even if Strapi returns a different ID, we must use the route parameter ID
                const uiPost: ForumPost = {
                    id: stableId, // ALWAYS use the route parameter ID, NEVER strapiPost.id
                    title: strapiPost.title,
                    content: strapiPost.content,
                    author,
                    category: strapiPost.category ?? "general",
                    replies: strapiPost.repliesCount ?? 0,
                    views: (strapiPost.views ?? 0) + 1, // Increment for display
                    likes: strapiPost.likes ?? strapiPost.liked ?? 0,
                    dislikes: strapiPost.dislikes ?? strapiPost.dislike ?? 0,
                    isPinned: strapiPost.isPinned ?? false,
                    isAnswered: strapiPost.isAnswered ?? false,
                    createdAt: strapiPost.createdAt 
                        ? formatDistanceToNow(new Date(strapiPost.createdAt), { addSuffix: true })
                        : "Recently",
                    lastActivity: strapiPost.lastActivity 
                        ? formatDistanceToNow(new Date(strapiPost.lastActivity), { addSuffix: true })
                        : "Recently",
                    tags: strapiPost.tags?.map(t => t.name) ?? strapiPost.forum_tags?.map(t => t.name) ?? [],
                    isLiked: false,
                    isDisliked: false,
                    isBookmarked: false,
                    comments,
                };
                
                // Add description and documentId to post object for later use
                (uiPost as any).description = strapiPost.description || "";
                (uiPost as any).documentId = strapiPost.documentId || strapiPost.id.toString();

                setPost(uiPost);

                // Fetch related posts (same category, exclude current)
                // Use a simpler query to avoid 500 errors
                try {
                    const relatedResult = await getForumPosts({
                        category: strapiPost.category,
                        sortBy: "recent", // Use 'recent' instead of 'popular' to avoid complex queries
                    });
                    // getForumPosts now returns { data: ForumPost[], pagination: ... }
                    const related = Array.isArray(relatedResult) ? relatedResult : (relatedResult.data ?? []);
                    const filtered = related
                        .filter((p: any) => {
                            // Exclude current post and only include published posts
                            const isNotCurrent = p.id.toString() !== stableId && 
                                                  p.documentId !== strapiPost.documentId;
                            const isPublished = p.publishedAt !== null && p.publishedAt !== undefined;
                            return isNotCurrent && isPublished;
                        })
                        .slice(0, 3)
                        .map((p: any) => ({
                            id: p.documentId || p.id.toString(), // Use documentId for stable routing
                            title: p.title || p.name || "",
                            replies: p.repliesCount ?? 0,
                            views: p.views ?? 0,
                        }));
                    setRelatedPosts(filtered);
                } catch (error) {
                    // Silently fail - related posts are not critical
                    console.warn("Error fetching related posts (non-critical):", error);
                    setRelatedPosts([]);
                }
            } catch (error: any) {
                console.error("Error fetching forum post:", error);
                toast.error("Failed to load post. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPost();
    }, [id]);

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

    const handleCommentSubmit = async () => {
        if (!newComment.trim() || !post) return
        
        if (!user || !user.id) {
            toast.error("Please log in to comment.", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            });
            return;
        }

        setIsSubmittingComment(true);
        try {
            // Use documentId if available, otherwise use id
            const postIdentifier = (post as any).documentId || post.id;
            // Pass user ID to avoid fetching /api/users/me which requires valid token
            // Prefer documentId, but if not available, use id (which might be documentId format)
            const userId = user.documentId || user.id;
            if (!userId) {
                toast.error("User information is missing. Please log in again.", {
                    position: "top-center",
                    action: {
                        label: "Close",
                        onClick: () => {},
                    },
                    closeButton: false,
                });
                setIsSubmittingComment(false);
                return;
            }
            const createdComment = await createForumComment(postIdentifier, {
                content: newComment,
                userId: userId,
            });

            // Transform the created comment - it should have author populated from Strapi
            const newCommentObj: Comment = transformComment(createdComment) as Comment;
            
            // If author is not properly populated, use currentUser as fallback
            if (!newCommentObj.author || newCommentObj.author.name === "Anonymous") {
                newCommentObj.author = currentUser;
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
        } catch (error: any) {
            console.error("Error creating comment:", error);
            toast.error(error.message || "Failed to post comment. Please try again.");
        } finally {
            setIsSubmittingComment(false);
        }
    }

    const handleReplySubmit = async (commentId: string, replyContent: string) => {
        if (!replyContent.trim() || !post) return
        
        if (!user || !user.id) {
            toast.error("Please log in to reply.", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            });
            return;
        }

        try {
            // Use documentId if available, otherwise use id
            const postIdentifier = (post as any).documentId || post.id;
            // Pass user ID to avoid fetching /api/users/me which requires valid token
            const userId = user.documentId || user.id;
            const createdReply = await createForumComment(postIdentifier, {
                content: replyContent,
                parentCommentId: commentId,
                userId: userId,
            });

            // Transform the created reply
            const newReply: Reply = transformComment(createdReply, true) as Reply;
            newReply.author = currentUser; // Use current user for immediate display

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
        } catch (error: any) {
            console.error("Error creating reply:", error);
            toast.error(error.message || "Failed to post reply. Please try again.");
        }
    }

    const handleLikeComment = async (commentId: string) => {
        if (!user || !user.id) {
            toast.error("Please log in to like comments.", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            });
            return;
        }

        // Optimistically update UI
        const comment = post?.comments.find(c => c.id === commentId);
        if (!comment) return;

        const wasLiked = comment.isLiked;
        const wasDisliked = comment.isDisliked;

        // Update UI immediately
        setPost(prev => prev ? {
            ...prev,
            comments: prev.comments.map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        likes: wasLiked ? c.likes - 1 : c.likes + 1,
                        dislikes: wasDisliked ? Math.max(0, c.dislikes - 1) : c.dislikes,
                        isLiked: !wasLiked,
                        isDisliked: false
                    }
                }
                return c
            })
        } : null);

        try {
            // Call API to persist the change
            if (wasLiked) {
                await unlikeForumComment(commentId);
                // Remove from localStorage
                if (user?.id && typeof window !== 'undefined') {
                    localStorage.removeItem(`forum_comment_like_${user.id}_${commentId}`);
                }
            } else {
                await likeForumComment(commentId);
                // Store in localStorage
                if (user?.id && typeof window !== 'undefined') {
                    localStorage.setItem(`forum_comment_like_${user.id}_${commentId}`, 'true');
                    localStorage.removeItem(`forum_comment_dislike_${user.id}_${commentId}`);
                }
            }
        } catch (error: any) {
            console.error("Error updating like:", error);
            // Revert on error
            setPost(prev => prev ? {
                ...prev,
                comments: prev.comments.map(c => {
                    if (c.id === commentId) {
                        return {
                            ...c,
                            likes: wasLiked ? c.likes + 1 : c.likes - 1,
                            dislikes: wasDisliked ? c.dislikes + 1 : c.dislikes,
                            isLiked: wasLiked,
                            isDisliked: wasDisliked
                        }
                    }
                    return c
                })
            } : null);
            
            toast.error(error.message || "Failed to update like. Please try again.", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            });
        }
    }

    const handleDislikeComment = async (commentId: string) => {
        if (!user || !user.id) {
            toast.error("Please log in to dislike comments.", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            });
            return;
        }

        // Optimistically update UI
        const comment = post?.comments.find(c => c.id === commentId);
        if (!comment) return;

        const wasDisliked = comment.isDisliked;
        const wasLiked = comment.isLiked;

        // Update UI immediately
        setPost(prev => prev ? {
            ...prev,
            comments: prev.comments.map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        dislikes: wasDisliked ? c.dislikes - 1 : c.dislikes + 1,
                        likes: wasLiked ? Math.max(0, c.likes - 1) : c.likes,
                        isDisliked: !wasDisliked,
                        isLiked: false
                    }
                }
                return c
            })
        } : null);

        try {
            // Call API to persist the change
            if (wasDisliked) {
                await undislikeForumComment(commentId);
                // Remove from localStorage
                if (user?.id && typeof window !== 'undefined') {
                    localStorage.removeItem(`forum_comment_dislike_${user.id}_${commentId}`);
                }
            } else {
                await dislikeForumComment(commentId);
                // Store in localStorage
                if (user?.id && typeof window !== 'undefined') {
                    localStorage.setItem(`forum_comment_dislike_${user.id}_${commentId}`, 'true');
                    localStorage.removeItem(`forum_comment_like_${user.id}_${commentId}`);
                }
            }
        } catch (error: any) {
            console.error("Error updating dislike:", error);
            // Revert on error
            setPost(prev => prev ? {
                ...prev,
                comments: prev.comments.map(c => {
                    if (c.id === commentId) {
                        return {
                            ...c,
                            dislikes: wasDisliked ? c.dislikes + 1 : c.dislikes - 1,
                            likes: wasLiked ? c.likes + 1 : c.likes,
                            isDisliked: wasDisliked,
                            isLiked: wasLiked
                        }
                    }
                    return c
                })
            } : null);
            
            toast.error(error.message || "Failed to update dislike. Please try again.", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            });
        }
    }

    const handleLikeReply = async (commentId: string, replyId: string) => {
        if (!user || !user.id) {
            toast.error("Please log in to like replies.", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            });
            return;
        }

        // Find the reply
        const comment = post?.comments.find(c => c.id === commentId);
        const reply = comment?.replies.find(r => r.id === replyId);
        if (!reply) return;

        const wasLiked = reply.isLiked;

        // Optimistically update UI
        setPost(prev => prev ? {
            ...prev,
            comments: prev.comments.map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        replies: c.replies.map(r => {
                            if (r.id === replyId) {
                                return {
                                    ...r,
                                    likes: wasLiked ? r.likes - 1 : r.likes + 1,
                                    isLiked: !wasLiked
                                }
                            }
                            return r
                        })
                    }
                }
                return c
            })
        } : null);

        try {
            // Call API to persist the change (replies are also comments in Strapi)
            if (wasLiked) {
                await unlikeForumComment(replyId);
                // Remove from localStorage
                if (user?.id && typeof window !== 'undefined') {
                    localStorage.removeItem(`forum_comment_like_${user.id}_${replyId}`);
                }
            } else {
                await likeForumComment(replyId);
                // Store in localStorage
                if (user?.id && typeof window !== 'undefined') {
                    localStorage.setItem(`forum_comment_like_${user.id}_${replyId}`, 'true');
                }
            }
        } catch (error: any) {
            console.error("Error updating reply like:", error);
            // Revert on error
            setPost(prev => prev ? {
                ...prev,
                comments: prev.comments.map(c => {
                    if (c.id === commentId) {
                        return {
                            ...c,
                            replies: c.replies.map(r => {
                                if (r.id === replyId) {
                                    return {
                                        ...r,
                                        likes: wasLiked ? r.likes + 1 : r.likes - 1,
                                        isLiked: wasLiked
                                    }
                                }
                                return r
                            })
                        }
                    }
                    return c
                })
            } : null);
            
            toast.error(error.message || "Failed to update like. Please try again.", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            });
        }
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

    const handleEditComment = async (commentId: string, newContent: string) => {
        try {
            await updateForumCommentContent(commentId, newContent);
            
            // Update local state optimistically
            setPost(prev => prev ? {
                ...prev,
                comments: prev.comments.map(c => 
                    c.id === commentId 
                        ? { ...c, content: newContent }
                        : c
                )
            } : null);
            
            toast.success("Comment updated successfully!", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            });
            
            // Refresh post to get latest data
            const postId = Array.isArray(id) ? id[0] : id;
            if (!postId) return;
            const stableId = String(postId);
            const strapiPost = await getForumPost(stableId);
            if (strapiPost) {
                const authorAvatarUrl = getAvatarUrl(strapiPost.author?.avatar);
                const author: User = {
                    id: strapiPost.author?.id?.toString() ?? "",
                    name: strapiPost.author?.name ?? strapiPost.author?.username ?? "Anonymous",
                    avatar: authorAvatarUrl || "/images/Avatar.jpg",
                    role: "Student",
                    joinDate: strapiPost.author?.id ? "Member" : "Recently",
                    postCount: 0,
                    reputation: 0,
                    isOnline: false,
                };
                
                const comments: Comment[] = [];
                const commentsData = strapiPost.comments ?? [];
                if (Array.isArray(commentsData)) {
                    const seenCommentIds = new Set<string>();
                    const topLevelComments = commentsData.filter((c: any) => {
                        const attrs = typeof c.attributes === 'string' ? c : (c.attributes ?? c);
                        const hasParent = attrs.parentComment?.data || attrs.parentComment || c.parentComment?.data || c.parentComment;
                        const commentId = c.id?.toString() ?? c.documentId?.toString() ?? '';
                        if (hasParent || seenCommentIds.has(commentId)) {
                            return false;
                        }
                        seenCommentIds.add(commentId);
                        return true;
                    });
                    const transformedComments = topLevelComments.map((c: any) => {
                        const comment = transformComment(c) as Comment;
                        if (user?.id && typeof window !== 'undefined') {
                            const likeKey = `forum_comment_like_${user.id}_${comment.id}`;
                            const dislikeKey = `forum_comment_dislike_${user.id}_${comment.id}`;
                            const hasLiked = localStorage.getItem(likeKey) === 'true';
                            const hasDisliked = localStorage.getItem(dislikeKey) === 'true';
                            if (hasLiked) {
                                comment.isLiked = true;
                                comment.isDisliked = false;
                            } else if (hasDisliked) {
                                comment.isDisliked = true;
                                comment.isLiked = false;
                            }
                        }
                        return comment;
                    });
                    comments.push(...transformedComments);
                }
                
                const uiPost: ForumPost = {
                    id: stableId,
                    title: strapiPost.title,
                    content: strapiPost.content,
                    author,
                    category: strapiPost.category ?? "general",
                    replies: strapiPost.repliesCount ?? 0,
                    views: strapiPost.views ?? 0,
                    likes: strapiPost.likes ?? strapiPost.liked ?? 0,
                    dislikes: strapiPost.dislikes ?? strapiPost.dislike ?? 0,
                    isPinned: strapiPost.isPinned ?? false,
                    isAnswered: strapiPost.isAnswered ?? false,
                    createdAt: strapiPost.createdAt 
                        ? formatDistanceToNow(new Date(strapiPost.createdAt), { addSuffix: true })
                        : "Recently",
                    lastActivity: strapiPost.lastActivity 
                        ? formatDistanceToNow(new Date(strapiPost.lastActivity), { addSuffix: true })
                        : "Recently",
                    tags: strapiPost.tags?.map(t => t.name) ?? strapiPost.forum_tags?.map(t => t.name) ?? [],
                    isLiked: false,
                    isDisliked: false,
                    isBookmarked: false,
                    comments,
                };
                (uiPost as any).description = strapiPost.description || "";
                (uiPost as any).documentId = strapiPost.documentId || strapiPost.id.toString();
                setPost(uiPost);
            }
        } catch (error: any) {
            console.error("Error editing comment:", error);
            toast.error(error.message || "Failed to update comment. Please try again.", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            });
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await deleteForumComment(commentId);
            
            // Remove comment from local state
            setPost(prev => prev ? {
                ...prev,
                comments: prev.comments.filter(c => c.id !== commentId),
                replies: Math.max(0, prev.replies - 1)
            } : null);
            
            toast.success("Comment deleted successfully!", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            });
            
            // Refresh post to get updated comment count
            const postId = Array.isArray(id) ? id[0] : id;
            if (!postId) return;
            const stableId = String(postId);
            const strapiPost = await getForumPost(stableId);
            if (strapiPost) {
                const authorAvatarUrl = getAvatarUrl(strapiPost.author?.avatar);
                const author: User = {
                    id: strapiPost.author?.id?.toString() ?? "",
                    name: strapiPost.author?.name ?? strapiPost.author?.username ?? "Anonymous",
                    avatar: authorAvatarUrl || "/images/Avatar.jpg",
                    role: "Student",
                    joinDate: strapiPost.author?.id ? "Member" : "Recently",
                    postCount: 0,
                    reputation: 0,
                    isOnline: false,
                };
                
                const comments: Comment[] = [];
                const commentsData = strapiPost.comments ?? [];
                if (Array.isArray(commentsData)) {
                    const seenCommentIds = new Set<string>();
                    const topLevelComments = commentsData.filter((c: any) => {
                        const attrs = typeof c.attributes === 'string' ? c : (c.attributes ?? c);
                        const hasParent = attrs.parentComment?.data || attrs.parentComment || c.parentComment?.data || c.parentComment;
                        const commentId = c.id?.toString() ?? c.documentId?.toString() ?? '';
                        if (hasParent || seenCommentIds.has(commentId)) {
                            return false;
                        }
                        seenCommentIds.add(commentId);
                        return true;
                    });
                    const transformedComments = topLevelComments.map((c: any) => {
                        const comment = transformComment(c) as Comment;
                        if (user?.id && typeof window !== 'undefined') {
                            const likeKey = `forum_comment_like_${user.id}_${comment.id}`;
                            const dislikeKey = `forum_comment_dislike_${user.id}_${comment.id}`;
                            const hasLiked = localStorage.getItem(likeKey) === 'true';
                            const hasDisliked = localStorage.getItem(dislikeKey) === 'true';
                            if (hasLiked) {
                                comment.isLiked = true;
                                comment.isDisliked = false;
                            } else if (hasDisliked) {
                                comment.isDisliked = true;
                                comment.isLiked = false;
                            }
                        }
                        return comment;
                    });
                    comments.push(...transformedComments);
                }
                
                const uiPost: ForumPost = {
                    id: stableId,
                    title: strapiPost.title,
                    content: strapiPost.content,
                    author,
                    category: strapiPost.category ?? "general",
                    replies: strapiPost.repliesCount ?? 0,
                    views: strapiPost.views ?? 0,
                    likes: strapiPost.likes ?? strapiPost.liked ?? 0,
                    dislikes: strapiPost.dislikes ?? strapiPost.dislike ?? 0,
                    isPinned: strapiPost.isPinned ?? false,
                    isAnswered: strapiPost.isAnswered ?? false,
                    createdAt: strapiPost.createdAt 
                        ? formatDistanceToNow(new Date(strapiPost.createdAt), { addSuffix: true })
                        : "Recently",
                    lastActivity: strapiPost.lastActivity 
                        ? formatDistanceToNow(new Date(strapiPost.lastActivity), { addSuffix: true })
                        : "Recently",
                    tags: strapiPost.tags?.map(t => t.name) ?? strapiPost.forum_tags?.map(t => t.name) ?? [],
                    isLiked: false,
                    isDisliked: false,
                    isBookmarked: false,
                    comments,
                };
                (uiPost as any).description = strapiPost.description || "";
                (uiPost as any).documentId = strapiPost.documentId || strapiPost.id.toString();
                setPost(uiPost);
            }
        } catch (error: any) {
            console.error("Error deleting comment:", error);
            toast.error(error.message || "Failed to delete comment. Please try again.", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            });
        }
    };

    const handleDeleteReply = async (commentId: string, replyId: string) => {
        try {
            await deleteForumComment(replyId);
            
            // Remove reply from local state
            setPost(prev => prev ? {
                ...prev,
                comments: prev.comments.map(c => 
                    c.id === commentId 
                        ? { ...c, replies: c.replies.filter(r => r.id !== replyId) }
                        : c
                ),
                replies: Math.max(0, prev.replies - 1)
            } : null);
            
            toast.success("Reply deleted successfully!", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            });
        } catch (error: any) {
            console.error("Error deleting reply:", error);
            toast.error(error.message || "Failed to delete reply. Please try again.", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            });
        }
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
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                    <p className="text-muted-foreground">Loading discussion...</p>
                </div>
            </div>
        )
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
                <HeaderUltra />
                <div className="container min-h-screen mx-auto px-4 py-8 pt-24 text-center flex flex-col items-center justify-center">
                    <h1 className="text-2xl font-bold mb-4">Post not found</h1>
                    <Button onClick={() => router.back()}>Go Back</Button>
                </div>
                <Footer />
            </div>
        )
    }

    // Show edit form if toggled
    if (showEditForm) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
                <HeaderUltra />
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                    <ForumEditForm
                        post={post}
                        categories={categories}
                        onCancel={() => setShowEditForm(false)}
                        onSuccess={async () => {
                            setShowEditForm(false);
                            // Refresh the post
                            setIsLoading(true);
                            try {
                                const strapiPost = await getForumPost(id as string);
                                if (strapiPost) {
                                    const authorAvatarUrl = getAvatarUrl(strapiPost.author?.avatar);
                                    const author: User = {
                                        id: strapiPost.author?.id?.toString() ?? "",
                                        name: strapiPost.author?.name ?? strapiPost.author?.username ?? "Anonymous",
                                        avatar: authorAvatarUrl || "/images/Avatar.jpg",
                                        role: "Student",
                                        joinDate: strapiPost.author?.id ? "Member" : "Recently",
                                        postCount: 0,
                                        reputation: 0,
                                        isOnline: false,
                                    };

                                    const comments: Comment[] = [];
                                    const commentsData = strapiPost.comments ?? [];
                                    if (Array.isArray(commentsData)) {
                                        const topLevelComments = commentsData.filter((c: any) => {
                                            const attrs = c.attributes ?? c;
                                            return !attrs.parentComment?.data && !attrs.parentComment;
                                        });
                                        comments.push(...topLevelComments.map((c: any) => transformComment(c) as Comment));
                                    }

                                    const uiPost: ForumPost = {
                                        id: strapiPost.id.toString(),
                                        title: strapiPost.title,
                                        content: strapiPost.content,
                                        author,
                                        category: strapiPost.category ?? "general",
                                        replies: strapiPost.repliesCount ?? 0,
                                        views: strapiPost.views ?? 0,
                                        likes: strapiPost.likes ?? strapiPost.liked ?? 0,
                                        dislikes: strapiPost.dislikes ?? strapiPost.dislike ?? 0,
                                        isPinned: strapiPost.isPinned ?? false,
                                        isAnswered: strapiPost.isAnswered ?? false,
                                        createdAt: strapiPost.createdAt 
                                            ? formatDistanceToNow(new Date(strapiPost.createdAt), { addSuffix: true })
                                            : "Recently",
                                        lastActivity: strapiPost.lastActivity 
                                            ? formatDistanceToNow(new Date(strapiPost.lastActivity), { addSuffix: true })
                                            : "Recently",
                                        tags: strapiPost.tags?.map(t => t.name) ?? strapiPost.forum_tags?.map(t => t.name) ?? [],
                                        isLiked: false,
                                        isDisliked: false,
                                        isBookmarked: false,
                                        comments,
                                    };

                                    setPost(uiPost);
                                }
                            } catch (error) {
                                console.error("Error refreshing post:", error);
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                    />
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            <HeaderUltra />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-6 flex items-center justify-between"
                >
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-muted-foreground"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Forum
                    </Button>
                    {isOwner && (
                        <Button
                            variant="outline"
                            onClick={() => setShowEditForm(true)}
                            className="flex items-center gap-2"
                        >
                            <Edit className="w-4 h-4" />
                            Edit Discussion
                        </Button>
                    )}
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
                                handleEditComment={handleEditComment}
                                handleDeleteComment={handleDeleteComment}
                                handleDeleteReply={handleDeleteReply}
                                allowComments={!post.isAnswered && (post as any).status !== 'closed' && (post as any).forum_status !== 'closed'}
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
                                onPostClick={(postId) => {
                                    // postId is already documentId from relatedPosts mapping
                                    const targetId = String(postId);
                                    console.log('[ForumDetailPage] Navigating to related post (documentId):', targetId);
                                    router.push(`/forum/${targetId}`);
                                }}
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