"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Trash2, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { getAccessToken } from "@/lib/cookies"

interface AccountDeletionProps {
    userEmail: string
    userId?: number
}

export function AccountDeletion({ userEmail, userId }: AccountDeletionProps) {
    const { logout } = useAuth()
    const router = useRouter()
    const [confirmationText, setConfirmationText] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    
    const expectedText = "DELETE"
    const isConfirmed = confirmationText === expectedText

    const handleDeleteAccount = async () => {
        if (!isConfirmed) {
            toast.error("Please type DELETE to confirm")
            return
        }

        setIsDeleting(true)
        try {
            const access_token = getAccessToken()
            const strapiURL = process.env.NEXT_PUBLIC_STRAPI_URL

            if (!access_token || !strapiURL) {
                throw new Error("Authentication required")
            }

            // Delete user from Strapi
            if (userId) {
                const response = await fetch(`${strapiURL}/api/users/${userId}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    },
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(errorText || "Failed to delete account")
                }
            }

            // Logout from Supabase
            await logout()

            // Clear all local storage
            localStorage.clear()
            sessionStorage.clear()

            // Clear cookies
            document.cookie.split(";").forEach(c => {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
            })

            toast.success("Account deleted successfully", {
                position: "top-center",
            })

            // Redirect to home
            setTimeout(() => {
                router.push("/")
            }, 2000)

        } catch (error: any) {
            console.error("Error deleting account:", error)
            toast.error(error.message || "Failed to delete account. Please contact support.", {
                position: "top-center",
            })
            setIsDeleting(false)
            setIsDialogOpen(false)
        }
    }

    return (
        <Card className="liquid-glass-card border-destructive/20">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-xl text-destructive">Delete Account</CardTitle>
                        <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="space-y-2">
                            <p className="font-semibold text-destructive">Warning: This action cannot be undone</p>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                <li>All your courses, enrollments, and progress will be permanently deleted</li>
                                <li>Your profile, badges, and achievements will be removed</li>
                                <li>All data associated with your account will be erased</li>
                                <li>You will be logged out immediately</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="destructive"
                            className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete My Account
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="liquid-modal max-w-md">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="w-5 h-5" />
                                Confirm Account Deletion
                            </AlertDialogTitle>
                            <AlertDialogDescription className="space-y-4 pt-2">
                                <p>
                                    Are you absolutely sure you want to delete your account? This action cannot be undone.
                                </p>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Type <span className="font-bold text-destructive">DELETE</span> to confirm:
                                    </label>
                                    <Input
                                        type="text"
                                        value={confirmationText}
                                        onChange={(e) => setConfirmationText(e.target.value)}
                                        placeholder="Type DELETE"
                                        className="liquid-glass-input"
                                    />
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel 
                                onClick={() => {
                                    setConfirmationText("")
                                    setIsDialogOpen(false)
                                }}
                                disabled={isDeleting}
                            >
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteAccount}
                                disabled={!isConfirmed || isDeleting}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            >
                                {isDeleting ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </div>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Account
                                    </>
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                        If you're experiencing issues or have questions, please contact our support team before deleting your account.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

