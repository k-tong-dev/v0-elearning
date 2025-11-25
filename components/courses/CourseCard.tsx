"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@heroui/react"
import { Star, Clock, Users, BookOpen, Flame, Heart, Building2, Award, Tag as TagIcon, Play, Edit, Eye, Sparkles, ShoppingCart } from "lucide-react"
import Image from "next/image"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarGroup } from "@heroui/react"
import ReactPlayer from "react-player"
import { CoursePreview, getCoursePreviewUrl } from "@/integrations/strapi/coursePreview"
import { motion } from "framer-motion"

interface InstructorSummary {
    id: string | number
    name?: string
    avatar?: any
}

interface CourseCardProps {
    course: {
        id: number
        title: string
        description: string
        image: string
        price: string
        priceValue?: number
        originalPrice?: string
        rating: number
        students: number
        duration: string
        level: string
        category: string
        educator: string
        educatorId: string
        tags: string[]
        trending?: boolean
        bestseller?: boolean
        discount?: string
        lectures?: number
        projects?: number
        badges?: string[]
        company?: string | null
        companyAvatar?: string | null
        instructors?: InstructorSummary[]
        preview_available?: boolean
        preview_url?: string | null
        course_preview?: CoursePreview | null
        is_paid?: boolean
    }
    onCourseClick?: (courseId: number) => void
    onToggleFavorite?: (courseId: number) => void
    onEnrollClick?: (courseId: number) => void
    onOpenWishlist?: () => void
    onAddToCart?: (courseId: number) => void
    onEdit?: (courseId: number) => void
    onView?: (courseId: number) => void
    isFavorite?: boolean
    isInCart?: boolean
    showEditButton?: boolean
    variant?: "default" | "dashboard"
}

const getInstructorInitials = (name?: string) => {
    if (!name) return "IN"
    const letters = name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    return letters.slice(0, 2) || "IN"
}

// Preview Display Component
const CoursePreviewDisplay = ({ 
    course, 
    preview, 
    previewUrl 
}: { 
    course: { id: number; title: string }
    preview?: CoursePreview | null
    previewUrl?: string | null
}) => {
    const playerRef = useRef<any>(null)
    const videoElementRef = useRef<HTMLVideoElement | null>(null)
    const [hasError, setHasError] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        let isActive = true
        setIsMounted(true)
        
        const timer = setTimeout(() => {
            if (isActive) {
                setIsPlaying(true)
            }
        }, 500)

        return () => {
            isActive = false
            clearTimeout(timer)
            setIsMounted(false)
            setIsPlaying(false)
            
            if (playerRef.current) {
                try {
                    const player = playerRef.current as any
                    if (player.setPlaying) {
                        player.setPlaying(false)
                    }
                    if (player.getInternalPlayer) {
                        const internalPlayer = player.getInternalPlayer()
                        if (internalPlayer && typeof internalPlayer.pause === 'function') {
                            try {
                                internalPlayer.pause()
                            } catch (e) {
                                // Ignore pause errors
                            }
                        }
                    }
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
            if (videoElementRef.current) {
                try {
                    videoElementRef.current.pause()
                    videoElementRef.current.currentTime = 0
                } catch (err) {
                    // ignore cleanup errors
                }
            }
        }
    }, [])

    const extractedUrl = getCoursePreviewUrl(preview) || previewUrl
    const previewType = preview?.types

    // Simple placeholder when no preview - less colorful
    if (!extractedUrl) {
        return (
            <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden">
                <BookOpen className="w-16 h-16 text-slate-400 dark:text-slate-600" />
            </div>
        )
    }

    if (previewType === "image") {
        return (
            <div className="relative aspect-[16/9] w-full overflow-hidden">
                <img
                    src={extractedUrl}
                    alt={course.title || "Course preview"}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={() => setHasError(true)}
                />
                {hasError && (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-slate-400 dark:text-slate-600" />
                    </div>
                )}
                {/* Minimal overlay - only at bottom for text readability */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>
        )
    }

    const isStreamingVideo = extractedUrl.includes('youtube.com') || 
                      extractedUrl.includes('youtu.be') || 
                      extractedUrl.includes('vimeo.com')
    const isDirectVideoFile = extractedUrl.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i) !== null || (previewType === "video" && !isStreamingVideo)
    const isImageUrl = extractedUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)
    const shouldLimitTo30s = (isStreamingVideo || isDirectVideoFile || previewType === "video") && !isImageUrl

    if (isImageUrl) {
        return (
            <div className="relative aspect-[16/9] w-full overflow-hidden">
                <img
                    src={extractedUrl}
                    alt={course.title || "Course preview"}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={() => setHasError(true)}
                />
                {hasError && (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-slate-400 dark:text-slate-600" />
                    </div>
                )}
                {/* Minimal overlay - only at bottom for text readability */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>
        )
    } else if (isDirectVideoFile) {
        return (
            <div className="relative aspect-[16/9] w-full bg-black overflow-hidden">
                <video
                    ref={videoElementRef}
                    src={extractedUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls={false}
                    onTimeUpdate={(event) => {
                        if (!shouldLimitTo30s) return
                        const videoEl = event.currentTarget
                        if (videoEl.currentTime >= 30) {
                            videoEl.currentTime = 0
                        }
                    }}
                    onCanPlay={() => setHasError(false)}
                    onError={(event) => {
                        setHasError(true)
                        try {
                            event?.currentTarget?.pause?.()
                        } catch (err) {
                            // ignore
                        }
                    }}
                />
                {hasError && (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-slate-400 dark:text-slate-600" />
                    </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>
        )
    } else if (isStreamingVideo || previewType === "video" || previewType === "url") {
        return (
            <div className="relative aspect-[16/9] w-full bg-black overflow-hidden">
                {isMounted && (
                    <ReactPlayer
                        ref={playerRef}
                        src={extractedUrl}
                        playing={isPlaying && isMounted}
                        loop={true}
                        muted={true}
                        controls={false}
                        width="100%"
                        height="100%"
                        style={{ position: 'absolute', top: 0, left: 0 }}
                        config={{
                            youtube: {
                                playerVars: {
                                    autoplay: 0,
                                    controls: 0,
                                    loop: 1,
                                    start: 0,
                                    end: shouldLimitTo30s ? 30 : undefined,
                                    modestbranding: 1,
                                    rel: 0,
                                    playsinline: 1,
                                },
                            },
                            vimeo: {
                                playerOptions: {
                                    autoplay: false,
                                    loop: true,
                                    muted: true,
                                    controls: false,
                                    responsive: true,
                                },
                            },
                        } as any}
                        onProgress={(state: any) => {
                            if (!isMounted) return
                            if (shouldLimitTo30s && state?.playedSeconds >= 30 && playerRef.current) {
                                playerRef.current.seekTo(0, 'seconds')
                            }
                        }}
                        onError={(error) => {
                            console.error("ReactPlayer error:", error)
                            setHasError(true)
                            setIsPlaying(false)
                        }}
                        onReady={() => {
                            if (!isMounted) return
                            setHasError(false)
                            setTimeout(() => {
                                if (isMounted) {
                                    setIsPlaying(true)
                                }
                            }, 100)
                        }}
                    />
                )}
                {hasError && (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-slate-400 dark:text-slate-600" />
                    </div>
                )}
                {/* Minimal overlay - only at bottom for text readability */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>
        )
    }

    return (
        <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden">
            <BookOpen className="w-16 h-16 text-slate-400 dark:text-slate-600" />
        </div>
    )
}

export function CourseCard({
                               course,
                               onCourseClick,
                               onToggleFavorite,
                               onEnrollClick,
                               onOpenWishlist,
                               onAddToCart,
                               onEdit,
                               onView,
                               isFavorite = false,
                               isInCart = false,
                               showEditButton = false,
                               variant = "default",
                           }: CourseCardProps) {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const cardRef = useRef<HTMLDivElement>(null)

    const handleCardClick = () => {
        onCourseClick?.(course.id)
    }

    const handleEnrollButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onEnrollClick?.(course.id)
    }

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onToggleFavorite?.(course.id)
    }

    const handlePreviewClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        const previewUrl = getCoursePreviewUrl(course.course_preview) || course.preview_url
        if (previewUrl) {
            window.open(previewUrl, '_blank')
        }
    }

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onEdit?.(course.id)
    }

    const handleViewClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onView?.(course.id)
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        })
    }

    const lessons = course.lectures || 0
    const instructors = course.instructors && course.instructors.length > 0
        ? course.instructors
        : [{ id: course.educatorId, name: course.educator }]
    
    const shouldShowPreview = course.preview_available && (course.course_preview || course.preview_url)
    const previewUrl = getCoursePreviewUrl(course.course_preview) || course.preview_url

    return (
        <motion.div
            ref={cardRef}
            className="group relative h-full w-full max-w-sm mx-auto"
            onClick={handleCardClick}
            onMouseMove={handleMouseMove}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -4 }}
        >
            <Card className="relative overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl h-full flex flex-col p-0 min-h-[550px] max-h-[650px]">
                {/* Subtle hover glow - less colorful */}
                <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                    style={{
                        background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.08), transparent 40%)`,
                    }}
                />
                
                {/* Preview Header */}
                    <div className="relative overflow-hidden rounded-t-2xl">
                        <div className="aspect-[16/9] relative">
                        {shouldShowPreview ? (
                            <CoursePreviewDisplay 
                                course={course}
                                preview={course.course_preview}
                                previewUrl={previewUrl}
                            />
                        ) : (
                            <>
                            <Image
                                src={course.image || "/placeholder.svg"}
                                alt={course.title}
                                fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                {/* Minimal overlay - only at bottom */}
                                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
                            </>
                        )}
                        
                        {/* Badges container */}
                        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
                            <div className="flex flex-wrap gap-1.5">
                                <Badge className="bg-blue-500/90 backdrop-blur-sm text-white border-0 text-[10px] font-medium px-2 py-0.5 shadow-md">
                                    {course.category}
                                </Badge>
                                <Badge className="bg-purple-500/90 backdrop-blur-sm text-white border-0 text-[10px] font-medium px-2 py-0.5 shadow-md">
                                    {course.level}
                                </Badge>
                            </div>
                            <div className="flex gap-1.5">
                                {shouldShowPreview && (
                                    <Badge className="bg-emerald-500/90 backdrop-blur-sm border-0 text-white text-[10px] font-medium px-2 py-0.5 shadow-md">
                                        <Eye className="w-2.5 h-2.5 mr-1" />
                                        Preview
                                    </Badge>
                                )}
                                {course.trending && (
                                    <Badge className="bg-rose-500 text-white flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 shadow-md">
                                        <Flame className="w-2.5 h-2.5" />
                                        Trending
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Preview Play Button */}
                        {shouldShowPreview && previewUrl && (
                            <motion.button
                                onClick={handlePreviewClick}
                                className="absolute bottom-3 left-3 p-2.5 rounded-full bg-white/90 backdrop-blur-md text-slate-900 shadow-lg transition-all hover:scale-110 z-10"
                                aria-label="Preview course"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Play className="w-4 h-4 fill-current" />
                            </motion.button>
                        )}

                        {/* Favorite Button */}
                        {onToggleFavorite && (
                            <motion.button
                                onClick={handleFavoriteClick}
                                className={`absolute bottom-3 right-3 p-2.5 rounded-full backdrop-blur-md shadow-lg transition-all z-10 ${
                                    isFavorite 
                                        ? "bg-rose-500 text-white" 
                                        : "bg-white/90 text-rose-500 hover:bg-white"
                                }`}
                                aria-label="Toggle favorite"
                                whileHover={{ scale: 1.1, rotate: isFavorite ? 0 : 10 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                            </motion.button>
                        )}
                        </div>
                    </div>

                {/* Course Content */}
                <CardContent className="p-4 space-y-4 flex-1 flex flex-col">
                    {/* Title */}
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                            {course.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1.5 leading-relaxed">
                            {course.description}
                            </p>
                        </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 border border-blue-100 dark:border-blue-900/50">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">{course.duration}</span>
                            </div>
                                </div>
                        <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-2 border border-purple-100 dark:border-purple-900/50">
                            <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">{course.students.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2 border border-amber-100 dark:border-amber-900/50">
                            <div className="flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" />
                                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">{course.rating.toFixed(1)}</span>
                            </div>
                            </div>
                        </div>

                    {/* Badges and Tags - Improved styling */}
                    {((course.badges && course.badges.length > 0) || (course.tags && course.tags.length > 0)) && (
                        <div className="flex flex-wrap gap-1.5">
                            {course.badges?.slice(0, 2).map((badge, index) => (
                                <Badge 
                                    key={`badge-${index}`} 
                                    className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-[10px] font-medium px-2 py-0.5"
                                >
                                    <Award className="w-2.5 h-2.5 mr-1" />
                                    {badge}
                                </Badge>
                            ))}
                            {course.tags?.slice(0, 2).map((tag, index) => (
                                    <Badge
                                    key={`tag-${index}`} 
                                    className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-[10px] font-medium px-2 py-0.5"
                                    >
                                    <TagIcon className="w-2.5 h-2.5 mr-1" />
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}

                    {/* Instructors */}
                    {instructors.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex -space-x-2">
                                {instructors.slice(0, 3).map((instructor) => {
                                    // Use enriched avatarUrl if available, otherwise fall back to getAvatarUrl
                                    const avatarUrl = (instructor as any).avatarUrl || getAvatarUrl(instructor.avatar)
                                    const initials = getInstructorInitials(instructor.name)
                                    return (
                                        <Popover key={instructor.id}>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="relative size-9 rounded-full border border-white bg-slate-100 dark:bg-slate-800 shadow-sm overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                                >
                                                    {avatarUrl ? (
                                                        <Image
                                                            src={avatarUrl}
                                                            alt={instructor.name || "Instructor"}
                                                            fill
                                                            sizes="36px"
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-200">
                                                            {initials}
                                                        </span>
                                                    )}
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-48 p-3">
                                                <div className="flex items-center gap-2">
                                                    {avatarUrl ? (
                                                        <Image
                                                            src={avatarUrl}
                                                            alt={instructor.name || "Instructor"}
                                                            width={32}
                                                            height={32}
                                                            className="rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-200">
                                                            {initials}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                            {instructor.name || "Instructor"}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-300">
                                                            Course instructor
                                                        </p>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )
                                })}
                                {instructors.length > 3 && (
                                    <div className="size-9 rounded-full border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-500 flex items-center justify-center">
                                        +{instructors.length - 3}
                                    </div>
                                )}
                            </div>
                            <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                {instructors.length === 1
                                    ? instructors[0].name
                                    : `${instructors.length} instructors`}
                            </div>
                        </div>
                    )}

                    {/* Price Section - Keep as is */}
                    <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                {course.discount && (
                                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-semibold px-2 py-1 mb-1">
                                        {course.discount}
                                    </Badge>
                                )}
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {course.price}
                                    </span>
                                    {course.originalPrice && (
                                        <span className="text-sm text-slate-400 dark:text-slate-500 line-through">
                                            {course.originalPrice}
                                        </span>
                                    )}
                                </div>
                                </div>
                            </div>
                            
                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            {showEditButton ? (
                                <>
                                    {onEdit && (
                                        <Button
                                            variant="bordered"
                                            size="sm"
                                            className="flex-1 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 font-semibold text-xs"
                                            onClick={handleEditClick}
                                        >
                                            <Edit className="w-3.5 h-3.5 mr-1" />
                                            Edit
                                        </Button>
                                    )}
                                    {onView && (
                                        <Button
                                            variant="bordered"
                                            size="sm"
                                            className="flex-1 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-300 font-semibold text-xs"
                                            onClick={handleViewClick}
                                        >
                                            <Eye className="w-3.5 h-3.5 mr-1" />
                                            View
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <>
                                    {course.is_paid && onAddToCart ? (
                                        <Button 
                                            variant="bordered"
                                            className="flex-1 h-9 px-3 text-xs font-semibold border-2 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-300"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onAddToCart(course.id)
                                            }}
                                            isDisabled={isInCart}
                                        >
                                            <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                                            {isInCart ? "In Cart" : "Add to Cart"}
                                        </Button>
                                    ) : null}
                                    <Button 
                                        className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white h-9 px-4 text-xs font-bold rounded-xl shadow-lg hover:shadow-xl flex-1 transition-all duration-300 hover:scale-105"
                                        onClick={handleEnrollButtonClick}
                                    >
                                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                        {course.is_paid ? "Buy Now" : "Enroll Now"}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
