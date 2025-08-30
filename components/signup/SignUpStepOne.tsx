"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { GraduationCap, Users, Briefcase, Building2, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { UserRole } from "@/types/auth" // Import from new types file

interface SignUpStepOneProps {
    formData: {
        role: UserRole
    }
    handleRoleSelect: (role: UserRole) => void
    error: string
}

export function SignUpStepOne({ formData, handleRoleSelect, error }: SignUpStepOneProps) {
    const roleOptions = [
        { value: "student", label: "Student", icon: GraduationCap, description: "Learning new skills" },
        { value: "instructor", label: "Instructor", icon: Users, description: "Teaching and sharing knowledge" },
        { value: "job_seeker", label: "Job Seeker", icon: Briefcase, description: "Advancing my career" },
        { value: "company", label: "Company", icon: Building2, description: "Training my team" },
        { value: "other", label: "Other", icon: Sparkles, description: "Just exploring" },
    ];

    return (
        <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <h2 className="text-2xl font-bold text-center">What best describes you?</h2>
            <p className="text-muted-foreground text-center">Choose your primary role to personalize your experience.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roleOptions.map((roleOption) => {
                    const IconComponent = roleOption.icon;
                    const isSelected = formData.role === roleOption.value;
                    return (
                        <Card
                            key={roleOption.value}
                            className={`cursor-pointer hover:shadow-lg transition-all ${isSelected ? 'ring-2 ring-primary' : 'border'}`}
                            onClick={() => handleRoleSelect(roleOption.value as UserRole)}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                    <IconComponent className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{roleOption.label}</h3>
                                    <p className="text-sm text-muted-foreground">{roleOption.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </motion.div>
    );
}