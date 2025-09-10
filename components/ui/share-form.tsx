"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/moving-border"
import { Copy, Twitter, Facebook, Linkedin, Mail, MessageCircle } from "lucide-react"

interface ShareFormProps {
    title: string
    url: string
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export default function ShareForm({ title, url, isOpen, onOpenChange }: ShareFormProps) {
    const handleShare = (platform: string) => {
        if (typeof window === "undefined") {
            toast.error("Sharing is not available in this environment.")
            return
        }

        const text = `Check out this article: ${title}`
        let shareUrl = ""

        switch (platform) {
            case "twitter":
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
                break
            case "facebook":
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
                break
            case "linkedin":
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
                break
            case "whatsapp":
                shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`
                break
            case "email":
                shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n${url}`)}`
                break
            case "copy":
                navigator.clipboard
                    .writeText(url)
                    .then(() => {
                        toast.success("Link copied to clipboard!")
                        onOpenChange(false)
                    })
                    .catch(() => {
                        toast.error("Failed to copy link.")
                    })
                return
            default:
                return
        }

        if (shareUrl) {
            window.open(shareUrl, "_blank", "width=600,height=400")
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Share this article</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-center gap-2 p-2 bg-transparent rounded-lg border border-border">
                        <Input value={url} readOnly className="flex-1" />
                        <Button onClick={() => handleShare("copy")}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={() => handleShare("twitter")}>
                            <Twitter className="w-4 h-4 mr-2" />
                            Twitter
                        </Button>
                        <Button variant="outline" onClick={() => handleShare("facebook")}>
                            <Facebook className="w-4 h-4 mr-2" />
                            Facebook
                        </Button>
                        <Button variant="outline" onClick={() => handleShare("linkedin")}>
                            <Linkedin className="w-4 h-4 mr-2" />
                            LinkedIn
                        </Button>
                        <Button variant="outline" onClick={() => handleShare("whatsapp")}>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp
                        </Button>
                        <Button variant="outline" onClick={() => handleShare("email")}>
                            <Mail className="w-4 h-4 mr-2" />
                            Email
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}