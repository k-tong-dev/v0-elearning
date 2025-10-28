"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { UserRole } from "@/types/user" // Import UserRole

interface UserSkillsProps {
    skills: string[]
    userRole: UserRole // Pass the user's charactor code
}

export function UserSkills({ skills, userRole }: UserSkillsProps) {
    if (!skills || skills.length === 0) return null

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
        >
            <Card className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Skills
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="bg-emerald-50/20 text-emerald-700 dark:text-emerald-300">
                            {skill}
                        </Badge>
                    ))}
                </CardContent>
            </Card>
        </motion.div>
    )
}