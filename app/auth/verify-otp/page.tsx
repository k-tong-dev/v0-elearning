"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, CheckCircle, Loader2, ArrowLeft, ArrowRight, Sparkles, ShieldCheck, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { storeEmailForOTP } from "@/lib/cookies";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { PageLoading } from "@/components/page-loading";
import { OtpInput } from "@/components/ui/otp-input";
import { BackgroundBeamsWithCollision } from "@/components/ui/backgrounds/background-beams-with-collision";
import { ErrorModal } from "@/components/ui/ErrorModal";

function VerifyOtpContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resendTimer, setResendTimer] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [modalErrorDetails, setModalErrorDetails] = useState({ title: "", message: "" });

    const startResendTimer = () => {
        setResendTimer(120);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        if (email) {
            startResendTimer();
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [email]);

    useEffect(() => {
        if (!authLoading && isAuthenticated && user) {
            if (user.id) {
                router.replace("/");
            } else if (user.supabaseId && user.email) {
                console.log("[OTP] User has Supabase session, awaiting OTP verification...");
            }
        } else if (!authLoading && !user) {
            console.log("[OTP] No user session, staying on verify-otp page...");
        }
    }, [isAuthenticated, user, authLoading, router]);


    const handleOtpVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setIsErrorModalOpen(false);

        if (!email) {
            setError("Email is missing");
            toast.error("Email is missing!", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            });
            setIsErrorModalOpen(true);
            setLoading(false);
            return;
        }

        try {
            console.log("[OTP] Verifying OTP...");
            const { error } = await supabase.auth.verifyOtp({
                email: email,
                token: otp,
                type: "email",
            });

            if (error) {
                throw error;
            }

            console.log("[OTP] OTP verified. Checking session...");
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                throw new Error("Failed to retrieve session: " + sessionError.message);
            }

            if (sessionData.session?.user) {
                console.log("[OTP] Session found, redirecting to signup...");
                storeEmailForOTP(email);
                router.push(`/auth/signup?email=${encodeURIComponent(email)}`);
                return;
            }

            let attempts = 0;
            const maxAttempts = 3;
            const retryInterval = 1000;

            const checkSession = async (): Promise<boolean> => {
                const { data: retrySessionData, error: retrySessionError } = await supabase.auth.getSession();
                if (retrySessionError) {
                    console.error("[OTP] Retry session error:", retrySessionError);
                    return false;
                }
                if (retrySessionData.session?.user) {
                    console.log("[OTP] Session found on retry, redirecting to signup...");
                    storeEmailForOTP(email);
                    router.push(`/auth/signup?email=${encodeURIComponent(email)}`);
                    return true;
                }
                return false;
            };

            while (attempts < maxAttempts) {
                attempts++;
                console.log(`[OTP] Retry attempt ${attempts}/${maxAttempts}...`);
                await new Promise(resolve => setTimeout(resolve, retryInterval));
                if (await checkSession()) {
                    return;
                }
            }

            console.log("[OTP] No session found after retries, setting up auth state listener...");
            const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
                if (session?.user) {
                    console.log("[OTP] Session detected via auth state change, redirecting...");
                    storeEmailForOTP(email);
                    router.push(`/auth/signup?email=${encodeURIComponent(email)}`);
                    listener.subscription.unsubscribe();
                }
            });

            setTimeout(() => {
                listener.subscription.unsubscribe();
                if (!sessionData.session?.user) {
                    throw new Error("Session not found after OTP verification. Please try again.");
                }
            }, 5000);

        } catch (err: any) {
            console.error("[OTP] Error verifying OTP:", err);
            const errorMessage = err.message || "Invalid OTP. Please try again.";
            setError(errorMessage);
            setModalErrorDetails({
                title: "OTP Verification Error",
                message: errorMessage,
            });
            setIsErrorModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!email) return;
        setLoading(true);
        setError("");

        try {
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/verify-otp?email=${encodeURIComponent(email)}`,
                },
            });

            if (otpError) {
                throw otpError;
            }

            toast.success("New verification link sent!", {
                description: "Please check your inbox for the new code.",
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            });
            startResendTimer();
        } catch (err: any) {
            console.error("Resend OTP error:", err);
            setError(err.message || "Failed to resend verification link. Please try again.");
            toast.error(err.message || "Failed to resend verification link.", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return <PageLoading message="Verifying your session..." />;
    }

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (!email) {
        return (
            <BackgroundBeamsWithCollision className="min-h-screen via-background overflow-hidden scrollbar-hide items-start">
                <div className="relative min-h-screen w-full overflow-auto p-6 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative w-full max-w-lg rounded-3xl border border-white/30 bg-white/90 dark:bg-slate-950/80 backdrop-blur-2xl p-8 space-y-6 text-center shadow-[0_30px_110px_-45px_rgba(236,72,153,0.45)]"
                    >
                        <Mail className="mx-auto h-16 w-16 text-red-500" />
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Email missing</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            We need your email address to send a verification link. Please head back and enter it to continue the flow.
                        </p>
                        <Button asChild className="h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
                            <Link href="/auth/email-auth">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Return to email entry
                            </Link>
                        </Button>
                    </motion.div>
                </div>
            </BackgroundBeamsWithCollision>
        );
    }

    return (
        <BackgroundBeamsWithCollision className="min-h-screen via-background overflow-hidden scrollbar-hide items-start">
            <div className="relative min-h-screen w-full overflow-auto p-6 md:p-8">
                <div className="pointer-events-none absolute inset-0">
                    <motion.div
                        className="absolute -left-44 top-16 h-64 w-64 rounded-full blur-3xl"
                        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 65%)" }}
                        animate={{ x: [0, 20, -10, 0], y: [0, -10, 18, 0], opacity: [0.5, 0.75, 0.5] }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute -right-40 bottom-20 h-72 w-72 rounded-full blur-3xl"
                        style={{ background: "radial-gradient(circle, rgba(236,72,153,0.28) 0%, transparent 70%)" }}
                        animate={{ x: [0, -22, 12, 0], y: [0, 18, -12, 0], opacity: [0.45, 0.65, 0.45] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>

                <div className="relative z-10 mx-auto grid w-full max-w-5xl grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
                    <motion.section
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 140, damping: 22, delay: 0.2 }}
                        className="relative order-2 lg:order-1 rounded-3xl border border-white/20 bg-white/55 dark:bg-slate-950/40 backdrop-blur-3xl p-6 sm:p-8 lg:p-12 shadow-[0_35px_120px_-45px_rgba(59,130,246,0.45)] overflow-hidden"
                    >
                        <motion.div
                            className="absolute inset-0 opacity-60"
                            style={{
                                background:
                                    "radial-gradient(circle at 18% 22%, rgba(59,130,246,0.18) 0%, transparent 55%), radial-gradient(circle at 84% 12%, rgba(236,72,153,0.2) 0%, transparent 50%), radial-gradient(circle at 52% 82%, rgba(124,58,237,0.18) 0%, transparent 55%)",
                            }}
                            animate={{ opacity: [0.45, 0.7, 0.45] }}
                            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
                        />

                        <div className="relative space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35, type: "spring", stiffness: 150, damping: 18 }}
                                className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:bg-white/10 dark:text-slate-200 shadow-sm"
                            >
                                <Sparkles className="h-3.5 w-3.5 text-blue-500" /> Step 2 · Verify email
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 28 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45, type: "spring", stiffness: 120, damping: 20 }}
                                className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent"
                            >
                                Check your inbox for a six-digit code.
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 }}
                                className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-200/80 max-w-2xl leading-relaxed"
                            >
                                We’ve sent a verification code to <span className="font-semibold text-slate-900 dark:text-white">{email}</span>. Enter it below to unlock your personalized dashboard and finish setting up your account.
                            </motion.p>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {[{ icon: ShieldCheck, title: "Supabase-secured", description: "Codes expire quickly and can’t be reused." }, { icon: TimerReset, title: "Flexible resend", description: "Need another link? Request it every 2 minutes." }].map((feature, index) => {
                                    const Icon = feature.icon
                                    return (
                                        <motion.div
                                            key={feature.title}
                                            initial={{ opacity: 0, y: 24 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.65 + index * 0.08, type: "spring", stiffness: 160, damping: 18 }}
                                            className="group relative rounded-2xl border border-white/40 bg-white/75 dark:bg-white/8 backdrop-blur-xl p-4 shadow-sm hover:shadow-xl transition-all"
                                        >
                                            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-blue-500/0 via-purple-500/12 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            <div className="relative flex items-start gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 text-blue-600 dark:text-blue-300">
                                                    <Icon className="h-4.5 w-4.5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700 dark:text-white">{feature.title}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">{feature.description}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 140, damping: 22, delay: 0.3 }}
                        className="relative order-1 lg:order-2"
                    >
                        <motion.div
                            className="absolute -inset-[2px] rounded-[26px]"
                            style={{
                                background: "conic-gradient(from 0deg, rgba(59,130,246,0.6), rgba(236,72,153,0.6), rgba(124,58,237,0.6), rgba(59,130,246,0.6))",
                                filter: "blur(12px)",
                                opacity: 0.6,
                            }}
                            animate={{ rotate: [0, 180, 360] }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        />

                        <div className="relative rounded-[24px] border border-white/35 bg-white/95 dark:bg-slate-950/75 backdrop-blur-2xl shadow-[0_25px_85px_-30px_rgba(59,130,246,0.5)] p-6 sm:p-8 space-y-7">
                            <div className="text-center space-y-4">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-xl">
                                    <CheckCircle className="h-9 w-9" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">Verify your email</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-300">Enter the six-digit code sent to your inbox to continue.</p>
                                </div>
                            </div>

                            <form onSubmit={handleOtpVerify} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="otp" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                        <Mail className="h-4 w-4 text-blue-500" /> Verification code
                                    </Label>
                                    <OtpInput length={6} value={otp} onChange={setOtp} disabled={loading} />
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 shadow-sm dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
                                >
                                    <span className="relative z-10 flex items-center gap-2 text-sm font-semibold">
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" /> Verifying...
                                            </>
                                        ) : (
                                            <>
                                                Verify code <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </span>
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400"
                                        animate={{ x: ["-100%", "100%"] }}
                                        transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
                                        style={{ opacity: 0.35 }}
                                    />
                                </Button>
                            </form>

                            <div className="space-y-3 text-xs text-slate-500 dark:text-slate-300">
                                <div className="rounded-2xl border border-white/50 bg-white/80 px-3 py-2 text-center shadow-sm dark:bg-white/10">
                                    Didn’t receive the code?{" "}
                                    <button
                                        onClick={handleResendCode}
                                        className="font-semibold text-blue-500 hover:underline disabled:cursor-not-allowed"
                                        disabled={loading || resendTimer > 0}
                                    >
                                        Resend code
                                    </button>
                                    {resendTimer > 0 && <span className="ml-2">({formatTime(resendTimer)})</span>}
                                </div>
                                <p className="text-center text-[11px] uppercase tracking-[0.25em] text-slate-400">
                                    Secure OTP by Supabase · Synced instantly after verification
                                </p>
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

export default function VerifyOtpPage() {
    return (
        <Suspense fallback={<PageLoading message="Loading verification..." />}>
            <VerifyOtpContent />
        </Suspense>
    );
}