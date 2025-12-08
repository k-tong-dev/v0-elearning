"use client"

import React, { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@heroui/react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Zap, Heart } from "lucide-react"

interface CustomFilterModalProps {
    isOpen: boolean
    onClose: () => void
    sortBy: string
    setSortBy: (value: string) => void
    selectedLevel: string
    setSelectedLevel: (value: string) => void
    selectedEducator: string
    setSelectedEducator: (value: string) => void
    showFavorites: boolean
    setShowFavorites: (value: boolean) => void
    levelOptions: string[]
    educators: string[]
    onClearFilters: () => void
}

export function CustomFilterModal({
    isOpen,
    onClose,
    sortBy,
    setSortBy,
    selectedLevel,
    setSelectedLevel,
    selectedEducator,
    setSelectedEducator,
    showFavorites,
    setShowFavorites,
    levelOptions,
    educators,
    onClearFilters,
}: CustomFilterModalProps) {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "auto"
        }
        return () => {
            document.body.style.overflow = "auto"
        }
    }, [isOpen])

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose()
            }
        }
        document.addEventListener("keydown", handleEscape)
        return () => document.removeEventListener("keydown", handleEscape)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="liquid-glass-card border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-white/10">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                                        <Zap className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        Smart Filters
                                    </h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X className="w-4 h-4 text-slate-600 dark:text-gray-400" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                                            Sort By
                                        </label>
                                        <Select value={sortBy} onValueChange={setSortBy}>
                                            <SelectTrigger className="liquid-glass-card border-2 hover:border-blue-300 rounded-xl h-9 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="popular">Most Popular</SelectItem>
                                                <SelectItem value="rating">Highest Rated</SelectItem>
                                                <SelectItem value="price-low">Price: Low to High</SelectItem>
                                                <SelectItem value="price-high">Price: High to Low</SelectItem>
                                                <SelectItem value="newest">Newest</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                                            Level
                                        </label>
                                        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                                            <SelectTrigger className="liquid-glass-card border-2 hover:border-blue-300 rounded-xl h-9 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {levelOptions.map((level) => (
                                                    <SelectItem key={level} value={level} className="text-sm">
                                                        {level === "all" ? "All Levels" : level}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500"></div>
                                            Educator
                                        </label>
                                        <Select value={selectedEducator} onValueChange={setSelectedEducator}>
                                            <SelectTrigger className="liquid-glass-card border-2 hover:border-blue-300 rounded-xl h-9 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {educators.map((educator) => (
                                                    <SelectItem key={educator} value={educator} className="text-sm">
                                                        {educator === "all" ? "All Educators" : educator}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-end">
                                        <Button
                                            variant={showFavorites ? "solid" : "bordered"}
                                            onClick={() => setShowFavorites(!showFavorites)}
                                            className={`h-9 text-sm flex items-center gap-1.5 ${
                                                showFavorites
                                                    ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                                                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                            } rounded-xl`}
                                        >
                                            <Heart className={`w-3.5 h-3.5 ${showFavorites ? "fill-white" : "text-red-500"}`} />
                                            Favorites
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                                    <Button
                                        variant="ghost"
                                        onClick={onClearFilters}
                                        className="text-xs h-8 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        Clear All
                                    </Button>
                                    <Button
                                        onClick={onClose}
                                        className="text-xs h-8 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg"
                                    >
                                        Apply Filters
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}

