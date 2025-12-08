"use client";

import { cn } from "@/utils/utils";
import { AnimatePresence, motion } from "framer-motion";
import React, { ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface AnimatedModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
    className?: string;
    closeOnOverlayClick?: boolean;
}

export function AnimatedModal({
    open,
    onOpenChange,
    children,
    className,
    closeOnOverlayClick = true,
}: AnimatedModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [open]);

    // Handle outside click
    useEffect(() => {
        if (!closeOnOverlayClick) return;

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onOpenChange(false);
            }
        };

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [open, closeOnOverlayClick, onOpenChange]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{
                        opacity: 0,
                    }}
                    animate={{
                        opacity: 1,
                        backdropFilter: "blur(10px)",
                    }}
                    exit={{
                        opacity: 0,
                        backdropFilter: "blur(0px)",
                    }}
                    className="fixed [perspective:800px] [transform-style:preserve-3d] inset-0 h-full w-full flex items-center justify-center z-50"
                    onClick={() => closeOnOverlayClick && onOpenChange(false)}
                >
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 h-full w-full bg-black/10 bg-opacity-50 z-50"
                    />

                    {/* Modal Content */}
                    <motion.div
                        ref={modalRef}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "min-h-[50%] max-h-[90%] md:max-w-[60%] w-full mx-4 bg-white dark:bg-neutral-950 border border-transparent dark:border-neutral-800 md:rounded-2xl relative z-50 flex flex-col flex-1 overflow-hidden shadow-2xl",
                            className
                        )}
                        initial={{
                            opacity: 0,
                            scale: 0.5,
                            rotateX: 40,
                            y: 40,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            rotateX: 0,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.8,
                            rotateX: 10,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 15,
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => onOpenChange(false)}
                            className="absolute top-4 right-4 z-10 group p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                            <X className="w-5 h-5 text-black dark:text-white group-hover:scale-125 group-hover:rotate-3 transition-transform duration-200" />
                        </button>

                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export const AnimatedModalContent = ({ children, className }: { children: ReactNode; className?: string }) => {
    return (
        <div className={cn("flex flex-col flex-1 p-8 md:p-10 overflow-y-auto", className)}>
            {children}
        </div>
    );
};

export const AnimatedModalHeader = ({ children, className }: { children: ReactNode; className?: string }) => {
    return (
        <div className={cn("space-y-4 pb-6 border-b border-border/50", className)}>
            {children}
        </div>
    );
};

export const AnimatedModalTitle = ({ children, className }: { children: ReactNode; className?: string }) => {
    return (
        <h2 className={cn("text-2xl md:text-3xl font-bold", className)}>
            {children}
        </h2>
    );
};

export const AnimatedModalDescription = ({ children, className }: { children: ReactNode; className?: string }) => {
    return (
        <p className={cn("text-muted-foreground text-sm md:text-base", className)}>
            {children}
        </p>
    );
};

export const AnimatedModalFooter = ({ children, className }: { children: ReactNode; className?: string }) => {
    return (
        <div className={cn("flex justify-end p-4 bg-gray-100 dark:bg-neutral-900 border-t border-border/50", className)}>
            {children}
        </div>
    );
};

