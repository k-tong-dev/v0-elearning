"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Users, Target, BookOpen, Search, Filter, SortAsc, Clock, CheckCircle, Play, Video, FileText, Link as LinkIcon } from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Interfaces (copied from DashboardEnrollments and DashboardMyLearning)
interface CourseEnrollment {
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

interface StudentEnrollment {
    id: string
    courseId: string
    courseTitle: string
    studentId: string // Added studentId for linking
    studentName: string
    studentAvatar: string
    enrolledAt: string
    progress: number
    lastActive: string
    completed: boolean
}

interface DashboardCombinedEnrollmentsProps {
    recentEnrollments: StudentEnrollment[]
    myLearningProgress: CourseEnrollment[]
}

export function DashboardCombinedEnrollments({ recentEnrollments, myLearningProgress }: DashboardCombinedEnrollmentsProps) {
    const router = useRouter()
    const [viewMode, setViewMode] = useState<'my-students' | 'my-courses'>('my-students') // Default to showing students
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState("all") // 'all', 'in-progress', 'completed', 'not-started' for my-courses
    const [sortBy, setSortBy] = useState("recently-active") // 'recently-active', 'progress-high', 'alphabetical' for my-courses

    // Filter and sort logic for My Learning Progress (from DashboardMyLearning)
    const filteredAndSortedMyCourses = React.useMemo(() => {
        let courses = [...myLearningProgress];

        if (searchQuery) {
            courses = courses.filter(course =>
                course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filterStatus !== "all") {
            courses = courses.filter(course => {
                const progress = course.progress ?? 0;
                if (filterStatus === "in-progress") return progress > 0 && progress < 100;
                if (filterStatus === "completed") return progress === 100;
                if (filterStatus === "not-started") return progress === 0;
                return true;
            });
        }

        courses.sort((a, b) => {
            switch (sortBy) {
                case "progress-high":
                    return (b.progress ?? 0) - (a.progress ?? 0);
                case "alphabetical":
                    return a.title.localeCompare(b.title);
                case "recently-active":
                default:
                    return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
            }
        });

        return courses;
    }, [myLearningProgress, searchQuery, filterStatus, sortBy]);

    // Filter logic for Students in My Courses (can add search/filter later if needed)
    const filteredRecentEnrollments = React.useMemo(() => {
        if (!searchQuery) return recentEnrollments;
        return recentEnrollments.filter(enrollment =>
            enrollment.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            enrollment.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [recentEnrollments, searchQuery]);


    const getTypeIcon = (type: string) => {
        switch (type) {
            case "Video": return Video
            case "PDF": return FileText
            case "Link": return LinkIcon
            case "Interactive": return Target
            default: return BookOpen
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">My Enrollments</h2>
                <div className="flex gap-2">
                    <Button
                        variant={viewMode === 'my-students' ? 'default' : 'outline'}
                        onClick={() => {
                            setViewMode('my-students');
                            setSearchQuery(""); // Clear search when switching views
                        }}
                        className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Students in My Courses
                    </Button>
                    <Button
                        variant={viewMode === 'my-courses' ? 'default' : 'outline'}
                        onClick={() => {
                            setViewMode('my-courses');
                            setSearchQuery(""); // Clear search when switching views
                        }}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Courses I'm Enrolled In
                    </Button>
                </div>
            </div>

            {/* Search and Filters for the active view */}
            <Card className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative md:col-span-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder={viewMode === 'my-students' ? "Search students or courses..." : "Search my courses..."}
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {viewMode === 'my-courses' && (
                            <>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="md:col-span-1">
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="in-progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="not-started">Not Started</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="md:col-span-1">
                                        <SortAsc className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="recently-active">Recently Active</SelectItem>
                                        <SelectItem value="progress-high">Highest Progress</SelectItem>
                                        <SelectItem value="alphabetical">Alphabetical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </>
                        )}
                        {viewMode === 'my-students' && (
                            <div className="md:col-span-2 flex justify-end">
                                <Button variant="outline" onClick={() => setSearchQuery("")}>Clear Search</Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>


            {viewMode === 'my-students' && (
                <Card className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Students Enrolled in My Courses
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {filteredRecentEnrollments.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="w-16 h-16 mx-auto mb-4" />
                                <p className="text-lg font-semibold mb-2">No students found!</p>
                                <p className="mb-4">Try adjusting your search.</p>
                                <Button onClick={() => setSearchQuery("")}>
                                    Clear Search
                                </Button>
                            </div>
                        ) : (
                            filteredRecentEnrollments.map((enrollment, index) => (
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
                                        <a
                                            onClick={() => router.push(`/users/${enrollment.studentId}`)}
                                            className="font-medium cursor-pointer hover:text-primary transition-colors"
                                        >
                                            {enrollment.studentName}
                                        </a>
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
                            ))
                        )}
                    </CardContent>
                </Card>
            )}

            {viewMode === 'my-courses' && (
                <Card className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Courses I'm Enrolled In
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {filteredAndSortedMyCourses.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Target className="w-16 h-16 mx-auto mb-4" />
                                <p className="text-lg font-semibold mb-2">No courses found!</p>
                                <p className="mb-4">Try adjusting your search or filters.</p>
                                <Button onClick={() => { setSearchQuery(""); setFilterStatus("all"); setSortBy("recently-active"); }}>
                                    Clear Filters
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredAndSortedMyCourses.map((course, index) => {
                                    const TypeIcon = getTypeIcon(course.type);
                                    const progressColor = course.progress === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-500';
                                    return (
                                        <motion.div
                                            key={course.id}
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ delay: 0.05 * index, duration: 0.3 }}
                                            className="group"
                                        >
                                            <Card
                                                className="h-full flex flex-col justify-between glass-enhanced hover:scale-[1.02] hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                                                onClick={() => router.push(`/courses/${course.id}`)}
                                            >
                                                <div className="relative">
                                                    <img
                                                        src={course.thumbnailUrl}
                                                        alt={course.title}
                                                        className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    <div className="absolute top-2 right-2">
                                                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-foreground">
                                                            <TypeIcon className="w-3 h-3 mr-1" />
                                                            {course.type}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <h4 className="font-semibold line-clamp-2 text-lg mb-1 group-hover:text-primary transition-colors">
                                                            {course.title}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                            {course.description}
                                                        </p>
                                                    </div>
                                                    <div className="mt-auto">
                                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                                            <div
                                                                className={`h-2 rounded-full transition-all ${progressColor}`}
                                                                style={{ width: `${course.progress ?? 0}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                                                            <span>{course.progress ?? 0}% complete</span>
                                                            <div className="flex items-center gap-2">
                                                                {course.progress === 100 ? (
                                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                                ) : (
                                                                    <Button variant="ghost" size="sm" className="h-6 p-1 text-primary hover:text-primary/80">
                                                                        <Play className="w-3 h-3 mr-1" />
                                                                        Continue
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                                            <Clock className="w-3 h-3" />
                                                            <span>Last updated: {new Date(course.lastUpdated).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}