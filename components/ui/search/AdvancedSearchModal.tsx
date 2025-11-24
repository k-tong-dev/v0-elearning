"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search,
    X,
    BookOpen,
    Users,
    GraduationCap,
    FileText,
    MessageCircle,
    Settings,
    User,
    Home,
    Info,
    Phone,
    HelpCircle,
    Zap,
    Briefcase,
    DollarSign,
    Crown,
    Lock,
    Sparkles,
    ArrowRight,
    TrendingUp,
    Video,
    Award,
    BarChart3,
    Heart,
    Share2,
    Bell,
    CreditCard,
    Calendar,
    Star,
    LayoutDashboard,
    Loader2,
    BookOpenText,
    Bug,
    UserCircle,
    ThumbsUp,
    Star as StarIcon,
    TrendingDown,
    Wallet,
    Receipt,
    FileCheck,
    UsersRound,
    MessageSquare,
    Shield,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getUserSubscription } from "@/integrations/strapi/subscription"
import { toast } from "sonner"
import { getMenuItems, MenuItem } from "@/integrations/strapi/menu"
import { FontAwesomeIcon } from "@/components/ui/FontAwesomeIcon"

interface SearchFeature {
    id: string
    title: string
    description: string
    href: string
    icon: string // Font Awesome icon string
    category: "page" | "feature" | "course" | "instructor" | "blog" | "forum"
    requiresAuth?: boolean
    requiresPro?: boolean
    keywords: string[]
    gradient: string
}

export function AdvancedSearchModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean
    onClose: () => void
}) {
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [hasPro, setHasPro] = useState(false)
    const [checkingPro, setCheckingPro] = useState(false)
    const [allFeatures, setAllFeatures] = useState<SearchFeature[]>([])
    const [loadingMenu, setLoadingMenu] = useState(true)
    const searchInputRef = React.useRef<HTMLInputElement>(null)

    // Fetch menu items from Strapi
    useEffect(() => {
        const fetchMenuItems = async () => {
            setLoadingMenu(true)
            try {
                const menuItems = await getMenuItems()
                
                // Convert MenuItem to SearchFeature
                const features: SearchFeature[] = menuItems.map((item) => ({
                    id: item.code || item.id.toString(),
                    title: item.title || 'Untitled',
                    description: item.description || '',
                    href: item.href || '#',
                    icon: item.icon || 'fa fa-circle',
                    category: item.category || 'page',
                    requiresAuth: item.requiresAuth || false,
                    requiresPro: item.requiresPro || false,
                    keywords: Array.isArray(item.keywords) ? item.keywords : (item.keywords ? [item.keywords] : []),
                    gradient: item.gradient || 'from-blue-500 to-cyan-500',
                }))
                
                setAllFeatures(features)
            } catch (error) {
                console.error("Error fetching menu items:", error)
                // Fallback to empty array
                setAllFeatures([])
            } finally {
                setLoadingMenu(false)
            }
        }

        fetchMenuItems()
    }, [])

    // Check Pro subscription status
    useEffect(() => {
        const checkProStatus = async () => {
            if (!isAuthenticated || !user?.id) {
                setHasPro(false)
                return
            }

            setCheckingPro(true)
            try {
                const subscription = await getUserSubscription(user.id)
                if (subscription) {
                    const sub = typeof subscription.subscription === 'object' 
                        ? subscription.subscription 
                        : null
                    setHasPro(sub?.type === 'Pro' || sub?.type === 'Enterpris')
                } else {
                    setHasPro(false)
                }
            } catch (error) {
                console.error("Error checking Pro status:", error)
                setHasPro(false)
            } finally {
                setCheckingPro(false)
            }
        }

        checkProStatus()
    }, [isAuthenticated, user?.id])

    // Fallback features (if Strapi is not available)
    const fallbackFeatures: SearchFeature[] = [
        // Pages
        {
            id: "home",
            title: "Home",
            description: "Go to homepage",
            href: "/",
            icon: "fa fa-home",
            category: "page",
            keywords: ["home", "main", "landing", "start"],
            gradient: "from-blue-500 to-cyan-500",
        },
        {
            id: "about",
            title: "About Us",
            description: "Learn about our mission and values",
            href: "/about",
            icon: "fa fa-info-circle",
            category: "page",
            keywords: ["about", "mission", "values", "company", "team"],
            gradient: "from-purple-500 to-pink-500",
        },
        {
            id: "contact",
            title: "Contact",
            description: "Reach out to our team",
            href: "/contact",
            icon: "fa fa-phone",
            category: "page",
            keywords: ["contact", "support", "help", "email", "reach"],
            gradient: "from-violet-500 to-fuchsia-500",
        },
        {
            id: "support",
            title: "Support",
            description: "Get help and find answers",
            href: "/support",
            icon: "fa fa-question-circle",
            category: "page",
            keywords: ["support", "help", "faq", "assistance", "guide"],
            gradient: "from-indigo-500 to-purple-500",
        },
        {
            id: "services",
            title: "Services",
            description: "Explore our comprehensive offerings",
            href: "/services",
            icon: "fa fa-bolt",
            category: "page",
            keywords: ["services", "offerings", "solutions", "what we do"],
            gradient: "from-orange-500 to-red-500",
        },
        {
            id: "pricing",
            title: "Pricing",
            description: "View subscription plans and pricing",
            href: "/pricing",
            icon: "fa fa-dollar-sign",
            category: "page",
            keywords: ["pricing", "plans", "subscription", "cost", "price"],
            gradient: "from-green-500 to-emerald-500",
        },
        {
            id: "career",
            title: "Career",
            description: "Join our team",
            href: "/career",
            icon: "fa fa-briefcase",
            category: "page",
            keywords: ["career", "jobs", "hiring", "work", "join"],
            gradient: "from-teal-500 to-cyan-500",
        },
        // Features - Auth Required
        {
            id: "dashboard",
            title: "Dashboard",
            description: "Your learning dashboard",
            href: "/dashboard",
            icon: "fa fa-dashboard",
            category: "feature",
            requiresAuth: true,
            keywords: ["dashboard", "my", "overview", "stats", "progress"],
            gradient: "from-blue-500 to-indigo-500",
        },
        {
            id: "my-courses",
            title: "My Courses",
            description: "View your enrolled courses",
            href: "/dashboard?tab=my-courses",
            icon: "fa fa-book",
            category: "feature",
            requiresAuth: true,
            keywords: ["my courses", "enrolled", "learning", "studying"],
            gradient: "from-purple-500 to-pink-500",
        },
        {
            id: "overview",
            title: "Overview",
            description: "Dashboard overview and statistics",
            href: "/dashboard?tab=overview",
            icon: "fa fa-chart-bar",
            category: "feature",
            requiresAuth: true,
            keywords: ["overview", "dashboard", "stats", "summary", "home"],
            gradient: "from-blue-500 to-indigo-500",
        },
        {
            id: "my-learning",
            title: "My Learning",
            description: "Track your learning progress",
            href: "/dashboard?tab=my-learning",
            icon: "fa fa-chart-line",
            category: "feature",
            requiresAuth: true,
            keywords: ["learning", "progress", "track", "stats"],
            gradient: "from-green-500 to-emerald-500",
        },
        {
            id: "enrollments",
            title: "Enrollments",
            description: "View your course enrollments",
            href: "/dashboard?tab=enrollments",
            icon: "fa fa-graduation-cap",
            category: "feature",
            requiresAuth: true,
            keywords: ["enrollments", "enrolled", "courses", "students"],
            gradient: "from-purple-500 to-pink-500",
        },
        {
            id: "expenditure",
            title: "Expenditure",
            description: "Track your spending and purchases",
            href: "/dashboard?tab=expenditure",
            icon: "fa fa-wallet",
            category: "feature",
            requiresAuth: true,
            keywords: ["expenditure", "spending", "purchases", "payments", "billing"],
            gradient: "from-orange-500 to-red-500",
        },
        {
            id: "reports",
            title: "My Reports",
            description: "View and manage your reports",
            href: "/dashboard?tab=reports",
            icon: "fa fa-bug",
            category: "feature",
            requiresAuth: true,
            keywords: ["reports", "issues", "bugs", "feedback", "support"],
            gradient: "from-red-500 to-pink-500",
        },
        {
            id: "contacts",
            title: "My Contacts",
            description: "Manage your contacts and connections",
            href: "/dashboard?tab=contact",
            icon: "fa fa-address-book",
            category: "feature",
            requiresAuth: true,
            keywords: ["contacts", "connections", "people", "network"],
            gradient: "from-blue-500 to-cyan-500",
        },
        {
            id: "friends",
            title: "Friends",
            description: "Manage your friends and connections",
            href: "/dashboard?tab=friends",
            icon: "fa fa-users",
            category: "feature",
            requiresAuth: true,
            keywords: ["friends", "connections", "social", "network"],
            gradient: "from-indigo-500 to-purple-500",
        },
        {
            id: "profile",
            title: "Profile",
            description: "View and edit your profile",
            href: "/dashboard?tab=profile",
            icon: "fa fa-user",
            category: "feature",
            requiresAuth: true,
            keywords: ["profile", "account", "settings", "edit"],
            gradient: "from-blue-500 to-cyan-500",
        },
        {
            id: "notifications",
            title: "Notifications",
            description: "View your notifications",
            href: "/dashboard?tab=notifications",
            icon: "fa fa-bell",
            category: "feature",
            requiresAuth: true,
            keywords: ["notifications", "alerts", "updates", "messages"],
            gradient: "from-orange-500 to-red-500",
        },
        {
            id: "settings",
            title: "Settings",
            description: "Manage your account settings",
            href: "/dashboard?tab=settings",
            icon: "fa fa-cog",
            category: "feature",
            requiresAuth: true,
            keywords: ["settings", "preferences", "config", "options"],
            gradient: "from-gray-500 to-slate-500",
        },
        // Pro Features
        {
            id: "create-course",
            title: "Create Course",
            description: "Create and publish your own course",
            href: "/dashboard?tab=my-courses&create=true",
            icon: "fa fa-video",
            category: "feature",
            requiresAuth: true,
            requiresPro: true,
            keywords: ["create", "course", "publish", "teach", "instructor"],
            gradient: "from-purple-500 to-pink-500",
        },
        {
            id: "instructor-dashboard",
            title: "Instructor Dashboard",
            description: "Manage your instructor account",
            href: "/dashboard?tab=instructors",
            icon: "fa fa-chalkboard-teacher",
            category: "feature",
            requiresAuth: true,
            requiresPro: true,
            keywords: ["instructor", "teach", "monetize", "earnings"],
            gradient: "from-orange-500 to-red-500",
        },
        {
            id: "analytics",
            title: "Analytics",
            description: "View detailed analytics and insights",
            href: "/dashboard?tab=analytics",
            icon: "fa fa-chart-pie",
            category: "feature",
            requiresAuth: true,
            requiresPro: true,
            keywords: ["analytics", "stats", "insights", "reports"],
            gradient: "from-indigo-500 to-purple-500",
        },
        {
            id: "earnings",
            title: "Earnings",
            description: "View your course earnings",
            href: "/dashboard?tab=earnings",
            icon: "fa fa-credit-card",
            category: "feature",
            requiresAuth: true,
            requiresPro: true,
            keywords: ["earnings", "money", "revenue", "income"],
            gradient: "from-green-500 to-emerald-500",
        },
        {
            id: "instructor-analytics",
            title: "Instructor Analytics",
            description: "Advanced analytics for instructors",
            href: "/dashboard?tab=analytics",
            icon: "fa fa-chart-bar",
            category: "feature",
            requiresAuth: true,
            requiresPro: true,
            keywords: ["analytics", "instructor", "stats", "performance"],
            gradient: "from-indigo-500 to-purple-500",
        },
        {
            id: "course-management",
            title: "Course Management",
            description: "Manage and edit your courses",
            href: "/dashboard?tab=my-courses",
            icon: "fa fa-book-open",
            category: "feature",
            requiresAuth: true,
            requiresPro: true,
            keywords: ["manage", "courses", "edit", "update", "content"],
            gradient: "from-purple-500 to-pink-500",
        },
        // Public Features
        {
            id: "courses",
            title: "Courses",
            description: "Browse all available courses",
            href: "/courses",
            icon: "fa fa-graduation-cap",
            category: "course",
            keywords: ["courses", "learn", "classes", "education", "training"],
            gradient: "from-indigo-500 to-purple-500",
        },
        {
            id: "instructors",
            title: "Instructors",
            description: "Meet our expert instructors",
            href: "/instructors",
            icon: "fa fa-users",
            category: "instructor",
            keywords: ["instructors", "teachers", "experts", "mentors"],
            gradient: "from-orange-500 to-red-500",
        },
        {
            id: "blog",
            title: "Blog",
            description: "Read latest articles and updates",
            href: "/blog",
            icon: "fa fa-newspaper-o",
            category: "blog",
            keywords: ["blog", "articles", "news", "posts", "updates"],
            gradient: "from-purple-500 to-pink-500",
        },
        {
            id: "forum",
            title: "Forum",
            description: "Join discussions and connect with learners",
            href: "/forum",
            icon: "fa fa-comments",
            category: "forum",
            requiresAuth: true,
            keywords: ["forum", "discussion", "community", "chat", "talk"],
            gradient: "from-blue-500 to-indigo-500",
        },
        {
            id: "privacy",
            title: "Privacy Policy",
            description: "Read our privacy policy",
            href: "/privacy",
            icon: "fa fa-shield",
            category: "page",
            keywords: ["privacy", "policy", "data", "protection", "security"],
            gradient: "from-indigo-500 to-purple-500",
        },
        {
            id: "terms",
            title: "Terms of Service",
            description: "Read our terms of service",
            href: "/terms",
            icon: "fa fa-file-text",
            category: "page",
            keywords: ["terms", "service", "agreement", "legal", "conditions"],
            gradient: "from-gray-500 to-slate-500",
        },
        {
            id: "demo",
            title: "Demo",
            description: "View platform demo",
            href: "/demo",
            icon: "fa fa-play-circle",
            category: "page",
            keywords: ["demo", "trial", "preview", "example", "showcase"],
            gradient: "from-blue-500 to-cyan-500",
        },
    ]

    // Filter features based on search query (optimized)
    const filteredFeatures = useMemo(() => {
        const featuresToUse = allFeatures.length > 0 ? allFeatures : fallbackFeatures
        
        if (!searchQuery.trim()) {
            return featuresToUse
        }

        const query = searchQuery.toLowerCase().trim()
        // Early return for empty query
        if (!query) return featuresToUse
        
        // Optimized filtering with early exits
        return featuresToUse.filter((feature) => {
            // Check title first (most common match)
            if (feature.title.toLowerCase().includes(query)) return true
            
            // Check description
            if (feature.description.toLowerCase().includes(query)) return true
            
            // Check keywords (only if needed)
            return feature.keywords.some((keyword) =>
                keyword.toLowerCase().includes(query)
            )
        })
    }, [searchQuery, allFeatures, fallbackFeatures])

    // Group features by category
    const groupedFeatures = useMemo(() => {
        const groups: Record<string, SearchFeature[]> = {}
        filteredFeatures.forEach((feature) => {
            if (!groups[feature.category]) {
                groups[feature.category] = []
            }
            groups[feature.category].push(feature)
        })
        return groups
    }, [filteredFeatures])

    const handleFeatureClick = useCallback(async (feature: SearchFeature) => {
        // Check if auth is required
        if (feature.requiresAuth && !isAuthenticated) {
            router.push(`/auth/start?redirect=${encodeURIComponent(feature.href)}`)
            onClose()
            return
        }

        // Check if pro is required
        if (feature.requiresPro) {
            if (!isAuthenticated) {
                router.push(`/auth/start?redirect=${encodeURIComponent(feature.href)}`)
                onClose()
                return
            }

            // Check Pro subscription
            if (!hasPro) {
                toast.info("This feature requires a Pro subscription", {
                    position: "top-center",
                    action: {
                        label: "View Plans",
                        onClick: () => router.push("/pricing"),
                    },
                })
                router.push("/pricing")
                onClose()
                return
            }
        }

        // Navigate to feature
        router.push(feature.href)
        onClose()
    }, [isAuthenticated, hasPro, router, onClose])

    const categoryLabels: Record<string, string> = {
        page: "Pages",
        feature: "Features",
        course: "Courses",
        instructor: "Instructors",
        blog: "Blog",
        forum: "Forum",
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="fixed inset-0 z-[101] flex items-start justify-center pt-20 px-4 pointer-events-none"
                    >
                        <div className="w-full max-w-3xl bg-background/95 backdrop-blur-2xl rounded-2xl border border-border shadow-2xl pointer-events-auto max-h-[80vh] flex flex-col overflow-hidden">
                            {/* Header */}
                            <div className="p-6 border-b border-border">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                                        <Search className="w-5 h-5 text-white" />
                                    </div>
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search features, courses, pages..."
                                        className="flex-1 bg-transparent text-md font-normal outline-none text-foreground placeholder:text-muted-foreground"
                                    />
                                    <kbd className="hidden sm:inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-muted px-2.5 text-xs font-medium text-muted-foreground">
                                        ESC
                                    </kbd>
                                </div>
                                {searchQuery && (
                                    <div className="text-sm text-muted-foreground">
                                        {filteredFeatures.length} result{filteredFeatures.length !== 1 ? "s" : ""} found
                                    </div>
                                )}
                            </div>

                            {/* Results */}
                            <div 
                                className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-6"
                                style={{ 
                                    willChange: 'scroll-position',
                                    overscrollBehavior: 'contain'
                                }}
                            >
                                {filteredFeatures.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                        <p className="text-muted-foreground">No results found</p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Try a different search term
                                        </p>
                                    </div>
                                ) : (
                                    Object.entries(groupedFeatures).map(([category, features]) => (
                                        <div key={category} className="space-y-2">
                                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                                                {categoryLabels[category] || category}
                                            </h3>
                                            <div className="space-y-1">
                                                {features.map((feature, index) => {
                                                    const globalIndex = filteredFeatures.findIndex(
                                                        (f) => f.id === feature.id
                                                    )
                                                    const isSelected = globalIndex === selectedIndex
                                                    const canAccess =
                                                        (!feature.requiresAuth || isAuthenticated) &&
                                                        (!feature.requiresPro || (isAuthenticated && hasPro))

                                                    return (
                                                        <button
                                                            key={feature.id}
                                                            onClick={() => handleFeatureClick(feature)}
                                                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-150 text-left ${
                                                                isSelected
                                                                    ? "bg-muted shadow-md"
                                                                    : "hover:bg-muted/50"
                                                            }`}
                                                            style={{ willChange: 'background-color' }}
                                                        >
                                                            {/* Icon */}
                                                            <div
                                                                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0`}
                                                            >
                                                                <FontAwesomeIcon 
                                                                    icon={feature.icon} 
                                                                    className="text-white text-lg" 
                                                                />
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="font-semibold text-foreground">
                                                                        {feature.title}
                                                                    </h4>
                                                                    {feature.requiresAuth && !isAuthenticated && (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-xs px-2 py-0"
                                                                        >
                                                                            <Lock className="w-3 h-3 mr-1" />
                                                                            Sign In
                                                                        </Badge>
                                                                    )}
                                                                    {feature.requiresPro && (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-500 border-purple-500/30 text-xs px-2 py-0"
                                                                        >
                                                                            <Crown className="w-3 h-3 mr-1" />
                                                                            Pro
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                                    {feature.description}
                                                                </p>
                                                            </div>

                                                            {/* Arrow */}
                                                            <ArrowRight
                                                                className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${
                                                                    isSelected ? "translate-x-1" : ""
                                                                }`}
                                                            />
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-border bg-muted/30">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                            <kbd className="px-1.5 py-0.5 rounded border border-border bg-background">
                                                ↑↓
                                            </kbd>
                                            <span>Navigate</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <kbd className="px-1.5 py-0.5 rounded border border-border bg-background">
                                                Enter
                                            </kbd>
                                            <span>Select</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 rounded border border-border bg-background">
                                            Esc
                                        </kbd>
                                        <span>Close</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

