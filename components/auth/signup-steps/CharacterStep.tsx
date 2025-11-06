"use client"

import type React from "react"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, Users, Briefcase, Building2, Sparkles, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Default, UserRoleSlug } from "@/types/user"
import { PageLoading } from "@/components/page-loading"

interface CharacterStepProps {
    selectedCharactor: Default | null
    onUpdate: (charactor: Default) => void
    onNext: () => void
    onBack: () => void
    isLoading: boolean
    charactorOptions: Default[]
    loadingCharactors: boolean
    charactorsError: any
}

const iconMap: Record<UserRoleSlug, React.ElementType> = {
    student: GraduationCap,
    instructor: Users,
    job_seeker: Briefcase,
    company: Building2,
    other: Sparkles,
    authenticated: Users,
    public: Sparkles,
    creator: Sparkles,
    viewer: Sparkles,
}

export function CharacterStep({
                                  selectedCharactor,
                                  onUpdate,
                                  onNext,
                                  onBack,
                                  isLoading,
                                  charactorOptions,
                                  loadingCharactors,
                                  charactorsError,
                              }: CharacterStepProps) {
    useEffect(() => {
        if (charactorsError) {
            toast.error("Failed to load role options. Please try again.", { position: "top-center" })
        }
    }, [charactorsError])

    const handleCharactorSelect = (charactor: Default) => {
        onUpdate(charactor)
    }

    const handleNextClick = () => {
        if (!selectedCharactor) {
            toast.error("Please select a character to continue.", { position: "top-center" })
            return
        }
        onNext()
    }

    if (loadingCharactors) {
        return <PageLoading message="Loading characters..." />
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
                <h2 className="text-4xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    What describes you?
                </h2>
                <p className="text-base text-muted-foreground/80">Choose your role to personalize your experience</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {charactorOptions.map((charactor, index) => {
                    const IconComponent = iconMap[charactor.code as UserRoleSlug] || Sparkles
                    const isSelected = selectedCharactor?.id === charactor.id
                    return (
                        <motion.div
                            key={charactor.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                        >
                            <Card
                                className={`cursor-pointer transition-all duration-300 border-0 overflow-hidden group ${
                                    isSelected
                                        ? "bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 shadow-lg ring-2 ring-blue-500/50"
                                        : "bg-muted/30 hover:bg-muted/50 hover:shadow-md"
                                }`}
                                onClick={() => handleCharactorSelect(charactor)}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                                                isSelected
                                                    ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg"
                                                    : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/10"
                                            }`}
                                        >
                                            <IconComponent className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg mb-1">{charactor.name}</h3>
                                            <p className="text-sm text-muted-foreground/70 line-clamp-1">
                                                {charactor.documentId || "Select this role"}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center"
                                            >
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </motion.div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
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
                    onClick={handleNextClick}
                    disabled={isLoading}
                    className="flex-1 h-14 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 hover:from-blue-600 hover:via-purple-600 hover:to-blue-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            Next: Learning Goals
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    )}
                </Button>
            </motion.div>
        </motion.div>
    )
}
