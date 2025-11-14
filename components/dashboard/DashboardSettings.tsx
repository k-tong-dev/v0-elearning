"use client"

import React, { useState, useEffect, useMemo } from "react"
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
    X,
    UserPlus,
    Users2,
    Layers,
    UsersRound,
    Gauge,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BasicInfoFields } from "@/components/dashboard/profile-settings/BasicInfoFields"
import { BioField } from "@/components/dashboard/profile-settings/BioField"
import { LocationWebsiteFields } from "@/components/dashboard/profile-settings/LocationWebsiteFields"
import { SocialLinksFields } from "@/components/dashboard/profile-settings/SocialLinksFields"
import { SkillsManagement } from "@/components/dashboard/profile-settings/SkillsManagement"
import { BadgesManagement } from "@/components/dashboard/profile-settings/BadgesManagement"
import { LearningGoalsManagement } from "@/components/dashboard/profile-settings/LearningGoalsManagement"
import { InterestedsManagement } from "@/components/dashboard/profile-settings/InterestedsManagement"
import { PreferToLearnsManagement } from "@/components/dashboard/profile-settings/PreferToLearnsManagement"
import { ProfileHeaderDisplay } from "@/components/dashboard/profile-settings/ProfileHeaderDisplay"
import { ConnectedDevices } from "@/components/dashboard/profile-settings/ConnectedDevices"
import { AccountDeletion } from "@/components/dashboard/profile-settings/AccountDeletion"
import { FaRegUser, FaCog, FaCrown, FaDesktop, FaTrash } from "react-icons/fa"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { User, UserRoleSlug, StrapiMedia } from "@/types/user"
import { getAccessToken } from "@/lib/cookies"
import { RoleSelectionCombobox } from "@/components/dashboard/profile-settings/RoleSelectionCombobox"
import { getCharacters, Character } from "@/integrations/strapi/character"
import { Skill } from "@/integrations/strapi/skill"
import { uploadStrapiFile, deleteStrapiFile } from "@/integrations/strapi/utils"
import { getAllUserSubscriptions, UserSubscription, Subscription } from "@/integrations/strapi/subscription"
import { getInstructors } from "@/integrations/strapi/instructor"
import { getUserInstructorGroups } from "@/integrations/strapi/instructor-group"

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

type SettingsSection = "profile" | "settings" | "limits" | "devices" | "account"

const SECTION_ALIASES: Record<string, SettingsSection> = {
    notifications: "settings",
}

const VALID_SECTIONS: SettingsSection[] = ["profile", "settings", "limits", "devices", "account"]

export function DashboardSettings({ currentUser, stats }: DashboardSettingsProps) {
    const { user, refreshUser } = useAuth()
    const access_token = getAccessToken()
    const strapiURL = process.env.NEXT_PUBLIC_STRAPI_URL
    const [characters, setCharacters] = useState<Character[]>([])
    const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
    const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([])
    const [loadingSubscriptions, setLoadingSubscriptions] = useState(false)
    const [instructorsCount, setInstructorsCount] = useState(0)
    const [instructorGroupsCount, setInstructorGroupsCount] = useState(0)

    // Helper to get avatar URL
    const getAvatarUrl = (avatar: StrapiMedia | string | null | undefined): string | null => {
        if (!avatar) return null;
        if (typeof avatar === 'string') return avatar;
        if (avatar.url) return `${strapiURL}${avatar.url}`;
        return null;
    };

    // Initialize notification settings with fallback defaults
    const [notificationSettings, setNotificationSettings] = useState({
        newEnrollments: currentUser.notice_new_enrollment ?? true,
        courseReviews: currentUser.notice_course_reviewer ?? true,
        paymentNotifications: currentUser.notice_payment ?? true,
        weeklyAnalytics: currentUser.notice_weekly_analysis ?? true,
    })

    const [isSavingNotifications, setIsSavingNotifications] = useState(false)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(getAvatarUrl(currentUser.avatar));

    // Initialize form data with User fields
    const [formData, setFormData] = useState({
        username: currentUser.username || "",
        email: currentUser.email,
        bio: currentUser.bio || "",
        location: currentUser.location || "",
        website: currentUser.website || "",
        charactorId: currentUser.character?.id?.toString() || "",
        charactorCode: currentUser.character?.code || "student" as UserRoleSlug, // Keep code for display
        socialLinks: {
            twitter: currentUser.twister || "", // Map to Strapi's flat fields
            github: currentUser.github || "",
            linkedin: currentUser.linkin || "",
            facebook: currentUser.facebook || "", // Added facebook
            instagram: currentUser.instagram || "", // Added instagram
        },
        avatar: currentUser.avatar || null,
        skills: currentUser.skills?.map(s => s.documentId || s.name) || [], // Map skills to array of documentIds
        selectedBadgeIds: currentUser.badges?.map(b => b.id.toString()) || [], // Map badges to array of IDs
        selectedLearningGoalIds: currentUser.learning_goals?.map(g => g.id.toString()) || [],
        selectedInterestedIds: currentUser.interested?.map(i => i.id.toString()) || [],
        selectedPreferToLearnIds: currentUser.prefer_to_learns?.map(p => p.id.toString()) || [],
    })

    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [activeSection, setActiveSection] = useState<SettingsSection>("profile")

    // Fetch characters on mount
    useEffect(() => {
        const fetchChars = async () => {
            try {
                const chars = await getCharacters()
                setCharacters(chars)
            } catch (err) {
                console.error("Failed to fetch characters:", err)
            }
        }
        fetchChars()
    }, [])

    // Fetch user subscriptions and counts
    useEffect(() => {
        const fetchUserSubscriptions = async () => {
            if (!user?.id) {
                setUserSubscriptions([])
                setInstructorsCount(0)
                setInstructorGroupsCount(0)
                return
            }
            setLoadingSubscriptions(true)
            try {
                const [subscriptions, instructors, groups] = await Promise.all([
                    getAllUserSubscriptions(user.id),
                    getInstructors(user.id),
                    getUserInstructorGroups(user.id)
                ])
                setUserSubscriptions(subscriptions)
                setInstructorsCount(instructors.length)
                setInstructorGroupsCount(groups.length)
            } catch (err) {
                console.error("Failed to fetch user subscriptions:", err)
                toast.error("Failed to load subscriptions")
            } finally {
                setLoadingSubscriptions(false)
            }
        }
        fetchUserSubscriptions()
    }, [user?.id])

    // Sync with URL search params
    useEffect(() => {
        if (typeof window === "undefined") return
        const params = new URLSearchParams(window.location.search)
        const section = params.get("section")
        if (section) {
            const normalized =
                SECTION_ALIASES[section] ??
                (VALID_SECTIONS.includes(section as SettingsSection) ? (section as SettingsSection) : null)
            if (normalized && normalized !== activeSection) {
                setActiveSection(normalized)
            }
        }
    }, [activeSection])

    // Sync form data and avatar preview with currentUser
    useEffect(() => {
        setFormData({
            username: currentUser.username || "",
            email: currentUser.email,
            bio: currentUser.bio || "",
            location: currentUser.location || "",
            website: currentUser.website || "",
            charactorId: currentUser.character?.id?.toString() || "",
            charactorCode: currentUser.character?.code || "student" as UserRoleSlug,
            socialLinks: {
                twitter: currentUser.twister || "",
                github: currentUser.github || "",
                linkedin: currentUser.linkin || "",
                facebook: currentUser.facebook || "",
                instagram: currentUser.instagram || "",
            },
            avatar: currentUser.avatar || null,
            skills: currentUser.skills?.map(s => s.documentId || s.name) || [],
            selectedBadgeIds: currentUser.badges?.map(b => b.id.toString()) || [],
            selectedLearningGoalIds: currentUser.learning_goals?.map(g => g.id.toString()) || [],
            selectedInterestedIds: currentUser.interested?.map(i => i.id.toString()) || [],
            selectedPreferToLearnIds: currentUser.prefer_to_learns?.map(p => p.id.toString()) || [],
        })
        setAvatarPreview(getAvatarUrl(currentUser.avatar));
    }, [currentUser, strapiURL])

    const limitEntries = useMemo(() => {
        const record = currentUser as any
        const parseLimit = (value: unknown): number | null => {
            if (value === null || value === undefined) return null
            if (typeof value === "number" && Number.isFinite(value)) return value > 0 ? value : null
            if (typeof value === "string") {
                const num = Number(value)
                if (!Number.isNaN(num) && Number.isFinite(num) && num > 0) return num
            }
            return null
        }

        const friendUsage =
            typeof record?.friend_count === "number"
                ? record.friend_count
                : Array.isArray(record?.friends)
                ? record.friends.length
                : null
        const instructorUsage = instructorsCount
        const instructorGroupUsage = instructorGroupsCount
        const userGroupUsage = Array.isArray(record?.user_groups) ? record.user_groups.length : null

        return [
            {
                key: "friend_limit",
                label: "Friend limit",
                helper: "Maximum number of friends you can have.",
                value: parseLimit(record?.friend_limit),
                usage: friendUsage,
                icon: UserPlus,
            },
            {
                key: "user_group_limit",
                label: "User group limit",
                helper: "How many user groups you can create or join.",
                value: parseLimit(record?.user_group_limit),
                usage: userGroupUsage,
                icon: Users,
            },
            {
                key: "user_group_member_limit",
                label: "Members per user group",
                helper: "Maximum members allowed in a single user group you own.",
                value: parseLimit(record?.user_group_member_limit),
                usage: null,
                icon: UsersRound,
            },
            {
                key: "instructor_limit",
                label: "Instructor limit",
                helper: "Number of instructors you can manage.",
                value: parseLimit(record?.instructor_limit),
                usage: instructorUsage,
                icon: Users2,
            },
            {
                key: "instructor_group_limit",
                label: "Instructor group limit",
                helper: "How many instructor groups you can create or join.",
                value: parseLimit(record?.instructor_group_limit),
                usage: instructorGroupUsage,
                icon: Layers,
            },
            {
                key: "instructor_group_member_limit",
                label: "Members per instructor group",
                helper: "Maximum members allowed in each instructor group you own.",
                value: parseLimit(record?.instructor_group_member_limit),
                usage: null,
                icon: Crown,
            },
        ]
    }, [currentUser, instructorsCount, instructorGroupsCount])

    // Sync notification settings
    useEffect(() => {
        setNotificationSettings({
            newEnrollments: currentUser.notice_new_enrollment ?? true,
            courseReviews: currentUser.notice_course_reviewer ?? true,
            paymentNotifications: currentUser.notice_payment ?? true,
            weeklyAnalytics: currentUser.notice_weekly_analysis ?? true,
        })
    }, [currentUser])

    const handleNotificationChange = (key: keyof typeof notificationSettings, checked: boolean) => {
        setNotificationSettings((prev) => ({ ...prev, [key]: checked }))
    }

    const handleAvatarChange = async (file: File | string) => {
        setIsUploadingAvatar(true)

        try {
            if (!user?.id) {
                throw new Error("User not authenticated.")
            }

            // Get the old avatar ID before updating (for cleanup)
            // Only delete if it's a Strapi media object (not a template URL string)
            let oldAvatarId: number | string | null = null;
            if (currentUser.avatar && typeof currentUser.avatar === 'object') {
                // Check if it has an id (numeric) or documentId (string)
                if (currentUser.avatar.id) {
                    oldAvatarId = currentUser.avatar.id;
                } else if (currentUser.avatar.documentId) {
                    oldAvatarId = currentUser.avatar.documentId;
                }
            }

            let fileToUpload: File;
            
            // If it's a string (template URL), convert it to a File object
            if (typeof file === 'string') {
                try {
                    // Fetch the image from the URL
                    const response = await fetch(file);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch image: ${response.statusText}`);
                    }
                    const blob = await response.blob();
                    // Extract filename from URL or use default
                    const urlParts = file.split('/');
                    const filename = urlParts[urlParts.length - 1] || 'avatar.png';
                    // Determine MIME type from blob or default to image/png
                    const mimeType = blob.type || 'image/png';
                    fileToUpload = new File([blob], filename, { type: mimeType });
                } catch (error: any) {
                    console.error("Error converting template URL to File:", error);
                    throw new Error(`Failed to load template avatar: ${error.message}`);
                }
            } else {
                fileToUpload = file;
            }

            // Validate file object
            if (!fileToUpload || !(fileToUpload instanceof File)) {
                throw new Error("Invalid file provided");
            }

            // Use the uploadStrapiFile utility which handles FormData properly
            const uploadedFile = await uploadStrapiFile(fileToUpload)

            const objectUrl = uploadedFile.url
            const previewUrl = uploadedFile.formats?.thumbnail?.url || uploadedFile.formats?.small?.url || uploadedFile.url
            setAvatarPreview(previewUrl ? `${strapiURL}${previewUrl}` : `${strapiURL}${objectUrl}`)
            setFormData((prev) => ({ ...prev, avatar: uploadedFile })) // Store the full StrapiMedia object

            // Update user with avatar ID
            const updatePayload = {
                avatar: uploadedFile.id, // Send the ID of the uploaded file
            }

            const response = await fetch(`${strapiURL}/api/users/${user.id}?populate=*`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${access_token}`,
                },
                body: JSON.stringify(updatePayload),
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error("[handleAvatarChange] Error response:", errorText)
                throw new Error(errorText || "Failed to update avatar.")
            }

            // Delete old avatar file after successful update (non-blocking)
            if (oldAvatarId && oldAvatarId !== uploadedFile.id) {
                // Delete asynchronously - don't wait for it or let it break the flow
                deleteStrapiFile(oldAvatarId).catch((error) => {
                    console.warn("[handleAvatarChange] Failed to delete old avatar, but continuing:", error);
                });
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
        } else if (field === "charactorCode") {
            // When character code changes, find and update the corresponding ID
            const character = characters.find(c => c.code === value)
            setFormData((prev) => ({ 
                ...prev, 
                charactorCode: value,
                charactorId: character?.id.toString() || ""
            }))
        } else {
            setFormData((prev) => ({ ...prev, [field]: value }))
        }
    }

    const handleSkillsChange = (newSkills: string[]) => {
        setFormData((prev) => ({ ...prev, skills: newSkills }))
    }

    const handleAvailableSkills = (skills: Skill[]) => {
        setAvailableSkills(skills)
    }

    const handleBadgesChange = (newBadgeIds: string[]) => {
        setFormData((prev) => ({ ...prev, selectedBadgeIds: newBadgeIds }))
    }

    const handleLearningGoalsChange = (newGoalIds: string[]) => {
        setFormData((prev) => ({ ...prev, selectedLearningGoalIds: newGoalIds }))
    }

    const handleInterestedsChange = (newInterestedIds: string[]) => {
        setFormData((prev) => ({ ...prev, selectedInterestedIds: newInterestedIds }))
    }

    const handlePreferToLearnsChange = (newPreferToLearnIds: string[]) => {
        setFormData((prev) => ({ ...prev, selectedPreferToLearnIds: newPreferToLearnIds }))
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
            // Construct payload for Strapi, mapping formData fields to Strapi's expected structure
            // Deduplicate arrays to avoid sending duplicates
            const uniqueSkills = [...new Set(formData.skills)]
            const uniqueBadgeIds = [...new Set(formData.selectedBadgeIds)]
            const uniqueLearningGoalIds = [...new Set(formData.selectedLearningGoalIds)]
            const uniqueInterestedIds = [...new Set(formData.selectedInterestedIds)]
            const uniquePreferToLearnIds = [...new Set(formData.selectedPreferToLearnIds)]
            
            const updatePayload: any = {
                username: formData.username,
                email: formData.email,
                bio: formData.bio,
                location: formData.location,
                website: formData.website,
                character: formData.charactorId ? parseInt(formData.charactorId) : null, // Send character ID
                // Map social links back to top-level fields
                twister: formData.socialLinks.twitter,
                github: formData.socialLinks.github,
                linkin: formData.socialLinks.linkedin,
                facebook: formData.socialLinks.facebook,
                instagram: formData.socialLinks.instagram,
                // Map to simple arrays of IDs for Strapi v5
                // For skills, we need to map documentId to numeric id
                skills: uniqueSkills.map(docId => {
                    const skill = availableSkills.find(s => s.documentId === docId)
                    return skill ? skill.id : null
                }).filter(id => id !== null),
                badges: uniqueBadgeIds.map(id => parseInt(id)),
                learning_goals: uniqueLearningGoalIds.map(id => parseInt(id)),
                interested: uniqueInterestedIds.map(id => parseInt(id)),
                prefer_to_learns: uniquePreferToLearnIds.map(id => parseInt(id)),
                // Notification settings are handled separately by handleSaveNotifications
                notice_new_enrollment: notificationSettings.newEnrollments,
                notice_course_reviewer: notificationSettings.courseReviews,
                notice_payment: notificationSettings.paymentNotifications,
                notice_weekly_analysis: notificationSettings.weeklyAnalytics,
            }

            // If avatar was changed, its ID is already updated via handleAvatarChange
            // If not, ensure the existing avatar ID is sent if it's an object
            if (formData.avatar && typeof formData.avatar === 'object' && 'id' in formData.avatar) {
                updatePayload.avatar = formData.avatar.id;
            } else if (typeof formData.avatar === 'string') {
                // If avatar is a string (e.g., a template URL), Strapi might expect a different handling
                // For now, we'll assume it's either an uploaded file ID or null.
                // If it's a template URL, you might need a separate field in Strapi to store it.
            } else {
                updatePayload.avatar = null; // No avatar selected
            }

            console.log("[DashboardSettings] Update payload:", JSON.stringify(updatePayload, null, 2))
            
            const response = await fetch(`${strapiURL}/api/users/${user.id}?populate=*`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${access_token}`,
                },
                body: JSON.stringify(updatePayload),
            })
            
            console.log("[DashboardSettings] Response status:", response.status)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("[DashboardSettings] Error response:", errorText)
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
                notice_new_enrollment: notificationSettings.newEnrollments,
                notice_course_reviewer: notificationSettings.courseReviews,
                notice_payment: notificationSettings.paymentNotifications,
                notice_weekly_analysis: notificationSettings.weeklyAnalytics,
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

    const handleSectionChange = (value: string) => {
        const normalized =
            SECTION_ALIASES[value] ??
            (VALID_SECTIONS.includes(value as SettingsSection) ? (value as SettingsSection) : null)
        if (!normalized || normalized === activeSection) return

        setActiveSection(normalized)
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href)
            url.searchParams.set("tab", "settings")
            if (normalized === "profile") {
                url.searchParams.delete("section")
            } else {
                url.searchParams.set("section", normalized)
            }
            window.history.replaceState(null, "", url.toString())
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
                            name={currentUser.username || currentUser.email}
                            email={currentUser.email}
                            role={currentUser.character?.code || "student"}
                            followers={0}
                            following={0}
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
                            <TabsList className="grid w-full grid-cols-5 gap-1">
                                <TabsTrigger
                                    className="dark:data-[state=active]:bg-gradient-to-r dark:data-[state=active]:from-blue-600 dark:data-[state=active]:to-purple-500 text-xs sm:text-sm"
                                    value="profile"
                                >
                                    <FaRegUser className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Profile</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    className="dark:data-[state=active]:bg-gradient-to-r dark:data-[state=active]:from-blue-600 dark:data-[state=active]:to-purple-500 text-xs sm:text-sm"
                                    value="settings"
                                >
                                    <FaCog className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Settings</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    className="dark:data-[state=active]:bg-gradient-to-r dark:data-[state=active]:from-blue-600 dark:data-[state=active]:to-purple-500 text-xs sm:text-sm"
                                    value="limits"
                                >
                                    <FaCrown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Subscription</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    className="dark:data-[state=active]:bg-gradient-to-r dark:data-[state=active]:from-blue-600 dark:data-[state=active]:to-purple-500 text-xs sm:text-sm"
                                    value="devices"
                                >
                                    <FaDesktop className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Devices</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    className="dark:data-[state=active]:bg-gradient-to-r dark:data-[state=active]:from-blue-600 dark:data-[state=active]:to-purple-500 text-xs sm:text-sm"
                                    value="account"
                                >
                                    <FaTrash className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Account</span>
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
                                        <Card className="liquid-glass-card border-blue-500/20">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                                                        <BookOpen className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-bold">{stats.coursesCreated}</p>
                                                        <p className="text-sm text-muted-foreground">Courses Created</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="liquid-glass-card border-blue-500/20">
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
                                        <Card className="liquid-glass-card border-yellow-500/20">
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
                                        <Card className="liquid-glass-card border-purple-500/20">
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

                                <Card className="liquid-glass-card">
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
                                            <RoleSelectionCombobox // Using the new HeroUI-based component
                                                charactor={formData.charactorCode}
                                                onCharactorChange={(value) => handleProfileInputChange("charactorCode", value)}
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
                                                <LearningGoalsManagement
                                                    selectedLearningGoalIds={formData.selectedLearningGoalIds}
                                                    onLearningGoalsChange={handleLearningGoalsChange}
                                                />
                                                <InterestedsManagement
                                                    selectedInterestedIds={formData.selectedInterestedIds}
                                                    onInterestedsChange={handleInterestedsChange}
                                                />
                                                <PreferToLearnsManagement
                                                    selectedPreferToLearnIds={formData.selectedPreferToLearnIds}
                                                    onPreferToLearnsChange={handlePreferToLearnsChange}
                                                />
                                                <SkillsManagement 
                                                    selectedSkills={formData.skills} 
                                                    onSkillsChange={handleSkillsChange}
                                                    onAvailableSkills={handleAvailableSkills}
                                                />
                                                <BadgesManagement
                                                    selectedBadgeIds={formData.selectedBadgeIds}
                                                    onBadgesChange={handleBadgesChange}
                                                />
                                            </div>
                                            <div className="flex justify-end mt-8">
                                                <Button
                                                    type="submit"
                                                    disabled={isSavingProfile || isUploadingAvatar}
                                                    className="px-8 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
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
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>

                                <Card className="liquid-glass-card border-muted/40">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gradient-to-r from-sky-500 to-blue-500 rounded-lg">
                                                <Gauge className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">Usage Limits</CardTitle>
                                                <p className="text-sm text-muted-foreground">
                                                    Review the caps configured for your account.
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {limitEntries.map((entry, index) => {
                                                const Icon = entry.icon
                                                const isUnlimited = entry.value === null
                                                const usage =
                                                    typeof entry.usage === "number" && entry.usage >= 0
                                                        ? entry.usage
                                                        : null
                                                const remaining =
                                                    !isUnlimited && usage !== null
                                                        ? Math.max(entry.value! - usage, 0)
                                                        : null

                                                return (
                                                    <motion.div
                                                        key={entry.key}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.05 * index }}
                                                        className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 backdrop-blur-sm"
                                                    >
                                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="font-semibold text-foreground">{entry.label}</p>
                                                            <p className="text-xs text-muted-foreground">{entry.helper}</p>
                                                            <div className="text-xs text-muted-foreground/80">
                                                                Limit:{" "}
                                                                <span className="font-medium text-foreground">
                                                                    {isUnlimited ? "Unlimited" : entry.value}
                                                                </span>
                                                                {usage !== null && (
                                                                    <>
                                                                        <span className="mx-2 text-muted-foreground/40">•</span>
                                                                        <span>
                                                                            Used{" "}
                                                                            <span className="font-medium text-foreground">
                                                                                {usage}
                                                                            </span>
                                                                            {remaining !== null && (
                                                                                <>
                                                                                    {" "}
                                                                                    — Remaining{" "}
                                                                                    <span className="font-medium text-foreground">
                                                                                        {remaining}
                                                                                    </span>
                                                                                </>
                                                                            )}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Settings Tab Content */}
                            <TabsContent value="settings" className="space-y-6 mt-6">
                                <Card className="liquid-glass-card border-blue-500/20">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
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
                                                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500"
                                                />
                                            </motion.div>
                                        ))}
                                        <div className="flex justify-end">
                                            <Button
                                                onClick={handleSaveNotifications}
                                                disabled={isSavingNotifications}
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
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

                            {/* Subscription Tab Content */}
                            <TabsContent value="limits" className="space-y-6 mt-6">
                                <Card className="liquid-glass-card border-purple-500/20">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                                                <Crown className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">My Subscriptions</CardTitle>
                                                <p className="text-sm text-muted-foreground">View all your subscription plans</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {loadingSubscriptions ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                            </div>
                                        ) : userSubscriptions.length === 0 ? (
                                            <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20 text-center">
                                                <Crown className="w-12 h-12 mx-auto mb-4 text-purple-500 opacity-50" />
                                                <p className="text-muted-foreground mb-4">No active subscriptions</p>
                                                <Button 
                                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                                    onClick={() => window.location.href = '/pricing'}
                                                >
                                                    Browse Plans
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {userSubscriptions.map((userSub) => {
                                                    const subscriptionPlan = typeof userSub.subscription === 'object' 
                                                        ? userSub.subscription as Subscription
                                                        : null
                                                    
                                                    const isActive = userSub.state === 'active'
                                                    const isCancelled = userSub.state === 'cancelled'
                                                    
                                                    return (
                                                        <motion.div
                                                            key={userSub.id}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20"
                                                        >
                                                            <div className="flex items-start justify-between mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-2 rounded-lg ${
                                                                        isActive 
                                                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                                                            : isCancelled 
                                                                            ? 'bg-gray-500' 
                                                                            : 'bg-yellow-500'
                                                                    }`}>
                                                                        <Crown className="w-5 h-5 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h3 className="text-lg font-semibold">
                                                                                {subscriptionPlan?.name || 'Unknown Plan'}
                                                                            </h3>
                                                                            <Badge className={
                                                                                isActive
                                                                                    ? 'bg-green-500'
                                                                                    : isCancelled
                                                                                    ? 'bg-gray-500'
                                                                                    : 'bg-yellow-500'
                                                                            }>
                                                                                {userSub.state.charAt(0).toUpperCase() + userSub.state.slice(1)}
                                                                            </Badge>
                                                                        </div>
                                                                        {subscriptionPlan && (
                                                                            <p className="text-sm text-muted-foreground">
                                                                                ${subscriptionPlan.price.toFixed(2)} / Unlimited
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground mb-1">Current Instructors</p>
                                                                    <p className="text-lg font-semibold">
                                                                        {instructorsCount}
                                                                        {subscriptionPlan?.amount_instructor && subscriptionPlan.amount_instructor > 0 && (
                                                                            <span className="text-sm text-muted-foreground ml-1">
                                                                                / {subscriptionPlan.amount_instructor}
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                {subscriptionPlan?.amount_instructor && subscriptionPlan.amount_instructor > 0 && userSub.next_billing_date && (
                                                                    <div>
                                                                        <p className="text-xs text-muted-foreground mb-1">Next Billing Date</p>
                                                                        <p className="text-lg font-semibold">
                                                                            {new Date(userSub.next_billing_date).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {userSub.createdAt && (
                                                                    <div>
                                                                        <p className="text-xs text-muted-foreground mb-1">Subscription Start Date</p>
                                                                        <p className="text-lg font-semibold">
                                                                            {new Date(userSub.createdAt).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground mb-1">Auto Renew</p>
                                                                    <div className="flex items-center gap-2">
                                                                        {userSub.auto_renew ? (
                                                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                                                        ) : (
                                                                            <X className="w-5 h-5 text-gray-500" />
                                                                        )}
                                                                        <span className="text-lg font-semibold">
                                                                            {userSub.auto_renew ? 'Enabled' : 'Disabled'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {subscriptionPlan?.subscription_benefits && subscriptionPlan.subscription_benefits.length > 0 && (
                                                                <div className="mt-4 pt-4 border-t border-purple-500/20">
                                                                    <p className="text-xs text-muted-foreground mb-2">Benefits</p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {subscriptionPlan.subscription_benefits
                                                                            .filter((benefit: any) => !benefit.locked)
                                                                            .map((benefit: any, idx: number) => (
                                                                                <Badge key={idx} variant="outline" className="text-xs">
                                                                                    <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                                                                                    {benefit.name}
                                                                                </Badge>
                                                                            ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-end pt-4 border-t">
                                            <Button 
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                                onClick={() => window.location.href = '/pricing'}
                                            >
                                                <Crown className="w-4 h-4 mr-2" />
                                                Browse All Plans
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Devices Tab Content */}
                            <TabsContent value="devices" className="space-y-6 mt-6">
                                <ConnectedDevices />
                            </TabsContent>

                            {/* Account Tab Content */}
                            <TabsContent value="account" className="space-y-6 mt-6">
                                <AccountDeletion 
                                    userEmail={currentUser.email}
                                    userId={currentUser.id}
                                />
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}