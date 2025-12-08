"use client"

import { useEffect, useMemo, useState } from "react"
import { Button, Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react"
import { Badge } from "@/components/ui/badge"
import {
    BookOpen,
    Bookmark,
    ExternalLink,
    Heart,
    LayoutGrid,
    Maximize2,
    Minimize2,
    Rows,
    Trash2,
    X,
} from "lucide-react"
import Image from "next/image"
import { UserWishlistEntry } from "@/integrations/strapi/userWishlist"
import { motion } from "framer-motion"
import { cn } from "@/utils/utils"

type WishlistCourse = {
    id?: number
    name?: string
    title?: string
    description?: string
    image?: string
    preview_url?: string | null
    price?: string
    Price?: number
    level?: string
    course_level?: { name?: string }
    course_categories?: Array<{ id: number; name: string }>
    course_badges?: Array<{ id: number; name: string }>
    course_tages?: Array<{ id: number; name: string }>
    instructors?: Array<{ id: string | number; name?: string; avatar?: any }>
    company?: string | null
}

type ViewMode = "card" | "shop"

interface UserWishlistModalProps {
    isOpen: boolean
    onClose: () => void
    wishlists: Array<UserWishlistEntry & { course?: WishlistCourse }>
    onRemove: (courseId: number) => void
    onNavigate?: (courseId: number) => void
    isLoading?: boolean
    isSyncing?: boolean
    isAuthenticated: boolean
    userName?: string | null
    userAvatar?: string | null
    initialView?: ViewMode
    onViewChange?: (mode: ViewMode) => void
    onGoToWishlist?: () => void
}

const viewModes: Array<{ id: ViewMode; label: string; icon: React.ReactNode }> = [
    { id: "card", label: "Card view", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: "shop", label: "Shop view", icon: <Rows className="w-3.5 h-3.5" /> },
]

const resolveCoursePrice = (course?: WishlistCourse) => {
    if (!course) return "--"
    if (typeof course.price === "string") return course.price
    if (typeof course.Price === "number") return `$${course.Price.toFixed(2)}`
    return "--"
}

const resolveCourseTitle = (course?: WishlistCourse) => course?.title || course?.name || "Course unavailable"

const resolveCoursePreview = (course?: WishlistCourse) =>
    course?.preview_url || course?.image || "/placeholder.svg"

export function UserWishlistModal({
    isOpen,
    onClose,
    wishlists,
    onRemove,
    onNavigate,
    isLoading = false,
    isSyncing = false,
    isAuthenticated,
    userName = "Learner",
    userAvatar,
    initialView = "card",
    onViewChange,
    onGoToWishlist,
}: UserWishlistModalProps) {
    const [viewMode, setViewMode] = useState<ViewMode>(initialView)
    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
        setViewMode(initialView)
    }, [initialView])

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setIsFullscreen(false)
            onClose()
        }
    }

    const handleWishlistCTA = () => {
        onClose()
        onGoToWishlist?.()
    }

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode)
        onViewChange?.(mode)
    }

    const renderEmpty = () => (
        <div className="text-center py-8 px-4">
            <Heart className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <p className="text-base font-semibold mb-1 text-slate-900 dark:text-white">
                {isAuthenticated ? "No favorites yet" : "Sign in to save favorites"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-300">
                {isAuthenticated
                    ? "Tap the heart icon on any course to keep it synchronized everywhere."
                    : "Create an account or log in to start curating your personalized learning wishlist."}
            </p>
        </div>
    )

    const renderSkeletons = () => (
        <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-24 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 animate-pulse" />
            ))}
        </div>
    )

    const coursesToRender = useMemo(() => {
        return wishlists.map((entry) => ({
            entry,
            course: entry.course,
            courseId: entry.course?.id ?? entry.courseId,
        }))
    }, [wishlists])

    const renderCardMode = () => (
        <div className={cn("grid gap-3", isFullscreen ? "sm:grid-cols-2" : "grid-cols-1")}>
            {coursesToRender.map(({ entry, course, courseId }) => (
                <div
                    key={entry.id}
                    className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden flex flex-col"
                >
                    <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
                        <Image
                            src={resolveCoursePreview(course)}
                            alt={resolveCourseTitle(course)}
                            fill
                            sizes="(max-width: 640px) 100vw, 50vw"
                            className="object-cover"
                        />
                        {(course?.course_level?.name || course?.level) && (
                            <Badge className="absolute top-3 left-3 bg-blue-500/90 text-white border-0 text-[10px]">
                                {course?.course_level?.name || course?.level}
                            </Badge>
                        )}
                    </div>
                    <div className="p-3 space-y-2 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                                    {resolveCourseTitle(course)}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-2">
                                    {course?.description || "No description provided"}
                                </p>
                            </div>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-300 whitespace-nowrap">
                                {resolveCoursePrice(course)}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {course?.course_categories?.slice(0, 2).map((category) => (
                                <Badge key={category.id} className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                    {category.name}
                                </Badge>
                            ))}
                            {course?.course_badges?.slice(0, 2).map((badge) => (
                                <Badge key={badge.id} className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                                    {badge.name}
                                </Badge>
                            ))}
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1 mt-auto">
                            <Button
                                size="sm"
                                variant="light"
                                className="text-xs font-semibold"
                                onPress={() => courseId && onNavigate?.(courseId)}
                                isDisabled={!courseId}
                            >
                                View
                                <ExternalLink className="w-3.5 h-3.5 ml-1" />
                            </Button>
                            <Button
                                size="sm"
                                variant="light"
                                className="text-xs font-semibold text-rose-500"
                                isDisabled={!courseId || isSyncing}
                                onPress={() => courseId && onRemove(courseId)}
                            >
                                Remove
                                <Trash2 className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )

    const renderShopMode = () => (
        <div className="space-y-3">
            {coursesToRender.map(({ entry, course, courseId }) => (
                <div
                    key={entry.id}
                    className="flex gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl p-3"
                >
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                        <Image
                            src={resolveCoursePreview(course)}
                            alt={resolveCourseTitle(course)}
                            fill
                            sizes="96px"
                            className="object-cover"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                                    {resolveCourseTitle(course)}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-2">
                                    {course?.description || "No description provided"}
                                </p>
                            </div>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-300">
                                {resolveCoursePrice(course)}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {course?.course_tages?.slice(0, 3).map((tag) => (
                                <Badge key={tag.id} className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                            <div className="text-xs text-slate-500 dark:text-slate-300">
                                {course?.instructors && course.instructors.length > 0 && (
                                    <p>Instructor • {course.instructors.map((inst) => inst.name).filter(Boolean).join(", ")}</p>
                                )}
                                {course?.company && <p>Company • {course.company}</p>}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="bordered"
                                    className="h-7 text-xs"
                                    onPress={() => courseId && onNavigate?.(courseId)}
                                    isDisabled={!courseId}
                                >
                                    View
                                </Button>
                                <Button
                                    size="sm"
                                    color="danger"
                                    variant="bordered"
                                    className="h-7 text-xs"
                                    isDisabled={!courseId || isSyncing}
                                    onPress={() => courseId && onRemove(courseId)}
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )

    const renderContent = () => {
        if (isLoading) return renderSkeletons()
        if (!wishlists.length) return renderEmpty()
        return viewMode === "card" ? renderCardMode() : renderShopMode()
    }

    return (
        <Modal
            open={isOpen}
            onOpenChange={handleOpenChange}
            backdrop="blur"
            placement="bottom-right"
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-[60]"
            motionProps={{
                variants: {
                    enter: { opacity: 1, y: 0 },
                    exit: { opacity: 0, y: 40 },
                },
            }}
        >
            <ModalContent className="bg-transparent shadow-none pointer-events-none">
                <motion.div
                    drag={!isFullscreen}
                    dragMomentum={false}
                    dragElastic={0.12}
                    dragConstraints={{ left: -120, right: 120, top: -80, bottom: 80 }}
                    className={cn(
                        "pointer-events-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/85 backdrop-blur-2xl shadow-2xl w-full sm:w-[420px] max-h-[80vh] flex flex-col",
                        isFullscreen && "mx-auto w-full max-w-5xl h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)]"
                    )}
                >
                    <ModalHeader className="flex items-start justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 py-4 px-4">
                        <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-purple-500 text-white flex items-center justify-center shadow-lg">
                                {userAvatar ? (
                                    <Image
                                        src={userAvatar}
                                        alt={userName || "Wishlist user"}
                                        fill
                                        sizes="48px"
                                        className="object-cover rounded-2xl"
                                    />
                                ) : (
                                    <Heart className="w-5 h-5" />
                                )}
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Wishlist hub
                                </p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">{userName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="text-slate-600 dark:text-slate-200"
                                onPress={() => setIsFullscreen((prev) => !prev)}
                                aria-label={isFullscreen ? "Exit full screen" : "Expand panel"}
                            >
                                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </Button>
                            <Button
                                size="sm"
                                variant="light"
                                className="text-xs font-semibold text-blue-600"
                                onPress={handleWishlistCTA}
                            >
                                Wishlist
                            </Button>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                aria-label="Close wishlist panel"
                                onPress={onClose}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </ModalHeader>
                    <ModalBody className="px-4 pt-3 pb-5 overflow-y-auto flex-1">
                        <div className="flex items-center justify-between gap-3 pb-3">
                            <div className="flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-900/60 p-1">
                                {viewModes.map((mode) => (
                                    <button
                                        key={mode.id}
                                        type="button"
                                        onClick={() => handleViewModeChange(mode.id)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                                            viewMode === mode.id
                                                ? "bg-white text-slate-900 shadow-sm"
                                                : "text-slate-500 hover:text-slate-800"
                                        )}
                                    >
                                        {mode.icon}
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-300">
                                {wishlists.length} course{wishlists.length === 1 ? "" : "s"}
                            </div>
                        </div>
                        {renderContent()}
                        <div className="mt-5 space-y-2">
                            <div className="rounded-2xl border border-dashed border-slate-300/60 dark:border-white/15 px-3 py-2 flex items-center justify-between text-xs">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                                        <Bookmark className="w-4 h-4 text-amber-500" />
                                        Blog bookmarks
                                    </p>
                                    <p className="text-slate-500 dark:text-slate-300">Coming soon</p>
                                </div>
                                <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">Planned</Badge>
                            </div>
                            <div className="rounded-2xl border border-dashed border-slate-300/60 dark:border-white/15 px-3 py-2 flex items-center justify-between text-xs">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                                        <BookOpen className="w-4 h-4 text-blue-500" />
                                        Forum bookmarks
                                    </p>
                                    <p className="text-slate-500 dark:text-slate-300">Queued next</p>
                                </div>
                                <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30">Next up</Badge>
                            </div>
                        </div>
                    </ModalBody>
                </motion.div>
            </ModalContent>
        </Modal>
    )
}


