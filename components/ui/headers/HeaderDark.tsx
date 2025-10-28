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
    const headerRef = useRef<HTMLDivElement>(null)

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

    const handleGetStartedClick = () => {
        router.push("/auth/start")
        setIsMenuOpen(false)
    }

    const handleSignOut = async () => {
        try {
            await logout()
            toast.success("Signed out successfully", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
            setIsUserMenuOpen(false)
            setIsMenuOpen(false)
            router.push("/")
        } catch (error) {
            console.error("Sign out failed:", error)
            toast.error("Failed to sign out", {
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
                toast.success("Shared successfully!", {
                    position: "top-center",
                    action: {
                        label: "Close",
                        onClick: () => {},
                    },
                    closeButton: false,
                })
            } else {
                await navigator.clipboard.writeText(window.location.origin)
                toast.success("Link copied to clipboard!", {
                    position: "top-center",
                    action: {
                        label: "Close",
                        onClick: () => {},
                    },
                    closeButton: false,
                })
            }
        } catch (error) {
            console.error("Share failed:", error)
            toast.error("Failed to share", {
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
            toast.success("Link copied to clipboard!", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
        } catch (error) {
            console.error("Copy failed:", error)
            toast.error("Failed to copy link", {
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
    }

    const exploreItems = [
        {
            title: "Forum",
            description: "Join discussions with fellow learners",
            href: "/forum",
            icon: MessageCircle,
            color: "text-blue-400",
        },
        {
            title: "About Us",
            description: "Learn about our mission and team",
            href: "/about",
            icon: Info,
            color: "text-green-400",
        },
        {
            title: "Blog",
            description: "Read our latest articles and insights",
            href: "/blog",
            icon: FileText,
            color: "text-purple-400",
        },
        {
            title: "Services",
            description: "Explore our educational services",
            href: "/services",
            icon: Briefcase,
            color: "text-orange-400",
        },
        {
            title: "Support",
            description: "Get help when you need it",
            href: "/support",
            icon: HelpCircle,
            color: "text-red-400",
        },
        {
            title: "Contact",
            description: "Reach out to our team",
            href: "/contact",
            icon: Phone,
            color: "text-cyan-400",
        },
    ]

    return (
        <header
            ref={headerRef}
            className="top-0 left-0 right-0 z-50 overflow-hidden border-b dark:border-white/5 border-gray-200/50 bg-white/40 dark:bg-black/40 backdrop-blur-2xl"
        >
            {/* Animated liquid blobs - Light and Dark theme */}
            <div className="pointer-events-none absolute inset-0">
                <div
                    className="absolute -left-20 -top-20 h-96 w-96 animate-[blob_12s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-purple-600/30 via-violet-600/20 to-transparent dark:from-purple-600/30 dark:via-violet-600/20 blur-3xl"
                    style={{
                        transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
                        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />
                <div
                    className="absolute -right-20 top-0 h-80 w-80 animate-[blob_10s_ease-in-out_infinite_2s] rounded-full bg-gradient-to-bl from-cyan-500/30 via-blue-600/20 to-transparent dark:from-cyan-500/30 dark:via-blue-600/20 blur-3xl"
                    style={{
                        transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * 0.015}px)`,
                        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />
                <div
                    className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-[blob_15s_ease-in-out_infinite_4s] rounded-full bg-gradient-to-tr from-fuchsia-600/20 via-pink-600/15 to-transparent dark:from-fuchsia-600/20 dark:via-pink-600/15 blur-3xl"
                    style={{
                        transform: `translate(calc(-50% + ${mousePosition.x * 0.01}px), calc(-50% + ${mousePosition.y * 0.01}px))`,
                        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />
            </div>

            {/* Shimmer effect */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent dark:via-white/5 via-gray-900/5 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />

            <div className="relative mx-auto max-w-7xl px-6 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2 group">
                        <motion.div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center relative overflow-hidden"
                            style={{
                                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(147, 51, 234, 0.9) 100%)",
                                boxShadow: "0 4px 16px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                            }}
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                            <BookOpen className="w-5 h-5 text-white relative z-10" />
                            <motion.div
                                className="absolute inset-0"
                                style={{
                                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%)",
                                }}
                                animate={{
                                    opacity: [0.3, 0.6, 0.3],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Number.POSITIVE_INFINITY,
                                    ease: "easeInOut",
                                }}
                            />
                        </motion.div>
                        <span
                            className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 dark:from-blue-400 dark:via-purple-400 dark:to-blue-400   bg-clip-text text-transparent"
                            style={{
                                backgroundSize: "200% auto",
                                animation: "gradient-shift 3s ease infinite",
                            }}
                        >
                          CamEdu
                        </span>
                    </Link>

                    {/* Center section - Search */}
                    <div className="hidden lg:block flex-1 max-w-md mx-8">
                        <div className="group relative">
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                            <div className="relative flex items-center gap-3 rounded-2xl border  dark:border-white/10 border-gray-200/80  dark:bg-white/5 bg-gray-100/20 px-4 py-2.5 backdrop-blur-xl transition-all duration-300  dark:group-hover:border-white/20 group-hover:border-gray-400/50  dark:group-hover:bg-white/10 group-hover:bg-gray-200/80">
                                <Search className="h-4 w-4 dark:text-gray-400 text-gray-600 transition-colors  dark:group-hover:text-gray-300 group-hover:text-gray-900" />
                                <input
                                    type="text"
                                    placeholder="Search anything..."
                                    className="flex-1 bg-transparent text-sm  dark:text-white text-gray-900 dark:placeholder-gray-500 placeholder-gray-400 outline-none"
                                />
                                <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border dark:border-white/10 border-gray-300/50 dark:bg-white/5 bg-gray-200/50 px-1.5 text-xs font-medium  dark:text-gray-400 text-gray-600">
                                    ⌘K
                                </kbd>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        {/* Theme Toggle */}
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <ThemeToggle />
                        </motion.div>

                        {/* Search Button (mobile) */}
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="lg:hidden">
                            <button
                                onClick={handleSearch}
                                className="group relative rounded-xl border border-white/10 dark:border-white/10 border-gray-300/50 bg-white/5 dark:bg-white/5 bg-gray-100/80 p-2.5 backdrop-blur-xl transition-all duration-300 hover:border-white/20 dark:hover:border-white/20 hover:border-gray-400/50 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80"
                            >
                                <Search className="h-5 w-5 text-gray-300 dark:text-gray-300 text-gray-700 transition-colors group-hover:text-white dark:group-hover:text-white group-hover:text-gray-900" />
                            </button>
                        </motion.div>

                        {/* Notification Button */}
                        <button className="group relative rounded-xl border border-white/10 dark:border-white/10 border-gray-300/50 bg-white/5 dark:bg-white/5 bg-gray-100/80 p-2.5 backdrop-blur-xl transition-all duration-300 hover:border-white/20 dark:hover:border-white/20 hover:border-gray-400/50 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 hover:scale-105">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 opacity-0 blur transition-opacity duration-300 group-hover:opacity-100" />
                            <Bell className="relative h-5 w-5 text-gray-300 dark:text-gray-300 text-gray-700 transition-colors group-hover:text-white dark:group-hover:text-white group-hover:text-gray-900" />
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-xs font-bold text-white shadow-lg shadow-purple-500/50">
                                3
                            </span>
                        </button>

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
                                style={{
                                    backdropFilter: "blur(20px) saturate(180%)",
                                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                                    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)",
                                    borderRadius: "16px",
                                }}
                                className="w-64 mt-2 border-0 dark:[background:rgba(0,0,0,0.9)] dark:[box-shadow:0_8px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                            >
                                <div className="px-2 py-2">
                                    <p className="text-xs font-semibold dark:text-gray-900 text-gray-600 px-2 mb-2">
                                        NAVIGATION
                                    </p>

                                    {/* Home */}
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/"
                                            className="flex items-center gap-3 rounded-lg px-3 py-2 dark:hover:bg-white/10 hover:bg-gray-200/80  dark:text-gray-300 text-gray-700  dark:hover:text-white hover:text-gray-900 transition-colors"
                                            onClick={() => setIsSettingsOpen(false)}
                                        >
                                            <Home className="h-4 w-4" />
                                            <span>Home</span>
                                        </Link>
                                    </DropdownMenuItem>

                                    {/* Courses */}
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/courses"
                                            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900 transition-colors"
                                            onClick={() => setIsSettingsOpen(false)}
                                        >
                                            <GraduationCap className="h-4 w-4" />
                                            <span>Courses</span>
                                        </Link>
                                    </DropdownMenuItem>

                                    {/* Explore Submenu */}
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900 transition-colors cursor-pointer">
                                            <Compass className="h-4 w-4" />
                                            <span>Explore</span>
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent
                                                className="w-72 border dark:border-white/10 border-gray-300/50 p-2 dark:[background:rgba(0,0,0,0.95)] dark:[box-shadow:0_8px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                                                sideOffset={8}
                                                style={{
                                                    backdropFilter: "blur(20px) saturate(180%)",
                                                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                                                    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)",
                                                    borderRadius: "16px",
                                                    zIndex: 9999,
                                                }}
                                            >
                                                {exploreItems.map((item) => {
                                                    const IconComponent = item.icon
                                                    return (
                                                        <DropdownMenuItem key={item.title} asChild>
                                                            <Link
                                                                href={item.href}
                                                                className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 transition-colors cursor-pointer"
                                                                onClick={() => setIsSettingsOpen(false)}
                                                            >
                                                                <IconComponent className={`h-5 w-5 ${item.color} mt-0.5 flex-shrink-0`} />
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium dark:text-white text-gray-900">
                                                                        {item.title}
                                                                    </span>
                                                                    <span className="text-xs text-gray-400 dark:text-gray-400 text-gray-600">
                                                                        {item.description}
                                                                      </span>
                                                                </div>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )
                                                })}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>

                                    {/* Partner & Price */}
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/pricing"
                                            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900 transition-colors"
                                            onClick={() => setIsSettingsOpen(false)}
                                        >
                                            <DollarSign className="h-4 w-4" />
                                            <span>Partner & Price</span>
                                        </Link>
                                    </DropdownMenuItem>

                                    {/* Contact */}
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/contact"
                                            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900 transition-colors"
                                            onClick={() => setIsSettingsOpen(false)}
                                        >
                                            <Phone className="h-4 w-4" />
                                            <span>Contact</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* User Menu */}
                        {isLoading ? (
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full" disabled>
                                <Loader2 className="w-4 h-4 animate-spin text-gray-300 dark:text-gray-300 text-gray-700" />
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
                                <DropdownMenuContent
                                    align="end"
                                    side="bottom"
                                    style={{
                                        backdropFilter: "blur(20px) saturate(180%)",
                                        WebkitBackdropFilter: "blur(20px) saturate(180%)",
                                        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)",
                                        borderRadius: "16px",
                                    }}
                                    className="w-56 mt-2 border-0 dark:[background:rgba(0,0,0,0.9)] dark:[box-shadow:0_8px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
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
                                    <DropdownMenuItem
                                        onClick={handleProfileClick}
                                        className="rounded-lg mx-1 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900"
                                    >
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                    {user.charactor?.code === "instructor" && (
                                        <DropdownMenuItem
                                            onClick={handleCreateCourseClick}
                                            className="rounded-lg mx-1 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900"
                                        >
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            <span>Create Course</span>
                                        </DropdownMenuItem>
                                    )}
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
                                    className="rounded-full relative text-white px-6 py-2 transition-all duration-300 border-0 overflow-hidden"
                                    style={{
                                        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(147, 51, 234, 0.9) 100%)",
                                        boxShadow: "0 4px 16px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                                    }}
                                >
                                    <span className="relative z-10">Get Started</span>
                                    <motion.div
                                        className="absolute inset-0"
                                        style={{
                                            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)",
                                        }}
                                        animate={{
                                            opacity: [0.2, 0.4, 0.2],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Number.POSITIVE_INFINITY,
                                            ease: "easeInOut",
                                        }}
                                    />
                                </Button>
                            </motion.div>
                        )}
                    </div>

                    <div className="md:hidden flex items-center space-x-2">
                        <ThemeToggle />
                        <Button
                            variant="ghost"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 rounded-xl text-gray-300 dark:text-gray-300 text-gray-700"
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>

                {isMenuOpen && (
                    <motion.div
                        className="md:hidden mt-4 border-0 rounded-2xl overflow-hidden dark:[background:rgba(0,0,0,0.9)] dark:[box-shadow:0_8px_32px_0_rgba(0,0,0,0.5)]"
                        style={{
                            background: "rgba(255, 255, 255, 0.95)",
                            backdropFilter: "blur(20px) saturate(180%)",
                            WebkitBackdropFilter: "blur(20px) saturate(180%)",
                            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
                        }}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <nav className="flex flex-col space-y-1 p-4">
                            <Link
                                href="/"
                                className="text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900 transition-colors duration-200 py-2 px-3 rounded-xl hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Home
                            </Link>
                            <Link
                                href="/courses"
                                className="text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900 transition-colors duration-200 py-2 px-3 rounded-xl hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Courses
                            </Link>
                            <div className="space-y-1">
                                <span className="text-white dark:text-white text-gray-900 font-medium py-2 px-3">Explore</span>
                                <div className="pl-4 space-y-1">
                                    {exploreItems.map((item) => {
                                        const IconComponent = item.icon
                                        return (
                                            <Link
                                                key={item.title}
                                                href={item.href}
                                                className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white dark:hover:text-white hover:text-gray-900 transition-colors duration-200 py-2 px-3 rounded-xl hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80"
                                                onClick={() => setIsMenuOpen(false)}
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
                                className="text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900 transition-colors duration-200 py-2 px-3 rounded-xl hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Partner & Price
                            </Link>
                            <Link
                                href="/contact"
                                className="text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900 transition-colors duration-200 py-2 px-3 rounded-xl hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Contact
                            </Link>
                            <div className="flex flex-col space-y-2 pt-4 border-t border-white/10 dark:border-white/10 border-gray-300/50">
                                {isLoading ? (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader2 className="w-5 h-5 animate-spin text-gray-300 dark:text-gray-300 text-gray-700" />
                                        <span className="ml-2 text-sm text-gray-400 dark:text-gray-400 text-gray-600">Loading...</span>
                                    </div>
                                ) : isAuthenticated && user ? (
                                    <>
                                        <div className="flex items-center gap-3 p-2 mb-2">
                                            <UserMenuAvatar user={user} size="sm" />
                                            <div className="flex flex-col">
                                                <p className="font-medium text-sm text-white dark:text-white text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-400 text-gray-600 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            className="rounded-xl justify-start hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900"
                                            onClick={handleProfileClick}
                                        >
                                            <User className="w-4 h-4 mr-2" />
                                            Dashboard
                                        </Button>
                                        {user.charactor?.code === "instructor" && (
                                            <Button
                                                variant="ghost"
                                                className="rounded-xl justify-start hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900"
                                                onClick={handleCreateCourseClick}
                                            >
                                                <PlusCircle className="w-4 h-4 mr-2" />
                                                Create Course
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            className="rounded-xl justify-start hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200/80 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900"
                                            onClick={() => {
                                                setIsMenuOpen(false)
                                            }}
                                        >
                                            <Settings className="w-4 h-4 mr-2" />
                                            Settings
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="rounded-xl justify-start hover:bg-red-500/20 text-red-400 dark:text-red-400 text-red-600 hover:text-red-300 dark:hover:text-red-300 hover:text-red-700"
                                            onClick={handleSignOut}
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            <span>Sign Out</span>
                                        </Button>
                                    </>
                                ) : (
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                            onClick={handleGetStartedClick}
                                            className="rounded-full text-white border-0"
                                            style={{
                                                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(147, 51, 234, 0.9) 100%)",
                                                boxShadow: "0 4px 16px rgba(59, 130, 246, 0.4)",
                                            }}
                                        >
                                            Get Started
                                        </Button>
                                    </motion.div>
                                )}
                            </div>
                        </nav>
                    </motion.div>
                )}
            </div>

            <style jsx>{`
                @keyframes blob {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                }
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
                @keyframes gradient-shift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
            `}</style>
        </header>
    )
}
