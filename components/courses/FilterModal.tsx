"use client"

import React from "react"
import { Button } from "@heroui/react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, Heart } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface FilterModalProps {
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

export function FilterModal({
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
}: FilterModalProps) {
    if (!isOpen) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="liquid-glass-card border-white/20 max-w-2xl max-h-[90vh] overflow-y-auto p-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                <DialogHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                                <Zap className="w-4 h-4 text-white" />
                            </div>
                            <DialogTitle className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Smart Filters
                            </DialogTitle>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 relative z-10">
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
            </DialogContent>
        </Dialog>
    )
}

