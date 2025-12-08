"use client";

import React from "react";
import { motion } from "framer-motion";

interface BlogHeroSectionProps {
    title: string;
    description: string;
}

export function BlogHeroSection({ title, description }: BlogHeroSectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
        >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white drop-shadow-lg">
                {title}
            </h1>
            <p className="text-lg md:text-xl text-blue-50 max-w-2xl mx-auto drop-shadow-md">
                {description}
            </p>
        </motion.div>
    );
}