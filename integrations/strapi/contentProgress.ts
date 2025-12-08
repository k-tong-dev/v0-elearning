import {strapiPublic} from "./client";

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

