"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import { Footer } from "@/components/ui/footers/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    ArrowLeft,
    Users,
    GraduationCap,
    MapPin,
    Code,
    Palette,
    FileText,
    MessageSquare, // Telegram
    Facebook,
    Instagram,
    Globe, // Website
} from "lucide-react"
import { motion } from "framer-motion"

interface TeamMember {
    name: string
    role: string
    avatar: string
    social: {
        telegram?: string
        facebook?: string
        instagram?: string
        website?: string
    }
}

export default function AboutUsPage() {
    const router = useRouter()

    const teamMembers: TeamMember[] = [
        {
            name: "Khon Tong",
            role: "Team Lead & Backend/Frontend",
            avatar: "/images/Avatar.jpg", // Replace with actual image
            social: {
                telegram: "https://t.me/khontong",
                facebook: "https://facebook.com/khontong",
                instagram: "https://instagram.com/khontong",
                website: "https://khontong.vercel.app",
            },
        },
        {
            name: "Bin Roth",
            role: "Backend/Frontend",
            avatar: "/images/Avatar.jpg", // Replace with actual image
            social: {
                telegram: "https://t.me/binroth",
                facebook: "https://facebook.com/binroth",
                instagram: "https://instagram.com/binroth",
                website: "https://binroth.dev",
            },
        },
        {
            name: "Rey Chamlouey",
            role: "Backend/Frontend",
            avatar: "/images/Avatar.jpg", // Replace with actual image
            social: {
                telegram: "https://t.me/reychamlouey",
                facebook: "https://facebook.com/reychamlouey",
                instagram: "https://instagram.com/reychamlouey",
                website: "https://reychamlouey.dev",
            },
        },
        {
            name: "Thorng Non",
            role: "Designer",
            avatar: "/images/Avatar.jpg", // Replace with actual image
            social: {
                telegram: "https://t.me/thorngnon",
                facebook: "https://facebook.com/thorngnon",
                instagram: "https://instagram.com/thorngnon",
                website: "https://thorngnon.design",
            },
        },
        {
            name: "Khan Sovathana",
            role: "Documenter",
            avatar: "/images/Avatar.jpg", // Replace with actual image
            social: {
                telegram: "https://t.me/khansovathana",
                facebook: "https://facebook.com/khansovathana",
                instagram: "https://instagram.com/khansovathana",
                website: "https://khansovathana.dev",
            },
        },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            <HeaderUltra />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="flex items-center gap-2 hover:bg-accent/20"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                </motion.div>

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        About CamEdu
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        We are a passionate team from Cambodia Mekong University (CMU) dedicated to revolutionizing online education.
                    </p>
                </motion.div>

                {/* Our Mission */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-12 max-w-4xl mx-auto"
                >
                    <Card className="liquid-glass-card">
                        <CardHeader className="text-center">
                            <GraduationCap className="w-12 h-12 text-primary mx-auto mb-4" />
                            <CardTitle className="text-2xl">Our Mission</CardTitle>
                        </CardHeader>
                        <CardContent className="text-lg text-muted-foreground text-center leading-relaxed">
                            To empower learners worldwide with accessible, high-quality, and interactive educational experiences. We believe in fostering a community where knowledge is shared, skills are honed, and futures are transformed.
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Our Team */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-12"
                >
                    <h2 className="text-3xl font-bold text-center mb-8">Meet Our Team</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {teamMembers.map((member, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Card className="text-center liquid-glass-card">
                                    <CardContent className="p-6">
                                        <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary shadow-md avatar-border-gradient">
                                            <AvatarImage src={member.avatar} alt={member.name} />
                                            <AvatarFallback className="text-xl font-bold">
                                                {member.name.split(" ").map(n => n[0]).join("")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <h3 className="font-semibold text-xl mb-1">{member.name}</h3>
                                        <p className="text-sm text-muted-foreground mb-4">{member.role}</p>
                                        <div className="flex items-center justify-center gap-3">
                                            {member.social.telegram && (
                                                <a href={member.social.telegram} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="ghost" size="icon" className="hover:bg-blue-50 dark:hover:bg-blue-950">
                                                        <MessageSquare className="w-5 h-5 text-blue-500" />
                                                    </Button>
                                                </a>
                                            )}
                                            {member.social.facebook && (
                                                <a href={member.social.facebook} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="ghost" size="icon" className="hover:bg-blue-100 dark:hover:bg-blue-900">
                                                        <Facebook className="w-5 h-5 text-blue-700" />
                                                    </Button>
                                                </a>
                                            )}
                                            {member.social.instagram && (
                                                <a href={member.social.instagram} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="ghost" size="icon" className="hover:bg-pink-50 dark:hover:bg-pink-950">
                                                        <Instagram className="w-5 h-5 text-pink-500" />
                                                    </Button>
                                                </a>
                                            )}
                                            {member.social.website && (
                                                <a href={member.social.website} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="ghost" size="icon" className="hover:bg-blue-50 dark:hover:bg-blue-950">
                                                        <Globe className="w-5 h-5 text-purple-500" />
                                                    </Button>
                                                </a>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* University Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="max-w-4xl mx-auto"
                >
                    <Card className="liquid-glass-card">
                        <CardHeader className="text-center">
                            <img src="/placeholder-logo.png" alt="CMU Logo" className="h-16 mx-auto mb-4" /> {/* Replace with actual CMU logo */}
                            <CardTitle className="text-2xl">Cambodia Mekong University (CMU)</CardTitle>
                        </CardHeader>
                        <CardContent className="text-lg text-muted-foreground text-center leading-relaxed">
                            CamEdu is a final year project developed by students from Cambodia Mekong University. Our aim is to apply our academic knowledge to create a practical and impactful e-learning platform for the community.
                            <div className="flex items-center justify-center gap-2 mt-4 text-sm">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span>Phnom Penh, Cambodia</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <Footer />
        </div>
    )
}