"use client"

import React from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/utils/utils"
import { 
  Crown, 
  Star, 
  Shield, 
  Zap, 
  CheckCircle, 
  Clock,
  User,
  Sparkles
} from "lucide-react"

interface EnhancedAvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
  variant?: "default" | "premium" | "instructor" | "admin" | "online" | "offline"
  showStatus?: boolean
  isOnline?: boolean
  role?: "student" | "instructor" | "admin" | "expert" | "mentor"
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
  "2xl": "w-24 h-24"
}

const variantStyles = {
  default: "border-2 border-primary/20 shadow-md",
  premium: "border-2 border-gradient-to-r from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/25",
  instructor: "border-2 border-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/25",
  admin: "border-2 border-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/25",
  online: "border-2 border-green-500 shadow-lg shadow-green-500/25",
  offline: "border-2 border-gray-400 shadow-md"
}

const roleIcons = {
  instructor: Crown,
  admin: Shield,
  expert: Star,
  mentor: Zap,
  student: User
}

const roleColors = {
  instructor: "from-blue-500 to-purple-500",
  admin: "from-red-500 to-pink-500", 
  expert: "from-yellow-500 to-orange-500",
  mentor: "from-green-500 to-emerald-500",
  student: "from-gray-500 to-slate-500"
}

export function EnhancedAvatar({
  src,
  alt = "User avatar",
  fallback,
  size = "md",
  variant = "default",
  showStatus = false,
  isOnline = false,
  role = "student",
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
  const RoleIcon = roleIcons[role]
  const roleColor = roleColors[role]

  const avatarContent = (
    <motion.div
      className={cn(
        "relative inline-flex items-center justify-center",
        sizeClass,
        interactive && "cursor-pointer",
        className
      )}
      onClick={onClick}
      whileHover={interactive ? { scale: 1.05 } : undefined}
      whileTap={interactive ? { scale: 0.95 } : undefined}
      animate={animated ? {
        y: [0, -2, 0],
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }
      } : undefined}
    >
      {/* Glow effect */}
      {glow && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r glass-enhanced blur-md animate-pulse" />
      )}

      {/* Main avatar */}
      <Avatar 
        className={cn(
          "relative z-10 transition-all duration-300",
          borderGradient && "avatar-border-gradient",
          variantStyle,
          interactive && "hover:shadow-xl hover:shadow-primary/25"
        )}
      >
        <AvatarImage 
          src={src} 
          alt={alt}
          className="object-cover transition-all duration-300 hover:scale-110"
        />
        <AvatarFallback className="text-primary font-semibold">
          {fallback || "U"}
        </AvatarFallback>
      </Avatar>

      {/* Online status indicator */}
      {showStatus && (
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
          isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
        )} />
      )}

      {/* Role badge */}
      {role !== "student" && RoleIcon && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r rounded-full flex items-center justify-center shadow-lg"
          style={{ 
            background: `linear-gradient(45deg, ${roleColor?.includes('blue') ? '#3b82f6' : roleColor?.includes('red') ? '#ef4444' : roleColor?.includes('yellow') ? '#eab308' : roleColor?.includes('green') ? '#10b981' : '#6b7280'}, ${roleColor?.includes('purple') ? '#8b5cf6' : roleColor?.includes('pink') ? '#ec4899' : roleColor?.includes('orange') ? '#f97316' : roleColor?.includes('emerald') ? '#10b981' : '#6b7280'})` 
          }}
        >
          <RoleIcon className="w-2.5 h-2.5 text-white" />
        </motion.div>
      )}

      {/* Verified badge */}
      {verified && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="absolute -top-1 -left-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <CheckCircle className="w-2.5 h-2.5 text-white" />
        </motion.div>
      )}

      {/* Level indicator */}
      {level && level > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute -bottom-1 -left-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg"
        >
          {level}
        </motion.div>
      )}

      {/* Premium sparkle effect */}
      {variant === "premium" && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            rotate: 360,
            transition: {
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }
          }}
        >
          <Sparkles className="w-3 h-3 text-yellow-400 absolute top-0 left-1/2 transform -translate-x-1/2" />
        </motion.div>
      )}

      {/* Hover overlay effect */}
      {interactive && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          whileHover={{ scale: 1.1 }}
        />
      )}
    </motion.div>
  )

  return avatarContent
}

// Specialized avatar components for different use cases
export function UserMenuAvatar({ user, onClick, size }: { user: any; onClick?: () => void; size?: "sm" | "md" | "lg" | "xl" | "2xl" }) {
  return (
    <EnhancedAvatar
      src={user.avatar}
      alt={user.name}
      fallback={user.name.split(' ').map((n: string) => n[0]).join('')}
      size={size}
      variant={user.role === 'instructor' ? 'instructor' : user.role === 'admin' ? 'admin' : 'default'}
      role={user.role}
      showStatus={true}
      isOnline={user.isOnline}
      verified={user.verified}
      interactive={true}
      onClick={onClick}
      className="hover:scale-105 transition-transform duration-200"
    />
  )
}

export function DashboardAvatar({ user, size = "lg" }: { user: any; size?: "sm" | "md" | "lg" | "xl" | "2xl" }) {
  return (
    <EnhancedAvatar
      src={user.avatar}
      alt={user.name}
      fallback={user.name.split(' ').map((n: string) => n[0]).join('')}
      size={size}
      variant={user.role === 'instructor' ? 'instructor' : user.role === 'admin' ? 'admin' : 'default'}
      role={user.role}
      showStatus={true}
      isOnline={user.isOnline}
      verified={user.verified}
      level={user.level}
      glow={true}
      animated={true}
    />
  )
}

export function CourseInstructorAvatar({ instructor, size = "md" }: { instructor: any; size?: "sm" | "md" | "lg" | "xl" | "2xl" }) {
  return (
    <EnhancedAvatar
      src={instructor.avatar}
      alt={instructor.name}
      fallback={instructor.name.split(' ').map((n: string) => n[0]).join('')}
      size={size}
      variant="instructor"
      role="instructor"
      showStatus={true}
      isOnline={instructor.isOnline}
      verified={instructor.verified}
      interactive={true}
      className="hover:scale-105 transition-transform duration-200"
    />
  )
}

export function ForumUserAvatar({ user, size = "sm" }: { user: any; size?: "sm" | "md" | "lg" | "xl" | "2xl" }) {
  return (
    <EnhancedAvatar
      src={user.avatar}
      alt={user.name}
      fallback={user.name.split(' ').map((n: string) => n[0]).join('')}
      size={size}
      variant={user.role === 'instructor' ? 'instructor' : user.role === 'admin' ? 'admin' : 'default'}
      role={user.role}
      showStatus={true}
      isOnline={user.isOnline}
      verified={user.verified}
      interactive={true}
      className="hover:scale-105 transition-transform duration-200"
    />
  )
}
