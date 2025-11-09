"use client"

import type React from "react"
import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Globe, Target, TrendingUp, Palette, Shield, Cloud, ArrowRight, ArrowLeft, Loader2, Sparkles, Compass } from "lucide-react"
import { toast } from "sonner"
import type { Default } from "@/types/user"
import { PageLoading } from "@/components/page-loading"

interface InterestedStepProps {
    selectedInterests: Default[] | null
    onUpdate: (interest: Default) => void
    onNext: () => void
    onBack: () => void
    isLoading: boolean
    interestOptions: Default[]
    loadingInterests: boolean
    interestsError: any
}

const iconMap: Record<string, React.ElementType> = {
    web_development: Globe,
    ai_ml: Target,
    data_science: TrendingUp,
    design: Palette,
    cybersecurity: Shield,
    cloud_computing: Cloud,
}

export function InterestedStep({
                                   selectedInterests,
                                   onUpdate,
                                   onNext,
                                   onBack,
                                   isLoading,
                                   interestOptions,
                                   loadingInterests,
                                   interestsError,
                               }: InterestedStepProps) {
    useEffect(() => {
        if (interestsError) {
            toast.error("Failed to load interest options. Please try again.", { position: "top-center" })
        }
    }, [interestsError])

    const handleInterestToggle = (interest: Default) => {
        onUpdate(interest)
    }

    if (loadingInterests) {
        return <PageLoading message="Loading interests..." />
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 25, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/85 dark:bg-slate-950/70 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_25px_100px_-45px_rgba(59,130,246,0.45)]"
        >
            <motion.div
                className="pointer-events-none absolute inset-0"
                animate={{ opacity: [0.6, 0.85, 0.6] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    background:
                        "radial-gradient(circle at 15% 18%, rgba(59,130,246,0.15) 0%, transparent 55%), radial-gradient(circle at 85% 12%, rgba(236,72,153,0.15) 0%, transparent 60%), radial-gradient(circle at 55% 90%, rgba(124,58,237,0.18) 0%, transparent 60%)",
                }}
            />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:bg-white/10 dark:text-slate-200">
                        <Compass className="h-3.5 w-3.5 text-blue-500" /> Step 6 · Interests
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-semibold leading-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                        Where do you want to explore next?
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                        Select every topic that excites you—this drives your discovery feed, event invitations, and expert recommendations.
                    </p>
                </div>
                <motion.div
                    initial={{ rotate: -8, scale: 0.85, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 220, damping: 18 }}
                    className="self-center rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-3 shadow-xl"
                >
                    <Globe className="h-10 w-10 text-white" />
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="relative mt-8 grid gap-4 md:grid-cols-2"
            >
                {interestOptions.map((interest, index) => {
                    const IconComponent = iconMap[interest.code || interest.name.toLowerCase().replace(/\s/g, "_")] || Sparkles
                    const isSelected = selectedInterests?.some((i) => i.id === interest.id)
                    return (
                        <motion.button
                            type="button"
                            key={interest.id}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 * index }}
                            onClick={() => handleInterestToggle(interest)}
                            className={`relative flex h-24 w-full flex-col justify-between overflow-hidden rounded-3xl border border-white/50 bg-white/80 p-5 text-left shadow-md transition hover:shadow-xl dark:bg-white/10 ${
                                isSelected ? "ring-2 ring-blue-500/60" : ""
                            }`}
                        >
                            <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100" style={{ background: "linear-gradient(140deg, rgba(59,130,246,0.12) 0%, rgba(236,72,153,0.12) 100%)" }} />
                            <div className="relative flex items-center gap-3">
                                <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg transition ${isSelected ? "bg-gradient-to-br from-blue-500 to-purple-500" : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500"}`}>
                                    <IconComponent className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-semibold text-slate-800 dark:text-white">{interest.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-300">Tailors suggested cohorts and content drops</p>
                                </div>
                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white"
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
                    className="relative flex h-12 flex-1 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
                >
                    <span className="relative z-10 flex items-center gap-2 text-sm font-semibold">
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" /> Processing...
                            </>
                        ) : (
                            <>
                                Next: Badges <ArrowRight className="h-4 w-4" />
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
                {["Curates your discovery feed", "Pairs you with mentors", "Highlights upcoming events"].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/50 bg-white/75 px-3 py-2 text-center shadow-sm dark:bg-white/10">
                        {item}
                    </div>
                ))}
            </div>
        </motion.section>
    )
}
