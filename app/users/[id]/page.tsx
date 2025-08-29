"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Globe,
  Github,
  Twitter,
  Linkedin,
  Mail,
  MessageCircle,
  Star,
  Trophy,
  BookOpen,
  Users,
  Eye,
  ThumbsUp,
  Clock,
  Award,
  TrendingUp,
  Heart,
  Share2
} from "lucide-react"
import { motion } from "framer-motion"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@radix-ui/react-tabs";

interface UserProfile {
  id: string
  name: string
  username: string
  avatar?: string
  coverImage?: string
  role: string
  bio: string
  location?: string
  website?: string
  joinDate: string
  lastActive: string
  isOnline: boolean
  stats: {
    posts: number
    replies: number
    likes: number
    views: number
    reputation: number
    coursesCreated: number
    coursesEnrolled: number
    followers: number
    following: number
  }
  badges: Array<{
    id: string
    name: string
    description: string
    icon: string
    color: string
  }>
  socialLinks: {
    twitter?: string
    github?: string
    linkedin?: string
    website?: string
  }
  recentPosts: Array<{
    id: string
    title: string
    excerpt: string
    createdAt: string
    likes: number
    replies: number
    category: string
  }>
  achievements: Array<{
    id: string
    title: string
    description: string
    unlockedAt: string
    icon: string
  }>
}

export default function UserProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    // Mock user data - In real app, fetch from API
    const mockUser: UserProfile = {
      id: id as string,
      name: "Sarah Johnson",
      username: "@sarahjohnson",
      avatar: "/images/Avatar.jpg",
      coverImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=300&fit=crop",
      role: "Student",
      bio: "Passionate web developer learning React and Node.js. Love building user-friendly applications and helping fellow developers in the community.",
      location: "San Francisco, CA",
      website: "https://sarahjohnson.dev",
      joinDate: "March 2024",
      lastActive: "2 hours ago",
      isOnline: true,
      stats: {
        posts: 15,
        replies: 48,
        likes: 245,
        views: 1250,
        reputation: 485,
        coursesCreated: 0,
        coursesEnrolled: 5,
        followers: 23,
        following: 15
      },
      badges: [
        {
          id: "1",
          name: "First Post",
          description: "Created your first forum post",
          icon: "🎉",
          color: "bg-blue-500"
        },
        {
          id: "2",
          name: "Helper",
          description: "Received 10+ likes on replies",
          icon: "🤝",
          color: "bg-green-500"
        },
        {
          id: "3",
          name: "Active Member",
          description: "Posted 10+ discussions",
          icon: "⚡",
          color: "bg-purple-500"
        }
      ],
      socialLinks: {
        twitter: "https://twitter.com/sarahjohnson",
        github: "https://github.com/sarahjohnson",
        linkedin: "https://linkedin.com/in/sarahjohnson",
        website: "https://sarahjohnson.dev"
      },
      recentPosts: [
        {
          id: "1",
          title: "How to deploy React app to production?",
          excerpt: "I'm having trouble deploying my React application to production. Can someone help with best practices?",
          createdAt: "2 hours ago",
          likes: 18,
          replies: 12,
          category: "Technical"
        },
        {
          id: "2",
          title: "Best VS Code extensions for React development?",
          excerpt: "Looking for recommendations on VS Code extensions that can improve my React development workflow.",
          createdAt: "1 week ago",
          likes: 25,
          replies: 8,
          category: "Tools"
        },
        {
          id: "3",
          title: "Understanding React Hooks - useEffect cleanup",
          excerpt: "Can someone explain when and how to properly cleanup effects in React hooks?",
          createdAt: "2 weeks ago",
          likes: 12,
          replies: 6,
          category: "Learning"
        }
      ],
      achievements: [
        {
          id: "1",
          title: "First Steps",
          description: "Completed your profile and made your first post",
          unlockedAt: "March 2024",
          icon: "🌟"
        },
        {
          id: "2",
          title: "Community Helper",
          description: "Helped 5+ community members with their questions",
          unlockedAt: "April 2024",
          icon: "🤝"
        },
        {
          id: "3",
          title: "Learning Enthusiast",
          description: "Enrolled in 5+ courses",
          unlockedAt: "May 2024",
          icon: "📚"
        }
      ]
    }

    setTimeout(() => {
      setUser(mockUser)
      setIsLoading(false)
    }, 1000)
  }, [id])

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    setUser(prev => prev ? {
      ...prev,
      stats: {
        ...prev.stats,
        followers: isFollowing ? prev.stats.followers - 1 : prev.stats.followers + 1
      }
    } : null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold mb-4">User not found</h1>
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
            Back
          </Button>
        </motion.div>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden mb-8">
            {/* Cover Image */}
            <div 
              className="h-48 bg-gradient-to-r from-cyan-500 via-emerald-500 to-purple-500 relative"
              style={{
                backgroundImage: user.coverImage ? `url(${user.coverImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-black/20" />
            </div>
            
            <CardContent className="relative">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16 pb-6">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-2xl">
                      {user.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  {user.isOnline && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-background rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold">{user.name}</h1>
                      <p className="text-muted-foreground">{user.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10">
                          {user.role}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Last active {user.lastActive}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleFollow}
                        className={isFollowing 
                          ? "bg-gray-500 hover:bg-gray-600" 
                          : "bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                        }
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </Button>
                      <Button variant="outline">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" size="icon">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {user.bio && (
                    <p className="text-sm leading-relaxed max-w-2xl">{user.bio}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {user.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {user.location}
                      </span>
                    )}
                    {user.website && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        <a href={user.website} target="_blank" rel="noopener noreferrer" 
                           className="hover:text-primary transition-colors">
                          {user.website.replace(/^https?:\/\//, '')}
                        </a>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {user.joinDate}
                    </span>
                  </div>

                  {/* Social Links */}
                  <div className="flex items-center gap-3 pt-2">
                    {user.socialLinks.github && (
                      <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="hover:text-gray-900">
                          <Github className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {user.socialLinks.twitter && (
                      <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="hover:text-blue-500">
                          <Twitter className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {user.socialLinks.linkedin && (
                      <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="hover:text-blue-700">
                          <Linkedin className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    <Button variant="ghost" size="sm" className="hover:text-emerald-500">
                      <Mail className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Stats Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-accent/50">
                      <div className="text-2xl font-bold text-cyan-600">{user.stats.posts}</div>
                      <div className="text-xs text-muted-foreground">Posts</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-accent/50">
                      <div className="text-2xl font-bold text-emerald-600">{user.stats.replies}</div>
                      <div className="text-xs text-muted-foreground">Replies</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-accent/50">
                      <div className="text-2xl font-bold text-purple-600">{user.stats.likes}</div>
                      <div className="text-xs text-muted-foreground">Likes</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-accent/50">
                      <div className="text-2xl font-bold text-orange-600">{user.stats.reputation}</div>
                      <div className="text-xs text-muted-foreground">Reputation</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Profile Views</span>
                      <span className="text-sm font-medium">{user.stats.views}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Courses Created</span>
                      <span className="text-sm font-medium">{user.stats.coursesCreated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Courses Enrolled</span>
                      <span className="text-sm font-medium">{user.stats.coursesEnrolled}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Followers/Following */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-around">
                    <div className="text-center cursor-pointer hover:bg-accent/50 p-2 rounded-lg transition-colors">
                      <div className="text-xl font-bold">{user.stats.followers}</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                    <Separator orientation="vertical" className="h-12" />
                    <div className="text-center cursor-pointer hover:bg-accent/50 p-2 rounded-lg transition-colors">
                      <div className="text-xl font-bold">{user.stats.following}</div>
                      <div className="text-xs text-muted-foreground">Following</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Badges
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user.badges.map((badge) => (
                    <div key={badge.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className={`w-8 h-8 rounded-full ${badge.color} flex items-center justify-center text-white text-sm`}>
                        {badge.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{badge.name}</div>
                        <div className="text-xs text-muted-foreground">{badge.description}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Tabs defaultValue="posts" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="posts">Recent Posts</TabsTrigger>
                  <TabsTrigger value="achievements">Achievements</TabsTrigger>
                  <TabsTrigger value="courses">Courses</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                
                {/* Recent Posts Tab */}
                <TabsContent value="posts" className="space-y-4">
                  {user.recentPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-md transition-all hover:scale-[1.02]">
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1">
                                <h3 className="font-semibold text-lg hover:text-primary cursor-pointer transition-colors">
                                  {post.title}
                                </h3>
                                <p className="text-muted-foreground text-sm line-clamp-2">
                                  {post.excerpt}
                                </p>
                              </div>
                              <Badge variant="outline">{post.category}</Badge>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <ThumbsUp className="w-4 h-4" />
                                  {post.likes}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="w-4 h-4" />
                                  {post.replies}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {post.createdAt}
                                </span>
                              </div>
                              
                              <Button variant="ghost" size="sm">
                                View Discussion →
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </TabsContent>
                
                {/* Achievements Tab */}
                <TabsContent value="achievements" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.achievements.map((achievement, index) => (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-md transition-all hover:scale-105">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="text-3xl">{achievement.icon}</div>
                              <div className="space-y-1">
                                <h4 className="font-semibold">{achievement.title}</h4>
                                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                                <div className="text-xs text-muted-foreground">
                                  Unlocked {achievement.unlockedAt}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
                
                {/* Courses Tab */}
                <TabsContent value="courses" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-blue-500" />
                          Enrolled Courses
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8">
                          <div className="text-3xl font-bold text-blue-500 mb-2">{user.stats.coursesEnrolled}</div>
                          <p className="text-muted-foreground">Active Enrollments</p>
                          <Button className="mt-4" variant="outline">View All Courses</Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-purple-500" />
                          Created Courses
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8">
                          <div className="text-3xl font-bold text-purple-500 mb-2">{user.stats.coursesCreated}</div>
                          <p className="text-muted-foreground">Courses Published</p>
                          <Button className="mt-4" variant="outline">Create Course</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Activity Tab */}
                <TabsContent value="activity" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { action: "Commented on", target: "How to deploy React app to production?", time: "2 hours ago", icon: MessageCircle },
                        { action: "Liked", target: "Best practices for React performance", time: "5 hours ago", icon: Heart },
                        { action: "Started following", target: "Mike Chen", time: "1 day ago", icon: Users },
                        { action: "Posted", target: "VS Code extensions for React development", time: "1 week ago", icon: Star }
                      ].map((activity, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <activity.icon className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1">
                            <span className="text-sm">
                              <span className="text-muted-foreground">{activity.action}</span>{" "}
                              <span className="font-medium">{activity.target}</span>
                            </span>
                            <div className="text-xs text-muted-foreground">{activity.time}</div>
                          </div>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
