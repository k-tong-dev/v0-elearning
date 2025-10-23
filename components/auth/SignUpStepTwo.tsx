"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Briefcase, Sparkles, Heart, GraduationCap, Video, FileText, Code, Laptop, Globe, Target, TrendingUp, Palette, Shield, Cloud } from "lucide-react"
import { motion } from "framer-motion"
import { UserPreferences } from "@/types/auth" // Import from new types file

interface SignUpStepTwoProps {
    formData: {
        preferences: UserPreferences
    }
    handlePreferenceToggle: (category: keyof UserPreferences, value: string) => void
    error: string
}

export function SignUpStepTwo({ formData, handlePreferenceToggle, error }: SignUpStepTwoProps) {
    const learningGoalsOptions = [
        { value: "career_advancement", label: "Career Advancement", icon: Briefcase },
        { value: "skill_improvement", label: "Skill Improvement", icon: Sparkles },
        { value: "personal_interest", label: "Personal Interest", icon: Heart },
        { value: "academic_support", label: "Academic Support", icon: GraduationCap },
    ];

    const learningStyleOptions = [
        { value: "video_lectures", label: "Video Lectures", icon: Video },
        { value: "text_readings", label: "Text Readings", icon: FileText },
        { value: "interactive_exercises", label: "Interactive Exercises", icon: Code },
        { value: "project_based", label: "Project-Based Learning", icon: Laptop },
    ];

    const topicsOfInterestOptions = [
        { value: "web_development", label: "Web Development", icon: Globe },
        { value: "ai_ml", label: "AI & Machine Learning", icon: Target },
        { value: "data_science", label: "Data Science", icon: TrendingUp },
        { value: "design", label: "UI/UX Design", icon: Palette },
        { value: "cybersecurity", label: "Cybersecurity", icon: Shield },
        { value: "cloud_computing", label: "Cloud Computing", icon: Cloud },
    ];

    return (
        <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <h2 className="text-2xl font-bold text-center">Tell us about your learning journey</h2>
            <p className="text-muted-foreground text-center">Help us tailor content recommendations for you.</p>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg">What are your primary learning goals?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {learningGoalsOptions.map(option => {
                        const IconComponent = option.icon;
                        const isSelected = formData.preferences.learningGoals?.includes(option.value);
                        return (
                            <Button
                                key={option.value}
                                variant={isSelected ? "default" : "outline"}
                                className={`justify-start ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/20'}`}
                                onClick={() => handlePreferenceToggle("learningGoals", option.value)}
                            >
                                <IconComponent className="w-4 h-4 mr-2" />
                                {option.label}
                            </Button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg">How do you prefer to learn?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {learningStyleOptions.map(option => {
                        const IconComponent = option.icon;
                        const isSelected = formData.preferences.learningStyle?.includes(option.value);
                        return (
                            <Button
                                key={option.value}
                                variant={isSelected ? "default" : "outline"}
                                className={`justify-start ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/20'}`}
                                onClick={() => handlePreferenceToggle("learningStyle", option.value)}
                            >
                                <IconComponent className="w-4 h-4 mr-2" />
                                {option.label}
                            </Button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg">What topics are you interested in?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {topicsOfInterestOptions.map(option => {
                        const IconComponent = option.icon;
                        const isSelected = formData.preferences.topicsOfInterest?.includes(option.value);
                        return (
                            <Button
                                key={option.value}
                                variant={isSelected ? "default" : "outline"}
                                className={`justify-start ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/20'}`}
                                onClick={() => handlePreferenceToggle("topicsOfInterest", option.value)}
                            >
                                <IconComponent className="w-4 h-4 mr-2" />
                                {option.label}
                            </Button>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}