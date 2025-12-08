"use client"

import React from "react"
import { motion } from "framer-motion"
import { Sparkles, Tag, Award, FolderOpen } from "lucide-react"
import {GiSkills} from "react-icons/gi";

interface FilterItem {
    id: string
    name: string
    type: "skill" | "category" | "tag" | "badge"
}

interface SlideableFiltersProps {
    items: FilterItem[]
    selectedItems: string[]
    onItemClick: (id: string) => void
    maxItems?: number
}

export function SlideableFilters({
    items,
    selectedItems,
    onItemClick,
    maxItems = 10,
}: SlideableFiltersProps) {
    const displayItems = items.slice(0, maxItems)
    
    const getIcon = (type: FilterItem["type"]) => {
        switch (type) {
            case "skill":
                return <GiSkills className="w-3 h-3" />
            case "category":
                return <FolderOpen className="w-3 h-3" />
            case "tag":
                return <Tag className="w-3 h-3" />
            case "badge":
                return <Award className="w-3 h-3" />
            default:
                return null
        }
    }

    const getGradient = (type: FilterItem["type"], isSelected: boolean) => {
        if (isSelected) {
            switch (type) {
                case "skill":
                    return "bg-gradient-to-r from-blue-500/90 to-cyan-500/90"
                case "category":
                    return "bg-gradient-to-r from-purple-500/90 to-pink-500/90"
                case "tag":
                    return "bg-gradient-to-r from-orange-500/90 to-red-500/90"
                case "badge":
                    return "bg-gradient-to-r from-yellow-500/90 to-amber-500/90"
                default:
                    return "bg-gradient-to-r from-blue-500/90 to-purple-500/90"
            }
        }
        return "bg-white/80 dark:bg-slate-900/10"
    }

    return (
        <div 
            className="flex gap-2 overflow-x-auto p-2 scrollbar-hide scroll-smooth w-full"
            style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth',
                overflowX: 'auto',
                overflowY: 'hidden'
            }}
        >
            {displayItems.map((item) => {
                const isSelected = selectedItems.includes(item.id)
                return (
                    <motion.button
                        key={item.id}
                        onClick={() => onItemClick(item.id)}
                        className={`px-3 py-1.5 backdrop-blur-sm rounded-sm border transition-all ease-in-out origin-center whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 text-xs font-medium ${
                            isSelected
                                ? `${getGradient(item.type, true)} text-white border-transparent shadow-lg`
                                : "text-slate-900 dark:text-white border-slate-200 dark:border-white/20 hover:border-blue-400/50"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 260, damping: 15 }}
                    >
                        {getIcon(item.type)}
                        <span>{item.name}</span>
                    </motion.button>
                )
            })}
        </div>
    )
}

