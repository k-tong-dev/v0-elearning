"use client"

import React, { useState, useEffect } from "react"
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
    ThumbsUp,
    CreditCard,
    Loader2
} from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"
import { getPurchaseTransactions, PurchaseTransaction } from "@/integrations/strapi/purchaseTransaction"
import { getAllUserSubscriptions, UserSubscription, Subscription } from "@/integrations/strapi/subscription"
import { getCourseCourse, getDashboardCourseCourses } from "@/integrations/strapi/courseCourse"
import { getCourseEnrollments } from "@/integrations/strapi/courseEnrollment"
import { getCourseMaterials } from "@/integrations/strapi/courseMaterial"

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

interface LessonsCompletedDataPoint {
    month: string
    lessons: number
}

interface MonthlySpendingDataPoint {
    month: string
    subscriptions: number
    courses: number
    total: number
}

interface SpendingByTypeDataPoint {
    name: string
    value: number
    color: string
}

interface DashboardOverviewProps {
    stats: DashboardStats
    enrollmentData: EnrollmentDataPoint[]
    courseTypeData: CourseTypeDataPoint[]
    recentActivity: RecentActivityItem[]
    lessonsCompletedData?: LessonsCompletedDataPoint[]
}

export function DashboardOverview({ stats, enrollmentData, courseTypeData, recentActivity, lessonsCompletedData = [] }: DashboardOverviewProps) {
    const { user } = useAuth()
    const [isLoadingData, setIsLoadingData] = useState(true)
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(true)
    const [realStats, setRealStats] = useState<DashboardStats | null>(null)
    const [realEnrollmentData, setRealEnrollmentData] = useState<EnrollmentDataPoint[]>([])
    const [realCourseTypeData, setRealCourseTypeData] = useState<CourseTypeDataPoint[]>([])
    const [hasRevenueData, setHasRevenueData] = useState(false)
    const [totalSubscriptionSpending, setTotalSubscriptionSpending] = useState(0)
    const [totalCourseSpending, setTotalCourseSpending] = useState(0)
    const [monthlySpendingData, setMonthlySpendingData] = useState<MonthlySpendingDataPoint[]>([])
    const [spendingByTypeData, setSpendingByTypeData] = useState<SpendingByTypeDataPoint[]>([])
    const [recentPurchases, setRecentPurchases] = useState<Array<{
        id: string
        type: 'subscription' | 'course'
        title: string
        amount: number
        date: string
    }>>([])

    // Fetch real stats and analytics data
    useEffect(() => {
        const fetchRealData = async () => {
            if (!user?.id) {
                setIsLoadingData(false)
                return
            }

            try {
                setIsLoadingData(true)
                
                // Fetch user's courses
                const userCourses = await getDashboardCourseCourses({ ownerId: user.id })
                const coursesCreated = userCourses.length
                
                // Fetch all purchases once
                const allPurchases = await getPurchaseTransactions()
                
                // Fetch enrollments for user's courses
                let totalEnrollments = 0
                let totalRevenue = 0
                const enrollmentMap = new Map<string, { count: number; revenue: number }>()
                const courseTypeMap = new Map<string, number>()
                
                for (const course of userCourses) {
                    // Count enrollments
                    const enrollments = await getCourseEnrollments(undefined, course.id)
                    totalEnrollments += enrollments.length
                    
                    // Calculate revenue from purchases for this course
                    const coursePurchases = allPurchases.filter(p => {
                        const courseId = typeof p.course_course === 'object' ? p.course_course?.id : p.course_course
                        return (courseId === course.id || courseId === course.documentId) && p.state === 'completed'
                    })
                    const courseRevenue = coursePurchases.reduce((sum, p) => sum + (p.amount_paid || 0), 0)
                    totalRevenue += courseRevenue
                    
                    // Group enrollments by month
                    enrollments.forEach(enrollment => {
                        if (enrollment.createdAt) {
                            const date = new Date(enrollment.createdAt)
                            const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                            const existing = enrollmentMap.get(monthKey) || { count: 0, revenue: 0 }
                            existing.count += 1
                            enrollmentMap.set(monthKey, existing)
                        }
                    })
                    
                    // Group revenue by purchase month
                    coursePurchases.forEach(purchase => {
                        const purchaseDate = purchase.purchased_at || purchase.createdAt
                        if (purchaseDate) {
                            const date = new Date(purchaseDate)
                            const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                            const existing = enrollmentMap.get(monthKey) || { count: 0, revenue: 0 }
                            existing.revenue += purchase.amount_paid || 0
                            enrollmentMap.set(monthKey, existing)
                        }
                    })
                    
                    // Determine course type from course contents
                    let courseType = 'Other'
                    try {
                        // Fetch materials with course contents populated
                        const { strapi } = await import('@/integrations/strapi/client')
                        const courseDocId = course.documentId || course.id
                        const isDocumentId = typeof courseDocId === 'string' && !/^\d+$/.test(courseDocId)
                        const filterParam = isDocumentId
                            ? `filters[course_course][documentId][$eq]=${courseDocId}`
                            : `filters[course_course][id][$eq]=${course.id}`
                        
                        const materialsResponse = await strapi.get(
                            `/api/course-materials?${filterParam}&populate[course_contents][fields][0]=type&sort=order_index:asc`
                        )
                        const materials = materialsResponse.data?.data || []
                        
                        if (materials && materials.length > 0) {
                            // Count content types
                            const contentTypeCounts = new Map<string, number>()
                            for (const material of materials) {
                                const contents = material.course_contents?.data || material.course_contents || []
                                if (contents.length > 0) {
                                    for (const content of contents) {
                                        const contentType = content.type || 'unknown'
                                        contentTypeCounts.set(contentType, (contentTypeCounts.get(contentType) || 0) + 1)
                                    }
                                }
                            }
                            
                            // Determine primary type
                            if (contentTypeCounts.size > 0) {
                                // Map content types to course types
                                const typeMapping: Record<string, string> = {
                                    'video': 'Video',
                                    'audio': 'Video', // Audio courses grouped with Video
                                    'document': 'PDF',
                                    'url': 'Link',
                                    'article': 'PDF', // Articles grouped with PDF
                                    'quiz': 'Interactive',
                                    'certificate': 'Interactive',
                                    'image': 'Other'
                                }
                                
                                // Find the most common content type
                                let maxCount = 0
                                let dominantType = 'Other'
                                for (const [contentType, count] of contentTypeCounts.entries()) {
                                    if (count > maxCount) {
                                        maxCount = count
                                        dominantType = typeMapping[contentType] || 'Other'
                                    }
                                }
                                courseType = dominantType
                            } else {
                                // Fallback: check preview type
                                const previewType = course.course_preview?.types
                                if (previewType === 'video') {
                                    courseType = 'Video'
                                } else if (previewType === 'url') {
                                    courseType = 'Link'
                                } else {
                                    courseType = 'Other'
                                }
                            }
                        } else {
                            // No materials, use preview type as fallback
                            const previewType = course.course_preview?.types
                            if (previewType === 'video') {
                                courseType = 'Video'
                            } else if (previewType === 'url') {
                                courseType = 'Link'
                            }
                        }
                    } catch (error) {
                        console.error(`Error fetching course materials for course ${course.id}:`, error)
                        // Fallback to preview type
                        const previewType = course.course_preview?.types
                        if (previewType === 'video') {
                            courseType = 'Video'
                        } else if (previewType === 'url') {
                            courseType = 'Link'
                        }
                    }
                    
                    courseTypeMap.set(courseType, (courseTypeMap.get(courseType) || 0) + 1)
                }
                
                // Calculate average rating
                const ratings = userCourses
                    .map(c => c.average_rating)
                    .filter((r): r is number => r !== undefined && r !== null)
                const avgRating = ratings.length > 0 
                    ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
                    : 0
                
                // Set real stats
                setRealStats({
                    totalCourses: coursesCreated,
                    activeLearners: totalEnrollments,
                    totalRevenue: totalRevenue,
                    completionRate: 0, // Would need to calculate from enrollments
                    totalViews: 0, // Not available in current schema
                    avgRating: avgRating,
                    coursesCreated: coursesCreated,
                    enrollmentsReceived: totalEnrollments
                })
                
                // Set enrollment data
                const enrollmentDataPoints: EnrollmentDataPoint[] = Array.from(enrollmentMap.entries())
                    .map(([month, data]) => ({
                        month,
                        enrollments: data.count,
                        revenue: data.revenue
                    }))
                    .sort((a, b) => {
                        const dateA = new Date(a.month)
                        const dateB = new Date(b.month)
                        return dateA.getTime() - dateB.getTime()
                    })
                    .slice(-6) // Last 6 months
                
                setRealEnrollmentData(enrollmentDataPoints)
                setHasRevenueData(totalRevenue > 0 || enrollmentDataPoints.length > 0)
                
                // Set course type data
                const typeColors: Record<string, string> = {
                    'Video': '#3B82F6',
                    'PDF': '#10B981',
                    'Interactive': '#8B5CF6',
                    'Link': '#F59E0B',
                    'Other': '#6B7280'
                }
                
                const courseTypeDataPoints: CourseTypeDataPoint[] = Array.from(courseTypeMap.entries())
                    .map(([name, value]) => ({
                        name,
                        value,
                        color: typeColors[name] || typeColors['Other']
                    }))
                
                setRealCourseTypeData(courseTypeDataPoints)

            } catch (error) {
                console.error("Error fetching real dashboard data:", error)
            } finally {
                setIsLoadingData(false)
            }
        }

        fetchRealData()
    }, [user?.id])

    // Fetch expense data
    useEffect(() => {
        const fetchExpenseData = async () => {
            if (!user?.id) {
                setIsLoadingExpenses(false)
                return
            }

            try {
                setIsLoadingExpenses(true)
                
                // Fetch course purchases
                const coursePurchases = await getPurchaseTransactions(user.id.toString())
                const completedPurchases = coursePurchases.filter(p => p.state === 'completed')
                
                // Calculate course spending
                const courseTotal = completedPurchases.reduce((sum, p) => sum + (p.amount_paid || 0), 0)
                setTotalCourseSpending(courseTotal)

                // Fetch subscriptions
                const userSubscriptions = await getAllUserSubscriptions(user.id)
                
                // Calculate subscription spending
                // For subscriptions, we'll use the subscription price and count active/past subscriptions
                let subscriptionTotal = 0
                const subscriptionPayments: Array<{ date: string; amount: number }> = []
                
                userSubscriptions.forEach((userSub) => {
                    if (userSub.subscription && typeof userSub.subscription === 'object') {
                        const subscription = userSub.subscription as Subscription
                        const price = subscription.price || 0
                        
                        // If subscription has last_billing_date, use that; otherwise use createdAt
                        const paymentDate = userSub.last_billing_date || userSub.createdAt || new Date().toISOString()
                        
                        // Count how many months this subscription has been active
                        if (userSub.state === 'active' || userSub.state === 'cancelled') {
                            const startDate = new Date(userSub.createdAt || paymentDate)
                            const endDate = userSub.cancelled_at 
                                ? new Date(userSub.cancelled_at) 
                                : new Date()
                            const monthsDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)))
                            
                            subscriptionTotal += price * monthsDiff
                            
                            // Add monthly payments
                            for (let i = 0; i < monthsDiff; i++) {
                                const paymentMonth = new Date(startDate)
                                paymentMonth.setMonth(paymentMonth.getMonth() + i)
                                subscriptionPayments.push({
                                    date: paymentMonth.toISOString(),
                                    amount: price
                                })
                            }
                        }
                    }
                })
                
                setTotalSubscriptionSpending(subscriptionTotal)

                // Prepare monthly spending data
                const monthlyDataMap = new Map<string, { subscriptions: number; courses: number; date: Date }>()
                
                // Add subscription payments
                subscriptionPayments.forEach(payment => {
                    const paymentDate = new Date(payment.date)
                    const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`
                    const existing = monthlyDataMap.get(monthKey)
                    if (existing) {
                        existing.subscriptions += payment.amount
                    } else {
                        monthlyDataMap.set(monthKey, {
                            subscriptions: payment.amount,
                            courses: 0,
                            date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1)
                        })
                    }
                })
                
                // Add course purchases
                completedPurchases.forEach(purchase => {
                    const purchaseDate = new Date(purchase.purchased_at || purchase.createdAt || '')
                    if (!isNaN(purchaseDate.getTime())) {
                        const monthKey = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}`
                        const existing = monthlyDataMap.get(monthKey)
                        if (existing) {
                            existing.courses += purchase.amount_paid || 0
                        } else {
                            monthlyDataMap.set(monthKey, {
                                subscriptions: 0,
                                courses: purchase.amount_paid || 0,
                                date: new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), 1)
                            })
                        }
                    }
                })
                
                // Convert to array with date for sorting, then format month label
                const monthlyDataWithDate = Array.from(monthlyDataMap.values())
                    .map((data) => ({
                        month: data.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                        subscriptions: data.subscriptions,
                        courses: data.courses,
                        total: data.subscriptions + data.courses,
                        date: data.date
                    }))
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .slice(-6) // Last 6 months
                
                // Remove date from final data
                const monthlyData: MonthlySpendingDataPoint[] = monthlyDataWithDate.map(({ date, ...rest }) => rest)
                
                setMonthlySpendingData(monthlyData)

                // Spending by type
                setSpendingByTypeData([
                    { name: "Subscriptions", value: subscriptionTotal, color: "#8B5CF6" },
                    { name: "Courses", value: courseTotal, color: "#F59E0B" }
                ])

                // Recent purchases
                const recent: Array<{ id: string; type: 'subscription' | 'course'; title: string; amount: number; date: string }> = []
                
                // Add recent course purchases
                for (const purchase of completedPurchases.slice(0, 5)) {
                    try {
                        const course = purchase.course_course ? await getCourseCourse(purchase.course_course) : null
                        recent.push({
                            id: purchase.id.toString(),
                            type: 'course',
                            title: course?.name || `Course #${purchase.course_course}`,
                            amount: purchase.amount_paid || 0,
                            date: purchase.purchased_at || purchase.createdAt || ''
                        })
                    } catch (error) {
                        console.error('Error fetching course:', error)
                    }
                }
                
                // Add recent subscriptions
                userSubscriptions.slice(0, 5).forEach(userSub => {
                    if (userSub.subscription && typeof userSub.subscription === 'object') {
                        const subscription = userSub.subscription as Subscription
                        recent.push({
                            id: userSub.id.toString(),
                            type: 'subscription',
                            title: subscription.name || subscription.type || 'Subscription',
                            amount: subscription.price || 0,
                            date: userSub.createdAt || ''
                        })
                    }
                })
                
                // Sort by date and take top 5
                recent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                setRecentPurchases(recent.slice(0, 5))

            } catch (error) {
                console.error("Error fetching expense data:", error)
            } finally {
                setIsLoadingExpenses(false)
            }
        }

        fetchExpenseData()
    }, [user?.id])

    const totalOverallSpending = totalSubscriptionSpending + totalCourseSpending
    
    // Use real data if available, otherwise fall back to props
    const displayStats = realStats || stats
    const displayEnrollmentData = realEnrollmentData.length > 0 ? realEnrollmentData : enrollmentData
    const displayCourseTypeData = realCourseTypeData.length > 0 ? realCourseTypeData : courseTypeData
    
    // Determine what to show
    const hasCourses = displayStats.coursesCreated > 0
    const hasEnrollments = displayStats.enrollmentsReceived > 0
    const hasRevenue = displayStats.totalRevenue > 0 || hasRevenueData
    const hasExpenses = totalOverallSpending > 0
    const showEnrollmentChart = displayEnrollmentData.length > 0
    const showCourseTypeChart = displayCourseTypeData.length > 0

    if (isLoadingData) {
        return (
            <div className="space-y-6">
                <Card className="liquid-glass-card">
                    <CardContent className="p-12">
                        <div className="flex flex-col items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground">Loading dashboard data...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards - Only show if user has created courses */}
            {hasCourses && (
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
                                    <div className="text-2xl font-bold">{displayStats.coursesCreated}</div>
                                <div className="text-sm text-muted-foreground">Courses Created</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                    {hasEnrollments && (
                <Card className="liquid-glass-card">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                        <div className="text-2xl font-bold">{displayStats.enrollmentsReceived}</div>
                                <div className="text-sm text-muted-foreground">Total Enrollments</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                    )}

                    {hasRevenue && (
                <Card className="liquid-glass-card">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                        <div className="text-2xl font-bold">${displayStats.totalRevenue.toLocaleString()}</div>
                                <div className="text-sm text-muted-foreground">Total Earnings</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                    )}

                    {displayStats.avgRating > 0 && (
                <Card className="liquid-glass-card">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                                <Star className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                        <div className="text-2xl font-bold">{displayStats.avgRating.toFixed(1)}</div>
                                <div className="text-sm text-muted-foreground">Avg. Rating</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                    )}
            </motion.div>
            )}

            {/* Charts Row - Only show if there's data */}
            {(showEnrollmentChart || showCourseTypeChart) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Enrollment Trends */}
                    {showEnrollmentChart && (
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
                                        <LineChart data={displayEnrollmentData}>
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
                    )}

                {/* Course Types Distribution */}
                    {showCourseTypeChart && (
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
                                                data={displayCourseTypeData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                                {displayCourseTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
                    )}
                </div>
            )}

            {/* Analytics Section - Only show if there's revenue data */}
            {hasRevenue && displayEnrollmentData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="text-2xl font-bold mb-4">Analytics</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue Analytics */}
                        {displayEnrollmentData.some(d => d.revenue > 0) && (
                            <Card className="liquid-glass-card hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-green-500" />
                                        Revenue Analytics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={displayEnrollmentData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                            <Bar dataKey="revenue" fill="#10B981" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}

                        {/* Lessons Completed Chart */}
                        {lessonsCompletedData.length > 0 && (
                            <Card className="liquid-glass-card hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
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
                        )}
                    </div>
                </motion.div>
            )}

            {/* Expenditure Section - Only show if there are expenses */}
            {hasExpenses && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <h2 className="text-2xl font-bold mb-4">My Expenditure</h2>
                    
                    {isLoadingExpenses ? (
                    <Card className="liquid-glass-card">
                        <CardContent className="p-12">
                            <div className="flex flex-col items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                                <p className="text-muted-foreground">Loading expense data...</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Expense Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <Card className="liquid-glass-card hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                            <DollarSign className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold">${totalOverallSpending.toFixed(2)}</div>
                                            <div className="text-sm text-muted-foreground">Total Spending</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="liquid-glass-card hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                                            <CreditCard className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold">${totalSubscriptionSpending.toFixed(2)}</div>
                                            <div className="text-sm text-muted-foreground">Subscription Spending</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="liquid-glass-card hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                                            <BookOpen className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold">${totalCourseSpending.toFixed(2)}</div>
                                            <div className="text-sm text-muted-foreground">Course Purchases</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Expense Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Monthly Spending Trend */}
                            {monthlySpendingData.length > 0 && (
                                <Card className="liquid-glass-card hover:scale-[1.01] hover:shadow-xl transition-all duration-300">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-blue-500" />
                                            Monthly Spending Trend
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={monthlySpendingData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                                <Line type="monotone" dataKey="subscriptions" stroke="#8B5CF6" strokeWidth={2} name="Subscriptions" />
                                                <Line type="monotone" dataKey="courses" stroke="#F59E0B" strokeWidth={2} name="Courses" />
                                                <Line type="monotone" dataKey="total" stroke="#10B981" strokeWidth={3} name="Total" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Spending by Type Distribution */}
                            {spendingByTypeData.length > 0 && (
                                <Card className="liquid-glass-card hover:scale-[1.01] hover:shadow-xl transition-all duration-300">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <PieChartIcon className="w-5 h-5 text-pink-500" />
                                            Spending by Type
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={spendingByTypeData}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {spendingByTypeData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            )}
            </div>

                        {/* Recent Purchases */}
                        {recentPurchases.length > 0 && (
                            <Card className="liquid-glass-card hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-green-500" />
                                        Recent Purchases
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {recentPurchases.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    {item.type === 'subscription' ? (
                                                        <Badge className="bg-purple-500 text-white">Subscription</Badge>
                                                    ) : (
                                                        <Badge className="bg-orange-500 text-white">Course</Badge>
                                                    )}
                                                    <div>
                                                        <div className="font-medium">{item.title}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {new Date(item.date).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="font-bold">${item.amount.toFixed(2)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
                </motion.div>
            )}

            {/* Recent Activity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
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