"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { UserRole, UserPreferences } from "@/types/auth"
import { SignUpStepOne } from "@/components/signup/SignUpStepOne"
import { SignUpStepTwo } from "@/components/signup/SignUpStepTwo"
import { PageLoading } from "@/components/page-loading"

export default function GooglePreferencesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            <Header />
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading preferences...</div>}>
                <PreferencesContent />
            </Suspense>
            <Footer />
        </div>
    )
}

function PreferencesContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const userId = searchParams?.get("userId")
    const { refreshUser } = useAuth()

    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        role: "" as UserRole,
        preferences: {
            learningGoals: [] as string[],
            learningStyle: [] as string[],
            topicsOfInterest: [] as string[],
        } as UserPreferences,
    })
    const [error, setError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (!userId) {
            toast.error("User ID missing for preferences setup. Redirecting to home.")
            router.push("/")
        }
    }, [userId, router])

    const handleNextStep = () => {
        setError("")
        if (step === 1 && !formData.role) {
            setError("Please select a role.")
            return
        }
        if (
            step === 2 &&
            formData.preferences.learningGoals?.length === 0 &&
            formData.preferences.learningStyle?.length === 0 &&
            formData.preferences.topicsOfInterest?.length === 0
        ) {
            setError("Please select at least one preference.")
            return
        }
        setStep((prev) => prev + 1)
    }

    const handlePrevStep = () => {
        setError("")
        setStep((prev) => prev - 1)
    }

    const handleRoleSelect = (role: UserRole) => {
        setFormData((prev) => ({ ...prev, role }))
        setError("")
    }

    const handlePreferenceToggle = (category: keyof UserPreferences, value: string) => {
        setFormData((prev) => {
            const currentCategory = prev.preferences[category] || []
            const newCategory = currentCategory.includes(value)
                ? currentCategory.filter((item) => item !== value)
                : [...currentCategory, value]
            return {
                ...prev,
                preferences: {
                    ...prev.preferences,
                    [category]: newCategory,
                },
            }
        })
        setError("")
    }

    const handleSubmitPreferences = async () => {
        setError("")
        if (!formData.role) {
            setError("Please select a role.")
            return
        }
        if (
            formData.preferences.learningGoals?.length === 0 &&
            formData.preferences.learningStyle?.length === 0 &&
            formData.preferences.topicsOfInterest?.length === 0
        ) {
            setError("Please select at least one preference.")
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/users/${userId}/preferences`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    role: formData.role,
                    preferences: formData.preferences,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to save preferences.")
            }

            toast.success("Preferences saved successfully! Welcome to CamEdu.")
            await refreshUser() // Refresh user context to get updated role/preferences
            router.push("/dashboard") // Redirect to dashboard on success
        } catch (err: any) {
            console.error("Failed to save preferences:", err)
            setError(err.message || "Failed to save preferences. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <SignUpStepOne
                        formData={{ role: formData.role }}
                        handleRoleSelect={handleRoleSelect}
                        error={error}
                    />
                )
            case 2:
                return (
                    <SignUpStepTwo
                        formData={{ preferences: formData.preferences }}
                        handlePreferenceToggle={handlePreferenceToggle}
                        error={error}
                    />
                )
            default:
                return null
        }
    }

    if (!userId) {
        return <PageLoading message="Redirecting..." />
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 flex items-center justify-center">
            <Card className="w-full max-w-3xl p-6 md:p-8 border-2 shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                        Complete Your Profile
                    </CardTitle>
                    <p className="text-muted-foreground">Step {step} of 2</p>
                    <div className="flex justify-center gap-2 mt-4">
                        {[1, 2].map((s) => (
                            <div
                                key={s}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    s <= step ? "bg-primary w-8" : "bg-muted w-4"
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

                    <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>

                    <div className="flex justify-between mt-8">
                        {step > 1 && (
                            <Button variant="outline" onClick={handlePrevStep}>
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Previous
                            </Button>
                        )}
                        {step < 2 && (
                            <Button onClick={handleNextStep} className="ml-auto">
                                Next
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                        {step === 2 && (
                            <Button onClick={handleSubmitPreferences} disabled={isSubmitting} className="ml-auto">
                                {isSubmitting ? "Saving..." : "Finish Setup"}
                                {isSubmitting ? null : <ChevronRight className="w-4 h-4 ml-2" />}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}