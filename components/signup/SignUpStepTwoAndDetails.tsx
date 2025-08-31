"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { User, Lock, Mail, Eye, EyeOff, Briefcase, Sparkles, Heart, GraduationCap, Video, FileText, Code, Laptop, Globe, Target, TrendingUp, Palette, Shield, Cloud } from "lucide-react"
import { motion } from "framer-motion"
import { UserPreferences } from "@/types/auth"

interface SignUpStepTwoAndDetailsProps {
    formData: {
        preferences: UserPreferences
        name: string
        email: string
        password: string
        confirmPassword: string
    }
    handlePreferenceToggle: (category: keyof UserPreferences, value: string) => void
    handleInputChange: (field: string, value: string) => void
    handleSignUp: (e: React.FormEvent) => Promise<void>
    error: string
    authLoading: boolean
    showPassword: boolean
    setShowPassword: (show: boolean) => void
    showConfirmPassword: boolean
    setShowConfirmPassword: (show: boolean) => void
}

export function SignUpStepTwoAndDetails({
                                            formData,
                                            handlePreferenceToggle,
                                            handleInputChange,
                                            handleSignUp,
                                            error,
                                            authLoading,
                                            showPassword,
                                            setShowPassword,
                                            showConfirmPassword,
                                            setShowConfirmPassword,
                                        }: SignUpStepTwoAndDetailsProps) {
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
            key="step2-details"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <h2 className="text-2xl font-bold text-center">Your Learning Profile & Account Details</h2>
            <p className="text-muted-foreground text-center">Help us tailor content recommendations and create your account.</p>

            {/* Preferences Section */}
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

            <Separator className="my-8" />

            {/* Account Details Section */}
            <h3 className="text-2xl font-bold text-center">Create Your Account</h3>
            <p className="text-muted-foreground text-center">Enter your details to finalize registration.</p>

            <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                        <User className="w-4 h-4 text-cyan-500" />
                        Full Name
                    </Label>
                    <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        required
                        className="h-12 transition-all duration-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 pl-4 text-base border-2 hover:border-cyan-300"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="w-4 h-4 text-emerald-500" />
                        Email Address
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                        className="h-12 transition-all duration-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 pl-4 text-base border-2 hover:border-emerald-300"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                        <Lock className="w-4 h-4 text-orange-500" />
                        Password
                    </Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={(e) => handleInputChange("password", e.target.value)}
                            required
                            className="h-12 transition-all duration-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 pl-4 pr-12 text-base border-2 hover:border-orange-300"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/20"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff className="w-4 h-4 text-orange-500" />
                            ) : (
                                <Eye className="w-4 h-4 text-orange-500" />
                            )}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium">
                        <Lock className="w-4 h-4 text-purple-500" />
                        Confirm Password
                    </Label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                            required
                            className="h-12 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 pl-4 pr-12 text-base border-2 hover:border-purple-300"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4 text-purple-500" />
                            ) : (
                                <Eye className="w-4 h-4 text-purple-500" />
                            )}
                        </Button>
                    </div>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 mb-4"
                    >
                        {error}
                    </motion.div>
                )}

                <Button
                    type="submit"
                    disabled={authLoading}
                    className="w-full h-12 bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500 hover:from-cyan-600 hover:via-emerald-600 hover:to-cyan-600 text-white transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/25 hover:scale-[1.02] text-lg font-semibold animate-gradient bg-[length:200%_200%]"
                >
                    {authLoading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Creating Account...
                        </div>
                    ) : (
                        "Create My Account"
                    )}
                </Button>
            </form>
        </motion.div>
    );
}