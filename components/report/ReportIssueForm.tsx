"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Bug, Send, Loader2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { reportIssue } from "@/integrations/strapi/utils";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

interface ReportIssueFormProps {
    initialTitle?: string;
    initialDescription?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function ReportIssueForm({ initialTitle, initialDescription, onSuccess, onCancel }: ReportIssueFormProps) {
    const router = useRouter();
    const { user } = useAuth();

    const [title, setTitle] = useState(initialTitle || "");
    const [description, setDescription] = useState(initialDescription || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        setTitle(initialTitle || "");
        setDescription(initialDescription || "");
    }, [initialTitle, initialDescription]);

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        if (!title || !description) {
            setError("Title and description are required.");
            setLoading(false);
            return;
        }

        try {
            const payload = {
                title,
                description,
                user: user?.id ? parseInt(user.id) : undefined,
                internal_noted: "Reported via frontend form.",
            };
            await reportIssue(payload);

            setSuccess(true);
            toast.success("Issue reported successfully! We'll look into it.", {
                position: "top-center",
                duration: 3000,
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            });
            setTitle("");
            setDescription("");
            onSuccess?.();
            setTimeout(() => router.push("/"), 3000);
        } catch (err: any) {
            console.error("Failed to submit report:", err);
            setError(err.message || "Failed to submit report. Please try again.");
            toast.error(err.message || "Failed to submit report.", {
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border p-8 space-y-6"
        >
            <div className="text-center space-y-4">
                <Bug className="mx-auto w-16 h-16 text-red-500" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                    Report an Issue
                </h2>
                <p className="text-muted-foreground">
                    Tell us what went wrong so we can fix it.
                </p>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center gap-2 text-sm font-medium">
                        <Bug className="w-4 h-4 text-red-500" />
                        Issue Title
                    </Label>
                    <Input
                        id="title"
                        type="text"
                        placeholder="e.g., Login failed, Page not loading"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="h-12 transition-all duration-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 pl-4 text-base border-2 hover:border-red-300"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        Description
                    </Label>
                    <Textarea
                        id="description"
                        placeholder="Please describe the issue in detail..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows={5}
                        className="min-h-[120px] transition-all duration-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 p-4 text-base border-2 hover:border-red-300"
                    />
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
                        Report submitted successfully!
                    </motion.div>
                )}

                <Button
                    type="submit"
                    disabled={loading || success}
                    className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-lg shadow-md transition-all hover:shadow-lg"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending Report...
                        </div>
                    ) : (
                        <>
                            Send Report
                            <Send className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                <Link href="/" className="text-primary hover:underline">
                    <ArrowLeft className="w-4 h-4 mr-1 inline-block" />
                    Back to Home
                </Link>
            </p>
        </motion.div>
    );
}