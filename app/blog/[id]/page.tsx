"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link" // Import Link for navigation
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import { Footer } from "@/components/ui/footers/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ArrowLeft,
  ThumbsUp,
  Reply,
  ChevronDown,
  ChevronUp,
  Twitter,
  Facebook,
  Linkedin,
  Copy,
  User,
  Tag,
  BookOpen,
  TrendingUp,
  ThumbsDown,
  MoreVertical,
  Flag,
  Send,
  ImageIcon,
  Link as LinkIcon,
  Smile,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner" // Import toast for notifications
import { useAuth } from "@/hooks/use-auth"
import { followUser, unfollowUser, isFollowingUser } from "@/integrations/strapi/user"
import { isBlogFavorite, createBlogFavorite, deleteBlogFavorite, getUserBlogFavorites } from "@/integrations/strapi/blogFavorites"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { User as ForumUser, Reply as ForumReply } from "@/types/forum"
import ShareForm from "@/components/ui/share-form";
import ReportForm from "@/components/ui/report-form";
import { getBlogPostById, getBlogPostBySlug, getBlogPostByDocumentId, getRelatedBlogPosts, isBlogPostAuthor, getBlogComments, createBlogComment, BlogComment, deleteBlogPost, incrementBlogPostViews } from "@/integrations/strapi/blog";
import { getAvatarUrl } from "@/lib/getAvatarUrl";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { BlogContentRenderer } from "@/components/blog/BlogContentRenderer";
import { useUser } from "@/contexts/UserContext";

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  author: ForumUser // Use ForumUser type
  category: string
  tags: string[]
  publishedAt: string
  updatedAt?: string
  readTime: number
  views: number
  likes: number
  bookmarks: number
  comments: number
  coverImage: string
  tableOfContents: {
    title: string
    anchor: string
    level: number
  }[]
  isLiked: boolean
  isBookmarked: boolean
}

interface Comment {
  id: string
  content: string
  author: ForumUser // Use ForumUser type
  publishedAt: string
  likes: number
  replies: ForumReply[] // Use ForumReply type
  isLiked: boolean
}

export default function BlogDetailPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params?.id as string
  const { user: currentUser } = useAuth()

  const [post, setPost] = useState<BlogPost | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false)
  const [isTogglingFollow, setIsTogglingFollow] = useState(false)
  const [newCommentContent, setNewCommentContent] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [relatedPosts, setRelatedPosts] = useState<any[]>([])
  const [postNumericId, setPostNumericId] = useState<string | number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch blog post from Strapi
  useEffect(() => {
    async function fetchBlogPost() {
      if (!postId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Try to fetch by documentId first (most reliable and prevents duplicates)
        // If postId looks like a documentId (UUID-like), use it directly
        // Otherwise, try documentId first, then slug, then numeric ID as fallback
        let post = null;
        
        // Check if postId looks like a documentId (contains hyphens, typical UUID format)
        if (postId.includes('-') && postId.length > 20) {
          post = await getBlogPostByDocumentId(postId);
        }
        
        // If not found or not a documentId format, try other methods
        if (!post) {
          post = await getBlogPostByDocumentId(postId) || await getBlogPostBySlug(postId) || await getBlogPostById(postId);
        }
        
        if (post) {
          // Use documentId for URL routing (prevents duplicates)
          const documentId = post.documentId || postId;
          
          // Redirect to documentId URL if we're not already using it
          if (post.documentId && post.documentId !== postId) {
            router.replace(`/blog/${post.documentId}`);
            return;
          }
          
          // Store the numeric ID for API calls
          const numericId = post.id;
          setPostNumericId(numericId);
          
          // Map Strapi post to BlogPost format - use documentId for the ID
          const mappedPost: BlogPost = {
            id: documentId || post.slug || String(post.id),
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            author: {
              id: String(post.author.id),
              name: post.author.name,
              avatar: getAvatarUrl(post.author.avatar) || "/images/Avatar.jpg",
              role: post.author.role || "Author",
              bio: post.author.bio,
              reputation: post.author.reputation || 0,
              postCount: post.author.postCount || 0,
            },
            category: post.category.slug || String(post.category.id),
            tags: post.tags || [],
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
            readTime: post.readTime,
            views: post.views,
            likes: post.likes,
            bookmarks: 0, // Not in Strapi schema yet
            comments: post.commentsCount,
            coverImage: post.coverImage || null,
            tableOfContents: [], // Can be generated from content if needed
            isLiked: false,
            isBookmarked: false,
          };
          
          setPost(mappedPost);
          
          // Check if current user can edit this post - pass author ID directly to avoid refetching
          try {
            const userCanEdit = await isBlogPostAuthor(numericId, post.author.id);
            setCanEdit(userCanEdit);
      } catch (error) {
            console.error("Error checking edit permission:", error);
            setCanEdit(false);
          }
          
          // Fetch comments for this post - use numeric ID
          try {
            const blogComments = await getBlogComments(numericId);
            const mappedComments: Comment[] = blogComments.map((comment: BlogComment) => ({
              id: String(comment.id),
              content: comment.content,
              author: {
                id: String(comment.author.id),
                name: comment.author.name,
                avatar: comment.author.avatar || "/images/Avatar.jpg",
      role: "Student",
                joinDate: "Recently",
                postCount: 0,
                reputation: 0,
                isOnline: false,
              },
              publishedAt: comment.publishedAt || comment.createdAt,
              replies: (comment.replies || []).map((reply: BlogComment) => ({
                id: String(reply.id),
                content: reply.content,
                author: {
                  id: String(reply.author.id),
                  name: reply.author.name,
                  avatar: reply.author.avatar || "/images/Avatar.jpg",
      role: "Student",
                  joinDate: "Recently",
                  postCount: 0,
                  reputation: 0,
      isOnline: false,
                },
                createdAt: reply.createdAt || reply.publishedAt || new Date().toISOString(),
                likes: 0,
                isLiked: false,
              })),
              isLiked: false,
            }));
            setComments(mappedComments);
          } catch (error) {
            console.error("Error fetching comments:", error);
            setComments([]);
          }
          
          // Fetch related posts dynamically - use numeric ID
          if (post.category?.slug) {
            try {
            const related = await getRelatedBlogPosts(numericId, post.category.slug, 3);
              if (related && related.length > 0) {
                const mappedRelated = related.map((rp: any) => ({
                  id: rp.slug || String(rp.id),
                  title: rp.title,
                  excerpt: rp.excerpt,
                  coverImage: rp.coverImage || "/images/default-blog-cover.jpg",
                  author: rp.author?.name || "Unknown",
                  readTime: rp.readTime || 0,
                }));
                setRelatedPosts(mappedRelated);
              }
            } catch (error) {
              console.warn("Error fetching related posts:", error);
              setRelatedPosts([]);
            }
          }

          // Check if current user is following the author
          if (currentUser?.id && post.author.id) {
            try {
              const following = await isFollowingUser(post.author.id, currentUser.id);
              setIsFollowingAuthor(following);
            } catch (error) {
              console.warn("Error checking follow status:", error);
            }
          }

          // Check if blog is favorited
          if (currentUser?.id && numericId) {
            try {
              const favorited = await isBlogFavorite(currentUser.id, numericId);
              setIsFavorited(favorited);
            } catch (error) {
              console.warn("Error checking favorite status:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching blog post:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBlogPost();
  }, [postId, currentUser?.id]);

  // Increment views when blog post is viewed (once per session)
  useEffect(() => {
    if (!postId || !post) return;
    
    if (typeof window !== 'undefined') {
      const viewKey = `blog_viewed_${postId}`;
      const hasViewed = sessionStorage.getItem(viewKey);
      if (!hasViewed) {
        sessionStorage.setItem(viewKey, 'true');
        incrementBlogPostViews(postId).catch((error) => {
          console.warn('[BlogDetailPage] Failed to increment views (non-critical):', error);
        });
      }
    }
  }, [postId, post]);

  // All data is now fetched dynamically from Strapi

  // Related posts are now fetched dynamically from Strapi (stored in state)

  const handleLike = async () => {
    if (!currentUser?.id || !postNumericId || isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    try {
      if (isFavorited) {
        // Get favorite entry to delete
        const favorites = await getUserBlogFavorites(currentUser.id);
        const favoriteEntry = favorites.find(fav => fav.blogPostId === postNumericId);
        
        if (favoriteEntry) {
          await deleteBlogFavorite(favoriteEntry.id, favoriteEntry.documentId);
          setIsFavorited(false);
          toast.success("Removed from favorites");
        }
      } else {
        await createBlogFavorite(currentUser.id, postNumericId);
        setIsFavorited(true);
        toast.success("Added to favorites");
      }
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      toast.error(error.message || "Failed to update favorite status");
    } finally {
      setIsTogglingFavorite(false);
    }
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    setPost(prev => prev ? { ...prev, bookmarks: prev.bookmarks + (isBookmarked ? -1 : 1) } : null)
    toast.success(isBookmarked ? "Removed from bookmarks" : "Bookmarked post!", {
      position: "top-center",
      action: {
        label: "Close",
        onClick: () => {},
      },
      closeButton: false,
    })
  }

  const handleShare = (platform: string) => {
    const url = window.location.href
    const text = `Check out this article: ${post?.title}`

    let shareUrl = ""
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
        break
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        break
      case "copy":
        navigator.clipboard.writeText(url)
        toast.success("Link copied to clipboard!", {
          position: "top-center",
          action: {
            label: "Close",
            onClick: () => {},
          },
          closeButton: false,
        })
        setShowShareDialog(false)
        return
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400")
      setShowShareDialog(false)
    }
  }

  const handleReportSubmit = () => {
    if (reportReason.trim()) {
      console.log(`Reporting blog post ${postId} for reason: ${reportReason}`);
      toast.success("Blog post reported successfully. We'll review it shortly.", {
        position: "top-center",
        action: {
          label: "Close",
          onClick: () => {},
        },
        closeButton: false,
      });
      setReportReason("");
      setShowReportDialog(false);
    } else {
      toast.error("Please provide a reason for reporting.", {
        position: "top-center",
        action: {
          label: "Close",
          onClick: () => {},
        },
        closeButton: false,
      });
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCommentContent.trim()) {
      toast.error("Comment cannot be empty.", {
        position: "top-center",
        action: {
          label: "Close",
          onClick: () => {},
        },
        closeButton: false,
      });
      return;
    }

    if (!post || !postNumericId) {
      toast.error("Post not found.");
      return;
    }

    try {
      const createdComment = await createBlogComment({
      content: newCommentContent,
        postId: postNumericId,
      });

      if (createdComment) {
        // Refresh comments to get the latest data
        const blogComments = await getBlogComments(postNumericId);
        const mappedComments: Comment[] = blogComments.map((comment: BlogComment) => ({
          id: String(comment.id),
          content: comment.content,
      author: {
            id: String(comment.author.id),
            name: comment.author.name,
            avatar: comment.author.avatar || "/images/Avatar.jpg",
        role: "Student",
            joinDate: "Recently",
        postCount: 0,
        reputation: 0,
            isOnline: false,
          },
          publishedAt: comment.publishedAt || comment.createdAt,
          replies: (comment.replies || []).map((reply: BlogComment) => ({
            id: String(reply.id),
            content: reply.content,
            author: {
              id: String(reply.author.id),
              name: reply.author.name,
              avatar: reply.author.avatar || "/images/Avatar.jpg",
              role: "Student",
              joinDate: "Recently",
              postCount: 0,
              reputation: 0,
              isOnline: false,
            },
            createdAt: reply.createdAt || reply.publishedAt || new Date().toISOString(),
      likes: 0,
      isLiked: false,
          })),
          isLiked: false,
        }));
        setComments(mappedComments);
    setPost(prev => prev ? { ...prev, comments: prev.comments + 1 } : null);
    setNewCommentContent("");
    toast.success("Comment posted successfully!", {
      position: "top-center",
      action: {
        label: "Close",
        onClick: () => {},
      },
      closeButton: false,
    });
      }
    } catch (error: any) {
      console.error("Error creating comment:", error);
      toast.error(error.message || "Failed to post comment", {
        position: "top-center",
        action: {
          label: "Close",
          onClick: () => {},
        },
        closeButton: false,
      });
    }
  }

  const handleReplySubmit = async (commentId: string) => {
    if (!replyContent.trim()) {
      toast.error("Reply cannot be empty.", {
        position: "top-center",
        action: {
          label: "Close",
          onClick: () => {},
        },
        closeButton: false,
      });
      return;
    }

    if (!post || !postNumericId) {
      toast.error("Post not found.");
      return;
    }

    try {
      const createdReply = await createBlogComment({
      content: replyContent,
        postId: postNumericId,
        parentCommentId: commentId,
      });

      if (createdReply) {
        // Refresh comments to get the latest data
        const blogComments = await getBlogComments(postNumericId);
        const mappedComments: Comment[] = blogComments.map((comment: BlogComment) => ({
          id: String(comment.id),
          content: comment.content,
      author: {
            id: String(comment.author.id),
            name: comment.author.name,
            avatar: comment.author.avatar || "/images/Avatar.jpg",
        role: "Student",
            joinDate: "Recently",
        postCount: 0,
        reputation: 0,
            isOnline: false,
          },
          publishedAt: comment.publishedAt || comment.createdAt,
          replies: (comment.replies || []).map((reply: BlogComment) => ({
            id: String(reply.id),
            content: reply.content,
            author: {
              id: String(reply.author.id),
              name: reply.author.name,
              avatar: reply.author.avatar || "/images/Avatar.jpg",
              role: "Student",
              joinDate: "Recently",
              postCount: 0,
              reputation: 0,
              isOnline: false,
            },
            createdAt: reply.createdAt || reply.publishedAt || new Date().toISOString(),
      likes: 0,
      isLiked: false,
          })),
          isLiked: false,
        }));
        setComments(mappedComments);
        setPost(prev => prev ? { ...prev, comments: prev.comments + 1 } : null);
    setReplyContent("");
    setReplyingTo(null);
    toast.success("Reply posted successfully!", {
      position: "top-center",
      action: {
        label: "Close",
        onClick: () => {},
      },
      closeButton: false,
    });
      }
    } catch (error: any) {
      console.error("Error creating reply:", error);
      toast.error(error.message || "Failed to post reply", {
        position: "top-center",
        action: {
          label: "Close",
          onClick: () => {},
        },
        closeButton: false,
      });
    }
  }

  const toggleCommentExpansion = (commentId: string) => {
    setExpandedComments(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(commentId)) {
        newExpanded.delete(commentId)
      } else {
        newExpanded.add(commentId)
      }
      return newExpanded
    })
  }

  const handleUserClick = (userId: string) => {
    router.push(`/users/${userId}`)
  }

  const handleFollowAuthor = async () => {
    if (!currentUser?.id || !post?.author.id || isTogglingFollow) return;

    setIsTogglingFollow(true);
    try {
      if (isFollowingAuthor) {
        const success = await unfollowUser(post.author.id, currentUser.id);
        if (success) {
          setIsFollowingAuthor(false);
          toast.success(`Unfollowed ${post.author.name}`);
        } else {
          toast.error("Failed to unfollow author");
        }
      } else {
        const success = await followUser(post.author.id, currentUser.id);
        if (success) {
          setIsFollowingAuthor(true);
          toast.success(`Following ${post.author.name}`);
        } else {
          toast.error("Failed to follow author");
        }
      }
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      toast.error(error.message || "Failed to update follow status");
    } finally {
      setIsTogglingFollow(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDelete = async () => {
    if (!post || !postNumericId) {
      toast.error("Post not found.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteBlogPost(postNumericId);
      toast.success("Blog post deleted successfully!", {
        position: "top-center",
        action: {
          label: "Close",
          onClick: () => {},
        },
        closeButton: false,
      });
      router.push("/blog");
    } catch (error: any) {
      console.error("Error deleting blog post:", error);
      toast.error(error.message || "Failed to delete blog post", {
        position: "top-center",
        action: {
          label: "Close",
          onClick: () => {},
        },
        closeButton: false,
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  function renderComment(comment: Comment, depth: number = 0) {
    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8 mt-4' : 'mb-6'}`}>
        <div className="py-4">
            <div className="flex items-start gap-3">
              <Avatar
                  className="w-8 h-8 mt-1 cursor-pointer"
                  onClick={() => handleUserClick(comment.author.id)}
              >
                <AvatarImage src={comment.author.avatar || "/images/Avatar.jpg"} />
                <AvatarFallback className="text-xs">
                  {comment.author.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                <span
                    className="font-medium text-sm cursor-pointer hover:text-primary"
                    onClick={() => handleUserClick(comment.author.id)}
                >
                    {comment.author.name}
                </span>
                  <span className="text-xs text-muted-foreground">{formatDate(comment.publishedAt)}</span>
                </div>

                <p className="text-sm mb-3">{comment.content}</p>

                <div className="flex items-center gap-4">
                  <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 px-2 ${comment.isLiked ? 'text-red-500' : ''}`}
                      onClick={() => toast.info("Like comment functionality coming soon!", {
                        position: "top-center",
                        action: {
                          label: "Close",
                          onClick: () => {},
                        },
                        closeButton: false,
                      })}
                  >
                    <Heart className="w-3 h-3 mr-1" />
                    {comment.likes}
                  </Button>

                  <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => {
                        setReplyingTo(replyingTo === comment.id ? null : comment.id);
                        setReplyContent("");
                      }}
                  >
                    <Reply className="w-3 h-3 mr-1" />
                    Reply
                  </Button>

                  {comment.replies.length > 0 && (
                      <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => toggleCommentExpansion(comment.id)}
                      >
                        {expandedComments.has(comment.id) ? (
                            <ChevronUp className="w-3 h-3 mr-1" />
                        ) : (
                            <ChevronDown className="w-3 h-3 mr-1" />
                        )}
                        {comment.replies.length} replies
                      </Button>
                  )}
                </div>

                <AnimatePresence>
                  {replyingTo === comment.id && (
                      <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 p-3"
                      >
                        <form onSubmit={(e) => { e.preventDefault(); handleReplySubmit(comment.id); }}>
                          <Textarea
                              placeholder={`Write a reply to ${comment.author.name}...`}
                              className="mb-2"
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button type="submit" size="sm">Reply</Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setReplyingTo(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </motion.div>
                  )}
                </AnimatePresence>

                {expandedComments.has(comment.id) && comment.replies.map(reply =>
                    renderReply(reply, depth + 1)
                )}
              </div>
            </div>
      </div>
        </div>
    );
  };

  const renderReply = (reply: ForumReply, depth: number = 0): React.JSX.Element => {
    return (
      <div key={reply.id} className={`${depth > 0 ? 'ml-8 mt-4' : 'mb-6'}`}>
        <div className="py-3">
            <div className="flex items-start gap-3">
              <Avatar
                  className="w-7 h-7 mt-1 cursor-pointer"
                  onClick={() => handleUserClick(reply.author.id)}
              >
                <AvatarImage src={reply.author.avatar || "/images/Avatar.jpg"} />
                <AvatarFallback className="text-xs">
                  {reply.author.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                            <span
                                className="font-medium text-xs cursor-pointer hover:text-primary"
                                onClick={() => handleUserClick(reply.author.id)}
                            >
                                {reply.author.name}
                            </span>
                  <span className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</span>
                </div>
                <p className="text-xs">{reply.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                      variant="ghost"
                      size="sm"
                      className={`h-5 px-1.5 ${reply.isLiked ? 'text-red-500' : ''}`}
                      onClick={() => toast.info("Like reply functionality coming soon!", {
                        position: "top-center",
                        action: {
                          label: "Close",
                          onClick: () => {},
                        },
                        closeButton: false,
                      })} // Placeholder
                  >
                    <Heart className="w-3 h-3 mr-1" />
                    {reply.likes}
                  </Button>
                </div>
              </div>
            </div>
      </div>
      </div>
    );
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

        <div className="container mx-auto pt-24">
          {/* Back Button */}
          <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
          >
            <Button
                variant="ghost"
                onClick={() => router.push("/blog")}
                className="flex items-center gap-2 hover:bg-accent/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Button>
          </motion.div>

          <div className="w-full mx-auto">
            {/* Main Content */}
            <div>
              {/* Article HeaderUltra */}
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
              >
                {/* Cover Image */}
                <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-8">
                  {post.coverImage && typeof post.coverImage === 'string' && post.coverImage.trim() !== '' ? (
                    <>
                  <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
                      {/* Animated gradient overlay for depth */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/50 via-transparent to-purple-600/50 animate-pulse" />
                      {/* Decorative pattern */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl" />
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-300/15 rounded-full blur-2xl" />
                      </div>
                      {/* Title overlay for visual interest */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white/30 font-bold text-6xl md:text-8xl select-none">
                          {post.title.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <Badge variant="outline">{post.category}</Badge>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                    {formatDate(post.publishedAt)}
                </span>
                  {post.updatedAt && (
                      <span className="text-xs text-muted-foreground">
                    Updated {formatDate(post.updatedAt)}
                  </span>
                  )}
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                    {post.readTime} min read
                </span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="w-4 h-4" />
                    {post.views.toLocaleString()} views
                </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {post.title}
                </h1>

                {/* Author Info */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <Avatar
                        className="w-12 h-12 cursor-pointer"
                        onClick={() => handleUserClick(post.author.id)}
                    >
                      <AvatarImage src={post.author.avatar || "/images/Avatar.jpg"} />
                      <AvatarFallback>
                        {post.author.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div
                          className="font-semibold cursor-pointer hover:text-primary"
                          onClick={() => handleUserClick(post.author.id)}
                      >
                        {post.author.name}
                      </div>
                      <div className="text-sm text-muted-foreground">{post.author.role}</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/blog/${post?.id || postId}/edit`)}
                          className="mr-2"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteDialog(true)}
                          className="mr-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLike}
                        disabled={isTogglingFavorite || !currentUser}
                        className={`${isFavorited ? 'text-red-500' : ''}`}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-red-500' : ''}`} />
                      {isTogglingFavorite ? "..." : post.likes}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBookmark}
                        className={`${isBookmarked ? 'text-blue-500' : ''}`}
                    >
                      <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-blue-500' : ''}`} />
                      {post.bookmarks}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                          <Share2 className="w-4 h-4 mr-2" /> Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-red-600">
                          <Flag className="w-4 h-4 mr-2" /> Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {post.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-accent">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                  ))}
                </div>
              </motion.div>

              {/* Article Content */}
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"
              >
                <BlogContentRenderer content={post.content} />
              </motion.div>

              {/* Author Bio */}
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"
              >
                <div className="flex items-start gap-6 py-8 border-t border-border/50">
                      <Avatar
                          className="w-20 h-20 cursor-pointer"
                          onClick={() => handleUserClick(post.author.id)}
                      >
                    <AvatarImage src={post.author.avatar || "/images/Avatar.jpg"} />
                        <AvatarFallback>
                          {post.author.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h3
                              className="text-xl font-bold cursor-pointer hover:text-primary"
                              onClick={() => handleUserClick(post.author.id)}
                          >
                            {post.author.name}
                          </h3>
                          <Badge>{post.author.role}</Badge>
                        </div>

                        <p className="text-muted-foreground mb-4">{post.author.bio}</p>

                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {post.author.reputation.toLocaleString()} reputation
                        </span>
                          <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                            {post.author.postCount} articles
                        </span>
                        </div>
                      </div>

                      <Button 
                        onClick={handleFollowAuthor}
                        disabled={isTogglingFollow || !currentUser}
                        variant={isFollowingAuthor ? "outline" : "default"}
                      >
                        {isTogglingFollow ? (
                          "Loading..."
                        ) : isFollowingAuthor ? (
                          "Following"
                        ) : (
                          "Follow"
                        )}
                      </Button>
                    </div>
              </motion.div>

                    </div>
          </div>
        </div>

        {/* Share Dialog */}
        <ShareForm
            isOpen={showShareDialog}
            onOpenChange={setShowShareDialog}
            url={window.location.href}
            title={post.title}
        />

        {/* Report Dialog */}
        <ReportForm
            isOpen={showReportDialog}
            onOpenChange={setShowReportDialog}
            title={post.title}
            onSubmit={handleReportSubmit}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Blog Post</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to delete this blog post? This action cannot be undone. 
                All associated images (cover image and SEO image) will also be deleted.
              </p>
              <p className="text-sm font-medium">
                Post: {post?.title}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Footer />
      </div>
  )
}