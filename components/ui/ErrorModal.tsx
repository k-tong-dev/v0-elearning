"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Bug } from "lucide-react";

interface ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    reportIssueTitle?: string;
    reportIssueDescription?: string;
}

export function ErrorModal({
                               isOpen,
                               onClose,
                               title,
                               message,
                               reportIssueTitle,
                               reportIssueDescription,
                           }: ErrorModalProps) {
    const router = useRouter();

    const handleReportIssue = () => {
        onClose();
        const encodedTitle = encodeURIComponent(reportIssueTitle || title);
        const encodedDescription = encodeURIComponent(reportIssueDescription || message);
        router.push(`/report?title=${encodedTitle}&error=${encodedDescription}`);
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-md p-6 rounded-lg shadow-xl border border-red-200 bg-card">
                <AlertDialogHeader className="text-center">
                    <AlertCircle className="mx-auto w-16 h-16 text-red-500 mb-4" />
                    <AlertDialogTitle className="text-2xl font-bold text-red-600">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground text-base">
                        {message}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-3 mt-6">
                    {reportIssueTitle && (
                        <Button
                            variant="outline"
                            onClick={handleReportIssue}
                            className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                            <Bug className="w-4 h-4 mr-2" />
                            Report Issue
                        </Button>
                    )}
                    <AlertDialogAction asChild>
                        <Button
                            onClick={onClose}
                            className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
                        >
                            Got It
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}