"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Users, Target, BookOpen, Search, Filter, SortAsc, Clock, CheckCircle, Play, Video, FileText, Link as LinkIcon, List, Grid3x3, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { getCourseEnrollments, CourseEnrollment as StrapiCourseEnrollment } from "@/integrations/strapi/courseEnrollment"
import { getCourseCourse, getDashboardCourseCourses } from "@/integrations/strapi/courseCourse"
import { toast } from "sonner"
import { getAvatarUrl } from "@/lib/getAvatarUrl"

// Legacy interfaces for backward compatibility with props
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
    const { user, isAuthenticated } = useAuth()
    const [viewMode, setViewMode] = useState<'list' | 'grouped' | 'my-students'>('list') // 'list', 'grouped', or 'my-students' for course creator
    const [myCourseEnrollments, setMyCourseEnrollments] = useState<Array<StrapiCourseEnrollment & { course: any; userDetails?: any }>>([])
    const [isLoadingMyStudents, setIsLoadingMyStudents] = useState(false)
    const [userEnrollments, setUserEnrollments] = useState<StrapiCourseEnrollment[]>([])
    const [enrollmentsWithCourses, setEnrollmentsWithCourses] = useState<Array<StrapiCourseEnrollment & { course: any }>>([])
    const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState("all") // 'all', 'active', 'completed', 'cancelled'
    const [sortBy, setSortBy] = useState("recent") // 'recent', 'progress-high', 'alphabetical'

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

    // Load user enrollments
    useEffect(() => {
        const loadUserEnrollments = async () => {
            if (!isAuthenticated || !user?.id) return
            
            setIsLoadingEnrollments(true)
            try {
                const enrollments = await getCourseEnrollments(user.id)
                setUserEnrollments(enrollments)
                
                // Load course details for each enrollment
                const enrollmentsWithCourseData = await Promise.all(
                    enrollments.map(async (enrollment) => {
                        try {
                            const course = await getCourseCourse(enrollment.course_course)
                            return {
                                ...enrollment,
                                course
                            }
                        } catch (error) {
                            console.warn("Failed to load course for enrollment:", enrollment.id, error)
                            return {
                                ...enrollment,
                                course: null
                            }
                        }
                    })
                )
                setEnrollmentsWithCourses(enrollmentsWithCourseData)
            } catch (error) {
                console.error("Failed to load enrollments:", error)
                toast.error("Failed to load enrollments")
            } finally {
                setIsLoadingEnrollments(false)
            }
        }
        
        loadUserEnrollments()
    }, [isAuthenticated, user?.id])

    // Load enrollments for courses created by the user (My Students)
    useEffect(() => {
        const loadMyCourseEnrollments = async () => {
            if (!isAuthenticated || !user?.id || viewMode !== 'my-students') return
            
            setIsLoadingMyStudents(true)
            try {
                // Get courses created by the user (filter by owner)
                const userId = typeof user.id === 'string' ? Number(user.id) : user.id
                if (isNaN(userId)) {
                    console.error("Invalid user ID:", user.id)
                    return
                }
                const myCourses = await getDashboardCourseCourses({ ownerId: userId })
                
                // Get enrollments for each course
                const allEnrollments: Array<StrapiCourseEnrollment & { course: any; userDetails?: any }> = []
                
                for (const course of myCourses) {
                    try {
                        const enrollments = await getCourseEnrollments(undefined, course.id)
                        for (const enrollment of enrollments) {
                            // Get user details for each enrollment
                            const userData = (enrollment as any).userDetails
                            allEnrollments.push({
                                ...enrollment,
                                course,
                                userDetails: userData || null
                            })
                        }
                    } catch (error) {
                        console.warn("Failed to load enrollments for course:", course.id, error)
                    }
                }
                
                setMyCourseEnrollments(allEnrollments)
            } catch (error) {
                console.error("Failed to load my course enrollments:", error)
                toast.error("Failed to load student enrollments")
            } finally {
                setIsLoadingMyStudents(false)
            }
        }
        
        if (viewMode === 'my-students') {
            loadMyCourseEnrollments()
        }
    }, [isAuthenticated, user?.id, viewMode])

    // Filter and sort logic for user enrollments
    const filteredAndSortedEnrollments = React.useMemo(() => {
        let enrollments = [...enrollmentsWithCourses];

        if (searchQuery) {
            enrollments = enrollments.filter(enrollment =>
                enrollment.course?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                enrollment.course?.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filterStatus !== "all") {
            enrollments = enrollments.filter(enrollment => {
                return enrollment.enroll_status === filterStatus;
            });
        }

        enrollments.sort((a, b) => {
            switch (sortBy) {
                case "progress-high":
                    return (b.progress_percent ?? 0) - (a.progress_percent ?? 0);
                case "alphabetical":
                    return (a.course?.name || '').localeCompare(b.course?.name || '');
                case "recent":
                default:
                    const dateA = a.started_at ? new Date(a.started_at).getTime() : 0;
                    const dateB = b.started_at ? new Date(b.started_at).getTime() : 0;
                    return dateB - dateA;
            }
        });

        return enrollments;
    }, [enrollmentsWithCourses, searchQuery, filterStatus, sortBy]);

    // Group enrollments by course
    const enrollmentsByCourse = React.useMemo(() => {
        const grouped: Record<string, typeof filteredAndSortedEnrollments> = {}
        filteredAndSortedEnrollments.forEach(enrollment => {
            const courseId = String(enrollment.course_course)
            if (!grouped[courseId]) {
                grouped[courseId] = []
            }
            grouped[courseId].push(enrollment)
        })
        return grouped
    }, [filteredAndSortedEnrollments])


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
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        onClick={() => {
                            setViewMode('list');
                            setSearchQuery("");
                        }}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                    >
                        <List className="w-4 h-4 mr-2" />
                        List View
                    </Button>
                    <Button
                        variant={viewMode === 'grouped' ? 'default' : 'outline'}
                        onClick={() => {
                            setViewMode('grouped');
                            setSearchQuery("");
                        }}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-foreground"
                    >
                        <Grid3x3 className="w-4 h-4 mr-2" />
                        Grouped by Course
                    </Button>
                </div>
            </div>

            {/* Search and Filters for the active view */}
            <Card className="liquid-glass-card">
                <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative md:col-span-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search courses..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="md:col-span-1">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="md:col-span-1">
                                <SortAsc className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="recent">Most Recent</SelectItem>
                                <SelectItem value="progress-high">Highest Progress</SelectItem>
                                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>


            {/* List View */}
            {viewMode === 'list' && (
                <Card className="liquid-glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <List className="w-5 h-5" />
                            My Enrollments ({filteredAndSortedEnrollments.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoadingEnrollments ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : filteredAndSortedEnrollments.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <BookOpen className="w-16 h-16 mx-auto mb-4" />
                                <p className="text-lg font-semibold mb-2">No enrollments found!</p>
                                <p className="mb-4">Try adjusting your search or filters.</p>
                                <Button onClick={() => { setSearchQuery(""); setFilterStatus("all"); setSortBy("recent"); }}>
                                    Clear Filters
                                </Button>
                            </div>
                        ) : (
                            filteredAndSortedEnrollments.map((enrollment, index) => (
                                <motion.div
                                    key={enrollment.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.05 * index }}
                                    className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-accent/50 transition-colors cursor-pointer"
                                    onClick={() => {
                                        const courseId = enrollment.course?.documentId || enrollment.course?.id || enrollment.course_course
                                        router.push(`/courses/${courseId}`)
                                    }}
                                >
                                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-8 h-8 text-primary" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                                            {enrollment.course?.name || `Course ${enrollment.course_course}`}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-2">
                                            <Badge variant="outline" className="text-xs">
                                                {enrollment.enroll_status}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                Progress: {enrollment.progress_percent}%
                                            </span>
                                            {enrollment.started_at && (
                                                <span className="text-sm text-muted-foreground">
                                                    Started: {new Date(enrollment.started_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2">
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${
                                                        enrollment.progress_percent === 100 
                                                            ? 'bg-green-500' 
                                                            : enrollment.enroll_status === 'completed'
                                                            ? 'bg-green-500'
                                                            : 'bg-gradient-to-r from-blue-500 to-purple-500'
                                                    }`}
                                                    style={{ width: `${enrollment.progress_percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            {enrollment.enrolled_via}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                const courseId = enrollment.course?.documentId || enrollment.course?.id || enrollment.course_course
                                                router.push(`/courses/${courseId}/study`)
                                            }}
                                        >
                                            <Play className="w-4 h-4 mr-1" />
                                            Continue
                                        </Button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Grouped by Course View */}
            {viewMode === 'grouped' && (
                <div className="space-y-6">
                    {isLoadingEnrollments ? (
                        <Card className="liquid-glass-card">
                            <CardContent className="py-12">
                                <div className="flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            </CardContent>
                        </Card>
                    ) : Object.keys(enrollmentsByCourse).length === 0 ? (
                        <Card className="liquid-glass-card">
                            <CardContent className="py-12 text-center text-muted-foreground">
                                <Grid3x3 className="w-16 h-16 mx-auto mb-4" />
                                <p className="text-lg font-semibold mb-2">No enrollments found!</p>
                                <p className="mb-4">Try adjusting your search or filters.</p>
                                <Button onClick={() => { setSearchQuery(""); setFilterStatus("all"); setSortBy("recent"); }}>
                                    Clear Filters
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        Object.entries(enrollmentsByCourse).map(([courseId, courseEnrollments], groupIndex) => {
                            const firstEnrollment = courseEnrollments[0]
                            const course = firstEnrollment.course
                            
                            return (
                                <Card key={courseId} className="liquid-glass-card">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2">
                                                <BookOpen className="w-5 h-5" />
                                                {course?.name || `Course ${courseId}`}
                                            </CardTitle>
                                            <Badge variant="outline">
                                                {courseEnrollments.length} enrollment{courseEnrollments.length !== 1 ? 's' : ''}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {courseEnrollments.map((enrollment, index) => (
                                            <motion.div
                                                key={enrollment.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.05 * index }}
                                                className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-accent/50 transition-colors cursor-pointer"
                                                onClick={() => {
                                                    const courseIdentifier = course?.documentId || course?.id || courseId
                                                    router.push(`/courses/${courseIdentifier}/study`)
                                                }}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {enrollment.enroll_status}
                                                        </Badge>
                                                        <span className="text-sm text-muted-foreground">
                                                            Progress: {enrollment.progress_percent}%
                                                        </span>
                                                        {enrollment.started_at && (
                                                            <span className="text-xs text-muted-foreground">
                                                                Started: {new Date(enrollment.started_at).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${
                                                                enrollment.progress_percent === 100 
                                                                    ? 'bg-green-500' 
                                                                    : enrollment.enroll_status === 'completed'
                                                                    ? 'bg-green-500'
                                                                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                                                            }`}
                                                            style={{ width: `${enrollment.progress_percent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        const courseIdentifier = course?.documentId || course?.id || courseId
                                                        router.push(`/courses/${courseIdentifier}/study`)
                                                    }}
                                                >
                                                    <Play className="w-4 h-4 mr-1" />
                                                    Continue
                                                </Button>
                                            </motion.div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </div>
            )}

            {/* My Students View - Show students enrolled in courses created by the user */}
            {viewMode === 'my-students' && (
                <Card className="liquid-glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            My Students ({myCourseEnrollments.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoadingMyStudents ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : myCourseEnrollments.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="w-16 h-16 mx-auto mb-4" />
                                <p className="text-lg font-semibold mb-2">No students enrolled yet!</p>
                                <p className="mb-4">Students who enroll in your courses will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myCourseEnrollments.map((enrollment, index) => {
                                    const userInfo = enrollment.userDetails || (enrollment as any).userDetails
                                    return (
                                        <motion.div
                                            key={`${enrollment.id}-${index}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.05 * index }}
                                            className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-accent/50 transition-colors"
                                        >
                                            {userInfo ? (
                                                <Avatar className="w-12 h-12">
                                                    <AvatarImage src={getAvatarUrl(userInfo.avatar) || undefined} />
                                                    <AvatarFallback>
                                                        {userInfo.full_name?.split(" ").map((n: string) => n[0]).join("") || userInfo.username?.[0] || "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Users className="w-6 h-6 text-primary" />
                                                </div>
                                            )}
                                            
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                                                    {userInfo?.full_name || userInfo?.username || `User ${enrollment.user}`}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {enrollment.course?.name || `Course ${enrollment.course_course}`}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="text-xs">
                                                        {enrollment.enroll_status}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        Progress: {enrollment.progress_percent}%
                                                    </span>
                                                    {enrollment.started_at && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Started: {new Date(enrollment.started_at).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-2">
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${
                                                                enrollment.progress_percent === 100 
                                                                    ? 'bg-green-500' 
                                                                    : enrollment.enroll_status === 'completed'
                                                                    ? 'bg-green-500'
                                                                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                                                            }`}
                                                            style={{ width: `${enrollment.progress_percent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col items-end gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {enrollment.enrolled_via}
                                                </Badge>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}