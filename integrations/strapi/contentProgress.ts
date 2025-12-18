import {strapiPublic, strapi} from "./client";

export type TrackingStatus = "not_started" | "in_progress" | "completed";

export interface ContentProgressEntity {
    id: number;
    documentId: string;
    tracking_status: TrackingStatus;
    last_position_seconds: number;
    duration_seconds: number;
    watched_percent: number;
    attempt_count: number;
    first_started_at?: string | null;
    last_updated_at?: string | null;
    user?: {
        id: number;
        username?: string;
        email?: string;
        full_name?: string;
    } | null;
}

export async function getContentProgressForContent(
    courseContentId: number,
): Promise<ContentProgressEntity[]> {
    try {
        // Fetch without populate first to avoid validation errors
        const response = await strapiPublic.get(
            `/api/content-progresses?filters[course_content][id][$eq]=${courseContentId}&sort=updatedAt:desc`,
        );
        
        const items = response.data?.data ?? [];
        
        // Extract user IDs and fetch user details separately if needed
        const userIds = items
            .map((item: any) => {
                const userRef = item.user?.data || item.user;
                return typeof userRef === 'object' ? userRef?.id : userRef;
            })
            .filter((id: any) => id != null);
        
        // Fetch user details separately if we have user IDs
        let userMap = new Map();
        if (userIds.length > 0) {
            try {
                const userResponse = await strapiPublic.get(
                    `/api/users?filters[id][$in]=${userIds.join(',')}&fields[0]=id&fields[1]=username&fields[2]=email&fields[3]=name&fields[4]=full_name`,
                );
                const users = userResponse.data?.data || [];
                users.forEach((user: any) => {
                    userMap.set(user.id, user);
                });
            } catch (userError) {
                console.warn("Failed to fetch user details:", userError);
            }
        }
        
        return items.map((item: any) => {
            const userRef = item.user?.data || item.user;
            const userId = typeof userRef === 'object' ? userRef?.id : userRef;
            const userData = userId ? userMap.get(userId) : null;
            
            return {
            id: item.id,
            documentId: item.documentId,
            tracking_status: item.tracking_status ?? "not_started",
            last_position_seconds: Number(item.last_position_seconds ?? 0),
            duration_seconds: Number(item.duration_seconds ?? 0),
            watched_percent: Number(item.watched_percent ?? 0),
            attempt_count: item.attempt_count ?? 0,
            first_started_at: item.first_started_at ?? null,
            last_updated_at: item.last_updated_at ?? item.updatedAt ?? null,
                user: userData
                ? {
                          id: userData.id,
                          username: userData.username ?? userData.email ?? `User ${userData.id}`,
                          email: userData.email ?? "",
                          full_name: userData.full_name ?? userData.name ?? userData.username ?? `User ${userData.id}`,
                      }
                    : userId
                    ? {
                          id: userId,
                          username: `User ${userId}`,
                          email: "",
                          full_name: `User ${userId}`,
                  }
                : null,
            };
        });
    } catch (error) {
        console.error("Error fetching content progress:", error);
        return [];
    }
}

// Helper to resolve documentId from numeric ID or string ID
async function resolveDocumentIdByNumericId(
    collection: string,
    idOrDocumentId: number | string,
): Promise<string | null> {
    // If it's already a documentId (non-numeric string), return it
    if (typeof idOrDocumentId === 'string' && !/^\d+$/.test(idOrDocumentId)) {
        return idOrDocumentId;
    }
    
    const numericId = typeof idOrDocumentId === 'string' ? Number(idOrDocumentId) : idOrDocumentId;
    const query = [`filters[id][$eq]=${numericId}`, "fields[0]=documentId"].join("&");
    const url = `/api/${collection}?${query}`;
    const clients = [strapi, strapiPublic];
    for (const client of clients) {
        try {
            const response = await client.get(url);
            const items = response.data?.data ?? [];
            if (items.length > 0) {
                return items[0].documentId;
            }
        } catch (error) {
            console.warn(`Failed to resolve documentId for ${collection}`, error);
        }
    }
    return null;
}

// Get content progress for a specific user and content
export async function getUserContentProgress(
    userId: string | number,
    courseContentId: string | number,
    courseEnrollmentId?: string | number // Optional: filter by enrollment for more precision
): Promise<ContentProgressEntity | null> {
    try {
        const userDocId = await resolveDocumentIdByNumericId("users", userId);
        const contentDocId = await resolveDocumentIdByNumericId("course-contents", courseContentId);
        
        const params = new URLSearchParams();
        // Filter by user documentId (priority)
        if (userDocId) {
            params.append('filters[user][documentId][$eq]', userDocId);
        } else {
            const numericUserId = typeof userId === 'string' ? Number(userId) : userId;
            if (!isNaN(numericUserId)) {
                params.append('filters[user][id][$eq]', numericUserId.toString());
            }
        }
        
        // Filter by course_content documentId (priority)
        if (contentDocId) {
            params.append('filters[course_content][documentId][$eq]', contentDocId);
        } else {
            const numericContentId = typeof courseContentId === 'string' ? Number(courseContentId) : courseContentId;
            if (!isNaN(numericContentId)) {
                params.append('filters[course_content][id][$eq]', numericContentId.toString());
            }
        }
        
        // Optionally filter by course_enrollment documentId for more precision
        if (courseEnrollmentId) {
            const enrollmentDocId = await resolveDocumentIdByNumericId("course-enrollments", courseEnrollmentId);
            if (enrollmentDocId) {
                params.append('filters[course_enrollment][documentId][$eq]', enrollmentDocId);
            } else {
                const numericEnrollmentId = typeof courseEnrollmentId === 'string' ? Number(courseEnrollmentId) : courseEnrollmentId;
                if (!isNaN(numericEnrollmentId)) {
                    params.append('filters[course_enrollment][id][$eq]', numericEnrollmentId.toString());
                }
            }
        }
        
        const response = await strapi.get(`/api/content-progresses?${params.toString()}`);
        const items = response.data?.data ?? [];
        
        if (items.length > 0) {
            const item = items[0];
            return {
                id: item.id,
                documentId: item.documentId,
                tracking_status: item.tracking_status ?? "not_started",
                last_position_seconds: Number(item.last_position_seconds ?? 0),
                duration_seconds: Number(item.duration_seconds ?? 0),
                watched_percent: Number(item.watched_percent ?? 0),
                attempt_count: item.attempt_count ?? 0,
                first_started_at: item.first_started_at ?? null,
                last_updated_at: item.last_updated_at ?? item.updatedAt ?? null,
                user: null,
            };
        }
        
        return null;
    } catch (error) {
        console.error("Error fetching user content progress:", error);
        return null;
    }
}

// Create or update content progress
export interface CreateContentProgressInput {
    user: string | number;
    course_content: string | number;
    course_enrollment?: string | number; // Optional: link to course enrollment
    tracking_status?: TrackingStatus;
    last_position_seconds?: number;
    duration_seconds?: number;
    watched_percent?: number;
    attempt_count?: number;
}

export async function createOrUpdateContentProgress(
    data: CreateContentProgressInput
): Promise<ContentProgressEntity | null> {
    try {
        // Resolve documentIds
        let userDocumentId: string | null = null;
        
        if (typeof data.user === 'string' && !/^\d+$/.test(data.user)) {
            userDocumentId = data.user;
        } else {
            // Try /api/users/me first
            try {
                const meResponse = await strapi.get('/api/users/me?fields[0]=documentId&fields[1]=id');
                if (meResponse.data?.documentId) {
                    const meId = meResponse.data.id;
                    const providedUserId = typeof data.user === 'string' ? Number(data.user) : data.user;
                    if (meId === providedUserId || String(meId) === String(providedUserId)) {
                        userDocumentId = meResponse.data.documentId;
                    }
                }
            } catch (meError) {
                // Continue with other methods
            }
            
            if (!userDocumentId) {
                const numericUserId = typeof data.user === 'string' ? Number(data.user) : data.user;
                if (!isNaN(numericUserId)) {
                    const userResponse = await strapi.get(`/api/users?filters[id][$eq]=${numericUserId}&fields[0]=documentId`);
                    const users = userResponse.data?.data || [];
                    if (users.length > 0) {
                        userDocumentId = users[0].documentId || null;
                    }
                }
            }
        }
        
        if (!userDocumentId) {
            throw new Error("Failed to resolve user documentId");
        }
        
        const contentDocumentId = await resolveDocumentIdByNumericId("course-contents", data.course_content);
        if (!contentDocumentId) {
            throw new Error("Failed to resolve course content documentId");
        }
        
        // Resolve course_enrollment documentId if provided
        let enrollmentDocumentId: string | null = null;
        if (data.course_enrollment) {
            enrollmentDocumentId = await resolveDocumentIdByNumericId("course-enrollments", data.course_enrollment);
        }
        
        // Check if progress already exists
        const existingProgress = await getUserContentProgress(data.user, data.course_content);
        
        const now = new Date().toISOString();
        const trackingStatus = data.tracking_status || "completed";
        const isInProgress = trackingStatus === "in_progress";
        const isCompleted = trackingStatus === "completed";
        
        const payload: any = {
            data: {
                user: { connect: [{ documentId: userDocumentId }] },
                course_content: { connect: [{ documentId: contentDocumentId }] },
                tracking_status: trackingStatus,
                last_position_seconds: data.last_position_seconds ?? (existingProgress?.last_position_seconds || 0),
                duration_seconds: data.duration_seconds ?? (existingProgress?.duration_seconds || 0),
                // For in_progress, preserve existing watched_percent or use provided value
                // For completed, set to 100 if not provided
                watched_percent: data.watched_percent !== undefined 
                    ? data.watched_percent 
                    : (isCompleted ? 100 : (existingProgress?.watched_percent || 0)),
                attempt_count: data.attempt_count ?? (existingProgress ? existingProgress.attempt_count : (isCompleted ? 1 : 0)),
                last_updated_at: now,
            }
        };
        
        // Add course_enrollment relation if provided
        if (enrollmentDocumentId) {
            payload.data.course_enrollment = { connect: [{ documentId: enrollmentDocumentId }] };
        }
        
        // Set first_started_at only if it's a new record or if starting for the first time
        if (!existingProgress || (!existingProgress.first_started_at && isInProgress)) {
            payload.data.first_started_at = now;
        }
        
        let response;
        if (existingProgress) {
            // Update existing progress
            response = await strapi.put(`/api/content-progresses/${existingProgress.documentId}`, payload);
        } else {
            // Create new progress
            response = await strapi.post('/api/content-progresses', payload);
        }
        
        const item = response.data.data;
        return {
            id: item.id,
            documentId: item.documentId,
            tracking_status: item.tracking_status ?? "not_started",
            last_position_seconds: Number(item.last_position_seconds ?? 0),
            duration_seconds: Number(item.duration_seconds ?? 0),
            watched_percent: Number(item.watched_percent ?? 0),
            attempt_count: item.attempt_count ?? 0,
            first_started_at: item.first_started_at ?? null,
            last_updated_at: item.last_updated_at ?? item.updatedAt ?? null,
            user: null,
        };
    } catch (error: any) {
        console.error("Error creating/updating content progress:", error?.response?.data || error?.message || error);
        throw error;
    }
}

