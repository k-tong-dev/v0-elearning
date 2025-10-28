"use client"

import type React from "react"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Briefcase, Sparkles, Heart, GraduationCap, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Default } from "@/types/user"
import { PageLoading } from "@/components/page-loading"

interface LearningGoalsStepProps {
    selectedGoals: Default[] | null
    onUpdate: (goal: Default) => void
    onNext: () => void
    onBack: () => void
    isLoading: boolean
    goalOptions: Default[]
    loadingGoals: boolean
    goalsError: any
}

const iconMap: Record<string, React.ElementType> = {
    career_advancement: Briefcase,
    skill_improvement: Sparkles,
    personal_interest: Heart,
    academic_support: GraduationCap,
}

export function LearningGoalsStep({
                                      selectedGoals,
                                      onUpdate,
                                      onNext,
                                      onBack,
                                      isLoading,
                                      goalOptions,
                                      loadingGoals,
                                      goalsError,
                                  }: LearningGoalsStepProps) {
    useEffect(() => {
        if (goalsError) {
            toast.error("Failed to load learning goal options. Please try again.", { position: "top-center" })
        }
    }, [goalsError])

    const handleGoalToggle = (goal: Default) => {
        onUpdate(goal)
    }

    if (loadingGoals) {
        return <PageLoading message="Loading learning goals..." />
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
                    Learning Goals
                </h2>
                <p className="text-base text-muted-foreground/80">Select all that apply to personalize your journey</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                {goalOptions.map((goal, index) => {
                    const IconComponent = iconMap[goal.code || goal.name.toLowerCase().replace(/\s/g, "_")] || Sparkles
                    const isSelected = selectedGoals?.some((g) => g.id === goal.id)
                    return (
                        <motion.div
                            key={goal.id}
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
                                onClick={() => handleGoalToggle(goal)}
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
                                <span className="flex-1">{goal.name}</span>
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
                            Next: Learning Style
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    )}
                </Button>
            </motion.div>
        </motion.div>
    )
}
