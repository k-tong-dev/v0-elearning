"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Users, Target } from "lucide-react"
import { motion } from "framer-motion"

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
    studentName: string
    studentAvatar: string
    enrolledAt: string
    progress: number
    lastActive: string
    completed: boolean
}

interface DashboardEnrollmentsProps {
    recentEnrollments: StudentEnrollment[]
    myLearningProgress: CourseEnrollment[]
}

export function DashboardEnrollments({ recentEnrollments, myLearningProgress }: DashboardEnrollmentsProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Enrollments</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Students in My Courses */}
                <Card className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Students in My Courses
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
                <Card className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Courses I'm Enrolled In
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {myLearningProgress.map((course, index) => (
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
        </div>
    )
}