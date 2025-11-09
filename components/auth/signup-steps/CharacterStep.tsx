"use client"

import type React from "react"
import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { GraduationCap, Users, Briefcase, Building2, Sparkles, ArrowRight, ArrowLeft, Loader2, ShieldCheck, Target } from "lucide-react"
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
        <motion.section
            initial={{ opacity: 0, y: 25, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/85 dark:bg-slate-950/70 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_25px_100px_-45px_rgba(59,130,246,0.55)]"
        >
            <motion.div
                className="pointer-events-none absolute inset-0"
                animate={{ opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    background:
                        "radial-gradient(circle at 12% 25%, rgba(59,130,246,0.16) 0%, transparent 55%), radial-gradient(circle at 88% 12%, rgba(236,72,153,0.15) 0%, transparent 55%), radial-gradient(circle at 70% 85%, rgba(124,58,237,0.18) 0%, transparent 65%)",
                }}
            />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:bg-white/10 dark:text-slate-200">
                        <Target className="h-3.5 w-3.5 text-blue-500" /> Step 3 · Role
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-semibold leading-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                        Tell us how you’ll participate in the community.
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                        Your role unlocks tailored dashboards, collaboration limits, and mentorship recommendations. You can update it later, but we’ll start with what fits best today.
                    </p>
                </div>
                <motion.div
                    initial={{ rotate: -8, scale: 0.85, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 220, damping: 18 }}
                    className="self-center rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-3 shadow-xl"
                >
                    <Users className="h-10 w-10 text-white" />
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="relative mt-8 grid gap-5 lg:grid-cols-2"
            >
                {charactorOptions.map((charactor, index) => {
                    const IconComponent = iconMap[charactor.code as UserRoleSlug] || Sparkles
                    const isSelected = selectedCharactor?.id === charactor.id
                    return (
                        <motion.button
                            type="button"
                            key={charactor.id}
                            initial={{ opacity: 0, y: 25 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                            onClick={() => handleCharactorSelect(charactor)}
                            className={`relative w-full overflow-hidden rounded-3xl border border-white/50 bg-white/75 p-5 text-left shadow-md transition hover:shadow-xl dark:bg-white/10 ${
                                isSelected ? "ring-2 ring-blue-500/60" : ""
                            }`}
                        >
                            <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(236,72,153,0.12) 100%)" }} />
                            <div className="relative flex items-start gap-4">
                                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg transition ${isSelected ? "bg-gradient-to-br from-blue-500 to-purple-500" : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500"}`}>
                                    <IconComponent className="h-7 w-7" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{charactor.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                                        {charactor.documentId || "Select this role"}
                                    </p>
                                </div>
                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Includes curated dashboard widgets
                            </div>
                        </motion.button>
                    )
                })}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
                <Button
                    variant="outline"
                    onClick={onBack}
                    disabled={isLoading}
                    className="flex-1 h-12 rounded-xl border border-white/60 bg-white/70 text-slate-600 transition hover:bg-white dark:bg-white/5 dark:text-slate-200"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                    onClick={handleNextClick}
                    disabled={isLoading}
                    className="relative flex h-12 flex-1 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
                >
                    <span className="relative z-10 flex items-center gap-2 text-sm font-semibold">
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" /> Processing...
                            </>
                        ) : (
                            <>
                                Next: Learning Goals <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </span>
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
                        style={{ opacity: 0.35 }}
                    />
                </Button>
            </motion.div>

            <div className="mt-6 grid gap-3 text-xs text-slate-500 dark:text-slate-300 sm:grid-cols-3">
                {["Switch anytime in your profile", "Controls initial dashboard layout", "Influences free-plan suggestions"].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/50 bg-white/75 px-3 py-2 text-center shadow-sm dark:bg-white/10">
                        {item}
                    </div>
                ))}
            </div>
        </motion.section>
    )
}
