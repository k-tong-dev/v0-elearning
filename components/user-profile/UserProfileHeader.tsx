"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Calendar,
    MapPin,
    Link as LinkIcon,
    Github,
    Twitter,
    Linkedin,
    Globe,
    MessageCircle,
    Share2,
} from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

interface UserProfileHeaderProps {
    user: {
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
            followers: number
        }
        socialLinks: {
            twitter?: string
            github?: string
            linkedin?: string
            website?: string
        }
    }
    isFollowing: boolean
    setIsFollowing: (following: boolean) => void
}

export function UserProfileHeader({ user, isFollowing, setIsFollowing }: UserProfileHeaderProps) {
    const router = useRouter()

    const handleFollow = () => {
        setIsFollowing(!isFollowing)
        toast.success(isFollowing ? "Unfollowed user" : "Following user!")
    }

    const handleMessage = () => {
        toast.info("Messaging functionality coming soon!")
    }

    const handleShare = () => {
        const profileUrl = `${window.location.origin}/users/${user.id}`
        navigator.clipboard.writeText(profileUrl)
        toast.success("Profile link copied to clipboard!")
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
            <div className="relative overflow-hidden mb-8 border-2 shadow-lg rounded-xl">
                {/* Cover Image */}
                <div
                    className="h-48 md:h-64 bg-gradient-to-r from-cyan-500 via-emerald-500 to-purple-500 relative"
                    style={{
                        backgroundImage: user.coverImage ? `url(${user.coverImage})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div className="absolute inset-0 bg-black/30" />
                </div>

                <div className="relative p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-24 md:-mt-20 pb-6">
                        <div className="relative">
                            <Avatar className="w-28 h-28 md:w-36 md:h-36 border-4 border-background shadow-xl">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback className="text-3xl md:text-4xl font-bold">
                                    {user.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                            </Avatar>
                            {user.isOnline && (
                                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-background rounded-full animate-pulse"></div>
                            )}
                        </div>

                        <div className="flex-1 space-y-2 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                                        {user.name}
                                    </h1>
                                    <p className="text-muted-foreground text-lg">{user.username}</p>
                                    <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                                        <Badge variant="outline" className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 text-cyan-700 dark:text-cyan-300">
                                            {user.role}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                      Last active {user.lastActive}
                    </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={handleFollow}
                                        className={isFollowing
                                            ? "bg-gray-500 hover:bg-gray-600 text-white"
                                            : "bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white"
                                        }
                                    >
                                        {isFollowing ? "Following" : "Follow"}
                                    </Button>
                                    <Button variant="outline" onClick={handleMessage}>
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        Message
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={handleShare}>
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {user.bio && (
                                <p className="text-base leading-relaxed max-w-3xl mx-auto md:mx-0 mt-4">{user.bio}</p>
                            )}

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mt-4">
                                {user.location && (
                                    <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                                        {user.location}
                  </span>
                                )}
                                {user.website && (
                                    <span className="flex items-center gap-1">
                    <LinkIcon className="w-4 h-4" />
                    <a href={user.website} target="_blank" rel="noopener noreferrer"
                       className="hover:text-primary transition-colors">
                      {user.website.replace(/^https?:\/\//, '')}
                    </a>
                  </span>
                                )}
                                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {user.joinDate}
                </span>
                            </div>

                            {/* Social Links */}
                            <div className="flex items-center justify-center md:justify-start gap-3 pt-4">
                                {user.socialLinks.github && (
                                    <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <Github className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                        </Button>
                                    </a>
                                )}
                                {user.socialLinks.twitter && (
                                    <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon" className="hover:bg-blue-50 dark:hover:bg-blue-950">
                                            <Twitter className="w-5 h-5 text-blue-500" />
                                        </Button>
                                    </a>
                                )}
                                {user.socialLinks.linkedin && (
                                    <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon" className="hover:bg-blue-100 dark:hover:bg-blue-900">
                                            <Linkedin className="w-5 h-5 text-blue-700" />
                                        </Button>
                                    </a>
                                )}
                                {user.socialLinks.website && (
                                    <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon" className="hover:bg-emerald-50 dark:hover:bg-emerald-950">
                                            <Globe className="w-5 h-5 text-emerald-500" />
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}