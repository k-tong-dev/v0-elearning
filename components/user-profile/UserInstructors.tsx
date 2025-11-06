"use client"

import React from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GraduationCap, CheckCircle, ExternalLink, Users } from "lucide-react"
import { QuantumAvatar } from "@/components/ui/quantum-avatar"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import { Instructor } from "@/integrations/strapi/instructor"
import { useRouter } from "next/navigation"

interface UserInstructorsProps {
    instructors: Instructor[]
}

export function UserInstructors({ instructors }: UserInstructorsProps) {
    const router = useRouter()

    if (!instructors || instructors.length === 0) {
        return null
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-6"
        >
            <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Instructor Profiles</h3>
                <Badge variant="secondary" className="ml-auto">
                    {instructors.length} {instructors.length === 1 ? 'Profile' : 'Profiles'}
                </Badge>
            </div>

            <div className="space-y-4">
                {instructors.map((instructor, index) => (
                    <motion.div
                        key={instructor.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                    >
                        <QuantumAvatar
                            src={getAvatarUrl(instructor.avatar)}
                            alt={instructor.name}
                            size="lg"
                            variant="quantum"
                            showStatus
                            status={instructor.is_active ? "online" : "offline"}
                            verified={instructor.is_verified}
                            interactive
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {instructor.name}
                                </h4>
                                {instructor.is_verified && (
                                    <CheckCircle className="w-4 h-4 text-blue-500" />
                                )}
                            </div>
                            {instructor.bio && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {instructor.bio}
                                </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant={instructor.is_active ? "default" : "secondary"} className="text-xs">
                                    {instructor.is_active ? "Active" : "Inactive"}
                                </Badge>
                                {instructor.is_verified && (
                                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                                        Verified
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/instructors/${instructor.documentId || instructor.id}`)}
                            className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            View
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}

