"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import { motion } from "framer-motion"

interface UserSkillsProps {
    skills: string[]
}

export function UserSkills({ skills }: UserSkillsProps) {
    if (!skills || skills.length === 0) return null

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
        >
            <Card className="border-2 shadow-md">
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