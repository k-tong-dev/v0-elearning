"use client"

import React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { BookOpen } from "lucide-react"

interface BioFieldProps {
    bio: string | undefined // Bio can be undefined
    onBioChange: (value: string) => void
}

export function BioField({ bio, onBioChange }: BioFieldProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor="bio">
                <BookOpen className="w-4 h-4 mr-2 text-orange-500" />
                Bio
            </Label>
            <Textarea
                id="bio"
                value={bio || ""} // Ensure it's an empty string if undefined
                onChange={(e) => onBioChange(e.target.value)}
                placeholder="Tell us a little about yourself..."
                className="min-h-[100px]"
            />
        </div>
    )
}