"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/utils/utils"

interface SpecialNoticeTagProps {
    isExpanded: boolean
    title: string
    message: string
    linkHref: string
    linkText: string
    icon?: React.ElementType
    className?: string
}

export function SpecialNoticeTag({
                                     isExpanded,
                                     title,
                                     message,
                                     linkHref,
                                     linkText,
                                     icon: Icon = Sparkles,
                                     className,
                                 }: SpecialNoticeTagProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            className={cn(
                "relative w-full overflow-hidden rounded-2xl p-4 shadow-2xl transition-all duration-300",
                "bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-pink-500/20 dark:from-indigo-500/15 dark:via-purple-500/10 dark:to-pink-500/15",
                "backdrop-blur-xl border border-white/40 dark:border-white/25",
                "hover:bg-gradient-to-br hover:from-indigo-500/30 hover:via-purple-500/25 hover:to-pink-500/30 dark:hover:from-indigo-500/25 dark:hover:via-purple-500/15 dark:hover:to-pink-500/25",
                "hover:border-white/50 dark:hover:border-white/35 hover:shadow-3xl",
                className,
            )}
        >
            <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400/20 via-purple-400/15 to-pink-400/20 opacity-0"
                animate={{ opacity: [0, 0.6, 0], scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />

            <div className="relative z-10 flex items-center gap-3">
                <motion.div
                    className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/90 to-purple-500/90 text-white backdrop-blur-md border border-white/40 shadow-xl flex-shrink-0"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                    <Icon className="w-5 h-5 drop-shadow-lg" />
                </motion.div>

                {isExpanded ? (
                    <motion.div
                        className="flex-1 min-w-0"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h4 className="font-semibold text-sm text-foreground leading-tight">{title}</h4>
                        <p className="text-xs text-muted-foreground mb-2 leading-tight">{message}</p>
                        <Link href={linkHref} passHref>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs font-medium text-indigo-400 hover:text-indigo-300 dark:text-purple-300 dark:hover:text-purple-200 transition-colors"
                            >
                                {linkText} <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </Link>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Link href={linkHref} passHref>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-10 h-10 p-0 text-indigo-400 dark:text-purple-300 hover:bg-white/10 border border-transparent hover:border-white/20"
                            >
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}
