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

        const payload: any = {
            user: userDocId
                ? { connect: [{ documentId: userDocId }] }
                : numericUserId,
            course_course: courseDocId
                ? { connect: [{ documentId: courseDocId }] }
                : numericCourseId,
        }

        const response = await strapi.post(`/api/user-wishlists?${query}`, {
            data: payload,
        })
        const entry = response.data?.data
        return normalizeWishlistEntry(entry)
    } catch (error: any) {
        console.error("[createUserWishlist] Failed:", error?.response?.data || error)
        throw new Error(error?.response?.data?.error?.message || "Unable to save wishlist")
    }
}

export async function deleteUserWishlist(wishlistId: number | string): Promise<boolean> {
    if (!wishlistId && wishlistId !== 0) throw new Error("Missing wishlist id")
    try {
        await strapi.delete(`/api/user-wishlists/${wishlistId}`)
        return true
    } catch (error: any) {
        console.error("[deleteUserWishlist] Failed:", error?.response?.data || error)
        throw new Error(error?.response?.data?.error?.message || "Unable to remove wishlist")
    }
}

export function mapWishlistToCourseIds(entries: UserWishlistEntry[]): number[] {
    return entries
        .map((entry) => entry.courseId)
        .filter((id): id is number => typeof id === "number")
}

