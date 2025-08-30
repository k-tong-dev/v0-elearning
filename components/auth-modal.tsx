"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Mail, Lock, User, Sparkles } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { GoogleSignIn } from "@/components/auth/google-signin"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "signin" | "signup"
  onToggleMode: () => void
  onAuthSuccess?: () => void
}

export function AuthModal({ isOpen, onClose, mode, onToggleMode, onAuthSuccess }: AuthModalProps) {
  const { login, register, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  })
  const [error, setError] = useState("")

  const handleGoogleAuth = async () => {
    try {
      onAuthSuccess?.()
      onClose()
    } catch (error: any) {
      console.error("Google authentication failed:", error)
      setError(error.message || "Google authentication failed")
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      if (mode === "signup" && formData.password !== formData.confirmPassword) {
        setError("Passwords don't match!")
        return
      }

      if (mode === "signup") {
        await register(formData.name, formData.email, formData.password)
      } else {
        await login(formData.email, formData.password)
      }
      
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-enhanced border-0 shadow-2xl">
        <DialogHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full flex items-center justify-center animate-pulse-glow">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent animate-gradient">
            {mode === "signin" ? "Welcome Back!" : "Join CamEdu"}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground text-lg">
            {mode === "signin" ? "Continue your amazing learning journey" : "Start your educational adventure today"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              {error}
            </div>
          )}
          
          <GoogleSignIn
            text={mode === 'signin' ? 'signin_with' : 'signup_with'}
            onSuccess={() => {
              onAuthSuccess?.()
              onClose()
            }}
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
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                  <User className="w-4 h-4 text-cyan-500" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  className="h-12 transition-all duration-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 pl-4 text-base border-2 hover:border-cyan-300"
                />
              </div>
            )}

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

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="w-4 h-4 text-purple-500" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    required
                    className="h-12 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 pl-4 pr-12 text-base border-2 hover:border-purple-300"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-purple-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-purple-500" />
                    )}
                  </Button>
                </div>
              </div>
            )}

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
              ) : mode === "signin" ? (
                "Sign In to CamEdu"
              ) : (
                "Create My Account"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to CamEdu? " : "Already have an account? "}
            <button
              type="button"
              onClick={onToggleMode}
              className="text-cyan-600 hover:text-cyan-700 hover:underline font-semibold transition-all duration-200 hover:scale-105 inline-block"
            >
              {mode === "signin" ? "Create an account" : "Sign in instead"}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
