"use client"

import React, { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/utils/utils"
import { 
  Crown, 
  Star, 
  Shield, 
  Zap, 
  CheckCircle,
  Sparkles
} from "lucide-react"

interface RippleAvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
  role?: "student" | "instructor" | "admin" | "expert" | "mentor"
  showStatus?: boolean
  isOnline?: boolean
  verified?: boolean
  className?: string
  onClick?: () => void
  interactive?: boolean
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8", 
  lg: "w-12 h-12",
  xl: "w-16 h-16",
  "2xl": "w-24 h-24"
}

const roleIcons = {
  instructor: Crown,
  admin: Shield,
  expert: Star,
  mentor: Zap,
  student: null
}

const roleColors = {
  instructor: "from-blue-500 to-purple-500",
  admin: "from-red-500 to-pink-500", 
  expert: "from-yellow-500 to-orange-500",
  mentor: "from-green-500 to-purple-500",
  student: "from-gray-500 to-slate-500"
}

export function RippleAvatar({
  src,
  alt = "User avatar",
  fallback,
  size = "md",
  role = "student",
  showStatus = false,
  isOnline = false,
  verified = false,
  className,
  onClick,
  interactive = false,
  ...props
}: RippleAvatarProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const rippleIdRef = useRef(0)

  const sizeClass = sizeClasses[size]
  const RoleIcon = roleIcons[role]
  const roleColor = roleColors[role]

  const createRipple = (event: React.MouseEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const newRipple = {
      id: rippleIdRef.current++,
      x,
      y
    }

    setRipples(prev => [...prev, newRipple])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (interactive) {
      createRipple(e)
      onClick?.()
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative inline-flex items-center justify-center",
        sizeClass,
        interactive && "cursor-pointer",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute pointer-events-none"
            style={{
              left: ripple.x - 20,
              top: ripple.y - 20,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="w-10 h-10 rounded-full border-2 border-blue-500/50" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main avatar */}
      <Avatar className={cn(
        "relative z-10 transition-all duration-300",
        "border-2 border-primary/20 shadow-lg hover:shadow-xl",
        interactive && "hover:scale-105"
      )}>
        <AvatarImage 
          src={src} 
          alt={alt}
          className="object-cover transition-all duration-300"
        />
        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
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
      {RoleIcon && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className={cn(
            "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow-lg",
            `bg-gradient-to-r ${roleColor}`
          )}
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

      {/* Floating sparkles on hover */}
      {interactive && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          whileHover={{
            scale: [1, 1.1, 1],
            transition: { duration: 0.5, repeat: Infinity }
          }}
        >
          <motion.div
            className="absolute top-0 left-1/2 w-1 h-1 bg-blue-500 rounded-full"
            animate={{
              y: [0, -10, 0],
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
            className="absolute top-1/4 right-0 w-1 h-1 bg-blue-500 rounded-full"
            animate={{
              x: [0, 10, 0],
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
              x: [0, -10, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 1
            }}
          />
        </motion.div>
      )}
    </div>
  )
}
