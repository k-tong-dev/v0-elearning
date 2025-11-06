"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ArrowRight, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Link from "next/link";
import { ErrorModal } from "@/components/ui/ErrorModal"; // Import ErrorModal

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [modalErrorDetails, setModalErrorDetails] = useState({ title: "", message: "" });

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setModalErrorDetails({
                    title: "Session Expired",
                    message: "Your session has expired or the link is invalid. Please request a new password reset link.",
                });
                setIsErrorModalOpen(true);
                // router.replace("/auth/forgot-password"); // Redirect after modal close
            }
        };
        checkUser();
    }, [router]);

    const validatePassword = (pw: string): string | null => {
        if (pw.length < 8) {
            return "Password must be at least 8 characters long.";
        }
        if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) {
            return "Password must contain both letters and numbers.";
        }
        // Cannot check against email/username here as we don't have it readily available
        return null;
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);
        setIsErrorModalOpen(false);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            setLoading(false);
            return;
        }

        try {
            const { data, error: updateError } = await supabase.auth.updateUser({
                password: password,
            });

            if (updateError) {
                throw updateError;
            }

            setSuccess(true);
            toast.success("Your password has been updated successfully!", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            });
            setTimeout(() => {
                router.push("/");
            }, 2000);
        } catch (err: any) {
            console.error("Password update error:", err);
            const errorMessage = err.message || "Failed to update password. Please try again.";
            setError(errorMessage);
            setModalErrorDetails({
                title: "Password Update Error",
                message: errorMessage,
            });
            setIsErrorModalOpen(true);
        } finally {
            setLoading(false);
        }
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
                    <Lock className="mx-auto w-16 h-16 text-primary" />
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Set New Password
                    </h2>
                    <p className="text-muted-foreground">
                        Enter and confirm your new password below.
                    </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                            <Lock className="w-4 h-4 text-purple-500" />
                            New Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 pl-4 text-base border-2 hover:border-blue-300 pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="flex items-center gap-2 text-sm font-medium">
                            <Lock className="w-4 h-4 text-purple-500" />
                            Confirm New Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="h-12 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 pl-4 text-base border-2 hover:border-blue-300 pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
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

                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-600 flex items-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Password updated successfully! Redirecting...
                        </motion.div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading || success}
                        className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg shadow-md transition-all hover:shadow-lg"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Updating Password...
                            </div>
                        ) : (
                            <>
                                Update Password
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </form>
            </motion.div>

            <ErrorModal
                isOpen={isErrorModalOpen}
                onClose={() => {
                    setIsErrorModalOpen(false);
                    router.replace("/auth/forgot-password");
                }}
                title={modalErrorDetails.title}
                message={modalErrorDetails.message}
                reportIssueTitle={modalErrorDetails.title}
                reportIssueDescription={modalErrorDetails.message}
            />
        </div>
    );
}