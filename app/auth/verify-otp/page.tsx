"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {Mail, CheckCircle, Loader2, ArrowLeft, ArrowRight} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Keep Input for email field if needed elsewhere
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkStrapiUserExists } from "@/integrations/strapi/utils";
import { storeEmailForOTP } from "@/lib/cookies";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { PageLoading } from "@/components/page-loading";
import { OtpInput } from "@/components/ui/otp-input"; // Import the new OtpInput

export default function VerifyOtpPage() {
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

    if (!email) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
                <div className="text-center space-y-4">
                    <Mail className="mx-auto w-16 h-16 text-red-500" />
                    <h2 className="text-2xl font-bold text-red-500">Email Missing</h2>
                    <p className="text-muted-foreground">
                        Please go back and enter your email address to receive a verification link.
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

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md liquid-glass-card p-8 space-y-6"
            >
                <div className="text-center space-y-4">
                    <CheckCircle className="mx-auto w-16 h-16 text-green-500" />
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Verify Your Email
                    </h2>
                    <p className="text-muted-foreground">
                        We've sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>.
                        Please enter it below to complete your login/signup.
                    </p>
                </div>

                <form onSubmit={handleOtpVerify} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="otp" className="flex items-center gap-2 text-sm font-medium">
                            <Mail className="w-4 h-4 text-purple-500" />
                            Verification Code
                        </Label>
                        <OtpInput
                            length={6}
                            value={otp}
                            onChange={setOtp}
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600"
                        >
                            {error}
                        </motion.div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg shadow-md transition-all hover:shadow-lg"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Verifying...
                            </div>
                        ) : (
                            <>
                                Verify Code
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                    Didn't receive the code?{" "}
                    <button
                        onClick={handleResendCode}
                        className="text-primary hover:underline"
                        disabled={loading || resendTimer > 0}
                    >
                        Resend Code
                    </button>
                    {resendTimer > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">({formatTime(resendTimer)})</span>
                    )}
                </p>
            </motion.div>
        </div>
    );
}