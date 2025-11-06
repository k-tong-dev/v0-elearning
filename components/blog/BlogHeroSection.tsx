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
            className="text-center mb-12"
        >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {description}
            </p>
        </motion.div>
    );
}