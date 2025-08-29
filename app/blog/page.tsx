"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Calendar,
  Clock,
  Search,
  Filter,
  BookOpen,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Users,
  Star,
  ArrowRight,
  Tag
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
  }
  category: string
  tags: string[]
  publishedAt: string
  readTime: number
  views: number
  likes: number
  comments: number
  featured: boolean
  coverImage: string
}

interface BlogCategory {
  id: string
  name: string
  description: string
  postCount: number
  color: string
}

export default function BlogPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("recent")

  const categories: BlogCategory[] = [
    {
      id: "web-development",
      name: "Web Development",
      description: "Frontend and backend development tutorials",
      postCount: 45,
      color: "bg-blue-500"
    },
    {
      id: "mobile-development",
      name: "Mobile Development",
      description: "iOS, Android, and cross-platform development",
      postCount: 23,
      color: "bg-green-500"
    },
    {
      id: "design",
      name: "Design",
      description: "UI/UX design principles and tutorials",
      postCount: 31,
      color: "bg-purple-500"
    },
    {
      id: "career",
      name: "Career",
      description: "Career advice and industry insights",
      postCount: 18,
      color: "bg-orange-500"
    },
    {
      id: "tutorials",
      name: "Tutorials",
      description: "Step-by-step coding tutorials",
      postCount: 67,
      color: "bg-emerald-500"
    },
    {
      id: "industry-news",
      name: "Industry News",
      description: "Latest trends and tech news",
      postCount: 29,
      color: "bg-cyan-500"
    }
  ]

  const blogPosts: BlogPost[] = [
    {
      id: "1",
      title: "Building Modern React Applications with TypeScript",
      excerpt: "Learn how to leverage TypeScript's powerful type system to build more reliable and maintainable React applications.",
      content: "Full article content here...",
      author: {
        id: "1",
        name: "Emma Rodriguez",
        avatar: "/images/Avatar.jpg",
        role: "Expert"
      },
      category: "web-development",
      tags: ["React", "TypeScript", "JavaScript", "Frontend"],
      publishedAt: "2024-01-15",
      readTime: 8,
      views: 1240,
      likes: 89,
      comments: 23,
      featured: true,
      coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop"
    },
    {
      id: "2",
      title: "The Complete Guide to CSS Grid Layout",
      excerpt: "Master CSS Grid with practical examples and real-world use cases. From basics to advanced techniques.",
      content: "Full article content here...",
      author: {
        id: "2",
        name: "Mike Chen",
        avatar: "/images/Avatar.jpg",
        role: "Mentor"
      },
      category: "web-development",
      tags: ["CSS", "Grid", "Layout", "Design"],
      publishedAt: "2024-01-12",
      readTime: 12,
      views: 956,
      likes: 67,
      comments: 18,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop"
    },
    {
      id: "3",
      title: "Mobile-First Design Principles",
      excerpt: "Understanding how to design for mobile devices first and scale up to larger screens effectively.",
      content: "Full article content here...",
      author: {
        id: "3",
        name: "Lisa Wang",
        avatar: "/images/Avatar.jpg",
        role: "Expert"
      },
      category: "design",
      tags: ["Mobile", "Design", "UX", "Responsive"],
      publishedAt: "2024-01-10",
      readTime: 6,
      views: 723,
      likes: 45,
      comments: 12,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=400&fit=crop"
    },
    {
      id: "4",
      title: "Career Transition: From Bootcamp to Tech Job",
      excerpt: "Real stories and practical advice for breaking into tech after completing a coding bootcamp.",
      content: "Full article content here...",
      author: {
        id: "4",
        name: "David Park",
        avatar: "/images/Avatar.jpg",
        role: "Student"
      },
      category: "career",
      tags: ["Career", "Bootcamp", "Job Search", "Advice"],
      publishedAt: "2024-01-08",
      readTime: 10,
      views: 1456,
      likes: 124,
      comments: 45,
      featured: true,
      coverImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop"
    },
    {
      id: "5",
      title: "Introduction to Machine Learning with Python",
      excerpt: "Get started with machine learning using Python. Cover basic concepts and build your first ML model.",
      content: "Full article content here...",
      author: {
        id: "5",
        name: "Alex Thompson",
        avatar: "/images/Avatar.jpg",
        role: "Student"
      },
      category: "tutorials",
      tags: ["Python", "Machine Learning", "AI", "Data Science"],
      publishedAt: "2024-01-05",
      readTime: 15,
      views: 892,
      likes: 78,
      comments: 31,
      featured: false,
      coverImage: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop"
    }
  ]

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return (b.likes + b.comments) - (a.likes + a.comments)
      case "views":
        return b.views - a.views
      case "oldest":
        return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      default: // recent
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    }
  })

  const featuredPosts = sortedPosts.filter(post => post.featured)
  const regularPosts = sortedPosts.filter(post => !post.featured)

  const handlePostClick = (postId: string) => {
    router.push(`/blog/${postId}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
            Development Blog
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover insights, tutorials, and industry trends from our community of developers and experts
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-cyan-600">{blogPosts.length}</div>
                  <div className="text-sm text-muted-foreground">Total Articles</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {blogPosts.reduce((sum, post) => sum + post.views, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Views</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(blogPosts.map(post => post.author.id)).size}
                  </div>
                  <div className="text-sm text-muted-foreground">Contributors</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(blogPosts.reduce((sum, post) => sum + post.readTime, 0) / blogPosts.length)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg. Read Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search & Filters */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Search & Filter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search articles..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="views">Most Viewed</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </motion.div>

            {/* Categories */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
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
                        <div className={`w-3 h-3 rounded-full ${category.color}`} />
                        {category.name}
                      </div>
                      <Badge variant="secondary">{category.postCount}</Badge>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Popular Tags */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Popular Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {["React", "JavaScript", "TypeScript", "CSS", "Python", "AI", "Career", "Design"].map(tag => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => setSearchQuery(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500" />
                  Featured Articles
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index }}
                      className="group"
                    >
                      <Card 
                        className="h-full hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer overflow-hidden"
                        onClick={() => handlePostClick(post.id)}
                      >
                        <div className="relative">
                          <img 
                            src={post.coverImage} 
                            alt={post.title}
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-yellow-500 text-black font-semibold">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>
                        
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                {post.title}
                              </h3>
                              <p className="text-muted-foreground text-sm line-clamp-3">
                                {post.excerpt}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={post.author.avatar} />
                                <AvatarFallback>
                                  {post.author.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-medium">{post.author.name}</div>
                                <div className="text-xs text-muted-foreground">{formatDate(post.publishedAt)}</div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {post.readTime} min read
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {post.views}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  {post.likes}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="w-3 h-3" />
                                  {post.comments}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Regular Posts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Latest Articles</h2>
                <div className="text-sm text-muted-foreground">
                  Showing {sortedPosts.length} articles
                </div>
              </div>
              
              <div className="space-y-6">
                {regularPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="group"
                  >
                    <Card 
                      className="hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer overflow-hidden"
                      onClick={() => handlePostClick(post.id)}
                    >
                      <CardContent className="p-0">
                        <div className="md:flex">
                          <div className="md:w-1/3">
                            <img 
                              src={post.coverImage} 
                              alt={post.title}
                              className="w-full h-48 md:h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          
                          <div className="md:w-2/3 p-6">
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">
                                    {categories.find(c => c.id === post.category)?.name}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(post.publishedAt)}
                                  </span>
                                </div>
                                
                                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                  {post.title}
                                </h3>
                                
                                <p className="text-muted-foreground line-clamp-2">
                                  {post.excerpt}
                                </p>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={post.author.avatar} />
                                    <AvatarFallback>
                                      {post.author.name.split(" ").map(n => n[0]).join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="text-sm font-medium">{post.author.name}</div>
                                    <Badge variant="outline" className="text-xs">
                                      {post.author.role}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {post.readTime} min
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {post.views}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Heart className="w-3 h-3" />
                                    {post.likes}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {post.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* No Results */}
            {sortedPosts.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button 
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("all")
                  }}
                >
                  Clear Filters
                </Button>
              </motion.div>
            )}

            {/* Load More */}
            {sortedPosts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <Button 
                  variant="outline" 
                  size="lg"
                  className="bg-gradient-to-r from-cyan-50 to-emerald-50 hover:from-cyan-100 hover:to-emerald-100"
                >
                  Load More Articles
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Newsletter Signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16"
        >
          <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Get the latest articles and tutorials delivered directly to your inbox. 
                Join thousands of developers staying ahead of the curve.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input 
                  placeholder="Enter your email..." 
                  className="flex-1"
                />
                <Button className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600">
                  Subscribe
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
