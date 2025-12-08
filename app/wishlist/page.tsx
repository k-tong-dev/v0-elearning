"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@heroui/react"
import { Badge } from "@/components/ui/badge"
import {
    Heart,
    Grid2X2,
    Rows,
    Loader2,
    Bookmark,
    ArrowRight,
    Star,
    Trash2,
} from "lucide-react"
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import { Footer } from "@/components/ui/footers/footer"
import { useAuth } from "@/hooks/use-auth"
import {
    getUserWishlists,
    deleteUserWishlist,
    UserWishlistEntry,
} from "@/integrations/strapi/userWishlist"
import { getPublicCourseCourses, CourseCourse } from "@/integrations/strapi/courseCourse"
import { UserWishlistModal } from "@/components/courses/UserWishlistModal"
import { getAvatarUrl } from "@/lib/getAvatarUrl"

type ViewMode = "card" | "shop"

const resolveMediaUrl = (value?: string | null) => {
    if (!value) return "/placeholder.svg"
    if (value.startsWith("http")) return value
    const base = process.env.NEXT_PUBLIC_STRAPI_URL || ""
    return base ? `${base}${value}` : value
}

const formatDuration = (minutes?: number | null) => {
    if (!minutes || minutes <= 0) return "Self-paced"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (!hours) return `${mins} min`
    return `${hours}h ${mins ? `${mins}m` : ""}`.trim()
}

export default function WishlistPage() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const [entries, setEntries] = useState<UserWishlistEntry[]>([])
    const [courses, setCourses] = useState<CourseCourse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [panelOpen, setPanelOpen] = useState(false)
    const [viewMode, setViewMode] = useState<ViewMode>("card")
    const [isSyncing, setIsSyncing] = useState(false)

    const userDisplayName = user?.fullName || user?.username || user?.email || "Learner"
    const wishlistUserAvatar =
        getAvatarUrl((user as any)?.avatar) ||
        (typeof (user as any)?.avatarUrl === "string" ? (user as any)?.avatarUrl : null)

    useEffect(() => {
        if (!isAuthenticated || !user?.id) {
            setEntries([])
            setCourses([])
            setIsLoading(false)
            return
        }

        const load = async () => {
            setIsLoading(true)
            try {
                const [wishlistData, courseData] = await Promise.all([
                    getUserWishlists(user.id),
                    getPublicCourseCourses({ forceRefresh: true }),
                ])
                setEntries(wishlistData)
                setCourses(courseData)
            } catch (error) {
                console.error("[wishlist] failed to load favorites", error)
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [isAuthenticated, user?.id])

    const wishlistItems = useMemo(() => {
        return entries.map((entry) => ({
            ...entry,
            course: courses.find((course) => course.id === entry.courseId),
        }))
    }, [entries, courses])

    const handleRemove = async (courseId: number) => {
        const entry = entries.find((item) => item.courseId === courseId)
        if (!entry) return
        setIsSyncing(true)
        try {
            await deleteUserWishlist(entry.id)
            setEntries((prev) => prev.filter((item) => item.id !== entry.id))
        } catch (error) {
            console.error("[wishlist] remove failed", error)
        } finally {
            setIsSyncing(false)
        }
    }

    const handleNavigate = (courseId: number) => {
        router.push(`/courses/${courseId}`)
    }

    const handleViewSwitch = (mode: ViewMode) => {
        setViewMode(mode)
        setPanelOpen(true)
    }

    const openPanel = () => setPanelOpen(true)

    const closePanel = () => setPanelOpen(false)

    const renderCardView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {wishlistItems.map((item) => {
                const course = item.course
                const courseId = course?.id ?? item.courseId
                return (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col"
                    >
                        <div className="relative aspect-video">
                            <Image
                                src={resolveMediaUrl(course?.preview_url || course?.image)}
                                alt={course?.name || "Course preview"}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className="object-cover"
                            />
                            {course?.preview_available && (
                                <Badge className="absolute top-3 left-3 bg-emerald-500 text-white border-0">
                                    Preview
                                </Badge>
                            )}
                            <Button
                                size="sm"
                                variant="light"
                                className="absolute top-3 right-3 text-rose-500 bg-white/80"
                                isIconOnly
                                isDisabled={!courseId || isSyncing}
                                onPress={() => courseId && handleRemove(courseId)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-5 flex flex-col gap-4 flex-1">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2">
                                        {course?.name || "Course unavailable"}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-300 line-clamp-2">
                                        {course?.description || "No description provided yet."}
                                    </p>
                                </div>
                                <span className="text-base font-bold text-blue-600 dark:text-blue-300 shrink-0">
                                    {course ? `$${Number(course.Price || 0).toFixed(2)}` : "--"}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {course?.course_badges?.slice(0, 3).map((badge) => (
                                    <Badge key={badge.id} className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                                        {badge.name}
                                    </Badge>
                                ))}
                                {course?.course_tages?.slice(0, 3).map((tag) => (
                                    <Badge key={tag.id} className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                        {tag.name}
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-300">
                                <span>{formatDuration(course?.duration_minutes)}</span>
                                <span className="flex items-center gap-1 text-amber-500">
                                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                    4.5
                                </span>
                            </div>
                            <div className="flex gap-3 mt-auto">
                                <Button
                                    className="flex-1 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold"
                                    onPress={() => courseId && handleNavigate(courseId)}
                                    isDisabled={!courseId}
                                >
                                    Continue course
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )

    const renderShopView = () => (
        <div className="space-y-4">
            {wishlistItems.map((item) => {
                const course = item.course
                const courseId = course?.id ?? item.courseId
                return (
                    <div
                        key={item.id}
                        className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-lg p-4 flex flex-col gap-3 sm:flex-row sm:items-center"
                    >
                        <div className="flex items-center gap-3 flex-1">
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                                <Image
                                    src={resolveMediaUrl(course?.preview_url || course?.image)}
                                    alt={course?.name || "Course preview"}
                                    fill
                                    sizes="96px"
                                    className="object-cover"
                                />
                            </div>
                            <div className="space-y-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                                    {course?.name || "Course unavailable"}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-2">
                                    {course?.description || "No description provided yet."}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {course?.course_categories?.slice(0, 2).map((category) => (
                                        <Badge key={category.id} className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                                            {category.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-sm font-bold text-blue-600 dark:text-blue-300">
                                {course ? `$${Number(course.Price || 0).toFixed(2)}` : "--"}
                            </div>
                            <Button
                                variant="bordered"
                                className="h-9 px-4 text-xs font-semibold"
                                onPress={() => courseId && handleNavigate(courseId)}
                                isDisabled={!courseId}
                            >
                                View
                                <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                            <Button
                                variant="bordered"
                                className="h-9 px-3 text-xs font-semibold text-rose-500 border-rose-500/40"
                                onPress={() => courseId && handleRemove(courseId)}
                                isDisabled={!courseId || isSyncing}
                            >
                                Remove
                            </Button>
                        </div>
                    </div>
                )
            })}
        </div>
    )

    const renderContent = () => {
        if (!isAuthenticated) {
            return (
                <div className="text-center py-24">
                    <Heart className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold mb-2 text-slate-900 dark:text-white">Log in to access your wishlist</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-300 mb-6">
                        Sign in to keep your favorite courses synchronized across devices.
                    </p>
                    <Button
                        className="px-6 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
                        onPress={() => router.push("/login")}
                    >
                        Go to login
                    </Button>
                </div>
            )
        }

        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <p>Loading your saved courses...</p>
                </div>
            )
        }

        if (!wishlistItems.length) {
            return (
                <div className="text-center py-24">
                    <Heart className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold mb-2 text-slate-900 dark:text-white">No favorites yet</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-300 mb-6">
                        Explore courses and tap the heart icon to add them here.
                    </p>
                    <Button
                        className="px-6 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
                        onPress={() => router.push("/courses")}
                    >
                        Browse courses
                    </Button>
                </div>
            )
        }

        return (
            <div className="space-y-6">
                {viewMode === "card" ? renderCardView() : renderShopView()}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-black">
            <HeaderUltra />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Personalized Library
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Wishlist</h1>
                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                {wishlistItems.length} saved
                            </Badge>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-300 max-w-3xl">
                            Toggle between card and shop layouts, or pop open the floating wishlist panel to
                            manage favorites anywhere in the app.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1">
                            <Button
                                size="sm"
                                variant={viewMode === "card" ? "solid" : "light"}
                                className={
                                    viewMode === "card"
                                        ? "bg-slate-900 text-white rounded-full"
                                        : "text-slate-600 rounded-full"
                                }
                                startContent={<Grid2X2 className="w-3.5 h-3.5" />}
                                onPress={() => handleViewSwitch("card")}
                            >
                                Card view
                            </Button>
                            <Button
                                size="sm"
                                variant={viewMode === "shop" ? "solid" : "light"}
                                className={
                                    viewMode === "shop"
                                        ? "bg-slate-900 text-white rounded-full"
                                        : "text-slate-600 rounded-full"
                                }
                                startContent={<Rows className="w-3.5 h-3.5" />}
                                onPress={() => handleViewSwitch("shop")}
                            >
                                Shop view
                            </Button>
                        </div>
                        <Button
                            variant="bordered"
                            className="h-10 rounded-full border-slate-300 dark:border-white/20 text-sm font-semibold"
                            onPress={openPanel}
                        >
                            Open floating panel
                        </Button>
                    </div>
                </div>

                <div id="wishlist-section">{renderContent()}</div>
            </div>
            <Footer />

            <UserWishlistModal
                isOpen={panelOpen}
                onClose={closePanel}
                wishlists={wishlistItems}
                onRemove={handleRemove}
                onNavigate={handleNavigate}
                isLoading={isLoading}
                isSyncing={isSyncing}
                isAuthenticated={isAuthenticated}
                userName={userDisplayName}
                userAvatar={wishlistUserAvatar}
                initialView={viewMode}
                onViewChange={(mode) => setViewMode(mode)}
                onGoToWishlist={() => {
                    document.getElementById("wishlist-section")?.scrollIntoView({ behavior: "smooth" })
                }}
            />
        </div>
    )
}

