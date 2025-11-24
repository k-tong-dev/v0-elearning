"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import { Footer } from "@/components/ui/footers/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {ArrowLeft, PlayCircle, Lightbulb, CheckCircle, Users, Settings, Globe, ArrowRight} from "lucide-react"
import { motion } from "framer-motion"

export default function DemoPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            <HeaderUltra />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="flex items-center gap-2 hover:bg-accent/20"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Button>
                </motion.div>

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Experience NEXT4LEARN in Action
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Watch our quick demo to see how NEXT4LEARN empowers your learning journey.
                    </p>
                </motion.div>

                {/* Demo Video Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative w-full max-w-4xl mx-auto aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-primary/20 mb-12"
                >
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=dQw4w9WgXcQ" // Replace with your actual demo video URL
                        title="NEXT4LEARN Demo Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover:bg-black/30 transition-colors">
                        <PlayCircle className="w-20 h-20 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                </motion.div>

                {/* Key Features Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-12"
                >
                    <h2 className="text-3xl font-bold text-center mb-8">What You'll Discover</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        <Card className="text-center liquid-glass-card">
                            <CardContent className="p-6">
                                <Lightbulb className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                                <h3 className="font-semibold text-lg mb-2">Interactive Learning</h3>
                                <p className="text-sm text-muted-foreground">Engage with quizzes, coding challenges, and hands-on projects.</p>
                            </CardContent>
                        </Card>
                        <Card className="text-center liquid-glass-card">
                            <CardContent className="p-6">
                                <Users className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                                <h3 className="font-semibold text-lg mb-2">Community Support</h3>
                                <p className="text-sm text-muted-foreground">Connect with mentors and peers in our vibrant forum.</p>
                            </CardContent>
                        </Card>
                        <Card className="text-center liquid-glass-card">
                            <CardContent className="p-6">
                                <Settings className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                                <h3 className="font-semibold text-lg mb-2">Personalized Paths</h3>
                                <p className="text-sm text-muted-foreground">Tailor your learning journey to your goals and interests.</p>
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>

                {/* Call to Action */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-center max-w-3xl mx-auto p-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl shadow-lg border border-primary/20"
                >
                    <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
                    <p className="text-lg text-muted-foreground mb-6">
                        Join NEXT4LEARN today and unlock a world of knowledge and opportunities.
                    </p>
                    <Button
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 hover:scale-105"
                        onClick={() => router.push("/signup")}
                    >
                        Sign Up for Free
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                </motion.div>
            </div>

            <Footer />
        </div>
    )
}