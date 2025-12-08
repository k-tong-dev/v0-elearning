"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Link as LinkIcon } from "lucide-react"

interface LocationWebsiteFieldsProps {
    location: string | undefined
    website: string | undefined
    onInputChange: (field: string, value: string) => void
}

export function LocationWebsiteFields({ location, website, onInputChange }: LocationWebsiteFieldsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="location">
                    <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                    Location
                </Label>
                <Input
                    id="location"
                    value={location || ""}
                    onChange={(e) => onInputChange("location", e.target.value)}
                    placeholder="e.g., San Francisco, CA"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="website">
                    <LinkIcon className="w-4 h-4 mr-2 text-pink-500" />
                    Website
                </Label>
                <Input
                    id="website"
                    value={website || ""}
                    onChange={(e) => onInputChange("website", e.target.value)}
                    placeholder="https://yourwebsite.com"
                />
            </div>
        </div>
    )
}