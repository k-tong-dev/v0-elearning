"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/utils/utils"

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
                    animate={{ opacity: 1,backdropFilter: "blur(10px)",}}
                    exit={{ opacity: 0,backdropFilter: "blur(0px)",}}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="fixed inset-0 z-50 flex [transform-style:preserve-3d] items-center justify-center"
                    onClick={handleBackdropClick}
                >
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.8, rotateX: 40,}}
                        animate={{ opacity: 1, scale: 1, rotateX: 0,y: 0, }}
                        exit={{ opacity: 0, scale: 0.8, rotateX: 10 }}
                        transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 15 }}
                        className={cn(
                            "relative w-full max-w-md mx-auto rounded-3xl shadow-md bg-white dark:bg-gray-800 z-[101] p-2",
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