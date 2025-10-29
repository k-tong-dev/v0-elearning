"use client"

import {
    Bell,
    Search,
    Settings,
    BookOpen,
    Menu,
    X,
    MessageCircle,
    Info,
    FileText,
    Briefcase,
    HelpCircle,
    Phone,
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
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { motion } from "framer-motion"

export function HeaderDark() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading, logout } = useAuth()
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
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

    /* ---------- All your original handlers (unchanged) ---------- */
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

    const handleSearch = () => {
        console.log("[v0] Search button clicked from header")
    }

    /* ---------- Explore items (your original data) ---------- */
    const exploreItems = [
        { title: "Forum", description: "Join discussions with fellow learners", href: "/forum", icon: MessageCircle, color: "text-blue-400" },
        { title: "About Us", description: "Learn about our mission and team", href: "/about", icon: Info, color: "text-green-400" },
        { title: "Blog", description: "Read our latest articles and insights", href: "/blog", icon: FileText, color: "text-purple-400" },
        { title: "Services", description: "Explore our educational services", href: "/services", icon: Briefcase, color: "text-orange-400" },
        { title: "Support", description: "Get help when you need it", href: "/support", icon: HelpCircle, color: "text-red-400" },
        { title: "Contact", description: "Reach out to our team", href: "/contact", icon: Phone, color: "text-cyan-400" },
    ]

    return (
        <header
            ref={headerRef}
            className={`
                left-0 right-0 z-50 overflow-hidden
                transition-all duration-300
                ${isScrolled
                ? "fixed top-0 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b dark:border-white/10 border-gray-200/50 shadow-lg"
                : "absolute top-0 bg-white/10 dark:bg-black/40 backdrop-blur-2xl border-b dark:border-white/5 border-gray-200/50"
            }
            `}
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
                    className="absolute -right-20 top-0 h-80 w-80 animate-[blob_10s_ease-in-out_infinite_2s] rounded-full bg-gradient-to-bl from-cyan-500/30 via-blue-600/20 to-transparent dark:from-cyan-500/30 dark:via-blue-600/20 blur-3xl"
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

            {/* ---- Shimmer ---- */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent dark:via-white/5 via-gray-900/5 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />

            <div className="relative mx-auto max-w-7xl px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* ---- Logo ---- */}
                    <Link href="/" className="flex items-center space-x-2 group">
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
                            className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 dark:from-blue-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent"
                            style={{ backgroundSize: "200% auto", animation: "gradient-shift 3s ease infinite" }}
                        >
                            CamEdu
                        </span>
                    </Link>

                    {/* ---- CENTER SEARCH (kept on lg+ and md) ---- */}
                    <div className="hidden md:block flex-1 max-w-md mx-8">
                        <div className="group relative">
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                            <div className="relative flex items-center gap-3 rounded-2xl border dark:border-white/10 border-gray-200/80 dark:bg-white/5 bg-gray-100/20 px-4 py-2.5 backdrop-blur-xl transition-all duration-300 dark:group-hover:border-white/20 group-hover:border-gray-400/50 dark:group-hover:bg-white/10 group-hover:bg-gray-200/80">
                                <Search className="h-4 w-4 dark:text-gray-400 text-gray-600 transition-colors dark:group-hover:text-gray-300 group-hover:text-gray-900" />
                                <input
                                    type="text"
                                    placeholder="Search anything..."
                                    className="flex-1 bg-transparent text-sm dark:text-white text-gray-900 dark:placeholder-gray-500 placeholder-gray-400 outline-none"
                                />
                                <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border dark:border-white/10 border-gray-300/50 dark:bg-white/5 bg-gray-200/50 px-1.5 text-xs font-medium dark:text-gray-400 text-gray-600">
                                    Command K
                                </kbd>
                            </div>
                        </div>
                    </div>

                    {/* ---- RIGHT ICONS + USER MENU (lg+ only) ---- */}
                    <div className="hidden lg:flex items-center gap-2">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <ThemeToggle />
                        </motion.div>

                        {/* Notification */}
                        <button className="group relative rounded-xl border border-white/10 dark:border-white/10 border-gray-300/50 bg-white/5 dark:bg-white/5 bg-gray-100/80 p-2.5 backdrop-blur-xl transition-all duration-300 hover:border-white/20 dark:hover:border-white/20 hover:border-gray-400/50 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 hover:scale-105">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 opacity-0 blur transition-opacity duration-300 group-hover:opacity-100" />
                            <Bell className="relative h-5 w-5 text-gray-300 dark:text-gray-300 text-gray-700 transition-colors group-hover:text-white dark:group-hover:text-white group-hover:text-gray-900" />
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-xs font-bold text-white shadow-lg shadow-purple-500/50">
                                3
                            </span>
                        </button>

                        {/* Settings Dropdown */}
                        <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                            <DropdownMenuTrigger asChild>
                                <button className="group relative rounded-xl border border-white/10 dark:border-white/10 border-gray-300/50 bg-white/5 dark:bg-white/5 bg-gray-100/80 p-2.5 backdrop-blur-xl transition-all duration-300 hover:border-white/20 dark:hover:border-white/20 hover:border-gray-400/50 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 hover:scale-105">
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 opacity-0 blur transition-opacity duration-300 group-hover:opacity-100" />
                                    <Settings className="relative h-5 w-5 text-gray-300 dark:text-gray-300 text-gray-700 transition-colors group-hover:text-white dark:group-hover:text-white group-hover:text-gray-900" />
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="end"
                                side="bottom"
                                className="w-64 mt-2 border-0"
                                style={{
                                    backdropFilter: "blur(20px) saturate(180%)",
                                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                                    boxShadow: "0 8px 32px 0 rgba(0,0,0,.1), inset 0 1px 0 0 rgba(255,255,255,.5)",
                                    borderRadius: "16px",
                                }}
                            >
                                <div className="px-2 py-2">
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-2 mb-2">
                                        NAVIGATION
                                    </p>

                                    <DropdownMenuItem asChild>
                                        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-200/80 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => setIsSettingsOpen(false)}>
                                            <Home className="h-4 w-4" />
                                            <span>Home</span>
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem asChild>
                                        <Link href="/courses" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-200/80 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => setIsSettingsOpen(false)}>
                                            <GraduationCap className="h-4 w-4" />
                                            <span>Courses</span>
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-200/80 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
                                            <Compass className="h-4 w-4" />
                                            <span>Explore</span>
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent
                                                className="w-72 p-2 border dark:border-white/10 border-gray-300/50"
                                                sideOffset={8}
                                                style={{
                                                    backdropFilter: "blur(20px) saturate(180%)",
                                                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                                                    boxShadow: "0 8px 32px 0 rgba(0,0,0,.1), inset 0 1px 0 0 rgba(255,255,255,.5)",
                                                    borderRadius: "16px",
                                                    background: "rgba(255,255,255,.95) dark:rgba(0,0,0,.95)",
                                                }}
                                            >
                                                {exploreItems.map((item) => {
                                                    const Icon = item.icon
                                                    return (
                                                        <DropdownMenuItem key={item.title} asChild>
                                                            <Link
                                                                href={item.href}
                                                                className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-200/80 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                                                onClick={() => setIsSettingsOpen(false)}
                                                            >
                                                                <Icon className={`h-5 w-5 ${item.color} mt-0.5 flex-shrink-0`} />
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</span>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.description}</span>
                                                                </div>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )
                                                })}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>

                                    <DropdownMenuItem asChild>
                                        <Link href="/pricing" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-200/80 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => setIsSettingsOpen(false)}>
                                            <DollarSign className="h-4 w-4" />
                                            <span>Partner & Price</span>
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem asChild>
                                        <Link href="/contact" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-200/80 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => setIsSettingsOpen(false)}>
                                            <Phone className="h-4 w-4" />
                                            <span>Contact</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* USER MENU / GET STARTED */}
                        {isLoading ? (
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full" disabled>
                                <Loader2 className="w-4 h-4 animate-spin text-gray-300 dark:text-gray-300" />
                            </Button>
                        ) : isAuthenticated && user ? (
                            <DropdownMenu open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
                                <DropdownMenuTrigger className="w-fit">
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <div className="group relative ml-2">
                                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/30 to-cyan-500/30 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                                            <div className="relative flex items-center gap-3 rounded-2xl border border-white/10 dark:border-white/10 border-gray-300/50 bg-white/5 dark:bg-white/5 bg-gray-100/80 py-2 pl-3 pr-4 backdrop-blur-xl transition-all duration-300 group-hover:border-white/20 dark:group-hover:border-white/20 group-hover:border-gray-400/50 group-hover:bg-white/10 dark:group-hover:bg-white/10 group-hover:bg-gray-200/80">
                                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 via-violet-500 to-cyan-500 shadow-lg shadow-purple-500/30 flex items-center justify-center">
                                                    <UserMenuAvatar user={user} />
                                                </div>
                                                <div className="hidden sm:block text-left">
                                                    <p className="text-sm font-semibold dark:text-white text-gray-900 leading-tight">
                                                        {user?.name || "User"}
                                                    </p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-400 text-gray-600 leading-tight">
                                                        {user?.email || "user@example.com"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </DropdownMenuTrigger>

                                {/* User menu – unchanged */}
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
                                            <p className="font-medium text-sm dark:text-white text-gray-900">{user.name}</p>
                                            <p className="w-[200px] truncate text-xs dark:text-gray-400 text-gray-600">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <DropdownMenuSeparator className="bg-white/10 dark:bg-white/10 bg-gray-300/50" />
                                    <DropdownMenuItem onClick={handleProfileClick} className="rounded-lg mx-1 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                    {user.charactor?.code === "instructor" && (
                                        <DropdownMenuItem onClick={handleCreateCourseClick} className="rounded-lg mx-1 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900">
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            <span>Create Course</span>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => console.log("Settings clicked")} className="rounded-lg mx-1 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/10 dark:bg-white/10 bg-gray-300/50" />
                                    <DropdownMenuItem onClick={handleShare} className="rounded-lg mx-1 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900">
                                        <Share2 className="mr-2 h-4 w-4" />
                                        <span>Share</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleCopy} className="rounded-lg mx-1 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900">
                                        <Copy className="mr-2 h-4 w-4" />
                                        <span>Copy Link</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/10 dark:bg-white/10 bg-gray-300/50" />
                                    <DropdownMenuItem onClick={handleSignOut} className="rounded-lg mx-1 hover:bg-red-500/20 text-red-400 dark:text-red-400 text-red-600 hover:text-red-300 dark:hover:text-red-300 hover:text-red-700">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Sign Out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    onClick={handleGetStartedClick}
                                    className="rounded-full relative text-white px-6 py-2 transition-all duration-300 border-0 overflow-hidden"
                                    style={{
                                        background: "linear-gradient(135deg, rgba(59,130,246,.9) 0%, rgba(147,51,234,.9) 100%)",
                                        boxShadow: "0 4px 16px rgba(59,130,246,.4), inset 0 1px 0 rgba(255,255,255,.3)",
                                    }}
                                >
                                    <span className="relative z-10">Get Started</span>
                                    <motion.div
                                        className="absolute inset-0"
                                        style={{ background: "linear-gradient(135deg, rgba(255,255,255,.2) 0%, transparent 100%)" }}
                                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                                    />
                                </Button>
                            </motion.div>
                        )}
                    </div>

                    {/* ---- HAMBURGER (sm & md) — only nav items go inside ---- */}
                    <div className="flex md:hidden items-center space-x-2">
                        <ThemeToggle />
                        <Button
                            variant="ghost"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="rounded-xl p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200/80 dark:hover:bg-white/10"
                        >
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>

                {/* ---- MOBILE MENU (sm only) — only navigation, search stays above ---- */}
                {isMenuOpen && (
                    <motion.div
                        className="md:hidden mt-4 rounded-2xl overflow-hidden border border-gray-200/50 dark:border-white/10"
                        style={{
                            background: "rgba(255,255,255,0.95)",
                            backdropFilter: "blur(20px) saturate(180%)",
                            WebkitBackdropFilter: "blur(20px) saturate(180%)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                        }}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25 }}
                    >
                        <nav className="p-4 space-y-2">
                            <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 rounded-lg">
                                <Home className="h-4 w-4" /> Home
                            </Link>
                            <Link href="/courses" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 rounded-lg">
                                <GraduationCap className="h-4 w-4" /> Courses
                            </Link>

                            <div className="space-y-1">
                                <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                                    <Compass className="h-4 w-4" /> Explore
                                </div>
                                <div className="pl-6 space-y-1">
                                    {exploreItems.map((item) => {
                                        const Icon = item.icon
                                        return (
                                            <Link
                                                key={item.title}
                                                href={item.href}
                                                onClick={() => setIsMenuOpen(false)}
                                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                <Icon className={`h-4 w-4 ${item.color}`} />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{item.title}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.description}</span>
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>

                            <Link href="/pricing" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 rounded-lg">
                                <DollarSign className="h-4 w-4" /> Partner & Price
                            </Link>
                            <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 rounded-lg">
                                <Phone className="h-4 w-4" /> Contact
                            </Link>
                        </nav>
                    </motion.div>
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