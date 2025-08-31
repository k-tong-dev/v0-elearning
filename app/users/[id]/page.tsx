"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, MessageCircle, Heart, Users, Star } from "lucide-react"
import { motion } from "framer-motion"
import { UserProfileHeader } from "@/components/user-profile/UserProfileHeader"
import { UserProfileStats } from "@/components/user-profile/UserProfileStats"
import { UserFollowStats } from "@/components/user-profile/UserFollowStats"
import { UserSkills } from "@/components/user-profile/UserSkills"
import { UserBadges } from "@/components/user-profile/UserBadges"
import { UserRecentActivity } from "@/components/user-profile/UserRecentActivity"
import { UserRecentPosts } from "@/components/user-profile/UserRecentPosts"
import { UserAchievements } from "@/components/user-profile/UserAchievements"
import { UserCoursesOverview } from "@/components/user-profile/UserCoursesOverview"
import { BadgeDefinition } from '@/types/db';
import {toast} from "sonner"; // Import BadgeDefinition from types/db

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
    badgeIds: string[] // Changed to store only badge IDs
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
    const [allBadges, setAllBadges] = useState<BadgeDefinition[]>([]);

    useEffect(() => {
        const fetchProfileData = async () => {
            setIsLoading(true);
            try {
                // Fetch all badge definitions from the API
                const badgesResponse = await fetch('/api/badges');
                if (!badgesResponse.ok) throw new Error('Failed to fetch badge definitions');
                const fetchedBadges: BadgeDefinition[] = await badgesResponse.json();
                setAllBadges(fetchedBadges);

                // Mock user data - in a real app, fetch from /api/users/[id]
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
                        following: 15
                    },
                    badgeIds: ["first-post", "helper", "active-member"], // Store only IDs
                    socialLinks: {
                        twitter: "https://twitter.com/sarahjohnson",
                        github: "https://github.com/sarahjohnson",
                        linkedin: "https://linkedin.com/in/sarahjohnson",
                        website: "https://sarahjohnson.dev"
                    },
                    recentPosts: [
                        {
                            id: "1",
                            title: "How to deploy React app to production?",
                            excerpt: "I'm having trouble deploying my React application to production. Can someone help with best practices?",
                            createdAt: "2 hours ago",
                            likes: 18,
                            replies: 12,
                            category: "Technical"
                        },
                        {
                            id: "2",
                            title: "Best VS Code extensions for React development?",
                            excerpt: "Looking for recommendations on VS Code extensions that can improve my React development workflow.",
                            createdAt: "1 week ago",
                            likes: 25,
                            replies: 8,
                            category: "Tools"
                        },
                        {
                            id: "3",
                            title: "Understanding React Hooks - useEffect cleanup",
                            excerpt: "Can someone explain when and how to properly cleanup effects in React hooks?",
                            createdAt: "2 weeks ago",
                            likes: 12,
                            replies: 6,
                            category: "Learning"
                        }
                    ],
                    achievements: [
                        {
                            id: "1",
                            title: "First Steps",
                            description: "Completed your profile and made your first post",
                            unlockedAt: "March 2024",
                            icon: "🌟"
                        },
                        {
                            id: "2",
                            title: "Community Helper",
                            description: "Helped 5+ community members with their questions",
                            unlockedAt: "April 2024",
                            icon: "🤝"
                        },
                        {
                            id: "3",
                            title: "Learning Enthusiast",
                            description: "Enrolled in 5+ courses",
                            unlockedAt: "May 2024",
                            icon: "📚"
                        }
                    ],
                    skills: ["React", "Node.js", "TypeScript", "Tailwind CSS", "MongoDB", "Git"]
                }

                setUser(mockUser);
            } catch (error) {
                console.error("Failed to fetch user profile or badges:", error);
                toast.error("Failed to load user profile.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [id]);

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
        { action: "Posted", target: "VS Code extensions for React development", time: "1 week ago", icon: Star }
    ];

    // Map user's badgeIds to full badge objects
    const userBadges = user.badgeIds
        .map(badgeId => allBadges.find(badge => badge.id === badgeId))
        .filter((badge): badge is BadgeDefinition => badge !== undefined);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            <Header />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-6"
                >
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                </motion.div>

                {/* Profile Header */}
                <UserProfileHeader user={user} isFollowing={isFollowing} setIsFollowing={setIsFollowing} />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <UserProfileStats userStats={user.stats} />
                        <UserFollowStats followers={user.stats.followers} following={user.stats.following} />
                        {user.skills && <UserSkills skills={user.skills} />}
                    </div>

                    {/* Main Content - Tabs */}
                    <div className="lg:col-span-3">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50 rounded-xl shadow-inner">
                                    <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all duration-200">
                                        Overview
                                    </TabsTrigger>
                                    <TabsTrigger value="posts" className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all duration-200">
                                        Posts
                                    </TabsTrigger>
                                    <TabsTrigger value="achievements" className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all duration-200">
                                        Achievements
                                    </TabsTrigger>
                                    <TabsTrigger value="courses" className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all duration-200">
                                        Courses
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="space-y-6 mt-6">
                                    <UserBadges badges={userBadges} /> {/* Pass mapped badges */}
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
            </div>

            <Footer />
        </div>
    )
}