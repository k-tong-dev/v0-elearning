"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Users } from "lucide-react"

interface FollowStatsDisplayProps {
    followers: number
    following: number
}

export function FollowStatsDisplay({ followers, following }: FollowStatsDisplayProps) {
    return (
        <Card className="liquid-glass-card hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
                <div className="flex items-center justify-around">
                    <div className="text-center p-2 rounded-lg transition-colors">
                        <div className="text-xl font-bold text-cyan-600">{followers}</div>
                        <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                    <Separator orientation="vertical" className="h-12" />
                    <div className="text-center p-2 rounded-lg transition-colors">
                        <div className="text-xl font-bold text-emerald-600">{following}</div>
                        <div className="text-xs text-muted-foreground">Following</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}