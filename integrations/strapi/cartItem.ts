/**
 * Strapi cart Item API Integration
 */

import { getAccessToken } from "@/lib/cookies"

const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337"

export interface cartItemCourse {
  id: number
  documentId?: string
  name: string
  description?: string
  Price: number
  course_preview?: {
    id?: number
    documentId?: string
    types?: string
    url?: string
    image?: {
      url?: string
    }
    video?: {
      url?: string
    }
  }
  instructors?: Array<{
    id: number | string
    name: string
  }>
}

export interface CartItem {
  id: number
  documentId?: string
  user: {
    id: number
  }
  course: cartItemCourse
  quantity: number
  price_at_add: number
  added_at: string
  createdAt?: string
  updatedAt?: string
}

/**
 * Get current user's cart items
 */
export async function getUserCartItems(): Promise<CartItem[]> {
  try {
    const token = getAccessToken()
    if (!token) {
      console.warn("[Cart API] No auth token found")
      return []
    }

    const response = await fetch(`${API_URL}/api/card-items/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`[Cart API] Failed to fetch cart items: ${response.status}`)
      return []
    }

    const json = await response.json()
    return json.data || []
  } catch (error) {
    console.error("[Cart API] Error fetching cart items:", error)
    return []
  }
}

/**
 * Add course to cart
 */
export async function addCourseToCart(
  courseId: number | string,
  quantity: number = 1
): Promise<{ success: boolean; data?: CartItem; error?: string }> {
  try {
    const token = getAccessToken()

    if (!token) {
      return { success: false, error: "Not authenticated" }
    }

    const response = await fetch(`${API_URL}/api/card-items/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        courseId: typeof courseId === "string" ? parseInt(courseId) : courseId,
        quantity,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error?.message || "Failed to add to cart",
      }
    }
    const json = await response.json()
    console.log(">>>>>>>>>>>>>>>>>>>>> Response from Strapi Add Courses: ", response)
    return { success: true, data: json.data }
  } catch (error) {
    console.error("[Cart API] Error adding to cart:", error)
    return { success: false, error: "Network error" }
  }
}

/**
 * Remove item from cart
 */
export async function removeCartItem(
  cartItemId: number | string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = getAccessToken()

    if (!token) {
      return { success: false, error: "Not authenticated" }
    }

    const response = await fetch(
      `${API_URL}/api/card-items/${cartItemId}/remove`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      return { success: false, error: "Failed to remove item" }
    }

    return { success: true }
  } catch (error) {
    console.error("[Cart API] Error removing from cart:", error)
    return { success: false, error: "Network error" }
  }
}

/**
 * Clear all cart items
 */
export async function clearUserCart(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const token = getAccessToken()

    if (!token) {
      return { success: false, error: "Not authenticated" }
    }

    const response = await fetch(`${API_URL}/api/card-items/clear`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return { success: false, error: "Failed to clear cart" }
    }

    return { success: true }
  } catch (error) {
    console.error("[Cart API] Error clearing cart:", error)
    return { success: false, error: "Network error" }
  }
}

/**
 * Sync local cart with server
 * Use this after login to merge local storage cart with server cart
 */
export async function syncCartWithServer(
  localCartItems: Array<{ courseId: number; quantity: number }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = getAccessToken()

    if (!token) {
      return { success: false, error: "Not authenticated" }
    }

    // Add each local item to server cart
    for (const item of localCartItems) {
      await addCourseToCart(item.courseId, item.quantity)
    }

    return { success: true }
  } catch (error) {
    console.error("[Cart API] Error syncing cart:", error)
    return { success: false, error: "Network error" }
  }
}

