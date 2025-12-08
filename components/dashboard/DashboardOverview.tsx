"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

interface EnrollmentDataPoint {
    month: string
    enrollments: number
    revenue: number
}

interface CourseTypeDataPoint {
    name: string
    value: number
    color: string
}

interface RecentActivityItem {
    action: string
    details: string
    time: string
    icon: React.ElementType
}

interface DashboardOverviewProps {
    stats: DashboardStats
    enrollmentData: EnrollmentDataPoint[]
    courseTypeData: CourseTypeDataPoint[]
    recentActivity: RecentActivityItem[]
}

export function DashboardOverview({ stats, enrollmentData, courseTypeData, recentActivity }: DashboardOverviewProps) {
    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                <Card className="liquid-glass-card">
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

                <Card className="liquid-glass-card">
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

                <Card className="liquid-glass-card">
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

                <Card className="liquid-glass-card">
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
                    <Card className="liquid-glass-card">
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
                    <Card className="liquid-glass-card">
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
                <Card className="liquid-glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-green-500" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.map((activity, index) => (
                                <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-400/20 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center">
                                        <activity.icon className="w-5 h-5 text-gray-300" />
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
        </div>
    )
}