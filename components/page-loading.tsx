"use client"

import { motion, useMotionValue, useTransform } from "framer-motion"
import { useEffect, useState } from "react"

interface PageLoadingProps {
    message?: string
}

export function PageLoading({ message = "Loading..." }: PageLoadingProps) {
    const [isClient, setIsClient] = useState(false)
    const [friendlyMsg, setFriendlyMsg] = useState("Initializing systems...")

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const rotateX = useTransform(mouseY, [-300, 300], [2, -2])
    const rotateY = useTransform(mouseX, [-300, 300], [-2, 2])

    const systemMessages = [
        "Initializing systems...",
        "Loading resources...",
        "Preparing interface...",
        "Almost ready...",
    ]

    useEffect(() => {
        setIsClient(true)
        let index = 0
        const interval = setInterval(() => {
            index = (index + 1) % systemMessages.length
            setFriendlyMsg(systemMessages[index])
        }, 2800)
        return () => clearInterval(interval)
    }, [])

    return (
        <div
            className="absolute z-1000 min-w-screen min-h-screen flex flex-col items-center justify-center
                 bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#dbeafe]
                 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden"
            onMouseMove={(e) => {
                mouseX.set(e.clientX - window.innerWidth / 2)
                mouseY.set(e.clientY - window.innerHeight / 2)
            }}
        >
            <motion.div
                className="absolute top-[10%] left-[8%] w-[400px] h-[400px] rounded-[60%_40%_30%_70%/40%_60%_50%_50%]
                   bg-gradient-to-br from-[#20B2AA]/20 to-[#17a89a]/20 blur-3xl"
                animate={
                    isClient
                        ? {
                            borderRadius: [
                                "60% 40% 30% 70% / 40% 60% 50% 50%",
                                "30% 60% 70% 40% / 50% 40% 60% 50%",
                                "50% 50% 50% 50% / 60% 40% 60% 40%",
                                "60% 40% 30% 70% / 40% 60% 50% 50%",
                            ],
                            x: [0, 60, -40, 0],
                            y: [0, -50, 60, 0],
                            scale: [1, 1.2, 0.9, 1],
                        }
                        : {}
                }
                transition={{
                    duration: 15,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
            />

            <motion.div
                className="absolute bottom-[15%] right-[10%] w-[350px] h-[350px] rounded-[40%_60%_60%_40%/60%_30%_70%_40%]
                   bg-gradient-to-br from-[#9B7EBD]/20 to-[#8B6EAD]/20 blur-3xl"
                animate={
                    isClient
                        ? {
                            borderRadius: [
                                "40% 60% 60% 40% / 60% 30% 70% 40%",
                                "60% 40% 40% 60% / 30% 70% 40% 60%",
                                "50% 50% 60% 40% / 50% 50% 60% 40%",
                                "40% 60% 60% 40% / 60% 30% 70% 40%",
                            ],
                            x: [0, -50, 70, 0],
                            y: [0, 60, -40, 0],
                            scale: [1, 0.85, 1.15, 1],
                        }
                        : {}
                }
                transition={{
                    duration: 18,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
            />

            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-20 h-20 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md
                     border border-white/20 dark:border-white/10 shadow-xl"
                    style={{
                        left: `${15 + i * 12}%`,
                        top: `${20 + (i % 3) * 20}%`,
                    }}
                    animate={
                        isClient
                            ? {
                                y: [0, -30, 0],
                                x: [0, 15, 0],
                                scale: [1, 1.1, 1],
                            }
                            : {}
                    }
                    transition={{
                        duration: 4 + i * 0.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                        delay: i * 0.3,
                    }}
                />
            ))}

            <motion.div style={{ rotateX, rotateY, perspective: 1200 }} className="relative z-10">
                <div className="relative w-64 h-64 flex items-center justify-center">
                    <motion.div
                        className="absolute inset-0 rounded-[60%_40%_30%_70%/40%_60%_50%_50%]
                       bg-gradient-to-br from-[#20B2AA] via-[#17a89a] to-[#20B2AA]
                       shadow-2xl shadow-[#20B2AA]/40"
                        animate={
                            isClient
                                ? {
                                    borderRadius: [
                                        "60% 40% 30% 70% / 40% 60% 50% 50%",
                                        "30% 60% 70% 40% / 50% 40% 60% 50%",
                                        "50% 50% 50% 50% / 60% 40% 60% 40%",
                                        "40% 60% 50% 50% / 50% 60% 40% 60%",
                                        "60% 40% 30% 70% / 40% 60% 50% 50%",
                                    ],
                                    scale: [1, 1.05, 0.95, 1.02, 1],
                                    rotate: [0, 90, 180, 270, 360],
                                }
                                : {}
                        }
                        transition={{
                            duration: 8,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                        }}
                    />

                    <motion.div
                        className="absolute inset-8 rounded-[50%_50%_60%_40%/50%_60%_40%_50%]
                       bg-white/30 dark:bg-white/10 backdrop-blur-xl
                       border border-white/40 dark:border-white/20"
                        animate={
                            isClient
                                ? {
                                    borderRadius: [
                                        "50% 50% 60% 40% / 50% 60% 40% 50%",
                                        "60% 40% 50% 50% / 40% 50% 60% 50%",
                                        "40% 60% 50% 50% / 60% 40% 50% 60%",
                                        "50% 50% 60% 40% / 50% 60% 40% 50%",
                                    ],
                                    scale: [1, 1.08, 0.92, 1],
                                }
                                : {}
                        }
                        transition={{
                            duration: 6,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                        }}
                    />

                    <motion.div
                        className="relative z-10 w-24 h-24 rounded-full
                       bg-gradient-to-br from-white/60 to-white/20 dark:from-white/30 dark:to-white/10
                       backdrop-blur-2xl border border-white/60 dark:border-white/30
                       shadow-2xl shadow-[#20B2AA]/30"
                        animate={
                            isClient
                                ? {
                                    scale: [1, 1.15, 1],
                                }
                                : {}
                        }
                        transition={{
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                        }}
                    >
                        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
                    </motion.div>

                    {[0, 1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute inset-0 rounded-full border-2 border-[#20B2AA]/30"
                            animate={
                                isClient
                                    ? {
                                        scale: [1, 1.8, 1.8],
                                        opacity: [0.6, 0.2, 0],
                                    }
                                    : {}
                            }
                            transition={{
                                duration: 3,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "easeOut",
                                delay: i * 0.75,
                            }}
                        />
                    ))}
                </div>
            </motion.div>

            <motion.div
                className="mt-20 text-center space-y-3 relative z-10 px-12 py-8 rounded-[2rem]
                   bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl
                   border border-white/60 dark:border-white/20
                   shadow-2xl shadow-black/5 dark:shadow-black/20"
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                    delay: 0.2,
                }}
            >
                <h2 className="text-2xl font-bold tracking-tight text-foreground">{message}</h2>

                <motion.p
                    key={friendlyMsg}
                    className="text-sm font-medium text-muted-foreground"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                    }}
                >
                    {friendlyMsg}
                </motion.p>
            </motion.div>

            <div className="flex gap-3 justify-center mt-8 relative z-10">
                {[0, 1, 2, 3].map((index) => (
                    <motion.div
                        key={index}
                        className="w-2.5 h-2.5 rounded-full bg-[#20B2AA] shadow-lg shadow-[#20B2AA]/30"
                        animate={
                            isClient
                                ? {
                                    scale: [1, 1.8, 1],
                                    opacity: [0.4, 1, 0.4],
                                }
                                : {}
                        }
                        transition={{
                            duration: 1.5,
                            repeat: Number.POSITIVE_INFINITY,
                            delay: index * 0.2,
                            ease: [0.34, 1.56, 0.64, 1],
                        }}
                    />
                ))}
            </div>
        </div>
    )
}
