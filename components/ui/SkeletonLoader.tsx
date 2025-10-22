"use client"

import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/utils/utils"

interface SkeletonLoaderProps {
    count?: number; // Number of lines/blocks to display
    height?: string; // Height of each skeleton line, e.g., "h-4"
    className?: string; // Additional classes for the container
    lineClassName?: string; // Additional classes for each skeleton line
    gap?: string; // Gap between lines, e.g., "gap-2"
}

export function SkeletonLoader({
    count = 3,
    height = "h-4",
    className,
    lineClassName,
    gap = "gap-3"
}: SkeletonLoaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("space-y-3 p-4 rounded-lg bg-background/50 backdrop-blur-lg border border-primary/20", className)}
        >
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    className={cn(
                        "animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md",
                        height,
                        lineClassName,
                        i === 0 && "w-3/4", // Make first line shorter to simulate a title
                        i === 1 && "w-full",
                        i === count - 1 && "w-1/2" // Make last line shorter
                    )}
                    style={{ animationDelay: `${i * 0.05}s` }}
                />
            ))}
        </motion.div>
    )
}