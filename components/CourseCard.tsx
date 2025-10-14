"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Star, 
  Clock, 
  Users, 
  Heart, 
  BookOpen, 
  TrendingUp, 
  Award,
  Play,
  ChevronRight,
  Sparkles
} from "lucide-react"
import Link from "next/link"
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
  onCourseClick, 
  onToggleFavorite, 
  onEnrollClick,
  isFavorite = false 
}: CourseCardProps) {
  const handleCardClick = () => {
    onCourseClick?.(course.id)
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite?.(course.id)
  }

  const handleEnrollButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEnrollClick?.(course.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: 0.1 * (index % 4), 
        duration: 0.4,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -8,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className="group h-full"
    >
      <Card 
        className="relative overflow-hidden h-full bg-gradient-to-br from-white/80 via-white/60 to-cyan-50/30 dark:from-gray-900/80 dark:via-gray-800/60 dark:to-cyan-900/20 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer group-hover:border-cyan-200/50 dark:group-hover:border-cyan-800/50"
        onClick={handleCardClick}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 right-4 w-2 h-2 bg-cyan-400/30 rounded-full animate-pulse" />
          <div className="absolute top-8 right-8 w-1 h-1 bg-emerald-400/40 rounded-full animate-pulse delay-1000" />
          <div className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-cyan-300/20 rounded-full animate-pulse delay-2000" />
        </div>

        {/* Status badges */}
        {(course.trending || course.bestseller) && (
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            {course.trending && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border-0">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trending
                </Badge>
              </motion.div>
            )}
            {course.bestseller && (
              <motion.div
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border-0">
                  <Award className="w-3 h-3 mr-1" />
                  Bestseller
                </Badge>
              </motion.div>
            )}
          </div>
        )}

        <CardHeader className="p-0 relative">
          <div className="relative overflow-hidden">
            {/* Course image with enhanced hover effects */}
            <div className="relative aspect-video overflow-hidden">
              <Image
                src={course.image || "/placeholder.svg"}
                alt={course.title}
                fill
                className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="bg-white/90 hover:bg-white text-gray-900 rounded-full shadow-2xl border-0 backdrop-blur-sm"
                    onClick={handleCardClick}
                  >
                    <Play className="w-6 h-6 ml-1" />
                  </Button>
                </motion.div>
              </div>

              {/* Favorite button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 left-4 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow-lg backdrop-blur-sm border-0 z-10"
                onClick={handleFavoriteClick}
              >
                <Heart
                  className={`w-4 h-4 transition-all duration-300 ${
                    isFavorite 
                      ? "fill-red-500 text-red-500 scale-110" 
                      : "hover:scale-110"
                  }`}
                />
              </Button>

              {/* Level and discount badges */}
              <div className="absolute bottom-4 left-4 flex gap-2">
                <Badge className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold px-3 py-1.5 rounded-full shadow-lg border-0">
                  {course.level}
                </Badge>
                {course.discount && (
                  <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold px-3 py-1.5 rounded-full shadow-lg border-0">
                    {course.discount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {/* Category and educator */}
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className="text-xs font-medium border-cyan-200/50 text-cyan-700 dark:border-cyan-800/50 dark:text-cyan-300 bg-cyan-50/50 dark:bg-cyan-900/20"
            >
              {course.category}
            </Badge>
            <Link
              href={`/users/${course.educatorId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-muted-foreground font-medium hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-200 flex items-center gap-1"
            >
              by {course.educator}
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Course title */}
          <h3 className="text-xl font-bold leading-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-300 line-clamp-2">
            {course.title}
          </h3>

          {/* Course description */}
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {course.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {course.tags.slice(0, 3).map((tag, tagIndex) => (
              <motion.div
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * tagIndex }}
              >
                <Badge
                  variant="secondary"
                  className="text-xs bg-gradient-to-r from-cyan-50 to-emerald-50 dark:from-cyan-900/30 dark:to-emerald-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200/50 dark:border-cyan-800/50 hover:scale-105 transition-transform duration-200"
                >
                  {tag}
                </Badge>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex items-center">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="ml-1 font-semibold text-foreground">{course.rating}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="font-medium">{course.students.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{course.duration}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <div className="flex flex-col gap-4 w-full">
            {/* Price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                  {course.price}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  {course.originalPrice}
                </span>
              </div>
            </div>

            {/* Enroll button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 border-0 group/btn"
                onClick={handleEnrollButtonClick}
              >
                <BookOpen className="w-4 h-4 mr-2 group-hover/btn:rotate-12 transition-transform duration-300" />
                Enroll Now
                <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
              </Button>
            </motion.div>
          </div>
        </CardFooter>

        {/* Subtle border glow effect */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 via-emerald-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
             style={{ 
               background: 'linear-gradient(45deg, transparent, rgba(6, 182, 212, 0.1), transparent, rgba(16, 185, 129, 0.1), transparent)',
               backgroundSize: '200% 200%',
               animation: 'gradient 3s ease infinite'
             }} />
      </Card>
    </motion.div>
  )
}
