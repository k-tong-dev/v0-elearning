"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Save } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { UserRole } from "@/types/auth"

// Import new modular components
import { AvatarUploadField } from "./profile-settings/AvatarUploadField"
import { BasicInfoFields } from "./profile-settings/BasicInfoFields"
import { RoleSelectionField } from "./profile-settings/RoleSelectionField"
import { BioField } from "./profile-settings/BioField"
import { LocationWebsiteFields } from "./profile-settings/LocationWebsiteFields"
import { SocialLinksFields } from "./profile-settings/SocialLinksFields"
import { SkillsManagement } from "./profile-settings/SkillsManagement"
import { BadgesManagement } from "./profile-settings/BadgesManagement"
import { FollowStatsDisplay } from "./profile-settings/FollowStatsDisplay"

interface ProfileSettingsFormProps {
    currentUser: {
        id: string
        name: string
        email: string
        avatar?: string
        bio?: string
        location?: string
        website?: string
        socialLinks?: {
            twitter?: string
            github?: string
            linkedin?: string
        }
        role?: UserRole
        settings?: {
            skills?: string[];
        }
        badgeIds?: string[]
        followers?: number; // Add followers count
        following?: number; // Add following count
    }
}

export function ProfileSettingsForm({ currentUser }: ProfileSettingsFormProps) {
    const { user, refreshUser } = useAuth()
    const [formData, setFormData] = useState({
        name: currentUser.name,
        email: currentUser.email,
        bio: currentUser.bio || "",
        location: currentUser.location || "",
        website: currentUser.website || "",
        role: currentUser.role || "student",
        socialLinks: {
            twitter: currentUser.socialLinks?.twitter || "",
            github: currentUser.socialLinks?.github || "",
            linkedin: currentUser.socialLinks?.linkedin || "",
        },
        avatar: currentUser.avatar || "",
        skills: currentUser.settings?.skills || [],
        selectedBadgeIds: currentUser.badgeIds || [],
    })
    const [isSaving, setIsSaving] = useState(false)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    useEffect(() => {
        setFormData({
            name: currentUser.name,
            email: currentUser.email,
            bio: currentUser.bio || "",
            location: currentUser.location || "",
            website: currentUser.website || "",
            role: currentUser.role || "student",
            socialLinks: {
                twitter: currentUser.socialLinks?.twitter || "",
                github: currentUser.socialLinks?.github || "",
                linkedin: currentUser.socialLinks?.linkedin || "",
            },
            avatar: currentUser.avatar || "",
            skills: currentUser.settings?.skills || [],
            selectedBadgeIds: currentUser.badgeIds || [],
        })
    }, [currentUser])

    const handleInputChange = (field: string, value: any) => {
        if (field.startsWith("socialLinks.")) {
            const socialField = field.split(".")[1] as keyof typeof formData.socialLinks
            setFormData((prev) => ({
                ...prev,
                socialLinks: {
                    ...prev.socialLinks,
                    [socialField]: value,
                },
            }))
        } else {
            setFormData((prev) => ({ ...prev, [field]: value }))
        }
    }

    const handleAvatarChange = async (file: File) => {
        setIsUploadingAvatar(true);
        try {
            // In a real app, this would be an new API call to upload the file
            // and return a permanent URL. For now, we'll just update the preview.
            const imageUrl = URL.createObjectURL(file);
            setFormData((prev) => ({ ...prev, avatar: imageUrl }));
        } catch (error) {
            console.error("Failed to process avatar file:", error);
            // Error toast handled in AvatarUploadField
        } finally {
            setIsUploadingAvatar(false);
        }
    }

    const handleSkillsChange = (newSkills: string[]) => {
        setFormData(prev => ({ ...prev, skills: newSkills }));
    };

    const handleBadgesChange = (newBadgeIds: string[]) => {
        setFormData(prev => ({ ...prev, selectedBadgeIds: newBadgeIds }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.id) {
            toast.error("User not authenticated.")
            return
        }

        setIsSaving(true)
        try {
            const updatePayload = {
                name: formData.name,
                email: formData.email,
                bio: formData.bio,
                location: formData.location,
                website: formData.website,
                role: formData.role,
                socialLinks: formData.socialLinks,
                avatar: formData.avatar,
                settings: {
                    ...currentUser.settings, // Preserve other settings if any
                    skills: formData.skills,
                },
                badgeIds: formData.selectedBadgeIds,
            }

            console.log("Sending update for user ID:", user.id);
            const response = await fetch(`/api/users/${user.id}/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatePayload),
            })

            if (!response.ok) {
                const errorText = await response.text();
                console.error("API Error Response (raw text):", errorText);
                throw new Error(errorText || "Failed to update profile.");
            }

            const data = await response.json()

            toast.success("Profile updated successfully!")
            await refreshUser()
        } catch (error: any) {
            console.error("Error updating profile:", error)
            toast.error(error.message || "Failed to update profile.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            <Card className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                <CardHeader>
                    <CardTitle>Edit Profile</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <BasicInfoFields
                            name={formData.name}
                            email={formData.email}
                            onInputChange={handleInputChange}
                        />

                        {/* New: Follower/Following Stats Display */}
                        <FollowStatsDisplay
                            followers={currentUser.followers ?? 0}
                            following={currentUser.following ?? 0}
                        />

                        <RoleSelectionField
                            role={formData.role}
                            onRoleChange={(value) => handleInputChange("role", value)}
                        />

                        <BioField
                            bio={formData.bio}
                            onBioChange={(value) => handleInputChange("bio", value)}
                        />

                        <LocationWebsiteFields
                            location={formData.location}
                            website={formData.website}
                            onInputChange={handleInputChange}
                        />

                        <SocialLinksFields
                            socialLinks={formData.socialLinks}
                            onInputChange={handleInputChange}
                        />

                        <SkillsManagement
                            selectedSkills={formData.skills}
                            onSkillsChange={handleSkillsChange}
                        />

                        <BadgesManagement
                            selectedBadgeIds={formData.selectedBadgeIds}
                            onBadgesChange={handleBadgesChange}
                        />

                        <Button
                            type="submit"
                            disabled={isSaving || isUploadingAvatar}
                            className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                        >
                            {isSaving ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </div>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </motion.div>
    )
}