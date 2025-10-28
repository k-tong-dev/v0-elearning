"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Link from "next/link";
import { ErrorModal } from "@/components/ui/ErrorModal";
import {BackgroundBeamsWithCollision} from "@/components/ui/backgrounds/background-beams-with-collision"; // Import ErrorModal

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [modalErrorDetails, setModalErrorDetails] = useState({ title: "", message: "" });

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");
        setIsErrorModalOpen(false);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/update-password`,
            });

            if (resetError) {
                throw resetError;
            }

            setMessage("Password reset link sent! Please check your email inbox.");
            toast.success("Password reset link sent!", {
                description: "Check your email to set a new password.",
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            });
        } catch (err: any) {
            console.error("Password reset error:", err);
            const errorMessage = err.message || "Failed to send password reset link. Please try again.";
            setError(errorMessage);
            setModalErrorDetails({
                title: "Password Reset Error",
                message: errorMessage,
            });
            setIsErrorModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <BackgroundBeamsWithCollision className="min-h-screen via-background overflow-hidden scrollbar-hide items-start">
            <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border p-8 space-y-6"
            >
                <div className="text-center space-y-4">
                    <Mail className="mx-auto w-16 h-16 text-primary" />
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                        Forgot Your Password?
                    </h2>
                    <p className="text-muted-foreground">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                            <Mail className="w-4 h-4 text-emerald-500" />
                            Email Address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="your@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-12 transition-all duration-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 pl-4 text-base border-2 hover:border-emerald-300"
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

                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-600"
                        >
                            {message}
                        </motion.div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold rounded-lg shadow-md transition-all hover:shadow-lg"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Sending Link...
                            </div>
                        ) : (
                            <>
                                Send Reset Link
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                    Remember your password?{" "}
                    <Link href="/auth/start" className="text-primary hover:underline">
                        Sign In
                    </Link>
                </p>
            </motion.div>

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