"use client"

import type React from "react"
import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Award, Star, Users, Sparkles, ArrowRight, ArrowLeft, Loader2, Trophy, Medal } from "lucide-react"
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
        <motion.section
            initial={{ opacity: 0, y: 25, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/85 dark:bg-slate-950/70 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_25px_100px_-45px_rgba(236,72,153,0.45)]"
        >
            <motion.div
                className="pointer-events-none absolute inset-0"
                animate={{ opacity: [0.6, 0.85, 0.6] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    background:
                        "radial-gradient(circle at 14% 18%, rgba(236,72,153,0.16) 0%, transparent 55%), radial-gradient(circle at 86% 12%, rgba(59,130,246,0.15) 0%, transparent 60%), radial-gradient(circle at 60% 90%, rgba(124,58,237,0.18) 0%, transparent 60%)",
                }}
            />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:bg-white/10 dark:text-slate-200">
                        <Medal className="h-3.5 w-3.5 text-emerald-500" /> Step 7 · Badges
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-semibold leading-tight bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                        Celebrate the wins you want to showcase.
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                        Choose badges that reflect your experience or aspirations. We’ll highlight them on leaderboards, instructor invites, and community profiles.
                    </p>
                </div>
                <motion.div
                    initial={{ rotate: -8, scale: 0.85, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 220, damping: 18 }}
                    className="self-center rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 p-3 shadow-xl"
                >
                    <Trophy className="h-10 w-10 text-white" />
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="relative mt-8 grid gap-4 md:grid-cols-2"
            >
                {badgeOptions.map((badge, index) => {
                    const IconComponent = iconMap[badge.name.toLowerCase().replace(/\s/g, "_")] || Sparkles
                    const isSelected = selectedBadges?.some((b) => b.id === badge.id)
                    return (
                        <motion.button
                            type="button"
                            key={badge.id}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 * index }}
                            onClick={() => handleBadgeToggle(badge)}
                            className={`relative flex h-24 w-full flex-col justify-between overflow-hidden rounded-3xl border border-white/50 bg-white/80 p-5 text-left shadow-md transition hover:shadow-xl dark:bg-white/10 ${
                                isSelected ? "ring-2 ring-emerald-500/60" : ""
                            }`}
                        >
                            <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100" style={{ background: "linear-gradient(140deg, rgba(236,72,153,0.12) 0%, rgba(59,130,246,0.12) 100%)" }} />
                            <div className="relative flex items-center gap-3">
                                <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg transition ${isSelected ? "bg-gradient-to-br from-emerald-500 to-blue-500" : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500"}`}>
                                    <IconComponent className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-semibold text-slate-800 dark:text-white">{badge.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-300">Displays beside your name in courses and forums</p>
                                </div>
                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 text-white"
                                        >
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="relative flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-400">
                                <div className="h-[1px] flex-1 bg-slate-200/70 dark:bg-white/10" />
                                {isSelected ? "Selected" : "Tap to add"}
                                <div className="h-[1px] flex-1 bg-slate-200/70 dark:bg-white/10" />
                            </div>
                        </motion.button>
                    )
                })}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
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
                    onClick={onNext}
                    disabled={isLoading}
                    className="relative flex h-12 flex-1 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
                >
                    <span className="relative z-10 flex items-center gap-2 text-sm font-semibold">
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" /> Finalizing...
                            </>
                        ) : (
                            <>
                                Finish Setup <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </span>
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-400 via-emerald-400 to-purple-400"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
                        style={{ opacity: 0.35 }}
                    />
                </Button>
            </motion.div>

            <div className="mt-6 grid gap-3 text-xs text-slate-500 dark:text-slate-300 sm:grid-cols-3">
                {["Unlocks community visibility", "Earns XP multipliers", "Featured in instructor search"].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/50 bg-white/75 px-3 py-2 text-center shadow-sm dark:bg-white/10">
                        {item}
                    </div>
                ))}
            </div>
        </motion.section>
    )
}
