"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Sparkles, ShieldCheck, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

    const pushCredentialsUpdate = (overrides?: Partial<{ username: string; password: string; confirmPassword: string }>): void => {
        const nextUsername = overrides?.username ?? currentUsername;
        const nextPassword = overrides?.password ?? currentPassword;
        const nextConfirmPassword = overrides?.confirmPassword ?? currentConfirmPassword;

        onUpdate({
            username: nextUsername,
            password: nextPassword,
            confirmPassword: nextConfirmPassword,
        });
    };

    const passwordChecks = useMemo(
        () => [
            {
                label: "At least 8 characters",
                valid: currentPassword.length >= 8,
            },
            {
                label: "Includes letters & numbers",
                valid: /[a-zA-Z]/.test(currentPassword) && /\d/.test(currentPassword),
            },
            {
                label: "Doesn't include your username",
                valid: currentUsername ? !currentPassword.toLowerCase().includes(currentUsername.toLowerCase()) : true,
            },
            {
                label: "Doesn't include email local part",
                valid: email ? !currentPassword.toLowerCase().includes(email.split("@")[0]?.toLowerCase() || "") : true,
            },
        ],
        [currentPassword, currentUsername, email]
    );

    const satisfiedChecks = passwordChecks.filter((check) => check.valid).length;
    const strengthPercentage = (satisfiedChecks / passwordChecks.length) * 100;
    const strengthLabel = useMemo(() => {
        if (!currentPassword) return "Start typing";
        if (strengthPercentage === 100) return "Excellent";
        if (strengthPercentage >= 75) return "Strong";
        if (strengthPercentage >= 50) return "Getting there";
        return "Needs improvement";
    }, [strengthPercentage, currentPassword]);

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
        return null;
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

        pushCredentialsUpdate();
        onNext();
    };

    return (
        <motion.section
            initial={{ opacity: 0, y: 25, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/80 dark:bg-slate-950/70 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_20px_90px_-40px_rgba(59,130,246,0.6)] space-y-8"
        >
            <motion.div
                className="pointer-events-none absolute inset-0"
                animate={{ opacity: [0.6, 0.85, 0.6] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    background:
                        "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.15) 0%, transparent 55%), radial-gradient(circle at 78% 15%, rgba(236,72,153,0.18) 0%, transparent 55%), radial-gradient(circle at 50% 85%, rgba(124,58,237,0.14) 0%, transparent 60%)",
                }}
            />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:bg-white/10 dark:text-slate-200">
                        <Sparkles className="h-3 w-3 text-blue-500" />
                        Step 1 · Credentials
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-semibold leading-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Lay the foundation for your secure account.
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                        We’ll use this information to generate your Strapi profile and keep your Supabase session in sync. Only your username is public.
                    </p>
                </div>
                <motion.div
                    initial={{ rotate: -12, scale: 0.9, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 220, damping: 16 }}
                    className="self-center rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-[14px] shadow-xl"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                        <User className="h-8 w-8 text-white" />
                    </div>
                </motion.div>
            </div>

            <form onSubmit={handleSubmit} className="relative grid gap-7 md:grid-cols-[minmax(0,1fr)_280px]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="space-y-5"
                >
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                            <Mail className="h-4 w-4 text-blue-500" /> Email Address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            disabled
                            className="h-12 rounded-xl border border-white/50 bg-white/70 text-slate-600 shadow-inner disabled:cursor-not-allowed disabled:text-slate-400 dark:bg-white/5 dark:text-slate-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="username" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                            <User className="h-4 w-4 text-blue-500" /> Username
                        </Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="Choose a unique handle"
                            value={currentUsername}
                            onChange={(e) => {
                                const value = e.target.value;
                                setCurrentUsername(value);
                                pushCredentialsUpdate({ username: value });
                            }}
                            required
                            className="h-12 rounded-xl border border-white/60 bg-white/80 pl-4 pr-4 text-base text-slate-700 shadow-inner transition focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-300/40 dark:bg-white/10 dark:text-slate-100"
                        />
                    </div>

                    <div className="gap-5 grid-cols-2 flex-1 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                <Lock className="h-4 w-4 text-blue-500" /> Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a strong password"
                                    value={currentPassword}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setCurrentPassword(value);
                                        pushCredentialsUpdate({ password: value });
                                    }}
                                    required
                                    className="h-12 rounded-xl border border-white/60 bg-white/80 pl-4 pr-12 text-base text-slate-700 shadow-inner transition focus-visible:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-300/40 dark:bg-white/10 dark:text-slate-100"
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

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                <Shield className="h-4 w-4 text-blue-500" /> Confirm Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm your password"
                                    value={currentConfirmPassword}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setCurrentConfirmPassword(value);
                                        pushCredentialsUpdate({ confirmPassword: value });
                                    }}
                                    required
                                    className="h-12 rounded-xl border border-white/60 bg-white/80 pl-4 pr-12 text-base text-slate-700 shadow-inner transition focus-visible:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-300/40 dark:bg-white/10 dark:text-slate-100"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg px-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100/60"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {(internalError || externalError) && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-600 shadow-sm dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
                            >
                                <AlertCircle className="h-4 w-4" />
                                {internalError || externalError}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div whileHover={{ scale: 1.01 }}>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="relative flex h-14 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg transition duration-300 hover:shadow-xl disabled:opacity-60"
                        >
                            <span className="relative z-10 flex items-center gap-2 text-sm font-semibold">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" /> Creating account...
                                    </>
                                ) : (
                                    <>
                                        Next: Select Role <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </span>
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-500"
                                animate={{ x: ["-100%", "100%"] }}
                                transition={{ duration: 3.8, repeat: Infinity, ease: "linear" }}
                                style={{ opacity: 0.35 }}
                            />
                        </Button>
                    </motion.div>
                </motion.div>

                <motion.aside
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="flex flex-col gap-4 rounded-2xl border border-white/40 bg-white/70 p-5 shadow-inner dark:bg-white/5"
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500">
                            <ShieldCheck className="h-4.5 w-4.5" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Password strength</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                We hash everything before sending it to Strapi and verify against Supabase policies.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-300">
                            <span>{strengthLabel}</span>
                            <span>{satisfiedChecks}/{passwordChecks.length}</span>
                        </div>
                        <div className="relative h-2 rounded-full bg-slate-200/70 dark:bg-white/10">
                            <motion.div
                                className="absolute h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                                initial={{ width: "0%" }}
                                animate={{ width: `${Math.max(8, strengthPercentage)}%` }}
                                transition={{ duration: 0.4 }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        {passwordChecks.map((check, index) => (
                            <motion.div
                                key={check.label}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + index * 0.07 }}
                                className="flex items-center gap-3 rounded-xl border border-white/40 bg-white/80 px-3 py-2 text-xs text-slate-600 shadow-sm dark:bg-white/5 dark:text-slate-300"
                            >
                                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${check.valid ? "bg-emerald-500/15 text-emerald-500" : "bg-slate-200/70 text-slate-400"}`}>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                </div>
                                <span>{check.label}</span>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-1 rounded-xl border border-white/50 bg-white/80 px-3 py-3 text-xs text-slate-500 shadow-sm dark:bg-white/5 dark:text-slate-300">
                        <strong className="font-semibold text-slate-700 dark:text-slate-100">Heads up:</strong> We’ll ask you once more to confirm these details before activating your plan limits.
                    </div>
                </motion.aside>
            </form>
        </motion.section>
    );
}