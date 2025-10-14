"use client"

import React, {useState, useEffect} from "react"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Switch} from "@/components/ui/switch"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
// import { Progress } from "@/components/ui/progress"
import {
    Crown,
    Settings,
    Loader2,
    Save,
    Bell,
    Shield,
    Zap,
    Star,
    TrendingUp,
    Users,
    BookOpen,
    DollarSign,
    Sparkles,
    CheckCircle,
    AlertCircle,
    MoreVertical
} from "lucide-react"
import { IoSettingsSharp } from "react-icons/io5";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// Merged: inline profile settings form (removed separate ProfileSettingsForm import)
import {BasicInfoFields} from "@/components/dashboard/profile-settings/BasicInfoFields"
import {RoleSelectionField} from "@/components/dashboard/profile-settings/RoleSelectionField"
import {BioField} from "@/components/dashboard/profile-settings/BioField"
import {LocationWebsiteFields} from "@/components/dashboard/profile-settings/LocationWebsiteFields"
import {SocialLinksFields} from "@/components/dashboard/profile-settings/SocialLinksFields"
import {SkillsManagement} from "@/components/dashboard/profile-settings/SkillsManagement"
import {BadgesManagement} from "@/components/dashboard/profile-settings/BadgesManagement"
import {FollowStatsDisplay} from "@/components/dashboard/profile-settings/FollowStatsDisplay"
import {RippleAvatar} from "@/components/ui/ripple-avatar"
import {motion} from "framer-motion"
import {UserRole, UserSettings} from "@/types/auth"
import {useAuth} from "@/hooks/use-auth"
import {toast} from "sonner"

interface DashboardStats {
    coursesCreated: number
    totalEnrollments: number
    totalRevenue: number
    completionRate: number
}

interface CurrentUser {
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
    settings?: UserSettings
    skills?: string[]
    badgeIds?: string[]
    followers?: number
    following?: number
}

interface DashboardSettingsProps {
    currentUser: CurrentUser
    stats: DashboardStats
}

export function DashboardSettings({currentUser, stats}: DashboardSettingsProps) {
    const {user, refreshUser} = useAuth()

    const initialSettings = currentUser.settings || {}
    const initialNotifications = initialSettings.notifications || {}

    const [notificationSettings, setNotificationSettings] = useState({
        newEnrollments: initialNotifications.newEnrollments ?? true,
        courseReviews: initialNotifications.courseReviews ?? true,
        paymentNotifications: initialNotifications.paymentNotifications ?? true,
        weeklyAnalytics: initialNotifications.weeklyAnalytics ?? true,
    })
    const [isSavingNotifications, setIsSavingNotifications] = useState(false)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [avatarPreview, setAvatarPreview] = useState<string | undefined>(currentUser.avatar)

    // Inline profile form state (merged from ProfileSettingsForm)
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
    const [isSavingProfile, setIsSavingProfile] = useState(false)

    useEffect(() => {
        setNotificationSettings({
            newEnrollments: currentUser.settings?.notifications?.newEnrollments ?? true,
            courseReviews: currentUser.settings?.notifications?.courseReviews ?? true,
            paymentNotifications: currentUser.settings?.notifications?.paymentNotifications ?? true,
            weeklyAnalytics: currentUser.settings?.notifications?.weeklyAnalytics ?? true,
        })
    }, [currentUser.settings])

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
        setAvatarPreview(currentUser.avatar)
    }, [currentUser])

    const handleNotificationChange = (key: keyof typeof notificationSettings, checked: boolean) => {
        setNotificationSettings(prev => ({...prev, [key]: checked}))
    }

    const handleAvatarChange = async (file: File) => {
        setIsUploadingAvatar(true)
        try {
            // Preview immediately
            const objectUrl = URL.createObjectURL(file)
            setAvatarPreview(objectUrl)
            setFormData(prev => ({...prev, avatar: objectUrl}))

            if (!user?.id) {
                toast.error("User not authenticated.")
                return
            }

            // Persist avatar URL (replace with real upload integration later)
            const updatePayload = {
                name: formData.name,
                email: formData.email,
                bio: formData.bio,
                location: formData.location,
                website: formData.website,
                socialLinks: formData.socialLinks,
                role: formData.role,
                avatar: objectUrl,
                settings: {
                    ...currentUser.settings,
                    notifications: notificationSettings,
                    skills: formData.skills,
                },
                badgeIds: formData.selectedBadgeIds,
            }

            const response = await fetch(`/api/users/${user.id}/profile`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(updatePayload),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || "Failed to update avatar.")
            }

            await refreshUser()
            toast.success("Avatar updated successfully!")
        } catch (error: any) {
            console.error("Avatar update error:", error)
            toast.error(error.message || "Failed to update avatar")
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
            setFormData((prev) => ({...prev, [field]: value}))
        }
    }

    const handleSkillsChange = (newSkills: string[]) => {
        setFormData(prev => ({...prev, skills: newSkills}))
    }

    const handleBadgesChange = (newBadgeIds: string[]) => {
        setFormData(prev => ({...prev, selectedBadgeIds: newBadgeIds}))
    }

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.id) {
            toast.error("User not authenticated.")
            return
        }

        setIsSavingProfile(true)
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
                    ...currentUser.settings,
                    skills: formData.skills,
                },
                badgeIds: formData.selectedBadgeIds,
            }

            const response = await fetch(`/api/users/${user.id}/profile`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(updatePayload),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || "Failed to update profile.")
            }

            await refreshUser()
            toast.success("Profile updated successfully!")
        } catch (error: any) {
            console.error("Error updating profile:", error)
            toast.error(error.message || "Failed to update profile.")
        } finally {
            setIsSavingProfile(false)
        }
    }

    const handleSaveNotifications = async () => {
        if (!user?.id) {
            toast.error("User not authenticated.")
            return
        }

        setIsSavingNotifications(true)
        try {
            const updatePayload = {
                name: currentUser.name,
                email: currentUser.email,
                bio: currentUser.bio,
                location: currentUser.location,
                website: currentUser.website,
                socialLinks: currentUser.socialLinks,
                role: currentUser.role,
                avatar: currentUser.avatar,
                settings: {
                    ...currentUser.settings,
                    notifications: notificationSettings,
                },
                badgeIds: currentUser.badgeIds,
            }

            const response = await fetch(`/api/users/${user.id}/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatePayload),
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error("API Error Response (raw text):", errorText)
                throw new Error(errorText || "Failed to update notification settings.")
            }

            const data = await response.json()
            toast.success("Notification settings updated successfully!")
            await refreshUser()
        } catch (error: any) {
            console.error("Error updating notification settings:", error)
            toast.error(error.message || "Failed to update notification settings.")
        } finally {
            setIsSavingNotifications(false)
        }
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'instructor':
                return <Crown className="w-4 h-4"/>
            case 'admin':
                return <Shield className="w-4 h-4"/>
            case 'expert':
                return <Star className="w-4 h-4"/>
            case 'mentor':
                return <Zap className="w-4 h-4"/>
            default:
                return <Users className="w-4 h-4"/>
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'instructor':
                return 'from-blue-500 to-purple-500'
            case 'admin':
                return 'from-red-500 to-pink-500'
            case 'expert':
                return 'from-yellow-500 to-orange-500'
            case 'mentor':
                return 'from-green-500 to-emerald-500'
            default:
                return 'from-gray-500 to-slate-500'
        }
    }

    const [activeSection, setActiveSection] = useState<"profile" | "skills" | "notifications" | "limits">("profile")

    return (
        <div className="space-y-8">
            {/* Removed redundant header per request */}
            <div className="grid grid-cols-1 gap-6">
                {/* Main content */}
                <div className="space-y-8">
                    {/* Enhanced Avatar Section */}
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.1}}
                        className="relative"
                    >
                        <Card
                            className="glass-enhanced border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 overflow-hidden">
                            <CardContent className="p-3">
                                {/* In-card toggle menu (single button with dropdown) */}
                                <div className="w-full flex justify-end mb-0">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon" aria-label="Settings menu" className="rounded-full hover:bg-primary/10">
                                                <IoSettingsSharp className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="min-w-48 glass-enhanced">
                                            <DropdownMenuItem className="" onClick={() => setActiveSection("profile")}>
                                                <Settings className="w-4 h-4 mr-2"/> Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="" onClick={() => setActiveSection("skills")}>
                                                <Sparkles className="w-4 h-4 mr-2"/> Skills & Badges
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="" onClick={() => setActiveSection("notifications")}>
                                                <Bell className="w-4 h-4 mr-2"/> Notifications
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="" onClick={() => setActiveSection("limits")}>
                                                <Crown className="w-4 h-4 mr-2"/> Creation Limits
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="flex flex-col lg:flex-row justify-center items-center gap-8">
                                    {/* Avatar Section */}
                                    <div className="flex flex-col justify-center items-center space-y-6">
                                        <motion.div
                                            whileHover={{scale: 1.05}}
                                            whileTap={{scale: 0.95}}
                                            className="relative"
                                        >
                                            <RippleAvatar
                                                src={avatarPreview}
                                                alt={currentUser.name}
                                                fallback={currentUser.name.split(' ').map(n => n[0]).join('')}
                                                size="2xl"
                                                role={currentUser.role as any}
                                                showStatus={true}
                                                isOnline={true}
                                                verified={currentUser.role === 'instructor'}
                                                interactive={true}
                                                onClick={() => {
                                                    // Trigger file input for avatar change
                                                    const input = document.createElement('input')
                                                    input.type = 'file'
                                                    input.accept = 'image/*'
                                                    input.onchange = (e) => {
                                                        const file = (e.target as HTMLInputElement).files?.[0]
                                                        if (file) handleAvatarChange(file)
                                                    }
                                                    input.click()
                                                }}
                                                className="w-20 h-20 md:w-64 md:h-64 border-2 border-color-red rounded-lg"
                                            />
                                        </motion.div>

                                        {/* User Info */}
                                        <div className="ml-4 space-y-2 flex flex-col gap-8">
                                            <div>
                                                <motion.h3
                                                    className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent"
                                                    initial={{opacity: 0, y: 10}}
                                                    animate={{opacity: 1, y: 0}}
                                                    transition={{delay: 0.2}}
                                                >
                                                    {currentUser.name}
                                                </motion.h3>
                                                <motion.div
                                                    className="flex items-center gap-2"
                                                    initial={{opacity: 0, y: 10}}
                                                    animate={{opacity: 1, y: 0}}
                                                    transition={{delay: 0.3}}
                                                >
                                                    <Badge
                                                        className={`bg-gradient-to-r ${getRoleColor(currentUser.role || 'student')} text-white`}>
                                                        {getRoleIcon(currentUser.role || 'student')}
                                                        <span
                                                            className="ml-1 capitalize">{currentUser.role || 'student'}</span>
                                                    </Badge>
                                                    {currentUser.role === 'instructor' && (
                                                        <Badge
                                                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                                            <CheckCircle className="w-3 h-3 mr-1"/>
                                                            Verified
                                                        </Badge>
                                                    )}
                                                </motion.div>
                                                <motion.p
                                                    className="text-sm text-muted-foreground"
                                                    initial={{opacity: 0, y: 10}}
                                                    animate={{opacity: 1, y: 0}}
                                                    transition={{delay: 0.4}}
                                                >
                                                    {currentUser.email}
                                                </motion.p>
                                            </div>
                                            <div>
                                                {/* Quick Stats */}
                                                <motion.div
                                                    className="grid grid-cols-2 gap-4 w-full max-w-xs"
                                                    initial={{opacity: 0, y: 10}}
                                                    animate={{opacity: 1, y: 0}}
                                                    transition={{delay: 0.5}}
                                                >
                                                    <div
                                                        className="text-center p-3 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 rounded-lg">
                                                        <p className="text-2xl font-bold text-cyan-600">{currentUser.followers || 0}</p>
                                                        <p className="text-xs text-muted-foreground">Followers</p>
                                                    </div>
                                                    <div
                                                        className="text-center p-3 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-lg">
                                                        <p className="text-2xl font-bold text-emerald-600">{currentUser.following || 0}</p>
                                                        <p className="text-xs text-muted-foreground">Following</p>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Profile Details */}
                                    
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* User Stats Cards */}
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.2}}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                    >
                        <Card className="glass-enhanced hover:scale-105 transition-all duration-300 border-cyan-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg">
                                        <BookOpen className="w-5 h-5 text-white"/>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.coursesCreated}</p>
                                        <p className="text-sm text-muted-foreground">Courses Created</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card
                            className="glass-enhanced hover:scale-105 transition-all duration-300 border-emerald-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg">
                                        <Users className="w-5 h-5 text-white"/>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.totalEnrollments}</p>
                                        <p className="text-sm text-muted-foreground">Total Enrollments</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card
                            className="glass-enhanced hover:scale-105 transition-all duration-300 border-yellow-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                                        <DollarSign className="w-5 h-5 text-white"/>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">${stats.totalRevenue}</p>
                                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card
                            className="glass-enhanced hover:scale-105 transition-all duration-300 border-purple-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-white"/>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.completionRate}%</p>
                                        <p className="text-sm text-muted-foreground">Completion Rate</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Sectioned content */}
                    {activeSection === "profile" && (
                        <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}}
                                    className="space-y-6">
                            <Card
                                className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                                <CardHeader>
                                    <CardTitle>Edit Profile</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSaveProfile} className="space-y-6">
                                        <BasicInfoFields name={formData.name} email={formData.email}
                                                         onInputChange={handleProfileInputChange}/>
                                        <RoleSelectionField role={formData.role}
                                                            onRoleChange={(value) => handleProfileInputChange("role", value)}/>
                                        <BioField bio={formData.bio}
                                                  onBioChange={(value) => handleProfileInputChange("bio", value)}/>
                                        <LocationWebsiteFields location={formData.location} website={formData.website}
                                                               onInputChange={handleProfileInputChange}/>
                                        <SocialLinksFields socialLinks={formData.socialLinks}
                                                           onInputChange={handleProfileInputChange}/>
                                        <Button type="submit" disabled={isSavingProfile || isUploadingAvatar}
                                                className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600">
                                            {isSavingProfile ? (
                                                <div className="flex items-center gap-2"><Loader2
                                                    className="w-4 h-4 animate-spin"/>Saving...</div>
                                            ) : (
                                                <><Save className="w-4 h-4 mr-2"/>Save Changes</>
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {activeSection === "skills" && (
                        <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}}
                                    className="space-y-6">
                            <Card
                                className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                                <CardHeader>
                                    <CardTitle>Skills & Badges</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <SkillsManagement selectedSkills={formData.skills}
                                                      onSkillsChange={handleSkillsChange}/>
                                    <BadgesManagement selectedBadgeIds={formData.selectedBadgeIds}
                                                      onBadgesChange={handleBadgesChange}/>
                                    <div className="flex justify-end">
                                        <Button type="button" onClick={(e) => handleSaveProfile(e as any)}
                                                className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600">
                                            <Save className="w-4 h-4 mr-2"/> Save
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {activeSection === "notifications" && (
                        <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}
                                    transition={{delay: 0.2}}>
                            <Card
                                className="glass-enhanced hover:scale-[1.02] hover:shadow-xl transition-all duration-300 border-cyan-500/20">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg">
                                            <Bell className="w-5 h-5 text-white"/>
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">Notification Preferences</CardTitle>
                                            <p className="text-sm text-muted-foreground">Manage your notification
                                                settings</p>
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
                                            color: "text-blue-500"
                                        },
                                        {
                                            key: "courseReviews",
                                            label: "Course Reviews",
                                            description: "Get notified when you receive new reviews",
                                            icon: Star,
                                            color: "text-yellow-500"
                                        },
                                        {
                                            key: "paymentNotifications",
                                            label: "Payment Notifications",
                                            description: "Get notified about payments and earnings",
                                            icon: DollarSign,
                                            color: "text-green-500"
                                        },
                                        {
                                            key: "weeklyAnalytics",
                                            label: "Weekly Analytics",
                                            description: "Receive weekly analytics reports",
                                            icon: TrendingUp,
                                            color: "text-purple-500"
                                        }
                                    ].map((setting, index) => (
                                        <motion.div key={setting.key} initial={{opacity: 0, x: -20}}
                                                    animate={{opacity: 1, x: 0}} transition={{delay: 0.1 * index}}
                                                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg bg-muted ${setting.color}`}>
                                                    <setting.icon className="w-4 h-4"/>
                                                </div>
                                                <div>
                                                    <div className="font-medium">{setting.label}</div>
                                                    <div
                                                        className="text-sm text-muted-foreground">{setting.description}</div>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={notificationSettings[setting.key as keyof typeof notificationSettings]}
                                                onCheckedChange={(checked) => handleNotificationChange(setting.key as keyof typeof notificationSettings, checked)}
                                                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500 data-[state=checked]:to-emerald-500"/>
                                        </motion.div>
                                    ))}
                                    <div className="flex justify-end">
                                        <Button onClick={handleSaveNotifications} disabled={isSavingNotifications}
                                                className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600">
                                            {isSavingNotifications ? (<div className="flex items-center gap-2"><Loader2
                                                className="w-4 h-4 animate-spin"/>Saving...</div>) : (<><Save
                                                className="w-4 h-4 mr-2"/> Save Notification Settings</>)}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {activeSection === "limits" && (
                        <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}
                                    transition={{delay: 0.2}}>
                            <Card
                                className="glass-enhanced hover:scale-[1.02] hover:shadow-xl transition-all duration-300 border-purple-500/20">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                                            <Crown className="w-5 h-5 text-white"/>
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">Course Creation Limits</CardTitle>
                                            <p className="text-sm text-muted-foreground">Manage your course creation
                                                plan</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div
                                        className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"><Crown
                                                    className="w-3 h-3 mr-1"/> Basic Plan</Badge>
                                                <span className="text-sm text-muted-foreground">Current Plan</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold">{stats.coursesCreated}/50</p>
                                                <p className="text-sm text-muted-foreground">Courses Created</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span>Course Creation Progress</span><span>{Math.round((stats.coursesCreated / 50) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                    className="h-3 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-300"
                                                    style={{width: `${(stats.coursesCreated / 50) * 100}%`}}/>
                                            </div>
                                        </div>
                                        <div className="mt-4 space-y-2 text-sm">
                                            <div className="flex items-center gap-2"><CheckCircle
                                                className="w-4 h-4 text-green-500"/><span>Up to 50 courses</span></div>
                                            <div className="flex items-center gap-2"><CheckCircle
                                                className="w-4 h-4 text-green-500"/><span>Basic analytics</span></div>
                                            <div className="flex items-center gap-2"><AlertCircle
                                                className="w-4 h-4 text-yellow-500"/><span>Limited customization</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                                            <Crown className="w-4 h-4 mr-2"/> Upgrade to Pro
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Move Notification and Limits to bottom */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.4}}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
            </motion.div>

            {/* end moved sections */}
        </div>
    )
}
