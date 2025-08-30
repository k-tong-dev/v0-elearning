"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { UserRole, UserPreferences } from "@/types/auth" // Import from new types file
import { SignUpStepOne } from "@/components/signup/SignUpStepOne"
import { SignUpStepTwo } from "@/components/signup/SignUpStepTwo"
import { SignUpStepThree } from "@/components/signup/SignUpStepThree"

export default function SignUpPage() {
    const router = useRouter()
    const { register, isLoading: authLoading } = useAuth() // Removed loginWithGoogle
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        role: "" as UserRole,
        preferences: {
            learningGoals: [] as string[],
            learningStyle: [] as string[],
            topicsOfInterest: [] as string[],
        } as UserPreferences,
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    })
    const [error, setError] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const handleNextStep = () => {
        setError("")
        if (step === 1 && !formData.role) {
            setError("Please select a role.")
            return
        }
        if (step === 2 &&
            formData.preferences.learningGoals?.length === 0 &&
            formData.preferences.learningStyle?.length === 0 &&
            formData.preferences.topicsOfInterest?.length === 0
        ) {
            setError("Please select at least one preference.")
            return;
        }
        setStep(prev => prev + 1)
    }

    const handlePrevStep = () => {
        setError("")
        setStep(prev => prev - 1)
    }

    const handleRoleSelect = (role: UserRole) => {
        setFormData(prev => ({ ...prev, role }))
        setError("")
    }

    const handlePreferenceToggle = (category: keyof UserPreferences, value: string) => {
        setFormData(prev => {
            const currentCategory = prev.preferences[category] || [];
            const newCategory = currentCategory.includes(value)
                ? currentCategory.filter(item => item !== value)
                : [...currentCategory, value];
            return {
                ...prev,
                preferences: {
                    ...prev.preferences,
                    [category]: newCategory,
                },
            };
        });
        setError("");
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match!")
            return
        }

        try {
            await register(formData.name, formData.email, formData.password, formData.role, formData.preferences)
            toast.success("Account created successfully! Welcome to CamEdu.")
            router.push("/dashboard") // Redirect to dashboard on success
        } catch (err: any) {
            console.error("Sign up failed:", err)
            setError(err.message || "Sign up failed. Please try again.")
        }
    }

    // Removed handleGoogleAuthSuccess as it's no longer needed here

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <SignUpStepOne
                        formData={formData}
                        handleRoleSelect={handleRoleSelect}
                        error={error}
                    />
                );
            case 2:
                return (
                    <SignUpStepTwo
                        formData={formData}
                        handlePreferenceToggle={handlePreferenceToggle}
                        error={error}
                    />
                );
            case 3:
                return (
                    <SignUpStepThree
                        formData={formData}
                        handleInputChange={handleInputChange}
                        handleSignUp={handleSignUp}
                        // Removed handleGoogleAuthSuccess prop
                        error={error}
                        authLoading={authLoading}
                        showPassword={showPassword}
                        setShowPassword={setShowPassword}
                        showConfirmPassword={showConfirmPassword}
                        setShowConfirmPassword={setShowConfirmPassword}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            <Header />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 flex items-center justify-center">
                <Card className="w-full max-w-3xl p-6 md:p-8 border-2 shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                            Sign Up
                        </CardTitle>
                        <p className="text-muted-foreground">Step {step} of 3</p>
                        <div className="flex justify-center gap-2 mt-4">
                            {[1, 2, 3].map(s => (
                                <div
                                    key={s}
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        s <= step ? 'bg-primary w-8' : 'bg-muted w-4'
                                    }`}
                                />
                            ))}
                        </div>
                    </CardHeader>

                    <CardContent className="pt-4">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 mb-4"
                            >
                                {error}
                            </motion.div>
                        )}

                        <AnimatePresence mode="wait">
                            {renderStepContent()}
                        </AnimatePresence>

                        <div className="flex justify-between mt-8">
                            {step > 1 && (
                                <Button variant="outline" onClick={handlePrevStep}>
                                    <ChevronLeft className="w-4 h-4 mr-2" />
                                    Previous
                                </Button>
                            )}
                            {step < 3 && (
                                <Button onClick={handleNextStep} className="ml-auto">
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            )}
                        </div>

                        {step === 3 && (
                            <p className="text-center text-sm text-muted-foreground mt-8">
                                Already have an account?{" "}
                                <Button
                                    variant="link"
                                    onClick={() => router.push("/login")} // Assuming a /login page or modal
                                    className="text-primary hover:underline p-0 h-auto"
                                >
                                    Sign in instead
                                </Button>
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Footer />
        </div>
    )
}