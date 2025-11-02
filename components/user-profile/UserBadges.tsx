"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy } from "lucide-react"
import { motion } from "framer-motion"

interface BadgeDefinition { // Define the interface here for clarity
    id: string
    name: string
    description: string
    icon: string
    color: string
}

interface UserBadgesProps {
    badges: BadgeDefinition[] // Changed to BadgeDefinition[]
}

export function UserBadges({ badges }: UserBadgesProps) {
    return (
        <Card className="liquid-glass-card">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Badges
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {badges.map((badge,index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className=""
                    >
                        <div key={badge.id} className="flex items-center gap-3 p-3 rounded-lg dark:hover:bg-cyan-100/10 transition-colors border dark:border-cyan-400">
                            <div className={`w-10 h-10 rounded-full ${badge.color} flex items-center justify-center text-white text-lg shadow-md`}>
                                {badge.icon}
                            </div>
                            <div>
                                <div className="text-base font-medium">{badge.name}</div>
                                <div className="text-sm text-muted-foreground">{badge.description}</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </CardContent>
        </Card>
    )
}