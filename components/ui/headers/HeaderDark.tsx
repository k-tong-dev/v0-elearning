"use client"

import {
    Bell,
    Settings,
    BookOpen,
    Menu,
    X,
    User,
    LogOut,
    Share2,
    Copy,
    Loader2,
    PlusCircle,
    Home,
    GraduationCap,
    Compass,
    DollarSign,
    Users,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenuAvatar } from "@/components/ui/enhanced-avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { motion } from "framer-motion"

export function HeaderDark() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading, logout } = useAuth()
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(false)
    const headerRef = useRef<HTMLDivElement>(null)

    /* ---------- Mouse liquid effect ---------- */
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

    /* ---------- Scroll → fixed header ---------- */
    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 12)
        window.addEventListener("scroll", onScroll)
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    /* ---------- Detect dark mode ---------- */
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'))
        }
        checkDarkMode()
        const observer = new MutationObserver(checkDarkMode)
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        })
        return () => observer.disconnect()
    }, [])

    const handleGetStartedClick = () => {
        router.push("/auth/start")
        setIsMenuOpen(false)
    }

    const handleSignOut = async () => {
        try {
            await logout()
            toast.success("Signed out successfully", { position: "top-center" })
            setIsUserMenuOpen(false)
            setIsMenuOpen(false)
            router.push("/")
        } catch (error) {
            console.error("Sign out failed:", error)
            toast.error("Failed to sign out", { position: "top-center" })
        }
    }

    const handleProfileClick = () => {
        router.push("/dashboard")
        setIsUserMenuOpen(false)
        setIsMenuOpen(false)
    }

    const handleCreateCourseClick = () => {
        router.push("/dashboard?tab=my-courses&create=true")
        setIsUserMenuOpen(false)
        setIsMenuOpen(false)
    }

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: "CamEducation",
                    text: "Check out CamEducation - the best online learning platform!",
                    url: window.location.origin,
                })
                toast.success("Shared successfully!")
            } else {
                await navigator.clipboard.writeText(window.location.origin)
                toast.success("Link copied to clipboard!")
            }
        } catch (error) {
            console.error("Share failed:", error)
            toast.error("Failed to share")
        }
        setIsUserMenuOpen(false)
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(window.location.origin)
            toast.success("Link copied to clipboard!")
        } catch (error) {
            console.error("Copy failed:", error)
            toast.error("Failed to copy link")
        }
        setIsUserMenuOpen(false)
    }

    /* ---------- Explore items with card-style ---------- */
    const exploreItems = [
        { 
            title: "Forum", 
            href: "/forum",
            description: "Join discussions and connect with learners",
            icon: "💬",
            gradient: "from-blue-500 to-indigo-500"
        },
        { 
            title: "About Us", 
            href: "/about",
            description: "Learn about our mission and values",
            icon: "🏢",
            gradient: "from-purple-500 to-pink-500"
        },
        { 
            title: "Blog", 
            href: "/blog",
            description: "Read latest articles and updates",
            icon: "📝",
            gradient: "from-purple-500 to-pink-500"
        },
        { 
            title: "Services", 
            href: "/services",
            description: "Explore our comprehensive offerings",
            icon: "⚡",
            gradient: "from-orange-500 to-red-500"
        },
        { 
            title: "Support", 
            href: "/support",
            description: "Get help and find answers",
            icon: "🛟",
            gradient: "from-indigo-500 to-purple-500"
        },
        { 
            title: "Contact", 
            href: "/contact",
            description: "Reach out to our team",
            icon: "📧",
            gradient: "from-violet-500 to-fuchsia-500"
        },
    ]

    return (
        <header
            ref={headerRef}
            className={`
        left-0 right-0 z-50 overflow-hidden
        transition-all duration-300
        ${
                isScrolled
                    ? "fixed top-0 backdrop-blur-xl border-b shadow-lg"
                    : "absolute top-0 backdrop-blur-xl border-b"
            }
        ${isScrolled 
            ? "bg-transparent dark:bg-slate-950/95 border-transparent dark:border-blue-800/30" 
            : "bg-transparent dark:bg-slate-950/80 border-transparent dark:border-blue-800/20"
        }
      `}
            style={{
                boxShadow: isScrolled 
                    ? "0 8px 32px rgba(0, 0, 0, 0.05), 0 1px 0 rgba(0, 0, 0, 0.05)"
                    : "none",
            }}
        >
            {/* ---- Liquid blobs ---- */}
            <div className="pointer-events-none absolute inset-0">
                <div
                    className="absolute -left-20 -top-20 h-96 w-96 animate-[blob_12s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-purple-600/30 via-violet-600/20 to-transparent dark:from-purple-600/30 dark:via-violet-600/20 blur-3xl"
                    style={{
                        transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
                        transition: "transform .3s cubic-bezier(.4,0,.2,1)",
                    }}
                />
                <div
                    className="absolute -right-20 top-0 h-80 w-80 animate-[blob_10s_ease-in-out_infinite_2s] rounded-full bg-gradient-to-bl from-blue-500/30 via-purple-600/20 to-transparent dark:from-blue-500/30 dark:via-purple-600/20 blur-3xl"
                    style={{
                        transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * 0.015}px)`,
                        transition: "transform .3s cubic-bezier(.4,0,.2,1)",
                    }}
                />
                <div
                    className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-[blob_15s_ease-in-out_infinite_4s] rounded-full bg-gradient-to-tr from-fuchsia-600/20 via-pink-600/15 to-transparent dark:from-fuchsia-600/20 dark:via-pink-600/15 blur-3xl"
                    style={{
                        transform: `translate(calc(-50% + ${mousePosition.x * 0.01}px), calc(-50% + ${mousePosition.y * 0.01}px))`,
                        transition: "transform .3s cubic-bezier(.4,0,.2,1)",
                    }}
                />
            </div>

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent dark:via-white/5 via-gray-900/5 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />

            <div className="relative mx-auto max-w-7xl px-6 py-2">
                <div className="flex items-center justify-between gap-8">
                    {/* ---- LEFT: LOGO + NAME ---- */}
                    <Link href="/" className="flex items-center space-x-2 group flex-shrink-0">
                        <motion.div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center relative overflow-hidden"
                            style={{
                                background: "linear-gradient(135deg, rgba(59,130,246,.9) 0%, rgba(147,51,234,.9) 100%)",
                                boxShadow: "0 4px 16px rgba(59,130,246,.3), inset 0 1px 0 rgba(255,255,255,.3)",
                            }}
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                            <BookOpen className="w-5 h-5 text-white relative z-10" />
                            <motion.div
                                className="absolute inset-0"
                                style={{ background: "linear-gradient(135deg, rgba(255,255,255,.3) 0%, transparent 100%)" }}
                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                            />
                        </motion.div>
                        <span
                            className="text-xl font-bold text-slate-900 dark:bg-gradient-to-r dark:from-blue-400 dark:via-purple-400 dark:to-blue-400 dark:bg-clip-text dark:text-transparent"
                            style={{ backgroundSize: "200% auto", animation: "gradient-shift 3s ease infinite" }}
                        >
                          CamEdu
                        </span>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-2">
                        {[
                            { href: "/", label: "Home", icon: Home },
                            { href: "/about", label: "About", icon: null },
                            { href: "/instructors", label: "Instructors", icon: Users, special: true },
                            { href: "/courses", label: "Courses", icon: GraduationCap },
                            { href: "/pricing", label: "Pricing", icon: DollarSign },
                            { href: "/career", label: "Career", icon: null },
                        ].map((item) => {
                            const Icon = item.icon
                            const isSpecial = item.special
                            
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="relative group px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 overflow-hidden"
                                >
                                    {/* Background gradient on hover */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        whileHover={{ scale: 1.05 }}
                                    />
                                    
                                    {/* Special glow effect for Instructors */}
                                    {isSpecial && (
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 dark:from-blue-500/30 dark:via-purple-500/30 dark:to-pink-500/30 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                            animate={{
                                                opacity: [0, 0.3, 0],
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                            }}
                                        />
                                    )}
                                    
                                    {/* Content */}
                                    <span className="relative z-10 flex items-center gap-2 text-slate-900 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                                        {Icon && <Icon className="w-4 h-4" />}
                                        {item.label}
                                    </span>
                                    
                                    {/* Underline animation */}
                                    <motion.div
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
                                        initial={{ scaleX: 0 }}
                                        whileHover={{ scaleX: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </Link>
                            )
                        })}

                        {/* Explorers Dropdown - Elegant Vertical List Style */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-900 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100/50 dark:hover:bg-blue-950/20 transition-all duration-200 group">
                                    <Compass className="h-4 w-4 transition-transform group-hover:rotate-12" />
                                    <span>Explorers</span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="start"
                                className="w-[320px] p-2 mt-2 rounded-xl border-0 min-w-[280px]"
                                style={isDarkMode ? {
                                    background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)",
                                    backdropFilter: "blur(20px) saturate(180%)",
                                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                                    border: "1px solid rgba(103, 232, 249, 0.2)",
                                    boxShadow: "0 8px 32px rgba(103, 232, 249, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                                } : {
                                    background: "rgba(255, 255, 255, 0.9)",
                                    backdropFilter: "blur(20px) saturate(180%)",
                                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                                    border: "1px solid rgba(148, 163, 184, 0.2)",
                                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
                                }}
                            >
                                <div className="space-y-1">
                                    {exploreItems.map((item, idx) => (
                                        <Link
                                            key={item.title}
                                            href={item.href}
                                            className="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-slate-100 dark:hover:bg-gradient-to-r dark:hover:from-blue-950/30 dark:hover:to-purple-950/30"
                                            style={{
                                                border: "1px solid transparent",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = "rgba(8, 145, 178, 0.2)"
                                                e.currentTarget.style.boxShadow = "0 2px 8px rgba(8, 145, 178, 0.1)"
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = "transparent"
                                                e.currentTarget.style.boxShadow = "none"
                                            }}
                                        >
                                            {/* Icon with gradient background */}
                                            <div 
                                                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center text-lg shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-200 flex-shrink-0`}
                                            >
                                                {item.icon}
                                            </div>
                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {item.title}
                                                </h3>
                                                <p className="text-xs text-slate-600 dark:text-gray-400 leading-tight mt-0.5 line-clamp-1">
                                                    {item.description}
                                                </p>
                                            </div>
                                            {/* Arrow indicator */}
                                            <motion.div
                                                className="opacity-0 group-hover:opacity-100 text-blue-600 dark:text-blue-400 flex-shrink-0"
                                                initial={{ x: -4, opacity: 0 }}
                                                whileHover={{ x: 0, opacity: 1 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </motion.div>
                                        </Link>
                                    ))}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </nav>

                    {/* ---- RIGHT: ICONS + USER MENU ---- */}
                    <div className="flex items-center gap-3 ml-auto">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <ThemeToggle />
                        </motion.div>

                        {/* Notification - Ultra Creative Design */}
                        <motion.button 
                            onClick={() => {
                                // Check if we're in dashboard, if so trigger notification sidebar
                                if (typeof window !== 'undefined' && window.location.pathname.includes('/dashboard')) {
                                    // Dispatch custom event that dashboard can listen to
                                    window.dispatchEvent(new CustomEvent('openNotificationSidebar'))
                                }
                            }}
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative rounded-2xl border-2 border-border/50 dark:border-slate-700/50 bg-gradient-to-br from-background/80 to-muted/40 dark:from-slate-900/80 dark:to-slate-800/40 backdrop-blur-xl p-2.5 transition-all duration-300 hover:border-primary/50 dark:hover:border-blue-500/50 hover:shadow-xl hover:shadow-primary/20 dark:hover:shadow-blue-500/20 overflow-hidden"
                        >
                            {/* Animated background */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20"
                                animate={{
                                    backgroundPosition: ["0% 0%", "100% 100%"],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                    ease: "easeInOut",
                                }}
                                style={{
                                    backgroundSize: "200% 200%",
                                }}
                            />
                            
                            <Bell className="h-5 w-5 text-foreground dark:text-gray-300 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors relative z-10" />
                            
                            {/* Notification badge with pulse animation */}
                            <motion.span 
                                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-red-500 dark:from-red-600 dark:via-pink-600 dark:to-red-600 text-xs font-bold text-white shadow-lg shadow-red-500/50 dark:shadow-red-600/50 relative z-10"
                                animate={{
                                    scale: [1, 1.1, 1],
                                    boxShadow: [
                                        "0 0 0 0 rgba(239, 68, 68, 0.7)",
                                        "0 0 0 8px rgba(239, 68, 68, 0)",
                                        "0 0 0 0 rgba(239, 68, 68, 0)",
                                    ],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeOut",
                                }}
                            >
                                3
                            </motion.span>
                        </motion.button>

                        {/* USER MENU / GET STARTED */}
                        {isLoading ? (
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full" disabled>
                                <Loader2 className="w-4 h-4 animate-spin text-gray-300 dark:text-gray-300" />
                            </Button>
                        ) : isAuthenticated && user ? (
                            <DropdownMenu open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
                                <DropdownMenuTrigger className="w-fit">
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <div className="group relative">
                                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/30 to-blue-500/30 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                                            <div className="relative flex items-center gap-3 rounded-2xl border border-white/10 dark:border-white/10 border-gray-300/50 bg-white/5 dark:bg-white/5 bg-gray-100/80 py-2 pl-3 pr-4 backdrop-blur-xl transition-all duration-300 group-hover:border-white/20 dark:group-hover:border-white/20 group-hover:border-gray-400/50 group-hover:bg-white/10 dark:group-hover:bg-white/10 group-hover:bg-gray-200/80">
                                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 via-violet-500 to-blue-500 shadow-lg shadow-purple-500/30 flex items-center justify-center">
                                                    <UserMenuAvatar user={user} />
                                                </div>
                                                <div className="hidden sm:block text-left">
                                                    <p className="text-sm font-semibold dark:text-white text-gray-900 leading-tight">
                                                        {user?.username || "User"}
                                                    </p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-400 text-gray-600 leading-tight">
                                                        {user?.email || "user@example.com"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    side="bottom"
                                    className="w-56 mt-2 border-0"
                                    style={{
                                        backdropFilter: "blur(20px) saturate(180%)",
                                        WebkitBackdropFilter: "blur(20px) saturate(180%)",
                                        boxShadow: "0 8px 32px 0 rgba(0,0,0,.1), inset 0 1px 0 0 rgba(255,255,255,.5)",
                                        borderRadius: "16px",
                                    }}
                                >
                                    <div className="flex items-center justify-start gap-2 p-3">
                                        <div className="flex flex-col space-y-1 leading-none">
                                            <p className="font-medium text-sm dark:text-white text-gray-900">{user.username}</p>
                                            <p className="w-[200px] truncate text-xs dark:text-gray-400 text-gray-600">{user.email}</p>
                                        </div>
                                    </div>
                                    <DropdownMenuSeparator className="bg-white/10 dark:bg-white/10 bg-gray-300/50" />
                                    <DropdownMenuItem
                                        onClick={handleProfileClick}
                                        className="rounded-lg mx-1 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900"
                                    >
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleCreateCourseClick}
                                        className="rounded-lg mx-1 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900"
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        <span>Create Course</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => console.log("Settings clicked")}
                                        className="rounded-lg mx-1 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900"
                                    >
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/10 dark:bg-white/10 bg-gray-300/50" />
                                    <DropdownMenuItem
                                        onClick={handleShare}
                                        className="rounded-lg mx-1 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900"
                                    >
                                        <Share2 className="mr-2 h-4 w-4" />
                                        <span>Share</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleCopy}
                                        className="rounded-lg mx-1 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900"
                                    >
                                        <Copy className="mr-2 h-4 w-4" />
                                        <span>Copy Link</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/10 dark:bg-white/10 bg-gray-300/50" />
                                    <DropdownMenuItem
                                        onClick={handleSignOut}
                                        className="rounded-lg mx-1 hover:bg-red-500/20 text-red-400 dark:text-red-400 text-red-600 hover:text-red-300 dark:hover:text-red-300 hover:text-red-700"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Sign Out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    onClick={handleGetStartedClick}
                                    className="rounded-lg relative text-white px-6 py-2 text-sm font-semibold transition-all duration-300 border-0 overflow-hidden shadow-lg shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/50"
                                    style={{
                                        background: "linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)",
                                    }}
                                >
                                    <span className="relative z-10">Get Started</span>
                                </Button>
                            </motion.div>
                        )}
                    </div>

                    {/* ---- MOBILE HAMBURGER ---- */}
                    <div className="flex lg:hidden items-center space-x-2">
                        <Button
                            variant="ghost"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="rounded-xl p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200/80 dark:hover:bg-white/10"
                        >
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>

                {/* ---- MOBILE MENU ---- */}
                {isMenuOpen && (
                    <motion.nav
                        className="lg:hidden mt-4 rounded-2xl overflow-hidden border border-gray-200/50 dark:border-white/10 p-4 space-y-2"
                        style={{
                            backdropFilter: "blur(20px) saturate(180%)",
                            WebkitBackdropFilter: "blur(20px) saturate(180%)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                        }}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25 }}
                    >
                        <Link
                            href="/"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 rounded-lg"
                        >
                            <Home className="h-4 w-4" /> Home
                        </Link>
                        <Link
                            href="/about"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 rounded-lg"
                        >
                            About
                        </Link>
                        <Link
                            href="/instructors"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:via-purple-500/10 hover:to-pink-500/10 dark:hover:bg-white/10 rounded-lg transition-all duration-300 relative group"
                        >
                            <Users className="w-4 h-4 text-blue-500 group-hover:text-purple-500 transition-colors" />
                            <span className="relative z-10 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
                                Instructors
                            </span>
                        </Link>
                        <Link
                            href="/courses"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 rounded-lg"
                        >
                            <GraduationCap className="h-4 w-4" /> Courses
                        </Link>
                        <Link
                            href="/career"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 rounded-lg"
                        >
                            Career
                        </Link>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                                <Compass className="h-4 w-4" /> Explorers
                            </div>
                            <div className="pl-6 space-y-1">
                                {exploreItems.map((item) => (
                                    <Link
                                        key={item.title}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 rounded-lg"
                                    >
                                        {item.title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </motion.nav>
                )}
            </div>

            {/* ---- CSS animations ---- */}
            <style jsx>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes gradient-shift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
            `}</style>
        </header>
    )
}
