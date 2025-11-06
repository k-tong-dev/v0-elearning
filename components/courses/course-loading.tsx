"use client"

import { motion } from "framer-motion"
import { BookOpen } from "lucide-react"

export function CourseLoading() {
    return (
        <div className="flex flex-col items-center justify-center py-8">
            {/* Animated book icon with liquid glass effect */}
            <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Outer glow ring */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                    }}
                    style={{
                        background: "radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)",
                    }}
                />

                {/* Middle ring */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                        delay: 0.3,
                    }}
                    style={{
                        background: "radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)",
                    }}
                />

                {/* Liquid glass card container */}
                <motion.div
                    className="relative liquid-glass-card w-20 h-20 rounded-2xl flex items-center justify-center"
                    animate={{
                        y: [0, -8, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                    }}
                >
                    {/* Book icon */}
                    <BookOpen className="w-10 h-10 text-blue-500 dark:text-blue-500 relative z-10" />
                    
                    {/* Shimmer effect */}
                    <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                            background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)",
                        }}
                        animate={{
                            x: ["-100%", "100%"],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                        }}
                    />
                </motion.div>
            </motion.div>

            {/* Pulsing dots */}
            <div className="flex gap-2 mt-6">
                {[0, 1, 2].map((index) => (
                    <motion.div
                        key={index}
                        className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 1.2,
                            repeat: Number.POSITIVE_INFINITY,
                            delay: index * 0.2,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>
        </div>
    )
}

