"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Clock, Eye, ChevronLeft, ChevronRight, ArrowRight, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

const freeVideos = [
    {
        id: 1,
        title: "Innovative Leadership Strategies",
        thumbnail: "/professional-man.png",
        duration: "45 min",
        views: 156,
        category: "Leadership",
        rating: 4.7,
        gradient: "from-blue-500 via-purple-600 to-blue-700"
    },
    {
        id: 2,
        title: "Empowering Managers: The Art of Inspiring Teams",
        thumbnail: "/professional-woman-diverse.png",
        duration: "80 min",
        views: 216,
        category: "Management",
        rating: 3.6,
        gradient: "from-pink-500 via-purple-500 to-pink-600"
    },
    {
        id: 3,
        title: "Agile Leadership: Thriving in Dynamic Business",
        thumbnail: "/professional-man-glasses.png",
        duration: "35 min",
        views: 235,
        category: "Strategy",
        rating: 4.2,
        gradient: "from-purple-600 via-pink-500 to-purple-700"
    },
    {
        id: 4,
        title: "Strategic Decision Making",
        thumbnail: "/professional-man.png",
        duration: "60 min",
        views: 189,
        category: "Strategy",
        rating: 4.5,
        gradient: "from-blue-500 via-indigo-600 to-blue-700"
    },
]

const categories = [
    {
        id: 1,
        icon: "✈️",
        title: "Anatomy & Physiology",
        description: "Explore the human body",
    },
    {
        id: 2,
        icon: "📐",
        title: "History & Culture",
        description: "Step into historical events",
    },
    {
        id: 3,
        icon: "🎨",
        title: "Art & Creativity",
        description: "Unlock artistic potential",
    },
]

export function FreeLessonsSection() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)

    useEffect(() => {
        if (!isAutoPlaying) return
        
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % freeVideos.length)
        }, 5000)

        return () => clearInterval(timer)
    }, [isAutoPlaying])

    const nextSlide = () => {
        setIsAutoPlaying(false)
        setCurrentIndex((prev) => (prev + 1) % freeVideos.length)
    }

    const prevSlide = () => {
        setIsAutoPlaying(false)
        setCurrentIndex((prev) => (prev - 1 + freeVideos.length) % freeVideos.length)
    }

    const goToSlide = (index: number) => {
        setIsAutoPlaying(false)
        setCurrentIndex(index)
    }

    return (
        <section className="relative py-32 overflow-hidden bg-white dark:bg-slate-950">
            {/* Light/Dark Mode Background */}
            <div 
                className="absolute inset-0 dark:opacity-30 opacity-10"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 20% 50%, rgba(0, 0, 0, 0.03) 0%, transparent 60%),
                        radial-gradient(circle at 80% 80%, rgba(0, 0, 0, 0.02) 0%, transparent 60%)
                    `,
                    backgroundSize: "100% 100%",
                }}
            />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h3 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                            Watch the free lessons
                        </h3>
                        <p className="text-slate-600 dark:text-gray-300 text-lg max-w-2xl">
                            Equip yourself with innovative leadership strategies to tackle tomorrow's business landscape with confidence.
                        </p>
                    </div>
                    <Button 
                        variant="outline" 
                        className="hidden md:flex liquid-glass-button text-slate-900 dark:text-white border-slate-200 dark:border-blue-500/30 hover:border-slate-300 dark:hover:border-blue-500/50 rounded-full"
                    >
                        Show All
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>

                {/* Featured Course Cards Slider */}
                <div className="relative mb-16">
                    <div className="relative overflow-hidden rounded-3xl">
                        <AnimatePresence mode="wait">
                            {freeVideos.map((video, index) => (
                                currentIndex === index && (
                                    <motion.div
                                        key={video.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.5 }}
                                        className="group relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden cursor-pointer"
                                    >
                                        {/* Background Gradient */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${video.gradient} opacity-90 group-hover:opacity-100 transition-opacity duration-500`} />
                                        
                                        {/* Glass Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30" />
                                        
                                        {/* Decorative Shapes */}
                                        <div className="absolute inset-0 overflow-hidden">
                                            {[...Array(5)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="absolute w-32 h-32 rounded-2xl bg-white/10 backdrop-blur-sm"
                                                    style={{
                                                        top: `${20 + i * 15}%`,
                                                        left: `${15 + i * 12}%`,
                                                        transform: `rotate(${i * 45}deg)`,
                                                    }}
                                                    animate={{
                                                        x: [0, Math.random() * 20 - 10],
                                                        y: [0, Math.random() * 20 - 10],
                                                    }}
                                                    transition={{
                                                        duration: 3 + i,
                                                        repeat: Infinity,
                                                        repeatType: "reverse",
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        {/* Content */}
                                        <div className="relative h-full p-8 md:p-12 flex flex-col justify-between z-10">
                                            {/* Top Bar */}
                                            <div className="flex items-center justify-between mb-8">
                                                <span className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-medium border border-white/30">
                                                    NEW COURSE
                                                </span>
                                                <div className="flex gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 cursor-pointer hover:bg-white/30 transition-colors">
                                                        <span className="text-white text-xs">🏷️</span>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 cursor-pointer hover:bg-white/30 transition-colors">
                                                        <span className="text-white text-xs">📄</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Middle Content */}
                                            <div className="flex-1 flex flex-col justify-center">
                                                <h4 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg group-hover:translate-y-[-4px] transition-transform duration-300">
                                                    {video.title}
                                                </h4>
                                                <div className="flex items-center gap-4 text-white/90">
                                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
                                                        <span className="text-2xl">🌀</span>
                                                        <span className="text-sm font-medium">
                                                            {video.rating} Rating
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom Bar */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                                                        <ArrowRight className="w-5 h-5 text-white" />
                                                    </div>
                                                    <span className="text-white/80 text-sm">View Details</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1 text-white/80">
                                                        <Clock className="w-4 h-4" />
                                                        <span className="text-sm">{video.duration}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-white/80">
                                                        <Eye className="w-4 h-4" />
                                                        <span className="text-sm">{video.views} views</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Shimmer Effect */}
                                        <div className="absolute inset-0 liquid-shimmer pointer-events-none opacity-20" />
                                    </motion.div>
                                )
                            ))}
                        </AnimatePresence>

                        {/* Navigation Arrows */}
                        <button
                            onClick={prevSlide}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 shadow-lg z-20"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 shadow-lg z-20"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>

                        {/* Indicators */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                            {freeVideos.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        index === currentIndex
                                            ? "w-8 bg-white shadow-lg"
                                            : "w-2 bg-white/40 hover:bg-white/60"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Categories Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                            All Categories
                        </h4>
                        <ArrowRight className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {categories.map((category, index) => (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group liquid-glass-card p-8 rounded-2xl cursor-pointer hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                        {category.icon}
                                    </div>
                                    <h5 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                        {category.title}
                                    </h5>
                                    <p className="text-slate-600 dark:text-gray-400 mb-6 text-sm">
                                        {category.description}
                                    </p>
                                    <Button 
                                        variant="outline"
                                        size="sm"
                                        className="liquid-glass-button text-slate-900 dark:text-white border-slate-200 dark:border-white/20 hover:border-slate-300 dark:hover:border-blue-500/50 rounded-full"
                                    >
                                        View
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
