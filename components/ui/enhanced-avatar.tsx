"use client"

import type React from "react"
import { QuantumAvatar } from "./quantum-avatar"
import defaultAvatar from "@/public/avatars/robotic.png"
import { UserRoleSlug, StrapiMedia } from "@/types/user"

type Charactor = UserRoleSlug | "" // Use UserRoleSlug for charactor type

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

// Map old variants to new quantum variants
const variantMap: Record<string, "quantum" | "holographic" | "neon" | "crystal" | "aurora"> = {
    default: "quantum",
    premium: "aurora",
    instructor: "neon",
    admin: "aurora",
    online: "quantum",
    offline: "quantum",
}

// Map character to status
const characterToStatus = (charactor: Charactor): "online" | "offline" => {
    return charactor ? "online" : "offline"
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
    // Use map to convert old variant to new quantum variant
    const quantumVariant = variantMap[variant] || "quantum"
    // Determine status from isOnline prop or character
    const status = showStatus ? (isOnline ? "online" : "offline") : undefined

    return (
        <QuantumAvatar
            src={src}
            alt={alt}
            fallback={fallback}
            size={size}
            variant={quantumVariant}
            showStatus={showStatus}
            status={status}
            verified={verified}
            level={level}
            className={className}
            onClick={onClick}
            interactive={interactive}
            animated={animated}
            glow={glow}
            borderGradient={borderGradient}
            {...props}
        />
    )
}

// Helper to get avatar URL from StrapiMedia object
const getStrapiMediaUrl = (avatar: StrapiMedia | string | null | undefined, strapiURL: string | undefined): string | null => {
    if (!avatar) return null;
    if (typeof avatar === 'string') return avatar; // Already a URL string
    if (avatar.url) return `${strapiURL}${avatar.url}`;
    return null;
};

export function UserMenuAvatar({
                                   user,
                                   onClick,
                                   size,
                               }: { user: any; onClick?: () => void; size?: "sm" | "md" | "lg" | "xl" | "2xl" }) {
    const strapiURL = process.env.NEXT_PUBLIC_STRAPI_URL;
    const avatarUrl = getStrapiMediaUrl(user?.avatar, strapiURL);

    return (
        <EnhancedAvatar
            src={avatarUrl || defaultAvatar.src} // Use defaultAvatar.src for Image component
            alt={user?.username || "User"}
            fallback={
                user?.username
                    ? user.username
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                    : "U"
            }
            size={size}
            charactor={user?.character?.code || "student"} // Use user.character.code
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
    const strapiURL = process.env.NEXT_PUBLIC_STRAPI_URL;
    const avatarUrl = getStrapiMediaUrl(user?.avatar, strapiURL);

    return (
        <EnhancedAvatar
            src={avatarUrl || defaultAvatar.src}
            alt={user?.username || "User"}
            fallback={
                user?.username
                    ? user.username
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                    : "U"
            }
            size={size}
            charactor={user.character?.code || "student"}
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
    const strapiURL = process.env.NEXT_PUBLIC_STRAPI_URL;
    const avatarUrl = getStrapiMediaUrl(instructor?.avatar, strapiURL);

    return (
        <EnhancedAvatar
            src={avatarUrl || defaultAvatar.src}
            alt={instructor?.username || "User"}
            fallback={
                instructor?.username
                    ? instructor.username
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                    : "U"
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
    const strapiURL = process.env.NEXT_PUBLIC_STRAPI_URL;
    const avatarUrl = getStrapiMediaUrl(user?.avatar, strapiURL);

    return (
        <EnhancedAvatar
            src={avatarUrl || defaultAvatar.src}
            alt={user?.username || "User"}
            fallback={
                user?.username
                    ? user.username
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                    : "U"
            }
            size={size}
            charactor={user.character?.code || "student"}
            showStatus={true}
            isOnline={user.isOnline}
            verified={user.verified}
            interactive={true}
            className="hover:scale-105 transition-transform duration-200"
        />
    )
}