"use client"

import { strapi } from "./client"

async function resolveDocumentIdByNumericId(
    collection: string,
    numericId: number,
): Promise<string | null> {
    const query = [`filters[id][$eq]=${numericId}`, "fields[0]=documentId"].join("&")
    const url = `/api/${collection}?${query}`
    try {
        const response = await strapi.get(url)
        const items = response.data?.data ?? []
        if (items.length > 0) {
            return items[0].documentId
        }
    } catch (error) {
        console.warn(`Failed to resolve documentId for ${collection}`, error)
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
        const userDocId = await resolveDocumentIdByNumericId("users", numericUserId)
        const courseDocId = await resolveDocumentIdByNumericId("course-courses", numericCourseId)

        console.log("[createUserWishlist] Resolved IDs:", {
            userId: numericUserId,
            courseId: numericCourseId,
            userDocId,
            courseDocId
        })

        const payload: any = {
            user: userDocId
                ? { connect: [{ documentId: userDocId }] }
                : numericUserId,
            course_course: courseDocId
                ? { connect: [{ documentId: courseDocId }] }
                : numericCourseId,
        }

        console.log("[createUserWishlist] Payload:", payload)

        const response = await strapi.post(`/api/user-wishlists?${query}`, {
            data: payload,
        })
        
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

