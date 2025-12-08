"use client"

import { motion } from "framer-motion"

interface VR3DObjectProps {
    size?: number
    className?: string
}

export function VR3DObject({ size = 400, className = "" }: VR3DObjectProps) {
    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            {/* Main Container with Perspective */}
            <div className="relative w-full h-full perspective-1000 transform-style-preserve-3d">
                {/* Outer Glowing Ring */}
                <motion.div
                    animate={{ 
                        rotateY: [0, 360],
                    }}
                    transition={{ 
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute inset-0 transform-style-preserve-3d"
                >
                    {/* Primary Ring - Cyan */}
                    <div 
                        className="absolute inset-0 rounded-full border-4"
                        style={{
                            borderColor: 'rgba(6, 182, 212, 0.4)',
                            boxShadow: '0 0 80px rgba(6, 182, 212, 0.3), inset 0 0 40px rgba(6, 182, 212, 0.2)',
                            background: 'radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.15), transparent 70%)',
                            backdropFilter: 'blur(20px)',
                            transform: 'rotateX(15deg) rotateZ(0deg)',
                        }}
                    />

                    {/* Secondary Ring - Emerald */}
                    <motion.div
                        animate={{ 
                            rotateZ: [0, 360],
                        }}
                        transition={{ 
                            duration: 25,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute inset-4 rounded-full border-3"
                        style={{
                            borderColor: 'rgba(16, 185, 129, 0.4)',
                            boxShadow: '0 0 60px rgba(16, 185, 129, 0.3), inset 0 0 30px rgba(16, 185, 129, 0.2)',
                            background: 'radial-gradient(circle at 70% 70%, rgba(16, 185, 129, 0.15), transparent 70%)',
                            backdropFilter: 'blur(15px)',
                            transform: 'rotateX(-15deg)',
                        }}
                    />

                    {/* Tertiary Ring - Cyan/Emerald Gradient */}
                    <motion.div
                        animate={{ 
                            rotateY: [0, 360],
                            rotateX: [0, 360],
                        }}
                        transition={{ 
                            rotateY: { duration: 35, repeat: Infinity, ease: "linear" },
                            rotateX: { duration: 28, repeat: Infinity, ease: "linear" },
                        }}
                        className="absolute inset-8 rounded-full border-2"
                        style={{
                            borderImage: 'linear-gradient(135deg, rgba(6, 182, 212, 0.5), rgba(16, 185, 129, 0.5)) 1',
                            borderColor: 'rgba(6, 182, 212, 0.3)',
                            boxShadow: '0 0 40px rgba(6, 182, 212, 0.2), 0 0 40px rgba(16, 185, 129, 0.2)',
                            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(16, 185, 129, 0.1))',
                            backdropFilter: 'blur(10px)',
                        }}
                    />
                </motion.div>

                {/* Central Core - Pulsing */}
                <motion.div
                    animate={{ 
                        scale: [0.9, 1.1, 0.9],
                        opacity: [0.6, 1, 0.6],
                    }}
                    transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    {/* Inner Glow Core */}
                    <div 
                        className="rounded-full"
                        style={{
                            width: '60%',
                            height: '60%',
                            background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.4), rgba(16, 185, 129, 0.3), transparent)',
                            boxShadow: '0 0 100px rgba(6, 182, 212, 0.5), 0 0 150px rgba(16, 185, 129, 0.4)',
                            backdropFilter: 'blur(30px)',
                        }}
                    />
                </motion.div>

                {/* Floating Particles */}
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            x: [
                                Math.cos((i * Math.PI) / 4) * (size * 0.35),
                                Math.cos((i * Math.PI) / 4) * (size * 0.4),
                                Math.cos((i * Math.PI) / 4) * (size * 0.35),
                            ],
                            y: [
                                Math.sin((i * Math.PI) / 4) * (size * 0.35),
                                Math.sin((i * Math.PI) / 4) * (size * 0.4),
                                Math.sin((i * Math.PI) / 4) * (size * 0.35),
                            ],
                            opacity: [0.3, 0.8, 0.3],
                            scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                            duration: 3 + (i * 0.5),
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.2,
                        }}
                        className="absolute top-1/2 left-1/2 rounded-full"
                        style={{
                            width: '12px',
                            height: '12px',
                            background: i % 2 === 0 
                                ? 'radial-gradient(circle, rgba(6, 182, 212, 0.8), transparent)'
                                : 'radial-gradient(circle, rgba(16, 185, 129, 0.8), transparent)',
                            boxShadow: i % 2 === 0
                                ? '0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(6, 182, 212, 0.3)'
                                : '0 0 20px rgba(16, 185, 129, 0.6), 0 0 40px rgba(16, 185, 129, 0.3)',
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                ))}

                {/* Rotating Inner Rings */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={`ring-${i}`}
                        animate={{
                            rotateZ: [0, 360],
                        }}
                        transition={{
                            duration: 20 - i * 4,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        className="absolute inset-0"
                        style={{
                            transform: `rotateX(${i * 30}deg)`,
                        }}
                    >
                        <div 
                            className="absolute top-1/2 left-1/2 rounded-full border"
                            style={{
                                width: `${40 + i * 15}%`,
                                height: `${40 + i * 15}%`,
                                borderColor: i % 2 === 0 
                                    ? 'rgba(6, 182, 212, 0.2)'
                                    : 'rgba(16, 185, 129, 0.2)',
                                borderWidth: '1px',
                                transform: 'translate(-50%, -50%)',
                                boxShadow: i % 2 === 0
                                    ? '0 0 30px rgba(6, 182, 212, 0.3)'
                                    : '0 0 30px rgba(16, 185, 129, 0.3)',
                            }}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Ambient Glow Effects */}
            <div 
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.15), transparent 60%), radial-gradient(circle at 70% 70%, rgba(16, 185, 129, 0.15), transparent 60%)',
                    filter: 'blur(40px)',
                    zIndex: -1,
                }}
            />
        </div>
    )
}

