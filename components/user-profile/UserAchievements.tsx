"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

interface UserAchievementsProps {
    achievements: Array<{
        id: string
        title: string
        description: string
        unlockedAt: string
        icon: string
    }>
}

export function UserAchievements({ achievements }: UserAchievementsProps) {
    return (
        <div className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement, index) => (
                    <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="glass-enhanced hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="text-4xl">{achievement.icon}</div>
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-lg">{achievement.title}</h4>
                                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                                        <div className="text-xs text-muted-foreground">
                                            Unlocked {achievement.unlockedAt}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}