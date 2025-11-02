"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import { UserRole } from "@/types/user" // Import UserRole

interface UserProfileStatsProps {
    userStats: {
        posts: number
        replies: number
        likes: number
        views: number
        reputation: number
        coursesCreated: number
        coursesEnrolled: number
    }
    userRole: UserRole // Pass the user's charactor code
}

export function UserProfileStats({ userStats, userRole }: UserProfileStatsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
        >
            <Card className="liquid-glass-card">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Overview
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 rounded-lg bg-accent/30 border border-accent/50">
                            <div className="text-2xl font-bold text-cyan-600">{userStats.posts}</div>
                            <div className="text-xs text-muted-foreground">Posts</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-accent/30 border border-accent/50">
                            <div className="text-2xl font-bold text-emerald-600">{userStats.replies}</div>
                            <div className="text-xs text-muted-foreground">Replies</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-accent/30 border border-accent/50">
                            <div className="text-2xl font-bold text-purple-600">{userStats.likes}</div>
                            <div className="text-xs text-muted-foreground">Likes</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-accent/30 border border-accent/50">
                            <div className="text-2xl font-bold text-orange-600">{userStats.reputation}</div>
                            <div className="text-xs text-muted-foreground">Reputation</div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Profile Views</span>
                            <span className="text-sm font-medium">{userStats.views.toLocaleString()}</span>
                        </div>
                        {userRole === 'instructor' && ( // Only show if user is an instructor
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Courses Created</span>
                                <span className="text-sm font-medium">{userStats.coursesCreated}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Courses Enrolled</span>
                            <span className="text-sm font-medium">{userStats.coursesEnrolled}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}