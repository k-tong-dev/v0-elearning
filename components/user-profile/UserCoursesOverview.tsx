"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Award } from "lucide-react"
import { motion } from "framer-motion"
import { UserRole } from "@/types/user" // Import UserRole

interface UserCoursesOverviewProps {
    coursesEnrolled: number
    coursesCreated: number
    userRole: UserRole // Pass the user's charactor code
}

export function UserCoursesOverview({ coursesEnrolled, coursesCreated, userRole }: UserCoursesOverviewProps) {
    const router = useRouter()

    return (
        <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-500" />
                            Enrolled Courses
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <div className="text-4xl font-bold text-blue-500 mb-2">{coursesEnrolled}</div>
                            <p className="text-muted-foreground text-lg">Active Enrollments</p>
                            <Button className="mt-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600" onClick={() => router.push('/courses')}>View All Courses</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-purple-500" />
                            Created Courses
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <div className="text-4xl font-bold text-purple-500 mb-2">{coursesCreated}</div>
                            <p className="text-muted-foreground text-lg">Courses Published</p>
                            {userRole === 'instructor' && ( // Only show button if user is an instructor
                                <Button className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" onClick={() => router.push('/dashboard?tab=my-courses')}>Create Course</Button>
                            )}
                            {userRole !== 'instructor' && (
                                <p className="text-sm text-muted-foreground mt-4">Become an instructor to create courses.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}