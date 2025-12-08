"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion"
import {
    LayoutDashboard,
    GraduationCap,
    BarChart3,
    Settings,
    PlusCircle,
    LogOut,
    BookOpenText,
    Menu,
    X,
    Crown,
    DollarSign,
    Bug,
    MessageCircle,
    Users,
    Bell,
    GripVertical,
    UserPlus,
    Award,
    Search,
    ShoppingCart,
    Package,
    Heart,
    ChevronDown,
    ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenuAvatar } from "@/components/ui/enhanced-avatar"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { cn } from "@/utils/utils"
import { SpecialNoticeTag } from "@/components/dashboard/SpecialNoticeTag"
import { getPendingInvitationsCount } from "@/integrations/strapi/instructor-invitation"
import { getPendingFriendRequests } from "@/integrations/strapi/friend-request"
import { getGroupInvitationsForUser } from "@/integrations/strapi/group-invitation"
import { getInstructors } from "@/integrations/strapi/instructor"
import {Image} from "@heroui/react"
import { AdvancedSearchModal } from "@/components/ui/search/AdvancedSearchModal"

interface DashboardSidebarResizableProps {
    currentUser: any
    selectedTab: string
    onTabChange: (tab: string) => void
    onCreateCourse?: () => void
    onNotificationClick?: () => void
}

const navItems = [
    { label: "Overview", icon: LayoutDashboard, value: "overview" },
    { label: "My Courses", icon: BookOpenText, value: "my-courses" },
    { label: "Certificates", icon: Award, value: "certificates" },
    { label: "Instructors", icon: Users, value: "instructors" },
    { label: "Enrollments", icon: GraduationCap, value: "enrollments" },
    { 
        label: "Shopping Cart",
        icon: ShoppingCart,
        value: "Cart",
        hasSubmenu: true,
        submenu: [
            { label: "View Cart", value: "cart-view" },
            // { label: "Cart History", value: "cart-history" },
        ]
    },
    { 
        label: "Orders", 
        icon: Package, 
        value: "orders",
        hasSubmenu: true,
        submenu: [
            { label: "My Orders", value: "orders-my" },
            { label: "Course Sales", value: "orders-sales" },
        ]
    },
    { 
        label: "Wishlist", 
        icon: Heart, 
        value: "wishlist",
        hasSubmenu: true,
        submenu: [
            { label: "Courses", value: "wishlist-courses" },
            { label: "Forums", value: "wishlist-forums" },
            { label: "Blogs", value: "wishlist-blogs" },
            { label: "Career", value: "wishlist-career" },
        ]
    },
    { label: "Expenditure", icon: DollarSign, value: "expenditure" },
    { label: "Analytics", icon: BarChart3, value: "analytics" },
    { label: "My Reports", icon: Bug, value: "reports" },
    { label: "Support", icon: MessageCircle, value: "contact" },
    { label: "Friends", icon: UserPlus, value: "friends" },
    { label: "Settings", icon: Settings, value: "settings" },
]

const MIN_WIDTH = 64 // Icon only (sm/md)
const MAX_WIDTH = 320
const DEFAULT_WIDTH = 256 // Icon + label (lg)

export function DashboardSidebarResizable({
    currentUser,
    selectedTab,
    onTabChange,
    onCreateCourse,
    onNotificationClick,
}: DashboardSidebarResizableProps) {
    const { logout, user } = useAuth()
    const router = useRouter()
    const [width, setWidth] = useState(DEFAULT_WIDTH)
    const [isResizing, setIsResizing] = useState(false)
    const sidebarRef = useRef<HTMLDivElement>(null)
    const startXRef = useRef(0)
    const startWidthRef = useRef(0)
    const [notificationCount, setNotificationCount] = useState(0)
    const [activeIndicator, setActiveIndicator] = useState<string | null>(null)
    const indicatorRef = useRef<HTMLDivElement>(null)
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)

    // Responsive: On sm/md, show icon only; on lg+, show icon + label
    const [isMobile, setIsMobile] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
        Cart: false,
        orders: false,
        wishlist: false,
    })

    // Keyboard shortcut for search (Cmd+K or Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault()
                setIsSearchModalOpen(true)
            }
            if (e.key === "Escape" && isSearchModalOpen) {
                setIsSearchModalOpen(false)
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isSearchModalOpen])

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024)
            if (window.innerWidth < 1024) {
                setWidth(MIN_WIDTH)
            } else {
                setWidth(DEFAULT_WIDTH)
            }
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    // Load notification count
    useEffect(() => {
        const loadNotificationCount = async () => {
            if (!user?.id) return

            try {
                // Get user's instructors
                const userInstructors = await getInstructors(user.id)
                
                // Get pending invitations for all instructors
                let totalInvitations = 0
                for (const instructor of userInstructors) {
                    const count = await getPendingInvitationsCount(instructor.id)
                    totalInvitations += count
                }

                // Get pending friend requests
                const friendRequests = await getPendingFriendRequests(user.id)
                const totalFriendRequests = friendRequests.length

                const groupInvitations = await getGroupInvitationsForUser(user.id)
                const totalGroupInvites = groupInvitations.filter(
                    (invite) => invite.request_status === "pending"
                ).length

                setNotificationCount(totalInvitations + totalFriendRequests + totalGroupInvites)
            } catch (error) {
                console.error("Error loading notification count:", error)
            }
        }

        loadNotificationCount()
        // Refresh every 30 seconds
        const interval = setInterval(loadNotificationCount, 30000)
        return () => clearInterval(interval)
    }, [user?.id])

    // Track active menu item movement
    useEffect(() => {
        if (selectedTab) {
            setActiveIndicator(selectedTab)
        }
    }, [selectedTab])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizing(true)
        startXRef.current = e.clientX
        startWidthRef.current = width

        const handleMouseMove = (e: MouseEvent) => {
            const diff = e.clientX - startXRef.current
            const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidthRef.current + diff))
            setWidth(newWidth)
        }

        const handleMouseUp = () => {
            setIsResizing(false)
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
        }

        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
    }, [width])

    const handleTabChange = (tab: string) => {
        // Removed Pro plan restriction - all users can access Instructors
        // Animate indicator to new position
        setActiveIndicator(tab)
        onTabChange(tab)
    }

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

    const showLabels = !isMobile && width >= 120

    return (
        <>
            {/* Mobile Menu Button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                <Button
                    variant="outline"
                    size="icon"
                        className="liquid-glass-button rounded-xl border-white/20 shadow-lg backdrop-blur-xl"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                        <Menu className="w-5 h-5" />
                </Button>
                </motion.div>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed top-0 left-0 h-screen w-72 bg-background/95 backdrop-blur-xl border-r border-border z-50 lg:hidden overflow-y-auto scrollbar-hide"
                        >
                            {/* Mobile Sidebar Content - same as desktop but full width */}
                            <div className="flex flex-col h-full p-4">
                                {/* Close Button */}
                                <div className="flex justify-end mb-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                                {/* Render mobile menu content */}
                                {renderMobileMenuContent()}
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                ref={sidebarRef}
                style={{ width: `${width}px`, flexShrink: 0 }}
                className={cn(
                    "hidden lg:flex flex-col h-screen z-40",
                    "bg-background/95 backdrop-blur-xl border-r border-border",
                    "transition-all duration-300",
                    isResizing && "select-none"
                )}
            >
                {/* Resize Handle */}
                <div
                    onMouseDown={handleMouseDown}
                    className={cn(
                        "absolute top-0 right-0 w-1 h-full cursor-col-resize z-50",
                        "hover:bg-primary/10 transition-colors group",
                        isResizing && "bg-primary cursor-col-resize"
                    )}
                    style={{ cursor: "col-resize" }}
                >
                    <div className="absolute top-1/2 -left-4 right-0 transform -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4 text-primary" />
                    </div>
                </div>

                {/* Sidebar Content */}
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        <div className="flex flex-col p-4 gap-4">
                            {/* Logo */}
                            <Link href="/" className="flex items-center gap-2 justify-center py-2">
                                <motion.div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{}}
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <Image src="/logoNoBg.png" alt="Logo with text" className={"rounded-none"}/>

                                </motion.div>
                                {showLabels && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-lg font-saira font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                                    >
                                    Dashboard
                                    </motion.span>
                                )}
                            </Link>

                            {/* User Info */}
                            <div className={cn(
                                "flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50",
                                showLabels ? "flex-row" : "flex-col justify-center"
                            )}>
                                <UserMenuAvatar user={currentUser} size="sm" />
                                {showLabels && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex-1 min-w-0"
                                    >
                                        <p className="text-sm font-semibold text-foreground truncate">{currentUser.username}</p>
                                        <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                                    </motion.div>
                                )}
                            </div>

                            {/* Search Button */}
                            <Button
                                variant="ghost"
                                onClick={() => setIsSearchModalOpen(true)}
                                className={cn(
                                    "w-full rounded-xl py-3 h-auto transition-all duration-200 group relative overflow-hidden",
                                    "bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10",
                                    "hover:from-primary/20 hover:via-purple-500/20 hover:to-pink-500/20",
                                    "border border-primary/20 hover:border-primary/30",
                                    showLabels ? "px-4 justify-between flex-wrap" : "px-2 justify-center"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Search className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                                    {showLabels && (
                                        <span className="text-sm font-medium text-foreground">Search Everything</span>
                                    )}
                                </div>
                                {showLabels && (
                                    <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded-lg border border-border bg-background/50 px-2 text-[10px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                        ⌘K
                                    </kbd>
                                )}
                            </Button>

                            {/* Navigation */}
                            <nav className="space-y-1 relative">
                                <p className={cn(
                                    "text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider px-2 mb-2",
                                    !showLabels && "text-center"
                                )}>
                                    {showLabels ? "Navigation" : "Nav"}
                                </p>
                                
                                {navItems.map((item: any, idx) => {
                                    const IconComponent = item.icon
                                    const isActive = selectedTab === item.value
                                    const isExpanded = expandedMenus[item.value]
                                    const hasSubmenu = item.hasSubmenu && item.submenu

                                    return (
                                        <motion.div
                                            key={item.value}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="relative"
                                        >
                                            {/* Active Indicator */}
                                            {isActive && !hasSubmenu && (
                                                <motion.div
                                                    layoutId="activeIndicator"
                                                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-purple-500 rounded-r-full z-10"
                                                    initial={false}
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 500,
                                                        damping: 30
                                                    }}
                                                />
                                            )}
                                            
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    if (hasSubmenu) {
                                                        setExpandedMenus(prev => ({
                                                            ...prev,
                                                            [item.value]: !prev[item.value]
                                                        }))
                                                    } else {
                                                        handleTabChange(item.value)
                                                    }
                                                }}
                                                className={cn(
                                                    "w-full rounded-lg py-2.5 h-auto transition-all duration-200 relative",
                                                    isActive && !hasSubmenu
                                                        ? "bg-primary/10 text-primary border border-primary/20"
                                                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                                    showLabels ? "px-3 justify-start" : "px-2 justify-center"
                                                )}
                                            >
                                                <IconComponent className={cn("w-5 h-5", showLabels && "mr-3")} />
                                                {showLabels && (
                                                    <>
                                                        <span className="flex-1 text-left">{item.label}</span>
                                                        {hasSubmenu && (
                                                            <ChevronRight className={cn(
                                                                "w-4 h-4 transition-transform",
                                                                isExpanded && "rotate-90"
                                                            )} />
                                                        )}
                                                    </>
                                                )}
                                            </Button>

                                            {/* Submenu */}
                                            {hasSubmenu && showLabels && (
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="pl-8 pr-2 py-1 space-y-1">
                                                                {item.submenu.map((subItem: any) => {
                                                                    const isSubActive = selectedTab === subItem.value
                                                                    return (
                                                                        <Button
                                                                            key={subItem.value}
                                                                            variant="ghost"
                                                                            onClick={() => handleTabChange(subItem.value)}
                                                                            className={cn(
                                                                                "w-full rounded-md py-2 text-sm h-auto",
                                                                                isSubActive
                                                                                    ? "bg-primary/10 text-primary"
                                                                                    : "text-muted-foreground hover:bg-accent"
                                                                            )}
                                                                        >
                                                                            <span className="w-full text-left">{subItem.label}</span>
                                                                        </Button>
                                                                    )
                                                                })}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            )}
                                        </motion.div>
                                    )
                                })}
                            </nav>

                        </div>
                    </div>

                    {/* Bottom Actions - Not Fixed */}
                    <div className="flex flex-col gap-2 p-4 border-t border-border/50">
                        {/* Create Course */}
                        {currentUser.subscription === "unlock" && onCreateCourse && (
                            <Button
                                onClick={onCreateCourse}
                                className={cn(
                                    "w-full rounded-lg py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white",
                                    showLabels ? "px-3 justify-start" : "px-2 justify-center"
                                )}
                            >
                                <PlusCircle className={cn("w-5 h-5", showLabels && "mr-3")} />
                                {showLabels && <span>Create Course</span>}
                            </Button>
                        )}

                        {/* Notification Button */}
                        {onNotificationClick && (
                            <Button
                                variant="ghost"
                                onClick={onNotificationClick}
                                className={cn(
                                    "w-full rounded-lg py-2.5 hover:bg-primary/10 relative",
                                    showLabels ? "px-3 justify-start" : "px-2 justify-center"
                                )}
                            >
                                <div className="relative">
                                    <Bell className={cn("w-5 h-5", showLabels && "mr-3")} />
                                    {notificationCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-xs font-bold text-white shadow-lg">
                                            {notificationCount > 9 ? "9+" : notificationCount}
                                        </span>
                                    )}
                                </div>
                                {showLabels && (
                                    <>
                                        <span>Notifications</span>
                                        {notificationCount > 0 && (
                                            <Badge className="ml-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                                {notificationCount > 9 ? "9+" : notificationCount}
                                            </Badge>
                                        )}
                                    </>
                                )}
                            </Button>
                        )}

                        {/* Theme Toggle */}
                        <div className={cn(
                            "flex items-center gap-2",
                            showLabels ? "justify-between px-1" : "justify-center"
                        )}>
                            {showLabels && (
                                <span className="text-xs text-muted-foreground uppercase">Theme</span>
                            )}
                            <ThemeToggle />
                        </div>

                        {/* Logout */}
                        <Button
                            variant="ghost"
                            onClick={handleSignOut}
                            className={cn(
                                "w-full rounded-lg py-2.5 text-red-500 hover:bg-red-500/10",
                                showLabels ? "px-3 justify-start" : "px-2 justify-center"
                            )}
                        >
                            <LogOut className={cn("w-5 h-5", showLabels && "mr-3")} />
                            {showLabels && <span>Sign Out</span>}
                        </Button>
                    </div>
                </div>
            </motion.aside>

            {/* Advanced Search Modal */}
            <AdvancedSearchModal 
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
            />
        </>
    )

    // Render mobile menu content (duplicate of desktop but for mobile)
    function renderMobileMenuContent() {
        return (
            <>
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 justify-center py-2 mb-4" onClick={() => setIsMobileMenuOpen(false)}>
                    <motion.div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                            background: "linear-gradient(135deg, rgba(139,92,246,.95) 0%, rgba(168,85,247,.95) 50%, rgba(236,72,153,.95) 100%)",
                        }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <BookOpenText className="w-5 h-5 text-white" />
                    </motion.div>
                    <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        NEXT4LEARN
                    </span>
                </Link>

                {/* User Info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50 mb-4">
                    <UserMenuAvatar user={currentUser} size="sm" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{currentUser.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                    </div>
                </div>

                {/* Search Button */}
                <Button
                    variant="ghost"
                    onClick={() => {
                        setIsSearchModalOpen(true)
                        setIsMobileMenuOpen(false)
                    }}
                    className="w-full rounded-xl py-3 h-auto transition-all duration-200 group relative overflow-hidden bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 hover:from-primary/20 hover:via-purple-500/20 hover:to-pink-500/20 border border-primary/20 hover:border-primary/30 px-4 justify-between mb-4"
                >
                    <div className="flex items-center gap-3">
                        <Search className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-foreground">Search Everything</span>
                    </div>
                    <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded-lg border border-border bg-background/50 px-2 text-[10px] font-medium text-muted-foreground">
                        ⌘K
                    </kbd>
                </Button>

                {/* Navigation */}
                <nav className="space-y-1 mb-4">
                    <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider px-2 mb-2">
                        Navigation
                    </p>
                    {navItems.map((item: any, idx) => {
                        const IconComponent = item.icon
                        const isActive = selectedTab === item.value
                        const isExpanded = expandedMenus[item.value]
                        const hasSubmenu = item.hasSubmenu && item.submenu

                        return (
                            <div key={item.value} className="relative">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        if (hasSubmenu) {
                                            setExpandedMenus(prev => ({
                                                ...prev,
                                                [item.value]: !prev[item.value]
                                            }))
                                        } else {
                                            handleTabChange(item.value)
                                            setIsMobileMenuOpen(false)
                                        }
                                    }}
                                    className={cn(
                                        "w-full rounded-lg py-2.5 h-auto transition-all duration-200",
                                        isActive && !hasSubmenu
                                            ? "bg-primary/10 text-primary border border-primary/20"
                                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                        "px-3 justify-start"
                                    )}
                                >
                                    <IconComponent className="w-5 h-5 mr-3" />
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {hasSubmenu && (
                                        <ChevronRight className={cn(
                                            "w-4 h-4 transition-transform",
                                            isExpanded && "rotate-90"
                                        )} />
                                    )}
                                </Button>

                                {/* Mobile Submenu */}
                                {hasSubmenu && (
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pl-8 pr-2 py-1 space-y-1">
                                                    {item.submenu.map((subItem: any) => {
                                                        const isSubActive = selectedTab === subItem.value
                                                        return (
                                                            <Button
                                                                key={subItem.value}
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    handleTabChange(subItem.value)
                                                                    setIsMobileMenuOpen(false)
                                                                }}
                                                                className={cn(
                                                                    "w-full rounded-md py-2 text-sm h-auto",
                                                                    isSubActive
                                                                        ? "bg-primary/10 text-primary"
                                                                        : "text-muted-foreground hover:bg-accent"
                                                                )}
                                                            >
                                                                <span className="w-full text-left">{subItem.label}</span>
                                                            </Button>
                                                        )
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}
                            </div>
                        )
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-border/50">
                    {/* Create Course */}
                    {currentUser.subscription === "unlock" && onCreateCourse && (
                        <Button
                            onClick={() => {
                                onCreateCourse()
                                setIsMobileMenuOpen(false)
                            }}
                            className="w-full rounded-lg py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 justify-start"
                        >
                            <PlusCircle className="w-5 h-5 mr-3" />
                            <span>Create Course</span>
                        </Button>
                    )}

                    {/* Notification Button */}
                    {onNotificationClick && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                onNotificationClick()
                                setIsMobileMenuOpen(false)
                            }}
                            className="w-full rounded-lg py-2.5 hover:bg-primary/10 relative px-3 justify-start"
                        >
                            <div className="relative">
                                <Bell className="w-5 h-5 mr-3" />
                                {notificationCount > 0 && (
                                    <span className="absolute -top-1 left-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-xs font-bold text-white shadow-lg">
                                        {notificationCount > 9 ? "9+" : notificationCount}
                                    </span>
                                )}
                            </div>
                            <span>Notifications</span>
                            {notificationCount > 0 && (
                                <Badge className="ml-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                    {notificationCount > 9 ? "9+" : notificationCount}
                                </Badge>
                            )}
                        </Button>
                    )}

                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between px-1">
                        <span className="text-xs text-muted-foreground uppercase">Theme</span>
                        <ThemeToggle />
                    </div>

                    {/* Logout */}
                    <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className="w-full rounded-lg py-2.5 text-red-500 hover:bg-red-500/10 px-3 justify-start"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        <span>Sign Out</span>
                    </Button>
                </div>
            </>
        )
    }
}

