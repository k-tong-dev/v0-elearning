"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "recharts"
import {
    TrendingUp,
    BarChart3,
    BookOpen, // Added for lessons completed
    DollarSign,
    Users,
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

interface LessonsCompletedDataPoint {
    month: string;
    lessons: number;
}

interface DashboardAnalyticsProps {
    stats: DashboardStats
    enrollmentData: EnrollmentDataPoint[]
    lessonsCompletedData: LessonsCompletedDataPoint[]; // New prop for lessons completed
}

export function DashboardAnalytics({ stats, enrollmentData, lessonsCompletedData }: DashboardAnalyticsProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

            {/* Revenue Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
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
                                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                <Bar dataKey="revenue" fill="#10B981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Lessons Completed Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-500" />
                            Lessons Completed Over Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={lessonsCompletedData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="lessons" stroke="#3B82F6" strokeWidth={2} name="Lessons Completed" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass-enhanced hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-blue-500 mb-2">{stats.totalViews.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Total Course Views</div>
                        <div className="text-xs text-green-600 mt-1">+12% from last month</div>
                    </CardContent>
                </Card>

                <Card className="glass-enhanced hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-purple-500 mb-2">{stats.completionRate}%</div>
                        <div className="text-sm text-muted-foreground">Completion Rate</div>
                        <div className="text-xs text-green-600 mt-1">+5% from last month</div>
                    </CardContent>
                </Card>

                <Card className="glass-enhanced hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-orange-500 mb-2">{stats.activeLearners.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Active Learners</div>
                        <div className="text-xs text-green-600 mt-1">+8% from last month</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}