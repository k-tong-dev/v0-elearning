"use client"

import React, { useState } from "react"
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
  Search,
  Plus,
  Users,
  Clock,
  Pin,
  TrendingUp,
  Eye,
  ThumbsUp,
  Reply,
  Filter,
  Star
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ForumPost {
  id: number
  title: string
  content: string
  author: {
    name: string
    avatar?: string
    role: string
  }
  category: string
  replies: number
  views: number
  likes: number
  isPinned: boolean
  isAnswered: boolean
  createdAt: string
  lastActivity: string
  tags: string[]
}

interface Category {
  id: string
  name: string
  description: string
  postCount: number
  color: string
}

export default function ForumPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [sortBy, setSortBy] = useState("recent")
    const [isNewPostOpen, setIsNewPostOpen] = useState(false)
    const [newPost, setNewPost] = useState({
        title: "",
        content: "",
        category: "",
        tags: ""
    })

    const categories: Category[] = [
        {
            id: "general",
            name: "General Discussion",
            description: "General topics and conversations",
            postCount: 156,
            color: "bg-blue-500"
        },
        {
            id: "courses",
            name: "Course Help",
            description: "Get help with specific courses",
            postCount: 89,
            color: "bg-green-500"
        },
        {
            id: "technical",
            name: "Technical Support",
            description: "Technical issues and troubleshooting",
            postCount: 45,
            color: "bg-red-500"
        },
        {
            id: "projects",
            name: "Project Showcase",
            description: "Share your projects and get feedback",
            postCount: 67,
            color: "bg-purple-500"
        },
        {
            id: "career",
            name: "Career Advice",
            description: "Career guidance and job opportunities",
            postCount: 34,
            color: "bg-orange-500"
        },
        {
            id: "announcements",
            name: "Announcements",
            description: "Official announcements and updates",
            postCount: 12,
            color: "bg-cyan-500"
        }
    ]

    const forumPosts: ForumPost[] = [
        {
            id: 1,
            title: "How to deploy React app to production?",
            content: "I'm having trouble deploying my React application to production. Can someone help me with the best practices?",
            author: {
                name: "Sarah Johnson",
                avatar: "/images/Avatar.jpg",
                role: "Student"
            },
            category: "technical",
            replies: 12,
            views: 245,
            likes: 8,
            isPinned: false,
            isAnswered: true,
            createdAt: "2 hours ago",
            lastActivity: "30 minutes ago",
            tags: ["react", "deployment", "production"]
        },
        {
            id: 2,
            title: "Welcome to the CamEdu Community Forum!",
            content: "Welcome everyone! This is our new community forum where you can ask questions, share projects, and connect with fellow learners.",
            author: {
                name: "Admin Team",
                avatar: "/images/Avatar.jpg",
                role: "Administrator"
            },
            category: "announcements",
            replies: 25,
            views: 1200,
            likes: 45,
            isPinned: true,
            isAnswered: false,
            createdAt: "1 week ago",
            lastActivity: "1 hour ago",
            tags: ["welcome", "community", "announcement"]
        },
        {
            id: 3,
            title: "JavaScript fundamentals - Need clarification on closures",
            content: "I'm working through the JavaScript course and having trouble understanding closures. Can someone explain with examples?",
            author: {
                name: "Mike Chen",
                avatar: "/images/Avatar.jpg",
                role: "Student"
            },
            category: "courses",
            replies: 7,
            views: 189,
            likes: 15,
            isPinned: false,
            isAnswered: true,
            createdAt: "5 hours ago",
            lastActivity: "2 hours ago",
            tags: ["javascript", "closures", "fundamentals"]
        },
        {
            id: 4,
            title: "My first full-stack project - E-commerce site",
            content: "Just finished building my first e-commerce site using MERN stack. Would love to get some feedback!",
            author: {
                name: "Emma Rodriguez",
                avatar: "/images/Avatar.jpg",
                role: "Student"
            },
            category: "projects",
            replies: 18,
            views: 356,
            likes: 22,
            isPinned: false,
            isAnswered: false,
            createdAt: "1 day ago",
            lastActivity: "4 hours ago",
            tags: ["project", "mern", "ecommerce", "feedback"]
        },
        {
            id: 5,
            title: "Career transition from marketing to web development",
            content: "I'm making a career change from marketing to web development. Any advice on building a strong portfolio?",
            author: {
                name: "David Park",
                avatar: "/images/Avatar.jpg",
                role: "Student"
            },
            category: "career",
            replies: 14,
            views: 278,
            likes: 19,
            isPinned: false,
            isAnswered: false,
            createdAt: "2 days ago",
            lastActivity: "6 hours ago",
            tags: ["career", "transition", "portfolio", "advice"]
        }
    ]

    const filteredPosts = forumPosts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesCategory = selectedCategory === "all" || post.category === selectedCategory

        return matchesSearch && matchesCategory
    })

    const sortedPosts = [...filteredPosts].sort((a, b) => {
        switch (sortBy) {
            case "popular":
                return (b.likes + b.replies) - (a.likes + a.replies)
            case "views":
                return b.views - a.views
            case "replies":
                return b.replies - a.replies
            default: // recent
                return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        }
    })

    const pinnedPosts = sortedPosts.filter(post => post.isPinned)
    const regularPosts = sortedPosts.filter(post => !post.isPinned)

    const handleCreatePost = () => {
        // In a real app, this would make an API call
        console.log("Creating post:", newPost)
        setIsNewPostOpen(false)
        setNewPost({title: "", content: "", category: "", tags: ""})
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            <Header/>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Header Section */}
                <div className="mb-8" data-aos="fade-up">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                                Community Forum
                            </h1>
                            <p className="text-muted-foreground">
                                Connect, learn, and grow together with our community of learners
                            </p>
                        </div>

                        <Dialog open={isNewPostOpen} onOpenChange={setIsNewPostOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white">
                                    <Plus className="w-4 h-4 mr-2"/>
                                    New Discussion
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Start a New Discussion</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <Input
                                        placeholder="Discussion title..."
                                        value={newPost.title}
                                        onChange={(e) => setNewPost(prev => ({...prev, title: e.target.value}))}
                                    />
                                    <Select value={newPost.category}
                                            onValueChange={(value) => setNewPost(prev => ({...prev, category: value}))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(category => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Textarea
                                        placeholder="What would you like to discuss?"
                                        className="min-h-32"
                                        value={newPost.content}
                                        onChange={(e) => setNewPost(prev => ({...prev, content: e.target.value}))}
                                    />
                                    <Input
                                        placeholder="Tags (comma separated)"
                                        value={newPost.tags}
                                        onChange={(e) => setNewPost(prev => ({...prev, tags: e.target.value}))}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setIsNewPostOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleCreatePost}
                                                disabled={!newPost.title || !newPost.content}>
                                            Create Discussion
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Categories */}
                        <Card data-aos="fade-up" data-aos-delay="100">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="w-5 h-5"/>
                                    Categories
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    variant={selectedCategory === "all" ? "default" : "ghost"}
                                    className="w-full justify-start"
                                    onClick={() => setSelectedCategory("all")}
                                >
                                    All Categories
                                </Button>
                                {categories.map(category => (
                                    <Button
                                        key={category.id}
                                        variant={selectedCategory === category.id ? "default" : "ghost"}
                                        className="w-full justify-between"
                                        onClick={() => setSelectedCategory(category.id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${category.color}`}/>
                                            {category.name}
                                        </div>
                                        <Badge variant="secondary">{category.postCount}</Badge>
                                    </Button>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Forum Stats */}
                        <Card data-aos="fade-up" data-aos-delay="200">
                            <CardHeader>
                                <CardTitle>Forum Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Total Posts</span>
                                    <span className="font-semibold">403</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Active Members</span>
                                    <span className="font-semibold">1,247</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Online Now</span>
                                    <span className="font-semibold text-green-500">89</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Search and Filters */}
                        <Card data-aos="fade-up" data-aos-delay="300">
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Search
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                                        <Input
                                            placeholder="Search discussions..."
                                            className="pl-10"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="w-full md:w-48">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="recent">Most Recent</SelectItem>
                                            <SelectItem value="popular">Most Popular</SelectItem>
                                            <SelectItem value="views">Most Viewed</SelectItem>
                                            <SelectItem value="replies">Most Replies</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pinned Posts */}
                        {pinnedPosts.length > 0 && (
                            <div className="space-y-4" data-aos="fade-up" data-aos-delay="400">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Pin className="w-5 h-5"/>
                                    Pinned Discussions
                                </h2>
                                {pinnedPosts.map(post => (
                                    <Card key={post.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={post.author.avatar || "/images/Avatar.jpg"}/>
                                                    <AvatarFallback>
                                                        {post.author.name.split(" ").map(n => n[0]).join("")}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-start justify-between">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <Pin className="w-4 h-4 text-cyan-500"/>
                                                                <h3 className="font-semibold hover:text-primary cursor-pointer">
                                                                    {post.title}
                                                                </h3>
                                                                {post.isAnswered && (
                                                                    <Badge
                                                                        className="bg-green-500 text-white">Answered</Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-muted-foreground text-sm line-clamp-2">
                                                                {post.content}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4"/>
                                {post.replies}
                            </span>
                                                        <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4"/>
                                                            {post.views}
                            </span>
                                                        <span className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4"/>
                                                            {post.likes}
                            </span>
                                                        <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4"/>
                                                            {post.lastActivity}
                            </span>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline">
                                                                {categories.find(c => c.id === post.category)?.name}
                                                            </Badge>
                                                            {post.tags.map(tag => (
                                                                <Badge key={tag} variant="secondary"
                                                                       className="text-xs">
                                                                    #{tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            by {post.author.name} • {post.createdAt}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                <Separator/>
                            </div>
                        )}

                        {/* Regular Posts */}
                        <div className="space-y-4" data-aos="fade-up" data-aos-delay="500">
                            <h2 className="text-xl font-semibold">Recent Discussions</h2>
                            {regularPosts.length > 0 ? (
                                regularPosts.map(post => (
                                    <Card key={post.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={post.author.avatar || "/images/Avatar.jpg"}/>
                                                    <AvatarFallback>
                                                        {post.author.name.split(" ").map(n => n[0]).join("")}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-start justify-between">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold hover:text-primary cursor-pointer">
                                                                    {post.title}
                                                                </h3>
                                                                {post.isAnswered && (
                                                                    <Badge
                                                                        className="bg-green-500 text-white">Answered</Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-muted-foreground text-sm line-clamp-2">
                                                                {post.content}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4"/>
                                {post.replies}
                            </span>
                                                        <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4"/>
                                                            {post.views}
                            </span>
                                                        <span className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4"/>
                                                            {post.likes}
                            </span>
                                                        <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4"/>
                                                            {post.lastActivity}
                            </span>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline">
                                                                {categories.find(c => c.id === post.category)?.name}
                                                            </Badge>
                                                            {post.tags.map(tag => (
                                                                <Badge key={tag} variant="secondary"
                                                                       className="text-xs">
                                                                    #{tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            by {post.author.name} • {post.createdAt}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground"/>
                                        <h3 className="text-lg font-semibold mb-2">No discussions found</h3>
                                        <p className="text-muted-foreground mb-4">
                                            {searchQuery ? "Try adjusting your search terms" : "Be the first to start a discussion!"}
                                        </p>
                                        <Button onClick={() => setIsNewPostOpen(true)}>
                                            Start Discussion
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer/>
        </div>
    )
}