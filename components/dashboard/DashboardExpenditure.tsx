"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import { DollarSign, CreditCard, BookOpen, TrendingUp, PieChart as PieChartIcon, Calendar } from "lucide-react"
import { motion } from "framer-motion"

interface SubscriptionPurchase {
    id: string
    plan: string
    amount: number
    date: string
}

interface CoursePurchase {
    id: string
    courseTitle: string
    amount: number
    date: string
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

// Mock Data
const mockSubscriptions: SubscriptionPurchase[] = [
    { id: "sub1", plan: "Pro (Monthly)", amount: 39, date: "2024-01-01" },
    { id: "sub2", plan: "Pro (Monthly)", amount: 39, date: "2024-02-01" },
    { id: "sub3", plan: "Pro (Monthly)", amount: 39, date: "2024-03-01" },
    { id: "sub4", plan: "Pro (Monthly)", amount: 39, date: "2024-04-01" },
    { id: "sub5", plan: "Pro (Monthly)", amount: 39, date: "2024-05-01" },
    { id: "sub6", plan: "Pro (Monthly)", amount: 39, date: "2024-06-01" },
]

const mockCoursePurchases: CoursePurchase[] = [
    { id: "cp1", courseTitle: "Advanced React Patterns", amount: 79.99, date: "2024-01-10" },
    { id: "cp2", courseTitle: "Node.js Backend Development", amount: 89.99, date: "2024-02-15" },
    { id: "cp3", courseTitle: "UI/UX Design Fundamentals", amount: 59.99, date: "2024-03-20" },
    { id: "cp4", courseTitle: "Data Science with Python", amount: 109.99, date: "2024-04-05" },
    { id: "cp5", courseTitle: "Mobile App Development with React Native", amount: 94.99, date: "2024-05-12" },
]

const monthlySpendingData: MonthlySpendingDataPoint[] = [
    { month: "Jan", subscriptions: 39, courses: 79.99, total: 118.99 },
    { month: "Feb", subscriptions: 39, courses: 89.99, total: 128.99 },
    { month: "Mar", subscriptions: 39, courses: 59.99, total: 98.99 },
    { month: "Apr", subscriptions: 39, courses: 109.99, total: 148.99 },
    { month: "May", subscriptions: 39, courses: 94.99, total: 133.99 },
    { month: "Jun", subscriptions: 39, courses: 0, total: 39 },
]

const spendingByTypeData: SpendingByTypeDataPoint[] = [
    { name: "Subscriptions", value: mockSubscriptions.reduce((sum, p) => sum + p.amount, 0), color: "#8B5CF6" }, // Purple
    { name: "Courses", value: mockCoursePurchases.reduce((sum, p) => sum + p.amount, 0), color: "#F59E0B" }, // Orange
]

export function DashboardExpenditure() {
    const totalSubscriptionSpending = mockSubscriptions.reduce((sum, p) => sum + p.amount, 0)
    const totalCourseSpending = mockCoursePurchases.reduce((sum, p) => sum + p.amount, 0)
    const totalOverallSpending = totalSubscriptionSpending + totalCourseSpending

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">My Expenditure</h2>

            {/* Overview Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                <Card className="liquid-glass-card hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 flex items-center justify-center">
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
            </motion.div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Spending Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="liquid-glass-card hover:scale-[1.01] hover:shadow-xl transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-cyan-500" />
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
                </motion.div>

                {/* Spending by Type Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
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
                </motion.div>
            </div>

            {/* Recent Purchases */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="liquid-glass-card hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-green-500" />
                            Recent Purchases
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[...mockSubscriptions, ...mockCoursePurchases]
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .slice(0, 5) // Show top 5 recent purchases
                                .map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {('plan' in item) ? (
                                                <Badge className="bg-purple-500 text-white">Subscription</Badge>
                                            ) : (
                                                <Badge className="bg-orange-500 text-white">Course</Badge>
                                            )}
                                            <div>
                                                <div className="font-medium">{'plan' in item ? item.plan : item.courseTitle}</div>
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
            </motion.div>
        </div>
    )
}