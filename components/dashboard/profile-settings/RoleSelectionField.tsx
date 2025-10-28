"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase, BookOpen, Building2, Sparkles } from "lucide-react"
import { UserRoleSlug } from "@/types/user" // Updated import

interface RoleSelectionFieldProps {
    charactor: UserRoleSlug // Changed to charactor
    onCharactorChange: (charactor: UserRoleSlug) => void // Changed to onCharactorChange
}

const charactorOptions: { value: UserRoleSlug; label: string; icon: React.ElementType }[] = [
    { value: "student", label: "Student", icon: BookOpen },
    { value: "instructor", label: "Instructor", icon: Briefcase },
    { value: "company", label: "Company", icon: Building2 },
    { value: "job_seeker", label: "Job Seeker", icon: Briefcase },
    { value: "other", label: "Other", icon: Sparkles },
];

export function RoleSelectionField({ charactor, onCharactorChange }: RoleSelectionFieldProps) {
    return (
        <div className="space-y-2">
            <Label>
                <Briefcase className="w-4 h-4 mr-2 text-purple-500" />
                Your Charactor
            </Label>
            <Select value={charactor} onValueChange={onCharactorChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Select your charactor" />
                </SelectTrigger>
                <SelectContent>
                    {charactorOptions.map((charactorOption) => (
                        <SelectItem key={charactorOption.value} value={charactorOption.value}>
                            <div className="flex items-center gap-2">
                                <charactorOption.icon className="w-4 h-4" />
                                {charactorOption.label}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}