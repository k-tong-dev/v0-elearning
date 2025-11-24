"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getAvatarUrl } from "@/lib/getAvatarUrl";
import { Instructor } from "@/types/instructor";
import { getInstructor } from "@/integrations/strapi/instructor";

interface InstructorSelectorProps {
    value: number | null;
    collaboratingInstructors: Instructor[];
    onChange: (instructorId: number | null) => void;
    label?: string;
    placeholder?: string;
    helperText?: string;
}

/**
 * Reusable component for selecting a responsible instructor
 */
export function InstructorSelector({
    value,
    collaboratingInstructors,
    onChange,
    label = "Responsible Instructor",
    placeholder = "Select instructor (must be in collaboration)",
    helperText = "Only instructors from your collaboration groups are available.",
}: InstructorSelectorProps) {
    const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
    const [isLoadingInstructor, setIsLoadingInstructor] = useState(false);

    // If value exists but instructor is not in collaboratingInstructors, fetch it
    useEffect(() => {
        const instructors = Array.isArray(collaboratingInstructors) ? collaboratingInstructors : [];
        if (value && !instructors.find(inst => inst.id === value)) {
            setIsLoadingInstructor(true);
            getInstructor(value)
                .then((instructor) => {
                    if (instructor) {
                        setSelectedInstructor(instructor);
                    }
                })
                .catch((error) => {
                    console.error("Error fetching instructor:", error);
                })
                .finally(() => {
                    setIsLoadingInstructor(false);
                });
        } else if (value) {
            const instructors = Array.isArray(collaboratingInstructors) ? collaboratingInstructors : [];
            const found = instructors.find(inst => inst.id === value);
            setSelectedInstructor(found || null);
        } else {
            setSelectedInstructor(null);
        }
    }, [value, collaboratingInstructors]);

    // Combine collaborating instructors with the selected instructor if it's not in the list
    const allInstructors = React.useMemo(() => {
        // Ensure collaboratingInstructors is always an array
        const instructors = Array.isArray(collaboratingInstructors) 
            ? [...collaboratingInstructors] 
            : [];
        if (selectedInstructor && !instructors.find(inst => inst.id === selectedInstructor.id)) {
            instructors.push(selectedInstructor);
        }
        return instructors;
    }, [collaboratingInstructors, selectedInstructor]);

    const displayInstructor = value ? allInstructors.find(inst => inst.id === value) : null;

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Select
                value={value ? value.toString() : ""}
                onValueChange={(selectedValue) => {
                    if (selectedValue === "__no_instructors__") return;
                    onChange(selectedValue ? parseInt(selectedValue, 10) : null);
                }}
            >
                <SelectTrigger className="h-auto min-h-[2.5rem]">
                    {displayInstructor ? (
                        (() => {
                            const avatarUrl = getAvatarUrl(displayInstructor.avatar);
                            const initial = (displayInstructor.name || `I${displayInstructor.id}`).charAt(0).toUpperCase();
                            return (
                                <div className="flex items-center gap-2 w-full">
                                    {isLoadingInstructor ? (
                                        <div className="h-5 w-5 rounded-full bg-muted animate-pulse flex-shrink-0" />
                                    ) : avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt={displayInstructor.name || "Instructor"}
                                            className="h-5 w-5 rounded-full object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium flex-shrink-0">
                                            {initial}
                                        </div>
                                    )}
                                    <span className="truncate">
                                        {isLoadingInstructor ? "Loading..." : displayInstructor.name || `Instructor ${displayInstructor.id}`}
                                    </span>
                                </div>
                            );
                        })()
                    ) : (
                        <SelectValue placeholder={placeholder} />
                    )}
                </SelectTrigger>
                <SelectContent>
                    {allInstructors.length === 0 ? (
                        <SelectItem value="__no_instructors__" disabled>
                            No collaborating instructors found. Join or create an instructor group to collaborate.
                        </SelectItem>
                    ) : (
                        allInstructors.map((inst) => {
                            const avatarUrl = getAvatarUrl(inst.avatar);
                            const initial = (inst.name || `I${inst.id}`).charAt(0).toUpperCase();
                            const isNotInCollaboration = !collaboratingInstructors.find(collab => collab.id === inst.id);
                            return (
                                <SelectItem key={inst.id} value={inst.id.toString()}>
                                    <div className="flex items-center gap-2">
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt={inst.name || "Instructor"}
                                                className="h-6 w-6 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                                                {initial}
                                            </div>
                                        )}
                                        <span>{inst.name || `Instructor ${inst.id}`}</span>
                                        {isNotInCollaboration && (
                                            <span className="text-xs text-muted-foreground ml-auto">(Not in collaboration)</span>
                                        )}
                                    </div>
                                </SelectItem>
                            );
                        })
                    )}
                </SelectContent>
            </Select>
            {helperText && (
                <p className="text-xs text-muted-foreground">{helperText}</p>
            )}
        </div>
    );
}

