"use client"

import React, { useRef, useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Upload, Camera, Sparkles, Crown, Star, Shield, Zap } from "lucide-react"
import { toast } from "sonner"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

interface EnhancedAvatarUploadFieldProps {
    avatar: string
    name: string
    role?: string
    isUploadingAvatar: boolean
    onAvatarChange: (file: File) => Promise<void>
}

// Mock function to simulate image upload to a storage service
const mockUploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const mockImageUrl = URL.createObjectURL(file)
            console.log("Mock upload successful, URL:", mockImageUrl)
            resolve(mockImageUrl)
        }, 1500)
    })
}

const roleIcons = {
    instructor: Crown,
    admin: Shield,
    expert: Star,
    mentor: Zap,
    student: null
}

export function EnhancedAvatarUploadField({
    avatar,
    name,
    role = "student",
    isUploadingAvatar,
    onAvatarChange,
}: EnhancedAvatarUploadFieldProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovered, setIsHovered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    // Motion values for smooth cursor tracking
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const springX = useSpring(mouseX, { stiffness: 150, damping: 15 })
    const springY = useSpring(mouseY, { stiffness: 150, damping: 15 })

    // Transform values for the floating elements
    const rotateX = useTransform(springY, [-300, 300], [15, -15])
    const rotateY = useTransform(springX, [-300, 300], [-15, 15])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                const centerX = rect.left + rect.width / 2
                const centerY = rect.top + rect.height / 2
                
                const x = (e.clientX - centerX) / 10
                const y = (e.clientY - centerY) / 10
                
                mouseX.set(x)
                mouseY.set(y)
                setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
            }
        }

        const container = containerRef.current
        if (container) {
            container.addEventListener('mousemove', handleMouseMove)
            return () => container.removeEventListener('mousemove', handleMouseMove)
        }
    }, [mouseX, mouseY])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            toast.loading("Uploading avatar...", { id: "avatar-upload" })
            try {
                const imageUrl = await mockUploadImage(file)
                await onAvatarChange(file)
                toast.success("Avatar uploaded successfully!", { id: "avatar-upload" })
            } catch (error) {
                console.error("Failed to upload avatar:", error)
                toast.error("Failed to upload avatar.", { id: "avatar-upload" })
            }
        }
    }

    const handleButtonClick = () => {
        fileInputRef.current?.click()
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0]
            if (file.type.startsWith('image/')) {
                handleFileChange({ target: { files: [file] } } as any)
            }
        }
    }

    const RoleIcon = roleIcons[role as keyof typeof roleIcons]

    return (
        <motion.div
            ref={containerRef}
            className="relative flex flex-col items-center gap-6 p-8 rounded-2xl bg-gradient-to-br from-background via-background to-accent/5 border-2 border-dashed border-primary/20 hover:border-primary/40 transition-all duration-300"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                perspective: "1000px",
                transformStyle: "preserve-3d"
            }}
            animate={{
                scale: isDragging ? 1.05 : 1,
                borderColor: isDragging ? "hsl(var(--primary))" : undefined
            }}
        >
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <motion.div
                    className="absolute top-4 right-4 w-2 h-2 bg-cyan-400/30 rounded-full"
                    animate={{
                        y: [0, -10, 0],
                        opacity: [0.3, 0.8, 0.3]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-emerald-400/40 rounded-full"
                    animate={{
                        y: [0, -8, 0],
                        opacity: [0.4, 0.9, 0.4]
                    }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                />
                <motion.div
                    className="absolute top-1/2 left-4 w-1 h-1 bg-purple-400/50 rounded-full"
                    animate={{
                        x: [0, 20, 0],
                        opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2
                    }}
                />
            </div>

            {/* Main avatar container with 3D effects */}
            <motion.div
                className="relative"
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d"
                }}
            >
                {/* Glow effect */}
                <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 blur-xl"
                    animate={{
                        scale: isHovered ? [1, 1.2, 1] : 1,
                        opacity: isHovered ? [0.3, 0.6, 0.3] : 0.3
                    }}
                    transition={{
                        duration: 2,
                        repeat: isHovered ? Infinity : 0
                    }}
                />

                {/* Avatar with enhanced styling */}
                <motion.div
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Avatar className="w-32 h-32 border-4 border-primary/30 shadow-2xl avatar-border-gradient relative overflow-hidden">
                        <AvatarImage 
                            src={avatar || "/placeholder-user.jpg"} 
                            className="object-cover transition-all duration-500 hover:scale-110"
                        />
                        <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/20 to-accent/20">
                            {name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                        
                        {/* Animated border ring */}
                        <motion.div
                            className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500"
                            animate={{
                                rotate: [0, 360],
                                opacity: isHovered ? [0.5, 1, 0.5] : 0
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            style={{
                                background: "conic-gradient(from 0deg, #06b6d4, #10b981, #06b6d4, #8b5cf6, #06b6d4)"
                            }}
                        />
                    </Avatar>

                    {/* Role badge */}
                    {RoleIcon && (
                        <motion.div
                            className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                            <RoleIcon className="w-4 h-4 text-white" />
                        </motion.div>
                    )}

                    {/* Online status indicator */}
                    <motion.div
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-background rounded-full"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.8, 1, 0.8]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </motion.div>

                {/* Floating particles around avatar */}
                {isHovered && (
                    <>
                        <motion.div
                            className="absolute top-0 left-1/2 w-1 h-1 bg-cyan-400 rounded-full"
                            animate={{
                                y: [0, -20, 0],
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: 0
                            }}
                        />
                        <motion.div
                            className="absolute top-1/4 right-0 w-1 h-1 bg-emerald-400 rounded-full"
                            animate={{
                                x: [0, 20, 0],
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: 0.5
                            }}
                        />
                        <motion.div
                            className="absolute bottom-1/4 left-0 w-1 h-1 bg-purple-400 rounded-full"
                            animate={{
                                x: [0, -20, 0],
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: 1
                            }}
                        />
                    </>
                )}
            </motion.div>

            {/* User info */}
            <motion.div
                className="text-center space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                    {name}
                </h3>
                <p className="text-sm text-muted-foreground capitalize">
                    {role} • Online
                </p>
            </motion.div>

            {/* Upload controls */}
            <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                {/* Hidden file input */}
                <Input
                    id="avatar-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploadingAvatar}
                    ref={fileInputRef}
                />

                {/* Upload button */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={handleButtonClick}
                        disabled={isUploadingAvatar}
                        className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 hover:from-cyan-500/20 hover:to-emerald-500/20 hover:border-cyan-500/50 transition-all duration-300"
                    >
                        {isUploadingAvatar ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Camera className="w-5 h-5 mr-2" />
                                Change Avatar
                            </>
                        )}
                    </Button>
                </motion.div>

                {/* Drag and drop hint */}
                <motion.p
                    className="text-xs text-muted-foreground text-center"
                    animate={{
                        opacity: isDragging ? 1 : 0.6
                    }}
                >
                    {isDragging ? "Drop image here" : "Drag & drop or click to upload"}
                </motion.p>
            </motion.div>

            {/* Decorative elements */}
            <motion.div
                className="absolute top-2 left-2 w-8 h-8 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 rounded-full flex items-center justify-center"
                animate={{
                    rotate: [0, 360],
                    scale: isHovered ? [1, 1.1, 1] : 1
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                <Sparkles className="w-4 h-4 text-cyan-500" />
            </motion.div>
        </motion.div>
    )
}
