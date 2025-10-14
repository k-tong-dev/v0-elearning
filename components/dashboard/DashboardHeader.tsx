"use client"

import React, { useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { AnimatedShape } from "./AnimatedShape"
import { GlitchText } from './GlitchText'
import { DashboardAvatar } from "@/components/ui/enhanced-avatar"
import { useAuth } from "@/hooks/use-auth"

interface DashboardHeaderProps {
    userName: string
    onCreateCourse: () => void
}

export function DashboardHeader({ userName, onCreateCourse }: DashboardHeaderProps) {
    const headerRef = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
    const { user } = useAuth();

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            if (headerRef.current) {
                const rect = headerRef.current.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width) * 100;
                const y = ((event.clientY - rect.top) / rect.height) * 100;
                setMousePosition({ x, y });
            }
        };

        const currentRef = headerRef.current;
        if (currentRef) {
            currentRef.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            if (currentRef) {
                currentRef.removeEventListener('mousemove', handleMouseMove);
            }
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
            <div
                ref={headerRef}
                className="relative p-8 rounded-2xl overflow-hidden glass-enhanced border-2 border-primary/20 shadow-xl animate-glass-pulse animate-shimmer-border"
                style={{
                    '--mouse-x': `${mousePosition.x}%`,
                    '--mouse-y': `${mousePosition.y}%`,
                } as React.CSSProperties}
            >
                {/* Animated background elements */}
                <div className="absolute inset-0 animated-grid-background animate-gradient-radial"></div>
                {/* New Scanline Overlay */}
                <div className="scanline-overlay"></div>

                {/* Floating animated shapes (cubes/circles) */}
                <AnimatedShape size="md" x="10%" y="20%" rotate={0} delay={0} shape="circle" color="bg-cyan-500/20" />
                <AnimatedShape size="lg" x="80%" y="10%" rotate={45} delay={2} shape="square" color="bg-emerald-500/20" />
                <AnimatedShape size="sm" x="25%" y="70%" rotate={90} delay={4} shape="square" color="bg-purple-500/20" />
                <AnimatedShape size="xl" x="50%" y="50%" rotate={135} delay={6} shape="circle" color="bg-pink-500/20" />
                <AnimatedShape size="md" x="5%" y="90%" rotate={180} delay={8} shape="square" color="bg-blue-500/20" />
                <AnimatedShape size="lg" x="90%" y="80%" rotate={225} delay={10} shape="circle" color="bg-orange-500/20" />
                {/* Additional Animated Shapes - Group 1 */}
                <AnimatedShape size="sm" x="40%" y="5%" rotate={30} delay={1} shape="circle" color="bg-emerald-500/15" />
                <AnimatedShape size="md" x="15%" y="45%" rotate={60} delay={3} shape="square" color="bg-purple-500/15" />
                <AnimatedShape size="lg" x="70%" y="60%" rotate={100} delay={5} shape="circle" color="bg-cyan-500/15" />
                <AnimatedShape size="xl" x="30%" y="85%" rotate={160} delay={7} shape="square" color="bg-pink-500/15" />
                <AnimatedShape size="sm" x="60%" y="25%" rotate={200} delay={9} shape="square" color="bg-blue-500/15" />
                <AnimatedShape size="md" x="85%" y="35%" rotate={250} delay={11} shape="circle" color="bg-orange-500/15" />
                {/* Additional Animated Shapes - Group 2 */}
                <AnimatedShape size="xs" x="5%" y="5%" rotate={10} delay={0.5} shape="circle" color="bg-cyan-500/10" />
                <AnimatedShape size="sm" x="95%" y="95%" rotate={200} delay={1.5} shape="square" color="bg-emerald-500/10" />
                <AnimatedShape size="md" x="35%" y="15%" rotate={70} delay={2.5} shape="circle" color="bg-purple-500/10" />
                <AnimatedShape size="lg" x="65%" y="85%" rotate={110} delay={3.5} shape="square" color="bg-pink-500/10" />
                <AnimatedShape size="xl" x="15%" y="60%" rotate={150} delay={4.5} shape="circle" color="bg-blue-500/10" />
                <AnimatedShape size="xs" x="80%" y="40%" rotate={270} delay={5.5} shape="square" color="bg-orange-500/10" />
                <AnimatedShape size="sm" x="20%" y="95%" rotate={10} delay={6.5} shape="circle" color="bg-emerald-500/10" />
                <AnimatedShape size="md" x="75%" y="5%" rotate={190} delay={7.5} shape="square" color="bg-cyan-500/10" />

                {/* Animated Particles (Pinging Dots) */}
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: "0s" }} />
                <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-emerald-400 rounded-full animate-ping" style={{ animationDelay: "1s" }} />
                <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: "2s" }} />
                <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: "0.5s" }} />
                <div className="absolute bottom-10 right-20 w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: "1.5s" }} />

                {/* Gradient Orbs (Blurring Pulsing Circles) */}
                <div className="absolute top-10 right-1/4 w-32 h-32 bg-gradient-to-r from-cyan-400/10 to-emerald-400/10 rounded-full blur-xl animate-pulse" />
                <div className="absolute bottom-10 left-1/4 w-40 h-40 bg-gradient-to-r from-emerald-400/10 to-blue-400/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/3 left-10 w-24 h-24 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: "0.5s" }} />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {user && (
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            >
                                <DashboardAvatar user={user} size="xl" />
                            </motion.div>
                        )}
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
                                <GlitchText text="Your Learning Hub" />
                            </h1>
                            <p className="text-lg text-muted-foreground">
                                Welcome back, <GlitchText text={userName} className="font-semibold text-foreground" />! Let's continue your journey.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}