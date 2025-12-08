"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button, Chip } from "@heroui/react"
import { useCart } from "@/contexts/CartContext"
import { Heart, Trash2, ShoppingCart, Star, Clock } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { getUserWishlists, deleteUserWishlist, UserWishlistEntry } from "@/integrations/strapi/userWishlist"
import { getPublicCourseCourses } from "@/integrations/strapi/courseCourse"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import { getCoursePreview, getCoursePreviewUrl } from "@/integrations/strapi/coursePreview"

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false })

export function DashboardFavorites() {
    const router = useRouter()
    const { isAuthenticated, user } = useAuth()
    const { addToCart, isInCart, isInCartByDocumentId } = useCart()
    const [wishlistItems, setWishlistItems] = useState<Array<UserWishlistEntry & { course?: any }>>([])
    const [isLoadingWishlist, setIsLoadingWishlist] = useState(false)
    const [addingToCart, setAddingToCart] = useState<number | null>(null)

    // Load wishlist
    useEffect(() => {
        if (isAuthenticated && user) {
            loadWishlist()
        }
    }, [isAuthenticated, user])

    const loadWishlist = async () => {
        if (!user?.id) return
        try {
            setIsLoadingWishlist(true)
            const wishlists = await getUserWishlists(user.id)
            
            // Load course details for each wishlist item
            const courses = await getPublicCourseCourses()
            const wishlistPromises = wishlists.map(async (wishlist) => {
                const course = courses.find(c => c.id === wishlist.courseId)
                if (!course) {
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
    }

    const handleRemoveFromWishlist = async (courseId: number) => {
        const wishlistEntry = wishlistItems.find(item => item.courseId === courseId)
        if (!wishlistEntry) return
        
        try {
            await deleteUserWishlist(wishlistEntry.id)
            setWishlistItems(prev => prev.filter(item => item.courseId !== courseId))
            toast.success("Removed from favorites")
        } catch (error) {
            console.error("Failed to remove from wishlist:", error)
            toast.error("Failed to remove from favorites")
        }
    }

    const handleAddToCart = async (item: any) => {
        // Prevent if already in cart or currently adding
        // Check by documentId (reliable) OR numeric id (fallback)
        const inCartByDocId = item.course?.documentId && isInCartByDocumentId(item.course.documentId)
        const inCartById = item.courseId && isInCart(item.courseId)
        const inCart = inCartByDocId || inCartById
        
        if (!item.course || !item.courseId || inCart || addingToCart === item.courseId) {
            if (inCart) {
                toast.info("This course is already in your cart")
            }
            return
        }

        try {
            setAddingToCart(item.courseId)
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
        } catch (error) {
            console.error("Failed to add to cart:", error)
            toast.error("Failed to add to cart")
        } finally {
            setAddingToCart(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Favorite Courses
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Your saved courses for later
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Chip 
                        className="bg-gradient-to-r from-rose-500 to-purple-500 text-white font-bold"
                        size="lg"
                    >
                        {wishlistItems.length} {wishlistItems.length === 1 ? "Course" : "Courses"}
                    </Chip>
                </div>
            </div>

            {isLoadingWishlist ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-muted rounded-xl h-80 animate-pulse" />
                    ))}
                </div>
            ) : wishlistItems.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20 bg-card/50 rounded-2xl border border-border"
                >
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 dark:from-rose-900/20 dark:to-purple-900/20 flex items-center justify-center">
                        <Heart className="w-12 h-12 text-rose-500 dark:text-rose-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                        {isAuthenticated ? "No favorites yet" : "Sign in to save favorites"}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                        {isAuthenticated
                            ? "Start adding courses to your favorites for easy access!"
                            : "Create an account to save your favorite courses"}
                    </p>
                    {!isAuthenticated && (
                        <Button
                            className="bg-gradient-to-r from-rose-500 to-purple-500 text-white"
                            onPress={() => router.push("/auth/start")}
                        >
                            Sign In
                        </Button>
                    )}
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlistItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl transition-all group cursor-pointer"
                            onClick={() => item.courseId && router.push(`/courses/${item.courseId}`)}
                        >
                            <div className="relative aspect-video overflow-hidden bg-muted">
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
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                    {item.course?.description || "No description"}
                                </p>
                                
                                <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                        <span>4.5</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{item.course?.duration_minutes || 120}min</span>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold"
                                        size="sm"
                                        startContent={<ShoppingCart className="w-3.5 h-3.5" />}
                                        isDisabled={
                                            !item.courseId || 
                                            (item.course?.documentId && isInCartByDocumentId(item.course.documentId)) ||
                                            isInCart(item.courseId) || 
                                            addingToCart === item.courseId
                                        }
                                        isLoading={addingToCart === item.courseId}
                                        onPress={() => handleAddToCart(item)}
                                    >
                                        {
                                            (item.course?.documentId && isInCartByDocumentId(item.course.documentId)) ||
                                            (item.courseId && isInCart(item.courseId))
                                                ? "In Cart" 
                                                : addingToCart === item.courseId 
                                                    ? "Adding..." 
                                                    : "Add to Cart"
                                        }
                                    </Button>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        onPress={() => item.courseId && handleRemoveFromWishlist(item.courseId)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}

