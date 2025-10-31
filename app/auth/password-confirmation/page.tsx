"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { strapiLogin, getStrapiUserByEmail, storeAccessToken } from "@/integrations/strapi/utils";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { PageLoading } from "@/components/page-loading";
import { ErrorModal } from "@/components/ui/ErrorModal";
import {BackgroundBeamsWithCollision} from "@/components/ui/backgrounds/background-beams-with-collision";

export default function PasswordConfirmationPage() {
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
            <div className="min-h-screen flex items-center justify-center  bg-transparent p-4">
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full h-fit max-w-md bg-card rounded-2xl shadow-xl border border-border p-8 space-y-6"
            >
                <div className="text-center space-y-4">
                    <Lock className="mx-auto w-16 h-16 text-primary" />
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                        Confirm Your Password
                    </h2>
                    <p className="text-muted-foreground">
                        You've verified <span className="font-semibold text-foreground">{email}</span>. Please enter your password to continue.
                    </p>
                </div>

                <form onSubmit={handlePasswordConfirmation} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                            <Lock className="w-4 h-4 text-emerald-500" />
                            Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 transition-all duration-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 pl-4 text-base border-2 hover:border-emerald-300 pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 flex items-center gap-2"
                        >
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </motion.div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading || isConfirmed}
                        className="w-full h-12 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold rounded-lg shadow-md transition-all hover:shadow-lg"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Confirming...
                            </div>
                        ) : (
                            <>
                                Confirm Password
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                    <Link href="/auth/forgot-password" className="text-primary hover:underline">
                        Forgot Password?
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
