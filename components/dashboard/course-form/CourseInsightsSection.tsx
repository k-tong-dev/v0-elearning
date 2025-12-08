"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Users, DollarSign, Star, Activity, CheckCircle, Target as TargetIcon,
    ArrowUp, Search, Loader2
} from "lucide-react"

interface Enrollment {
    id: string
    studentName: string
    studentAvatar?: string
    enrolledAt: string
    progress: number
    status: string
}

interface Rating {
    id: string
    userName: string
    userAvatar?: string
    rating: number
    comment?: string
    createdAt: string
}

interface Analytics {
    totalEnrollments: number
    activeEnrollments: number
    completedEnrollments: number
    totalRevenue: number
    averageRating: number
    totalRatings: number
    completionRate: number
    averageProgress: number
}

interface CourseInsightsSectionProps {
    isLoading: boolean
    enrollments: Enrollment[]
    ratings: Rating[]
    analytics: Analytics | null
    searchQuery: string
    onSearchChange: (query: string) => void
    statusFilter: string
    onStatusFilterChange: (filter: string) => void
    activeTab: string
    onTabChange: (tab: string) => void
}

export function CourseInsightsSection({
    isLoading,
    enrollments,
    ratings,
    analytics,
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    activeTab,
    onTabChange,
}: CourseInsightsSectionProps) {
    const filteredEnrollments = enrollments.filter(e => {
        const matchesSearch = e.studentName.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "all" || e.status === statusFilter
        return matchesSearch && matchesStatus
    })

    return (
        <div className="rounded-2xl bg-background overflow-hidden">
            {isLoading ? (
                <div className="flex items-center justify-center p-12 min-h-screen flex justify-center items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading insights...</span>
                </div>
            ) : (
                <div className="p-6 space-y-6">
                    {/* Key Metrics */}
                    {analytics && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="border-2 hover:border-blue-500/50 transition-all duration-300">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Total Enrollments</p>
                                            <p className="text-2xl font-bold">{analytics.totalEnrollments}</p>
                                            <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                                                <ArrowUp className="w-3 h-3" />
                                                <span>+12.5%</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-blue-500/10 rounded-full">
                                            <Users className="w-5 h-5 text-blue-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-2 hover:border-green-500/50 transition-all duration-300">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                                            <p className="text-2xl font-bold">${analytics.totalRevenue.toLocaleString()}</p>
                                            <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                                                <ArrowUp className="w-3 h-3" />
                                                <span>+8.3%</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-green-500/10 rounded-full">
                                            <DollarSign className="w-5 h-5 text-green-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-2 hover:border-yellow-500/50 transition-all duration-300">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Average Rating</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}</p>
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{analytics.totalRatings} ratings</p>
                                        </div>
                                        <div className="p-3 bg-yellow-500/10 rounded-full">
                                            <Star className="w-5 h-5 text-yellow-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-2 hover:border-purple-500/50 transition-all duration-300">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
                                            <p className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</p>
                                            <p className="text-xs text-muted-foreground mt-1">{analytics.completedEnrollments} completed</p>
                                        </div>
                                        <div className="p-3 bg-purple-500/10 rounded-full">
                                            <TargetIcon className="w-5 h-5 text-purple-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Tabs for Insights */}
                    <Tabs value={activeTab} onValueChange={onTabChange}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
                            <TabsTrigger value="ratings">Ratings & Reviews</TabsTrigger>
                            <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-4 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Active Students</p>
                                                <p className="text-xl font-bold">{analytics?.activeEnrollments || 0}</p>
                                            </div>
                                            <Activity className="w-5 h-5 text-blue-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                                                <p className="text-xl font-bold">{analytics?.completedEnrollments || 0}</p>
                                            </div>
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Avg. Progress</p>
                                                <p className="text-xl font-bold">{analytics?.averageProgress.toFixed(1) || 0}%</p>
                                            </div>
                                            <Progress value={analytics?.averageProgress || 0} className="w-16" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Enrollments Tab */}
                        <TabsContent value="enrollments" className="space-y-4 mt-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search students..."
                                        value={searchQuery}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Student Enrollments ({filteredEnrollments.length})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {filteredEnrollments.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p>No enrollments found</p>
                                            </div>
                                        ) : (
                                            filteredEnrollments.map((enrollment) => (
                                                <div
                                                    key={enrollment.id}
                                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <Avatar className="w-10 h-10">
                                                            <AvatarImage src={enrollment.studentAvatar} />
                                                            <AvatarFallback>
                                                                {enrollment.studentName.split(" ").map(n => n[0]).join("")}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <p className="font-semibold">{enrollment.studentName}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <p className="text-sm font-medium">{enrollment.progress}%</p>
                                                                <Progress value={enrollment.progress} className="w-24 mt-1" />
                                                            </div>
                                                            <Badge
                                                                variant={
                                                                    enrollment.status === "completed" ? "default" :
                                                                    enrollment.status === "active" ? "secondary" : "destructive"
                                                                }
                                                            >
                                                                {enrollment.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Ratings Tab */}
                        <TabsContent value="ratings" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Ratings & Reviews ({ratings.length})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {ratings.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p>No ratings yet</p>
                                            </div>
                                        ) : (
                                            ratings.map((rating) => (
                                                <div
                                                    key={rating.id}
                                                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <Avatar>
                                                            <AvatarImage src={rating.userAvatar} />
                                                            <AvatarFallback>
                                                                {rating.userName.split(" ").map(n => n[0]).join("")}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div>
                                                                    <p className="font-semibold">{rating.userName}</p>
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <Star
                                                                                key={i}
                                                                                className={`w-4 h-4 ${
                                                                                    i < rating.rating
                                                                                        ? "fill-yellow-400 text-yellow-400"
                                                                                        : "text-gray-300"
                                                                                }`}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {new Date(rating.createdAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            {rating.comment && (
                                                                <p className="text-sm text-muted-foreground mt-2">{rating.comment}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Analytics Tab */}
                        <TabsContent value="analytics" className="space-y-4 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Enrollment Statistics</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Total Enrollments</span>
                                            <span className="font-bold">{analytics?.totalEnrollments || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Active</span>
                                            <span className="font-bold text-blue-500">{analytics?.activeEnrollments || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Completed</span>
                                            <span className="font-bold text-green-500">{analytics?.completedEnrollments || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Completion Rate</span>
                                            <span className="font-bold">{analytics?.completionRate.toFixed(1) || 0}%</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Engagement Metrics</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Average Progress</span>
                                            <span className="font-bold">{analytics?.averageProgress.toFixed(1) || 0}%</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Average Rating</span>
                                            <div className="flex items-center gap-1">
                                                <span className="font-bold">{analytics?.averageRating.toFixed(1) || 0}</span>
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Total Ratings</span>
                                            <span className="font-bold">{analytics?.totalRatings || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Total Revenue</span>
                                            <span className="font-bold text-green-500">${analytics?.totalRevenue.toLocaleString() || 0}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    )
}

