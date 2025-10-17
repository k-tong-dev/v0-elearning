"use client"

import React, {useRef, useEffect, useState} from "react"
import {motion} from "framer-motion"
import {useAuth} from "@/hooks/use-auth"

interface DashboardHeaderProps {
    userName: string
}

export function DashboardHeader({userName}: DashboardHeaderProps) {
    const {user} = useAuth()
    const headerRef = useRef<HTMLDivElement>(null)
    const [pos, setPos] = useState({x: 50, y: 50})

    // Mouse light parallax effect
    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (!headerRef.current) return
            const rect = headerRef.current.getBoundingClientRect()
            const x = ((e.clientX - rect.left) / rect.width) * 100
            const y = ((e.clientY - rect.top) / rect.height) * 100
            setPos({x, y})
        }
        window.addEventListener("mousemove", handleMove)
        return () => window.removeEventListener("mousemove", handleMove)
    }, [])

    return (
        <motion.header
            ref={headerRef}
            initial={{opacity: 0, y: -30}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.8, ease: "easeOut"}}
            className="
        relative mb-10 overflow-hidden rounded-3xl
        border border-white/20
        bg-white/10 backdrop-blur-2xl
        shadow-[0_10px_40px_rgba(0,0,0,0.05)]
        dark:border-white/10
        dark:bg-white/5
        dark:shadow-[0_10px_40px_rgba(255,255,255,0.05)]
      "
            style={{
                background: `radial-gradient(circle at ${pos.x}% ${pos.y}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 70%)`,
            }}
        >
            {/* --- Animated Liquid Blobs --- */}
            <motion.div
                className="absolute -top-24 -left-20 w-[500px] h-[500px] bg-gradient-to-br from-sky-400/40 via-purple-300/30 to-pink-400/40 dark:from-blue-500/20 dark:via-indigo-400/20 dark:to-purple-500/20 blur-3xl rounded-full"
                animate={{
                    x: [0, 40, -40, 0],
                    y: [0, 25, -25, 0],
                    scale: [1, 1.1, 0.95, 1],
                    borderRadius: [
                        "50%",
                        "55% 45% 60% 40%",
                        "45% 55% 40% 60%",
                        "50%"
                    ],
                }}
                transition={{repeat: Infinity, duration: 18, ease: "easeInOut"}}
            />
            <motion.div
                className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-gradient-to-tr from-indigo-400/40 via-blue-300/30 to-teal-400/40 dark:from-indigo-500/20 dark:via-blue-400/20 dark:to-cyan-500/20 blur-3xl rounded-full"
                animate={{
                    x: [0, -30, 30, 0],
                    y: [0, -20, 20, 0],
                    scale: [1, 1.15, 0.9, 1],
                    borderRadius: ["50%", "60% 40% 50% 50%", "40% 60% 50% 50%", "50%"],
                }}
                transition={{repeat: Infinity, duration: 16, ease: "easeInOut"}}
            />

            {/* --- Header Content --- */}
            <div
                className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between p-8 md:p-12 gap-6">
                <div className="flex items-center gap-6">
                    <div>
                        <motion.h1
                            className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-sky-500 via-purple-500 to-pink-400 bg-clip-text text-transparent dark:from-indigo-300 dark:via-blue-300 dark:to-purple-300"
                            initial={{opacity: 0, x: -40}}
                            animate={{opacity: 1, x: 0}}
                            transition={{delay: 0.4, duration: 0.7}}
                        >
                            Welcome, {userName}!
                        </motion.h1>
                        <motion.p
                            className="text-lg text-black/60 dark:text-white/70 mt-2 font-medium"
                            initial={{opacity: 0, x: -40}}
                            animate={{opacity: 1, x: 0}}
                            transition={{delay: 0.5, duration: 0.7}}
                        >
                            Good to see you back. Your dashboard is ready.
                        </motion.p>
                    </div>
                </div>
            </div>
        </motion.header>
    )
}
