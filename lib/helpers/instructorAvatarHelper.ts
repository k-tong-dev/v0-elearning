import { getAvatarUrl } from "@/lib/getAvatarUrl"
import { getInstructor } from "@/integrations/strapi/instructor"

/**
 * Enriches instructor data with avatar URLs from the Instructor API
 * @param instructors - Array of instructor summaries from course data
 * @returns Enriched instructors with properly resolved avatar URLs
 */
export async function enrichInstructorsWithAvatars(
    instructors: Array<{ id: string | number; name?: string; avatar?: any }>
): Promise<Array<{ id: string | number; name?: string; avatar?: any; avatarUrl?: string | null }>> {
    if (!instructors || instructors.length === 0) {
        return []
    }

    // Fetch full instructor data in parallel
    const enrichedPromises = instructors.map(async (instructor) => {
        try {
            // Fetch full instructor data from the instructor API
            const fullInstructor = await getInstructor(instructor.id, false)
            
            if (!fullInstructor) {
                return {
                    ...instructor,
                    avatarUrl: getAvatarUrl(instructor.avatar),
                }
            }

            // Extract avatar URL using the helper
            const avatarUrl = getAvatarUrl(fullInstructor.avatar)

            return {
                id: instructor.id,
                name: instructor.name || fullInstructor.name,
                avatar: fullInstructor.avatar,
                avatarUrl,
            }
        } catch (error) {
            console.warn(`Failed to fetch instructor ${instructor.id}:`, error)
            // Fallback to original avatar data
            return {
                ...instructor,
                avatarUrl: getAvatarUrl(instructor.avatar),
            }
        }
    })

    return await Promise.all(enrichedPromises)
}

/**
 * Batch fetch instructor avatars by IDs
 * @param instructorIds - Array of instructor IDs
 * @returns Map of instructor ID to avatar URL
 */
export async function fetchInstructorAvatarMap(
    instructorIds: Array<string | number>
): Promise<Map<string | number, string | null>> {
    const avatarMap = new Map<string | number, string | null>()

    if (!instructorIds || instructorIds.length === 0) {
        return avatarMap
    }

    // Fetch all instructors in parallel
    const instructorPromises = instructorIds.map((id) => getInstructor(id, false))
    const instructors = await Promise.all(instructorPromises)

    instructors.forEach((instructor, index) => {
        const id = instructorIds[index]
        if (instructor && instructor.avatar) {
            const avatarUrl = getAvatarUrl(instructor.avatar)
            avatarMap.set(id, avatarUrl)
        } else {
            avatarMap.set(id, null)
        }
    })

    return avatarMap
}

