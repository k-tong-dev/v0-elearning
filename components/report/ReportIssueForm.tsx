"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bug, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
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
    const { user, refreshUser } = useAuth();

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

        if (!user?.id) {
            setError("You must be logged in to report an issue.");
            setLoading(false);
            toast.error("Please log in to report an issue.", {
                position: "top-center",
            });
            return;
        }

        try {
            const payload = {
                title,
                description,
                user: parseInt(user.id), // Ensure user is set, not null
            };
            
            console.log("[ReportIssueForm] Submitting report:", payload);
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
            
            // Refresh user data to get new report
            await refreshUser();
            
            // Only redirect if not in dashboard (onSuccess will handle refresh)
            if (onSuccess) {
                onSuccess();
            } else {
                setTimeout(() => router.push("/"), 3000);
            }
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full space-y-6"
        >
            <div className="text-center space-y-3 pb-4 border-b border-border">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-red-500/10 to-orange-500/10 flex items-center justify-center mb-2">
                    <Bug className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                    Report an Issue
                </h2>
                <p className="text-sm text-muted-foreground">
                    Tell us what went wrong so we can fix it quickly
                </p>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-semibold">
                        Issue Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="title"
                        type="text"
                        placeholder="e.g., Login failed, Page not loading"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="h-11 transition-all duration-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold">
                        Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id="description"
                        placeholder="Please describe the issue in detail. Include steps to reproduce, expected behavior, and what actually happened..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows={6}
                        className="min-h-[140px] transition-all duration-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                        {description.length}/500 characters
                    </p>
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

                <div className="flex gap-3 pt-2">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={loading || success}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={loading || success || !title || !description}
                        className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold shadow-md transition-all hover:shadow-lg"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending...
                            </div>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Submit Report
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </motion.div>
    );
}