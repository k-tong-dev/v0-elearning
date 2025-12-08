"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button, Slider } from "@heroui/react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {Heart, Zap, GripVertical, X, FilterIcon} from "lucide-react"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import Image from "next/image"
import { motion, useDragControls, AnimatePresence, PanInfo } from "framer-motion"
import { createPortal } from "react-dom"

interface InstructorOption {
    id: string | number
    name: string
    avatar?: any
}

interface DraggableFilterModalProps {
    isOpen: boolean
    onClose: () => void
    selectedLevels: string[]
    onLevelsChange: (value: string[]) => void
    selectedCategories: string[]
    onCategoriesChange: (value: string[]) => void
    selectedBadges: string[]
    onBadgesChange: (value: string[]) => void
    selectedTags: string[]
    onTagsChange: (value: string[]) => void
    priceRange: [number, number]
    onPriceRangeChange: (value: number[]) => void
    priceLimit?: number
    showPaidOnly: boolean
    onPaidToggle: (value: boolean) => void
    selectedInstructor: string
    setSelectedInstructor: (value: string) => void
    showFavorites: boolean
    setShowFavorites: (value: boolean) => void
    levelOptions: Array<{ id: string; name: string }>
    categoryOptions: Array<{ id: string; name: string }>
    badgeOptions: Array<{ id: string; name: string }>
    tagOptions: string[]
    instructorOptions: InstructorOption[]
    onClearFilters: () => void
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

/**
 * ModalContent: memoized heavy content.
 * Keeps the exact same markup and functionality as your original body,
 * but avoids re-rendering on every drag frame.
 */
const ModalContent = React.memo(function ModalContent(props: {
    // all props needed
    selectedLevels: string[]
    onLevelsChange: (value: string[]) => void
    selectedCategories: string[]
    onCategoriesChange: (value: string[]) => void
    selectedBadges: string[]
    onBadgesChange: (value: string[]) => void
    selectedTags: string[]
    onTagsChange: (value: string[]) => void
    priceRange: [number, number]
    onPriceRangeChange: (value: number[]) => void
    priceLimit: number
    showPaidOnly: boolean
    onPaidToggle: (value: boolean) => void
    selectedInstructor: string
    setSelectedInstructor: (value: string) => void
    showFavorites: boolean
    setShowFavorites: (value: boolean) => void
    levelOptions: Array<{ id: string; name: string }>
    categoryOptions: Array<{ id: string; name: string }>
    badgeOptions: Array<{ id: string; name: string }>
    tagOptions: string[]
    instructorOptions: InstructorOption[]
    onClearFilters: () => void
}) {
    const {
        selectedLevels,
        onLevelsChange,
        selectedCategories,
        onCategoriesChange,
        selectedBadges,
        onBadgesChange,
        selectedTags,
        onTagsChange,
        priceRange,
        onPriceRangeChange,
        priceLimit,
        showPaidOnly,
        onPaidToggle,
        selectedInstructor,
        setSelectedInstructor,
        showFavorites,
        setShowFavorites,
        levelOptions,
        categoryOptions,
        badgeOptions,
        tagOptions,
        instructorOptions,
        onClearFilters,
    } = props

    // stable helper to emulate your toggleWithAll logic
    const toggleWithAll = useCallback((current: string[], value: string) => {
        if (value === "all") {
            return ["all"]
        }
        const withoutAll = current.filter(item => item !== "all")
        const exists = withoutAll.includes(value)
        const next = exists ? withoutAll.filter(item => item !== value) : [...withoutAll, value]
        return next.length === 0 ? ["all"] : next
    }, [])

    const handleCategoryToggle = useCallback((categoryId: string) => {
        onCategoriesChange(toggleWithAll(selectedCategories, categoryId))
    }, [onCategoriesChange, selectedCategories, toggleWithAll])

    const handleLevelToggle = useCallback((levelId: string) => {
        onLevelsChange(toggleWithAll(selectedLevels, levelId))
    }, [onLevelsChange, selectedLevels, toggleWithAll])

    const handleBadgeToggle = useCallback((badgeId: string) => {
        const next = selectedBadges.includes(badgeId)
            ? selectedBadges.filter(id => id !== badgeId)
            : [...selectedBadges, badgeId]
        onBadgesChange(next)
    }, [selectedBadges, onBadgesChange])

    const handleTagToggle = useCallback((tag: string) => {
        const next = selectedTags.includes(tag)
            ? selectedTags.filter(t => t !== tag)
            : [...selectedTags, tag]
        onTagsChange(next)
    }, [selectedTags, onTagsChange])

    const getPillClasses = useCallback((isSelected: boolean, gradient: string) => {
        const base = "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-250 ease-in-out border flex items-center gap-1.5"
        const inactive = "bg-transparent dark:bg-slate-900/10 text-slate-900 dark:text-white border-slate-200 dark:border-white/20 hover:border-blue-400/50"
        const active = `text-white border-transparent shadow-lg bg-gradient-to-r ${gradient}`
        return `${base} ${isSelected ? active : inactive}`
    }, [])

    return (
        <div className="overflow-y-auto px-5 pb-4 flex-1 scrollbar-hide">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Price Range */}
                    <div className="space-y-3 md:col-span-2">
                        <Slider
                            label="Price Range"
                            value={priceRange}
                            minValue={0}
                            maxValue={priceLimit}
                            step={50}
                            onChange={(value) => onPriceRangeChange(Array.isArray(value) ? value as number[] : [value, value])}
                            formatOptions={{
                                style: "currency",
                                currency: "USD",
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            }}
                            getValue={(value) => {
                                if (Array.isArray(value)) {
                                    return `${formatCurrency(value[0])} - ${formatCurrency(value[1])}`
                                }
                                return formatCurrency(value as number)
                            }}
                            classNames={{
                                base: "w-full",
                                labelWrapper: "mb-2",
                                label: "text-xs font-semibold text-slate-900 dark:text-white",
                                value: "text-xs font-semibold text-slate-600 dark:text-slate-300",
                                trackWrapper: "h-2",
                                track: "bg-slate-200 dark:bg-slate-700",
                                filler: "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500",
                                thumb: "w-5 h-5 border-2 border-white dark:border-slate-800 bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg",
                            }}
                            showSteps={true}
                            showTooltip={true}
                            tooltipValueFormatOptions={{
                                style: "currency",
                                currency: "USD",
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            }}
                        />
                    </div>

                    <div className="flex items-center gap-2 flex-col">
                        {/* Course Level */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                                Course Level
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {levelOptions.map((level) => (
                                    <button
                                        key={level.id}
                                        type="button"
                                        onClick={() => handleLevelToggle(level.id)}
                                        className={getPillClasses(selectedLevels.includes(level.id), "from-purple-500/90 to-pink-500/90")}
                                    >
                                        {level.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Course Category */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                                Course Category
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {categoryOptions.map((category) => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => handleCategoryToggle(category.id)}
                                        className={getPillClasses(selectedCategories.includes(category.id), "from-green-500/90 to-emerald-500/90")}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Course Tags - Multi-select */}
                        {tagOptions.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500"></div>
                                    Course Tags
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {tagOptions.map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => handleTagToggle(tag)}
                                            className={getPillClasses(selectedTags.includes(tag), "from-orange-500/90 to-red-500/90")}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Course Badges - Multi-select */}
                        {badgeOptions.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500"></div>
                                    Course Badges
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {badgeOptions.map((badge) => (
                                        <button
                                            key={badge.id}
                                            type="button"
                                            onClick={() => handleBadgeToggle(badge.id)}
                                            className={getPillClasses(selectedBadges.includes(badge.id), "from-yellow-500/90 to-amber-500/90")}
                                        >
                                            {badge.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-col">
                        {/* Favorites */}
                        <div className="flex items-center justify-end">
                            <Button
                                variant={showFavorites ? "solid" : "bordered"}
                                onClick={() => setShowFavorites(!showFavorites)}
                                className={`h-9 text-sm flex items-center gap-1.5 ${
                                    showFavorites
                                        ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                } rounded-full`}
                            >
                                <Heart className={`w-3.5 h-3.5 ${showFavorites ? "fill-white" : "text-red-500"}`} />
                                Favorites
                            </Button>
                        </div>

                        {/* Paid Switch */}
                        <div className="space-y-2 w-full">
                            <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"></div>
                                Pricing
                            </label>
                            <div className="liquid-glass-card border-2 !rounded-full px-3 py-3 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Paid</span>
                                <Switch checked={showPaidOnly} onCheckedChange={onPaidToggle} />
                            </div>
                        </div>

                        {/* Instructor */}
                        <div className="space-y-2 md:col-span-2  w-full">
                            <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                                Instructor
                            </label>
                            <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                                <SelectTrigger className="liquid-glass-card border-2 hover:border-blue-300 rounded-xl h-9 text-sm relative">
                                    <SelectValue placeholder="Select instructor" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] z-[99999]">
                                    <SelectItem value="all" className="text-sm">All Instructors</SelectItem>
                                    {instructorOptions.map((instructor) => {
                                        const avatarUrl = getAvatarUrl(instructor.avatar)
                                        return (
                                            <SelectItem key={instructor.id} value={instructor.id.toString()} className="text-sm">
                                                <div className="flex items-center gap-2 py-1">
                                                    {avatarUrl ? (
                                                        <Image
                                                            src={avatarUrl}
                                                            alt={instructor.name}
                                                            width={20}
                                                            height={20}
                                                            className="rounded-full object-cover"
                                                            // do not force priority; keep default to avoid extra work
                                                        />
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-semibold">
                                                            {instructor.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span>{instructor.name}</span>
                                                </div>
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer */}
            <div className="sticky bottom-0 flex justify-end gap-2 py-2 border-t border-slate-200 dark:border-white/10 px-5 backdrop-blur-2xl">
                <Button
                    variant="ghost"
                    onClick={onClearFilters}
                    className="text-xs h-8 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    Clear All
                </Button>
                <Button
                    onClick={() => {
                        // close action is handled by outer onClose
                        // keep the same label/intent
                        const ev = new CustomEvent("modal-apply-click")
                        window.dispatchEvent(ev)
                    }}
                    className="text-xs h-8 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-sm"
                >
                    Apply Filters
                </Button>
            </div>
        </div>
    )
})

export function DraggableFilterModal({
                                         isOpen,
                                         onClose,
                                         selectedLevels,
                                         onLevelsChange,
                                         selectedCategories,
                                         onCategoriesChange,
                                         selectedBadges,
                                         onBadgesChange,
                                         selectedTags,
                                         onTagsChange,
                                         priceRange,
                                         onPriceRangeChange,
                                         priceLimit = 5000,
                                         showPaidOnly,
                                         onPaidToggle,
                                         selectedInstructor,
                                         setSelectedInstructor,
                                         showFavorites,
                                         setShowFavorites,
                                         levelOptions,
                                         categoryOptions,
                                         badgeOptions,
                                         tagOptions,
                                         instructorOptions,
                                         onClearFilters,
                                     }: DraggableFilterModalProps) {
    const dragControls = useDragControls()
    const [isMounted, setIsMounted] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)
    const constraintsRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        setIsMounted(true)
        if (typeof document !== "undefined") {
            setPortalRoot(document.getElementById("modal-root") ?? document.body)
        }
        return () => {
            if (typeof document !== "undefined") {
                document.body.style.overflow = "auto"
            }
        }
    }, [])

    useEffect(() => {
        if (typeof document === "undefined") return
        if (!isMounted) return
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "auto"
        }
    }, [isOpen, isMounted])

    // Start drag only when header is pressed (your existing behavior)
    const startDrag = useCallback((event: React.PointerEvent) => {
        const target = event.target as HTMLElement
        if (target.closest("button") || target.closest("select") || target.closest("[role='combobox']")) {
            return
        }
        event.preventDefault()
        dragControls.start(event)
    }, [dragControls])

    // drag event handlers - toggle isDragging so we can throttle expensive CSS
    const onDragStart = useCallback(() => setIsDragging(true), [])
    const onDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, _info?: PanInfo) => {
        // small delay to allow motion settle, then remove expensive styles
        setTimeout(() => setIsDragging(false), 40)
    }, [])

    if (!isMounted || !portalRoot) return null

    // The modal wrapper (heavy styles) will toggle cheaper styles when dragging.
    // We keep the motion element as a tiny wrapper with will-change transform so GPU handles it.
    const modalClasses = `pointer-events-auto liquid-glass-card rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col mx-4 border-white/20
        ${isDragging ? "backdrop-blur-0 bg-white/98 dark:bg-slate-900/98 shadow-md" : "backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 shadow-2xl"}`

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="filter-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[9998] bg-black/20"
                    />
                    {/* Constraint container to limit calculations */}
                    <div ref={constraintsRef} className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
                        {/* Motion wrapper: lightweight, only transforms */}
                        <motion.div
                            drag
                            dragConstraints={constraintsRef}
                            dragControls={dragControls}
                            dragListener={false}
                            dragMomentum={false}
                            dragElastic={0}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            style={{ willChange: "transform", touchAction: "none" }}
                            initial={{ opacity: 0, scale: 0.98, y: 18 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 18 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="pointer-events-auto"
                        >
                            {/* Actual modal container (heavy) - not the node being transformed for layout */}
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className={modalClasses}
                                role="dialog"
                                aria-modal="true"
                                aria-label="Filter modal"
                            >
                                {/* Header (drag handle) */}
                                <div
                                    onPointerDown={startDrag}
                                    className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-white/10 px-5 pt-5 cursor-grab active:cursor-grabbing select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        <GripVertical className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                                        <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                                            <FilterIcon className="w-4 h-4 text-white" />
                                        </div>
                                        <h3 className="text-base uppercase tracking-widest font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                            Filters
                                        </h3>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <X className="w-4 h-4 text-slate-600 dark:text-gray-400" />
                                    </button>
                                </div>

                                {/* Heavy content memoized */}
                                <ModalContent
                                    selectedLevels={selectedLevels}
                                    onLevelsChange={onLevelsChange}
                                    selectedCategories={selectedCategories}
                                    onCategoriesChange={onCategoriesChange}
                                    selectedBadges={selectedBadges}
                                    onBadgesChange={onBadgesChange}
                                    selectedTags={selectedTags}
                                    onTagsChange={onTagsChange}
                                    priceRange={priceRange}
                                    onPriceRangeChange={onPriceRangeChange}
                                    priceLimit={priceLimit}
                                    showPaidOnly={showPaidOnly}
                                    onPaidToggle={onPaidToggle}
                                    selectedInstructor={selectedInstructor}
                                    setSelectedInstructor={setSelectedInstructor}
                                    showFavorites={showFavorites}
                                    setShowFavorites={setShowFavorites}
                                    levelOptions={levelOptions}
                                    categoryOptions={categoryOptions}
                                    badgeOptions={badgeOptions}
                                    tagOptions={tagOptions}
                                    instructorOptions={instructorOptions}
                                    onClearFilters={onClearFilters}
                                />
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        portalRoot
    )
}
