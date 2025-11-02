"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@heroui/react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserMenuAvatar } from "@/components/ui/enhanced-avatar"
import { useAuth } from "@/hooks/use-auth"
import {
    Menu,
    X,
    BookOpen,
    User,
    Search,
    ChevronDown,
    MessageCircle,
    Info,
    FileText,
    Briefcase,
    HelpCircle,
    Phone,
    Settings,
    LogOut,
    Share2,
    Copy,
    Loader2,
    Cloud,
    PlusCircle
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {Modal, ModalBody, ModalContent, ModalFooter, ModalTrigger} from "@/components/ui/aceternity/animated-modal";
import {motion} from "motion/react";

export function Header() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading, logout, loginWithGoogle } = useAuth()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [isExploreOpen, setIsExploreOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const handleGetStartedClick = () => {
        router.push("/auth/start");
        setIsMenuOpen(false);
    };

    const handleSignOut = async () => {
        try {
            await logout()
            toast.success('Signed out successfully', {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
            setIsUserMenuOpen(false)
            setIsMenuOpen(false)
            router.push('/')
        } catch (error) {
            console.error('Sign out failed:', error, {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
            toast.error('Failed to sign out', {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
        }
    }

    const handleProfileClick = () => {
        router.push('/dashboard')
        setIsUserMenuOpen(false)
        setIsMenuOpen(false)
    }

    const handleCreateCourseClick = () => {
        router.push('/dashboard?tab=my-courses&create=true'); // Add a query param to signal creation
        setIsUserMenuOpen(false);
        setIsMenuOpen(false);
    }

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'CamEducation',
                    text: 'Check out CamEducation - the best online learning platform!',
                    url: window.location.origin,
                })
                toast.success('Shared successfully!', {
                    position: "top-center",
                    action: {
                        label: "Close",
                        onClick: () => {},
                    },
                    closeButton: false,
                })
            } else {
                await navigator.clipboard.writeText(window.location.origin)
                toast.success('Link copied to clipboard!', {
                    position: "top-center",
                    action: {
                        label: "Close",
                        onClick: () => {},
                    },
                    closeButton: false,
                })
            }
        } catch (error) {
            console.error('Share failed:', error)
            toast.error('Failed to share', {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
        }
        setIsUserMenuOpen(false)
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(window.location.origin)
            toast.success('Link copied to clipboard!', {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
        } catch (error) {
            console.error('Copy failed:', error)
            toast.error('Failed to copy link', {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
        }
        setIsUserMenuOpen(false)
    }

    const handleSearch = () => {
        console.log("[v0] Search button clicked from header")
        // Add search modal or redirect to search page
    }

    const exploreItems = [
        {
            title: "Forum",
            description: "Join discussions with fellow learners",
            href: "/forum",
            icon: MessageCircle,
            color: "text-blue-500",
        },
        {
            title: "About Us",
            description: "Learn about our mission and team",
            href: "/about", // Link to new About Us page
            icon: Info,
            color: "text-green-500",
        },
        {
            title: "Blog",
            description: "Read our latest articles and insights",
            href: "/blog",
            icon: FileText,
            color: "text-purple-500",
        },
        {
            title: "Services",
            description: "Explore our educational services",
            href: "/services",
            icon: Briefcase,
            color: "text-orange-500",
        },
        {
            title: "Support",
            description: "Get help when you need it",
            href: "/support",
            icon: HelpCircle,
            color: "text-red-500",
        },
        {
            title: "Contact",
            description: "Reach out to our team",
            href: "/contact",
            icon: Phone,
            color: "text-cyan-500",
        },
    ]

    return (
        <>
            <header
                className={`fixed top-0 w-full z-50 transition-all duration-300 ${
                    isScrolled ? "bg-background/80 backdrop-blur-md border-b border-border" : "bg-transparent"
                }`}
            >
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-2 group">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:animate-glow transition-all duration-300">
                                <BookOpen className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                CamEdu
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-8">
                            <Link href="/" className="text-foreground hover:text-cyan-600 transition-colors duration-200">
                                Home
                            </Link>
                            <Link href="/courses" className="text-foreground hover:text-cyan-600 transition-colors duration-200">
                                Courses
                            </Link>
                            <DropdownMenu open={isExploreOpen} onOpenChange={setIsExploreOpen}>
                                <DropdownMenuTrigger className="flex items-center gap-1 text-foreground hover:text-cyan-600 transition-all duration-200 hover:scale-105">
                                    Explore
                                    <ChevronDown
                                        className={`w-4 h-4 transition-transform duration-200 ${isExploreOpen ? "rotate-180" : ""}`}
                                    />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-96 p-3 liquid-glass border-0 shadow-2xl">
                                    <div className="grid grid-cols-2 gap-2">
                                        {exploreItems.map((item) => {
                                            const IconComponent = item.icon
                                            return (
                                                <DropdownMenuItem key={item.title} asChild>
                                                    <Link
                                                        href={item.href}
                                                        className="flex flex-col items-start p-4 rounded-xl hover:text-white hover:bg-gradient-to-r hover:from-accent/20 hover:to-accent/10 transition-all duration-300 hover:scale-105 hover:shadow-lg group border border-transparent hover:border-accent/20"
                                                    >
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <IconComponent
                                                                className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform duration-200`}
                                                            />
                                                            <span className="font-semibold text-sm group-hover:text-cyan-600 transition-colors duration-200">
                                                                {item.title}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                                                          {item.description}
                                                        </span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            )
                                        })}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Link href="/pricing" className="text-foreground hover:text-cyan-600 transition-colors duration-200">
                                Partner & Price
                            </Link>
                            <Link href="/contact" className="text-foreground hover:text-cyan-600 transition-colors duration-200">
                                Contact
                            </Link>
                        </nav>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center space-x-4">
                            <ThemeToggle />
                            <Button variant="ghost" className="min-w-0 p-2 border-none rounded-lg bg-transparent hover:bg-transparent" onClick={handleSearch}>
                                <Search className="w-5 h-5" />
                            </Button>

                            {isLoading ? (
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-accent/20" disabled>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </Button>
                            ) : isAuthenticated && user ? (
                                <DropdownMenu open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="border-none !border-medium min-w-0 relative h-10 w-10 rounded-full hover:bg-accent/20">
                                            <UserMenuAvatar
                                                user={user}
                                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                            />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56 mt-2 liquid-glass" align="end" side="bottom"> {/* Glass effect applied */}
                                        <div className="flex items-center justify-start gap-2 p-2">
                                            <div className="flex flex-col space-y-1 leading-none">
                                                <p className="font-medium">{user.name}</p>
                                                <p className="w-[200px] truncate text-sm text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleProfileClick} className="hover:bg-accent/20"> {/* Refined hover */}
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                        </DropdownMenuItem>
                                        {user.role?.code === 'instructor' && ( // Access role.code
                                            <DropdownMenuItem onClick={handleCreateCourseClick} className="hover:bg-accent/20"> {/* Refined hover */}
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                <span>Create Course</span>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => console.log('Settings clicked')} className="hover:bg-accent/20"> {/* Refined hover */}
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Settings</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleShare} className="hover:bg-accent/20"> {/* Refined hover */}
                                            <Share2 className="mr-2 h-4 w-4" />
                                            <span>Share</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleCopy} className="hover:bg-accent/20"> {/* Refined hover */}
                                            <Copy className="mr-2 h-4 w-4" />
                                            <span>Copy Link</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleSignOut} className="hover:bg-red-50 text-red-600"> {/* Refined hover */}
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Sign Out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <>
                                    <Button
                                        onClick={handleGetStartedClick}
                                        className="rounded-full relative bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white px-6 py-2 transition-all duration-300 hover:shadow-lg hover:shadow-orange-400/25 overflow-hidden group"
                                    >
                                        <span className="relative z-10">Get Started</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center space-x-2">
                            <ThemeToggle />
                            <Button
                                variant="ghost"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="hover:bg-accent/20"
                            >
                                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div className="md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border animate-slide-in-up">
                            <nav className="flex flex-col space-y-1 p-4">
                                <Link href="/" className="text-foreground hover:text-cyan-600 transition-colors duration-200 py-2 px-3 rounded-md hover:bg-accent/20">
                                    Home
                                </Link>
                                <Link
                                    href="/courses"
                                    className="text-foreground hover:text-cyan-600 transition-colors duration-200 py-2 px-3 rounded-md hover:bg-accent/20"
                                >
                                    Courses
                                </Link>
                                <div className="space-y-1">
                                    <span className="text-foreground font-medium py-2 px-3">Explore</span>
                                    <div className="pl-4 space-y-1">
                                        {exploreItems.map((item) => {
                                            const IconComponent = item.icon
                                            return (
                                                <Link
                                                    key={item.title}
                                                    href={item.href}
                                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-600 transition-colors duration-200 py-2 px-3 rounded-md"
                                                >
                                                    <IconComponent className={`w-4 h-4 ${item.color}`} />
                                                    {item.title}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                                <Link
                                    href="/pricing"
                                    className="text-foreground hover:text-cyan-600 transition-colors duration-200 py-2 px-3 rounded-md hover:bg-accent/20"
                                >
                                    Partner & Price
                                </Link>
                                <Link
                                    href="/contact"
                                    className="text-foreground hover:text-cyan-600 transition-colors duration-200 py-2 px-3 rounded-md hover:bg-accent/20"
                                >
                                    Contact
                                </Link>
                                <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center p-4">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                                        </div>
                                    ) : isAuthenticated && user ? (
                                        <>
                                            <div className="flex items-center gap-3 p-2 mb-2">
                                                <UserMenuAvatar
                                                    user={user}
                                                    size="sm"
                                                />
                                                <div className="flex flex-col">
                                                    <p className="font-medium text-sm">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                className="rounded-full justify-start hover:bg-accent/20"
                                                onClick={handleProfileClick}
                                            >
                                                <User className="w-4 h-4 mr-2" />
                                                Dashboard
                                            </Button>
                                            {user.role?.code === 'instructor' && ( // Access role.code
                                                <Button
                                                    variant="ghost"
                                                    className="rounded-full justify-start hover:bg-accent/20"
                                                    onClick={handleCreateCourseClick}
                                                >
                                                    <PlusCircle className="w-4 h-4 mr-2" />
                                                    Create Course
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                className="rounded-full justify-start hover:bg-accent/20"
                                                onClick={() => {
                                                    setIsMenuOpen(false)
                                                    // Add settings navigation
                                                }}
                                            >
                                                <Settings className="w-4 h-4 mr-2" />
                                                Settings
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="rounded-full justify-start hover:bg-red-50 text-red-600"
                                                onClick={handleSignOut}
                                            >
                                                <LogOut className="w-4 h-4 mr-2" />
                                                <span>Sign Out</span>
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                onClick={handleGetStartedClick}
                                                className="rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white"
                                            >
                                                Get Started
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </nav>
                        </div>
                    )}
                </div>
            </header>
        </>
    )
}