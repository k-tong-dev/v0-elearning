"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Mail, Lock, User, Sparkles } from "lucide-react"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "signin" | "signup"
  onToggleMode: () => void
}

export function AuthModal({ isOpen, onClose, mode, onToggleMode }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  })

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    try {
      console.log("[v0] Google authentication initiated")

      const googleAuthUrl = `https://accounts.google.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(window.location.origin)}&scope=email%20profile&response_type=code`

      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log("[v0] Google authentication successful")
      onClose()
    } catch (error) {
      console.error("[v0] Google authentication failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === "signup" && formData.password !== formData.confirmPassword) {
        alert("Passwords don't match!")
        return
      }

      console.log("[v0] Email authentication:", { mode, email: formData.email })
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log("[v0] Email authentication successful")
      onClose()
    } catch (error) {
      console.error("[v0] Email authentication failed:", error)
    } finally {
      setIsLoading(false)
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
          <Button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full relative bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] py-4 text-lg font-medium group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <svg className="w-6 h-6 mr-3 relative z-10" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="relative z-10">{isLoading ? "Connecting to Google..." : `Continue with Google`}</span>
          </Button>

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
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500 hover:from-cyan-600 hover:via-emerald-600 hover:to-cyan-600 text-white transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/25 hover:scale-[1.02] text-lg font-semibold animate-gradient bg-[length:200%_200%]"
            >
              {isLoading ? (
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
