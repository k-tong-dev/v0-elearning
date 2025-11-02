"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
    LayoutDashboard,
    GraduationCap,
    BarChart3,
    Settings,
    PlusCircle,
    LogOut,
    ChevronLeft,
    ChevronRight,
    BookOpenText,
    Menu,
    X,
    Crown, DollarSign,
    Bug,
    MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenuAvatar } from "@/components/ui/enhanced-avatar"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { cn } from "@/utils/utils"
import { SpecialNoticeTag } from "@/components/dashboard/SpecialNoticeTag"
import IOSButton from "@/components/ui/IosButton";


interface DashboardSidebarProps {
    currentUser: any
    selectedTab: string
    onTabChange: (tab: string) => void
    onCreateCourse: () => void
    isExpanded?: boolean
    onExpandedChange?: (expanded: boolean) => void
}



const navItems = [
    { label: "Overview",      icon: LayoutDashboard,   value: "overview" },
    { label: "My Courses",    icon: BookOpenText,      value: "my-courses" },
    { label: "Enrollments",   icon: GraduationCap,     value: "enrollments" },
    { label: "Expenditure",   icon: DollarSign,        value: "expenditure" },
    { label: "Analytics",     icon: BarChart3,         value: "analytics" },
    { label: "My Reports",    icon: Bug,               value: "reports" },
    { label: "Support",       icon: MessageCircle,     value: "contact" },
    { label: "Settings",      icon: Settings,          value: "settings" },
]



export function DashboardSidebar({
                                     currentUser,
                                     selectedTab,
                                     onTabChange,
                                     onCreateCourse,
                                     isExpanded: propIsExpanded,
                                     onExpandedChange,
                                 }: DashboardSidebarProps) {
    const { logout } = useAuth()
    const router = useRouter()
    const [localIsExpanded, setLocalIsExpanded] = useState(true)
    const isExpanded = propIsExpanded !== undefined ? propIsExpanded : localIsExpanded

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [activeTab, setActiveTab] = useState(selectedTab)

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setLocalIsExpanded(false)
            } else {
                setLocalIsExpanded(true)
            }
        }
        window.addEventListener("resize", handleResize)
        handleResize()
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const handleSignOut = async () => {
        try {
            await logout()
            toast.success("Signed out successfully", { position: "top-center" })
            router.push("/")
        } catch (error) {
            console.error("Sign out failed:", error)
            toast.error("Failed to sign out", { position: "top-center" })
        }
    }

    const sidebarVariants = {
        expanded: { width: "18rem", transition: { duration: 0.4, ease: "easeInOut" } },
        collapsed: { width: "6rem", transition: { duration: 0.4, ease: "easeInOut" } },
    }

    const mobileMenuVariants = {
        hidden: { x: "-100%", opacity: 0, transition: { duration: 0.3, ease: "easeInOut" } },
        visible: { x: "0%", opacity: 1, transition: { duration: 0.3, ease: "easeInOut" } },
    }

    const handleTabChange = (tab: string, isMobile = false) => {
        setActiveTab(tab)
        onTabChange(tab)
        if (isMobile) setIsMobileMenuOpen(false)
    }


    const renderSidebarContent = (isMobile = false) => (
        <div className="flex h-full flex-col justify-between p-4 overflow-y-auto scrollbar-hide">
            {/* Top Section: Logo, User Info */}
            <div className="flex flex-col items-center gap-4">
                <Link href="/" className="flex items-center space-x-2 group w-full justify-center flex-shrink-0">
                    <motion.div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden flex-shrink-0"
                        style={{
                            background:
                                "linear-gradient(135deg, rgba(139,92,246,.95) 0%, rgba(168,85,247,.95) 50%, rgba(236,72,153,.95) 100%)",
                            boxShadow:
                                "0 20px 40px rgba(139,92,246,.4), inset 0 2px 2px rgba(255,255,255,.4), 0 0 30px rgba(236,72,153,.25)",
                        }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                        <BookOpenText className="w-6 h-6 text-white drop-shadow-lg relative z-10" />
                    </motion.div>
                    {isExpanded && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 dark:from-indigo-300 dark:via-purple-300 dark:to-pink-300 bg-clip-text text-transparent"
                        >
                            CamEdu
                        </motion.span>
                    )}
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        `w-full flex items-center gap-3 p-3.5 rounded-2xl liquid-transition group liquid-glass-surface`,
                        isExpanded ? "flex-row" : "flex-col justify-center",
                    )}
                >
                    <UserMenuAvatar user={currentUser} size={isExpanded ? "md" : "sm"} />
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col text-left flex-1 min-w-0"
                        >
                            <p className="text-sm font-semibold text-foreground leading-tight truncate">{currentUser.username}</p>
                            <p className="text-xs text-muted-foreground leading-tight truncate">{currentUser.email}</p>
                        </motion.div>
                    )}
                </motion.div>

                <nav className="w-full space-y-2 mt-6 flex-1pr-1">
                    <motion.p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider px-2 sticky top-0">
                        Navigation
                    </motion.p>
                    {navItems.map((item, idx) => {
                        const IconComponent = item.icon
                        const isActive = activeTab === item.value

                        return (
                            <motion.div
                                key={item.value}
                                layout
                                className="relative group"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <motion.div
                                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-pink-500/40 blur-xl"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.95 }}
                                    transition={{ duration: 0.3 }}
                                    style={{ pointerEvents: "none" }}
                                />

                                <Button
                                    variant="ghost"
                                    onClick={() => handleTabChange(item.value, isMobile)}
                                    className={cn(
                                        `w-full relative transition-all duration-300 rounded-xl py-2.5 h-auto group overflow-hidden font-medium`,
                                        isActive
                                            ? "bg-gradient-to-r from-indigo-500/30 to-purple-500/30 dark:from-indigo-500/40 dark:to-purple-500/40 backdrop-blur-xl border border-indigo-400/50 dark:border-indigo-300/50 text-indigo-900 dark:text-white shadow-lg"
                                            : "text-muted-foreground hover:bg-white/8 dark:hover:bg-white/6 hover:backdrop-blur-lg hover:border hover:border-indigo-300/30 dark:hover:border-white/20 hover:shadow-lg hover:text-foreground transition-colors",
                                        isExpanded ? "px-4 justify-start" : "px-2 py-2 justify-center",
                                    )}
                                >
                                    <motion.div
                                        animate={{ scale: isActive ? 1.2 : 1, rotate: isActive ? 5 : 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        className={cn(isExpanded ? "mr-3" : "")}
                                    >
                                        <IconComponent className="w-5 h-5" />
                                    </motion.div>

                                    {(isExpanded || isMobile) && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-sm"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </Button>
                            </motion.div>
                        )
                    })}
                </nav>
            </div>

            {/* Bottom Section: Actions & Settings */}
            <div className="flex flex-col items-center gap-3 mt-auto pt-4 border-t border-white/10 dark:border-white/5 flex-shrink-0">
                <SpecialNoticeTag
                    isExpanded={isExpanded}
                    title="New Features!"
                    message="Unlock exclusive tools. Upgrade to Pro!"
                    linkHref="/pricing"
                    linkText="Upgrade Now"
                    icon={Crown}
                />

                {currentUser.subscription === "unlock" && (
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full"
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Button
                            onClick={() => {
                                onCreateCourse()
                                if (isMobile) setIsMobileMenuOpen(false)
                            }}
                            className={cn(
                                `w-full rounded-xl py-2.5 h-auto bg-gradient-to-r from-indigo-500/80 via-purple-500/80 to-pink-500/80 dark:from-indigo-500/90 dark:via-purple-500/90 dark:to-pink-500/90 text-white shadow-lg dark:shadow-2xl backdrop-blur-md border border-indigo-400/30 dark:border-white/30`,
                                `hover:from-indigo-600/80 hover:via-purple-600/80 hover:to-pink-600/80 dark:hover:from-indigo-600/90 dark:hover:via-purple-600/90 dark:hover:to-pink-600/90 transition-all duration-300 hover:border-indigo-400/50 dark:hover:border-white/40 hover:shadow-xl dark:hover:shadow-2xl`,
                                isExpanded ? "px-4" : "px-2 py-2",
                            )}
                        >
                            <motion.div animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                                <PlusCircle className={cn(`w-5 h-5`, isExpanded ? "mr-3" : "")} />
                            </motion.div>
                            {(isExpanded || isMobile) && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-sm font-medium"
                                >
                                    Create Course
                                </motion.span>
                            )}
                        </Button>
                    </motion.div>
                )}

                <div
                    className={cn(
                        `w-full flex items-center gap-2 transition-all duration-300`,
                        isExpanded ? "justify-between px-2" : "justify-center gap-1.5",
                    )}
                >
                    {isExpanded && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-xs text-muted-foreground font-medium uppercase tracking-wider"
                        >
                            Theme
                        </motion.span>
                    )}
                    <ThemeToggle />
                </div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full"
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className={cn(
                            `w-full rounded-xl py-2.5 h-auto text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/5 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 border border-transparent hover:border-red-500/30 font-medium`,
                            isExpanded ? "px-4 justify-start" : "px-2 py-2 justify-center",
                        )}
                    >
                        <LogOut className={cn(`w-5 h-5`, isExpanded ? "mr-3" : "")} />
                        {(isExpanded || isMobile) && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-sm"
                            >
                                Sign Out
                            </motion.span>
                        )}
                    </Button>
                </motion.div>
            </div>
        </div>
    )

    return (
        <>
            {/* Mobile Menu Button */}
            <div className="lg:hidden fixed top-4 left-4 z-[100]">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="liquid-glass-surface rounded-full p-2"
                >
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)} className="hover:bg-white/10">
                        <Menu className="w-6 h-6" />
                    </Button>
                </motion.div>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={mobileMenuVariants}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-lg lg:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <motion.div
                            className="liquid-sidebar relative h-full w-72"
                            onClick={(e) => e.stopPropagation()}
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="absolute top-4 right-4 z-50 text-muted-foreground hover:bg-white/10"
                            >
                                <X className="w-6 h-6" />
                            </Button>
                            {renderSidebarContent(true)}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={isExpanded ? "expanded" : "collapsed"}
                variants={sidebarVariants}
                className={`
                    hidden lg:flex flex-col fixed top-0 left-0 h-screen z-40
                    liquid-sidebar
                    transition-all duration-300
                `}
            >
                {renderSidebarContent()}

                {/* Collapse/Expand Button */}
                <motion.div
                    className="absolute top-1/2 -right-4 transform -translate-y-1/2 z-50"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            const newState = !isExpanded
                            setLocalIsExpanded(newState)
                            onExpandedChange?.(newState)
                        }}
                        className="rounded-full bg-indigo-100/80 dark:bg-white/10 backdrop-blur-xl border border-indigo-300/50 dark:border-white/30 shadow-lg hover:bg-indigo-200/80 dark:hover:bg-white/15 hover:border-indigo-400/70 dark:hover:border-white/40 transition-all duration-300 text-indigo-900 dark:text-white"
                    >
                        <motion.div animate={{ rotate: isExpanded ? 0 : 180 }} transition={{ duration: 0.3 }}>
                            {isExpanded ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </motion.div>
                    </Button>
                </motion.div>
            </motion.aside>
        </>
    )
}
