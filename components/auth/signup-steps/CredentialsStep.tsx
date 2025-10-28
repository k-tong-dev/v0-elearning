"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CredentialsStepProps {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    onUpdate: (data: { username: string; password: string; confirmPassword: string }) => void;
    onNext: () => void;
    isLoading: boolean;
    externalError: string;
}

export function CredentialsStep({
                                    email,
                                    username,
                                    password,
                                    confirmPassword,
                                    onUpdate,
                                    onNext,
                                    isLoading,
                                    externalError,
                                }: CredentialsStepProps) {
    const [currentUsername, setCurrentUsername] = useState(username);
    const [currentPassword, setCurrentPassword] = useState(password);
    const [currentConfirmPassword, setCurrentConfirmPassword] = useState(confirmPassword);
    const [internalError, setInternalError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        setInternalError(externalError);
    }, [externalError]);

    useEffect(() => {
        setCurrentUsername(username);
        setCurrentPassword(password);
        setCurrentConfirmPassword(confirmPassword);
    }, [username, password, confirmPassword]);

    const validatePassword = (pw: string): string | null => {
        if (pw.length < 8) {
            return "Password must be at least 8 characters long.";
        }
        if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) {
            return "Password must contain both letters and numbers.";
        }
        if (currentUsername && pw.toLowerCase().includes(currentUsername.toLowerCase())) {
            return "Password cannot contain your username.";
        }
        if (email && pw.toLowerCase().includes(email.split("@")[0].toLowerCase())) {
            return "Password cannot contain parts of your email.";
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setInternalError("");

        if (currentPassword !== currentConfirmPassword) {
            setInternalError("Passwords do not match.");
            return;
        }

        const passwordError = validatePassword(currentPassword);
        if (passwordError) {
            setInternalError(passwordError);
            return;
        }

        if (!currentUsername || !currentPassword) {
            setInternalError("Please fill in all required fields.");
            return;
        }

        onUpdate({
            username: currentUsername,
            password: currentPassword,
            confirmPassword: currentConfirmPassword,
        });
        onNext();
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <div className="text-center space-y-4">
                <User className="mx-auto w-16 h-16 text-primary" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                    Set Up Your Account
                </h2>
                <p className="text-muted-foreground">
                    Enter your username and password to create your account.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="w-4 h-4 text-emerald-500" />
                        Email Address
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="h-12 bg-muted cursor-not-allowed pl-4 text-base border-2"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-2 text-sm font-medium">
                        <User className="w-4 h-4 text-emerald-500" />
                        Username
                    </Label>
                    <Input
                        id="username"
                        type="text"
                        placeholder="Choose a username"
                        value={currentUsername}
                        onChange={(e) => setCurrentUsername(e.target.value)}
                        required
                        className="h-12 transition-all duration-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 pl-4 text-base border-2 hover:border-emerald-300"
                    />
                </div>

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
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
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

                <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="flex items-center gap-2 text-sm font-medium">
                        <Lock className="w-4 h-4 text-emerald-500" />
                        Confirm Password
                    </Label>
                    <div className="relative">
                        <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={currentConfirmPassword}
                            onChange={(e) => setCurrentConfirmPassword(e.target.value)}
                            required
                            className="h-12 transition-all duration-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 pl-4 text-base border-2 hover:border-emerald-300 pr-10"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                        >
                            {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                        </Button>
                    </div>
                </div>

                {(internalError || externalError) && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 flex items-center gap-2"
                    >
                        <AlertCircle className="w-4 h-4" />
                        {internalError || externalError}
                    </motion.div>
                )}

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold rounded-lg shadow-md transition-all hover:shadow-lg"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creating Account...
                        </div>
                    ) : (
                        <>
                            Next: Select Role
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </form>
        </motion.div>
    );
}