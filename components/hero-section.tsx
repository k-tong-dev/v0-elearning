"use client"

import type React from "react"

import {useState, useEffect} from "react"
import {Button} from "@heroui/react"
import {Input} from "@/components/ui/input"
import {Search, Play, Star, Users, BookOpen, Award, Sparkles} from "lucide-react"
import {useRouter} from "next/navigation"
import {motion} from "framer-motion"
import {LayoutTextFlip} from "@/components/ui/aceternity/layout-text-flip";
import { GrLinkNext } from "react-icons/gr";

export function HeroSection() {
    const [searchQuery, setSearchQuery] = useState("")
    const [mousePosition, setMousePosition] = useState({x: 0, y: 0})
    const router = useRouter(); // Initialize useRouter

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({x: e.clientX, y: e.clientY})
        }
        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [])

    const handleSearch = () => {
        if (searchQuery.trim()) {
            console.log("[v0] Searching for:", searchQuery)
            router.push(`/courses?search=${encodeURIComponent(searchQuery)}`);
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch()
        }
    }

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <div
                className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-blue-50/10 to-blue-50/20 dark:from-blue-950/20 dark:via-blue-950/10 dark:to-blue-950/20">
                {/* Floating 3D Cubes */}
                <div
                    className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-blue-500/20 rounded-lg animate-float-3d transform-gpu perspective-1000 rotate-12 hover:rotate-45 transition-transform duration-1000"
                    style={{
                        animationDelay: "0s",
                        transform: `translateX(${mousePosition.x * 0.01}px) translateY(${mousePosition.y * 0.01}px)`,
                    }}
                />

                <div
                    className="absolute top-40 right-20 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-blue-400/20 rounded-xl animate-float-3d transform-gpu perspective-1000 -rotate-12 hover:rotate-12 transition-transform duration-1000"
                    style={{
                        animationDelay: "1s",
                        transform: `translateX(${mousePosition.x * -0.02}px) translateY(${mousePosition.y * 0.015}px)`,
                    }}
                />

                <div
                    className="absolute bottom-40 left-20 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-2xl animate-float-3d transform-gpu perspective-1000 rotate-45 hover:-rotate-12 transition-transform duration-1000"
                    style={{
                        animationDelay: "2s",
                        transform: `translateX(${mousePosition.x * 0.015}px) translateY(${mousePosition.y * -0.01}px)`,
                    }}
                />

                <div
                    className="absolute bottom-20 right-10 w-18 h-18 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-lg animate-float-3d transform-gpu perspective-1000 -rotate-45 hover:rotate-90 transition-transform duration-1000"
                    style={{
                        animationDelay: "0.5s",
                        transform: `translateX(${mousePosition.x * -0.01}px) translateY(${mousePosition.y * -0.02}px)`,
                    }}
                />

                {/* Animated Particles */}
                <div
                    className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-500 rounded-full animate-ping"
                    style={{animationDelay: "0s"}}
                />
                <div
                    className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-500 rounded-full animate-ping"
                    style={{animationDelay: "1s"}}
                />
                <div
                    className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-blue-400 rounded-full animate-ping"
                    style={{animationDelay: "2s"}}
                />

                {/* Gradient Orbs */}
                <div
                    className="absolute top-10 right-1/4 w-32 h-32 bg-gradient-to-r from-blue-400/10 to-blue-500/10 rounded-full blur-xl animate-pulse"/>
                <div
                    className="absolute bottom-10 left-1/4 w-40 h-40 bg-gradient-to-r from-blue-500/10 to-blue-400/10 rounded-full blur-xl animate-pulse"
                    style={{animationDelay: "1s"}}
                />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mt-[100px] max-w-5xl mx-auto">
                    <div className="animate-slide-in-up" data-aos="fade-up" data-aos-duration="1000">
                        <motion.div
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.5}}
                            className="mb-6"
                        >
                                <span className="inline-flex items-center rounded-full
                                    bg-primary/10 px-4 py-2 text-sm font-medium text-primary
                                    dark:bg-none dark:border-1 dark:border-blue-500 dark:text-white">
                                    <Sparkles className="mr-2 h-4 w-4"/>
                                    New courses added weekly
                                </span>
                        </motion.div>
                        <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight">
                            <span className="font-saira bg-gradient-to-r from-blue-400 via-blue-500 to-blue-500 bg-clip-text text-transparent animate-glow-text relative">
                                NEXT4LEARN
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 via-blue-500/20 to-blue-500/20 rounded-lg blur opacity-30 animate-pulse"/>
                            </span>
                            <span className="block mb-4"></span>
                            <motion.div
                                className="font-saira text-gray-400 relative mx-4 my-4 flex flex-col items-center justify-center gap-4 text-center sm:mx-0 sm:mb-0 sm:flex-row">
                                <LayoutTextFlip
                                    className="text-blue-500"
                                    text="Unlock Potential With"
                                    words={[
                                        "Fight Club",
                                        "The Matrix",
                                        "The Jungle",
                                        "Lifelong Learning",
                                        "Endless Knowledge",
                                        "Skill Mastery",
                                        "Bright Horizons",
                                        "Personal Growth",
                                        "Future Skills",
                                        "Limitless Potential",
                                        "Smart Learning",
                                        "Career Boost",
                                        "Global Education"
                                    ]}
                                />
                            </motion.div>
                        </h1>
                    </div>

                    <div
                        className="animate-slide-in-up font-saira"
                        data-aos="fade-up"
                        data-aos-delay="200"
                        style={{animationDelay: "0.2s"}}
                    >
                        <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed font-light">
                            Join thousands worldwide to master skills with interactive courses, expert instructors, and advanced tech.
                        </p>
                    </div>

                    <div
                        className="animate-slide-in-up mb-12"
                        data-aos="fade-up"
                        data-aos-delay="400"
                        style={{animationDelay: "0.4s"}}
                    >
                        <div className="max-w-2xl mx-auto relative">
                            <div
                                className="relative rounded-2xl p-2 shadow-sm bg-white
                                dark:bg-transparent dark:border-gray-400/30
                                hover:shadow-blue-500/25 transition-all duration-300
                                border-1 border-gray-200">
                                <Input
                                    type="text"
                                    placeholder="What would you like to learn today?"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="w-full pl-6 pr-16 py-4 bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus:ring-0 focus:ring-blue-transparent text-lg focus-visible:border-none focus-visible:ring-0"
                                />
                                <Button
                                    onClick={handleSearch}
                                    className="absolute right-2 top-2 bottom-2
                                    dark:bg-gray-400/50 dark:text-white
                                    bg-gray-400/10 text-gray-500 rounded-xl transition-all duration-300
                                    hover:shadow-lg hover:shadow-blue-500/25"
                                >
                                    Go
                                    <GrLinkNext/>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div
                        className="animate-slide-in-up flex flex-col sm:flex-row gap-6 justify-center mb-16"
                        data-aos="fade-up"
                        data-aos-delay="600"
                        style={{animationDelay: "0.6s"}}
                    >
                        <Button
                            size="md"
                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600
                            text-white px-10 py-4 rounded-2xl text-xl font-normal font-saira
                            transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/25
                            hover:scale-105 transform-gpu hover:gap-5"
                            onClick={() => router.push("/courses")}
                        >
                            Start Learning Now
                            <GrLinkNext/>
                        </Button>
                        <Button
                            size="md"
                            className="border-2 border-blue-500 text-blue-500 dark:text-blue-500
                            hover:bg-blue-500 hover:text-white px-10 py-4
                            rounded-2xl text-xl font-normal font-saira
                            hover:shadow-2xl hover:scale-105 bg-transparent backdrop-blur-sm"
                            onClick={() => router.push("/demo")}
                        >
                            <Play className="w-6 h-6 mr-3"/>
                            Watch Demo
                        </Button>
                    </div>

                    <div
                        className="animate-slide-in-up grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
                        data-aos="fade-up"
                        data-aos-delay="800"
                        style={{animationDelay: "0.8s"}}
                    >
                        <div className="text-center group">
                            <div
                                className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                <Users className="w-8 h-8 text-blue-500"/>
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-1">50K+</div>
                            <div className="text-muted-foreground">Active Students</div>
                        </div>
                        <div className="text-center group">
                            <div
                                className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                <BookOpen className="w-8 h-8 text-purple-500"/>
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-1">1,200+</div>
                            <div className="text-muted-foreground">Expert Courses</div>
                        </div>
                        <div className="text-center group">
                            <div
                                className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                <Star className="w-8 h-8 text-blue-500"/>
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-1">4.9/5</div>
                            <div className="text-muted-foreground">Student Rating</div>
                        </div>
                        <div className="text-center group">
                            <div
                                className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                <Award className="w-8 h-8 text-purple-500"/>
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-1">98%</div>
                            <div className="text-muted-foreground">Success Rate</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}