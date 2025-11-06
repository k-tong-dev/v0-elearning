"use client"

import React from "react"
import {Card} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Button} from "@heroui/react"
import {
    Star,
    Clock,
    Users,
    BookOpen,
    TrendingUp,
    Award,
    Play,
    Sparkles,
} from "lucide-react"
import Image from "next/image"

interface CourseCardProps {
    course: {
        id: number
        title: string
        description: string
        image: string
        price: string
        originalPrice: string
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
    }
    index?: number
    onCourseClick?: (courseId: number) => void
    onToggleFavorite?: (courseId: number) => void
    onEnrollClick?: (courseId: number) => void
    isFavorite?: boolean
}

export function CourseCard({
                               course,
                               index = 0,
                               onEnrollClick,
                           }: CourseCardProps) {
    const handleEnrollButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onEnrollClick?.(course.id)
    }

    const lessons = course.lectures || 30

    return (
        <div className="group relative">
            <Card className="relative overflow-visible border border-slate-200 dark:border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 dark:from-white/10 dark:via-white/5 dark:to-white/[0.03] backdrop-blur-2xl shadow-lg dark:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] hover:shadow-xl dark:hover:shadow-[0_16px_48px_0_rgba(255,255,255,0.2)] hover:border-blue-400 dark:hover:border-white/40 transition-all duration-700 hover:-translate-y-2 rounded-2xl">
                {/* Multiple layered glass effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-tl from-pink-400/10 via-transparent to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl" />
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                </div>
                
                {/* Trending badge - floating outside card */}
                {course.trending && (
                    <div className="absolute -top-3 -right-3 z-20 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-75 transition-all duration-500 delay-100">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-md animate-pulse" />
                            <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1 shadow-xl">
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span className="text-xs font-semibold">Trending</span>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="relative">
                    {/* Image Section */}
                    <div className="relative overflow-hidden rounded-t-2xl">
                        <div className="aspect-[16/9] relative">
                            <Image
                                src={course.image || "/placeholder.svg"}
                                alt={course.title}
                                fill
                                className="object-cover transform group-hover:scale-110 transition-transform duration-700"
                            />
                            
                            {/* Multi-layer gradient overlays */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            
                            {/* Floating badges container */}
                            <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                                <Badge className="bg-gradient-to-r from-white/25 to-white/15 backdrop-blur-xl border border-white/40 text-white hover:from-white/35 hover:to-white/25 shadow-lg transform hover:scale-105 transition-all duration-300">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    {course.category}
                                </Badge>
                                <Badge className="bg-gradient-to-r from-blue-500/30 to-purple-500/30 backdrop-blur-xl border border-blue-400/40 text-white hover:from-blue-500/40 hover:to-purple-500/40 shadow-lg transform hover:scale-105 transition-all duration-300">
                                    {course.level}
                                </Badge>
                            </div>

                            {/* Advanced play button with multiple rings */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                                <div className="relative">
                                    {/* Pulsing rings */}
                                    <div className="absolute inset-0 w-24 h-24 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                                        <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
                                        <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse" />
                                    </div>
                                    
                                    {/* Main button */}
                                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl border-2 border-white/50 flex items-center justify-center transform group-hover:scale-110 transition-all duration-500 shadow-2xl cursor-pointer">
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 animate-pulse" />
                                        <Play className="w-9 h-9 text-white ml-1 relative z-10" fill="white" />
                                    </div>
                                </div>
                            </div>

                            {/* Progress indicator */}
                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 backdrop-blur-sm">
                                <div className="h-full w-2/3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-lg shadow-purple-500/50" />
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 space-y-4">
                        {/* Title with gradient hover */}
                        <h3 className="text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                            {course.title}
                        </h3>

                        {/* Instructor with icon */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                                <Award className="w-4 h-4" />
                            </div>
                            <p className="text-slate-600 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-300">
                                {course.educator}
                            </p>
                        </div>

                        {/* Enhanced stats grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl p-3 group-hover:bg-slate-100 dark:group-hover:bg-white/10 group-hover:border-blue-400 dark:group-hover:border-white/20 transition-all duration-300">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-white/70 mb-1">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold text-slate-900 dark:text-white">{course.rating}</span>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-white/50">{Math.floor(course.rating * 10)} reviews</div>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl p-3 group-hover:bg-slate-100 dark:group-hover:bg-white/10 group-hover:border-blue-400 dark:group-hover:border-white/20 transition-all duration-300">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-white/70 mb-1">
                                    <Users className="w-4 h-4" />
                                    <span className="font-semibold text-slate-900 dark:text-white">{(course.students / 1000).toFixed(1)}k</span>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-white/50">students</div>
                            </div>
                        </div>

                        {/* Course details with modern design */}
                        <div className="flex items-center gap-3 py-4 border-y border-slate-200 dark:border-white/10">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-colors group/item">
                                <div className="p-1.5 bg-slate-100 dark:bg-white/10 rounded-lg group-hover/item:bg-blue-50 dark:group-hover/item:bg-white/20 transition-colors">
                                    <Clock className="w-3.5 h-3.5" />
                                </div>
                                <span>{course.duration}</span>
                            </div>
                            <div className="w-px h-4 bg-slate-300 dark:bg-white/20" />
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-colors group/item">
                                <div className="p-1.5 bg-slate-100 dark:bg-white/10 rounded-lg group-hover/item:bg-blue-50 dark:group-hover/item:bg-white/20 transition-colors">
                                    <BookOpen className="w-3.5 h-3.5" />
                                </div>
                                <span>{lessons} lessons</span>
                            </div>
                        </div>

                        {/* Enhanced footer with gradient pricing */}
                        <div className="flex items-center justify-between pt-2">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="text-slate-400 dark:text-white/40 line-through">${(parseFloat(course.price.replace('$', '')) * 1.5).toFixed(0)}</div>
                                    <Badge className="bg-green-500/20 border-green-400/30 text-green-700 dark:text-green-300 px-2 py-0.5">
                                        Save 40%
                                    </Badge>
                                </div>
                                <div className="text-slate-900 dark:text-white font-bold">
                                    {course.price}
                                </div>
                            </div>
                            
                            <Button 
                                className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-500 hover:scale-105 group/btn"
                                onClick={handleEnrollButtonClick}
                            >
                                <span className="relative z-10">Enroll Now</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
