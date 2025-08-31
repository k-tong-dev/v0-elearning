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
        <Card className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Badges
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {badges.map((badge) => (
                    <div key={badge.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/20 hover:bg-accent/50 transition-colors border border-accent/30">
                        <div className={`w-10 h-10 rounded-full ${badge.color} flex items-center justify-center text-white text-lg shadow-md`}>
                            {badge.icon}
                        </div>
                        <div>
                            <div className="text-base font-medium">{badge.name}</div>
                            <div className="text-sm text-muted-foreground">{badge.description}</div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}