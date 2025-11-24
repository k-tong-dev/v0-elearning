"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Home,
    BookOpen,
    Users,
    GraduationCap,
    DollarSign,
    Compass,
    Menu,
    X,
    Search,
    Bell,
    User,
    Settings,
    LogOut,
    Share2,
    Copy,
    PlusCircle,
    Sparkles,
    Zap,
    ChevronDown,
    MessageCircle,
    FileText,
    HelpCircle,
    Phone,
    Info,
    Briefcase,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenuAvatar } from "@/components/ui/enhanced-avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AdvancedSearchModal } from "@/components/ui/search/AdvancedSearchModal"
import {Image} from "@heroui/react";

export function HeaderUltra() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading, logout } = useAuth()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [activeHover, setActiveHover] = useState<string | null>(null)
    const headerRef = useRef<HTMLDivElement>(null)

    // Mouse tracking for interactive effects
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (headerRef.current) {
                const rect = headerRef.current.getBoundingClientRect()
                setMousePosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                })
            }
        }
        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [])

    // Scroll detection
    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 20)
        window.addEventListener("scroll", onScroll)
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    // Search keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault()
                setIsSearchOpen(true)
            }
            if (e.key === "Escape") {
                setIsSearchOpen(false)
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [])


    const handleGetStartedClick = () => {
        router.push("/auth/start")
        setIsMenuOpen(false)
    }

    const handleSignOut = async () => {
        try {
            await logout()
            toast.success("Signed out successfully")
            setIsUserMenuOpen(false)
            router.push("/")
        } catch (error) {
            toast.error("Failed to sign out")
        }
    }

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: "NEXT4LEARN",
                    text: "Check out NEXT4LEARN - the best online learning platform!",
                    url: window.location.origin,
                })
                toast.success("Shared successfully!")
            } else {
                await navigator.clipboard.writeText(window.location.origin)
                toast.success("Link copied to clipboard!")
            }
        } catch (error) {
            console.error("Share failed:", error)
        }
        setIsUserMenuOpen(false)
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(window.location.origin)
            toast.success("Link copied to clipboard!")
        } catch (error) {
            toast.error("Failed to copy link")
        }
        setIsUserMenuOpen(false)
    }

    // Navigation items with enhanced metadata
    const navItems = [
        { href: "/", label: "Home", icon: Home, gradient: "from-blue-500 to-cyan-500" },
        { href: "/instructors", label: "Instructors", icon: Users, gradient: "from-orange-500 to-red-500", special: true },
        { href: "/courses", label: "Courses", icon: GraduationCap, gradient: "from-indigo-500 to-purple-500" },
        { href: "/pricing", label: "Pricing", icon: DollarSign, gradient: "from-green-500 to-emerald-500" },
    ]

    // Explorer items
    const exploreItems = [
        {
            title: "About",
            href: "/about",
            description: "Learn about our mission",
            icon: Info,
            gradient: "from-purple-500 to-pink-500",
        },
        {
            title: "Forum",
            href: "/forum",
            description: "Join discussions and connect",
            icon: MessageCircle,
            gradient: "from-blue-500 to-indigo-500",
        },
        {
            title: "Blog",
            href: "/blog",
            description: "Read latest articles",
            icon: FileText,
            gradient: "from-purple-500 to-pink-500",
        },
        {
            title: "Services",
            href: "/services",
            description: "Explore our offerings",
            icon: Zap,
            gradient: "from-orange-500 to-red-500",
        },
        {
            title: "Support",
            href: "/support",
            description: "Get help and answers",
            icon: HelpCircle,
            gradient: "from-indigo-500 to-purple-500",
        },
        {
            title: "Contact",
            href: "/contact",
            description: "Reach out to us",
            icon: Phone,
            gradient: "from-violet-500 to-fuchsia-500",
        },
        {
            title: "Career",
            href: "/career",
            description: "Join our team",
            icon: Briefcase,
            gradient: "from-teal-500 to-cyan-500",
        },
    ]

    return (
        <>
            <header
                ref={headerRef}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                    isScrolled
                        ? "bg-background/95 backdrop-blur-2xl shadow-2xl shadow-black/5"
                        : "bg-transparent"
                }`}
            >
                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Dynamic gradient orbs */}
                    <motion.div
                        className="absolute -left-32 -top-32 h-96 w-96 rounded-full blur-3xl opacity-30"
                        style={{
                            background: "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)",
                        }}
                        animate={{
                            x: [0, mousePosition.x * 0.05, 0],
                            y: [0, mousePosition.y * 0.05, 0],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    <motion.div
                        className="absolute -right-32 top-0 h-80 w-80 rounded-full blur-3xl opacity-30"
                        style={{
                            background: "radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, transparent 70%)",
                        }}
                        animate={{
                            x: [0, mousePosition.x * -0.03, 0],
                            y: [0, mousePosition.y * 0.03, 0],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 15,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    {/* Shimmer effect */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{
                            x: ["-100%", "200%"],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo Section */}
                        <Link
                            href="/"
                            className="flex items-center space-x-3 group relative z-10"
                            onMouseEnter={() => setActiveHover("logo")}
                            onMouseLeave={() => setActiveHover(null)}
                        >
                            <motion.div
                                className="relative"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <div className="relative w-12 h-12 flex items-center justify-center ">
                                    <Image src="/logoNoBg.png" alt="Logo with text" className={"rounded-none"}/>
                                </div>
                            </motion.div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-3">
                            {navItems.map((item, index) => {
                                const Icon = item.icon
                                const isActive = activeHover === item.href

                                return (
                                    <motion.div
                                        key={item.href}
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Link
                                            href={item.href}
                                            className="relative flex group px-4 py-2.5 rounded-xl transition-all duration-300 overflow-visible"
                                            onMouseEnter={() => setActiveHover(item.href)}
                                            onMouseLeave={() => setActiveHover(null)}
                                        >
                                            {/* Hover background - only covers text area, no blur to prevent overflow */}
                                            <motion.div
                                                className={`absolute left-2 right-2 top-2 bottom-2 bg-gradient-to-r ${item.gradient} rounded-md`}
                                                initial={{ opacity: 0 }}
                                                animate={{
                                                    opacity: isActive ? 0.12 : 0,
                                                }}
                                                transition={{ 
                                                    duration: 0.4,
                                                    ease: [0.4, 0, 0.2, 1] // cubic-bezier for smooth easing
                                                }}
                                            />

                                            {/* Content */}
                                            <motion.span 
                                                className="relative z-10 flex items-center gap-2 text-sm font-semibold"
                                                animate={{
                                                    color: isActive ? undefined : undefined,
                                                }}
                                                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                            >
                                                {Icon && (
                                                    <motion.div
                                                        animate={{
                                                            scale: isActive ? 1.1 : 1,
                                                        }}
                                                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                    </motion.div>
                                                )}
                                                <span className={isActive ? "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400" : "text-foreground"}>
                                                    {item.label}
                                                </span>
                                            </motion.span>

                                            {/* Bottom indicator - horizontal bar at bottom */}
                                            <motion.div
                                                className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r ${item.gradient} rounded-full`}
                                                animate={{
                                                    width: isActive ? "80%" : "0%",
                                                }}
                                                transition={{ 
                                                    duration: 0.4,
                                                    ease: [0.4, 0, 0.2, 1] // smooth cubic-bezier easing
                                                }}
                                            />

                                            {/* Special sparkle effect for special items */}
                                            {item.special && isActive && (
                                                <motion.div
                                                    className="absolute -top-1 -right-1 z-20"
                                                    animate={{
                                                        rotate: [0, 360],
                                                        scale: [1, 1.2, 1],
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                    }}
                                                >
                                                    <Sparkles className="w-4 h-4 text-yellow-400 drop-shadow-lg" />
                                                </motion.div>
                                            )}
                                        </Link>
                                    </motion.div>
                                )
                            })}

                            {/* Explorers Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <motion.button
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 dark:hover:from-blue-400 dark:hover:to-purple-400 transition-all duration-300 relative group"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <motion.div
                                            animate={{ rotate: [0, 360] }}
                                            transition={{
                                                duration: 20,
                                                repeat: Infinity,
                                                ease: "linear",
                                            }}
                                        >
                                            <Compass className="w-4 h-4" />
                                        </motion.div>
                                        <span>Explorers</span>
                                        <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </motion.button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="start"
                                    className="w-80 p-3 mt-2 rounded-2xl border-0 backdrop-blur-2xl bg-background/95 shadow-2xl"
                                >
                                    <div className="grid grid-cols-2 gap-2">
                                        {exploreItems.map((item) => {
                                            const Icon = item.icon
                                            return (
                                                <Link
                                                    key={item.title}
                                                    href={item.href}
                                                    className="group relative p-3 rounded-xl border border-border/50 hover:border-transparent transition-all duration-300 overflow-hidden"
                                                >
                                                    {/* Gradient background on hover */}
                                                    <motion.div
                                                        className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-20 rounded-xl`}
                                                        transition={{ duration: 0.3 }}
                                                    />
                                                    {/* Content */}
                                                    <div className="relative z-10">
                                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300`}>
                                                            <Icon className="w-5 h-5 text-white" />
                                                        </div>
                                                        <h3 className="text-sm font-semibold text-foreground mb-0.5">
                                                            {item.title}
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </nav>

                        {/* Right Section */}
                        <div className="flex items-center gap-3">
                            {/* Search Button */}
                            <motion.button
                                onClick={() => setIsSearchOpen(true)}
                                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 bg-background/50 backdrop-blur-xl relative overflow-hidden group"
                                whileHover={{ 
                                    scale: 1.05,
                                    // backgroundColor: "rgba(var(--background), 0.8)"
                                }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ 
                                    duration: 0.3,
                                    ease: [0.4, 0, 0.2, 1]
                                }}
                            >
                                <Search className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                <span className="text-sm text-muted-foreground group-hover:text-foreground">Search...</span>
                                <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-xs font-medium text-muted-foreground">
                                    ⌘K
                                </kbd>
                            </motion.button>

                            {/* Theme Toggle */}
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <ThemeToggle />
                            </motion.div>

                            {/* Notifications */}
                            <motion.button
                                onClick={() => {
                                    if (typeof window !== "undefined" && window.location.pathname.includes("/dashboard")) {
                                        window.dispatchEvent(new CustomEvent("openNotificationSidebar"))
                                    }
                                }}
                                className="relative p-2.5 rounded-xl border border-border/50 bg-background/50 backdrop-blur-xl group"
                                whileHover={{ 
                                    scale: 1.1, 
                                    rotate: 5,
                                    // backgroundColor: "rgba(var(--background), 0.8)"
                                }}
                                whileTap={{ scale: 0.9 }}
                                transition={{ 
                                    duration: 0.3,
                                    ease: [0.4, 0, 0.2, 1]
                                }}
                            >
                                <Bell className="w-5 h-5 text-foreground group-hover:text-blue-500 transition-colors" />
                                <motion.span
                                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-xs font-bold text-white shadow-lg"
                                    animate={{
                                        scale: [1, 1.2, 1],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                >
                                    3
                                </motion.span>
                            </motion.button>

                            {/* User Menu / Get Started */}
                            {isLoading ? (
                                <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
                            ) : isAuthenticated && user ? (
                                <DropdownMenu open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
                                    <DropdownMenuTrigger asChild>
                                        <motion.button
                                            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-background/50 backdrop-blur-xl hover:bg-background/80 transition-all duration-300 group"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5">
                                                <div className="w-full h-full rounded-lg bg-background flex items-center justify-center">
                                                    <UserMenuAvatar user={user} />
                                                </div>
                                            </div>
                                            <div className="hidden sm:block text-left">
                                                <p className="text-sm font-semibold text-foreground leading-tight">
                                                    {user?.username || "User"}
                                                </p>
                                                <p className="text-xs text-muted-foreground leading-tight">
                                                    {user?.email?.split("@")[0] || "user"}
                                                </p>
                                            </div>
                                        </motion.button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-56 mt-2 rounded-2xl border-0 backdrop-blur-2xl bg-background/95 shadow-2xl"
                                    >
                                        <div className="p-3 border-b border-border">
                                            <p className="font-semibold text-sm text-foreground">{user.username}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => {
                                                router.push("/dashboard")
                                                setIsUserMenuOpen(false)
                                            }}
                                            className="rounded-lg"
                                        >
                                            <User className="mr-2 h-4 w-4" />
                                            Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                router.push("/dashboard?tab=my-courses&create=true")
                                                setIsUserMenuOpen(false)
                                            }}
                                            className="rounded-lg"
                                        >
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Create Course
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                console.log("Settings clicked")
                                                setIsUserMenuOpen(false)
                                            }}
                                            className="rounded-lg"
                                        >
                                            <Settings className="mr-2 h-4 w-4" />
                                            Settings
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleShare} className="rounded-lg">
                                            <Share2 className="mr-2 h-4 w-4" />
                                            Share
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleCopy} className="rounded-lg">
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy Link
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={handleSignOut}
                                            className="rounded-lg text-red-500 focus:text-red-500"
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Sign Out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        onClick={handleGetStartedClick}
                                        className="rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 py-2.5 font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 relative overflow-hidden group"
                                    >
                                        <span className="relative z-10">Get Started</span>
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
                                            animate={{
                                                x: ["-100%", "100%"],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "linear",
                                            }}
                                        />
                                    </Button>
                                </motion.div>
                            )}

                            {/* Mobile Menu Button */}
                            <motion.button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="lg:hidden p-2 rounded-xl border border-border/50 bg-background/50 backdrop-blur-xl hover:bg-background/80 transition-all duration-300"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <AnimatePresence mode="wait">
                                    {isMenuOpen ? (
                                        <motion.div
                                            key="close"
                                            initial={{ rotate: -90, opacity: 0 }}
                                            animate={{ rotate: 0, opacity: 1 }}
                                            exit={{ rotate: 90, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <X className="w-5 h-5" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="menu"
                                            initial={{ rotate: 90, opacity: 0 }}
                                            animate={{ rotate: 0, opacity: 1 }}
                                            exit={{ rotate: -90, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Menu className="w-5 h-5" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.nav
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="lg:hidden overflow-hidden"
                            >
                                <div className="py-4 space-y-2 border-t border-border/50 mt-2">
                                    {navItems.map((item, index) => {
                                        const Icon = item.icon
                                        return (
                                            <motion.div
                                                key={item.href}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                                                        item.special
                                                            ? "bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-600 dark:text-orange-400"
                                                            : "hover:bg-muted text-foreground"
                                                    }`}
                                                >
                                                    {Icon && <Icon className="w-5 h-5" />}
                                                    {item.label}
                                                </Link>
                                            </motion.div>
                                        )
                                    })}
                                    <div className="pt-2 border-t border-border/50">
                                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                            Explorers
                                        </div>
                                        <div className="space-y-1">
                                            {exploreItems.map((item, index) => {
                                                const Icon = item.icon
                                                return (
                                                    <motion.div
                                                        key={item.title}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: (navItems.length + index) * 0.05 }}
                                                    >
                                                        <Link
                                                            href={item.href}
                                                            onClick={() => setIsMenuOpen(false)}
                                                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300"
                                                        >
                                                            <Icon className="w-4 h-4" />
                                                            {item.title}
                                                        </Link>
                                                    </motion.div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </motion.nav>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Advanced Search Modal */}
            <AdvancedSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </>
    )
}

