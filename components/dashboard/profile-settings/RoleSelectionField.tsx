"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase, BookOpen, Building2, Sparkles } from "lucide-react"
import { UserRole } from "@/types/auth"

interface RoleSelectionFieldProps {
    role: UserRole
    onRoleChange: (role: UserRole) => void
}

const roleOptions = [
    { value: "student", label: "Student", icon: BookOpen },
    { value: "instructor", label: "Instructor", icon: Briefcase },
    { value: "company", label: "Company", icon: Building2 },
    { value: "job_seeker", label: "Job Seeker", icon: Briefcase },
    { value: "other", label: "Other", icon: Sparkles },
];

export function RoleSelectionField({ role, onRoleChange }: RoleSelectionFieldProps) {
    return (
        <div className="space-y-2">
            <Label>
                <Briefcase className="w-4 h-4 mr-2 text-purple-500" />
                Your Role
            </Label>
            <Select value={role} onValueChange={onRoleChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                    {roleOptions.map((roleOption) => (
                        <SelectItem key={roleOption.value} value={roleOption.value}>
                            <div className="flex items-center gap-2">
                                <roleOption.icon className="w-4 h-4" />
                                {roleOption.label}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}