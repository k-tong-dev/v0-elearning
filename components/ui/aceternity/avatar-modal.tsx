"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
    className?: string
}

export function AvatarModal({
                                  open,
                                  onOpenChange,
                                  children,
                                  className,
                              }: AnimatedModalProps) {
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onOpenChange(false)
        }
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="fixed inset-0 z-[100] flex items-center justify-center  backdrop-blur-md"
                    onClick={handleBackdropClick}
                >
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.8, rotateX: 10 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.8, rotateX: 10 }}
                        transition={{ duration: 0.4, type: "spring", stiffness: 120, damping: 15 }}
                        className={cn(
                            "relative w-full max-w-md mx-auto rounded-3xl bg-gradient-to-br from-white/15 to-black/15 dark:from-cyan-500/20 dark:to-purple-500/20 backdrop-blur-3xl z-[101] p-2",
                            "before:absolute before:inset-[-3px] before:rounded-3xl before:bg-gradient-to-r before:from-cyan-500/60 before:via-purple-500/60 before:to-pink-500/60 before:opacity-30 before:animate-liquid-flow before:transition-opacity before:duration-500 before:pointer-events-none",
                            "after:absolute after:inset-[-6px] after:rounded-3xl after:bg-gradient-to-r after:from-teal-500/40 after:to-blue-500/40 after:opacity-20 after:animate-liquid-flow-delayed after:transition-opacity after:duration-500 after:pointer-events-none",
                            className
                        )}
                        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
                        tabIndex={-1}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}