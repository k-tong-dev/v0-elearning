"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/utils/utils"
import {
    Crown,
    Star,
    Shield,
    Zap,
    CheckCircle,
    User,
    Sparkles,
    Code,
    Palette,
    Briefcase,
    Building2,
} from "lucide-react"
import defaultAvatar from "@/public/avatars/robotic.png"


type Charactor =
    | "instructor"
    | "admin"
    | "expert"
    | "mentor"
    | "student"
    | "job_seeker"
    | "company"
    | "other"
    | "developer"
    | "designer"
    | ""

interface EnhancedAvatarProps {
    src?: string
    alt?: string
    fallback?: string
    size?: "sm" | "md" | "lg" | "xl" | "2xl"
    variant?: "default" | "premium" | "instructor" | "admin" | "online" | "offline"
    showStatus?: boolean
    isOnline?: boolean
    charactor?: Charactor
    level?: number
    verified?: boolean
    className?: string
    onClick?: () => void
    interactive?: boolean
    animated?: boolean
    glow?: boolean
    borderGradient?: boolean
}

const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
    "2xl": "w-24 h-24",
}

const variantStyles = {
    default: "border-2 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl",
    premium:
        "border-2 border-amber-400/40 shadow-[0_8px_32px_rgba(251,191,36,0.3),0_0_24px_rgba(251,191,36,0.2)] backdrop-blur-xl",
    instructor:
        "border-2 border-blue-400/40 shadow-[0_8px_32px_rgba(59,130,246,0.3),0_0_24px_rgba(59,130,246,0.2)] backdrop-blur-xl",
    admin:
        "border-2 border-rose-400/40 shadow-[0_8px_32px_rgba(244,63,94,0.3),0_0_24px_rgba(244,63,94,0.2)] backdrop-blur-xl",
    online:
        "border-2 border-emerald-400/40 shadow-[0_8px_32px_rgba(16,185,129,0.3),0_0_24px_rgba(16,185,129,0.2)] backdrop-blur-xl",
    offline: "border-2 border-gray-400/30 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl",
}

const roleIcons: Record<Charactor, React.ElementType | null> = {
    instructor: Crown,
    admin: Shield,
    expert: Star,
    mentor: Zap,
    student: User,
    job_seeker: Briefcase,
    company: Building2,
    other: Sparkles,
    developer: Code,
    designer: Palette,
    "": null,
}

const roleColors: Record<Charactor, string> = {
    instructor: "from-blue-500 via-indigo-500 to-purple-500",
    admin: "from-rose-500 via-pink-500 to-fuchsia-500",
    expert: "from-amber-500 via-orange-500 to-yellow-500",
    mentor: "from-emerald-500 via-teal-500 to-cyan-500",
    student: "from-slate-500 via-gray-500 to-zinc-500",
    job_seeker: "from-cyan-500 via-blue-500 to-indigo-500",
    company: "from-indigo-500 via-violet-500 to-purple-500",
    other: "from-pink-500 via-rose-500 to-red-500",
    developer: "from-blue-600 via-indigo-600 to-violet-600",
    designer: "from-purple-600 via-fuchsia-600 to-pink-600",
    "": "from-gray-500 to-slate-500",
}

export function EnhancedAvatar({
                                   src,
                                   alt = "User avatar",
                                   fallback,
                                   size = "md",
                                   variant = "default",
                                   showStatus = false,
                                   isOnline = false,
                                   charactor = "",
                                   level,
                                   verified = false,
                                   className,
                                   onClick,
                                   interactive = false,
                                   animated = true,
                                   glow = false,
                                   borderGradient = true,
                                   ...props
                               }: EnhancedAvatarProps) {
    const sizeClass = sizeClasses[size]
    const variantStyle = variantStyles[variant]
    const RoleIcon = roleIcons[charactor]
    const roleColor = roleColors[charactor]

    const avatarContent = (
        <motion.div
            className={cn(
                "inline-flex items-center justify-center",
                sizeClass,
                interactive && "cursor-pointer",
                className,
            )}
            onClick={onClick}
            whileHover={interactive ? { scale: 1.05 } : undefined}
            whileTap={interactive ? { scale: 0.95 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            animate={
                animated
                    ? {
                        y: [0, -2, 0],
                        transition: {
                            duration: 3,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: [0.4, 0.0, 0.2, 1],
                        },
                    }
                    : undefined
            }
        >
            {glow && (
                <motion.div
                    className={cn("absolute inset-0 rounded-full blur-xl opacity-60", `bg-gradient-to-br ${roleColor}`)}
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.4, 0.6, 0.4],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: [0.4, 0.0, 0.2, 1],
                    }}
                />
            )}

            {/* Main avatar */}
            <Avatar
                className={cn(
                    "relative z-10 transition-all duration-300",
                    variantStyle,
                    interactive && "hover:shadow-[0_12px_48px_rgba(0,0,0,0.18)]",
                )}
            >
                <AvatarImage
                    src={src || "/placeholder.svg"}
                    alt={alt}
                    className="object-cover transition-all duration-300 hover:scale-110"
                />
                <AvatarFallback
                    className={cn(
                        "text-primary font-semibold bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl",
                        `bg-gradient-to-br ${roleColor}`,
                    )}
                >
                    {fallback || "U"}
                </AvatarFallback>
            </Avatar>

            {showStatus && (
                <motion.div
                    className={cn(
                        "absolute z-50 -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white/80 backdrop-blur-xl",
                        isOnline ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" : "bg-gray-400",
                    )}
                    animate={
                        isOnline
                            ? {
                                scale: [1, 1.2, 1],
                                opacity: [1, 0.8, 1],
                            }
                            : undefined
                    }
                    transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: [0.4, 0.0, 0.2, 1],
                    }}
                />
            )}

            {verified && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                        delay: 0.3,
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                    }}
                    className="absolute -top-1 -left-1 w-5 h-5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(59,130,246,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-xl border border-white/20"
                >
                    <CheckCircle className="w-2.5 h-2.5 text-white drop-shadow-sm" />
                </motion.div>
            )}

            {level && level > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 20 }}
                    className="absolute -bottom-1 -left-1 bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-[0_4px_16px_rgba(251,191,36,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-xl border border-white/20"
                >
                    {level}
                </motion.div>
            )}

            {variant === "premium" && (
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{
                        rotate: 360,
                        transition: {
                            duration: 8,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        },
                    }}
                >
                    <Sparkles className="w-3 h-3 text-amber-400 absolute top-0 left-1/2 transform -translate-x-1/2 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                </motion.div>
            )}

            {interactive && (
                <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                />
            )}
        </motion.div>
    )

    return avatarContent
}

export function UserMenuAvatar({
                                   user,
                                   onClick,
                                   size,
                               }: { user: any; onClick?: () => void; size?: "sm" | "md" | "lg" | "xl" | "2xl" }) {
    const avatarUrl = user?.avatar?.formats?.medium?.url || user?.avatar?.formats?.small?.url || user?.avatar?.url || null
    return (
        <EnhancedAvatar
            src={process.env.NEXT_PUBLIC_STRAPI_URL + avatarUrl || defaultAvatar}
            alt={user?.username || "User"}
            fallback={
                user?.username
                    ? user.username
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                    : "Error"[0].toUpperCase()
            }
            size={size}
            charactor={user?.charactor?.code || "student"}
            showStatus
            isOnline={user?.isOnline}
            verified={user?.verified}
            interactive
            onClick={onClick}
            className="hover:scale-105 transition-transform duration-200"
        />
    )
}

export function DashboardAvatar({ user, size = "lg" }: { user: any; size?: "sm" | "md" | "lg" | "xl" | "2xl" }) {
    const avatarUrl = user?.avatar?.formats?.medium?.url || user?.avatar?.formats?.small?.url || user?.avatar?.url || null
    return (
        <EnhancedAvatar
            src={process.env.NEXT_PUBLIC_STRAPI_URL + avatarUrl || "@/public/avatars/robotic.png"}
            alt={user?.username || "User"}
            fallback={
                user?.username
                    ? user.username
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                    : user.username[0].toUpperCase() || null
            }
            size={size}
            charactor={user.charactor?.code || "student"}
            showStatus={true}
            isOnline={user.isOnline}
            verified={user.verified}
            level={user.level}
            glow={true}
            animated={true}
        />
    )
}

export function CourseInstructorAvatar({
                                           instructor,
                                           size = "md",
                                       }: { instructor: any; size?: "sm" | "md" | "lg" | "xl" | "2xl" }) {
    const image =
        instructor?.avatar?.formats?.medium?.url ||
        instructor?.avatar?.formats?.small?.url ||
        instructor?.avatar?.url ||
        null
    return (
        <EnhancedAvatar
            src={process.env.NEXT_PUBLIC_STRAPI_URL + image || "@/public/avatars/robotic.png"}
            alt={instructor?.username || "User"}
            fallback={
                instructor?.username
                    ? instructor.username
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                    : instructor.username[0].toUpperCase() || null
            }
            size={size}
            variant="instructor"
            charactor="instructor"
            showStatus={true}
            isOnline={instructor.isOnline}
            verified={instructor.verified}
            interactive={true}
            className="hover:scale-105 transition-transform duration-200"
        />
    )
}

export function ForumUserAvatar({ user, size = "sm" }: { user: any; size?: "sm" | "md" | "lg" | "xl" | "2xl" }) {
    const image = user?.avatar?.formats?.medium?.url || user?.avatar?.formats?.small?.url || user?.avatar?.url || null
    return (
        <EnhancedAvatar
            src={process.env.NEXT_PUBLIC_STRAPI_URL + image || "@/public/avatars/robotic.png"}
            alt={user?.username || "User"}
            fallback={
                user?.username
                    ? user.username
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                    : user.username[0].toUpperCase() || null
            }
            size={size}
            charactor={user.charactor?.code || "student"}
            showStatus={true}
            isOnline={user.isOnline}
            verified={user.verified}
            interactive={true}
            className="hover:scale-105 transition-transform duration-200"
        />
    )
}
