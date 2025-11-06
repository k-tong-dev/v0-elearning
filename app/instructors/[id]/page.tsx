"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import { Footer } from "@/components/ui/footers/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArrowLeft, MessageCircle, Share2, Flag, Copy, Twitter, Facebook, Linkedin, Mail, ExternalLink, CheckCircle, Users, GraduationCap, Star, BookOpen, Globe, Github, Youtube, Instagram, Link as LinkIcon, Loader2, Video, DollarSign } from "lucide-react"
import { cn } from "@/utils/utils"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { getInstructor, Instructor, getInstructorFollowerCount, followInstructor, unfollowInstructor, isFollowingInstructor } from "@/integrations/strapi/instructor"
import { strapiPublic } from "@/integrations/strapi/client"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import { QuantumAvatar } from "@/components/ui/quantum-avatar"
import { useAuth } from "@/hooks/use-auth"
import { UserPlus, UserCheck, UserMinus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

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
            toast.error("Sharing is not available in this environment.")
            return
        }

        const text = `Check out this instructor: ${title}`
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
        }

        if (shareUrl) {
            window.open(shareUrl, "_blank")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share {title}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 py-4">
                    <Button
                        variant="outline"
                        onClick={() => handleShare("twitter")}
                        className="flex items-center gap-2"
                    >
                        <Twitter className="w-4 h-4" />
                        Twitter
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleShare("facebook")}
                        className="flex items-center gap-2"
                    >
                        <Facebook className="w-4 h-4" />
                        Facebook
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleShare("linkedin")}
                        className="flex items-center gap-2"
                    >
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleShare("copy")}
                        className="flex items-center gap-2"
                    >
                        <Copy className="w-4 h-4" />
                        Copy Link
                    </Button>
                </div>
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
    const [reportType, setReportType] = useState("")
    const [reason, setReason] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!reportType || !reason.trim()) {
            toast.error("Please fill in all fields")
            return
        }
        onSubmit(reportType, reason)
        setReportType("")
        setReason("")
        onOpenChange(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Report {title}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Report Type</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                        >
                            <option value="">Select a type</option>
                            <option value="spam">Spam</option>
                            <option value="inappropriate">Inappropriate Content</option>
                            <option value="harassment">Harassment</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">Reason</label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Please provide details..."
                            className="min-h-[100px]"
                            required
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Submit Report</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function InstructorProfilePage() {
    const { id } = useParams()
    const router = useRouter()
    const { user: currentUser } = useAuth()
    const [instructor, setInstructor] = useState<Instructor | null>(null)
    const [user, setUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("overview")
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [isReportOpen, setIsReportOpen] = useState(false)
    const [followerCount, setFollowerCount] = useState(0)
    const [isFollowing, setIsFollowing] = useState(false)
    const [isTogglingFollow, setIsTogglingFollow] = useState(false)

    useEffect(() => {
        const fetchInstructorData = async () => {
            setIsLoading(true)
            try {
                // Fetch instructor data
                const instructorData = await getInstructor(id as string)
                if (!instructorData) {
                    toast.error("Instructor not found")
                    return
                }

                setInstructor(instructorData)

                // Fetch follower count
                const count = await getInstructorFollowerCount(id as string);
                setFollowerCount(count);

                // Check if current user is following
                if (currentUser?.id) {
                    const following = await isFollowingInstructor(id as string, currentUser.id);
                    setIsFollowing(following);
                }

                // Fetch user data if instructor has a linked user
                if (instructorData.user) {
                    const userId = typeof instructorData.user === 'object' 
                        ? (instructorData.user.id || instructorData.user)
                        : instructorData.user;
                    
                    if (userId) {
                        try {
                            const userResponse = await strapiPublic.get(`/api/users/${userId}?populate=*`);
                            setUser(userResponse.data?.data || userResponse.data);
                        } catch (error) {
                            console.error("Error fetching user:", error);
                        }
                    }
                }
            } catch (error: any) {
                console.error("Failed to fetch instructor data:", error)
                toast.error("Failed to load instructor profile. Please try again later.")
            } finally {
                setIsLoading(false)
            }
        }

        if (id) {
            fetchInstructorData()
        }
    }, [id, currentUser?.id])

    const handleToggleFollow = async () => {
        if (!currentUser?.id || !instructor || isTogglingFollow) return;

        setIsTogglingFollow(true);
        try {
            // Use documentId if available, otherwise use numeric ID
            const instructorIdentifier = instructor.documentId || instructor.id || id;
            
            if (isFollowing) {
                const success = await unfollowInstructor(instructorIdentifier, currentUser.id);
                if (success) {
                    // Refresh following status and follower count from server
                    const updatedFollowing = await isFollowingInstructor(instructorIdentifier, currentUser.id);
                    setIsFollowing(updatedFollowing);
                    const updatedCount = await getInstructorFollowerCount(instructorIdentifier);
                    setFollowerCount(updatedCount);
                    toast.success(`Unfollowed ${instructor.name}`);
                } else {
                    toast.error("Failed to unfollow instructor");
                }
            } else {
                const success = await followInstructor(instructorIdentifier, currentUser.id);
                if (success) {
                    // Refresh following status and follower count from server
                    const updatedFollowing = await isFollowingInstructor(instructorIdentifier, currentUser.id);
                    setIsFollowing(updatedFollowing);
                    const updatedCount = await getInstructorFollowerCount(instructorIdentifier);
                    setFollowerCount(updatedCount);
                    toast.success(`Following ${instructor.name}`);
                } else {
                    toast.error("Failed to follow instructor");
                }
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
            toast.error("An error occurred");
        } finally {
            setIsTogglingFollow(false);
        }
    }

    const handleReportSubmit = async (reportType: string, reason: string) => {
        try {
            console.log("Report submitted:", { instructorId: id, reportType, reason })
            toast.success("Report submitted successfully")
        } catch (error: any) {
            console.error("Report submission failed:", error)
            toast.error("Failed to submit report")
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    if (!instructor) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
                <HeaderUltra />
                <div className="container mx-auto px-4 py-8 pt-24 text-center">
                    <h1 className="text-2xl font-bold mb-4">Instructor not found</h1>
                    <Button onClick={() => router.back()}>Go Back</Button>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            <HeaderUltra />
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

                {/* Cover Image Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="relative w-full rounded-2xl overflow-hidden mb-0"
                >
                    {instructor.cover ? (
                        <div className="relative w-full h-64 sm:h-80">
                            <img
                                src={getAvatarUrl(instructor.cover)}
                                alt={`${instructor.name} cover`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="relative w-full h-64 sm:h-80 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10"></div>
                        </div>
                    )}
                </motion.div>

                {/* Profile Card Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    className="relative bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 sm:p-8 -mt-16 sm:-mt-20 mb-6 shadow-xl"
                >
                    {/* Avatar positioned at top */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
                        <div className="flex-shrink-0">
                            <div className="w-fit h-fit sm:w-32 sm:h-32 rounded-full bg-transparent border-4 border-background shadow-2xl flex items-center justify-center">
                                <QuantumAvatar
                                    src={getAvatarUrl(instructor.avatar)}
                                    alt={instructor.name}
                                    size="2xl"
                                    variant="quantum"
                                    showStatus
                                    status={instructor.is_active ? "online" : "offline"}
                                    verified={instructor.is_verified}
                                    interactive
                                    className="w-full h-full"
                                />
                            </div>
                        </div>

                        {/* Name and Badges */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                                    {instructor.name}
                                </h1>
                                <Badge 
                                    variant={instructor.is_active ? "default" : "secondary"}
                                    className={instructor.is_active ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" : ""}
                                >
                                    {instructor.is_active ? "Active Now" : "Inactive"}
                                </Badge>
                            </div>
                            
                            {/* Follower Count */}
                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="w-4 h-4" />
                                    <span className="font-semibold text-foreground">{followerCount}</span>
                                    <span>Followers</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 ml-auto">
                            {currentUser?.id && (
                                <Button
                                    variant={isFollowing ? "outline" : "default"}
                                    onClick={handleToggleFollow}
                                    disabled={isTogglingFollow}
                                    className={cn(
                                        "flex items-center gap-2",
                                        isFollowing 
                                            ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20"
                                            : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                                    )}
                                >
                                    {isTogglingFollow ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {isFollowing ? "Unfollowing..." : "Following..."}
                                        </>
                                    ) : isFollowing ? (
                                        <>
                                            <UserCheck className="w-4 h-4" />
                                            Following
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            Follow
                                        </>
                                    )}
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => setIsShareOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <Share2 className="w-4 h-4" />
                                Share Profile
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsReportOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <Flag className="w-4 h-4" />
                                Report
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Linked User Section */}
                {user && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 mb-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">LINKED USER ACCOUNT</p>
                                <div className="flex items-center gap-3">
                                    <QuantumAvatar
                                        src={getAvatarUrl(user.avatar)}
                                        alt={user.name || user.username}
                                        size="md"
                                        variant="neon"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-foreground">
                                            {user.name || user.username}
                                        </p>
                                        {user.username && (
                                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/users/${user.id}`)}
                                className="flex items-center gap-2"
                            >
                                View Profile
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Share and Report Forms */}
                <ShareForm
                    title={`${instructor.name}'s Profile`}
                    url={`${typeof window !== "undefined" ? window.location.origin : ""}/instructors/${id}`}
                    isOpen={isShareOpen}
                    onOpenChange={setIsShareOpen}
                />
                <ReportForm
                    title={`${instructor.name}'s Profile`}
                    isOpen={isReportOpen}
                    onOpenChange={setIsReportOpen}
                    onSubmit={handleReportSubmit}
                />

                {/* Tabs Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.25 }}
                    className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6"
                >
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 rounded-xl shadow-inner mb-6">
                            <TabsTrigger
                                value="overview"
                                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
                            >
                                Overview
                            </TabsTrigger>
                            <TabsTrigger
                                value="courses"
                                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
                            >
                                <BookOpen className="w-4 h-4 mr-2" />
                                Courses
                            </TabsTrigger>
                            <TabsTrigger
                                value="about"
                                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
                            >
                                About
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6">
                            <div className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-6">Instructor Statistics</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="text-center p-5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-border/50 hover:border-primary/50 transition-all">
                                        <p className="text-3xl font-bold text-foreground mb-1">
                                            {instructor.stats?.coursesCreated || 0}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Courses</p>
                                    </div>
                                    <div className="text-center p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-border/50 hover:border-primary/50 transition-all">
                                        <p className="text-3xl font-bold text-foreground mb-1">
                                            {instructor.stats?.students || 0}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Students</p>
                                    </div>
                                    <div className="text-center p-5 bg-gradient-to-br from-pink-500/10 to-blue-500/10 rounded-xl border border-border/50 hover:border-primary/50 transition-all">
                                        <p className="text-3xl font-bold text-foreground mb-1">
                                            {instructor.stats?.reviews || 0}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Reviews</p>
                                    </div>
                                    <div className="text-center p-5 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl border border-border/50 hover:border-primary/50 transition-all">
                                        <p className="text-3xl font-bold text-foreground mb-1">
                                            {instructor.rating?.toFixed(1) || "0.0"}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Rating</p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="courses" className="space-y-6">
                            <div className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-6 text-center">
                                <GraduationCap className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-muted-foreground">Courses will be displayed here</p>
                            </div>
                        </TabsContent>

                        <TabsContent value="about" className="space-y-6">
                            <div className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">About</h3>
                                {instructor.bio ? (
                                    <p className="text-muted-foreground leading-relaxed">{instructor.bio}</p>
                                ) : (
                                    <p className="text-muted-foreground italic">No bio available</p>
                                )}

                                {instructor.specializations && (
                                    <div className="mt-6">
                                        <h4 className="font-semibold text-foreground mb-3">Specializations</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {(() => {
                                                // Handle blocks format (Strapi blocks)
                                                if (Array.isArray(instructor.specializations)) {
                                                    const specializations: string[] = [];
                                                    instructor.specializations.forEach((block: any) => {
                                                        if (block.type === 'paragraph' && block.children) {
                                                            block.children.forEach((child: any) => {
                                                                if (child.type === 'text' && child.text) {
                                                                    // Split by comma or newline and add each specialization
                                                                    const parts = child.text.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean);
                                                                    specializations.push(...parts);
                                                                }
                                                            });
                                                        }
                                                    });
                                                    
                                                    if (specializations.length > 0) {
                                                        return specializations.map((spec, idx) => (
                                                            <Badge key={idx} variant="secondary" className="text-sm">
                                                                {spec}
                                                            </Badge>
                                                        ));
                                                    }
                                                }
                                                
                                                // Handle string format
                                                if (typeof instructor.specializations === 'string') {
                                                    const specs = instructor.specializations.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
                                                    return specs.map((spec, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-sm">
                                                            {spec}
                                                        </Badge>
                                                    ));
                                                }
                                                
                                                return <Badge variant="secondary">Specialized Instructor</Badge>;
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* Monetization Status */}
                                {instructor.monetization && (
                                    <div className="mt-6 pt-6 border-t border-border">
                                        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                                            <DollarSign className="w-5 h-5 text-green-500" />
                                            <div>
                                                <p className="font-semibold text-foreground">Monetization Enabled</p>
                                                <p className="text-xs text-muted-foreground">This instructor accepts payments</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Social Links */}
                                {(instructor.youtube || instructor.github || instructor.linkin || instructor.facebook || instructor.instagram || instructor.tiktok) && (
                                    <div className="mt-6 pt-6 border-t border-border">
                                        <h4 className="font-semibold text-foreground mb-3">Social Links</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {instructor.youtube && (
                                                <a 
                                                    href={instructor.youtube} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
                                                >
                                                    <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                                                        <Youtube className="w-5 h-5 text-red-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm text-foreground">YouTube</p>
                                                        <p className="text-xs text-muted-foreground truncate">{instructor.youtube}</p>
                                                    </div>
                                                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                                </a>
                                            )}
                                            {instructor.github && (
                                                <a 
                                                    href={instructor.github} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
                                                >
                                                    <div className="p-2 bg-gray-500/10 rounded-lg group-hover:bg-gray-500/20 transition-colors">
                                                        <Github className="w-5 h-5 text-foreground" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm text-foreground">GitHub</p>
                                                        <p className="text-xs text-muted-foreground truncate">{instructor.github}</p>
                                                    </div>
                                                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                                </a>
                                            )}
                                            {instructor.linkin && (
                                                <a 
                                                    href={instructor.linkin} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
                                                >
                                                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                                        <Linkedin className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm text-foreground">LinkedIn</p>
                                                        <p className="text-xs text-muted-foreground truncate">{instructor.linkin}</p>
                                                    </div>
                                                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                                </a>
                                            )}
                                            {instructor.facebook && (
                                                <a 
                                                    href={instructor.facebook} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
                                                >
                                                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                                        <Facebook className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm text-foreground">Facebook</p>
                                                        <p className="text-xs text-muted-foreground truncate">{instructor.facebook}</p>
                                                    </div>
                                                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                                </a>
                                            )}
                                            {instructor.instagram && (
                                                <a 
                                                    href={instructor.instagram} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
                                                >
                                                    <div className="p-2 bg-pink-500/10 rounded-lg group-hover:bg-pink-500/20 transition-colors">
                                                        <Instagram className="w-5 h-5 text-pink-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm text-foreground">Instagram</p>
                                                        <p className="text-xs text-muted-foreground truncate">{instructor.instagram}</p>
                                                    </div>
                                                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                                </a>
                                            )}
                                            {instructor.tiktok && (
                                                <a 
                                                    href={instructor.tiktok} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
                                                >
                                                    <div className="p-2 bg-gray-500/10 rounded-lg group-hover:bg-gray-500/20 transition-colors">
                                                        <Video className="w-5 h-5 text-foreground" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm text-foreground">TikTok</p>
                                                        <p className="text-xs text-muted-foreground truncate">{instructor.tiktok}</p>
                                                    </div>
                                                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </motion.div>
            </div>
            <Footer />
        </div>
    )
}

