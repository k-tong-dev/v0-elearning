"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail } from "lucide-react"

interface BasicInfoFieldsProps {
    name: string
    email: string
    onInputChange: (field: string, value: string) => void
}

export function BasicInfoFields({ name, email, onInputChange }: BasicInfoFieldsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="username">
                    <User className="w-4 h-4 mr-2 text-cyan-500" />
                    Username
                </Label>
                <Input
                    id="username"
                    value={name} // Use 'name' prop which is mapped to currentUser.username
                    onChange={(e) => onInputChange("username", e.target.value)} // Update 'username' field
                    placeholder="Your username"
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">
                    <Mail className="w-4 h-4 mr-2 text-emerald-500" />
                    Email Address
                </Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => onInputChange("email", e.target.value)}
                    placeholder="your@example.com"
                    required
                />
            </div>
        </div>
    )
}