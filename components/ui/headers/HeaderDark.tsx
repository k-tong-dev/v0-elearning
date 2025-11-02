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

    /* ---------- Explore items ---------- */
    const exploreItems = [
        { title: "Forum", href: "/forum" },
        { title: "About Us", href: "/about" },
        { title: "Blog", href: "/blog" },
        { title: "Services", href: "/services" },
        { title: "Support", href: "/support" },
        { title: "Contact", href: "/contact" },
    ]

    return (
        <header
            ref={headerRef}
            className={`
        left-0 right-0 z-50 overflow-hidden
        transition-all duration-300
        ${
                isScrolled
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
                            className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 dark:from-blue-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent"
                            style={{ backgroundSize: "200% auto", animation: "gradient-shift 3s ease infinite" }}
                        >
              CamEdu
            </span>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-2">
                        <Link
                            href="/"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/8 transition-all duration-200"
                        >
                            <Home className="h-4 w-4" />
                            <span>Home</span>
                        </Link>

                        <Link
                            href="/courses"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/8 transition-all duration-200"
                        >
                            <GraduationCap className="h-4 w-4" />
                            <span>Courses</span>
                        </Link>

                        {/* Explorers Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/8 transition-all duration-200 group">
                                    <Compass className="h-4 w-4 transition-transform group-hover:rotate-12" />
                                    <span>Explorers</span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="start"
                                className="w-52 mt-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-950/95 shadow-lg shadow-black/10 dark:shadow-black/40 p-1"
                            >
                                {exploreItems.map((item) => (
                                    <DropdownMenuItem
                                        key={item.title}
                                        asChild
                                        className="rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-150 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                                    >
                                        <Link href={item.href}>{item.title}</Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Link
                            href="/pricing"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/8 transition-all duration-200"
                        >
                            <DollarSign className="h-4 w-4" />
                            <span>Pricing</span>
                        </Link>
                    </nav>

                    {/* ---- RIGHT: ICONS + USER MENU ---- */}
                    <div className="flex items-center gap-3 ml-auto">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <ThemeToggle />
                        </motion.div>

                        {/* Notification */}
                        <button className="group relative rounded-full border border-gray-300/30 dark:border-white/15 bg-gray-50 dark:bg-white/8 p-2.5 backdrop-blur-lg transition-all duration-300 hover:border-gray-400/50 dark:hover:border-white/25 hover:bg-gray-100 dark:hover:bg-white/12 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20">
                            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-xs font-bold text-white shadow-lg shadow-blue-500/40">
                3
              </span>
                        </button>

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
                                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/30 to-cyan-500/30 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                                            <div className="relative flex items-center gap-3 rounded-2xl border border-white/10 dark:border-white/10 border-gray-300/50 bg-white/5 dark:bg-white/5 bg-gray-100/80 py-2 pl-3 pr-4 backdrop-blur-xl transition-all duration-300 group-hover:border-white/20 dark:group-hover:border-white/20 group-hover:border-gray-400/50 group-hover:bg-white/10 dark:group-hover:bg-white/10 group-hover:bg-gray-200/80">
                                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 via-violet-500 to-cyan-500 shadow-lg shadow-purple-500/30 flex items-center justify-center">
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
                            href="/courses"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 rounded-lg"
                        >
                            <GraduationCap className="h-4 w-4" /> Courses
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
                        <Link
                            href="/pricing"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 rounded-lg"
                        >
                            <DollarSign className="h-4 w-4" /> Pricing
                        </Link>
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
