"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2, VolumeX, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface CourseCard {
    title: string
    description: string
    gradient: string
    icon: string
}

const courseCards: CourseCard[] = [
    {
        title: "Essentials of Leadership",
        description: "Learn the fundamentals of effective leadership and develop your managerial skills. This course equips you with the necessary tools for success...",
        gradient: "from-orange-400 to-pink-500",
        icon: "⭐",
    },
    {
        title: "Management Mastery",
        description: "Master advanced management techniques and strategic planning. This course equips you with necessary tools for success...",
        gradient: "from-blue-400 to-indigo-600",
        icon: "👤",
    },
    {
        title: "Strategic Planning",
        description: "Learn the fundamentals of strategic leadership and develop your management skills. This course for success...",
        gradient: "from-gray-400 to-gray-600",
        icon: "💼",
    },
]

export function HeroSectionModern() {
    const router = useRouter()
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [progress, setProgress] = useState(35)

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-slate-950">
            {/* Light/Dark Mode Compatible Background */}
            <div 
                className="absolute inset-0 dark:opacity-40 opacity-20"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 20% 50%, rgba(0, 0, 0, 0.05) 0%, transparent 60%),
                        radial-gradient(circle at 80% 80%, rgba(0, 0, 0, 0.04) 0%, transparent 60%),
                        radial-gradient(circle at 50% 30%, rgba(0, 0, 0, 0.03) 0%, transparent 50%)
                    `,
                    backgroundSize: "100% 100%",
                }}
            />
            
            {/* Dark mode specific texture */}
            <div 
                className="absolute inset-0 opacity-10 dark:opacity-20 hidden dark:block"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundSize: "200px 200px",
                }}
            />
            
            {/* Light mode subtle pattern */}
            <div 
                className="absolute inset-0 opacity-[0.02] dark:hidden"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: "60px 60px",
                }}
            />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Side - Heading */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-slate-900 dark:text-white leading-tight">
                            Keep Learning<br />
                            On Track
                        </h1>
                        
                        <div className="space-y-6">
                            <p className="text-lg md:text-xl text-slate-600 dark:text-gray-300 leading-relaxed max-w-lg">
                                Elevate your management skills with our cutting-edge courses. Join Our Courses for Comprehensive Learning.
                            </p>
                            
                            <Button
                                onClick={() => router.push("/courses")}
                                size="lg"
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-6 text-lg rounded-full shadow-lg shadow-blue-500/30"
                            >
                                Start Now
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>

                    {/* Right Side - Course Cards Preview */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="relative flex items-center justify-center"
                    >
                        <div className="w-full max-w-2xl">
                            {/* Statistics Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                                className="mb-12 flex items-center gap-6"
                            >
                                <div className="text-6xl font-bold text-slate-900 dark:text-white">1.2K</div>
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-sm font-bold text-white shadow-lg"
                                        >
                                            {String.fromCharCode(64 + i)}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-slate-600 dark:text-gray-300 text-base max-w-xs">
                                    Total number of users completed the training.
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>

                {/* Course Cards Section - Modern Liquid Glass */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mt-32 relative"
                >
                    <div className="flex flex-wrap gap-8 justify-center lg:justify-start">
                        {courseCards.map((card, index) => (
                            <motion.div
                                key={card.title}
                                initial={{ opacity: 0, y: 50, rotate: -8 + index * 8 }}
                                animate={{ opacity: 1, y: 0, rotate: -8 + index * 8 }}
                                transition={{ duration: 0.8, delay: 0.5 + index * 0.15 }}
                                whileHover={{ scale: 1.05, rotate: 0, z: 50 }}
                                className={`relative ${index > 0 ? '-ml-12' : ''}`}
                            >
                                <div className={`group relative w-80 h-80 rounded-3xl overflow-hidden liquid-glass-card border-2 border-white/20 hover:border-white/40 transition-all duration-300`}>
                                    {/* Gradient Background Layer */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-90 group-hover:opacity-100 transition-opacity duration-300`} />
                                    
                                    {/* Glass Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20" />
                                    
                                    {/* Content */}
                                    <div className="relative h-full p-8 flex flex-col justify-between z-10">
                                        <div>
                                            <motion.div 
                                                className="text-5xl mb-6 filter drop-shadow-lg"
                                                whileHover={{ scale: 1.2, rotate: [0, -10, 10, -10, 0] }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                {card.icon}
                                            </motion.div>
                                            <h3 className="text-2xl font-bold text-white mb-3 drop-shadow-lg">{card.title}</h3>
                                            <p className="text-white/90 text-sm leading-relaxed line-clamp-3">
                                                {card.description}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => router.push("/courses")}
                                            className="mt-6 bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-white/50 rounded-full w-full backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl"
                                        >
                                            Explore
                                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                    
                                    {/* Shimmer Effect */}
                                    <div className="absolute inset-0 liquid-shimmer pointer-events-none opacity-30" />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Statistics Section - Liquid Glass */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1 }}
                        className="mt-16"
                    >
                        <div className="liquid-glass-card p-6 max-w-2xl">
                                    <div className="flex items-center gap-6 flex-wrap">
                                <div>
                                    <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">1.2K</div>
                                    <p className="text-slate-600 dark:text-gray-400 text-xs mt-1">Active Learners</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map((i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 1.1 + i * 0.1 }}
                                                className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-sm font-bold text-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
                                            >
                                                {String.fromCharCode(64 + i)}
                                            </motion.div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400">
                                        <Play className="w-4 h-4" />
                                        <span className="text-sm">+234 joined this week</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Media Player - Fixed at Bottom - Liquid Glass */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="fixed bottom-8 left-8 flex items-center gap-4 z-50 p-3 px-6 rounded-full shadow-2xl backdrop-blur-xl border dark:border-white/20 border-slate-200/30 bg-white/80 dark:bg-slate-950/80"
            >
                <Button
                    onClick={() => setIsPlaying(!isPlaying)}
                    size="icon"
                    className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300"
                >
                    {isPlaying ? (
                        <Pause className="w-6 h-6" />
                    ) : (
                        <Play className="w-6 h-6" />
                    )}
                </Button>
                
                <Button
                    onClick={() => setIsMuted(!isMuted)}
                    size="icon"
                    variant="ghost"
                    className="w-12 h-12 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-white border border-slate-200 dark:border-white/20 hover:border-slate-300 dark:hover:border-white/30 transition-all duration-300"
                >
                    {isMuted ? (
                        <VolumeX className="w-5 h-5" />
                    ) : (
                        <Volume2 className="w-5 h-5" />
                    )}
                </Button>
                
                <div className="flex items-center gap-4">
                    <div className="w-48 h-2 bg-slate-200/50 dark:bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                        <motion.div
                            className="h-full bg-gradient-to-r from-pink-500 to-pink-600 shadow-lg shadow-pink-500/50"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                    <span className="text-slate-600 dark:text-gray-400 text-xs font-mono">02:15 / 06:30</span>
                </div>
            </motion.div>
        </section>
    )
}

