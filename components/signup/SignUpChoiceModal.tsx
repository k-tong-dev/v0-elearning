"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Mail, Sparkles } from "lucide-react"
import { GoogleSignIn } from "@/components/auth/google-signin"
import { motion } from "framer-motion"

interface SignUpChoiceModalProps {
    isOpen: boolean
    onClose: () => void
    onSignUpWithEmail: () => void
    onSignUpWithGoogle: (credential: string) => Promise<void>
    onAuthSuccess?: () => void
}

export function SignUpChoiceModal({
                                      isOpen,
                                      onClose,
                                      onSignUpWithEmail,
                                      onSignUpWithGoogle,
                                      onAuthSuccess
                                  }: SignUpChoiceModalProps) {
    const [googleError, setGoogleError] = React.useState("");

    const handleGoogleSuccess = async (credential: string) => {
        setGoogleError("");
        try {
            await onSignUpWithGoogle(credential);
            onAuthSuccess?.();
            onClose();
        } catch (error: any) {
            console.error("Google signup failed:", error);
            setGoogleError(error.message || "Google signup failed.");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md glass-enhanced border-0 shadow-2xl">
                <DialogHeader className="space-y-4 text-center">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full flex items-center justify-center animate-pulse-glow">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent animate-gradient">
                        Join CamEdu!
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground text-lg light:text-black">
                        Choose how you would like to create your account
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-6">
                    {googleError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 mb-4"
                        >
                            {googleError}
                        </motion.div>
                    )}

                    <GoogleSignIn
                        text="signup_with"
                        onSuccess={handleGoogleSuccess}
                        onError={(err) => setGoogleError(err)}
                    />

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator className="w-full bg-gradient-to-r from-transparent via-border to-transparent" />
                        </div>
                        <div className="relative flex justify-center text-sm uppercase">
                            <span className="bg-background px-4 text-muted-foreground font-medium">Or</span>
                        </div>
                    </div>

                    <Button
                        onClick={() => {
                            onSignUpWithEmail();
                            onClose();
                        }}
                        className="w-full h-12 bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500 hover:from-cyan-600 hover:via-emerald-600 hover:to-cyan-600 text-white transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/25 hover:scale-[1.02] text-lg font-semibold animate-gradient bg-[length:200%_200%]"
                    >
                        <Mail className="w-5 h-5 mr-2" />
                        Sign Up with Email
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}