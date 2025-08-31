"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface GlitchTextProps {
    text: string;
    className?: string;
    delay?: number;
}

const charVariants = {
    initial: { opacity: 1, y: 0, x: 0 },
    glitch: {
        opacity: [0.1, 0.8, 0.1, 1],
        y: [0, -2, 2, 0],
        x: [0, 1, -1, 0],
        transition: {
            duration: 0.1,
            repeat: 1,
            repeatType: "reverse",
            ease: "easeOut",
        },
    },
};

export function GlitchText({ text, className, delay = 0 }: GlitchTextProps) {
    return (
        <motion.span
            className={className}
            initial="initial"
            animate="initial"
            whileHover="glitch" // Trigger glitch on hover
            transition={{ staggerChildren: 0.02, delayChildren: delay }}
        >
            {text.split("").map((char, i) => (
                <motion.span key={i} variants={charVariants} className="inline-block">
                    {char}
                </motion.span>
            ))}
        </motion.span>
    );
}