"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Mail, Lock, Sparkles } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { GoogleSignIn } from "@/components/auth/google-signin"
import { SignUpChoiceModal } from "@/components/signup/SignUpChoiceModal" // Import SignUpChoiceModal
import { useRouter } from "next/navigation"

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
    onAuthSuccess?: () => void
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
    const { login, isLoading: authLoading, loginWithGoogle } = useAuth()
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })
    const [error, setError] = useState("")
    const [showSignUpChoiceModal, setShowSignUpChoiceModal] = useState(false) // New state for choice modal

    const handleGoogleAuthSuccess = async (credential: string) => {
        try {
            await loginWithGoogle(credential);
            onAuthSuccess?.();
            onClose();
        } catch (error: any) {
            console.error("Google authentication failed:", error);
            setError(error.message || "Google authentication failed");
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        try {
            await login(formData.email, formData.password)
            onAuthSuccess?.()
            onClose()
        } catch (error: any) {
            console.error("Authentication failed:", error)
            setError(error.message || "Authentication failed")
        }
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleCreateAccountClick = () => {
        onClose(); // Close the login modal
        setShowSignUpChoiceModal(true); // Open the choice modal
    };

    const handleSignUpWithEmail = () => {
        router.push("/signup")
        setShowSignUpChoiceModal(false)
    }

    const handleSignUpWithGoogle = async (credential: string) => {
        await loginWithGoogle(credential);
        setShowSignUpChoiceModal(false);
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md glass-enhanced border-0 shadow-2xl">
                    <DialogHeader className="space-y-4 text-center">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full flex items-center justify-center animate-pulse-glow">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent animate-gradient">
                            Welcome Back!
                        </DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground text-lg">
                            Continue your amazing learning journey
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 mt-6">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <GoogleSignIn
                            text="signin_with"
                            onSuccess={handleGoogleAuthSuccess}
                            onError={(error) => setError(error)}
                        />

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <Separator className="w-full bg-gradient-to-r from-transparent via-border to-transparent" />
                            </div>
                            <div className="relative flex justify-center text-sm uppercase">
                                <span className="bg-background px-4 text-muted-foreground font-medium">Or continue with email</span>
                            </div>
                        </div>

                        <form onSubmit={handleEmailAuth} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                                    <Mail className="w-4 h-4 text-emerald-500" />
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    required
                                    className="h-12 transition-all duration-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 pl-4 text-base border-2 hover:border-emerald-300"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                                    <Lock className="w-4 h-4 text-orange-500" />
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange("password", e.target.value)}
                                        required
                                        className="h-12 transition-all duration-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 pl-4 pr-12 text-base border-2 hover:border-orange-300"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/20"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4 text-orange-500" />
                                        ) : (
                                            <Eye className="w-4 h-4 text-orange-500" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={authLoading}
                                className="w-full h-12 bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500 hover:from-cyan-600 hover:via-emerald-600 hover:to-cyan-600 text-white transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/25 hover:scale-[1.02] text-lg font-semibold animate-gradient bg-[length:200%_200%]"
                            >
                                {authLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Please wait...
                                    </div>
                                ) : (
                                    "Sign In to CamEdu"
                                )}
                            </Button>
                        </form>

                        <p className="text-center text-sm text-muted-foreground">
                            New to CamEdu?{" "}
                            <button
                                type="button"
                                onClick={handleCreateAccountClick}
                                className="text-cyan-600 hover:text-cyan-700 hover:underline font-semibold transition-all duration-200 hover:scale-105 inline-block"
                            >
                                Create an account
                            </button>
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* SignUpChoiceModal component */}
            <SignUpChoiceModal
                isOpen={showSignUpChoiceModal}
                onClose={() => setShowSignUpChoiceModal(false)}
                onSignUpWithEmail={handleSignUpWithEmail}
                onSignUpWithGoogle={handleSignUpWithGoogle}
                onAuthSuccess={onAuthSuccess}
            />
        </>
    )
}