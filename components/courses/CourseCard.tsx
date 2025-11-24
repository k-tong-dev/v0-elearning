"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@heroui/react"
import { Star, Clock, Users, BookOpen, Flame, Heart, Building2, Award, Tag as TagIcon, ShoppingCart, Play } from "lucide-react"
import Image from "next/image"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { AvatarGroup, AvatarGroupItem } from "@heroui/react"

interface InstructorSummary {
    id: string | number
    name?: string
    avatar?: any
}

interface CompanySummary {
    name?: string | null
    avatar?: any
    logoUrl?: string | null
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
    }
    onCourseClick?: (courseId: number) => void
    onToggleFavorite?: (courseId: number) => void
    onAddToCart?: (courseId: number) => void
    onEnrollClick?: (courseId: number) => void
    onOpenWishlist?: () => void
    isFavorite?: boolean
}

export function CourseCard({
                               course,
    onCourseClick,
    onToggleFavorite,
    onAddToCart,
    onEnrollClick,
    onOpenWishlist,
    isFavorite = false,
                           }: CourseCardProps) {
    const handleCardClick = () => {
        onCourseClick?.(course.id)
    }

    const handleAddToCartClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onAddToCart?.(course.id)
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
        if (course.preview_url) {
            window.open(course.preview_url, '_blank')
        }
    }

    const lessons = course.lectures || 0
    const instructors = course.instructors && course.instructors.length > 0
        ? course.instructors
        : [{ id: course.educatorId, name: course.educator }]
    
    const companyAvatarUrl = course.companyAvatar ? getAvatarUrl(course.companyAvatar) : null

    return (
        <div className="group relative h-full" onClick={handleCardClick}>
            <Card className="py-0 h-full flex flex-col border border-slate-200 dark:border-white/10 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md hover:border-blue-400/70 transition-all duration-300">
                <div className="relative h-44 w-full overflow-hidden rounded-t-2xl">
                            <Image
                                src={course.image || "/placeholder.svg"}
                                alt={course.title}
                                fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2 text-[10px]">
                        <Badge className="bg-white/20 text-white border-white/30">{course.category}</Badge>
                        <Badge className="bg-blue-500/30 text-white border-blue-400/30">{course.level}</Badge>
                    </div>
                    {course.trending && (
                        <div className="absolute top-3 right-3">
                            <Badge className="bg-rose-500 text-white flex items-center gap-1">
                                <Flame className="w-3 h-3" />
                                Trending
                                </Badge>
                        </div>
                    )}
                    {course.preview_available && course.preview_url && (
                        <button
                            onClick={handlePreviewClick}
                            className="absolute bottom-3 left-3 p-2 rounded-full backdrop-blur bg-white/70 text-white shadow-lg transition-all hover:bg-white/90 hover:scale-110"
                            aria-label="Preview course"
                        >
                            <Play className="w-4 h-4 fill-current" />
                        </button>
                    )}
                    {onToggleFavorite && (
                        <button
                            onClick={handleFavoriteClick}
                            className={`absolute bottom-3 right-3 p-2 rounded-full backdrop-blur bg-white/70 text-rose-500 shadow-lg transition-colors ${
                                isFavorite ? "text-white bg-rose-500" : ""
                            }`}
                            aria-label="Toggle favorite"
                        >
                            <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                        </button>
                    )}
                </div>
                <div className="flex flex-col flex-1 p-4 gap-3">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white line-clamp-2">{course.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-2 mt-1">{course.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-300">
                        {course.company && (
                            <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" /> {course.company}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> {course.students.toLocaleString()} learners
                        </span>
                            </div>
                            
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-sm font-semibold">{course.rating.toFixed(1)} / 5</span>
                            <span className="text-xs text-slate-500 dark:text-slate-300">
                                {Math.max(course.students * 0.2, 20).toFixed(0)} reviews
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                            <BookOpen className="w-3.5 h-3.5" />
                                <span>{lessons} lessons</span>
                            </div>
                        </div>

                    <div className="flex flex-wrap gap-1">
                        {course.badges?.slice(0, 3).map((badge, index) => (
                            <Badge key={`badge-${index}`} className="bg-amber-500/10 text-amber-600 border-amber-400/30 text-[10px]">
                                <Award className="w-3 h-3 mr-1" />
                                {badge}
                            </Badge>
                        ))}
                        {course.tags?.slice(0, 3).map((tag, index) => (
                            <Badge key={`tag-${index}`} className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]">
                                <TagIcon className="w-3 h-3 mr-1" />
                                        {tag}
                                    </Badge>
                                ))}
                            </div>

                    <div className="flex flex-wrap gap-2">
                        {instructors.slice(0, 2).map((instructor) => {
                            const avatarUrl = getAvatarUrl(instructor.avatar)
                            return (
                                <div key={instructor.id} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-200">
                                    {avatarUrl ? (
                                        <span className="relative w-6 h-6 rounded-full overflow-hidden">
                                            <Image src={avatarUrl} alt={instructor.name || "Instructor"} fill className="object-cover" />
                                        </span>
                                    ) : (
                                        <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
                                            {instructor.name?.charAt(0) ?? "I"}
                                        </span>
                                    )}
                                    {instructor.name}
                                </div>
                            )
                        })}
                            </div>
                            
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/10">
                        <div>
                            {course.discount && (
                                <div className="text-xs text-rose-500 font-semibold">{course.discount}</div>
                            )}
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{course.price}</div>
                            {course.originalPrice && (
                                <div className="text-[11px] text-slate-400 line-through">{course.originalPrice}</div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {onOpenWishlist && (
                                <Button
                                    variant="bordered"
                                    className="h-8 px-3 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onOpenWishlist()
                                    }}
                                >
                                    Wishlist
                                </Button>
                            )}
                            <Button 
                                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white h-8 px-4 text-xs rounded-xl shadow-lg"
                                onClick={handleEnrollButtonClick}
                            >
                                Enroll
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}

