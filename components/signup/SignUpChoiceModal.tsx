"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Mail, Globe, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { GoogleSignIn } from "@/components/auth/google-signin"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"

interface SignUpChoiceModalProps {
    isOpen: boolean
    onClose: () => void
}

export function SignUpChoiceModal({ isOpen, onClose }: SignUpChoiceModalProps) {
    const router = useRouter()
    const { loginWithGoogle } = useAuth()
    const [googleError, setGoogleError] = React.useState("");

    const handleEmailSignUp = () => {
        onClose()
        router.push("/signup")
    }

    const handleGoogleAuthSuccess = async (credential: string) => {
        try {
            // For initial Google signup, we don't have role/preferences yet.
            // The /api/auth/google-oauth endpoint will handle redirecting to the preferences page if new.
            await loginWithGoogle(credential);
            onClose();
            // The backend will handle the redirect to /dashboard or /signup/google-preferences
        } catch (err: any) {
            console.error("Google sign up failed:", err);
            setGoogleError(err.message || "Google sign up failed. Please try again.");
            toast.error(err.message || "Google sign up failed.");
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
                        Join CamEdu
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground text-lg">
                        Choose how you would like to create your account
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-6">
                    {googleError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                            {googleError}
                        </div>
                    )}
                    <GoogleSignIn
                        text="signup_with"
                        onSuccess={handleGoogleAuthSuccess}
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
                        onClick={handleEmailSignUp}
                        className="w-full h-12 bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500 hover:from-cyan-600 hover:via-emerald-600 hover:to-cyan-600 text-white transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/25 hover:scale-[1.02] text-lg font-semibold animate-gradient bg-[length:200%_200%]"
                    >
                        <Mail className="w-5 h-5 mr-2" />
                        Sign Up with Email
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}