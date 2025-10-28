"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"

interface DashboardHeaderProps {
    userName: string
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
    const { user } = useAuth()
    const headerRef = useRef<HTMLDivElement>(null)
    const [pos, setPos] = useState({ x: 50, y: 50 })
    const [isHovered, setIsHovered] = useState(false)

    const mouseX = useMotionValue(50)
    const mouseY = useMotionValue(50)
    const smoothX = useSpring(mouseX, { damping: 30, stiffness: 200 })
    const smoothY = useSpring(mouseY, { damping: 30, stiffness: 200 })

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (!headerRef.current) return
            const rect = headerRef.current.getBoundingClientRect()
            const x = ((e.clientX - rect.left) / rect.width) * 100
            const y = ((e.clientY - rect.top) / rect.height) * 100
            mouseX.set(x)
            mouseY.set(y)
            setPos({ x, y })
        }
        window.addEventListener("mousemove", handleMove)
        return () => window.removeEventListener("mousemove", handleMove)
    }, [mouseX, mouseY])

    return (
        <motion.header
            ref={headerRef}
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="
        relative mb-10 overflow-hidden
        rounded-[32px]
        border border-white/30
        bg-white/80 backdrop-blur-3xl
        shadow-[0_8px_32px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.8)]
        dark:border-white/[0.08]
        dark:bg-black/40
        dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]
        transition-all duration-500
      "
        >
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-white/60 via-white/0 to-white/0 dark:from-white/10 dark:via-white/0 dark:to-white/0 pointer-events-none" />

            <motion.div
                className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full"
                style={{
                    background:
                        "radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.15) 40%, transparent 70%)",
                    filter: "blur(60px)",
                }}
                animate={{
                    x: [0, 60, -40, 20, 0],
                    y: [0, 40, -30, 50, 0],
                    scale: [1, 1.2, 0.9, 1.1, 1],
                }}
                transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 25,
                    ease: [0.45, 0, 0.55, 1],
                }}
            />

            <motion.div
                className="absolute top-[-150px] right-[-150px] w-[500px] h-[500px] rounded-full"
                style={{
                    background:
                        "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(147, 51, 234, 0.2) 40%, transparent 70%)",
                    filter: "blur(60px)",
                }}
                animate={{
                    x: [0, -50, 40, -30, 0],
                    y: [0, -35, 45, -25, 0],
                    scale: [1, 0.85, 1.15, 0.95, 1],
                }}
                transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 22,
                    ease: [0.45, 0, 0.55, 1],
                }}
            />

            <motion.div
                className="absolute bottom-[-120px] left-[20%] w-[450px] h-[450px] rounded-full"
                style={{
                    background:
                        "radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, rgba(249, 115, 22, 0.15) 40%, transparent 70%)",
                    filter: "blur(60px)",
                }}
                animate={{
                    x: [0, 45, -55, 35, 0],
                    y: [0, -40, 30, -20, 0],
                    scale: [1, 1.1, 0.88, 1.05, 1],
                }}
                transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 28,
                    ease: [0.45, 0, 0.55, 1],
                }}
            />

            <motion.div
                className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none"
                style={{
                    background: `radial-gradient(600px circle at ${pos.x}% ${pos.y}%, rgba(255,255,255,0.6), transparent 40%)`,
                }}
                animate={{
                    opacity: isHovered ? 0.6 : 0.3,
                }}
                transition={{ duration: 0.3 }}
            />

            <motion.div
                className="absolute inset-0 opacity-0 pointer-events-none"
                animate={{
                    opacity: [0, 0.15, 0],
                    background: [
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 60%, transparent 100%)",
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 60%, transparent 100%)",
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 60%, transparent 100%)",
                    ],
                    x: ["-100%", "200%"],
                }}
                transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 8,
                    ease: "linear",
                    repeatDelay: 3,
                }}
            />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between p-10 md:p-14 gap-6">
                <div className="flex items-center gap-6">
                    <div className="space-y-3">
                        <motion.h1
                            className="text-5xl md:text-6xl font-bold tracking-tight leading-none"
                            style={{
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                                filter: "drop-shadow(0 2px 8px rgba(102, 126, 234, 0.3))",
                            }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            Welcome back, {userName}
                        </motion.h1>

                        <motion.p
                            className="text-lg md:text-xl text-gray-700/90 dark:text-white/80 font-medium tracking-wide"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            Your dashboard is ready to go ✨
                        </motion.p>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/20 shadow-lg"
                >
                    <motion.div
                        className="w-2.5 h-2.5 rounded-full bg-emerald-500"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [1, 0.8, 1],
                        }}
                        transition={{
                            repeat: Number.POSITIVE_INFINITY,
                            duration: 2,
                            ease: "easeInOut",
                        }}
                    />
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">All Systems Active</span>
                </motion.div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent" />
        </motion.header>
    )
}
