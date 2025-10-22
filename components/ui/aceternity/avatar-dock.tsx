"use client"

import React, { useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { cn } from "@/utils/utils"

interface AvatarDockProps {
    children: React.ReactNode
    className?: string
}

export function AvatarDock({ children, className }: AvatarDockProps) {
    const mouseX = useMotionValue(Infinity)
    const containerRef = useRef<HTMLDivElement>(null)

    return (
        <motion.div
            ref={containerRef}
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className={cn(
                "relative flex h-24 items-end gap-4 rounded-2xl bg-black/5 px-4 pb-3 pt-4 shadow-2xl backdrop-blur-xl dark:bg-white/10 overflow-x-auto scrollbar-hide",
                className
            )}
            style={{ scrollBehavior: "smooth" }}
        >
            <div className="flex gap-4">
                {React.Children.map(children, (child) => {
                    return React.cloneElement(child as React.ReactElement, {
                        mouseX: mouseX,
                    })
                })}
            </div>
        </motion.div>
    )
}

interface AvatarDockIconProps {
    children: React.ReactNode
    className?: string
    mouseX?: any
    onClick?: () => void
    label?: string
    active?: boolean
}

export function AvatarDockIcon({ children, className, mouseX, onClick, label, active }: AvatarDockIconProps) {
    const ref = useRef<HTMLDivElement>(null)

    const distance = useTransform(mouseX, (val) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
        return val - bounds.x - bounds.width / 2
    })

    const widthSync = useTransform(distance, [-110, 0, 110], [48, 80, 48])
    const width = useSpring(widthSync, { stiffness: 110, damping: 15 })

    const heightSync = useTransform(distance, [-110, 0, 110], [48, 80, 48])
    const height = useSpring(heightSync, { stiffness: 110, damping: 15 })

    const y = useTransform(distance, [-110, 0, 110], [0, 10, 0])
    const ySpring = useSpring(y, { stiffness: 110, damping: 15 })

    return (
        <motion.div
            ref={ref}
            style={{ width, height, y: ySpring }}
            onClick={onClick}
            className={cn(
                "relative flex items-center justify-center rounded-xl bg-white/20 shadow-md transition-colors duration-200",
                active ? "bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-lg shadow-cyan-500/25" : "hover:bg-gray-200/40",
                className
            )}
        >
            {children}
            {label && (
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    whileHover={{ opacity: 1, y: 5 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-10 -top-8 text-xs text-gray-400 bg-black/70 px-2 py-1 rounded-md whitespace-nowrap"
                >
                    {label}
                </motion.span>
            )}
        </motion.div>
    )
}