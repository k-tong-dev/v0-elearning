"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { motion } from "framer-motion"

interface UserFollowStatsProps {
    followers: number
    following: number
    userCharactorName: string // Changed to userCharactorName: string
}

export function UserFollowStats({ followers, following, userCharactorName }: UserFollowStatsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
        >
            <Card className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4">
                    <div className="flex items-center justify-around">
                        <div className="text-center cursor-pointer hover:bg-accent/50 p-2 rounded-lg transition-colors">
                            <div className="text-xl font-bold">{followers}</div>
                            <div className="text-xs text-muted-foreground">Followers</div>
                        </div>
                        <Separator orientation="vertical" className="h-12" />
                        <div className="text-center cursor-pointer hover:bg-accent/50 p-2 rounded-lg transition-colors">
                            <div className="text-xl font-bold">{following}</div>
                            <div className="text-xs text-muted-foreground">Following</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}