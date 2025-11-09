"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Mail, ArrowRight, Loader2, Lock, UserPlus, Shield, Zap, CheckCircle2, Rocket, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { PageLoading } from "@/components/page-loading"
import { BackgroundBeamsWithCollision } from "@/components/ui/backgrounds/background-beams-with-collision"
import { supabase } from "@/integrations/supabase/client"
import { checkStrapiUserExists } from "@/integrations/strapi/utils"
import { storeEmailForOTP } from "@/lib/cookies"
import { ErrorModal } from "@/components/ui/ErrorModal"

interface AuthFlowUltraV2Props {
    initialMode?: "signin" | "signup"
    onSuccess?: () => void
}

export function AuthFlowUltraV2({ initialMode = "signin", onSuccess }: AuthFlowUltraV2Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { loginWithGoogle, isLoading: authLoading } = useAuth()
    const [mode, setMode] = useState<"signin" | "signup">(initialMode)
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [error, setError] = useState("")
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
    const [modalErrorDetails, setModalErrorDetails] = useState({ title: "", message: "" })
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Mouse tracking for interactive effects
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                setMousePosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                })
            }
        }
        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [])

    const handleGoogleAuthSuccess = async (credential: string) => {
        setIsGoogleLoading(true)
        try {
            const { newUser, user } = await loginWithGoogle(credential)
            if (newUser) {
                router.push(`/auth/signup`)
            } else {
                toast.success("Welcome back!", { position: "top-center" })
                onSuccess?.()
                const redirect = searchParams.get("redirect")
                router.push(redirect || "/")
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

    const features = [
        { icon: Shield, label: "Secure", color: "from-blue-500 to-cyan-500" },
        { icon: Zap, label: "Fast", color: "from-purple-500 to-pink-500" },
        { icon: Rocket, label: "Modern", color: "from-orange-500 to-red-500" },
        { icon: Heart, label: "Trusted", color: "from-pink-500 to-rose-500" },
    ]

    return (
        <BackgroundBeamsWithCollision className="min-h-screen via-background overflow-hidden scrollbar-hide items-start">
            <div ref={containerRef} className="relative min-h-screen flex items-center justify-center p-6 overflow-auto scrollbar-hide">
                {/* Decorative layers */}
                <div className="pointer-events-none absolute inset-0">
                    <motion.div
                        className="absolute -left-48 top-10 h-72 w-72 rounded-full blur-3xl"
                        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 65%)" }}
                        animate={{
                            x: [0, mousePosition.x * 0.04, 0],
                            y: [0, mousePosition.y * 0.04, 0],
                            scale: [0.95, 1.1, 0.95],
                            opacity: [0.5, 0.7, 0.5],
                        }}
                        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute -right-40 bottom-16 h-80 w-80 rounded-full blur-3xl"
                        style={{ background: "radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)" }}
                        animate={{
                            x: [0, mousePosition.x * -0.03, 0],
                            y: [0, mousePosition.y * 0.03, 0],
                            scale: [1, 1.12, 1],
                            opacity: [0.4, 0.6, 0.4],
                        }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl opacity-70"
                        animate={{ rotate: [0, 180, 360], scale: [1, 1.05, 1] }}
                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    />
                </div>

                <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 gap-8 md:gap-12 xl:gap-14 items-start lg:items-start lg:grid-cols-[1.05fr_1fr]">
                    {/* Hero / Copy column */}
                    <motion.section
                        initial={{ opacity: 0, x: -45 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.2 }}
                        className="relative order-2 lg:order-1 rounded-3xl border border-white/20 bg-white/55 dark:bg-slate-950/40 backdrop-blur-3xl p-6 sm:p-8 lg:p-12 shadow-[0_35px_120px_-40px_rgba(59,130,246,0.45)] overflow-hidden w-full"
                    >
                        <motion.div
                            className="absolute inset-0 opacity-60"
                            style={{
                                background:
                                    "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.18) 0%, transparent 55%), radial-gradient(circle at 80% 10%, rgba(236,72,153,0.2) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(124,58,237,0.18) 0%, transparent 55%)",
                            }}
                            animate={{ opacity: [0.4, 0.65, 0.4] }}
                            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                        />

                        <div className="relative space-y-7 sm:space-y-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35, type: "spring", stiffness: 150, damping: 18 }}
                                className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:bg-white/10 dark:text-slate-200 shadow-sm"
                            >
                                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                                Ultra Secure Learning Access
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45, type: "spring", stiffness: 110, damping: 18 }}
                                className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent"
                            >
                                Your passport to an immersive learning universe.
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 }}
                                className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-200/80 max-w-3xl leading-relaxed"
                            >
                                One frictionless entry for courses, live cohorts, and community experiences. Verified access keeps your progress synced with Strapi while Supabase powers real-time security.
                            </motion.p>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {[
                                    {
                                        icon: Shield,
                                        title: "Enterprise security",
                                        description: "JWT-secured auth with token hardening and session isolation",
                                    },
                                    {
                                        icon: Zap,
                                        title: "Instant onboarding",
                                        description: "OTP hand-off to multi-step profile personalization without friction",
                                    },
                                    {
                                        icon: Rocket,
                                        title: "Momentum preserved",
                                        description: "Progress-aware routing keeps you in flow across devices",
                                    },
                                    {
                                        icon: Heart,
                                        title: "Trusted globally",
                                        description: "Backed by Supabase & Strapi best practices used by teams worldwide",
                                    },
                                ].map((feature, index) => {
                                    const Icon = feature.icon
                                    return (
                                        <motion.div
                                            key={feature.title}
                                            initial={{ opacity: 0, y: 25 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.65 + index * 0.08, type: "spring", stiffness: 120, damping: 16 }}
                                            className="group relative rounded-2xl border border-white/40 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-4 shadow-sm hover:shadow-xl transition-all duration-300"
                                        >
                                            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-blue-500/0 via-purple-500/10 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            <div className="relative flex items-start gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 text-blue-600 dark:text-blue-300">
                                                    <Icon className="h-4.5 w-4.5" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-semibold text-slate-800 dark:text-white">
                                                        {feature.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                        {feature.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 }}
                                className="grid gap-3 sm:grid-cols-3 mt-4"
                            >
                                {["SOC2-ready", "99.9% uptime", "Continuous backups"].map((badge) => (
                                    <div
                                        key={badge}
                                        className="flex items-center justify-center rounded-full border border-white/50 bg-white/70 px-3 py-2 text-[11px] font-semibold tracking-wide text-slate-600 dark:bg-white/10 dark:text-slate-200"
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                                        {badge}
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    </motion.section>

                    {/* Auth card */}
                    <motion.section
                        initial={{ opacity: 0, x: 45 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.25 }}
                        className="relative order-1 lg:order-2 w-full"
                    >
                        <motion.div
                            className="absolute -inset-[2px] rounded-[28px]"
                            style={{
                                background: "conic-gradient(from 180deg at 50% 50%, rgba(59,130,246,0.6), rgba(236,72,153,0.6), rgba(124,58,237,0.6), rgba(59,130,246,0.6))",
                                filter: "blur(14px)",
                                opacity: 0.65,
                            }}
                            animate={{ rotate: [0, 90, 180, 270, 360] }}
                            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                        />

                        <div className="relative rounded-[26px] border border-white/40 bg-white/95 dark:bg-slate-950/70 backdrop-blur-2xl shadow-[0_25px_85px_-30px_rgba(59,130,246,0.55)]">
                            <div className="relative overflow-hidden rounded-[26px]">
                                <div className="absolute inset-0 opacity-60" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(236,72,153,0.12) 100%)" }} />

                                <div className="relative z-10 px-6 py-8 sm:p-9 space-y-8">
                                    <div className="text-center space-y-4">
                                <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.35, type: "spring", stiffness: 260, damping: 20 }}
                                            className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl"
                                        >
                                        <AnimatePresence mode="wait">
                                            {mode === "signin" ? (
                                                <motion.div
                                                    key="signin"
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0 }}
                                                        transition={{ duration: 0.25 }}
                                                >
                                                        <Lock className="h-10 w-10 text-white" />
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="signup"
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0 }}
                                                        transition={{ duration: 0.25 }}
                                                >
                                                        <UserPlus className="h-10 w-10 text-white" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                </motion.div>

                                        <div className="space-y-2">
                                            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
                                                {mode === "signin" ? "Welcome back" : "Create your access"}
                                    </h2>
                                            <p className="text-sm text-slate-500 dark:text-slate-300">
                                        {mode === "signin"
                                                    ? "Reconnect with your personalized dashboard, courses, and cohorts"
                                                    : "Link your identity once, unlock every learning surface instantly"}
                                    </p>
                                        </div>
                            </div>

                            <div className="relative">
                                <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 dark:bg-white/5 rounded-2xl backdrop-blur">
                                    <motion.button
                                                type="button"
                                        onClick={() => setMode("signin")}
                                        className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                                                    mode === "signin" ? "text-white" : "text-slate-500 dark:text-slate-300"
                                        }`}
                                    >
                                        Sign In
                                    </motion.button>
                                    <motion.button
                                                type="button"
                                        onClick={() => setMode("signup")}
                                        className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                                                    mode === "signup" ? "text-white" : "text-slate-500 dark:text-slate-300"
                                        }`}
                                    >
                                        Sign Up
                                    </motion.button>
                                </div>
                                <motion.div
                                            className="pointer-events-none absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg"
                                    initial={false}
                                            animate={{
                                                left: mode === "signin" ? "6px" : "calc(50% + 2px)",
                                                width: "calc(50% - 8px)",
                                            }}
                                            transition={{ type: "spring", stiffness: 260, damping: 24 }}
                                />
                            </div>

                                    <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <GoogleAuthButton
                                    onSuccess={handleGoogleAuthSuccess}
                                    onError={(msg) => toast.error(msg)}
                                    text="continue_with"
                                                className="w-full h-13 rounded-xl border border-white/60 bg-white/80 dark:bg-white/10"
                                    isLoading={isGoogleLoading}
                                />
                                            <p className="mt-3 text-center text-xs text-slate-400">
                                                We only request the basics: name, email, and avatar. No classroom data is shared.
                                            </p>
                            </motion.div>

                                        <div className="relative flex items-center">
                                <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-white/50" />
                                </div>
                                            <div className="relative mx-auto bg-white/80 dark:bg-slate-950/70 px-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                                                Or continue with email
                                </div>
                            </div>

                            <motion.form
                                onSubmit={handleEmailSubmit}
                                className="space-y-5"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.65 }}
                            >
                                <div className="space-y-2">
                                                <Label htmlFor="email" className="text-sm font-semibold text-slate-600 dark:text-slate-200">
                                        Email Address
                                    </Label>
                                                <div className="relative">
                                                    <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                                        placeholder="you@domain.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                                        className="h-14 rounded-xl border border-white/70 bg-white/90 pl-12 pr-4 text-base text-slate-700 shadow-inner focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:border-transparent dark:bg-slate-900/70 dark:border-white/10 dark:text-slate-100"
                                            required
                                        />
                                    </div>
                                </div>

                                            <motion.div whileHover={{ scale: 1.01 }}>
                                    <Button
                                        type="submit"
                                        disabled={loading || isGoogleLoading}
                                                    className="relative w-full h-14 overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg transition-transform duration-300 hover:scale-[1.01]"
                                    >
                                                    <span className="relative z-10 flex items-center justify-center gap-2 font-semibold">
                                            {loading ? (
                                                <>
                                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                                Continue
                                                                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                                                </>
                                            )}
                                        </span>
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
                                                        animate={{ x: ["-100%", "100%"] }}
                                                        transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
                                                        style={{ opacity: 0.35 }}
                                        />
                                    </Button>
                                </motion.div>
                            </motion.form>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="grid grid-cols-3 gap-3 text-xs text-slate-500 dark:text-slate-300">
                                            {["Zero password storage", "OTP email failover", "Realtime breach scans"].map((item) => (
                                                <div key={item} className="rounded-xl border border-white/40 bg-white/75 dark:bg-white/5 px-3 py-2 text-center shadow-sm">
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-slate-400">
                                            By continuing you accept our <a href="/terms" className="font-semibold text-blue-500 hover:underline">Terms</a> & <a href="/privacy" className="font-semibold text-blue-500 hover:underline">Privacy</a>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>
            </div>

            <ErrorModal
                isOpen={isErrorModalOpen}
                onClose={() => setIsErrorModalOpen(false)}
                title={modalErrorDetails.title}
                message={modalErrorDetails.message}
            />
            </div>
        </BackgroundBeamsWithCollision>
    )
}

