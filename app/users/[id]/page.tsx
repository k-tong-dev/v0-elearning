"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArrowLeft, MessageCircle, Heart, Users, Star, Share2, Flag, Copy, Twitter, Facebook, Linkedin, Mail, MessageCircle as WhatsApp, AlertCircle, Info } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { UserProfileHeader } from "@/components/user-profile/UserProfileHeader"
import { UserProfileStats } from "@/components/user-profile/UserProfileStats"
import { UserFollowStats } from "@/components/user-profile/UserFollowStats"
import { UserSkills } from "@/components/user-profile/UserSkills"
import { UserBadges } from "@/components/user-profile/UserBadges"
import { UserRecentActivity } from "@/components/user-profile/UserRecentActivity"
import { UserRecentPosts } from "@/components/user-profile/UserRecentPosts"
import { UserAchievements } from "@/components/user-profile/UserAchievements"
import { UserCoursesOverview } from "@/components/user-profile/UserCoursesOverview"
import { BadgeDefinition } from "@/types/db"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// Static badge definitions
const staticBadges: BadgeDefinition[] = [
    { id: "first-post", name: "First Post", description: "Made your first post", icon: "📝", color: "#FFD700" },
    { id: "helper", name: "Helper", description: "Helped a community member", icon: "🤝", color: "#00FF00" },
    { id: "active-member", name: "Active Member", description: "Active for 30 days", icon: "🏅", color: "#FF4500" },
]

// ShareForm Component
interface ShareFormProps {
    title: string
    url: string
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

const ShareForm: React.FC<ShareFormProps> = ({ title, url, isOpen, onOpenChange }) => {
    const handleShare = (platform: string) => {
        if (typeof window === "undefined") {
            toast.error("Sharing is not available in this environment.", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
            return
        }

        const text = `Check out this profile: ${title}`
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
                        toast.success("Link copied to clipboard!", {
                            position: "top-center",
                            action: {
                                label: "Close",
                                onClick: () => {},
                            },
                            closeButton: false,
                        })
                        onOpenChange(false)
                    })
                    .catch(() => {
                        toast.error("Failed to copy link.", {
                            position: "top-center",
                            action: {
                                label: "Close",
                                onClick: () => {},
                            },
                            closeButton: false,
                        })
                    })
                return
        }

        if (shareUrl) {
            window.open(shareUrl, "_blank", "width=600,height=400")
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md sm:max-w-lg p-6 bg-background rounded-xl shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-foreground">Share Profile</DialogTitle>
                </DialogHeader>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                >
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border">
                        <Input value={url} readOnly className="flex-1 text-sm bg-transparent border-none" />
                        <Button
                            variant="outline"
                            onClick={() => handleShare("copy")}
                            className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                        >
                            <Copy className="w-4 h-4" />
                            Copy
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { platform: "twitter", icon: Twitter, label: "Twitter" },
                            { platform: "facebook", icon: Facebook, label: "Facebook" },
                            { platform: "linkedin", icon: Linkedin, label: "LinkedIn" },
                            { platform: "whatsapp", icon: WhatsApp, label: "WhatsApp" },
                            { platform: "email", icon: Mail, label: "Email" },
                        ].map(({ platform, icon: Icon, label }) => (
                            <Button
                                key={platform}
                                variant="outline"
                                onClick={() => handleShare(platform)}
                                className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </Button>
                        ))}
                    </div>
                </motion.div>
            </DialogContent>
        </Dialog>
    )
}

// ReportForm Component
interface ReportFormProps {
    title: string
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (reportType: string, reason: string) => void
}

const ReportForm: React.FC<ReportFormProps> = ({ title, isOpen, onOpenChange, onSubmit }) => {
    const [step, setStep] = useState(1)
    const [reportType, setReportType] = useState("")
    const [reportReason, setReportReason] = useState("")
    const [error, setError] = useState("")
    const maxReasonLength = 500

    const reportTypes = [
        { value: "inappropriate", label: "Inappropriate Content", icon: AlertCircle, description: "Content that violates community guidelines" },
        { value: "misinformation", label: "Misinformation", icon: Info, description: "False or misleading information" },
        { value: "spam", label: "Spam or Advertising", icon: AlertCircle, description: "Promotional or irrelevant content" },
        { value: "offensive", label: "Offensive Content", icon: Flag, description: "Hateful or abusive content" },
        { value: "other", label: "Other", icon: Info, description: "Any other issue not listed" },
    ]

    const handleNext = () => {
        if (!reportType) {
            setError("Please select a report type.")
            toast.error("Please select a report type.", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
            return
        }
        setError("")
        setStep(2)
    }

    const handleBack = () => {
        setError("")
        setStep(1)
    }

    const handleSubmit = () => {
        if (!reportReason.trim()) {
            setError("Please provide a reason for your report.")
            toast.error("Please provide a reason for your report.", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
            return
        }
        if (reportReason.length > maxReasonLength) {
            setError(`Reason must be ${maxReasonLength} characters or less.`)
            toast.error(`Reason must be ${maxReasonLength} characters or less.`, {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
            return
        }
        onSubmit(reportType, reportReason)
        toast.success("Report submitted successfully!", {
            position: "top-center",
            action: {
                label: "Close",
                onClick: () => {},
            },
            closeButton: false,
        })
        setReportType("")
        setReportReason("")
        setError("")
        setStep(1)
        onOpenChange(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            onOpenChange(open)
            if (!open) {
                setStep(1)
                setReportType("")
                setReportReason("")
                setError("")
            }
        }}>
            <DialogContent className="max-w-md sm:max-w-lg p-6 bg-background rounded-xl shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-foreground">Report Profile: {title}</DialogTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Step {step} of 2</span>
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: step === 1 ? "50%" : "100%" }}
                                animate={{ width: step === 1 ? "50%" : "100%" }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>
                </DialogHeader>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                >
                    {step === 1 ? (
                        <>
                            <p className="text-sm text-muted-foreground">Why are you reporting this profile?</p>
                            <div className="grid gap-2 max-h-64 overflow-y-auto">
                                {reportTypes.map((type) => {
                                    const Icon = type.icon
                                    return (
                                        <label
                                            key={type.value}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                                reportType === type.value ? "border-primary bg-primary/10" : "border-border hover:bg-accent"
                                            }`}
                                            htmlFor={type.value}
                                        >
                                            <input
                                                type="radio"
                                                id={type.value}
                                                name="reportType"
                                                value={type.value}
                                                checked={reportType === type.value}
                                                onChange={(e) => setReportType(e.target.value)}
                                                className="h-4 w-4 text-primary focus:ring-primary"
                                                aria-describedby={`${type.value}-description`}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Icon className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-medium text-foreground">{type.label}</span>
                                                </div>
                                                <p id={`${type.value}-description`} className="text-xs text-muted-foreground">
                                                    {type.description}
                                                </p>
                                            </div>
                                        </label>
                                    )
                                })}
                            </div>
                            {error && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </p>
                            )}
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    className="hover:bg-primary-dark transition-all duration-200"
                                >
                                    Next
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Please provide details for your report (max {maxReasonLength} characters):
                            </p>
                            <div className="relative">
                                <Textarea
                                    placeholder="Describe the issue in detail..."
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    className="min-h-[120px] resize-none bg-muted/50 border-border"
                                    maxLength={maxReasonLength}
                                    aria-describedby="reason-error"
                                />
                                <p className="text-xs text-muted-foreground text-right mt-1">
                                    {reportReason.length}/{maxReasonLength}
                                </p>
                                {error && (
                                    <p
                                        id="reason-error"
                                        className="text-sm text-destructive flex items-center gap-1 mt-1"
                                    >
                                        <AlertCircle className="w-4 h-4" /> {error}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    className="hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleSubmit}
                                    className="hover:bg-destructive-dark transition-all duration-200"
                                >
                                    <Flag className="w-4 h-4 mr-2" />
                                    Submit Report
                                </Button>
                            </div>
                        </>
                    )}
                </motion.div>
            </DialogContent>
        </Dialog>
    )
}

interface UserProfile {
    id: string
    name: string
    username: string
    avatar?: string
    coverImage?: string
    role: string
    bio: string
    location?: string
    website?: string
    joinDate: string
    lastActive: string
    isOnline: boolean
    stats: {
        posts: number
        replies: number
        likes: number
        views: number
        reputation: number
        coursesCreated: number
        coursesEnrolled: number
        followers: number
        following: number
    }
    badgeIds: string[]
    socialLinks: {
        twitter?: string
        github?: string
        linkedin?: string
        website?: string
    }
    recentPosts: Array<{
        id: string
        title: string
        excerpt: string
        createdAt: string
        likes: number
        replies: number
        category: string
    }>
    achievements: Array<{
        id: string
        title: string
        description: string
        unlockedAt: string
        icon: string
    }>
    skills?: string[]
}

export default function UserProfilePage() {
    const { id } = useParams()
    const router = useRouter()
    const [user, setUser] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isFollowing, setIsFollowing] = useState(false)
    const [activeTab, setActiveTab] = useState("overview")
    const [allBadges, setAllBadges] = useState<BadgeDefinition[] | null>(null)
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [isReportOpen, setIsReportOpen] = useState(false)

    useEffect(() => {
        const fetchProfileData = async () => {
            setIsLoading(true)
            try {
                // Use static badges instead of fetching from API
                setAllBadges(staticBadges)

                // Mock user data (replace with real API fetch when implemented)
                const mockUser: UserProfile = {
                    id: id as string,
                    name: "Sarah Johnson",
                    username: "@sarahjohnson",
                    avatar: "/images/Avatar.jpg",
                    coverImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=300&fit=crop",
                    role: "Student",
                    bio: "Passionate web developer learning React and Node.js. Love building user-friendly applications and helping fellow developers in the community.",
                    location: "San Francisco, CA",
                    website: "https://sarahjohnson.dev",
                    joinDate: "March 2024",
                    lastActive: "2 hours ago",
                    isOnline: true,
                    stats: {
                        posts: 15,
                        replies: 48,
                        likes: 245,
                        views: 1250,
                        reputation: 485,
                        coursesCreated: 0,
                        coursesEnrolled: 5,
                        followers: 23,
                        following: 15,
                    },
                    badgeIds: ["first-post", "helper", "active-member"],
                    socialLinks: {
                        twitter: "https://twitter.com/sarahjohnson",
                        github: "https://github.com/sarahjohnson",
                        linkedin: "https://linkedin.com/in/sarahjohnson",
                        website: "https://sarahjohnson.dev",
                    },
                    recentPosts: [
                        {
                            id: "1",
                            title: "How to deploy React app to production?",
                            excerpt: "I'm having trouble deploying my React application to production. Can someone help with best practices?",
                            createdAt: "2 hours ago",
                            likes: 18,
                            replies: 12,
                            category: "Technical",
                        },
                        {
                            id: "2",
                            title: "Best VS Code extensions for React development?",
                            excerpt: "Looking for recommendations on VS Code extensions that can improve my React development workflow.",
                            createdAt: "1 week ago",
                            likes: 25,
                            replies: 8,
                            category: "Tools",
                        },
                        {
                            id: "3",
                            title: "Understanding React Hooks - useEffect cleanup",
                            excerpt: "Can someone explain when and how to properly cleanup effects in React hooks?",
                            createdAt: "2 weeks ago",
                            likes: 12,
                            replies: 6,
                            category: "Learning",
                        },
                    ],
                    achievements: [
                        {
                            id: "1",
                            title: "First Steps",
                            description: "Completed your profile and made your first post",
                            unlockedAt: "March 2024",
                            icon: "🌟",
                        },
                        {
                            id: "2",
                            title: "Community Helper",
                            description: "Helped 5+ community members with their questions",
                            unlockedAt: "April 2024",
                            icon: "🤝",
                        },
                        {
                            id: "3",
                            title: "Learning Enthusiast",
                            description: "Enrolled in 5+ courses",
                            unlockedAt: "May 2024",
                            icon: "📚",
                        },
                    ],
                    skills: ["React", "Node.js", "TypeScript", "Tailwind CSS", "MongoDB", "Git"],
                }

                setUser(mockUser)
            } catch (error: any) {
                console.error("Failed to fetch profile data:", {
                    message: error.message,
                    stack: error.stack,
                })
                toast.error("Failed to load profile. Please try again later.", {
                    position: "top-center",
                    action: {
                        label: "Close",
                        onClick: () => {},
                    },
                    closeButton: false,
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchProfileData()
    }, [id])

    const handleReportSubmit = async (reportType: string, reason: string) => {
        try {
            // Mock API call for reporting (replace with real API when implemented)
            console.log("Report submitted:", { userId: id, reportType, reason })
            // Example real API call:
            // const response = await fetch("/api/reports", {
            //   method: "POST",
            //   headers: { "Content-Type": "application/json" },
            //   body: JSON.stringify({ userId: id, reportType, reason }),
            // })
            // if (!response.ok) throw new Error("Failed to submit report")
            toast.success("Report submitted successfully", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
        } catch (error: any) {
            console.error("Report submission failed:", error)
            toast.error("Failed to submit report", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
                <Header />
                <div className="container mx-auto px-4 py-8 pt-24 text-center">
                    <h1 className="text-2xl font-bold mb-4">User not found</h1>
                    <Button onClick={() => router.back()}>Go Back</Button>
                </div>
                <Footer />
            </div>
        )
    }

    const recentActivityData = [
        { action: "Commented on", target: "How to deploy React app to production?", time: "2 hours ago", icon: MessageCircle },
        { action: "Liked", target: "Best practices for React performance", time: "5 hours ago", icon: Heart },
        { action: "Started following", target: "Mike Chen", time: "1 day ago", icon: Users },
        { action: "Posted", target: "VS Code extensions for React development", time: "1 week ago", icon: Star },
    ]

    const userBadges = (allBadges || [])
        .filter((badge) => badge && user.badgeIds.includes(badge.id))
        .filter((badge): badge is BadgeDefinition => badge !== undefined && badge !== null)

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            <Header />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6"
                >
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-all duration-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                </motion.div>

                {/* Profile Header with Share and Report Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <UserProfileHeader user={user} isFollowing={isFollowing} setIsFollowing={setIsFollowing} />
                    <div className="flex gap-3 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsShareOpen(true)}
                            className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-all duration-200"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsReportOpen(true)}
                            className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all duration-200"
                        >
                            <Flag className="w-4 h-4" />
                            Report
                        </Button>
                    </div>
                </motion.div>

                {/* Share and Report Forms */}
                <ShareForm
                    title={`${user.name}'s Profile`}
                    url={`${typeof window !== "undefined" ? window.location.origin : ""}/users/${user.id}`}
                    isOpen={isShareOpen}
                    onOpenChange={setIsShareOpen}
                />
                <ReportForm
                    title={`${user.name}'s Profile`}
                    isOpen={isReportOpen}
                    onOpenChange={setIsReportOpen}
                    onSubmit={handleReportSubmit}
                />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
                    {/* Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="lg:col-span-1 space-y-6"
                    >
                        <UserProfileStats userStats={user.stats} />
                        <UserFollowStats followers={user.stats.followers} following={user.stats.following} />
                        {user.skills && <UserSkills skills={user.skills} />}
                    </motion.div>

                    {/* Main Content - Tabs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                        className="lg:col-span-3"
                    >
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50 rounded-xl shadow-inner">
                                <TabsTrigger
                                    value="overview"
                                    className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
                                >
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger
                                    value="posts"
                                    className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
                                >
                                    Posts
                                </TabsTrigger>
                                <TabsTrigger
                                    value="achievements"
                                    className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
                                >
                                    Achievements
                                </TabsTrigger>
                                <TabsTrigger
                                    value="courses"
                                    className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
                                >
                                    Courses
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-6 mt-6">
                                <UserBadges badges={userBadges} />
                                <UserRecentActivity recentActivity={recentActivityData} />
                            </TabsContent>

                            <TabsContent value="posts" className="space-y-4 mt-6">
                                <UserRecentPosts posts={user.recentPosts} />
                            </TabsContent>

                            <TabsContent value="achievements" className="space-y-4 mt-6">
                                <UserAchievements achievements={user.achievements} />
                            </TabsContent>

                            <TabsContent value="courses" className="space-y-6 mt-6">
                                <UserCoursesOverview
                                    coursesEnrolled={user.stats.coursesEnrolled}
                                    coursesCreated={user.stats.coursesCreated}
                                />
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                </div>
            </div>
            <Footer />
        </div>
    )
}