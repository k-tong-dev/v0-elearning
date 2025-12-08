"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Sparkles,
    Mail,
    ArrowRight,
    Loader2,
    Lock,
    UserPlus,
    Shield,
    Zap,
    CheckCircle2,
    X,
    Eye,
    EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { PageLoading } from "@/components/page-loading"
import { BackgroundBeamsWithCollision } from "@/components/ui/backgrounds/background-beams-with-collision"
import { supabase } from "@/integrations/supabase/client"
import { checkStrapiUserExists } from "@/integrations/strapi/utils"
import { storeEmailForOTP } from "@/lib/cookies"
import { ErrorModal } from "@/components/ui/ErrorModal"

interface AuthFlowUltraProps {
    initialMode?: "signin" | "signup"
    onSuccess?: () => void
}

export function AuthFlowUltra({ initialMode = "signin", onSuccess }: AuthFlowUltraProps) {
    const router = useRouter()
    const { loginWithGoogle, isLoading: authLoading } = useAuth()
    const [mode, setMode] = useState<"signin" | "signup">(initialMode)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [error, setError] = useState("")
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
    const [modalErrorDetails, setModalErrorDetails] = useState({ title: "", message: "" })

    const handleGoogleAuthSuccess = async (credential: string) => {
        setIsGoogleLoading(true)
        try {
            const { newUser, user } = await loginWithGoogle(credential)
            if (newUser) {
                router.push(`/auth/signup`)
            } else {
                toast.success("Welcome back!", { position: "top-center" })
                onSuccess?.()
                router.push("/")
            }
        } catch (error: any) {
            console.error("Google authentication failed:", error)
            toast.error(error.message || "Google authentication failed", { position: "top-center" })
        } finally {
            setIsGoogleLoading(false)
        }
    }

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setIsErrorModalOpen(false)

        try {
            const userExistsInStrapi = await checkStrapiUserExists(email)

            if (userExistsInStrapi) {
                toast.info("Welcome back! Please confirm your password.", { position: "top-center" })
                router.push(`/auth/password-confirmation?email=${encodeURIComponent(email)}`)
                return
            }

            const { error: otpError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/verify-otp?email=${encodeURIComponent(email)}`,
                },
            })

            if (otpError) throw otpError

            storeEmailForOTP(email)
            toast.success("OTP sent to your email!", { position: "top-center" })
            router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`)
        } catch (error: any) {
            console.error("Email auth error:", error)
            setError(error.message || "Something went wrong")
            setModalErrorDetails({
                title: "Authentication Error",
                message: error.message || "Failed to process your request. Please try again.",
            })
            setIsErrorModalOpen(true)
        } finally {
            setLoading(false)
        }
    }

    if (authLoading) {
        return <PageLoading message="Checking authentication status..." />
    }

    return (
        <BackgroundBeamsWithCollision className="min-h-screen via-background overflow-hidden scrollbar-hide items-start">
            <div className="min-h-screen flex items-center justify-center via-background p-4">
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="w-full max-w-md relative"
                >
                    {/* Glass card with gradient border */}
                    <div className="relative">
                        {/* Gradient border effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-75 animate-pulse" />
                        
                        {/* Main card */}
                        <div className="relative bg-background/95 backdrop-blur-2xl rounded-2xl border border-border/50 p-8 space-y-6 shadow-2xl">
                            {/* Header */}
                            <div className="text-center space-y-4">
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                    className="mx-auto w-20 h-20 relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-60 animate-pulse" />
                                    <div className="relative w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                                        {mode === "signin" ? (
                                            <Lock className="w-10 h-10 text-white" />
                                        ) : (
                                            <UserPlus className="w-10 h-10 text-white" />
                                        )}
                                        <motion.div
                                            className="absolute inset-0 rounded-2xl"
                                            animate={{
                                                background: [
                                                    "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)",
                                                    "linear-gradient(225deg, rgba(255,255,255,0.3) 0%, transparent 100%)",
                                                    "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)",
                                                ],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                            }}
                                        />
                                    </div>
                                </motion.div>
                                
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                        {mode === "signin" ? "Welcome Back" : "Get Started"}
                                    </h2>
                                    <p className="text-muted-foreground mt-2">
                                        {mode === "signin"
                                            ? "Sign in to continue your learning journey"
                                            : "Create your account and start learning"}
                                    </p>
                                </motion.div>
                            </div>

                            {/* Mode Toggle */}
                            <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-xl">
                                <button
                                    onClick={() => setMode("signin")}
                                    className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-300 ${
                                        mode === "signin"
                                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => setMode("signup")}
                                    className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-300 ${
                                        mode === "signup"
                                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    Sign Up
                                </button>
                            </div>

                            {/* Google Auth */}
                            <GoogleAuthButton
                                onSuccess={handleGoogleAuthSuccess}
                                onError={(msg) => toast.error(msg)}
                                text="continue_with"
                                className="w-full"
                                isLoading={isGoogleLoading}
                            />

                            <div className="relative flex items-center my-4">
                                <Separator className="flex-1 bg-border" />
                                <span className="px-4 text-muted-foreground text-sm">or</span>
                                <Separator className="flex-1 bg-border" />
                            </div>

                            {/* Email Form */}
                            <form onSubmit={handleEmailSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-semibold">
                                        Email Address
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 h-12 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading || isGoogleLoading}
                                    className="w-full h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Continue with Email
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            {/* Features */}
                            <div className="pt-4 border-t border-border/50">
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { icon: Shield, label: "Secure" },
                                        { icon: Zap, label: "Fast" },
                                        { icon: CheckCircle2, label: "Verified" },
                                    ].map((feature, index) => {
                                        const Icon = feature.icon
                                        return (
                                            <motion.div
                                                key={feature.label}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 + index * 0.1 }}
                                                className="flex flex-col items-center gap-1 text-center"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                                    <Icon className="w-5 h-5 text-primary" />
                                                </div>
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    {feature.label}
                                                </span>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Terms */}
                            <p className="text-center text-xs text-muted-foreground">
                                By continuing, you agree to our{" "}
                                <a href="/terms" className="text-primary hover:underline font-medium">
                                    Terms
                                </a>{" "}
                                and{" "}
                                <a href="/privacy" className="text-primary hover:underline font-medium">
                                    Privacy Policy
                                </a>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Error Modal */}
            <ErrorModal
                isOpen={isErrorModalOpen}
                onClose={() => setIsErrorModalOpen(false)}
                title={modalErrorDetails.title}
                message={modalErrorDetails.message}
            />
        </BackgroundBeamsWithCollision>
    )
}

