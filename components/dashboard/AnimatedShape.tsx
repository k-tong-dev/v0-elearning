"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/utils';

interface AnimatedShapeProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    delay?: number;
    x?: number | string;
    y?: number | string;
    rotate?: number;
    shape?: 'square' | 'circle';
    color?: string;
}

export function AnimatedShape({
                                  className,
                                  size = 'md',
                                  delay = 0,
                                  x = 0,
                                  y = 0,
                                  rotate = 0,
                                  shape = 'square',
                                  color = 'bg-primary/10',
                              }: AnimatedShapeProps) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-20 h-20',
    };

    const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg';

    return (
        <motion.div
            className={cn(
                "absolute z-0 opacity-50",
                sizeClasses[size],
                shapeClass,
                color,
                className
            )}
            initial={{ opacity: 0, scale: 0.5, x: x, y: y, rotate: rotate }}
            animate={{
                opacity: [0.3, 0.6, 0.3], // Subtle opacity change
                scale: [0.7, 1.0, 0.7], // Subtle scale change
                rotate: [rotate, rotate + 360], // Continuous rotation
                x: [x, x + 20, x - 10, x + 15, x], // Gentle horizontal drift
                y: [y, y - 15, y + 10, y - 20, y], // Gentle vertical drift
            }}
            transition={{
                duration: 20 + Math.random() * 10, // Varied duration for organic feel
                repeat: Infinity,
                ease: "linear", // Smooth, continuous motion
                delay: delay,
                repeatType: "loop",
            }}
        />
    );
}