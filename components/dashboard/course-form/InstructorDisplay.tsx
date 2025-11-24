"use client";

import React, { useEffect, useState } from "react";
import { getAvatarUrl } from "@/lib/getAvatarUrl";
import { Instructor } from "@/types/instructor";
import { getInstructor } from "@/integrations/strapi/instructor";

interface InstructorDisplayProps {
    instructor: Instructor | number | object | null;
    collaboratingInstructors: Instructor[];
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
    className?: string;
}

/**
 * Reusable component to display instructor information
 * Handles both number and object formats from Strapi
 */
export function InstructorDisplay({
    instructor,
    collaboratingInstructors,
    size = "md",
    showLabel = false,
    className = "",
}: InstructorDisplayProps) {
    const [instructorData, setInstructorData] = useState<Instructor | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Extract instructor ID - handle both number and object formats
    let instructorId: number | null = null;
    if (instructor) {
        if (typeof instructor === 'number') {
            instructorId = instructor;
        } else if (typeof instructor === 'object' && instructor !== null) {
            instructorId = (instructor as any)?.id || null;
        }
    }

    // Try to find instructor in collaboratingInstructors first
    useEffect(() => {
        if (!instructorId) {
            setInstructorData(null);
            return;
        }

        const found = collaboratingInstructors.find(inst => inst.id === instructorId);
        if (found) {
            setInstructorData(found);
        } else {
            // If not found in collaborating instructors, fetch it
            setIsLoading(true);
            getInstructor(instructorId)
                .then((instructor) => {
                    setInstructorData(instructor);
                })
                .catch((error) => {
                    console.error("Error fetching instructor:", error);
                    setInstructorData(null);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [instructorId, collaboratingInstructors]);

    if (!instructorId || (!instructorData && !isLoading)) {
        return null;
    }

    if (isLoading) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                {showLabel && (
                    <span className="text-xs text-muted-foreground">Responsible:</span>
                )}
                <div className="px-2 py-1 rounded-md bg-muted animate-pulse">
                    <span className="text-xs text-muted-foreground">Loading...</span>
                </div>
            </div>
        );
    }

    const avatarUrl = getAvatarUrl(instructorData.avatar);
    const initial = (instructorData.name || `I${instructorData.id}`).charAt(0).toUpperCase();

    // Size configurations
    const sizeConfig = {
        sm: {
            avatar: "w-4 h-4",
            text: "text-xs",
            container: "px-2 py-0.5",
            label: "text-xs",
        },
        md: {
            avatar: "w-5 h-5",
            text: "text-xs",
            container: "px-2 py-1",
            label: "text-xs",
        },
        lg: {
            avatar: "w-6 h-6",
            text: "text-sm",
            container: "px-3 py-1.5",
            label: "text-sm",
        },
    };

    const config = sizeConfig[size];

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {showLabel && (
                <span className={`${config.label} text-muted-foreground`}>Responsible:</span>
            )}
            <div className={`flex items-center gap-1.5 ${config.container} rounded-md bg-primary/10 text-primary`}>
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={instructorData.name}
                        className={`${config.avatar} rounded-full object-cover`}
                    />
                ) : (
                    <div className={`${config.avatar} rounded-full bg-primary/20 flex items-center justify-center ${config.text} font-medium`}>
                        {initial}
                    </div>
                )}
                <span className={`${config.text} font-medium`}>{instructorData.name}</span>
            </div>
        </div>
    );
}

