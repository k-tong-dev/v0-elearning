"use client"

import React from "react"

interface FontAwesomeIconProps {
    icon: string
    className?: string
    size?: "xs" | "sm" | "lg" | "xl" | "2x" | "3x"
}

export function FontAwesomeIcon({ icon, className = "", size }: FontAwesomeIconProps) {
    // Parse the icon string - it should be like "fa fa-home" or "fa-home"
    const iconClasses = icon
        .split(" ")
        .filter(cls => cls.trim())
        .map(cls => {
            // Ensure it starts with 'fa'
            if (!cls.startsWith("fa")) {
                return `fa-${cls}`
            }
            return cls
        })
        .join(" ")

    const sizeClass = size ? `fa-${size}` : ""
    const allClasses = `fa ${iconClasses} ${sizeClass} ${className}`.trim()

    return <i className={allClasses} aria-hidden="true" />
}

