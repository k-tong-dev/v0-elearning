"use client"

import type React from "react"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Award, Star, Users, Sparkles, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Default } from "@/types/user"
import { PageLoading } from "@/components/page-loading"

interface BadgesStepProps {
    selectedBadges: Default[] | null
    onUpdate: (badge: Default) => void
    onNext: () => void
    onBack: () => void
    isLoading: boolean
    badgeOptions: Default[]
    loadingBadges: boolean
    badgesError: any
}

const iconMap: Record<string, React.ElementType> = {
    active_member: Award,
    community_leader: Users,
    course_creator: Sparkles,
    expert: Star,
    helper: Users,
}

export function BadgesStep({
                               selectedBadges,
                               onUpdate,
                               onNext,
                               onBack,
                               isLoading,
                               badgeOptions,
                               loadingBadges,
                               badgesError,
                           }: BadgesStepProps) {
    useEffect(() => {
        if (badgesError) {
            toast.error("Failed to load badge options. Please try again.", { position: "top-center" })
        }
    }, [badgesError])

    const handleBadgeToggle = (badge: Default) => {
        onUpdate(badge)
    }

    if (loadingBadges) {
        return <PageLoading message="Loading badges..." />
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-2xl mx-auto"
        >
            <div className="text-center space-y-3 mb-8">
                <h2 className="text-4xl font-bold bg-gradient-to-br from-cyan-600 via-emerald-600 to-blue-600 bg-clip-text text-transparent">
                    Select Badges
                </h2>
                <p className="text-base text-muted-foreground/80">Choose badges that represent your achievements</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                {badgeOptions.map((badge, index) => {
                    const IconComponent = iconMap[badge.name.toLowerCase().replace(/\s/g, "_")] || Sparkles
                    const isSelected = selectedBadges?.some((b) => b.id === badge.id)
                    return (
                        <motion.div
                            key={badge.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                        >
                            <Button
                                variant="outline"
                                className={`w-full h-16 justify-start text-left px-5 rounded-2xl border-0 font-medium transition-all duration-300 ${
                                    isSelected
                                        ? "bg-gradient-to-r from-cyan-500/10 via-emerald-500/10 to-blue-500/10 text-foreground shadow-md ring-2 ring-cyan-500/50"
                                        : "bg-muted/30 hover:bg-muted/50 text-foreground/80 hover:text-foreground shadow-sm"
                                }`}
                                onClick={() => handleBadgeToggle(badge)}
                            >
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 transition-all duration-300 ${
                                        isSelected
                                            ? "bg-gradient-to-br from-cyan-500 to-emerald-500 text-white"
                                            : "bg-muted text-muted-foreground"
                                    }`}
                                >
                                    <IconComponent className="w-5 h-5" />
                                </div>
                                <span className="flex-1">{badge.name}</span>
                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center ml-2"
                                    >
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </motion.div>
                                )}
                            </Button>
                        </motion.div>
                    )
                })}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="flex gap-3"
            >
                <Button
                    variant="outline"
                    onClick={onBack}
                    disabled={isLoading}
                    className="flex-1 h-14 rounded-2xl border-0 bg-muted/50 hover:bg-muted/70 font-semibold transition-all duration-300 shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                </Button>
                <Button
                    onClick={onNext}
                    disabled={isLoading}
                    className="flex-1 h-14 bg-gradient-to-r from-cyan-500 via-emerald-500 to-blue-500 hover:from-cyan-600 hover:via-emerald-600 hover:to-blue-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            Finish Setup
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    )}
                </Button>
            </motion.div>
        </motion.div>
    )
}
