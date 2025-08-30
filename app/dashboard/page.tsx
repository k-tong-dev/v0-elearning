"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"
import {
  TrendingUp,
  Users,
  BookOpen,
  Award,
  DollarSign,
  Eye,
  Clock,
  Target,
  Plus,
  FileText,
  Video,
  Link,
  Upload,
  CheckCircle,
  AlertCircle,
  Star,
  Calendar,
  Download,
  Share2,
  Settings,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Crown,
  MessageCircle,
  ThumbsUp
} from "lucide-react"
import { motion } from "framer-motion"

interface DashboardStats {
  totalCourses: number
  activeLearners: number
  totalRevenue: number
  completionRate: number
  totalViews: number
  avgRating: number
  coursesCreated: number
  enrollmentsReceived: number
}

interface Course {
  id: string
  title: string
  description: string
  type: "PDF" | "Video" | "Link" | "Interactive"
  status: "draft" | "published" | "archived"
  price: number
  enrollments: number
  rating: number
  createdAt: string
  lastUpdated: string
  thumbnailUrl: string
  progress?: number
  totalLessons?: number
  completedLessons?: number
}

interface Enrollment {
  id: string
  courseId: string
  courseTitle: string
  studentName: string
  studentAvatar: string
  enrolledAt: string
  progress: number
  lastActive: string
  completed: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState("overview")
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    type: "",
    price: "",
    thumbnail: null as File | null
  })

  // Mock data for dashboard
  const stats: DashboardStats = {
    totalCourses: 12,
    activeLearners: 1247,
    totalRevenue: 15420,
    completionRate: 78,
    totalViews: 25680,
    avgRating: 4.7,
    coursesCreated: 5,
    enrollmentsReceived: 145
  }

  // Mock chart data
  const enrollmentData = [
    { month: 'Jan', enrollments: 45, revenue: 2250 },
    { month: 'Feb', enrollments: 52, revenue: 2600 },
    { month: 'Mar', enrollments: 38, revenue: 1900 },
    { month: 'Apr', enrollments: 67, revenue: 3350 },
    { month: 'May', enrollments: 73, revenue: 3650 },
    { month: 'Jun', enrollments: 89, revenue: 4450 }
  ]

  const courseTypeData = [
    { name: 'Video', value: 45, color: '#3B82F6' },
    { name: 'PDF', value: 25, color: '#10B981' },
    { name: 'Interactive', value: 20, color: '#8B5CF6' },
    { name: 'Link', value: 10, color: '#F59E0B' }
  ]

  const myCourses: Course[] = [
    {
      id: "1",
      title: "React Fundamentals for Beginners",
      description: "Learn the basics of React including components, props, and state management.",
      type: "Video",
      status: "published",
      price: 49.99,
      enrollments: 234,
      rating: 4.8,
      createdAt: "2024-01-15",
      lastUpdated: "2024-01-20",
      thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=200&fit=crop"
    },
    {
      id: "2",
      title: "JavaScript ES6+ Complete Guide",
      description: "Master modern JavaScript features and best practices.",
      type: "PDF",
      status: "published",
      price: 29.99,
      enrollments: 156,
      rating: 4.6,
      createdAt: "2024-01-10",
      lastUpdated: "2024-01-18",
      thumbnailUrl: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=300&h=200&fit=crop"
    },
    {
      id: "3",
      title: "CSS Grid and Flexbox Mastery",
      description: "Create responsive layouts with CSS Grid and Flexbox.",
      type: "Interactive",
      status: "draft",
      price: 39.99,
      enrollments: 0,
      rating: 0,
      createdAt: "2024-01-25",
      lastUpdated: "2024-01-25",
      thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop"
    }
  ]

  const myEnrollments: Course[] = [
    {
      id: "e1",
      title: "Advanced React Patterns",
      description: "Learn advanced React patterns and optimization techniques.",
      type: "Video",
      status: "published",
      price: 79.99,
      enrollments: 0,
      rating: 4.9,
      createdAt: "2024-01-01",
      lastUpdated: "2024-01-15",
      thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=200&fit=crop",
      progress: 75,
      totalLessons: 24,
      completedLessons: 18
    },
    {
      id: "e2",
      title: "Node.js Backend Development",
      description: "Build scalable backend applications with Node.js and Express.",
      type: "Video",
      status: "published",
      price: 89.99,
      enrollments: 0,
      rating: 4.7,
      createdAt: "2024-01-05",
      lastUpdated: "2024-01-20",
      thumbnailUrl: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=300&h=200&fit=crop",
      progress: 45,
      totalLessons: 32,
      completedLessons: 14
    }
  ]

  const recentEnrollments: Enrollment[] = [
    {
      id: "1",
      courseId: "1",
      courseTitle: "React Fundamentals for Beginners",
      studentName: "John Smith",
      studentAvatar: "/images/Avatar.jpg",
      enrolledAt: "2024-01-28",
      progress: 25,
      lastActive: "2 hours ago",
      completed: false
    },
    {
      id: "2",
      courseId: "2",
      courseTitle: "JavaScript ES6+ Complete Guide",
      studentName: "Maria Garcia",
      studentAvatar: "/images/Avatar.jpg",
      enrolledAt: "2024-01-27",
      progress: 100,
      lastActive: "1 day ago",
      completed: true
    },
    {
      id: "3",
      courseId: "1",
      courseTitle: "React Fundamentals for Beginners",
      studentName: "Alex Johnson",
      studentAvatar: "/images/Avatar.jpg",
      enrolledAt: "2024-01-26",
      progress: 60,
      lastActive: "5 hours ago",
      completed: false
    }
  ]

  const handleCreateCourse = () => {
    console.log("Creating course:", newCourse)
    setShowCreateCourse(false)
    setNewCourse({
      title: "",
      description: "",
      type: "",
      price: "",
      thumbnail: null
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-500"
      case "draft": return "bg-yellow-500"
      case "archived": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Video": return Video
      case "PDF": return FileText
      case "Link": return Link
      case "Interactive": return Target
      default: return BookOpen
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-muted-foreground">
                Welcome back! Here's an overview of your learning journey and courses.
              </p>
            </div>
            
            <Button 
              onClick={() => setShowCreateCourse(true)}
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </div>
        </motion.div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="my-courses">My Courses</TabsTrigger>
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <Card className="hover:shadow-lg transition-all hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.coursesCreated}</div>
                      <div className="text-sm text-muted-foreground">Courses Created</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.enrollmentsReceived}</div>
                      <div className="text-sm text-muted-foreground">Total Enrollments</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Earnings</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.avgRating}</div>
                      <div className="text-sm text-muted-foreground">Avg. Rating</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enrollment Trends */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      Enrollment Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={enrollmentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="enrollments" stroke="#3B82F6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Course Types Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-purple-500" />
                      Course Types
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={courseTypeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {courseTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: "New enrollment", details: "John Smith enrolled in React Fundamentals", time: "2 hours ago", icon: Users },
                      { action: "Course updated", details: "JavaScript ES6+ Guide - Added new chapter", time: "5 hours ago", icon: BookOpen },
                      { action: "Payment received", details: "$49.99 from course enrollment", time: "1 day ago", icon: DollarSign },
                      { action: "Review received", details: "5-star review on React Fundamentals", time: "2 days ago", icon: Star }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                          <activity.icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{activity.action}</div>
                          <div className="text-sm text-muted-foreground">{activity.details}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{activity.time}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* My Courses Tab */}
          <TabsContent value="my-courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">My Courses</h2>
              <Button 
                onClick={() => setShowCreateCourse(true)}
                className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Course
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCourses.map((course, index) => {
                const TypeIcon = getTypeIcon(course.type)
                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="hover:shadow-lg transition-all hover:scale-105">
                      <div className="relative">
                        <img 
                          src={course.thumbnailUrl} 
                          alt={course.title}
                          className="w-full h-40 object-cover rounded-t-lg"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge className={getStatusColor(course.status) + " text-white"}>
                            {course.status}
                          </Badge>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className="bg-background/90">
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {course.type}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-6">
                        <h3 className="font-semibold mb-2 line-clamp-1">{course.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {course.description}
                        </p>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span>Price: <span className="font-bold">${course.price}</span></span>
                            <span>Enrollments: {course.enrollments}</span>
                          </div>
                          
                          {course.rating > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(course.rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                                ))}
                              </div>
                              <span className="text-sm">{course.rating}</span>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => router.push(`/courses/${course.id}/edit`)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => router.push(`/courses/${course.id}`)}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </TabsContent>

          {/* Enrollments Tab */}
          <TabsContent value="enrollments" className="space-y-6">
            <h2 className="text-2xl font-bold">Student Enrollments</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Enrollments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Recent Enrollments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentEnrollments.map((enrollment, index) => (
                    <motion.div
                      key={enrollment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={enrollment.studentAvatar} />
                        <AvatarFallback>
                          {enrollment.studentName.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="font-medium">{enrollment.studentName}</div>
                        <div className="text-sm text-muted-foreground">
                          {enrollment.courseTitle}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${enrollment.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>
                          <span className="text-xs">{enrollment.progress}%</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {enrollment.lastActive}
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* My Learning Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    My Learning Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {myEnrollments.map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium line-clamp-1">{course.title}</h4>
                        <span className="text-sm text-muted-foreground">
                          {course.completedLessons}/{course.totalLessons}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{course.progress}% complete</span>
                        <Button variant="ghost" size="sm" className="h-6 p-1">
                          Continue →
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
            
            {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-500" />
                    Revenue Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={enrollmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-500 mb-2">{stats.totalViews.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Course Views</div>
                  <div className="text-xs text-green-600 mt-1">+12% from last month</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-500 mb-2">{stats.completionRate}%</div>
                  <div className="text-sm text-muted-foreground">Completion Rate</div>
                  <div className="text-xs text-green-600 mt-1">+5% from last month</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-orange-500 mb-2">{stats.activeLearners.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Active Learners</div>
                  <div className="text-xs text-green-600 mt-1">+8% from last month</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>


          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">Dashboard Settings</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "New enrollments", description: "Get notified when someone enrolls in your courses" },
                    { label: "Course reviews", description: "Get notified when you receive new reviews" },
                    { label: "Payment notifications", description: "Get notified about payments and earnings" },
                    { label: "Weekly analytics", description: "Receive weekly analytics reports" }
                  ].map((setting, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{setting.label}</div>
                        <div className="text-sm text-muted-foreground">{setting.description}</div>
                      </div>
                      <Switch />
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Course Creation Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-accent/50 rounded-lg">
                    <h4 className="font-medium mb-2">Current Plan: Basic</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Courses Created:</span>
                        <span>{stats.coursesCreated}/50</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${(stats.coursesCreated / 50) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Course Dialog */}
        <Dialog open={showCreateCourse} onOpenChange={setShowCreateCourse}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium">Course Title</label>
                <Input 
                  value={newCourse.title}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter course title..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  value={newCourse.description}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what students will learn..."
                  className="min-h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Course Type</label>
                  <Select value={newCourse.type} onValueChange={(value) => setNewCourse(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Video">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Video Course
                        </div>
                      </SelectItem>
                      <SelectItem value="PDF">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          PDF Guide
                        </div>
                      </SelectItem>
                      <SelectItem value="Link">
                        <div className="flex items-center gap-2">
                          <Link className="w-4 h-4" />
                          External Link
                        </div>
                      </SelectItem>
                      <SelectItem value="Interactive">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Interactive
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Price ($)</label>
                  <Input 
                    type="number"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Course Thumbnail</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-800 mb-2">💡 Course Creation Tips</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use clear, descriptive titles</li>
                  <li>• Include learning outcomes in description</li>
                  <li>• Choose appropriate pricing for your target audience</li>
                  <li>• High-quality thumbnails increase enrollments</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateCourse(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCourse}
                  disabled={!newCourse.title || !newCourse.description || !newCourse.type}
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                >
                  Create Course
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Footer />
    </div>
  )
}
