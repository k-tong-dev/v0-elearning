"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Footer } from "@/components/ui/footers/footer"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"
import { DashboardOverview } from "@/components/dashboard/DashboardOverview"
import { DashboardMyCourses } from "@/components/dashboard/DashboardMyCourses"
import { DashboardCombinedEnrollments } from "@/components/dashboard/DashboardCombinedEnrollments"
import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics"
import { DashboardSettings } from "@/components/dashboard/DashboardSettings"
import CreateCourseForm from "@/components/dashboard/CreateCourseForm"
import { DashboardExpenditure } from "@/components/dashboard/DashboardExpenditure"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import { User as StrapiUser } from "@/types/user"
import {BookOpen, DollarSign, MessageCircle, Star, ThumbsUp, Users} from "lucide-react"; // Import the updated User interface

// Interfaces for mock data (keeping them here for context, but ideally they'd be in a types file)
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
    studentId: string
    studentName: string
    studentAvatar: string
    enrolledAt: string
    progress: number
    lastActive: string
    completed: boolean
}

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>}>
                <DashboardContent />
            </Suspense>
            <Footer />
        </div>
    )
}

function DashboardContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, isLoading: authLoading } = useAuth()
    const [isExpanded, setIsExpanded] = useState(true);

    const initialTab = searchParams?.get("tab") || "overview"
    const initialCreateCourse = searchParams?.get("create") === "true"
    const [selectedTab, setSelectedTab] = useState(initialTab)
    const [showCreateCourseForm, setShowCreateCourseForm] = useState(initialCreateCourse && initialTab === 'my-courses')

    useEffect(() => {
        const tab = searchParams?.get("tab")
        const create = searchParams?.get("create") === "true"

        if (tab && tab !== selectedTab) {
            setSelectedTab(tab)
            setShowCreateCourseForm(create && tab === 'my-courses')
        }
    }, [searchParams, selectedTab])

    // Mock data for dashboard
    const stats: DashboardStats = {
        totalCourses: 12,
        activeLearners: 1247,
        totalRevenue: 15420,
        completionRate: 78,
        totalViews: 25680,
        avgRating: 4.7,
        coursesCreated: 5,
        enrollmentsReceived: 145,
    }

    const enrollmentData = [
        { month: "Jan", enrollments: 45, revenue: 2250 },
        { month: "Feb", enrollments: 52, revenue: 2600 },
        { month: "Mar", enrollments: 38, revenue: 1900 },
        { month: "Apr", enrollments: 67, revenue: 3350 },
        { month: "May", enrollments: 73, revenue: 3650 },
        { month: "Jun", enrollments: 89, revenue: 4450 },
    ]

    const courseTypeData = [
        { name: "Video", value: 45, color: "#3B82F6" },
        { name: "PDF", value: 25, color: "#10B981" },
        { name: "Interactive", value: 20, color: "#8B5CF6" },
        { name: "Link", value: 10, color: "#F59E0B" },
    ]

    const lessonsCompletedData = [
        { month: "Jan", lessons: 10 },
        { month: "Feb", lessons: 15 },
        { month: "Mar", lessons: 22 },
        { month: "Apr", lessons: 18 },
        { month: "May", lessons: 25 },
        { month: "Jun", lessons: 30 },
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
            thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=200&fit=crop",
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
            thumbnailUrl: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=300&h=200&fit=crop",
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
            thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop",
        },
    ]

    const myLearningProgress: Course[] = [
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
            completedLessons: 18,
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
            completedLessons: 14,
        },
        {
            id: "e3",
            title: "UI/UX Design Fundamentals",
            description: "Learn the basics of user interface and user experience design.",
            type: "Interactive",
            status: "published",
            price: 59.99,
            enrollments: 0,
            rating: 4.5,
            createdAt: "2024-02-01",
            lastUpdated: "2024-02-10",
            thumbnailUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&h=200&fit=crop",
            progress: 20,
            totalLessons: 15,
            completedLessons: 3,
        },
    ]

    const recentEnrollments: Enrollment[] = [
        {
            id: "1",
            courseId: "1",
            courseTitle: "React Fundamentals for Beginners",
            studentId: "user-john-smith",
            studentName: "John Smith",
            studentAvatar: "/images/Avatar.jpg",
            enrolledAt: "2024-01-28",
            progress: 25,
            lastActive: "2 hours ago",
            completed: false,
        },
        {
            id: "2",
            courseId: "2",
            courseTitle: "JavaScript ES6+ Complete Guide",
            studentId: "user-maria-garcia",
            studentName: "Maria Garcia",
            studentAvatar: "/images/Avatar.jpg",
            enrolledAt: "2024-01-27",
            progress: 100,
            lastActive: "1 day ago",
            completed: true,
        },
        {
            id: "3",
            courseId: "1",
            courseTitle: "React Fundamentals for Beginners",
            studentId: "user-alex-johnson",
            studentName: "Alex Johnson",
            studentAvatar: "/images/Avatar.jpg",
            enrolledAt: "2024-01-26",
            progress: 60,
            lastActive: "5 hours ago",
            completed: false,
        },
    ]

    const recentActivityData = [
        { action: "New enrollment", details: "John Smith enrolled in React Fundamentals", time: "2 hours ago", icon: Users },
        { action: "Course updated", details: "JavaScript ES6+ Guide - Added new chapter", time: "5 hours ago", icon: BookOpen },
        { action: "Payment received", details: "$49.99 from course enrollment", time: "1 day ago", icon: DollarSign },
        { action: "Review received", details: "5-star review on React Fundamentals", time: "2 days ago", icon: Star },
        { action: "Commented on", details: "Discussion: React performance tips", time: "3 days ago", icon: MessageCircle },
        { action: "Liked post", details: "Post: Advanced TypeScript patterns", time: "4 days ago", icon: ThumbsUp },
    ]

    const handleTabChange = (tab: string) => {
        if (tab !== selectedTab) {
            setSelectedTab(tab)
            router.push(`/dashboard?tab=${tab}`)
        }
    }

    const handleCreateCourseClick = () => {
        if (selectedTab !== "my-courses" || !showCreateCourseForm) {
            setSelectedTab("my-courses")
            setShowCreateCourseForm(true)
            router.push("/dashboard?tab=my-courses&create=true")
        }
    }

    const handleCancelCreateCourse = () => {
        if (showCreateCourseForm) {
            setShowCreateCourseForm(false)
            router.push("/dashboard?tab=my-courses")
        }
    }

    const handleCourseCreatedSuccess = () => {
        if (showCreateCourseForm) {
            setShowCreateCourseForm(false)
            router.push("/dashboard?tab=my-courses")
        }
    }

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
            </div>
        )
    }

    // Ensure user is treated as StrapiUser type for DashboardSettings
    const currentUserForSettings: StrapiUser = user as StrapiUser;
    return (
        <div className="flex"> {/* Use flex to lay out sidebar and main content */}
            <DashboardSidebar
                currentUser={currentUserForSettings}
                selectedTab={selectedTab}
                onTabChange={handleTabChange}
                onCreateCourse={handleCreateCourseClick}
                isExpanded={isExpanded}
                onExpandedChange={setIsExpanded}
            />

            <main className={`flex-1 pt-10  sm:px-6 lg:px-8 transition-all duration-300 ${isExpanded ? "lg:ml-72" : "lg:ml-24"}`}>
                <div className="container mx-auto">
                    <motion.div
                        key={selectedTab + (showCreateCourseForm ? '-create' : '-list')}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
                            <TabsContent value="overview" className="mt-0">
                                <DashboardOverview
                                    stats={stats}
                                    enrollmentData={enrollmentData}
                                    courseTypeData={courseTypeData}
                                    recentActivity={recentActivityData}
                                />
                            </TabsContent>

                            <TabsContent value="enrollments" className="mt-0">
                                <DashboardCombinedEnrollments recentEnrollments={recentEnrollments} myLearningProgress={myLearningProgress} />
                            </TabsContent>

                            <TabsContent value="my-courses" className="mt-0">
                                {showCreateCourseForm ? (
                                    <CreateCourseForm
                                        onCancel={handleCancelCreateCourse}
                                        onSuccess={handleCourseCreatedSuccess}
                                    />
                                ) : (
                                    <DashboardMyCourses
                                        myCourses={myCourses}
                                        onCreateCourse={handleCreateCourseClick}
                                        showCreateButton={true}
                                    />
                                )}
                            </TabsContent>

                            <TabsContent value="expenditure" className="mt-0">
                                <DashboardExpenditure />
                            </TabsContent>

                            <TabsContent value="analytics" className="mt-0">
                                <DashboardAnalytics stats={stats} enrollmentData={enrollmentData} lessonsCompletedData={lessonsCompletedData} />
                            </TabsContent>

                            <TabsContent value="settings" className="mt-0">
                                <DashboardSettings
                                    currentUser={currentUserForSettings}
                                    stats={{
                                        coursesCreated: stats.coursesCreated,
                                        totalEnrollments: stats.activeLearners,
                                        totalRevenue: stats.totalRevenue,
                                        completionRate: stats.completionRate
                                    }}
                                />
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                </div>
            </main>
        </div>
    )
}