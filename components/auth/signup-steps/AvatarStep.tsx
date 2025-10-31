"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Loader2, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { AvatarModal } from "@/components/ui/aceternity/avatar-modal"
import { AvatarSelectionContent } from "./AvatarSelectionContent"
import { uploadStrapiFile } from "@/integrations/strapi/utils"

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
                const uploadedAvatar = await uploadStrapiFile(data)
                avatarUrl = uploadedAvatar.url
                toast.success("Avatar uploaded successfully!", { position: "top-center" })
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setInternalError("")
        onNext()
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-md mx-auto"
        >
            <div className="text-center space-y-3 mb-8">
                {/*<motion.div*/}
                {/*    initial={{ scale: 0.8, opacity: 0 }}*/}
                {/*    animate={{ scale: 1, opacity: 1 }}*/}
                {/*    transition={{ delay: 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}*/}
                {/*    className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-emerald-500/10 to-blue-500/10 flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg"*/}
                {/*>*/}
                {/*    <User className="w-10 h-10 text-cyan-500" />*/}
                {/*</motion.div>*/}
                {/*<h2 className="text-4xl font-bold bg-gradient-to-br from-cyan-600 via-emerald-600 to-blue-600 bg-clip-text text-transparent">*/}
                {/*    Choose Avatar*/}
                {/*</h2>*/}
                {/*<p className="text-base text-muted-foreground/80">Personalize your profile (optional)</p>*/}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex flex-col items-center space-y-4"
                >
                    <div onClick={() => setIsAvatarModalOpen(true)} className="relative group cursor-pointer">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-blue-500 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                        <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-3xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-white/10 shadow-xl">
                            {isAvatarSaving ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
                                </div>
                            ) : (
                                <>
                                    <Avatar className="w-full h-full rounded-3xl">
                                        <AvatarImage src={currentAvatarPreview || undefined} alt="User Avatar" className="object-cover" />
                                        <AvatarFallback className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-cyan-500/20 to-emerald-500/20">
                                            {email.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                      Change Avatar
                    </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground/70">Tap to upload or select your avatar</p>
                </motion.div>

                {internalError && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl text-sm text-red-600 dark:text-red-400 flex items-center gap-3"
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{internalError}</span>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="flex gap-3"
                >
                    <Button
                        type="button"
                        onClick={onBack}
                        disabled={isLoading || isAvatarSaving}
                        variant="outline"
                        className="flex-1 h-14 rounded-2xl border-0 bg-muted/50 hover:bg-muted/70 font-semibold transition-all duration-300 shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading || isAvatarSaving}
                        className="flex-1 h-14 bg-gradient-to-r from-cyan-500 via-emerald-500 to-blue-500 hover:from-cyan-600 hover:via-emerald-600 hover:to-blue-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                Next: Character
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        )}
                    </Button>
                </motion.div>
            </form>

            <AvatarModal open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen} className="p-2">
                <AvatarSelectionContent
                    currentAvatarUrl={currentAvatarPreview}
                    onSave={handleAvatarSave}
                    onClose={() => setIsAvatarModalOpen(false)}
                    isLoading={isAvatarSaving}
                />
            </AvatarModal>
        </motion.div>
    )
}
