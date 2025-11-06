"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkStrapiUserExists } from "@/integrations/strapi/utils";
import { storeEmailForOTP } from "@/lib/cookies"; // Import cookie utility
import Link from "next/link";
import { ErrorModal } from "@/components/ui/ErrorModal";
import {BackgroundBeamsWithCollision} from "@/components/ui/backgrounds/background-beams-with-collision"; // Import the new ErrorModal

export default function EmailAuthPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(""); // For inline error messages
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false); // For critical errors
    const [modalErrorDetails, setModalErrorDetails] = useState({ title: "", message: "" });

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setIsErrorModalOpen(false);

        try {
            const userExistsInStrapi = await checkStrapiUserExists(email);

            if (userExistsInStrapi) {
                toast.info("Welcome back! Please confirm your password.", {
                    position: "top-center",
                    action: {
                        label: "Close",
                        onClick: () => {},
                    },
                    closeButton: false,
                });
                router.push(`/auth/password-confirmation?email=${encodeURIComponent(email)}`);
                return;
            }
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/verify-otp?email=${encodeURIComponent(email)}`,
                },
            });

            if (otpError) {
                throw otpError;
            }

            storeEmailForOTP(email);

            toast.success("Verification link sent to your email!", {
                description: "Please check your inbox to continue.",
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            });
            router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
        } catch (err: any) {
            console.error("Email auth error:", err);
            const errorMessage = err.message || "Failed to process your request. Please try again.";
            setError(errorMessage);
            setModalErrorDetails({
                title: "Authentication Error",
                message: errorMessage,
            });
            setIsErrorModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <BackgroundBeamsWithCollision className="min-h-screen via-background overflow-hidden scrollbar-hide items-start">
            <div className="min-h-screen flex items-center justify-center via-background">
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md liquid-glass-card p-8 space-y-6"
            >
                <div className="text-center space-y-4">
                    <Mail className="mx-auto w-16 h-16 text-primary" />
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Continue with Email
                    </h2>
                    <p className="text-muted-foreground">
                        Enter your email to sign in or create an account.
                    </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                            <Mail className="w-4 h-4 text-purple-500" />
                            Email Address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="your@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-12 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 pl-4 text-base border-2 hover:border-blue-300"
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
                        disabled={loading}
                        className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg shadow-md transition-all hover:shadow-lg"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </div>
                        ) : (
                            <>
                                Continue
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
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