"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/utils/utils";

interface FloatingDockProps {
    children: React.ReactNode;
    className?: string;
}

export function FloatingDock({ children, className }: FloatingDockProps) {
    const mouseX = useMotionValue(Infinity);

    return (
        <motion.div
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className={cn(
                "relative flex h-16 items-end gap-4 rounded-2xl bg-black/5 px-4 pb-3 pt-4 shadow-2xl backdrop-blur-xl dark:bg-white/10",
                className
            )}
        >
            {React.Children.map(children, (child) => {
                return React.cloneElement(child as React.ReactElement, {
                    mouseX: mouseX,
                });
            })}
        </motion.div>
    );
}

interface DockIconProps {
    children: React.ReactNode;
    className?: string;
    mouseX?: any; // Passed from FloatingDock
    onClick?: () => void;
    label?: string; // For the text that appears on hover
    active?: boolean; // To indicate if it's the active tab
}

export function DockIcon({ children, className, mouseX, onClick, label, active }: DockIconProps) {
    const ref = useRef<HTMLDivElement>(null);

    const distance = useTransform(mouseX, (val) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    const widthSync = useTransform(distance, [-110, 0, 110], [40, 80, 40]);
    const width = useSpring(widthSync, { stiffness: 110, damping: 15 });

    const heightSync = useTransform(distance, [-110, 0, 110], [40, 80, 40]);
    const height = useSpring(heightSync, { stiffness: 110, damping: 15 });

    const y = useTransform(distance, [-110, 0, 110], [0, -20, 0]); // Lift effect
    const ySpring = useSpring(y, { stiffness: 110, damping: 15 });

    return (
        <motion.div
            ref={ref}
            style={{ width, height, y: ySpring }}
            onClick={onClick}
            className={cn(
                "relative flex items-center justify-center rounded-xl text-gray-400 bg-white/20 shadow-md transition-colors duration-200",
                active ? "bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-lg shadow-cyan-500/25 after:w-1.5 after:h-1.5 after:rounded-full after:bg-gray-400 after:absolute after:-bottom-2.5 after:z-10" : "hover:bg-gray-400/70 hover:text-white hover-group:text-white",
                className
            )}
        >
            {children}
            {label && (
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    whileHover={{ opacity: 1, y: 5 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-10 -top-8 text-xs text-gray-100 bg-gray-400 px-2 py-1 rounded-md whitespace-nowrap"
                >
                    {label}
                </motion.span>
            )}
        </motion.div>
    );
}