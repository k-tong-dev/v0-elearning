"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Upload, XCircle, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { AvatarDock, AvatarDockIcon } from "@/components/ui/aceternity/avatar-dock"
import { avatarList } from "@/lib/static-avatars"
import Image from "next/image"
import { cn } from "@/utils/utils"
import defaultAvatar from "@/public/avatars/robotic.png"
import { motion } from "framer-motion"

interface AvatarSelectionContentProps {
    currentAvatarUrl: string | null
    onSave: (file: File | string | null) => Promise<void>
    onClose: () => void
    isLoading: boolean
}

export function AvatarSelectionContent({ currentAvatarUrl, onSave, onClose, isLoading }: AvatarSelectionContentProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [selectedTemplateUrl, setSelectedTemplateUrl] = useState<string | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size exceeds 5MB limit.", { position: "top-center" })
                setSelectedFile(null)
                setSelectedTemplateUrl(null)
                setPreviewUrl(currentAvatarUrl)
                if (fileInputRef.current) fileInputRef.current.value = ""
                return
            }
            setSelectedFile(file)
            setSelectedTemplateUrl(null)
            setPreviewUrl(URL.createObjectURL(file))
        } else {
            setSelectedFile(null)
            setPreviewUrl(selectedTemplateUrl || currentAvatarUrl)
        }
    }

    const handleTemplateSelect = (url: string) => {
        setSelectedTemplateUrl(url)
        setSelectedFile(null)
        setPreviewUrl(url)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleSaveClick = async () => {
        if (selectedFile) {
            await onSave(selectedFile)
        } else if (selectedTemplateUrl) {
            await onSave(selectedTemplateUrl)
        } else {
            await onSave(currentAvatarUrl)
        }
        onClose()
    }

    const handleRemoveAvatar = () => {
        setSelectedFile(null)
        setSelectedTemplateUrl(null)
        setPreviewUrl(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        toast.info("Avatar removed. It will not be set on your profile.", { position: "top-center" })
    }

    const isSaveDisabled = isLoading || (!selectedFile && !selectedTemplateUrl && !currentAvatarUrl)

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="p-6 space-y-6"
        >
            <h3 className="text-3xl font-bold text-center bg-gradient-to-br from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Choose Avatar
            </h3>

            <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                    <Avatar className="relative w-36 h-36 border-4 border-white/10 shadow-2xl rounded-3xl">
                        <AvatarImage src={previewUrl ?? defaultAvatar.src} alt="Avatar Preview" className="object-cover" />
                        <AvatarFallback className="text-5xl font-bold bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                            <ImageIcon className="w-16 h-16 text-muted-foreground" />
                        </AvatarFallback>
                    </Avatar>
                </div>

                <div className="w-full max-w-sm space-y-2">
                    <Label htmlFor="avatar-upload" className="sr-only">
                        Upload Avatar
                    </Label>
                    <div className="relative">
                        <Input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            className="block w-full text-sm text-muted-foreground
                                       file:mr-4 file:py-3 file:px-5
                                       file:rounded-xl file:border-0
                                       file:text-sm file:font-semibold
                                       file:bg-gradient-to-r file:from-blue-500/10 file:to-purple-500/10 file:text-foreground
                                       hover:file:from-blue-500/20 hover:file:to-purple-500/20
                                       file:transition-all file:duration-300
                                       border-0 bg-muted/30 rounded-xl h-14"
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-lg font-semibold text-center text-foreground/90">Or select a template</h4>
                <AvatarDock className="mx-auto max-w-4xl bg-muted/30 backdrop-blur-sm border border-white/10 rounded-2xl p-3">
                    {avatarList.map(({ name, src }) => (
                        <AvatarDockIcon
                            key={name}
                            label={name}
                            active={selectedTemplateUrl === src.src || (selectedFile === null && currentAvatarUrl === src.src)}
                            onClick={() => handleTemplateSelect(src.src)}
                        >
                            <div
                                className={cn(
                                    "relative w-16 h-16 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300",
                                    selectedTemplateUrl === src.src
                                        ? "border-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-110"
                                        : "border-white/10 hover:border-blue-500 hover:scale-105",
                                )}
                            >
                                <Image src={src || "/placeholder.svg"} alt={name} fill className="object-cover" />
                            </div>
                        </AvatarDockIcon>
                    ))}
                </AvatarDock>
            </div>

            <div className="flex justify-end gap-3 mt-6">
                {(selectedFile || selectedTemplateUrl || currentAvatarUrl) && (
                    <Button
                        variant="outline"
                        onClick={handleRemoveAvatar}
                        disabled={isLoading}
                        className="h-12 px-5 rounded-xl border-0 bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700 font-medium transition-all duration-300"
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Remove
                    </Button>
                )}
                <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                    className="h-12 px-5 rounded-xl border-0 bg-muted/50 hover:bg-muted/70 font-medium transition-all duration-300"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSaveClick}
                    disabled={isSaveDisabled}
                    className="h-12 px-5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 hover:from-blue-600 hover:via-purple-600 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Save Avatar
                        </div>
                    )}
                </Button>
            </div>
        </motion.div>
    )
}
