"use client"

import { strapi } from "./client"

async function resolveDocumentIdByNumericId(
    collection: string,
    numericId: number,
): Promise<string | null> {
    // Request both id and documentId to ensure we get the correct item
    const query = [
        `filters[id][$eq]=${numericId}`,
        "fields[0]=id",
        "fields[1]=documentId"
    ].join("&")
    // Users collection has a different base path (/api/users) and returns an array directly
    const url = collection === "users" ? `/api/users?${query}` : `/api/${collection}?${query}`
    try {
        const response = await strapi.get(url)
        const items = Array.isArray(response.data)
            ? response.data
            : (response.data?.data ?? [])

        // Find the matching item by numeric id to avoid accidental mismatches
        const item = items.find((it: any) => {
            const rawId = it?.id ?? it?.attributes?.id
            return Number(rawId) === numericId
        }) ?? items[0]

        if (item) {
            // In Strapi v5, documentId is directly on the item
            // Also check attributes in case of different response structure
            const documentId = item.documentId || item.attributes?.documentId
            
            // Validate that we got the right item by checking numeric id matches
            const itemId = item.id || item.attributes?.id
            if (itemId && Number(itemId) !== numericId) {
                console.warn(`ID mismatch: expected ${numericId}, got ${itemId}`)
                return null
            }
            
            if (documentId && typeof documentId === 'string') {
                return documentId
            }
            console.warn(`DocumentId not found for ${collection} id ${numericId}. Item:`, item)
        } else {
            console.warn(`No items found for ${collection} with id ${numericId}`)
        }
    } catch (error: any) {
        console.error(`Failed to resolve documentId for ${collection} id ${numericId}:`, {
            error: error?.message,
            response: error?.response?.data,
            status: error?.response?.status
        })
    }
    return null
}

export interface UserWishlistEntry {
    id: number
    documentId?: string
    userId?: number
    courseId?: number
    courseDocumentId?: string
}

function normalizeWishlistEntry(raw: any): UserWishlistEntry | null {
    if (!raw) return null
    const base = raw.attributes ? { id: raw.id, ...raw.attributes } : raw
    if (!base) return null

    const courseData = base.course_course?.data ?? base.course_course
    const courseAttrs = courseData?.attributes ?? {}

    return {
        id: base.id,
        documentId: base.documentId,
        userId: base.user?.id ?? base.user,
        courseId: courseData?.id ?? courseAttrs.id,
        courseDocumentId: courseData?.documentId ?? courseAttrs.documentId,
    }
}

function buildPopulateQuery(): string {
    const params = new URLSearchParams()
    params.set("populate[course_course][fields][0]", "id")
    params.set("populate[course_course][fields][1]", "documentId")
    params.set("pagination[pageSize]", "100")
    return params.toString()
}

export async function getUserWishlists(userId: string | number): Promise<UserWishlistEntry[]> {
    if (!userId && userId !== 0) return []
    try {
        const params = new URLSearchParams()
        params.set("filters[user][id][$eq]", String(userId))
        const query = `${params.toString()}&${buildPopulateQuery()}`
        const response = await strapi.get(`/api/user-wishlists?${query}`)
        const entries = response.data?.data ?? []
        return entries.map(normalizeWishlistEntry).filter(Boolean) as UserWishlistEntry[]
    } catch (error) {
        console.error("[getUserWishlists] Failed:", error)
        return []
    }
}

export async function createUserWishlist(userId: string | number, courseId: string | number): Promise<UserWishlistEntry | null> {
    if (!userId && userId !== 0) throw new Error("Missing user id")
    if (!courseId && courseId !== 0) throw new Error("Missing course id")
    const numericUserId = Number(userId)
    const numericCourseId = Number(courseId)
    if (!Number.isFinite(numericUserId) || !Number.isFinite(numericCourseId)) {
        throw new Error("Invalid identifiers for wishlist")
    }

    try {
        const query = buildPopulateQuery()
        
        // Resolve documentIds - these are REQUIRED for Strapi v5 relations
        let userDocId = await resolveDocumentIdByNumericId("users", numericUserId)
        const courseDocId = await resolveDocumentIdByNumericId("course-courses", numericCourseId)

        // Fallback: fetch current user by /users/me (works only for the authenticated user)
        if (!userDocId) {
            try {
                const meResponse = await strapi.get(`/api/users/me?fields[0]=documentId`)
                userDocId = meResponse.data?.documentId || null
            } catch (err) {
                console.warn("Failed to resolve user documentId via /users/me fallback", err)
            }
        }

        console.log("[createUserWishlist] Resolved IDs:", {
            userId: numericUserId,
            courseId: numericCourseId,
            userDocId,
            courseDocId
        })

        // Validate that documentIds were resolved - Strapi v5 requires documentId for relations
        if (!userDocId) {
            throw new Error(`Failed to resolve documentId for user with id: ${numericUserId}`)
        }
        if (!courseDocId) {
            throw new Error(`Failed to resolve documentId for course with id: ${numericCourseId}`)
        }

        // Always use documentId for relations in Strapi v5
        const payload: any = {
            data: {
                user: { connect: [{ documentId: userDocId }] },
                course_course: { connect: [{ documentId: courseDocId }] },
            }
        }

        console.log("[createUserWishlist] Payload:", payload)

        const response = await strapi.post(`/api/user-wishlists?${query}`, payload)
        
        console.log("[createUserWishlist] Response:", response.data)
        
        const entry = response.data?.data
        if (!entry) {
            throw new Error("No entry returned from Strapi")
        }
        
        const normalized = normalizeWishlistEntry(entry)
        console.log("[createUserWishlist] Normalized entry:", normalized)
        
        return normalized
    } catch (error: any) {
        console.error("[createUserWishlist] Failed:", {
            error,
            response: error?.response?.data,
            status: error?.response?.status,
            userId: numericUserId,
            courseId: numericCourseId
        })
        
        // Extract detailed error message
        const errorMessage = error?.response?.data?.error?.message 
            || error?.message 
            || `Unable to save wishlist (Status: ${error?.response?.status || 'unknown'})`
        
        throw new Error(errorMessage)
    }
}

export async function deleteUserWishlist(wishlistId: number | string, documentId?: string): Promise<boolean> {
    if (!wishlistId && wishlistId !== 0) throw new Error("Missing wishlist id")
    try {
        // In Strapi v5, prefer documentId over numeric ID for deletion
        const identifier = documentId || String(wishlistId)
        console.log("[deleteUserWishlist] Deleting with identifier:", identifier, { wishlistId, documentId })
        
        const response = await strapi.delete(`/api/user-wishlists/${identifier}`)
        console.log("[deleteUserWishlist] Delete response:", response)
        
        // Check if deletion was successful
        if (response.status === 200 || response.status === 204) {
            return true
        }
        
        // If we get here, something unexpected happened
        throw new Error(`Unexpected response status: ${response.status}`)
    } catch (error: any) {
        console.error("[deleteUserWishlist] Failed:", {
            error,
            response: error?.response?.data,
            status: error?.response?.status,
            wishlistId,
            documentId
        })
        
        // Extract detailed error message
        const errorMessage = error?.response?.data?.error?.message 
            || error?.message 
            || `Unable to remove wishlist (Status: ${error?.response?.status || 'unknown'})`
        
        throw new Error(errorMessage)
    }
}

export function mapWishlistToCourseIds(entries: UserWishlistEntry[]): number[] {
    return entries
        .map((entry) => entry.courseId)
        .filter((id): id is number => typeof id === "number")
}

