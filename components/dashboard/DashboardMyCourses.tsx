"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, BookOpen, FileText, Video, Link as LinkIcon, Target, Star } from "lucide-react"
import { motion } from "framer-motion"

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
}

interface DashboardMyCoursesProps {
    myCourses: Course[]
    onCreateCourse: () => void
    showCreateButton: boolean; // New prop to control button visibility
}

export function DashboardMyCourses({ myCourses, onCreateCourse, showCreateButton }: DashboardMyCoursesProps) {
    const router = useRouter()

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
            case "Link": return LinkIcon
            case "Interactive": return Target
            default: return BookOpen
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Courses</h2>
                {showCreateButton && (
                    <Button
                        onClick={onCreateCourse}
                        className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Course
                    </Button>
                )}
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
                            <Card className="glass-enhanced hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
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
        </div>
    )
}