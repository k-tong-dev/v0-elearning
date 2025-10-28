"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, MessageCircle, Heart, Users, Star } from "lucide-react"
import { motion } from "framer-motion"
import { UserRole } from "@/types/user" // Import UserRole

interface UserRecentActivityProps {
    recentActivity: Array<{
        action: string
        target: string
        time: string
        icon: React.ElementType
    }>
    userRole: UserRole // Pass the user's charactor code
}

export function UserRecentActivity({ recentActivity, userRole }: UserRecentActivityProps) {
    return (
        <Card className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-accent/30"
                    >
                        <activity.icon className="w-5 h-5 text-muted-foreground shrink-0" />
                        <div className="flex-1">
              <span className="text-sm">
                <span className="text-muted-foreground">{activity.action}</span>{" "}
                  <span className="font-medium">{activity.target}</span>
              </span>
                            <div className="text-xs text-muted-foreground">{activity.time}</div>
                        </div>
                    </motion.div>
                ))}
            </CardContent>
        </Card>
    )
}