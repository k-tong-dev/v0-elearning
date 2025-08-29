"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
    MessageCircle,
    ThumbsUp,
    ThumbsDown,
    Share2,
    Flag,
    Eye,
    Clock,
    Reply,
    MoreVertical,
    Heart,
    Bookmark,
    ArrowLeft,
    Send,
    Image as ImageIcon,
    Link as LinkIcon,
    Smile, Star
} from "lucide-react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"

interface User {
  id: string
  name: string
  avatar?: string
  role: string
  joinDate: string
  postCount: number
  reputation: number
  isOnline: boolean
}

interface Comment {
  id: string
  content: string
  author: User
  createdAt: string
  likes: number
  dislikes: number
  replies: Reply[]
  isLiked: boolean
  isDisliked: boolean
}

interface Reply {
  id: string
  content: string
  author: User
  createdAt: string
  likes: number
  isLiked: boolean
}

interface ForumPost {
  id: string
  title: string
  content: string
  author: User
  category: string
  replies: number
  views: number
  likes: number
  dislikes: number
  isPinned: boolean
  isAnswered: boolean
  createdAt: string
  lastActivity: string
  tags: string[]
  isLiked: boolean
  isDisliked: boolean
  isBookmarked: boolean
  comments: Comment[]
}

export default function ForumDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  
  const [post, setPost] = useState<ForumPost | null>(null)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)

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
  }

  const handleCommentSubmit = () => {
    if (!newComment.trim()) return
    
    const newCommentObj: Comment = {
      id: Date.now().toString(),
      content: newComment,
      author: {
        id: "current-user",
        name: "You",
        avatar: "/images/Avatar.jpg",
        role: "Student",
        joinDate: "March 2024",
        postCount: 5,
        reputation: 45,
        isOnline: true
      },
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
  }

  const handleReplySubmit = (commentId: string) => {
    if (!replyContent.trim()) return
    
    const newReply: Reply = {
      id: Date.now().toString(),
      content: replyContent,
      author: {
        id: "current-user",
        name: "You",
        avatar: "/images/Avatar.jpg",
        role: "Student",
        joinDate: "March 2024",
        postCount: 5,
        reputation: 45,
        isOnline: true
      },
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
    
    setReplyContent("")
    setReplyingTo(null)
  }

  const handleUserClick = (userId: string) => {
    router.push(`/users/${userId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <Header />
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
      <Header />
      
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
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
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
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-emerald-500"></div>
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="relative">
                        <Avatar 
                          className="w-12 h-12 cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => handleUserClick(post.author.id)}
                        >
                          <AvatarImage src={post.author.avatar} />
                          <AvatarFallback>
                            {post.author.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        {post.author.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h1 className="text-2xl font-bold">{post.title}</h1>
                          {post.isPinned && <Badge variant="outline" className="text-cyan-500">Pinned</Badge>}
                          {post.isAnswered && <Badge className="bg-green-500 text-white">Answered</Badge>}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span 
                            className="hover:text-foreground cursor-pointer transition-colors"
                            onClick={() => handleUserClick(post.author.id)}
                          >
                            by {post.author.name}
                          </span>
                          <Badge variant="outline">{post.author.role}</Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.createdAt}
                          </span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleBookmarkPost}>
                          <Bookmark className={`w-4 h-4 mr-2 ${post.isBookmarked ? 'fill-current' : ''}`} />
                          {post.isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setShowReportDialog(true)}
                          className="text-red-600"
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="prose max-w-none mb-6">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
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
                          onClick={handleLikePost}
                          className={post.isLiked ? "text-green-500" : ""}
                        >
                          <ThumbsUp className={`w-4 h-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                          {post.likes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDislikePost}
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
                </CardContent>
              </Card>
            </motion.div>

            {/* Comments Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Comments ({post.comments.length})
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Add Comment */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src="/images/Avatar.jpg" />
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
                            <Button variant="ghost" size="sm">
                              <ImageIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <LinkIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
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
                      {post.comments.map((comment, index) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.1 }}
                          className="space-y-4"
                        >
                          <div className="flex items-start gap-4">
                            <div className="relative">
                              <Avatar 
                                className="w-10 h-10 cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => handleUserClick(comment.author.id)}
                              >
                                <AvatarImage src={comment.author.avatar} />
                                <AvatarFallback>
                                  {comment.author.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              {comment.author.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="bg-accent/50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span 
                                    className="font-semibold cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleUserClick(comment.author.id)}
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
                                
                                <p className="text-sm leading-relaxed">{comment.content}</p>
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-4">
                                  <Button variant="ghost" size="sm">
                                    <ThumbsUp className={`w-3 h-3 mr-1 ${comment.isLiked ? 'fill-current text-green-500' : ''}`} />
                                    {comment.likes}
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
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
                                    <DropdownMenuItem>
                                      <Share2 className="w-3 h-3 mr-2" />
                                      Share
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                      <Flag className="w-3 h-3 mr-2" />
                                      Report
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Reply Input */}
                              <AnimatePresence>
                                {replyingTo === comment.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 pl-4 border-l-2 border-accent"
                                  >
                                    <div className="flex items-start gap-3">
                                      <Avatar className="w-8 h-8">
                                        <AvatarImage src="/images/Avatar.jpg" />
                                        <AvatarFallback>You</AvatarFallback>
                                      </Avatar>
                                      
                                      <div className="flex-1 space-y-2">
                                        <Textarea
                                          placeholder={`Reply to ${comment.author.name}...`}
                                          value={replyContent}
                                          onChange={(e) => setReplyContent(e.target.value)}
                                          className="min-h-16"
                                        />
                                        
                                        <div className="flex items-center gap-2">
                                          <Button 
                                            size="sm"
                                            onClick={() => handleReplySubmit(comment.id)}
                                            disabled={!replyContent.trim()}
                                          >
                                            Reply
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => setReplyingTo(null)}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Replies */}
                              {comment.replies.length > 0 && (
                                <div className="mt-4 pl-4 border-l-2 border-accent space-y-3">
                                  {comment.replies.map((reply, replyIndex) => (
                                    <motion.div
                                      key={reply.id}
                                      initial={{ opacity: 0, x: 20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: replyIndex * 0.1 }}
                                      className="flex items-start gap-3"
                                    >
                                      <Avatar 
                                        className="w-8 h-8 cursor-pointer hover:scale-110 transition-transform"
                                        onClick={() => handleUserClick(reply.author.id)}
                                      >
                                        <AvatarImage src={reply.author.avatar} />
                                        <AvatarFallback>
                                          {reply.author.name.split(" ").map(n => n[0]).join("")}
                                        </AvatarFallback>
                                      </Avatar>
                                      
                                      <div className="flex-1 bg-background rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span 
                                            className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleUserClick(reply.author.id)}
                                          >
                                            {reply.author.name}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {reply.createdAt}
                                          </span>
                                        </div>
                                        
                                        <p className="text-sm">{reply.content}</p>
                                        
                                        <div className="flex items-center gap-2 mt-2">
                                          <Button variant="ghost" size="sm">
                                            <ThumbsUp className={`w-3 h-3 mr-1 ${reply.isLiked ? 'fill-current text-green-500' : ''}`} />
                                            {reply.likes}
                                          </Button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Author</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 p-2 rounded-lg transition-colors"
                    onClick={() => handleUserClick(post.author.id)}
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={post.author.avatar} />
                        <AvatarFallback>
                          {post.author.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      {post.author.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold">{post.author.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {post.author.role}
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Joined</span>
                      <span>{post.author.joinDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Posts</span>
                      <span>{post.author.postCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reputation</span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        {post.author.reputation}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Related Posts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Discussions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="space-y-2 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                      <h5 className="text-sm font-medium line-clamp-2">
                        Best practices for React performance optimization
                      </h5>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageCircle className="w-3 h-3" />
                        <span>8 replies</span>
                        <Eye className="w-3 h-3" />
                        <span>124 views</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share this discussion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-2 bg-accent rounded">
              <Input 
                value={`${window.location.origin}/forum/${post.id}`}
                readOnly
                className="flex-1"
              />
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/forum/${post.id}`)
                  setShowShareDialog(false)
                }}
              >
                Copy
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Twitter
              </Button>
              <Button variant="outline" className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                LinkedIn
              </Button>
              <Button variant="outline" className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Facebook
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this discussion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea placeholder="Please describe why you're reporting this discussion..." />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive">
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
