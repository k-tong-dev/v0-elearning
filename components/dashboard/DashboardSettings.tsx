"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Crown,
    Loader2,
    Save,
    Bell,
    Users,
    BookOpen,
    DollarSign,
    TrendingUp,
    Star,
    CheckCircle,
    AlertCircle,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BasicInfoFields } from "@/components/dashboard/profile-settings/BasicInfoFields"
import { RoleSelectionField } from "@/components/dashboard/profile-settings/RoleSelectionField"
import { BioField } from "@/components/dashboard/profile-settings/BioField"
import { LocationWebsiteFields } from "@/components/dashboard/profile-settings/LocationWebsiteFields"
import { SocialLinksFields } from "@/components/dashboard/profile-settings/SocialLinksFields"
import { SkillsManagement } from "@/components/dashboard/profile-settings/SkillsManagement"
import { BadgesManagement } from "@/components/dashboard/profile-settings/BadgesManagement"
import { ProfileHeaderDisplay } from "@/components/dashboard/profile-settings/ProfileHeaderDisplay"
import { FaRegUser, FaCog, FaCrown } from "react-icons/fa"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { User, Default, UserRoleSlug } from "@/types/user"
import avatar_placeholder from "@/public/avatars/robotic.png"

interface StrapiMedia {
    id: number
    documentId: string
    name: string
    url: string
    formats: {
        thumbnail: { url: string }
        small: { url: string }
        medium: { url: string }
        large: { url: string }
    }
}

interface DashboardStats {
    coursesCreated: number
    totalEnrollments: number
    totalRevenue: number
    completionRate: number
}

interface DashboardSettingsProps {
    currentUser: User
    stats?: DashboardStats
}

export function DashboardSettings({ currentUser, stats }: DashboardSettingsProps) {
    const { user, refreshUser } = useAuth()
    const access_token = localStorage.getItem("access_token")
    const strapiURL = process.env.NEXT_PUBLIC_STRAPI_URL

    // Initialize notification settings with fallback defaults
    const initialNotifications = currentUser.settings?.notifications || {}
    const [notificationSettings, setNotificationSettings] = useState({
        newEnrollments: initialNotifications.newEnrollments ?? true,
        courseReviews: initialNotifications.courseReviews ?? true,
        paymentNotifications: initialNotifications.paymentNotifications ?? true,
        weeklyAnalytics: initialNotifications.weeklyAnalytics ?? true,
    })

    const [isSavingNotifications, setIsSavingNotifications] = useState(false)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        currentUser.avatar && typeof currentUser.avatar === 'object' && currentUser.avatar.url
            ? `${strapiURL}${currentUser.avatar.url}`
            : typeof currentUser.avatar === 'string'
                ? currentUser.avatar
                : null
    )

    // Initialize form data with User fields
    const [formData, setFormData] = useState({
        username: currentUser.username || "",
        email: currentUser.email,
        bio: currentUser.settings?.bio || "",
        location: currentUser.settings?.location || "",
        website: currentUser.settings?.website || "",
        charactor: currentUser.charactor?.attributes.slug || "student",
        socialLinks: {
            twitter: currentUser.settings?.socialLinks?.twitter || "",
            github: currentUser.settings?.socialLinks?.github || "",
            linkedin: currentUser.settings?.socialLinks?.linkedin || "",
        },
        avatar: currentUser.avatar || "",
        skills: currentUser.settings?.skills || [],
        selectedBadgeIds: currentUser.badgeIds || [],
    })

    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [activeSection, setActiveSection] = useState<"profile" | "notifications" | "limits">("profile")

    // Sync with URL search params
    useEffect(() => {
        if (typeof window === "undefined") return
        const params = new URLSearchParams(window.location.search)
        const section = params.get("section")
        if (section && ["profile", "notifications", "limits"].includes(section) && section !== activeSection) {
            setActiveSection(section as "profile" | "notifications" | "limits")
        }
    }, [activeSection])

    // Sync form data and avatar preview with currentUser
    useEffect(() => {
        setFormData({
            username: currentUser.username || "",
            email: currentUser.email,
            bio: currentUser.settings?.bio || "",
            location: currentUser.settings?.location || "",
            website: currentUser.settings?.website || "",
            charactor: currentUser.charactor?.attributes.slug || "student",
            socialLinks: {
                twitter: currentUser.settings?.socialLinks?.twitter || "",
                github: currentUser.settings?.socialLinks?.github || "",
                linkedin: currentUser.settings?.socialLinks?.linkedin || "",
            },
            avatar: currentUser.avatar || "",
            skills: currentUser.settings?.skills || [],
            selectedBadgeIds: currentUser.badgeIds || [],
        })
        setAvatarPreview(
            currentUser.avatar && typeof currentUser.avatar === 'object' && currentUser.avatar.url
                ? `${strapiURL}${currentUser.avatar.url}`
                : typeof currentUser.avatar === 'string'
                    ? currentUser.avatar
                    : null
        )
    }, [currentUser, strapiURL])

    // Sync notification settings
    useEffect(() => {
        setNotificationSettings({
            newEnrollments: currentUser.settings?.notifications?.newEnrollments ?? true,
            courseReviews: currentUser.settings?.notifications?.courseReviews ?? true,
            paymentNotifications: currentUser.settings?.notifications?.paymentNotifications ?? true,
            weeklyAnalytics: currentUser.settings?.notifications?.weeklyAnalytics ?? true,
        })
    }, [currentUser.settings])

    const handleNotificationChange = (key: keyof typeof notificationSettings, checked: boolean) => {
        setNotificationSettings((prev) => ({ ...prev, [key]: checked }))
    }

    const handleAvatarChange = async (file: File) => {
        setIsUploadingAvatar(true)

        try {
            const formData = new FormData()
            formData.append("files", file)

            const uploadResponse = await fetch(`${strapiURL}/api/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${access_token}` },
                body: formData,
            })

            if (!uploadResponse.ok) {
                throw new Error("Failed to upload avatar.")
            }

            const [uploadedFile] = await uploadResponse.json()
            const objectUrl = uploadedFile.url
            setAvatarPreview(uploadedFile.formats?.thumbnail?.url || objectUrl)
            setFormData((prev) => ({ ...prev, avatar: objectUrl }))

            if (!user?.id) {
                throw new Error("User not authenticated.")
            }

            const updatePayload = {
                avatar: uploadedFile.id,
                settings: {
                    ...currentUser.settings,
                    notifications: notificationSettings,
                    skills: formData.skills,
                    bio: formData.bio,
                    location: formData.location,
                    website: formData.website,
                    socialLinks: formData.socialLinks,
                },
                badgeIds: formData.selectedBadgeIds,
                charactor: currentUser.charactor?.id,
            }

            const response = await fetch(`${strapiURL}/api/users/${user.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${access_token}`,
                },
                body: JSON.stringify(updatePayload),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || "Failed to update avatar.")
            }

            await refreshUser()
            toast.success("Avatar updated successfully!", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            })
        } catch (error: any) {
            console.error("Avatar update error:", error)
            toast.error(error.message || "Failed to update avatar", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            })
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    const handleProfileInputChange = (field: string, value: any) => {
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

    const handleSkillsChange = (newSkills: string[]) => {
        setFormData((prev) => ({ ...prev, skills: newSkills }))
    }

    const handleBadgesChange = (newBadgeIds: number[]) => {
        setFormData((prev) => ({ ...prev, selectedBadgeIds: newBadgeIds }))
    }

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.id) {
            toast.error("User not authenticated.", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            })
            return
        }

        setIsSavingProfile(true)
        try {
            const updatePayload = {
                username: formData.username,
                email: formData.email,
                settings: {
                    ...currentUser.settings,
                    bio: formData.bio,
                    location: formData.location,
                    website: formData.website,
                    socialLinks: formData.socialLinks,
                    skills: formData.skills,
                    notifications: notificationSettings,
                },
                badgeIds: formData.selectedBadgeIds,
                charactor: currentUser.charactor?.id,
            }

            const response = await fetch(`${strapiURL}/api/users/${user.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user?.jwt || access_token}`,
                },
                body: JSON.stringify(updatePayload),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || "Failed to update profile.")
            }

            await refreshUser()
            toast.success("Profile updated successfully!", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            })
        } catch (error: any) {
            console.error("Error updating profile:", error)
            toast.error(error.message || "Failed to update profile.", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            })
        } finally {
            setIsSavingProfile(false)
        }
    }

    const handleSaveNotifications = async () => {
        if (!user?.id) {
            toast.error("User not authenticated.", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            })
            return
        }

        setIsSavingNotifications(true)
        try {
            const updatePayload = {
                username: currentUser.username,
                email: currentUser.email,
                settings: {
                    ...currentUser.settings,
                    notifications: notificationSettings,
                    bio: formData.bio,
                    location: formData.location,
                    website: formData.website,
                    socialLinks: formData.socialLinks,
                    skills: formData.skills,
                },
                badgeIds: currentUser.badgeIds,
                charactor: currentUser.charactor?.id,
            }

            const response = await fetch(`${strapiURL}/api/users/${user.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user?.jwt || access_token}`,
                },
                body: JSON.stringify(updatePayload),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || "Failed to update notification settings.")
            }

            await refreshUser()
            toast.success("Notification settings updated successfully!", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            })
        } catch (error: any) {
            console.error("Error updating notification settings:", error)
            toast.error(error.message || "Failed to update notification settings.", {
                position: "top-center",
                action: { label: "Close", onClick: () => {} },
                closeButton: false,
            })
        } finally {
            setIsSavingNotifications(false)
        }
    }

    const handleSectionChange = (section: "profile" | "notifications" | "limits") => {
        if (section !== activeSection) {
            setActiveSection(section)
            if (typeof window !== "undefined") {
                const url = new URL(window.location.href)
                url.searchParams.set("tab", "settings")
                url.searchParams.set("section", section)
                window.history.replaceState(null, "", url.toString())
            }
        }
    }

    // Default stats if not provided
    const defaultStats: DashboardStats = {
        coursesCreated: 0,
        totalEnrollments: 0,
        totalRevenue: 0,
        completionRate: 0,
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-8">
                    {/* Main Profile Header Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative"
                    >
                        <ProfileHeaderDisplay
                            avatar={avatarPreview}
                            name={currentUser.name || currentUser.username || currentUser.email}
                            email={currentUser.email}
                            role={currentUser.charactor?.attributes.slug || "student"}
                            followers={currentUser.followers || 0}
                            following={currentUser.following || 0}
                            onAvatarChange={handleAvatarChange}
                            isUploadingAvatar={isUploadingAvatar}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Tabs value={activeSection} onValueChange={handleSectionChange} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger
                                    className="dark:data-[state=active]:bg-gradient-to-r dark:data-[state=active]:from-cyan-600 dark:data-[state=active]:to-emerald-500"
                                    value="profile"
                                >
                                    <FaRegUser className="w-4 h-4 mr-2" /> Profile
                                </TabsTrigger>
                                <TabsTrigger
                                    className="dark:data-[state=active]:bg-gradient-to-r dark:data-[state=active]:from-cyan-600 dark:data-[state=active]:to-emerald-500"
                                    value="notifications"
                                >
                                    <FaCog className="w-4 h-4 mr-2" /> Notifications
                                </TabsTrigger>
                                <TabsTrigger
                                    className="dark:data-[state=active]:bg-gradient-to-r dark:data-[state=active]:from-cyan-600 dark:data-[state=active]:to-emerald-500"
                                    value="limits"
                                >
                                    <FaCrown className="w-4 h-4 mr-2" /> Limits
                                </TabsTrigger>
                            </TabsList>

                            {/* Profile Tab Content */}
                            <TabsContent value="profile" className="space-y-6 mt-6">
                                {stats && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                                    >
                                        <Card className="glass-enhanced hover:scale-105 transition-all duration-300 border-cyan-500/20">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg">
                                                        <BookOpen className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-bold">{stats.coursesCreated}</p>
                                                        <p className="text-sm text-muted-foreground">Courses Created</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="glass-enhanced hover:scale-105 transition-all duration-300 border-blue-500/20">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                                                        <Users className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-bold">{stats.totalEnrollments}</p>
                                                        <p className="text-sm text-muted-foreground">Total Enrollments</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="glass-enhanced hover:scale-105 transition-all duration-300 border-yellow-500/20">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                                                        <DollarSign className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-bold">${stats.totalRevenue}</p>
                                                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="glass-enhanced hover:scale-105 transition-all duration-300 border-purple-500/20">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                                                        <TrendingUp className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-bold">{stats.completionRate}%</p>
                                                        <p className="text-sm text-muted-foreground">Completion Rate</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}

                                <Card className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                                    <CardHeader>
                                        <CardTitle>Edit Profile</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleSaveProfile} className="space-y-6">
                                            <BasicInfoFields
                                                name={formData.username}
                                                email={formData.email}
                                                onInputChange={handleProfileInputChange}
                                            />
                                            <RoleSelectionField
                                                charactor={formData.charactor}
                                                onCharactorChange={(value) => handleProfileInputChange("charactor", value)}
                                            />
                                            <BioField bio={formData.bio} onBioChange={(value) => handleProfileInputChange("bio", value)} />
                                            <LocationWebsiteFields
                                                location={formData.location}
                                                website={formData.website}
                                                onInputChange={handleProfileInputChange}
                                            />
                                            <SocialLinksFields
                                                socialLinks={formData.socialLinks}
                                                onInputChange={handleProfileInputChange}
                                            />
                                            <div className="space-y-6 mt-8">
                                                <SkillsManagement selectedSkills={formData.skills} onSkillsChange={handleSkillsChange} />
                                                <BadgesManagement
                                                    selectedBadgeIds={formData.selectedBadgeIds}
                                                    onBadgesChange={handleBadgesChange}
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={isSavingProfile || isUploadingAvatar}
                                                className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 mt-8"
                                            >
                                                {isSavingProfile ? (
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
                            </TabsContent>

                            {/* Notifications Tab Content */}
                            <TabsContent value="notifications" className="space-y-6 mt-6">
                                <Card className="glass-enhanced hover:scale-[1.02] hover:shadow-xl transition-all duration-300 border-cyan-500/20">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg">
                                                <Bell className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">Notification Preferences</CardTitle>
                                                <p className="text-sm text-muted-foreground">Manage your notification settings</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {[
                                            {
                                                key: "newEnrollments",
                                                label: "New Enrollments",
                                                description: "Get notified when someone enrolls in your courses",
                                                icon: Users,
                                                color: "text-blue-500",
                                            },
                                            {
                                                key: "courseReviews",
                                                label: "Course Reviews",
                                                description: "Get notified when you receive new reviews",
                                                icon: Star,
                                                color: "text-yellow-500",
                                            },
                                            {
                                                key: "paymentNotifications",
                                                label: "Payment Notifications",
                                                description: "Get notified about payments and earnings",
                                                icon: DollarSign,
                                                color: "text-green-500",
                                            },
                                            {
                                                key: "weeklyAnalytics",
                                                label: "Weekly Analytics",
                                                description: "Receive weekly analytics reports",
                                                icon: TrendingUp,
                                                color: "text-purple-500",
                                            },
                                        ].map((setting, index) => (
                                            <motion.div
                                                key={setting.key}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 * index }}
                                                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg bg-muted ${setting.color}`}>
                                                        <setting.icon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{setting.label}</div>
                                                        <div className="text-sm text-muted-foreground">{setting.description}</div>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={notificationSettings[setting.key as keyof typeof notificationSettings]}
                                                    onCheckedChange={(checked) =>
                                                        handleNotificationChange(setting.key as keyof typeof notificationSettings, checked)
                                                    }
                                                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500 data-[state=checked]:to-emerald-500"
                                                />
                                            </motion.div>
                                        ))}
                                        <div className="flex justify-end">
                                            <Button
                                                onClick={handleSaveNotifications}
                                                disabled={isSavingNotifications}
                                                className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                                            >
                                                {isSavingNotifications ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Saving...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4 mr-2" />
                                                        Save Notification Settings
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Limits Tab Content */}
                            <TabsContent value="limits" className="space-y-6 mt-6">
                                <Card className="glass-enhanced hover:scale-[1.02] hover:shadow-xl transition-all duration-300 border-purple-500/20">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                                                <Crown className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">Course Creation Limits</CardTitle>
                                                <p className="text-sm text-muted-foreground">Manage your course creation plan</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                                        <Crown className="w-3 h-3 mr-1" /> Basic Plan
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">Current Plan</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold">{stats?.coursesCreated ?? defaultStats.coursesCreated}/50</p>
                                                    <p className="text-sm text-muted-foreground">Courses Created</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span>Course Creation Progress</span>
                                                    <span>{Math.round(((stats?.coursesCreated ?? defaultStats.coursesCreated) / 50) * 100)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-3">
                                                    <div
                                                        className="h-3 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-300"
                                                        style={{ width: `${((stats?.coursesCreated ?? defaultStats.coursesCreated) / 50) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-4 space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <span>Up to 50 courses</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <span>Basic analytics</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                                                    <span>Limited customization</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                                                <Crown className="w-4 h-4 mr-2" />
                                                Upgrade to Pro
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}