"use client"

import React, { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
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
} from "lucide-react"
import { motion } from "framer-motion"

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  author: {
    id: string
    name: string
    avatar: string
    role: string
    bio: string
    followers: number
    articles: number
  }
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
}

interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    avatar: string
  }
  publishedAt: string
  likes: number
  replies: Comment[]
  isLiked: boolean
}

export default function BlogDetailPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params?.id as string

  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())

  // Mock data - in real app this would come from API
  const blogPost: BlogPost = {
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
    author: {
      id: "1",
      name: "Emma Rodriguez",
      avatar: "/placeholder-user.jpg",
      role: "Expert",
      bio: "Full-stack developer with 8+ years of experience building scalable web applications. Passionate about TypeScript, React, and developer education.",
      followers: 12500,
      articles: 47
    },
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
    ]
  }

  const comments: Comment[] = [
    {
      id: "1",
      content: "Great article! The examples are really clear and practical. I especially liked the custom hooks section.",
      author: {
        id: "2",
        name: "Mike Chen",
        avatar: "/placeholder-user.jpg"
      },
      publishedAt: "2024-01-16",
      likes: 12,
      isLiked: false,
      replies: [
        {
          id: "1-1",
          content: "Thanks Mike! I'm glad you found it helpful. Custom hooks with TypeScript are really powerful once you get the hang of them.",
          author: {
            id: "1",
            name: "Emma Rodriguez",
            avatar: "/placeholder-user.jpg"
          },
          publishedAt: "2024-01-16",
          likes: 5,
          isLiked: false,
          replies: []
        }
      ]
    },
    {
      id: "2",
      content: "Could you do a follow-up article about testing TypeScript React components? That would be amazing!",
      author: {
        id: "3",
        name: "Sarah Johnson",
        avatar: "/placeholder-user.jpg"
      },
      publishedAt: "2024-01-16",
      likes: 8,
      isLiked: true,
      replies: []
    }
  ]

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
      coverImage: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=200&fit=crop",
      author: "Mike Chen",
      readTime: 10,
      publishedAt: "2024-01-08"
    }
  ]

  const handleLike = () => {
    setIsLiked(!isLiked)
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
  }

  const handleShare = (platform: string) => {
    const url = window.location.href
    const text = `Check out this article: ${blogPost.title}`
    
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
        return
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400")
    }
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim()) {
      console.log("New comment:", newComment)
      setNewComment("")
    }
  }

  const toggleCommentExpansion = (commentId: string) => {
    const newExpanded = new Set(expandedComments)
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId)
    } else {
      newExpanded.add(commentId)
    }
    setExpandedComments(newExpanded)
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
            <Avatar className="w-8 h-8 mt-1">
              <AvatarImage src={comment.author.avatar} />
              <AvatarFallback>
                {comment.author.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">{comment.author.name}</span>
                <span className="text-xs text-muted-foreground">{formatDate(comment.publishedAt)}</span>
              </div>
              
              <p className="text-sm mb-3">{comment.content}</p>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-2 ${comment.isLiked ? 'text-red-500' : ''}`}
                  onClick={() => console.log('Like comment', comment.id)}
                >
                  <Heart className="w-3 h-3 mr-1" />
                  {comment.likes}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => setReplyingTo(comment.id)}
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
              
              {replyingTo === comment.id && (
                <div className="mt-3 p-3 bg-accent/50 rounded-lg">
                  <form onSubmit={(e) => { e.preventDefault(); setReplyingTo(null) }}>
                    <Textarea 
                      placeholder="Write a reply..."
                      className="mb-2"
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
                </div>
              )}
              
              {expandedComments.has(comment.id) && comment.replies.map(reply => 
                renderComment(reply, depth + 1)
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />
      
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
            {/* Article Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              {/* Cover Image */}
              <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-8">
                <img 
                  src={blogPost.coverImage} 
                  alt={blogPost.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <Badge variant="outline">{blogPost.category}</Badge>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {formatDate(blogPost.publishedAt)}
                </span>
                {blogPost.updatedAt && (
                  <span className="text-xs text-muted-foreground">
                    Updated {formatDate(blogPost.updatedAt)}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {blogPost.readTime} min read
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  {blogPost.views.toLocaleString()} views
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                {blogPost.title}
              </h1>

              {/* Author Info */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={blogPost.author.avatar} />
                    <AvatarFallback>
                      {blogPost.author.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{blogPost.author.name}</div>
                    <div className="text-sm text-muted-foreground">{blogPost.author.role}</div>
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
                    <Heart className="w-4 h-4 mr-2" />
                    {blogPost.likes + (isLiked ? 1 : 0)}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBookmark}
                    className={`${isBookmarked ? 'text-blue-500' : ''}`}
                  >
                    <Bookmark className="w-4 h-4 mr-2" />
                    {blogPost.bookmarks + (isBookmarked ? 1 : 0)}
                  </Button>
                  
                  <div className="relative group">
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    
                    <div className="absolute top-full right-0 mt-2 p-2 bg-background border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleShare("twitter")}>
                          <Twitter className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleShare("facebook")}>
                          <Facebook className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleShare("linkedin")}>
                          <Linkedin className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleShare("copy")}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {blogPost.tags.map(tag => (
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
                    dangerouslySetInnerHTML={{ __html: blogPost.content.replace(/\n/g, '<br>') }}
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
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={blogPost.author.avatar} />
                      <AvatarFallback>
                        {blogPost.author.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-xl font-bold">{blogPost.author.name}</h3>
                        <Badge>{blogPost.author.role}</Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-4">{blogPost.author.bio}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {blogPost.author.followers.toLocaleString()} followers
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {blogPost.author.articles} articles
                        </span>
                      </div>
                    </div>
                    
                    <Button>Follow</Button>
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
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="mb-4"
                    />
                    <Button type="submit" disabled={!newComment.trim()}>
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
                    {blogPost.tableOfContents.map((item, index) => (
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
                    {relatedPosts.map((post) => (
                      <div 
                        key={post.id}
                        className="group cursor-pointer"
                        onClick={() => router.push(`/blog/${post.id}`)}
                      >
                        <div className="flex gap-3">
                          <img 
                            src={post.coverImage} 
                            alt={post.title}
                            className="w-20 h-16 object-cover rounded-lg group-hover:scale-105 transition-transform"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2 mb-2">
                              {post.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{post.author}</span>
                              <span>•</span>
                              <span>{post.readTime} min read</span>
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

      <Footer />
    </div>
  )
}
