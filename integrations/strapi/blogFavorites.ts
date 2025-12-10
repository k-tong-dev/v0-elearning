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

export interface BlogFavoriteEntry {
    id: number
    documentId?: string
    userId?: number
    blogPostId?: number
    blogPostDocumentId?: string
}

function normalizeBlogFavoriteEntry(raw: any): BlogFavoriteEntry | null {
    if (!raw) return null
    const base = raw.attributes ? { id: raw.id, ...raw.attributes } : raw
    if (!base) return null

    const blogData = base.blog?.data ?? base.blog
    const blogAttrs = blogData?.attributes ?? {}

    return {
        id: base.id,
        documentId: base.documentId,
        userId: base.user?.id ?? base.user,
        blogPostId: blogData?.id ?? blogAttrs.id,
        blogPostDocumentId: blogData?.documentId ?? blogAttrs.documentId,
    }
}

function buildPopulateQuery(): string {
    const params = new URLSearchParams()
    params.set("populate[blog][fields][0]", "id")
    params.set("populate[blog][fields][1]", "documentId")
    params.set("pagination[pageSize]", "100")
    return params.toString()
}

export async function getUserBlogFavorites(userId: string | number): Promise<BlogFavoriteEntry[]> {
    if (!userId && userId !== 0) return []
    try {
        const params = new URLSearchParams()
        params.set("filters[user][id][$eq]", String(userId))
        params.set("filters[blog][$notNull]", "true")
        const query = `${params.toString()}&${buildPopulateQuery()}`
        const response = await strapi.get(`/api/user-wishlists?${query}`)
        const entries = response.data?.data ?? []
        return entries.map(normalizeBlogFavoriteEntry).filter(Boolean) as BlogFavoriteEntry[]
    } catch (error) {
        console.error("[getUserBlogFavorites] Failed:", error)
        return []
    }
}

export async function createBlogFavorite(userId: string | number, blogPostId: string | number): Promise<BlogFavoriteEntry | null> {
    if (!userId && userId !== 0) throw new Error("Missing user id")
    if (!blogPostId && blogPostId !== 0) throw new Error("Missing blog post id")
    const numericUserId = Number(userId)
    const numericBlogPostId = Number(blogPostId)
    if (!Number.isFinite(numericUserId) || !Number.isFinite(numericBlogPostId)) {
        throw new Error("Invalid identifiers for blog favorite")
    }

    try {
        const query = buildPopulateQuery()
        const userDocId = await resolveDocumentIdByNumericId("users", numericUserId)
        const blogDocId = await resolveDocumentIdByNumericId("blog-posts", numericBlogPostId)

        const payload: any = {
            user: userDocId
                ? { connect: [{ documentId: userDocId }] }
                : numericUserId,
            blog: blogDocId
                ? { connect: [{ documentId: blogDocId }] }
                : numericBlogPostId,
        }

        const response = await strapi.post(`/api/user-wishlists?${query}`, {
            data: payload,
        })
        
        const entry = response.data?.data
        if (!entry) {
            throw new Error("No entry returned from Strapi")
        }
        
        return normalizeBlogFavoriteEntry(entry)
    } catch (error: any) {
        console.error("[createBlogFavorite] Failed:", error)
        const errorMessage = error?.response?.data?.error?.message 
            || error?.message 
            || `Unable to save blog favorite (Status: ${error?.response?.status || 'unknown'})`
        throw new Error(errorMessage)
    }
}

export async function deleteBlogFavorite(favoriteId: number | string, documentId?: string): Promise<boolean> {
    if (!favoriteId && favoriteId !== 0) throw new Error("Missing favorite id")
    try {
        const identifier = documentId || String(favoriteId)
        const response = await strapi.delete(`/api/user-wishlists/${identifier}`)
        
        if (response.status === 200 || response.status === 204) {
            return true
        }
        
        throw new Error(`Unexpected response status: ${response.status}`)
    } catch (error: any) {
        console.error("[deleteBlogFavorite] Failed:", error)
        const errorMessage = error?.response?.data?.error?.message 
            || error?.message 
            || `Unable to remove blog favorite (Status: ${error?.response?.status || 'unknown'})`
        throw new Error(errorMessage)
    }
}

export async function isBlogFavorite(userId: string | number, blogPostId: string | number): Promise<boolean> {
    if (!userId || !blogPostId) return false
    try {
        const favorites = await getUserBlogFavorites(userId)
        const numericBlogPostId = Number(blogPostId)
        return favorites.some(fav => fav.blogPostId === numericBlogPostId)
    } catch (error) {
        console.error("[isBlogFavorite] Failed:", error)
        return false
    }
}

export function mapFavoritesToBlogIds(entries: BlogFavoriteEntry[]): number[] {
    return entries
        .map((entry) => entry.blogPostId)
        .filter((id): id is number => typeof id === "number")
}
