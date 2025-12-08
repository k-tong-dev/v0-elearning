"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button, Chip } from "@heroui/react"
import { useCart } from "@/contexts/CartContext"
import { ShoppingCart, Trash2, CreditCard, CheckCircle, Maximize2, Minimize2, X, Heart, BookOpen, Star, Clock, GripVertical, Sparkles } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import dynamic from "next/dynamic"

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false })
import { getPublicCourseCourses } from "@/integrations/strapi/courseCourse"
import { cn } from "@/utils/utils"
import { getUserWishlists, deleteUserWishlist, createUserWishlist, UserWishlistEntry } from "@/integrations/strapi/userWishlist"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import { getCoursePreview, getCoursePreviewUrl } from "@/integrations/strapi/coursePreview"
import { MdRecommend } from "react-icons/md";


interface CartModalProps {
    isOpen: boolean
    onClose: () => void
}

type TabType = "cart" | "favorites" | "recommended"

export function CartModal({ isOpen, onClose }: CartModalProps) {
    const router = useRouter()
    const { items, removeFromCart, clearCart, totalPrice, totalPriceFormatted, itemCount, addToCart, isInCart, isInCartByDocumentId } = useCart()
    const { isAuthenticated, user } = useAuth()
    const [isProcessing, setIsProcessing] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [activeTab, setActiveTab] = useState<TabType>("cart")
    const [recommendedCourses, setRecommendedCourses] = useState<any[]>([])
    const [isLoadingRecommended, setIsLoadingRecommended] = useState(false)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [wishlistItems, setWishlistItems] = useState<Array<UserWishlistEntry & { course?: any }>>([])
    const [isLoadingWishlist, setIsLoadingWishlist] = useState(false)
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
    const [addingToCartId, setAddingToCartId] = useState<number | null>(null) // Track which course is being added
    const [removingFromWishlistId, setRemovingFromWishlistId] = useState<string | null>(null) // Track which course is being removed (by documentId)
    const [addingToWishlistId, setAddingToWishlistId] = useState<string | null>(null) // Track which course is being added to wishlist (by documentId)

    // Auto-select first item when cart loads
    useEffect(() => {
        if (items.length > 0 && !selectedItemId) {
            setSelectedItemId(items[0].id)
        } else if (items.length === 0) {
            setSelectedItemId(null)
        }
    }, [items, selectedItemId])

    // Calculate order summary for selected item only
    const selectedItem = useMemo(() => {
        return items.find(item => item.id === selectedItemId) || null
    }, [items, selectedItemId])

    const selectedTotalPrice = selectedItem ? selectedItem.price : 0
    const selectedTotalFormatted = selectedItem ? `$${selectedItem.price.toFixed(2)}` : "$0.00"

    // Reset position when modal opens or fullscreen toggles
    useEffect(() => {
        if (isOpen) {
            setPosition({ x: 0, y: 0 })
        }
    }, [isOpen, isFullscreen])

    const loadWishlist = useCallback(async () => {
        if (!user?.id) return
        try {
            setIsLoadingWishlist(true)
            const wishlists = await getUserWishlists(user.id)
            
            // Load course details for each wishlist item
            const courses = await getPublicCourseCourses()
            const wishlistPromises = wishlists.map(async (wishlist) => {
                // Find course by documentId first (more reliable), then fallback to numeric ID
                const course = wishlist.courseDocumentId
                    ? courses.find(c => c.documentId === wishlist.courseDocumentId)
                    : courses.find(c => c.id === wishlist.courseId)
                
                if (!course) {
                    console.warn("Course not found for wishlist entry:", {
                        wishlistId: wishlist.id,
                        courseId: wishlist.courseId,
                        courseDocumentId: wishlist.courseDocumentId
                    })
                    return {
                        ...wishlist,
                        course: undefined
                    }
                }

                // Get proper image URL and preview type using getCoursePreview() function
                let imageUrl = "/placeholder.svg"
                let previewType: "image" | "url" | "video" = "image"
                
                const previewId = course.course_preview?.id || course.course_preview?.documentId
                if (previewId) {
                    try {
                        const preview = await getCoursePreview(previewId)
                        if (preview) {
                            previewType = preview.types || "image"
                            const previewUrl = getCoursePreviewUrl(preview)
                            if (previewUrl) {
                                imageUrl = previewUrl
                            }
                        }
                    } catch (error) {
                        console.warn("Failed to fetch course preview:", error)
                    }
                }

                return {
                    ...wishlist,
                    course: {
                        ...course,
                        image: getAvatarUrl(imageUrl) || "/placeholder.svg",
                        previewType: previewType,
                        name: course.name || "Untitled Course",
                        description: course.description || "No description available",
                        Price: course.Price || 0,
                    }
                }
            })
            
            const wishlistWithCourses = await Promise.all(wishlistPromises)
            setWishlistItems(wishlistWithCourses)
        } catch (error) {
            console.error("Failed to load wishlist:", error)
            toast.error("Failed to load favorites")
        } finally {
            setIsLoadingWishlist(false)
        }
    }, [user?.id])

    // Auto-load recommended courses when modal opens OR when cart items change
    useEffect(() => {
        if (isOpen) {
            // Clear old recommendations first to prevent stale data
            setRecommendedCourses([])
            loadRecommendedCourses()
        }
    }, [isOpen, items.length]) // Reload when modal opens or items count changes

    // Auto-load wishlist when modal opens OR when cart items change (for authenticated users)
    useEffect(() => {
        if (isOpen && isAuthenticated && user) {
            loadWishlist()
        }
    }, [isOpen, items.length, isAuthenticated, user, loadWishlist]) // Reload when modal opens or items count changes

    // Listen for wishlist changes from other components (like courses page)
    useEffect(() => {
        const handleWishlistChange = (event: CustomEvent) => {
            // Skip reload if the event says to skip (to prevent overwriting optimistic updates)
            if (event.detail?.skipReload) {
                return
            }
            if (isAuthenticated && user) {
                loadWishlist()
            }
        }

        window.addEventListener('wishlist-changed', handleWishlistChange as EventListener)
        return () => {
            window.removeEventListener('wishlist-changed', handleWishlistChange as EventListener)
        }
    }, [isAuthenticated, user, loadWishlist])

    const loadRecommendedCourses = async () => {
        try {
            setIsLoadingRecommended(true)
            const courses = await getPublicCourseCourses()

            const cartCourseDocumentIds = items.map(item => item.courseDocumentId).filter(Boolean)

            // Filter: only paid courses, not in cart, random 6
            const paidCourses = courses.filter(c => {
                const isInCart = cartCourseDocumentIds.includes(c.documentId)
                console.log(`Course ${c.id}/${c.documentId} (${c.name}) - In Cart: ${isInCart}`)
                return c.is_paid && c.Price > 0 && !isInCart
            })
            if (paidCourses.length === 0) {
                setRecommendedCourses([]);
                return
            }

            const shuffled = paidCourses.sort(() => 0.5 - Math.random())
            const selected = shuffled.slice(0, 6)
            
            const coursesWithImages = await Promise.all(
                selected.map(async (course) => {
                    let imageUrl = "/placeholder.svg"
                    let previewType: "image" | "url" | "video" = "image"
                    
                    const previewId = course.course_preview?.id || course.course_preview?.documentId;
                    if (previewId) {
                        try {
                            const preview = await getCoursePreview(previewId);
                            if (preview) {
                                previewType = preview.types || "image"
                                const previewUrl = getCoursePreviewUrl(preview);
                                if (previewUrl) {
                                    imageUrl = previewUrl
                                }
                            }
                        } catch (error) {
                            console.warn("Failed to fetch course preview:", error)
                        }
                    }
                    return {
                        ...course,
                        preloadedImage: getAvatarUrl(imageUrl) || "/placeholder.svg",
                        previewType: previewType
                    }
                })
            )
            
            console.log("✅ Setting recommended courses:", coursesWithImages.length)
            setRecommendedCourses(coursesWithImages)
        } catch (error) {
            console.error("Failed to load recommended courses:", error)
        } finally {
            setIsLoadingRecommended(false)
        }
    }

    const handleRemoveFromWishlist = async (courseDocumentId: string) => {
        // Find by documentId instead of courseId
        const wishlistEntry = wishlistItems.find(item => item.courseDocumentId === courseDocumentId)
        if (!wishlistEntry) {
            console.warn("Cannot remove: wishlist entry not found for courseDocumentId:", courseDocumentId)
            toast.error("Favorite item not found")
            return
        }
        
        // Set loading state
        setRemovingFromWishlistId(courseDocumentId)
        
        console.log("Removing favorite:", { 
            courseDocumentId, 
            wishlistEntryId: wishlistEntry.id, 
            wishlistDocumentId: wishlistEntry.documentId,
            currentCount: wishlistItems.length 
        })
        
        // Optimistic update: Remove from UI immediately (this will make the card disappear instantly)
        const previousWishlistItems = [...wishlistItems]
        setWishlistItems(prev => {
            const filtered = prev.filter(item => {
                const itemDocId = item.courseDocumentId || item.course?.documentId
                const shouldKeep = itemDocId !== courseDocumentId
                if (!shouldKeep) {
                    console.log("Removing item from wishlistItems:", { itemDocId, courseDocumentId, itemId: item.id })
                }
                return shouldKeep
            })
            console.log("After filter:", { before: prev.length, after: filtered.length, courseDocumentId, removed: prev.length > filtered.length })
            return filtered
        })
        
        // Dispatch custom event immediately for other components (but skip reload in this component)
        // Include both courseId and courseDocumentId for proper matching
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('wishlist-changed', { 
                detail: { 
                    action: 'removed', 
                    courseId: wishlistEntry.courseId, // Include courseId for courses page
                    courseDocumentId, 
                    skipReload: true 
                } 
            }))
        }
        
        try {
            // Use documentId for deletion (more reliable in Strapi v5)
            // Prefer documentId, fallback to numeric ID
            const identifier = wishlistEntry.documentId || wishlistEntry.id
            console.log("Deleting from Strapi with identifier:", identifier)
            
            const success = await deleteUserWishlist(wishlistEntry.id, wishlistEntry.documentId)
            
            if (success) {
                console.log("Successfully deleted from Strapi")
                toast.success("Successfully removed from favorites")
            } else {
                throw new Error("Delete operation returned false")
            }
        } catch (error: any) {
            console.error("Failed to remove from wishlist:", error)
            // Revert optimistic update on error
            setWishlistItems(previousWishlistItems)
            
            // Show detailed error message
            const errorMessage = error?.message || error?.response?.data?.error?.message || "Failed to remove from favorites"
            toast.error(`Error: ${errorMessage}`)
        } finally {
            // Clear loading state
            setRemovingFromWishlistId(null)
        }
    }

    const handleAddToWishlist = async (courseId: number, courseDocumentId?: string) => {
        if (!user?.id) {
            toast.error("Please sign in to add favorites")
            return
        }

        // Check if already in wishlist by documentId (more reliable)
        const existing = courseDocumentId 
            ? wishlistItems.find(item => item.courseDocumentId === courseDocumentId)
            : wishlistItems.find(item => item.courseId === courseId)
        if (existing) {
            toast.info("This course is already in your favorites")
            return
        }

        // Set loading state
        const loadingKey = courseDocumentId || String(courseId)
        setAddingToWishlistId(loadingKey)

        // Optimistic update: Create a temporary entry immediately
        const tempEntry: UserWishlistEntry & { course?: any } = {
            id: Date.now(), // Temporary ID
            courseId: courseId,
            courseDocumentId: courseDocumentId,
            course: undefined // Will be loaded from server
        }
        setWishlistItems(prev => [...prev, tempEntry])
        
        // Dispatch custom event immediately for other components (but skip reload in this component)
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('wishlist-changed', { 
                detail: { action: 'added', courseId, courseDocumentId, skipReload: true } 
            }))
        }

        try {
            console.log("Adding to wishlist:", { userId: user.id, courseId, courseDocumentId })
            const created = await createUserWishlist(user.id, courseId)
            
            if (created) {
                console.log("Successfully created wishlist entry:", created)
                // Replace temp entry with real entry from server (includes full course data)
                setWishlistItems(prev => {
                    // Remove temp entry and add real one
                    const withoutTemp = prev.filter(item => item.id !== tempEntry.id)
                    // Load course data for the new entry
                    return [...withoutTemp, {
                        ...created,
                        course: tempEntry.course // Keep any course data we had
                    }]
                })
                
                // Reload wishlist to get full course data
                await loadWishlist()
                toast.success("Successfully added to favorites")
            } else {
                throw new Error("Create operation returned null")
            }
        } catch (error: any) {
            console.error("Failed to add to wishlist:", error)
            // Revert optimistic update on error
            setWishlistItems(prev => {
                if (courseDocumentId) {
                    return prev.filter(item => item.courseDocumentId !== courseDocumentId)
                }
                return prev.filter(item => item.courseId !== courseId)
            })
            
            // Show detailed error message
            const errorMessage = error?.message || error?.response?.data?.error?.message || "Failed to add to favorites"
            toast.error(`Error: ${errorMessage}`)
        } finally {
            // Clear loading state
            setAddingToWishlistId(null)
        }
    }

    const isInWishlist = (courseId: number, courseDocumentId?: string) => {
        // Prefer documentId comparison (more reliable in Strapi v5)
        if (courseDocumentId) {
            return wishlistItems.some(item => item.courseDocumentId === courseDocumentId)
        }
        // Fallback to numeric ID comparison
        const targetId = Number(courseId)
        return wishlistItems.some(item => {
            const itemId = Number(item.courseId)
            return itemId === targetId && !isNaN(itemId) && !isNaN(targetId)
        })
    }

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            toast.error("Please sign in to checkout")
            onClose()
            router.push("/auth/start")
            return
        }

        if (!selectedItem) {
            toast.error("Please select a course to checkout")
            return
        }

        setIsProcessing(true)
        
        try {
            // Navigate to checkout page with selected course data
            const checkoutData = {
                courseId: selectedItem.courseId,
                cartItemId: selectedItem.strapiCartItemId,
                title: selectedItem.title,
                description: selectedItem.description,
                image: selectedItem.image,
                previewType: selectedItem.previewType,
                price: selectedItem.price,
                instructor: selectedItem.instructor,
            }
            
            // Store in sessionStorage for checkout page to access
            sessionStorage.setItem('checkoutCourse', JSON.stringify(checkoutData))
            
            onClose()
            router.push('/checkout')
        } catch (error) {
            console.error("Failed to initiate checkout:", error)
            toast.error("Failed to proceed to checkout")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleAddRecommendedToCart = async (course: any) => {
        // Check if already in cart using documentId (more reliable)
        if (course.documentId && isInCartByDocumentId(course.documentId)) {
            toast.info("This course is already in your cart")
            return
        }

        setAddingToCartId(course.id)
        
        try {
            // Use preloaded image from loadRecommendedCourses
            const imageUrl = course.preloadedImage || "/placeholder.svg"

            await addToCart({
                id: course.id,
                title: course.name || "Untitled Course",
                description: course.description || "",
                image: imageUrl,
                priceValue: course.Price || 0,
                price: `$${(course.Price || 0).toFixed(2)}`,
                educator: course.instructors?.[0]?.name || "Unknown"
            })

            toast.success("Added to cart!")
        } catch (error) {
            console.error("Failed to add to cart:", error)
            toast.error("Failed to add to cart")
        } finally {
            setAddingToCartId(null)
        }
    }

    const getCourseImage = (course: any): string => {
        // Use preloaded image if available
        if (course.preloadedImage) {
            return course.preloadedImage
        }
        return "/placeholder.svg"
    }

    const tabs = [
        { id: "cart" as TabType, label: "Cart", icon: ShoppingCart, count: itemCount },
        { id: "favorites" as TabType, label: "Favorites", icon: Heart, count: wishlistItems.length },
        { id: "recommended" as TabType, label: "For You", icon: MdRecommend, count: recommendedCourses.length },
    ]

    const handleDragEnd = (event: any, info: any) => {
        if (typeof window === 'undefined') return
        
        const newX = position.x + info.offset.x
        const newY = position.y + info.offset.y
        
        // Calculate modal dimensions
        const modalWidth = Math.min(window.innerWidth * 0.9, 1280)
        const modalHeight = window.innerHeight * 0.9
        
        // Calculate boundaries to keep modal visible
        const maxX = (window.innerWidth - modalWidth) / 2
        const maxY = (window.innerHeight - modalHeight) / 2
        const minX = -maxX
        const minY = -maxY
        
        // Clamp position within boundaries
        const clampedX = Math.max(minX, Math.min(maxX, newX))
        const clampedY = Math.max(minY, Math.min(maxY, newY))
        
        setPosition({ x: clampedX, y: clampedY })
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Draggable Modal - No background wrapper */}
                    <motion.div
                        key="cart-modal"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1,
                            x: position.x,
                            y: position.y
                        }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                            drag={!isFullscreen}
                            dragMomentum={false}
                        dragElastic={0}
                        onDragEnd={handleDragEnd}
                            className={cn(
                            // "fixed z-[10000] pointer-events-auto border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col",
                            "fixed z-[10000] pointer-events-auto border border-slate-200 dark:border-slate-700 bg-transparent backdrop-blur-sm  shadow-2xl overflow-hidden flex flex-col",
                            isFullscreen
                                ? "inset-0 w-screen h-screen rounded-none" 
                                : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl sm:rounded-2xl lg:rounded-3xl max-w-7xl w-[95vw] sm:w-[90vw] md:w-[85vw] max-h-[95vh] sm:max-h-[90vh]"
                            )}
                        >
                        {/* Header with drag handle */}
                        <div 
                            className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing select-none p-4"
                        >
                            <div className="flex items-center gap-3">
                                {!isFullscreen && (
                                    <GripVertical className="w-5 h-5 text-slate-400" />
                                )}
                                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                                    <ShoppingCart className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Shopping Hub</h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                                        Manage your learning journey
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => setIsFullscreen(!isFullscreen)}
                                >
                                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </Button>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={onClose}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="p-0 flex-1 overflow-hidden">
                            {/* Mobile Tabs - Horizontal */}
                            <div className="md:hidden border-b border-slate-200 dark:border-slate-700 p-3">
                                <div className="flex gap-2 overflow-x-auto">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon
                                        const isActive = activeTab === tab.id
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                                                    isActive
                                                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                                                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                                }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="font-semibold text-sm">{tab.label}</span>
                                                {tab.count > 0 && (
                                                    <Chip size="sm" className={isActive ? "bg-white/20" : "bg-blue-100 dark:bg-blue-900"}>
                                                        {tab.count}
                                                    </Chip>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="flex h-full">
                                {/* Sidebar Navigation - Desktop */}
                                <div className="hidden md:block w-48 lg:w-64 border-r border-slate-200 dark:border-slate-700 p-3 lg:p-4 space-y-2">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon
                                        const isActive = activeTab === tab.id
                                        return (
                                            <motion.button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`w-full flex items-center justify-between gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl transition-all ${
                                                    isActive
                                                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-lg"
                                                        : "hover:bg-slate-100 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300"
                                                }`}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className="flex items-center gap-2 lg:gap-3">
                                                    <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                                                    <span className="font-semibold text-sm lg:text-base">{tab.label}</span>
                                                </div>
                                                {tab.count > 0 && (
                                                    <Chip 
                                                        size="sm" 
                                                        className={"bg-pink-500 text-white"}
                                                    >
                                                        {tab.count}
                                                    </Chip>
                                                )}
                                            </motion.button>
                                        )
                                    })}
                                    
                                    {/* Pro Tip Box */}
                                    <div className="mt-4 lg:mt-6 p-3 lg:p-4 rounded-lg lg:rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                                        <div className="flex items-start gap-2">
                                            <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-semibold text-xs lg:text-sm text-purple-900 dark:text-purple-100 mb-1">
                                                    Pro Tip
                                                </h4>
                                                <p className="text-[10px] lg:text-xs text-purple-700 dark:text-purple-300">
                                                    Save more when you buy multiple courses together!
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Content Area */}
                                <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto">
                                    <AnimatePresence mode="wait">
                                        {activeTab === "cart" && (
                                            <motion.div
                                                key="cart"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                {items.length === 0 ? (
                                                    <div className="text-center py-20">
                                                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                            <ShoppingCart className="w-12 h-12 text-slate-400 dark:text-slate-600" />
                                                        </div>
                                                        <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Your cart is empty</h3>
                                                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                                                            Add courses to start learning today!
                                                        </p>
                                                        <Button
                                                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                                                            onPress={() => {
                                                                onClose()
                                                                router.push("/courses")
                                                            }}
                                                        >
                                                            Browse Courses
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                        {/* Cart Items */}
                                                        <div className="lg:col-span-2 space-y-3">
                                                            <h3 className="text-lg font-bold mb-4">Cart Items ({itemCount})</h3>
                                                            <AnimatePresence mode="popLayout">
                                                                {items.map((item, index) => {
                                                                    const isSelected = selectedItemId === item.id
                                                                    return (
                                                                    <motion.div
                                                                        key={item.id}
                                                                        initial={{ opacity: 0, y: 20 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                                        transition={{ delay: index * 0.05 }}
                                                                            onClick={() => setSelectedItemId(item.id)}
                                                                            className={cn(
                                                                                "bg-white dark:bg-slate-800 rounded-xl p-4 border-2 hover:shadow-lg transition-all cursor-pointer",
                                                                                isSelected 
                                                                                    ? "border-blue-500 shadow-lg ring-2 ring-blue-500/20" 
                                                                                    : "border-slate-200 dark:border-slate-700"
                                                                            )}
                                                                    >
                                                                        <div className="flex gap-4">
                                                                                {/* Selection Radio Button */}
                                                                                <div className="flex items-center">
                                                                                    <div className={cn(
                                                                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                                                        isSelected 
                                                                                            ? "border-blue-500 bg-blue-500" 
                                                                                            : "border-slate-300 dark:border-slate-600"
                                                                                    )}>
                                                                                        {isSelected && (
                                                                                            <div className="w-2 h-2 rounded-full bg-white" />
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                                                                                {item.previewType === "url" || item.previewType === "video" ? (
                                                                                    <ReactPlayer
                                                                                        src={item.image}
                                                                                        width="100%"
                                                                                        height="100%"
                                                                                        light={true}
                                                                                        playing={false}
                                                                                        controls={false}
                                                                                        className="react-player"
                                                                                    />
                                                                                ) : (
                                                                                <Image
                                                                                    src={item.image}
                                                                                    alt={item.title}
                                                                                    fill
                                                                                    className="object-cover"
                                                                                />
                                                                                )}
                                                                            </div>
                                                                            
                                                                            <div className="flex-1 min-w-0">
                                                                                <h4 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1 mb-1">
                                                                                    {item.title}
                                                                                </h4>
                                                                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                                                                                    {item.description}
                                                                                </p>
                                                                                <p className="text-xs text-slate-500 dark:text-slate-500">
                                                                                    by {item.instructor}
                                                                                </p>
                                                                            </div>
                                                                            
                                                                            <div className="flex flex-col items-end justify-between">
                                                                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                                                    {isAuthenticated && (
                                                                                        <Button
                                                                                            isIconOnly
                                                                                            variant="light"
                                                                                            color={isInWishlist(item.courseId, item.courseDocumentId) ? "danger" : "default"}
                                                                                            size="sm"
                                                                                            isLoading={addingToWishlistId === (item.courseDocumentId || String(item.courseId)) || removingFromWishlistId === (item.courseDocumentId || String(item.courseId))}
                                                                                            isDisabled={addingToWishlistId === (item.courseDocumentId || String(item.courseId)) || removingFromWishlistId === (item.courseDocumentId || String(item.courseId))}
                                                                                            onPress={() => {
                                                                                                if (isInWishlist(item.courseId, item.courseDocumentId)) {
                                                                                                    handleRemoveFromWishlist(item.courseDocumentId || String(item.courseId))
                                                                                                } else {
                                                                                                    handleAddToWishlist(item.courseId, item.courseDocumentId)
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <Heart className={cn(
                                                                                                "w-4 h-4",
                                                                                                isInWishlist(item.courseId, item.courseDocumentId) && "fill-current"
                                                                                            )} />
                                                                                        </Button>
                                                                                    )}
                                                                                    <Button
                                                                                        isIconOnly
                                                                                        variant="light"
                                                                                        color="danger"
                                                                                        size="sm"
                                                                                        onPress={() => removeFromCart(item.courseId)}
                                                                                    >
                                                                                        <Trash2 className="w-4 h-4" />
                                                                                    </Button>
                                                                                </div>
                                                                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                                                    {item.priceFormatted}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                                )}
                                                            </AnimatePresence>
                                                            
                                                            <Button
                                                                variant="light"
                                                                color="danger"
                                                                startContent={<Trash2 className="w-4 h-4" />}
                                                                onPress={clearCart}
                                                                className="w-fit mt-4 float-end"
                                                            >
                                                                Clear Cart
                                                            </Button>
                                                        </div>

                                                        {/* Order Summary */}
                                                        <div className="lg:col-span-1">
                                                            <div className="sticky top-0 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                                                    Order Summary
                                                                </h3>

                                                                {selectedItem ? (
                                                                    <>
                                                                        {/* Selected Course Info */}
                                                                        <div className="bg-white dark:bg-slate-700/50 rounded-lg p-3 space-y-2">
                                                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                                                                                Selected Course
                                                                            </p>
                                                                            <div className="flex gap-3">
                                                                                <div className="relative w-16 h-12 flex-shrink-0 rounded overflow-hidden">
                                                                                    {selectedItem.previewType === "url" || selectedItem.previewType === "video" ? (
                                                                                        <ReactPlayer
                                                                                            src={selectedItem.image}
                                                                                            width="100%"
                                                                                            height="100%"
                                                                                            light={true}
                                                                                            playing={false}
                                                                                            controls={false}
                                                                                            className="react-player"
                                                                                        />
                                                                                    ) : (
                                                                                        <Image
                                                                                            src={selectedItem.image}
                                                                                            alt={selectedItem.title}
                                                                                            fill
                                                                                            className="object-cover"
                                                                                        />
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="font-semibold text-sm line-clamp-2 text-slate-900 dark:text-white">
                                                                                        {selectedItem.title}
                                                                                    </p>
                                                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                                        by {selectedItem.instructor}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                
                                                                <div className="space-y-3 py-4 border-y border-slate-200 dark:border-slate-700">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                                                                                <span className="font-semibold">{selectedTotalFormatted}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-slate-600 dark:text-slate-400">Tax</span>
                                                                        <span className="font-semibold">$0.00</span>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="flex justify-between text-xl font-bold text-slate-900 dark:text-white">
                                                                    <span>Total</span>
                                                                            <span className="text-blue-600 dark:text-blue-400">{selectedTotalFormatted}</span>
                                                                </div>
                                                                
                                                                <Button
                                                                    className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-normal text-lg h-12"
                                                                    startContent={isProcessing ? null : <CreditCard className="w-5 h-5" />}
                                                                    onPress={handleCheckout}
                                                                    isLoading={isProcessing}
                                                                >
                                                                    {isProcessing ? "Processing..." : "Checkout Now"}
                                                                </Button>
                                                                    </>
                                                                ) : (
                                                                    <div className="text-center py-8">
                                                                        <p className="text-slate-500 dark:text-slate-400">
                                                                            Select a course to checkout
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                
                                                                <div className="space-y-2 pt-4">
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                                        <span className="text-slate-700 dark:text-slate-300">30-day money-back guarantee</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                                        <span className="text-slate-700 dark:text-slate-300">Lifetime access to courses</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        {activeTab === "favorites" && (
                                            <motion.div
                                                key="favorites"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                {isLoadingWishlist ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        {Array.from({ length: 6 }).map((_, i) => (
                                                            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-xl h-64 animate-pulse" />
                                                        ))}
                                                    </div>
                                                ) : wishlistItems.length === 0 ? (
                                                    <div className="text-center py-20">
                                                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center">
                                                            <Heart className="w-12 h-12 text-rose-400 dark:text-rose-600" />
                                                        </div>
                                                        <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                                                            {isAuthenticated ? "No favorites yet" : "Sign in to save favorites"}
                                                        </h3>
                                                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                                                            {isAuthenticated
                                                                ? "Start adding courses to your favorites for easy access!"
                                                                : "Create an account to save your favorite courses"}
                                                        </p>
                                                        {!isAuthenticated && (
                                                            <Button
                                                                className="bg-gradient-to-r from-rose-500 to-purple-500 text-white"
                                                                onPress={() => {
                                                                    onClose()
                                                                    router.push("/auth/start")
                                                                }}
                                                            >
                                                                Sign In
                                                            </Button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        <AnimatePresence mode="popLayout">
                                                            {wishlistItems.map((item, index) => (
                                                                <motion.div
                                                                    key={item.documentId || item.id || `wishlist-${item.courseId}`}
                                                                    initial={{ opacity: 0, y: 20 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                                                    transition={{ delay: index * 0.05, duration: 0.2 }}
                                                                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all group"
                                                                >
                                                                <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                                                                    {item.course?.previewType === "url" || item.course?.previewType === "video" ? (
                                                                        <ReactPlayer
                                                                            src={item.course?.image || "/placeholder.svg"}
                                                                            width="100%"
                                                                            height="100%"
                                                                            light={true}
                                                                            playing={false}
                                                                            controls={false}
                                                                            className="react-player"
                                                                        />
                                                                    ) : (
                                                                        <Image
                                                                            src={item.course?.image || "/placeholder.svg"}
                                                                            alt={item.course?.name || "Course"}
                                                                            fill
                                                                            className="object-cover group-hover:scale-105 transition-transform"
                                                                        />
                                                                    )}
                                                                    {item.course?.Price && (
                                                                        <div className="absolute top-3 right-3">
                                                                            <Chip 
                                                                                className="bg-rose-500 text-white font-bold"
                                                                                size="sm"
                                                                            >
                                                                                ${item.course.Price.toFixed(2)}
                                                                            </Chip>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                
                                                                <div className="p-4">
                                                                    <h4 className="font-bold text-base mb-2 line-clamp-2 min-h-[48px]">
                                                                        {item.course?.name || "Course unavailable"}
                                                                    </h4>
                                                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                                                                        {item.course?.description || "No description"}
                                                                    </p>
                                                                    
                                                                    <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
                                                                        <div className="flex items-center gap-1">
                                                                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                                            <span>4.5</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <Clock className="w-3.5 h-3.5" />
                                                                            <span>{item.course?.duration_minutes || 120}min</span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold"
                                                                            size="sm"
                                                                            startContent={addingToCartId === item.courseId ? null : <ShoppingCart className="w-3.5 h-3.5" />}
                                                                            isDisabled={
                                                                                item.courseId 
                                                                                    ? (
                                                                                        (item.course?.documentId && isInCartByDocumentId(item.course.documentId)) ||
                                                                                        isInCart(item.courseId) ||
                                                                                        addingToCartId === item.courseId
                                                                                    )
                                                                                    : true
                                                                            }
                                                                            isLoading={addingToCartId === item.courseId}
                                                                            onPress={async () => {
                                                                                if (item.course && item.courseId) {
                                                                                    // Check if already in cart using documentId (more reliable)
                                                                                    const inCartByDocId = item.course.documentId && isInCartByDocumentId(item.course.documentId)
                                                                                    const inCartById = isInCart(item.courseId)
                                                                                    
                                                                                    if (inCartByDocId || inCartById) {
                                                                                        toast.info("This course is already in your cart")
                                                                                        return
                                                                                    }

                                                                                    setAddingToCartId(item.courseId)
                                                                                    
                                                                                    try {
                                                                                        await addToCart({
                                                                                            id: item.courseId,
                                                                                            title: item.course.name || "Untitled Course",
                                                                                            description: item.course.description || "",
                                                                                            image: item.course.image || "/placeholder.svg",
                                                                                            priceValue: item.course.Price || 0,
                                                                                            price: `$${(item.course.Price || 0).toFixed(2)}`,
                                                                                            educator: "Unknown",
                                                                                        })
                                                                                        toast.success("Added to cart!")
                                                                                        setActiveTab("cart")
                                                                                    } catch (error) {
                                                                                        console.error("Failed to add to cart:", error)
                                                                                        toast.error("Failed to add to cart")
                                                                                    } finally {
                                                                                        setAddingToCartId(null)
                                                                                    }
                                                                                }
                                                                            }}
                                                                        >
                                                                            {
                                                                                (item.course?.documentId && isInCartByDocumentId(item.course.documentId)) || 
                                                                                (item.courseId && isInCart(item.courseId))
                                                                                    ? "In Cart" 
                                                                                    : addingToCartId === item.courseId 
                                                                                        ? "Adding..." 
                                                                                        : "Add to Cart"
                                                                            }
                                                                        </Button>
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="light"
                                                                            color="danger"
                                                                            isLoading={removingFromWishlistId === (item.courseDocumentId || item.course?.documentId)}
                                                                            isDisabled={removingFromWishlistId === (item.courseDocumentId || item.course?.documentId)}
                                                                            onPress={() => {
                                                                                const docId = item.courseDocumentId || item.course?.documentId
                                                                                if (docId) {
                                                                                    handleRemoveFromWishlist(docId)
                                                                                }
                                                                            }}
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                            )
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        {activeTab === "recommended" && (
                                            <motion.div
                                                key="recommended"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div className="flex items-center justify-between mb-6">
                                                    <div>
                                                        <h3 className="text-2xl font-bold">Recommended For You</h3>
                                                        <p className="text-slate-600 dark:text-slate-400">Based on popular courses</p>
                                                    </div>
                                                </div>

                                                {isLoadingRecommended ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {Array.from({ length: 6 }).map((_, i) => (
                                                            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-xl h-64 animate-pulse" />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        {recommendedCourses
                                                            .filter(course => {
                                                                // Safety check: Don't show courses already in cart
                                                                const inCart = (course.documentId && isInCartByDocumentId(course.documentId)) || isInCart(course.id)
                                                                if (inCart) {
                                                                    console.warn("⚠️ Course in cart but still in recommendations:", course.name)
                                                                }
                                                                return !inCart
                                                            })
                                                            .map((course, index) => (
                                                            <motion.div
                                                                key={course.id}
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: index * 0.1 }}
                                                                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                                                                onClick={() => {
                                                                    onClose()
                                                                    router.push(`/courses/${course.id}`)
                                                                }}
                                                            >
                                                                <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                                                                    {course.previewType === "url" || course.previewType === "video" ? (
                                                                        <ReactPlayer
                                                                            src={getCourseImage(course)}
                                                                            width="100%"
                                                                            height="100%"
                                                                            light={true}
                                                                            playing={false}
                                                                            controls={false}
                                                                            className="react-player"
                                                                        />
                                                                    ) : (
                                                                    <Image
                                                                            src={getCourseImage(course)}
                                                                            alt={course.name || "Course"}
                                                                        fill
                                                                        className="object-cover group-hover:scale-105 transition-transform"
                                                                    />
                                                                    )}
                                                                    <div className="absolute top-3 right-3 flex gap-2">
                                                                        {isAuthenticated && (
                                                                            <Button
                                                                                isIconOnly
                                                                                size="sm"
                                                                                variant="solid"
                                                                                className={cn(
                                                                                    "bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm",
                                                                                    isInWishlist(course.id, course.documentId) && "bg-rose-500 text-white"
                                                                                )}
                                                                                isLoading={addingToWishlistId === (course.documentId || String(course.id)) || removingFromWishlistId === (course.documentId || String(course.id))}
                                                                                isDisabled={addingToWishlistId === (course.documentId || String(course.id)) || removingFromWishlistId === (course.documentId || String(course.id))}
                                                                                onPress={(e) => {
                                                                                    e.stopPropagation()
                                                                                    if (isInWishlist(course.id, course.documentId)) {
                                                                                        handleRemoveFromWishlist(course.documentId || String(course.id))
                                                                                    } else {
                                                                                        handleAddToWishlist(course.id, course.documentId)
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <Heart className={cn(
                                                                                    "w-4 h-4",
                                                                                    isInWishlist(course.id, course.documentId) && "fill-current"
                                                                                )} />
                                                                            </Button>
                                                                        )}
                                                                        <Chip 
                                                                            className="bg-blue-500 text-white font-bold"
                                                                            size="sm"
                                                                        >
                                                                            ${(course.Price || 0).toFixed(2)}
                                                                        </Chip>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="p-4">
                                                                    <h4 className="font-bold text-base mb-2 line-clamp-2 min-h-[48px]">
                                                                        {course.name}
                                                                    </h4>
                                                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                                                                        {course.description || "No description"}
                                                                    </p>
                                                                    
                                                                    <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
                                                                        <div className="flex items-center gap-1">
                                                                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                                            <span>4.5</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <Clock className="w-3.5 h-3.5" />
                                                                            <span>{course.duration_minutes || 120}min</span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                                        {isAuthenticated && (
                                                                            <Button
                                                                                isIconOnly
                                                                                size="sm"
                                                                                variant="light"
                                                                                color={isInWishlist(course.id, course.documentId) ? "danger" : "default"}
                                                                                isLoading={addingToWishlistId === (course.documentId || String(course.id)) || removingFromWishlistId === (course.documentId || String(course.id))}
                                                                                isDisabled={addingToWishlistId === (course.documentId || String(course.id)) || removingFromWishlistId === (course.documentId || String(course.id))}
                                                                                onPress={() => {
                                                                                    if (isInWishlist(course.id, course.documentId)) {
                                                                                        handleRemoveFromWishlist(course.documentId || String(course.id))
                                                                                    } else {
                                                                                        handleAddToWishlist(course.id, course.documentId)
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <Heart className={cn(
                                                                                    "w-4 h-4",
                                                                                    isInWishlist(course.id, course.documentId) && "fill-current"
                                                                                )} />
                                                                            </Button>
                                                                        )}
                                                                        <Button
                                                                            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold"
                                                                            size="sm"
                                                                            startContent={addingToCartId === course.id ? null : <ShoppingCart className="w-4 h-4" />}
                                                                            isDisabled={
                                                                                (course.documentId && isInCartByDocumentId(course.documentId)) || 
                                                                                isInCart(course.id) || 
                                                                                addingToCartId === course.id
                                                                            }
                                                                            isLoading={addingToCartId === course.id}
                                                                            onPress={() => {
                                                                                console.log("🔘 Add to Cart clicked:", {
                                                                                    courseId: course.id,
                                                                                    courseDocumentId: course.documentId,
                                                                                    courseName: course.name,
                                                                                    isInCartById: isInCart(course.id),
                                                                                    isInCartByDocId: course.documentId && isInCartByDocumentId(course.documentId)
                                                                                })
                                                                                handleAddRecommendedToCart(course)
                                                                            }}
                                                                        >
                                                                            {
                                                                                (course.documentId && isInCartByDocumentId(course.documentId)) || isInCart(course.id)
                                                                                    ? "In Cart" 
                                                                                    : addingToCartId === course.id 
                                                                                        ? "Adding..." 
                                                                                        : "Add to Cart"
                                                                            }
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
                )}
        </AnimatePresence>
    )
}

