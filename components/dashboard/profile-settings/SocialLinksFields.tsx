"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Github, Twitter, Linkedin, Facebook, Instagram } from "lucide-react" // Added Facebook and Instagram

interface SocialLinks {
    twitter?: string
    github?: string
    linkedin?: string
    facebook?: string // Added facebook
    instagram?: string // Added instagram
}

interface SocialLinksFieldsProps {
    socialLinks: SocialLinks
    onInputChange: (field: string, value: string) => void
}

export function SocialLinksFields({ socialLinks, onInputChange }: SocialLinksFieldsProps) {
    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="github">
                        <Github className="w-4 h-4 mr-2 text-gray-700 dark:text-gray-300" />
                        GitHub
                    </Label>
                    <Input
                        id="github"
                        value={socialLinks.github || ""}
                        onChange={(e) => onInputChange("socialLinks.github", e.target.value)}
                        placeholder="https://github.com/yourusername"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="twitter">
                        <Twitter className="w-4 h-4 mr-2 text-blue-400" />
                        Twitter
                    </Label>
                    <Input
                        id="twitter"
                        value={socialLinks.twitter || ""}
                        onChange={(e) => onInputChange("socialLinks.twitter", e.target.value)}
                        placeholder="https://twitter.com/yourusername"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="linkedin">
                        <Linkedin className="w-4 h-4 mr-2 text-blue-700" />
                        LinkedIn
                    </Label>
                    <Input
                        id="linkedin"
                        value={socialLinks.linkedin || ""}
                        onChange={(e) => onInputChange("socialLinks.linkedin", e.target.value)}
                        placeholder="https://linkedin.com/in/yourusername"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="facebook">
                        <Facebook className="w-4 h-4 mr-2 text-blue-600" />
                        Facebook
                    </Label>
                    <Input
                        id="facebook"
                        value={socialLinks.facebook || ""}
                        onChange={(e) => onInputChange("socialLinks.facebook", e.target.value)}
                        placeholder="https://facebook.com/yourprofile"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="instagram">
                        <Instagram className="w-4 h-4 mr-2 text-pink-500" />
                        Instagram
                    </Label>
                    <Input
                        id="instagram"
                        value={socialLinks.instagram || ""}
                        onChange={(e) => onInputChange("socialLinks.instagram", e.target.value)}
                        placeholder="https://instagram.com/yourprofile"
                    />
                </div>
            </div>
        </div>
    )
}