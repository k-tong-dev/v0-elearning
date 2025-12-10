"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, ArrowLeft, ShieldCheck, Key, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { strapiLogin, getStrapiUserByEmail, storeAccessToken } from "@/integrations/strapi/utils";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { PageLoading } from "@/components/page-loading";
import { ErrorModal } from "@/components/ui/ErrorModal";
import { BackgroundBeamsWithCollision } from "@/components/ui/backgrounds/background-beams-with-collision";

function PasswordConfirmationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");

    const {
        user: authUser,
        isAuthenticated,
        isLoading: authLoading,
        userContext,
    } = useAuth();

    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [modalErrorDetails, setModalErrorDetails] = useState({
        title: "",
        message: "",
    });

    /* Redirect if already authenticated */
    useEffect(() => {
        if (isAuthenticated && authUser?.id && !authLoading) {
            router.replace("/");
        }
    }, [isAuthenticated, authUser, authLoading, router]);

    /* ------------------------------------------------------------------------ */
    /*                        Password Confirmation Logic                       */
    /* ------------------------------------------------------------------------ */
    const handlePasswordConfirmation = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setIsErrorModalOpen(false);

        if (!email) {
            setModalErrorDetails({
                title: "Authentication Error",
                message: "Email is missing. Please go back to the login page.",
            });
            setIsErrorModalOpen(true);
            setLoading(false);
            return;
        }

        try {
            console.log(">>>>>>>>>>>>>> User & Password", email,password);
            const { jwt, user: strapiLoginUser } = await strapiLogin(email, password);
            storeAccessToken(jwt);

            const updatedStrapiProfile = await getStrapiUserByEmail(email);
            if (updatedStrapiProfile) {
                userContext(updatedStrapiProfile);
            }

            setIsConfirmed(true);
            toast.success("Password confirmed! Welcome back!", {
                position: "top-center",
            });

            setTimeout(() => {
                router.push("/");
            }, 1200);
        } catch (err: any) {
            console.error("Password confirmation error:", err);
            const message = err.message || "Incorrect password. Please try again.";
            setError(message);
            setModalErrorDetails({
                title: "Password Confirmation Failed",
                message,
            });
            setIsErrorModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    /* ------------------------------------------------------------------------ */
    /*                                  UI                                     */
    /* ------------------------------------------------------------------------ */
    if (authLoading || (isAuthenticated && authUser?.id)) {
        return <PageLoading message="Verifying your session..." />;
    }

    if (!email) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
                <div className="text-center space-y-4">
                    <AlertCircle className="mx-auto w-16 h-16 text-red-500" />
                    <h2 className="text-2xl font-bold text-red-500">Email Missing</h2>
                    <p className="text-muted-foreground">
                        Please go back and enter your email address to continue.
                    </p>
                    <Link href="/auth/email-auth">
                        <Button>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go to Email Input
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <BackgroundBeamsWithCollision className="min-h-screen via-background overflow-hidden scrollbar-hide items-start">
            <div className="relative min-h-screen w-full px-4 py-12 sm:py-16">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
                    <motion.section
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.2 }}
                        className="relative order-2 lg:order-1 flex-1 overflow-hidden rounded-3xl border border-white/30 bg-white/75 p-8 sm:p-10 dark:bg-slate-950/70 backdrop-blur-2xl shadow-[0_35px_120px_-45px_rgba(59,130,246,0.45)]"
                    >
                        <motion.div
                            className="pointer-events-none absolute inset-0"
                            animate={{ opacity: [0.6, 0.85, 0.6] }}
                            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                                background:
                                    "radial-gradient(circle at 18% 20%, rgba(59,130,246,0.18) 0%, transparent 55%), radial-gradient(circle at 86% 15%, rgba(236,72,153,0.16) 0%, transparent 60%), radial-gradient(circle at 55% 85%, rgba(124,58,237,0.18) 0%, transparent 60%)",
                            }}
                        />
                        <div className="relative space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:bg-white/10 dark:text-slate-200">
                                <Sparkles className="h-3.5 w-3.5 text-blue-500" /> Security Checkpoint
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-semibold leading-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                                Final verification keeps your workspace safe.
                            </h1>
                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                                You’re signing in as <span className="font-semibold text-slate-800 dark:text-white">{email}</span>. Enter your password to restore access to dashboards, cohorts, and instructor tools. We’ll issue fresh tokens across Strapi and Supabase in one click.
                            </p>

                            <div className="grid gap-3 text-xs text-slate-500 dark:text-slate-300 sm:grid-cols-3">
                                {["Zero-knowledge hashing", "Session isolation", "Instant revocation"].map((item) => (
                                    <div key={item} className="rounded-2xl border border-white/50 bg-white/80 px-3 py-2 text-center shadow-sm dark:bg-white/10">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.3 }}
                        className="relative order-1 lg:order-2 flex-1"
                    >
                        <motion.div
                            className="absolute -inset-[2px] rounded-[28px]"
                            style={{
                                background: "conic-gradient(from 180deg at 50% 50%, rgba(59,130,246,0.6), rgba(236,72,153,0.6), rgba(124,58,237,0.6), rgba(59,130,246,0.6))",
                                filter: "blur(14px)",
                                opacity: 0.65,
                            }}
                            animate={{ rotate: [0, 120, 240, 360] }}
                            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                        />

                        <div className="relative overflow-hidden rounded-[26px] border border-white/40 bg-white/90 p-6 sm:p-8 dark:bg-slate-950/70 backdrop-blur-2xl shadow-[0_25px_90px_-40px_rgba(59,130,246,0.55)]">
                            <div className="absolute inset-0 opacity-60" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(236,72,153,0.12) 100%)" }} />

                            <div className="relative space-y-6">
                                <div className="text-center space-y-3">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-xl">
                                        <Lock className="h-9 w-9 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Confirm Your Password</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-300">
                                            Enter your password to unlock your personalized workspace.
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handlePasswordConfirmation} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                            <Key className="h-4 w-4 text-blue-500" /> Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter your password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="h-12 rounded-xl border border-white/60 bg-white/80 pl-4 pr-12 text-base text-slate-700 shadow-inner transition focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-300/40 dark:bg-white/10 dark:text-slate-100"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg px-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100/60"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 shadow-sm dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
                                            >
                                                <AlertCircle className="h-4 w-4" />
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <Button
                                        type="submit"
                                        disabled={loading || isConfirmed}
                                        className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
                                    >
                                        <span className="relative z-10 flex items-center gap-2 text-sm font-semibold">
                                            {loading ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 animate-spin" /> Confirming...
                                                </>
                                            ) : (
                                                <>
                                                    Confirm Password <ArrowRight className="h-4 w-4" />
                                                </>
                                            )}
                                        </span>
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400"
                                            animate={{ x: ["-100%", "100%"] }}
                                            transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
                                            style={{ opacity: 0.35 }}
                                        />
                                    </Button>
                                </form>

                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-emerald-500" /> Password encrypted with bcrypt, never stored in plain text.
                                    </div>
                                    <Link href="/auth/forgot-password" className="font-semibold text-blue-500 hover:underline">
                                        Forgot password?
                                    </Link>
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
                    reportIssueTitle={modalErrorDetails.title}
                    reportIssueDescription={modalErrorDetails.message}
                />
            </div>
        </BackgroundBeamsWithCollision>
    );
}

export default function PasswordConfirmationPage() {
    return (
        <Suspense fallback={<PageLoading message="Loading password confirmation..." />}>
            <PasswordConfirmationContent />
        </Suspense>
    );
}
