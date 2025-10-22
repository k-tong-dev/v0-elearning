"use client"

import { cn } from "@/utils/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion" // Import motion

export type AvatarFrameVariant =
    | "glassmorphic"
    | "3d-perspective"
    | "liquid-morph"
    | "holographic"
    | "mesh-gradient"
    | "orbital"
    | "prismatic"
    | "cyber-neon"

export type AvatarFrameSize = "sm" | "md" | "lg" | "xl" | "2xl"

interface AvatarFrameProps {
    src?: string
    alt?: string
    fallback?: string
    variant?: AvatarFrameVariant
    size?: AvatarFrameSize
    className?: string
}

const sizeClasses = {
    sm: "w-[60px] h-[60px]",
    md: "w-[80px] h-[80px]",
    lg: "w-[100px] h-[100px]",
    xl: "w-[120px] h-[120px]",
    "2xl": "w-[140px] h-[140px]",
}

export function AvatarFrame({
                                src,
                                alt = "User avatar",
                                fallback = "U",
                                variant = "glassmorphic",
                                size = "md",
                                className,
                            }: AvatarFrameProps) {
    const baseSize = sizeClasses[size]

    const renderFrame = () => {
        switch (variant) {
            case "glassmorphic":
                return (
                    <div className={cn("relative group", className)}>
                        {/* Floating particles */}
                        <div className="absolute inset-0 overflow-visible">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-1 h-1 rounded-full bg-primary/40"
                                    style={{
                                        top: `${Math.random() * 100}%`,
                                        left: `${Math.random() * 100}%`,
                                        animation: `particle-float 3s ease-in-out infinite ${i * 0.5}s`,
                                        // @ts-ignore
                                        "--tx": `${(Math.random() - 0.5) * 20}px`,
                                        "--ty": `${(Math.random() - 0.5) * 20}px`,
                                    }}
                                />
                            ))}
                        </div>
                        {/* Glassmorphic border */}
                        <div
                            className={cn(
                                "absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-white/20 to-white/10 backdrop-blur-xl border border-white/30 shadow-2xl transition-all duration-500 group-hover:shadow-primary/30 group-hover:scale-105",
                                baseSize,
                            )}
                        />
                        <div className={cn("absolute inset-[3px] rounded-full bg-background/80 backdrop-blur-sm")} />
                        <Avatar className={cn("relative", baseSize)}>
                            <AvatarImage src={src || "/placeholder.svg"} alt={alt} />
                            <AvatarFallback>{fallback}</AvatarFallback>
                        </Avatar>
                    </div>
                )

            case "3d-perspective":
                return (
                    <div className={cn("relative group", className)} style={{ perspective: "1000px" }}>
                        {/* Shadow layers for depth */}
                        <div
                            className={cn(
                                "absolute inset-0 rounded-full bg-primary/20 blur-xl transition-all duration-500 group-hover:blur-2xl",
                                baseSize,
                            )}
                            style={{ transform: "translateZ(-30px)" }}
                        />
                        <div
                            className={cn(
                                "absolute inset-0 rounded-full bg-gradient-to-br from-primary via-secondary to-accent p-[3px] transition-all duration-500 group-hover:scale-110",
                                baseSize,
                            )}
                            style={{
                                transform: "rotateX(10deg) rotateY(-10deg)",
                                transformStyle: "preserve-3d",
                            }}
                        >
                            <div className="w-full h-full rounded-full bg-background" />
                        </div>
                        <Avatar
                            className={cn("relative transition-transform duration-500 group-hover:scale-105", baseSize)}
                            style={{
                                transform: "translateZ(20px)",
                                transformStyle: "preserve-3d",
                            }}
                        >
                            <AvatarImage src={src || "/placeholder.svg"} alt={alt} />
                            <AvatarFallback>{fallback}</AvatarFallback>
                        </Avatar>
                    </div>
                )

            case "liquid-morph":
                return (
                    <div className={cn("relative group flex items-center justify-center", baseSize, className)}>
                        {/* Morphing background element */}
                        <motion.div
                            className={cn(
                                "absolute inset-0 bg-gradient-to-br from-cyan-500 to-emerald-500 opacity-100 blur-lg animate-morph", // Increased opacity and blur
                            )}
                            animate={{
                                borderRadius: ["60% 40% 30% 70% / 60% 30% 70% 40%", "30% 60% 70% 40% / 50% 60% 30% 60%", "60% 40% 30% 70% / 60% 30% 70% 40%"],
                                scale: [1, 1.05, 1],
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                        {/* Inner container to hold the actual avatar, ensuring it doesn't morph */}
                        <div className={cn("relative z-10 rounded-full overflow-hidden bg-background", baseSize)}>
                            <Avatar className={cn("w-full h-full")}>
                                <AvatarImage src={src || "/placeholder.svg"} alt={alt} />
                                <AvatarFallback>{fallback}</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                )

            case "holographic":
                return (
                    <div className={cn("relative group", className)}>
                        <div
                            className={cn(
                                "absolute inset-0 rounded-full p-[3px] transition-all duration-500 group-hover:scale-110",
                                baseSize,
                            )}
                            style={{
                                background: "linear-gradient(90deg, #ff0080, #ff8c00, #40e0d0, #4169e1, #9370db, #ff0080)",
                                backgroundSize: "200% 100%",
                                animation: "shimmer 3s linear infinite",
                            }}
                        >
                            <div className="w-full h-full rounded-full bg-background" />
                        </div>
                        <div
                            className="absolute inset-0 rounded-full opacity-50 transition-opacity duration-500 group-hover:opacity-80"
                            style={{
                                background: "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                                animation: "shimmer 2s linear infinite reverse",
                            }}
                        />
                        <Avatar className={cn("relative", baseSize)}>
                            <AvatarImage src={src || "/placeholder.svg"} alt={alt} />
                            <AvatarFallback>{fallback}</AvatarFallback>
                        </Avatar>
                    </div>
                )

            case "mesh-gradient":
                return (
                    <div className={cn("relative group", className)}>
                        {/* Animated gradient mesh background */}
                        <div
                            className={cn(
                                "absolute inset-[-20px] rounded-full opacity-80 blur-2xl transition-all duration-500 group-hover:opacity-100 group-hover:blur-3xl",
                            )}
                            style={{
                                background:
                                    "radial-gradient(circle at 30% 50%, #ff0080 0%, transparent 50%), radial-gradient(circle at 70% 50%, #00d4ff 0%, transparent 50%), radial-gradient(circle at 50% 80%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 50% 20%, #10b981 0%, transparent 50%)",
                                animation: "rainbow-shift 10s linear infinite",
                            }}
                        />
                        <div
                            className={cn(
                                "absolute inset-0 rounded-full border-2 transition-all duration-500 group-hover:border-4",
                                baseSize,
                            )}
                            style={{
                                borderImage: "linear-gradient(135deg, #ff0080, #ff8c00, #40e0d0, #4169e1, #9370db) 1",
                                animation: "rainbow-shift 8s linear infinite",
                            }}
                        />
                        <Avatar className={cn("relative", baseSize)}>
                            <AvatarImage src={src || "/placeholder.svg"} alt={alt} />
                            <AvatarFallback>{fallback}</AvatarFallback>
                        </Avatar>
                    </div>
                )

            case "orbital":
                return (
                    <div className={cn("relative group", className)}>
                        {/* Orbiting elements */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            {[...Array(4)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent"
                                    style={{
                                        animation: `orbit ${3 + i}s linear infinite`,
                                        animationDelay: `${i * 0.75}s`,
                                    }}
                                />
                            ))}
                        </div>
                        {/* Main frame */}
                        <div
                            className={cn(
                                "absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-transparent to-accent/30 p-[2px] transition-all duration-500 group-hover:from-primary/50 group-hover:to-accent/50",
                                baseSize,
                            )}
                        >
                            <div className="w-full h-full rounded-full bg-background" />
                        </div>
                        <Avatar className={cn("relative", baseSize)}>
                            <AvatarImage src={src || "/placeholder.svg"} alt={alt} />
                            <AvatarFallback>{fallback}</AvatarFallback>
                        </Avatar>
                    </div>
                )

            case "prismatic":
                return (
                    <div className={cn("relative group", className)}>
                        {/* Color split layers */}
                        <div
                            className={cn(
                                "absolute inset-0 rounded-full border-2 border-red-500/50 transition-all duration-500 group-hover:scale-105",
                                baseSize,
                            )}
                            style={{ transform: "translate(-2px, -2px)" }}
                        />
                        <div
                            className={cn(
                                "absolute inset-0 rounded-full border-2 border-green-500/50 transition-all duration-500 group-hover:scale-105",
                                baseSize,
                            )}
                        />
                        <div
                            className={cn(
                                "absolute inset-0 rounded-full border-2 border-blue-500/50 transition-all duration-500 group-hover:scale-105",
                                baseSize,
                            )}
                            style={{ transform: "translate(2px, 2px)" }}
                        />
                        {/* Main frame */}
                        <div className={cn("absolute inset-[2px] rounded-full bg-background")} />
                        <Avatar className={cn("relative", baseSize)}>
                            <AvatarImage src={src || "/placeholder.svg"} alt={alt} />
                            <AvatarFallback>{fallback}</AvatarFallback>
                        </Avatar>
                    </div>
                )

            case "cyber-neon":
                return (
                    <div className={cn("relative group", className)}>
                        {/* Neon glow */}
                        <div
                            className={cn(
                                "absolute inset-[-10px] rounded-full bg-cyan-500/30 blur-xl transition-all duration-500 group-hover:bg-cyan-500/50 group-hover:blur-2xl",
                            )}
                            style={{ animation: "pulse-scale 2s ease-in-out infinite" }}
                        />
                        {/* Scan line */}
                        <div className="absolute inset-0 rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div
                                className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                                style={{ animation: "scan-line 2s linear infinite" }}
                            />
                        </div>
                        {/* Neon border */}
                        <div
                            className={cn(
                                "absolute inset-0 rounded-full border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.9)]",
                                baseSize,
                            )}
                        />
                        <div className={cn("absolute inset-[3px] rounded-full bg-black/90")} />
                        <Avatar className={cn("relative", baseSize)}>
                            <AvatarImage src={src || "/placeholder.svg"} alt={alt} />
                            <AvatarFallback className="bg-black/90 text-cyan-400">{fallback}</AvatarFallback>
                        </Avatar>
                        {/* Corner accents */}
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
                    </div>
                )

            default:
                return (
                    <Avatar className={cn(baseSize, className)}>
                        <AvatarImage src={src || "/placeholder.svg"} alt={alt} />
                        <AvatarFallback>{fallback}</AvatarFallback>
                    </Avatar>
                )
        }
    }

    return renderFrame()
}