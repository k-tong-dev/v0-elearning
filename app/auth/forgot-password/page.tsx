"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, ArrowLeft, ShieldCheck, Sparkles, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Link from "next/link";
import { ErrorModal } from "@/components/ui/ErrorModal";
import { BackgroundBeamsWithCollision } from "@/components/ui/backgrounds/background-beams-with-collision";

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
            <div className="relative min-h-screen w-full overflow-auto p-6 md:p-8">
                <div className="pointer-events-none absolute inset-0">
                    <motion.div
                        className="absolute -left-40 top-16 h-64 w-64 rounded-full blur-3xl"
                        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 65%)" }}
                        animate={{ x: [0, 18, -12, 0], y: [0, -12, 14, 0], opacity: [0.5, 0.75, 0.5] }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute -right-36 bottom-20 h-72 w-72 rounded-full blur-3xl"
                        style={{ background: "radial-gradient(circle, rgba(236,72,153,0.28) 0%, transparent 70%)" }}
                        animate={{ x: [0, -18, 12, 0], y: [0, 20, -15, 0], opacity: [0.45, 0.65, 0.45] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>

                <div className="relative z-10 mx-auto grid w-full max-w-5xl grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr] items-start">
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
                                    "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.18) 0%, transparent 55%), radial-gradient(circle at 84% 12%, rgba(236,72,153,0.2) 0%, transparent 50%), radial-gradient(circle at 52% 82%, rgba(124,58,237,0.18) 0%, transparent 55%)",
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
                                <Sparkles className="h-3.5 w-3.5 text-blue-500" /> Recover access securely
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 28 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45, type: "spring", stiffness: 120, damping: 20 }}
                                className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent"
                            >
                                Reset your password with confidence.
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 }}
                                className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-200/80 max-w-2xl leading-relaxed"
                            >
                                Enter your email and we’ll send a secure Supabase link so you can create a new password. We protect every reset request with rate limiting and audit logging.
                            </motion.p>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {[{ icon: ShieldCheck, title: "Supabase-verified", description: "Links expire quickly to keep your account safe." }, { icon: LifeBuoy, title: "Full audit trail", description: "Track reset history directly from your profile." }].map((feature, index) => {
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
                                    <Mail className="h-9 w-9" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">Forgot your password?</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-300">Enter your email and we’ll send a secure reset link.</p>
                                </div>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                        <Mail className="h-4 w-4 text-blue-500" /> Email address
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@domain.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-12 rounded-xl border border-white/60 bg-white/85 pl-4 pr-4 text-base text-slate-700 shadow-inner transition focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-300/40 dark:bg-white/10 dark:text-slate-100"
                                    />
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

                                {message && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
                                    >
                                        {message}
                                    </motion.div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
                                >
                                    <span className="relative z-10 flex items-center gap-2 text-sm font-semibold">
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" /> Sending link...
                                            </>
                                        ) : (
                                            <>
                                                Send reset link <ArrowRight className="h-4 w-4" />
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
                                    Remembered your password?{" "}
                                    <Link href="/auth/start" className="font-semibold text-blue-500 hover:underline">
                                        Sign in instead
                                    </Link>
                                </div>
                                <p className="text-center text-[11px] uppercase tracking-[0.25em] text-slate-400">
                                    Supabase secure reset · Zero plaintext storage
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