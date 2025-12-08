import { strapi, strapiPublic } from "./client"

export interface CourseReport {
    id: number
    documentId?: string
    title: string
    description: string
    type: "inappropriate" | "misinformation" | "spam" | "offensive" | "other"
    state: "draft" | "checking" | "done"
    course_course?: number | { id: number; name: string }
    user?: number | { id: number; username: string }
    url?: string
    createdAt: string
    updatedAt: string
}

/**
 * Create a course report
 */
export async function createCourseReport(data: {
    title: string
    description: string
    type: string
    course_course: number | string
    user: number | string
    url?: string
}): Promise<CourseReport | null> {
    try {
        // Resolve documentId for course relation
        const courseDocumentId = await resolveDocumentIdByNumericId("course-courses", data.course_course)
        if (!courseDocumentId) {
            console.error("Failed to resolve course documentId for report creation")
            return null
        }

        // Resolve documentId for user relation
        const userDocumentId = await resolveDocumentIdByNumericId("users", data.user)
        if (!userDocumentId) {
            console.error("Failed to resolve user documentId for report creation")
            return null
        }

        const response = await strapi.post("/api/report-issues", {
            data: {
                title: data.title,
                description: data.description,
                type: "Content", // Based on schema enum: "Issue", "Article", "Content"
                state: "draft",
                url: data.url || (typeof window !== "undefined" ? window.location.href : ""),
                courses: {
                    connect: [{ documentId: courseDocumentId }],
                },
                user: {
                    connect: [{ documentId: userDocumentId }],
                },
            },
        })

        const item = response.data?.data
        if (!item) {
            return null
        }

        return {
            id: item.id,
            documentId: item.documentId,
            title: item.attributes?.title || data.title,
            description: item.attributes?.description || data.description,
            type: data.type as CourseReport["type"],
            state: item.attributes?.state || "draft",
            course_course: data.course_course,
            user: data.user,
            url: item.attributes?.url || data.url,
            createdAt: item.attributes?.createdAt || new Date().toISOString(),
            updatedAt: item.attributes?.updatedAt || new Date().toISOString(),
        }
    } catch (error: any) {
        console.error("Error creating course report:", error)
        throw new Error(error.response?.data?.error?.message || "Failed to create course report")
    }
}

/**
 * Helper to resolve documentId from numeric ID
 */
async function resolveDocumentIdByNumericId(
    collection: string,
    idOrDocumentId: number | string,
): Promise<string | null> {
    // If it's already a documentId (non-numeric string), return it
    if (typeof idOrDocumentId === "string" && !/^\d+$/.test(idOrDocumentId)) {
        return idOrDocumentId
    }

    const numericId = typeof idOrDocumentId === "string" ? Number(idOrDocumentId) : idOrDocumentId
    const query = [`filters[id][$eq]=${numericId}`, "fields[0]=documentId"].join("&")
    const url = `/api/${collection}?${query}`
    const clients = [strapi, strapiPublic]
    for (const client of clients) {
        try {
            const response = await client.get(url)
            const items = response.data?.data ?? []
            if (items.length > 0) {
                return items[0].documentId
            }
        } catch (error) {
            console.warn(`Failed to resolve documentId for ${collection}`, error)
        }
    }
    return null
}

