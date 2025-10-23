// components/signup/SignUpChoiceModal.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Sparkles } from "lucide-react";
import { DraggableDialog } from "@/components/ui/draggable-dialog";
import { motion } from "framer-motion";

interface SignUpChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSignUpWithEmail: () => void;
    onAuthSuccess?: () => void;
}

export function SignUpChoiceModal({
                                      isOpen,
                                      onClose,
                                      onSignUpWithEmail,
                                  }: SignUpChoiceModalProps) {

    const handleGoogleRedirect = () => {
        try {
            window.location.href = "/auth/google";
            console.log("Redirecting to Google OAuth...");
        } catch (error) {
            console.error("Redirect failed:", error);
            throw new Error(error as string);
        }
    };

    return (
        <DraggableDialog
            open={isOpen}
            onOpenChange={onClose}
            title="Join CamEdu!"
            className="backdrop-blur-md bg-white/80 dark:bg-gray-900/80"
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 p-6"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mx-auto w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md"
                >
                    <Sparkles className="w-8 h-8 text-emerald-500 animate-pulse" />
                </motion.div>

                {/*<Button*/}
                {/*    onClick={handleGoogleRedirect}*/}
                {/*    className="w-full h-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md transition-all"*/}
                {/*>*/}
                {/*    <span className="font-bold text-2xl mr-2 text-blue-500">G</span> Sign up with Google*/}
                {/*</Button>*/}

                <div className="relative flex items-center my-4">
                    <Separator className="flex-1 bg-gray-300 dark:bg-gray-600" />
                    <span className="px-4 text-gray-500 dark:text-gray-400">or</span>
                    <Separator className="flex-1 bg-gray-300 dark:bg-gray-600" />
                </div>

                <Button
                    onClick={() => {
                        onSignUpWithEmail();
                        onClose();
                    }}
                    className="w-full h-12 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold rounded-lg shadow-md transition-all hover:shadow-lg"
                >
                    <Mail className="w-5 h-5 mr-2" />
                    Sign Up with Email
                </Button>
            </motion.div>
        </DraggableDialog>
    );
}