"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Loader2, AlertCircle, ArrowRight, ArrowLeft, Sparkles, Camera, Upload, Wand2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { AvatarModal } from "@/components/ui/aceternity/avatar-modal"
import { AvatarSelectionContent } from "./AvatarSelectionContent"

interface AvatarStepProps {
    email: string
    avatarFile: File | null
    avatarPreview: string | null
    onUpdate: (data: { avatarFile: File | null; avatarPreview: string | null; avatarUrl?: string }) => void
    onNext: () => void
    onBack: () => void
    isLoading: boolean
    externalError: string
}

const shimmerVariants = {
    initial: { x: "-100%" },
    animate: { x: ["-100%", "100%"], transition: { duration: 4, repeat: Infinity, ease: "linear" } },
}

export function AvatarStep({
                               email,
                               avatarFile,
                               avatarPreview,
                               onUpdate,
                               onNext,
                               onBack,
                               isLoading,
                               externalError,
                           }: AvatarStepProps) {
    const [currentAvatarFile, setCurrentAvatarFile] = useState(avatarFile)
    const [currentAvatarPreview, setCurrentAvatarPreview] = useState(avatarPreview)
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
    const [isAvatarSaving, setIsAvatarSaving] = useState(false)
    const [internalError, setInternalError] = useState("")

    useEffect(() => {
        setInternalError(externalError)
    }, [externalError])

    useEffect(() => {
        setCurrentAvatarFile(avatarFile)
        setCurrentAvatarPreview(avatarPreview)
    }, [avatarFile, avatarPreview])

    const emailInitial = useMemo(() => (email ? email.charAt(0).toUpperCase() : "U"), [email])

    const handleAvatarSave = async (data: File | string | null) => {
        setIsAvatarSaving(true)
        setInternalError("")
        try {
            let newAvatarFile: File | null = null
            let newAvatarPreview: string | null = null
            let avatarUrl: string | undefined

            if (data instanceof File) {
                newAvatarFile = data
                newAvatarPreview = URL.createObjectURL(data)
                avatarUrl = newAvatarPreview
                toast.success("Avatar ready! It will be uploaded when you continue.", { position: "top-center" })
            } else if (typeof data === "string") {
                newAvatarPreview = data
                newAvatarFile = null
                avatarUrl = data
                toast.success("Avatar template selected!", { position: "top-center" })
            } else {
                newAvatarFile = null
                newAvatarPreview = null
                avatarUrl = undefined
                toast.info("Avatar removed.", { position: "top-center" })
            }

            onUpdate({
                avatarFile: newAvatarFile,
                avatarPreview: newAvatarPreview,
                avatarUrl,
            })
            setCurrentAvatarFile(newAvatarFile)
            setCurrentAvatarPreview(newAvatarPreview)
        } catch (err: any) {
            console.error("Error selecting avatar:", err)
            const errorMessage = err.message || "Failed to select or upload avatar."
            setInternalError(errorMessage)
            toast.error(errorMessage, { position: "top-center" })
        } finally {
            setIsAvatarSaving(false)
        }
    }


    return (
        <motion.section
            initial={{ opacity: 0, y: 25, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/85 dark:bg-slate-950/70 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_25px_100px_-45px_rgba(236,72,153,0.55)]"
        >
            <motion.div
                className="pointer-events-none absolute inset-0"
                animate={{ opacity: [0.6, 0.85, 0.6] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    background:
                        "radial-gradient(circle at 16% 18%, rgba(236,72,153,0.18) 0%, transparent 55%), radial-gradient(circle at 80% 12%, rgba(59,130,246,0.16) 0%, transparent 60%), radial-gradient(circle at 50% 90%, rgba(147,51,234,0.2) 0%, transparent 60%)",
                }}
            />

            <div className="relative flex flex-col gap-8">
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:bg-white/10 dark:text-slate-200">
                                <Sparkles className="h-3 w-3 text-pink-500" /> Step 2 · Avatar
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-semibold leading-tight bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                                Personalize your presence with a signature look.
                            </h2>
                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                                Upload your portrait or choose from our curated templates. Your avatar helps learners recognize you across courses, cohorts, and live sessions.
                            </p>
                        </div>
                        <motion.div
                            initial={{ rotate: -10, scale: 0.85, opacity: 0 }}
                            animate={{ rotate: 0, scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3, type: "spring", stiffness: 220, damping: 18 }}
                            className="self-center rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 p-3 shadow-xl"
                        >
                            <User className="h-10 w-10 text-white" />
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="relative flex flex-col gap-6 rounded-3xl border border-white/40 bg-white/80 p-6 shadow-inner dark:bg-white/10"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 -z-10 rounded-[32px] bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 blur-2xl" />
                            <div
                                className="group relative mx-auto w-48 max-w-full cursor-pointer overflow-hidden rounded-[32px] border border-white/50 bg-gradient-to-br from-white/70 to-white/40 p-1 shadow-lg transition"
                                onClick={() => setIsAvatarModalOpen(true)}
                            >
                                <motion.div
                                    className="absolute inset-0 pointer-events-none rounded-[28px] bg-gradient-to-r from-white/20 via-white/30 to-transparent"
                                    variants={shimmerVariants}
                                    initial="initial"
                                    animate="animate"
                                />
                                <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-100 to-slate-200">
                                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-pink-400/30 to-transparent blur-3xl" />
                                    <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-gradient-to-br from-blue-400/30 to-transparent blur-3xl" />
                                    <div className="relative">
                                        <Avatar className="h-48 w-full rounded-[28px]">
                                            <AvatarImage src={currentAvatarPreview || undefined} alt="User Avatar" className="object-cover" />
                                            <AvatarFallback className="text-6xl font-bold bg-gradient-to-br from-pink-400/30 via-purple-400/30 to-blue-400/30 text-slate-700">
                                                {emailInitial}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 opacity-0 backdrop-blur-md transition duration-300 group-hover:opacity-100">
                                            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-white">
                                                Tap to refresh your look
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3 text-xs text-slate-500 dark:text-slate-300">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-pink-500" /> Use the generator to explore neon gradients or upload your own brand portrait.
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-blue-500" /> We optimize your image for Strapi and cache it for fast dashboard loads.
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="grid gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAvatarModalOpen(true)}
                                    className="h-12 justify-start gap-2 rounded-xl border border-white/60 bg-white/70 text-slate-600 shadow-sm transition hover:border-pink-400 hover:text-pink-500 dark:bg-white/10 dark:text-slate-200"
                                >
                                    <Wand2 className="h-4 w-4" /> Browse templates & gradients
                                </Button>
                                <label
                                    className="flex h-12 cursor-pointer items-center justify-start gap-2 rounded-xl border border-dashed border-white/70 bg-white/60 px-4 text-slate-600 shadow-sm transition hover:border-blue-400 hover:text-blue-500 dark:bg-white/10 dark:text-slate-200"
                                >
                                    <Upload className="h-4 w-4" />
                                    <span className="text-sm font-semibold">Upload from device</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(event) => {
                                            const file = event.target.files?.[0]
                                            if (file) {
                                                handleAvatarSave(file).catch(() => undefined)
                                            }
                                        }}
                                    />
                                </label>
                                {currentAvatarPreview && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="justify-start gap-2 rounded-xl text-slate-500 hover:text-red-500"
                                        onClick={() => handleAvatarSave(null)}
                                        disabled={isAvatarSaving}
                                    >
                                        Remove current avatar
                                    </Button>
                                )}
                            </div>

                            <div className="rounded-2xl border border-white/50 bg-white/70 p-4 text-xs text-slate-500 shadow-sm dark:bg-white/5 dark:text-slate-300">
                                <div className="mb-3 flex items-center gap-2 text-slate-600 dark:text-slate-100">
                                    <Camera className="h-4 w-4 text-blue-500" /> Avatar tips
                                </div>
                                <ul className="space-y-2">
                                    <li>• Square images (at least 512×512) yield the best results.</li>
                                    <li>• Avoid heavy text overlays; keep your face centered.</li>
                                    <li>• You can update this anytime from your dashboard profile.</li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>

                    <AnimatePresence>
                        {internalError && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 shadow-sm dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
                            >
                                <AlertCircle className="h-4 w-4" />
                                {internalError}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Button
                            type="button"
                            onClick={onBack}
                            disabled={isLoading || isAvatarSaving}
                            variant="outline"
                            className="flex-1 h-12 rounded-xl border border-white/60 bg-white/70 text-slate-600 transition hover:bg-white dark:bg-white/5 dark:text-slate-200"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button
                            type="button"
                            onClick={onNext}
                            disabled={isLoading || isAvatarSaving}
                            className="relative flex h-12 flex-1 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
                        >
                            <span className="relative z-10 flex items-center gap-2 text-sm font-semibold">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" /> Saving...
                                    </>
                                ) : (
                                    <>
                                        Next: Character <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </span>
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
                                animate={{ x: ["-100%", "100%"] }}
                                transition={{ duration: 3.4, repeat: Infinity, ease: "linear" }}
                                style={{ opacity: 0.35 }}
                            />
                        </Button>
                    </div>
                </div>

                <motion.aside
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col gap-4 rounded-3xl border border-white/40 bg-white/70 p-5 shadow-inner dark:bg-white/5"
                >
                    <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm dark:bg-white/10">
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Why avatars matter</p>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-200">
                            Your avatar syncs with Strapi’s media library and is used for instructor invites, cohort badges, and community mentions.
                        </p>
                    </div>
                    <div className="space-y-3">
                        {["Instant CDN caching", "Automatic dark-mode adjustments", "Optimized for retina displays"].map((item) => (
                            <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/80 px-3 py-2 text-xs text-slate-500 shadow-sm dark:bg-white/10 dark:text-slate-300">
                                <Sparkles className="h-4 w-4 text-purple-500" /> {item}
                            </div>
                        ))}
                    </div>
                </motion.aside>
            </div>

            <AvatarModal open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen} className="p-0">
                <AvatarSelectionContent
                    currentAvatarUrl={currentAvatarPreview}
                    onSave={handleAvatarSave}
                    onClose={() => setIsAvatarModalOpen(false)}
                    isLoading={isAvatarSaving}
                />
            </AvatarModal>
        </motion.section>
    )
}
