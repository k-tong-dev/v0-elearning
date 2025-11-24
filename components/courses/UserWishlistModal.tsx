"use client"

import { Button } from "@heroui/react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Heart, Trash2, ExternalLink } from "lucide-react"
import Image from "next/image"
import { UserWishlistEntry } from "@/integrations/strapi/userWishlist"

type WishlistCourse = {
    id: number
    title: string
    description: string
    image: string
    price: string
    level: string
    category: string
    badges?: string[]
    tags?: string[]
    company?: string | null
    instructors?: Array<{ id: string | number; name?: string; avatar?: any }>
}

interface UserWishlistModalProps {
    isOpen: boolean
    onClose: () => void
    wishlists: Array<UserWishlistEntry & { course?: WishlistCourse }>
    onRemove: (courseId: number) => void
    onNavigate?: (courseId: number) => void
    isLoading?: boolean
    isSyncing?: boolean
    isAuthenticated: boolean
}

export function UserWishlistModal({
    isOpen,
    onClose,
    wishlists,
    onRemove,
    onNavigate,
    isLoading = false,
    isSyncing = false,
    isAuthenticated,
}: UserWishlistModalProps) {
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose()
        }
    }

    const renderEmpty = () => (
        <div className="text-center py-8 px-4">
            <Heart className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <p className="text-base font-semibold mb-1 text-slate-900 dark:text-white">
                {isAuthenticated ? "No favorites yet" : "Sign in to save favorites"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-300">
                {isAuthenticated
                    ? "Tap the heart icon on any course to keep it in sync across search filters and devices."
                    : "Create an account or log in to start curating your personalized learning wishlist."}
            </p>
        </div>
    )

    const renderList = () => {
        if (isLoading) {
            return (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-20 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 animate-pulse" />
                    ))}
                </div>
            )
        }

        if (!wishlists.length) {
            return renderEmpty()
        }

        return (
            <div className="max-h-[400px] overflow-y-auto pr-1 space-y-3 scrollbar-hide">
                {wishlists.map((entry) => {
                    const course = entry.course
                    const courseId = course?.id ?? entry.courseId
                    if (!courseId) {
                        return (
                            <div key={entry.id} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 backdrop-blur-lg p-3">
                                <p className="text-sm text-slate-600 dark:text-slate-300">Course data not available.</p>
                            </div>
                        )
                    }
                    return (
                        <div
                            key={entry.id}
                            className="flex gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 backdrop-blur-lg p-3"
                        >
                            <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                                <Image
                                    src={course.preview_url || "/placeholder.svg"}
                                    alt={course.name || "Course preview"}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                                            {course.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-2">
                                            {course.description || "No description"}
                                        </p>
                                    </div>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        className="text-rose-500"
                                        onPress={() => onRemove(courseId)}
                                        isDisabled={isSyncing}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {course.course_categories?.slice(0, 2).map((category) => (
                                        <Badge key={category.id} className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                                            {category.name}
                                        </Badge>
                                    ))}
                                    {course.course_level?.name && (
                                        <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                                            {course.course_level.name}
                                        </Badge>
                                    )}
                                    {course.course_badges?.slice(0, 2).map((badge) => (
                                        <Badge key={badge.id} className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                                            {badge.name}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                    <div className="text-xs text-slate-500 dark:text-slate-300">
                                        {course.company && <p>Company • {course.company}</p>}
                                        {course.instructors && course.instructors.length > 0 && (
                                            <p>
                                                Instructor •{" "}
                                                {course.instructors
                                                    .map((inst) => inst.name)
                                                    .filter(Boolean)
                                                    .join(", ")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="bordered"
                                            className="h-7 text-xs"
                                            onPress={() => onNavigate?.(courseId)}
                                        >
                                            View
                                            <ExternalLink className="w-3.5 h-3.5 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl rounded-3xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-950/80 backdrop-blur-3xl">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <Heart className="w-5 h-5 text-rose-500" />
                        Saved courses
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        Manage the courses you have favorited. Removing an entry instantly updates your filters.
                    </DialogDescription>
                </DialogHeader>
                {renderList()}
            </DialogContent>
        </Dialog>
    )
}

