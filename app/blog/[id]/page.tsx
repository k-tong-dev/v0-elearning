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
import ReportForm from "@/components/ui/report-form"; // Import User and Reply from types/forum

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

  const [post, setPost] = useState<BlogPost | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false)
  const [newCommentContent, setNewCommentContent] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Mock data - in real app this would come from API
  useEffect(() => {
    const mockAuthor: ForumUser = {
      id: "author-1",
      name: "Emma Rodriguez",
      avatar: "/placeholder-user.jpg",
      role: "Expert",
      joinDate: "Jan 2022",
      postCount: 47,
      reputation: 12500,
      isOnline: true,
    };

    const mockCommentAuthor1: ForumUser = {
      id: "user-2",
      name: "Mike Chen",
      avatar: "/placeholder-user.jpg",
      role: "Student",
      joinDate: "Feb 2023",
      postCount: 12,
      reputation: 120,
      isOnline: true,
    };

    const mockCommentAuthor2: ForumUser = {
      id: "user-3",
      name: "Sarah Johnson",
      avatar: "/placeholder-user.jpg",
      role: "Student",
      joinDate: "Mar 2024",
      postCount: 8,
      reputation: 80,
      isOnline: false,
    };

    const mockPost: BlogPost = {
      id: postId,
      title: "Building Modern React Applications with TypeScript",
      excerpt: "Learn how to leverage TypeScript's powerful type system to build more reliable and maintainable React applications.",
      content: `
# Introduction

React and TypeScript have become the gold standard for building modern web applications. In this comprehensive guide, we'll explore how to combine these powerful tools to create robust, maintainable, and scalable applications.

## Why TypeScript with React?

TypeScript brings static typing to JavaScript, which offers several key benefits when building React applications:

### 1. Enhanced Developer Experience
- **IntelliSense**: Get better autocomplete and code suggestions
- **Refactoring**: Safely rename variables and functions across your codebase
- **Error Detection**: Catch errors at compile time rather than runtime

### 2. Better Code Documentation
TypeScript interfaces and types serve as living documentation for your components and functions.

### 3. Improved Collaboration
When working in teams, TypeScript makes it easier to understand what props components expect and what functions return.

## Setting Up Your Project

Let's start by creating a new React application with TypeScript:

\`\`\`bash
npx create-react-app my-app --template typescript
cd my-app
npm start
\`\`\`

## Component Props with TypeScript

One of the first things you'll encounter is typing your component props:

\`\`\`tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false 
}) => {
  return (
    <button 
      className={\`btn btn-\${variant}\`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
\`\`\`

## State Management with TypeScript

TypeScript shines when it comes to state management. Here's how to use useState with proper typing:

\`\`\`tsx
interface User {
  id: number;
  name: string;
  email: string;
}

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // TypeScript will now provide proper autocomplete and type checking
  useEffect(() => {
    fetchUser().then(userData => {
      setUser(userData);
      setLoading(false);
    });
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>No user found</div>;
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};
\`\`\`

## Advanced Patterns

### Generic Components
Sometimes you need components that work with different data types:

\`\`\`tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
\`\`\`

### Custom Hooks with TypeScript
Custom hooks are even more powerful with TypeScript:

\`\`\`tsx
interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useApi<T>(url: string): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [url]);
  
  return { data, loading, error };
}
\`\`\`

## Best Practices

### 1. Use Strict Mode
Enable strict mode in your TypeScript configuration:

\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
\`\`\`

### 2. Prefer Interfaces for Props
Use interfaces instead of type aliases for component props as they're more extensible.

### 3. Use Enum for Constants
Instead of string literals, use enums for better type safety:

\`\`\`tsx
enum Theme {
  Light = 'light',
  Dark = 'dark',
  Auto = 'auto'
}
\`\`\`

## Conclusion

TypeScript and React make a powerful combination for building modern web applications. The initial learning curve is worth the long-term benefits of better code quality, improved developer experience, and reduced bugs in production.

Start small by adding TypeScript to existing components, then gradually expand your usage as you become more comfortable with the patterns and best practices.

Happy coding!
    `,
      author: mockAuthor,
      category: "web-development",
      tags: ["React", "TypeScript", "JavaScript", "Frontend", "Web Development"],
      publishedAt: "2024-01-15",
      updatedAt: "2024-01-16",
      readTime: 8,
      views: 1240,
      likes: 89,
      bookmarks: 34,
      comments: 23,
      coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=600&fit=crop",
      tableOfContents: [
        { title: "Introduction", anchor: "introduction", level: 1 },
        { title: "Why TypeScript with React?", anchor: "why-typescript-with-react", level: 2 },
        { title: "Enhanced Developer Experience", anchor: "enhanced-developer-experience", level: 3 },
        { title: "Better Code Documentation", anchor: "better-code-documentation", level: 3 },
        { title: "Setting Up Your Project", anchor: "setting-up-your-project", level: 2 },
        { title: "Component Props with TypeScript", anchor: "component-props-with-typescript", level: 2 },
        { title: "State Management with TypeScript", anchor: "state-management-with-typescript", level: 2 },
        { title: "Advanced Patterns", anchor: "advanced-patterns", level: 2 },
        { title: "Best Practices", anchor: "best-practices", level: 2 },
        { title: "Conclusion", anchor: "conclusion", level: 2 },
      ],
      isLiked: false,
      isBookmarked: false,
    }

    const mockComments: Comment[] = [
      {
        id: "1",
        content: "Great article! The examples are really clear and practical. I especially liked the custom hooks section.",
        author: mockCommentAuthor1,
        publishedAt: "2024-01-16",
        likes: 12,
        isLiked: false,
        replies: [
          {
            id: "1-1",
            content: "Thanks Mike! I'm glad you found it helpful. Custom hooks with TypeScript are really powerful once you get the hang of them.",
            author: mockAuthor,
            createdAt: "2024-01-16",
            likes: 5,
            isLiked: false,
          }
        ]
      },
      {
        id: "2",
        content: "Could you do a follow-up article about testing TypeScript React components? That would be amazing!",
        author: mockCommentAuthor2,
        publishedAt: "2024-01-16",
        likes: 8,
        isLiked: true,
        replies: []
      }
    ]

    setPost(mockPost)
    setComments(mockComments)
    setIsLiked(mockPost.isLiked)
    setIsBookmarked(mockPost.isBookmarked)
    setIsLoading(false)
  }, [postId])

  const relatedPosts = [
    {
      id: "2",
      title: "Advanced TypeScript Patterns for React",
      excerpt: "Dive deeper into advanced TypeScript patterns that will make your React code even more robust.",
      coverImage: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=200&fit=crop",
      author: "Emma Rodriguez",
      readTime: 12,
      publishedAt: "2024-01-10"
    },
    {
      id: "3",
      title: "Testing React Components with Jest and TypeScript",
      excerpt: "Learn how to write comprehensive tests for your TypeScript React components.",
      coverImage: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=200&fit-crop",
      author: "Mike Chen",
      readTime: 10,
      publishedAt: "2024-01-08"
    }
  ]

  const handleLike = () => {
    setIsLiked(!isLiked)
    setPost(prev => prev ? { ...prev, likes: prev.likes + (isLiked ? -1 : 1) } : null)
    toast.success(isLiked ? "Unliked post" : "Liked post!", {
      position: "top-center",
      action: {
        label: "Close",
        onClick: () => {},
      },
      closeButton: false,
    })
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

  const handleCommentSubmit = (e: React.FormEvent) => {
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

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      content: newCommentContent,
      author: {
        id: "current-user", // Replace with actual current user ID
        name: "You",
        avatar: "/images/Avatar.jpg", // Replace with actual current user avatar
        role: "Student",
        joinDate: new Date().toISOString().split('T')[0],
        postCount: 0,
        reputation: 0,
        isOnline: true,
      },
      publishedAt: new Date().toISOString().split('T')[0],
      likes: 0,
      dislikes: 0,
      isLiked: false,
      isDisliked: false,
      replies: [],
    };

    setComments(prev => [...prev, newComment]);
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

  const handleReplySubmit = (commentId: string) => {
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

    const newReply: ForumReply = {
      id: `r-${Date.now()}`,
      content: replyContent,
      author: {
        id: "current-user", // Replace with actual current user ID
        name: "You",
        avatar: "/images/Avatar.jpg", // Replace with actual current user avatar
        role: "Student",
        joinDate: new Date().toISOString().split('T')[0],
        postCount: 0,
        reputation: 0,
        isOnline: true,
      },
      createdAt: new Date().toISOString().split('T')[0],
      likes: 0,
      isLiked: false,
    };

    setComments(prev => prev.map(comment =>
        comment.id === commentId
            ? { ...comment, replies: [...comment.replies, newReply] }
            : comment
    ));
    setPost(prev => prev ? { ...prev, comments: prev.comments + 1 } : null); // Increment total comments count
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

  const handleFollowAuthor = () => {
    setIsFollowingAuthor(!isFollowingAuthor)
    toast.success(isFollowingAuthor ? "Unfollowed author" : "Following author!", {
      position: "top-center",
      action: {
        label: "Close",
        onClick: () => {},
      },
      closeButton: false,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const renderComment = (comment: Comment, depth: number = 0) => (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8 mt-4' : 'mb-6'}`}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar
                  className="w-8 h-8 mt-1 cursor-pointer"
                  onClick={() => handleUserClick(comment.author.id)}
              >
                <AvatarImage src={comment.author.avatar} />
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
                      })} // Placeholder
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
                        setReplyContent(""); // Clear reply input when toggling
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
                          className="mt-3 p-3 bg-accent/50 rounded-lg"
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
          </CardContent>
        </Card>
      </div>
  )

  const renderReply = (reply: ForumReply, depth: number = 0) => (
      <div key={reply.id} className={`${depth > 0 ? 'ml-8 mt-4' : 'mb-6'}`}>
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <Avatar
                  className="w-7 h-7 mt-1 cursor-pointer"
                  onClick={() => handleUserClick(reply.author.id)}
              >
                <AvatarImage src={reply.author.avatar} />
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
          </CardContent>
        </Card>
      </div>
  )

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
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
          >
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2 hover:bg-accent/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Article HeaderUltra */}
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
              >
                {/* Cover Image */}
                <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-8">
                  <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
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
                      <AvatarImage src={post.author.avatar} />
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
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLike}
                        className={`${isLiked ? 'text-red-500' : ''}`}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-red-500' : ''}`} />
                      {post.likes}
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
                  className="prose prose-lg max-w-none mb-12"
              >
                <Card>
                  <CardContent className="p-8">
                    <div
                        className="prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br>') }}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Author Bio */}
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-12"
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <Avatar
                          className="w-20 h-20 cursor-pointer"
                          onClick={() => handleUserClick(post.author.id)}
                      >
                        <AvatarImage src={post.author.avatar} />
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

                      <Button onClick={handleFollowAuthor}>
                        {isFollowingAuthor ? "Following" : "Follow"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Comments Section */}
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-12"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Comments ({comments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Add Comment Form */}
                    <form onSubmit={handleCommentSubmit} className="mb-8">
                      <Textarea
                          placeholder="Share your thoughts..."
                          value={newCommentContent}
                          onChange={(e) => setNewCommentContent(e.target.value)}
                          className="mb-4"
                      />
                      <Button type="submit" disabled={!newCommentContent.trim()}>
                        Post Comment
                      </Button>
                    </form>

                    <Separator className="mb-6" />

                    {/* Comments List */}
                    <div className="space-y-6">
                      {comments.map(comment => renderComment(comment))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Table of Contents */}
              <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
              >
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-lg">Table of Contents</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <nav className="space-y-2">
                      {post.tableOfContents.map((item, index) => (
                          <a
                              key={index}
                              href={`#${item.anchor}`}
                              className={`block text-sm hover:text-primary transition-colors ${
                                  item.level === 1 ? 'font-medium' :
                                      item.level === 2 ? 'ml-4' : 'ml-8 text-muted-foreground'
                              }`}
                          >
                            {item.title}
                          </a>
                      ))}
                    </nav>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Related Posts */}
              <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Related Articles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {relatedPosts.map((relatedPost) => (
                          <div
                              key={relatedPost.id}
                              className="group cursor-pointer"
                              onClick={() => router.push(`/blog/${relatedPost.id}`)}
                          >
                            <div className="flex gap-3">
                              <img
                                  src={relatedPost.coverImage}
                                  alt={relatedPost.title}
                                  className="w-20 h-16 object-cover rounded-lg group-hover:scale-105 transition-transform"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2 mb-2">
                                  {relatedPost.title}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{relatedPost.author}</span>
                                  <span>•</span>
                                  <span>{relatedPost.readTime} min read</span>
                                </div>
                              </div>
                            </div>
                          </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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

        <Footer />
      </div>
  )
}