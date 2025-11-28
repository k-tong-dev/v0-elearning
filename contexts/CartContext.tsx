"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import {
    getUserCartItems,
    addCourseToCart as addCourseToCartAPI,
    removeCartItem as removeCartItemAPI,
    clearUserCart as clearUserCartAPI,
    syncCartWithServer,
    CartItem as StrapiCartItem,
} from "@/integrations/strapi/cartItem"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import { getCoursePreview, getCoursePreviewUrl } from "@/integrations/strapi/coursePreview"

export interface CartItem {
    id: number
    courseId: number // Note: May be unreliable in Strapi v5
    courseDocumentId?: string // ✅ Reliable identifier for Strapi v5
    title: string
    description: string
    image: string
    previewType?: "image" | "url" | "video" // Type of preview (for rendering)
    price: number
    priceFormatted: string
    instructor: string
    addedAt: Date
    strapiCartItemId?: number // Link to Strapi cart item ID
}

interface CartContextType {
    items: CartItem[]
    itemCount: number
    totalPrice: number
    totalPriceFormatted: string
    isLoading: boolean
    isSyncing: boolean
    addToCart: (course: {
        id: number
        title: string
        description: string
        image: string
        priceValue: number
        price: string
        educator: string
    }) => Promise<void>
    removeFromCart: (courseId: number) => Promise<void>
    clearCart: () => Promise<void>
    isInCart: (courseId: number) => boolean
    isInCartByDocumentId: (documentId: string) => boolean
    refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

/**
 * Convert Strapi cart item to frontend format (async to fetch course preview)
 */
async function mapStrapiCartItem(strapiItem: StrapiCartItem): Promise<CartItem | null> {
    const course = strapiItem.course

    // Handle null course
    if (!course) {
        console.warn("[Cart] Cart item has null course:", strapiItem.id)
        return null
    }

    // DEBUG: Log the actual course structure from Strapi
    console.log("[Cart] Mapping Strapi Item:", {
        cartItemId: strapiItem.id,
        courseId: course.id,
        courseDocumentId: course.documentId,
        courseName: course.name,
        fullCourse: course
    })

    // Get image URL and preview type using getCoursePreview() function
    let imageUrl = "/placeholder.svg"
    let previewType: "image" | "url" | "video" = "image"

    const previewId = course.course_preview?.documentId || course.course_preview?.id
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
            console.warn("[Cart] Failed to fetch course preview:", error)
            // Fall back to placeholder
        }
    }

    // Get instructor name
    const instructorName = course.instructors && course.instructors.length > 0
        ? course.instructors[0].name || "Unknown"
        : "Unknown"

    return {
        id: strapiItem.id,
        courseId: course.id,
        courseDocumentId: course.documentId,
        title: course.name || "Untitled Course",
        description: course.description || "No description available",
        image: getAvatarUrl(imageUrl) || "/placeholder.svg",
        previewType: previewType,
        price: strapiItem.price_at_add || course.Price || 0,
        priceFormatted: `$${(strapiItem.price_at_add || course.Price || 0).toFixed(2)}`,
        instructor: instructorName,
        addedAt: new Date(strapiItem.added_at),
        strapiCartItemId: strapiItem.id,
    }
}

export function CartProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, user } = useAuth()
    const [items, setItems] = useState<CartItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)

    /**
     * Load cart from Strapi for authenticated users
     * Or from localStorage for guests
     */
    const loadCart = useCallback(async () => {
        if (isAuthenticated && user) {
            // Authenticated: Load from Strapi
            setIsLoading(true)
            try {
                const strapiItems = await getUserCartItems()
                console.log("============== Strapi Items: ",strapiItems );
                const mappedPromises = strapiItems.map(item => mapStrapiCartItem(item))
                const mappedResults = await Promise.all(mappedPromises)
                const mappedItems = mappedResults.filter((item): item is CartItem => item !== null)
                setItems(mappedItems)
            } catch (error) {
                console.error("[Cart] Failed to load from Strapi:", error)
                toast.error("Failed to load cart")
        } finally {
                setIsLoading(false)
            }
        } else {
            // Guest: Load from localStorage
            const savedCart = localStorage.getItem("cart")
            if (savedCart) {
                try {
                    const parsed = JSON.parse(savedCart)
                    // Validate and filter out invalid items
                    const validItems = parsed.filter((item: any) => {
                        if (!item.courseId || item.courseId <= 0) {
                            console.warn("[Cart] Removing invalid item from localStorage:", item)
                            return false
                        }
                        return true
                    })

                    setItems(
                        validItems.map((item: any) => ({
                            ...item,
                            addedAt: new Date(item.addedAt),
                        }))
                    )

                    // Update localStorage if we removed invalid items
                    if (validItems.length !== parsed.length) {
                        localStorage.setItem("cart", JSON.stringify(validItems))
                        console.log("[Cart] Cleaned up invalid items from localStorage")
                    }
                } catch (error) {
                    console.error("[Cart] Failed to parse localStorage cart:", error)
                    // Clear corrupted localStorage
                    localStorage.removeItem("cart")
                }
            }
        }
    }, [isAuthenticated, user])

    // Load cart on mount and auth change
    useEffect(() => {
        loadCart()
    }, [loadCart])

    /**
     * Sync local cart to Strapi when user logs in
     */
    useEffect(() => {
        const syncAfterLogin = async () => {
            if (isAuthenticated && user && items.length > 0) {
                // Check if items are from localStorage (no strapiCartItemId)
                const localItems = items.filter((item) => !item.strapiCartItemId)
                if (localItems.length > 0) {
                    setIsSyncing(true)
                    try {
                        // Validate courseIds before syncing
                        const validItems = localItems.filter((item) => {
                            if (!item.courseId || item.courseId <= 0) {
                                console.warn("[Cart] Skipping invalid courseId:", item.courseId)
                                return false
                            }
                            return true
                        })

                        if (validItems.length === 0) {
                            // No valid items to sync, just clear localStorage
                            localStorage.removeItem("cart")
                            toast.info("Cart cleared - no valid items to sync")
                            setItems([]) // Clear invalid items from state
                            setIsSyncing(false)
                            return
                        }

                        await syncCartWithServer(
                            validItems.map((item) => ({
                                courseId: item.courseId,
                                quantity: 1,
                            }))
                        )
                        // Reload cart from server
                        await loadCart()
                        localStorage.removeItem("cart")
                        toast.success("Cart synced with your account")
        } catch (error) {
                        console.error("[Cart] Failed to sync cart:", error)
                        // Clear localStorage on sync failure to prevent repeated errors
                        localStorage.removeItem("cart")
                        toast.error("Failed to sync cart - please re-add items")
                    } finally {
                        setIsSyncing(false)
                    }
                }
            }
        }

        syncAfterLogin()
    }, [isAuthenticated, user, items, loadCart])

    /**
     * Save cart to localStorage for guests
     */
    useEffect(() => {
        if (!isAuthenticated) {
            localStorage.setItem("cart", JSON.stringify(items))
        }
    }, [items, isAuthenticated])

    const addToCart = async (course: {
        id: number
        title: string
        description: string
        image: string
        priceValue: number
        price: string
        educator: string
    }) => {
        console.log("[Cart] Adding course to cart:", { 
                id: course.id,
            title: course.title,
            isAuthenticated,
            currentItems: items.length
        })

        // CRITICAL: Check if already in cart - PREVENT DUPLICATES
        if (items.some((item) => item.courseId === course.id)) {
            console.warn("[Cart] Course already in cart, preventing duplicate:", course.id)
            toast.warning("This course is already in your cart!")
            return
        }

        // Double check with isInCart helper
        if (isInCart(course.id)) {
            console.warn("[Cart] Course already in cart (isInCart check), preventing duplicate:", course.id)
            toast.warning("This course is already in your cart!")
            return
        }

        if (isAuthenticated && user) {
            // Authenticated: Add to Strapi
            try {
                const result = await addCourseToCartAPI(course.id)
                if (result.success && result.data) {
                    console.log(">>>>>>>>>>>>>>>>>>> Datas: ", result.data)
                    const newItem = await mapStrapiCartItem(result.data)
                    console.log("===========New Items:", JSON.stringify(newItem))
                    if (newItem) {
                        setItems((prev) => [...prev, newItem])
                        toast.success(`Added "${course.title}" to cart`)
                    } else {
                        console.error("[Cart] Failed to map cart item - course is null")
                        toast.error("Failed to add to cart - course data missing")
                    }
                } else {
                    toast.error(result.error || "Failed to add to cart")
                }
            } catch (error) {
                console.error("[Cart] Failed to add to Strapi cart:", error)
                toast.error("Failed to add to cart")
            }
        } else {
            // Guest: Add to localStorage
            const newItem: CartItem = {
                id: Date.now(),
                courseId: course.id, // ✅ This should be the actual course.id (e.g., 403, 386)
                title: course.title,
                description: course.description,
                image: course.image,
                price: course.priceValue,
                priceFormatted: course.price,
                instructor: course.educator,
                addedAt: new Date(),
            }

            console.log("[Cart] Guest - Created new cart item:", {
                cartItemId: newItem.id,
                courseId: newItem.courseId,
                title: newItem.title
            })

            setItems((prev) => [...prev, newItem])
            toast.success(`Added "${course.title}" to cart`)
        }
    }

    const removeFromCart = async (courseId: number) => {
        const item = items.find((item) => item.courseId === courseId)

        if (isAuthenticated && user && item?.strapiCartItemId) {
            // Authenticated: Remove from Strapi
            try {
                const result = await removeCartItemAPI(item.strapiCartItemId)
                if (result.success) {
                    setItems((prev) => prev.filter((item) => item.courseId !== courseId))
                    toast.success("Removed from cart")
                } else {
                    toast.error(result.error || "Failed to remove from cart")
                }
            } catch (error) {
                console.error("[Cart] Failed to remove from Strapi cart:", error)
                toast.error("Failed to remove from cart")
            }
        } else {
            // Guest: Remove from localStorage
            setItems((prev) => prev.filter((item) => item.courseId !== courseId))
            toast.success("Removed from cart")
        }
    }

    const clearCart = async () => {
        if (isAuthenticated && user) {
            // Authenticated: Clear Strapi cart
            try {
                const result = await clearUserCartAPI()
                if (result.success) {
                    setItems([])
                    toast.success("Cart cleared")
                } else {
                    toast.error(result.error || "Failed to clear cart")
                }
            } catch (error) {
                console.error("[Cart] Failed to clear Strapi cart:", error)
                toast.error("Failed to clear cart")
            }
        } else {
            // Guest: Clear localStorage
        setItems([])
            toast.success("Cart cleared")
        }
    }

    const refreshCart = async () => {
        await loadCart()
    }

    const isInCart = (courseId: number) => {
        return items.some(item => item.courseId === courseId)
    }

    // Check if course is in cart by documentId (more reliable for Strapi v5)
    const isInCartByDocumentId = (documentId: string) => {
        return items.some(item => item.courseDocumentId === documentId)
    }

    const itemCount = items.length

    const totalPrice = items.reduce((sum, item) => sum + item.price, 0)

    const totalPriceFormatted = `$${totalPrice.toFixed(2)}`

    return (
        <CartContext.Provider
            value={{
            items,
                itemCount,
                totalPrice,
                totalPriceFormatted,
                isLoading,
                isSyncing,
                addToCart,
                removeFromCart,
                clearCart,
            isInCart,
                isInCartByDocumentId,
                refreshCart,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
