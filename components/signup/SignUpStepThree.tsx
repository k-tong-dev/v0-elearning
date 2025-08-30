"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { User, Lock, Mail, Eye, EyeOff } from "lucide-react"
import { motion } from "framer-motion"
import { GoogleSignIn } from "@/components/auth/google-signin" // Re-added GoogleSignIn import

interface SignUpStepThreeProps {
    formData: {
        name: string
        email: string
        password: string
        confirmPassword: string
    }
    handleInputChange: (field: string, value: string) => void
    handleSignUp: (e: React.FormEvent) => Promise<void>
    handleGoogleAuthSuccess: (credential: string) => Promise<void> // Re-added GoogleSignIn success handler
    error: string
    authLoading: boolean
    showPassword: boolean
    setShowPassword: (show: boolean) => void
    showConfirmPassword: boolean
    setShowConfirmPassword: (show: boolean) => void
}

export function SignUpStepThree({
                                    formData,
                                    handleInputChange,
                                    handleSignUp,
                                    handleGoogleAuthSuccess, // This prop is now used
                                    error,
                                    authLoading,
                                    showPassword,
                                    setShowPassword,
                                    showConfirmPassword,
                                    setShowConfirmPassword,
                                }: SignUpStepThreeProps) {
    const [googleError, setGoogleError] = React.useState(""); // State for GoogleSignIn errors

    return (
        <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <h2 className="text-2xl font-bold text-center">Create Your Account</h2>
            <p className="text-muted-foreground text-center">Almost there! Just a few more details.</p>

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

            <Separator className="my-8" />
            <div className="text-center space-y-4">
                <p className="text-muted-foreground">Or sign up with your Google account</p>
                {googleError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                        {googleError}
                    </div>
                )}
                <GoogleSignIn
                    text="signup_with"
                    onSuccess={handleGoogleAuthSuccess}
                    onError={(err) => setGoogleError(err)}
                />
            </div>
        </motion.div>
    );
}