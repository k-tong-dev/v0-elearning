"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PageLoading } from "@/components/page-loading";
import {BackgroundBeamsWithCollision} from "@/components/ui/backgrounds/background-beams-with-collision";

export default function AuthStartPage() {
    const router = useRouter();
    const { loginWithGoogle, isLoading: authLoading } = useAuth();
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const handleGoogleAuthSuccess = async (credential: string) => {
        setIsGoogleLoading(true);
        try {
            const { newUser, user } = await loginWithGoogle(credential); // Get the user object from loginWithGoogle
            if (newUser) {
                router.push(`/auth/signup`); // Redirect to the multi-step signup page
            } else {
                toast.success('Welcome back!', {
                    position: "top-center",
                    action: {
                        label: "Close",
                        onClick: () => {},
                    },
                    closeButton: false,
                });
                router.push("/");
            }
        } catch (error: any) {
            console.error("Google authentication failed:", error);
            toast.error(error.message || "Google authentication failed", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            });
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleEmailAuthClick = () => {
        router.push("/auth/email-auth"); // New route for email login/signup/OTP
    };

    if (authLoading) {
        return <PageLoading message="Checking authentication status..." />;
    }

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
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md"
                    >
                        <Sparkles className="w-8 h-8 text-white animate-pulse" />
                    </motion.div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Get Started with CamEdu
                    </h2>
                    <p className="text-muted-foreground">
                        Join our learning community or sign in to continue your journey.
                    </p>
                </div>

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

                <Button
                    onClick={handleEmailAuthClick}
                    className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-md transition-all hover:shadow-lg"
                    disabled={isGoogleLoading}
                >
                    <Mail className="w-5 h-5 mr-2" />
                    Continue with Email
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    By continuing, you agree to our{" "}
                    <a href="/terms" className="text-primary hover:underline">
                        Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                    </a>
                    .
                </p>
            </motion.div>
        </div>
        </BackgroundBeamsWithCollision>
    );
}