import { strapiPublic, strapi } from './client';

export interface Instructor {
    id: number;
    documentId: string;
    name: string;
    user: number | string | any; // User ID or populated user object
    bio?: string;
    avatar?: any;
    cover?: any;
    specializations?: any;
    banking_info?: any;
    is_verified: boolean;
    is_active: boolean;
    monetization: boolean;
    youtube?: string;
    linkin?: string; // LinkedIn
    github?: string;
    facebook?: string;
    tiktok?: string;
    instagram?: string;
    rating?: number;
    stats?: any;
    followers?: any[] | number; // Array of user IDs/objects or count number
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string | null;
    locale?: string;
}

/**
 * Maps Strapi response data to Instructor interface
 * Centralized mapping ensures consistency and easier maintenance
 */
function mapInstructor(item: any): Instructor {
    if (!item) return null as any;
    
    // Extract avatar - handle nested structures from populate
    let avatarData = item.avatar;
    if (avatarData && typeof avatarData === 'object') {
        // Handle Strapi v5 structure: { data: { ... } }
        if (avatarData.data) {
            avatarData = avatarData.data;
        }
    }
    
    // Extract cover - handle nested structures
    let coverData = item.cover;
    if (coverData && typeof coverData === 'object') {
        if (coverData.data) {
            coverData = coverData.data;
        }
    }
    
    // Extract followers - handle nested structures
    let followersData = item.followers;
    if (followersData && typeof followersData === 'object') {
        // Handle Strapi v5 structure: { data: [...] } or direct array
        if (followersData.data && Array.isArray(followersData.data)) {
            followersData = followersData.data;
        } else if (Array.isArray(followersData)) {
            followersData = followersData;
        }
    }
    
    return {
            id: item.id,
            documentId: item.documentId,
            name: item.name,
        user: item.user?.id || item.user || null,
            bio: item.bio,
        avatar: avatarData || item.avatar || null,
        cover: coverData || item.cover || null,
            specializations: item.specializations,
            is_verified: item.is_verified ?? false,
            is_active: item.is_active ?? true,
            banking_info: item.banking_info,
            monetization: item.monetization ?? false,
            youtube: item.youtube,
            linkin: item.linkin,
            github: item.github,
            facebook: item.facebook,
            tiktok: item.tiktok,
            instagram: item.instagram,
            rating: item.rating,
            stats: item.stats,
            followers: followersData || item.followers || [],
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            locale: item.locale,
    };
}

export async function getInstructors(userId?: string): Promise<Instructor[]> {
    try {
        const url = userId 
            ? `/api/instructors?filters[user][id][$eq]=${userId}&populate=*`
            : '/api/instructors?populate=*';
        
        const response = await strapiPublic.get(url);
        return (response.data.data || []).map(mapInstructor);
    } catch (error) {
        console.error("Error fetching instructors:", error);
        return [];
    }
}

export async function getInstructor(id: string | number, populateFollowers: boolean = false): Promise<Instructor | null> {
    try {
        // Strapi v5: Direct lookup works for documentId (string), but numeric IDs require filtering
        // Check if it's a numeric ID vs documentId
        const isNumericId = typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id));
        
        // Build populate query - include followers if requested
        const populateQuery = populateFollowers ? 'populate[followers]=*&populate=*' : 'populate=*';
        
        if (isNumericId) {
            // For numeric IDs, use filter query (Strapi v5 doesn't support numeric ID in URL path)
            const numericId = typeof id === 'string' ? Number(id) : id;
            const response = await strapiPublic.get(
                `/api/instructors?filters[id][$eq]=${numericId}&${populateQuery}`
            );
            
            if (response.data?.data && response.data.data.length > 0) {
                return mapInstructor(response.data.data[0]);
            }
            return null;
        } else {
            // For documentId (string), use direct lookup
            const response = await strapiPublic.get(`/api/instructors/${id}?${populateQuery}`);
            if (response.data?.data) {
                return mapInstructor(response.data.data);
            }
            return null;
        }
    } catch (error: any) {
        // If direct lookup fails with 404, try filter as fallback
        if (error.response?.status === 404 && typeof id === 'string') {
            try {
                // Might be a documentId that needs filtering, try by documentId
                const populateQuery = populateFollowers ? 'populate[followers]=*&populate=*' : 'populate=*';
                const response = await strapiPublic.get(
                    `/api/instructors?filters[documentId][$eq]=${id}&${populateQuery}`
                );
                
                if (response.data?.data && response.data.data.length > 0) {
                    return mapInstructor(response.data.data[0]);
                }
            } catch (filterError) {
                // If filter also fails, return null
                console.error("Error fetching instructor with filter:", filterError);
            }
        }
        console.error("Error fetching instructor:", error);
        return null;
    }
}

/**
 * Get all instructors that are in collaboration groups with the current user
 * This includes instructors from groups where the user is owner or member
 */
export async function getCollaboratingInstructors(userId: string | number): Promise<Instructor[]> {
    try {
        const { getUserInstructorGroups, getInstructorGroupsForInstructor } = await import('./instructor-group');
        
        // Get current user's instructor profile by user ID (not instructor ID)
        const userInstructors = await getInstructors(typeof userId === 'string' ? userId : String(userId));
        const userInstructor = userInstructors.length > 0 ? userInstructors[0] : null;
        
        // Get instructor groups where user is owner
        const ownedGroups = await getUserInstructorGroups(userId);
        
        // Get instructor groups where user is a member (if they have an instructor profile)
        let memberGroups: any[] = [];
        if (userInstructor) {
            memberGroups = await getInstructorGroupsForInstructor(userInstructor.id);
        }
        
        // Collect all unique instructor IDs from all groups
        const instructorIds = new Set<number>();
        
        // From owned groups
        ownedGroups.forEach(group => {
            if (Array.isArray(group.instructors)) {
                group.instructors.forEach((inst: any) => {
                    const instId = typeof inst === 'number' ? inst : (inst?.id ? Number(inst.id) : null);
                    if (instId) instructorIds.add(instId);
                });
            }
        });
        
        // From member groups
        memberGroups.forEach(group => {
            if (Array.isArray(group.instructors)) {
                group.instructors.forEach((inst: any) => {
                    const instId = typeof inst === 'number' ? inst : (inst?.id ? Number(inst.id) : null);
                    if (instId) instructorIds.add(instId);
                });
            }
        });
        
        // Also include the current user's own instructor profile if they have one
        if (userInstructor) {
            instructorIds.add(userInstructor.id);
        }
        
        // Fetch all collaborating instructors with avatars
        const instructorPromises = Array.from(instructorIds).map(id => getInstructor(id, false));
        const instructors = await Promise.all(instructorPromises);
        
        return instructors.filter((inst): inst is Instructor => inst !== null);
    } catch (error) {
        console.error("Error fetching collaborating instructors:", error);
        return [];
    }
}

/**
 * Get follower count for an instructor
 */
export async function getInstructorFollowerCount(instructorId: string | number): Promise<number> {
    try {
        // Determine if it's a numeric ID or documentId
        const isNumericId = typeof instructorId === 'number' || (typeof instructorId === 'string' && /^\d+$/.test(instructorId));
        
        let queryUrl: string;
        if (isNumericId) {
            const numericId = typeof instructorId === 'string' ? Number(instructorId) : instructorId;
            queryUrl = `/api/instructors?filters[id][$eq]=${numericId}&populate[followers][fields][0]=id&fields[0]=id`;
        } else {
            queryUrl = `/api/instructors/${instructorId}?populate[followers][fields][0]=id&fields[0]=id`;
        }

        const response = await strapiPublic.get(queryUrl);
        
        // Handle both array response (from filter) and single object response (from direct lookup)
        let instructorData: any = null;
        if (Array.isArray(response.data?.data)) {
            instructorData = response.data.data[0];
        } else if (response.data?.data) {
            instructorData = response.data.data;
        }

        if (instructorData) {
            // Check if followers is populated
            const followers = instructorData.followers;
            if (Array.isArray(followers)) {
                return followers.length;
            }
            // If followers is a number (count), return it
            if (typeof followers === 'number') {
                return followers;
            }
            // If followers relation exists but not populated, try to count it
            if (instructorData.followers?.data) {
                return Array.isArray(instructorData.followers.data) ? instructorData.followers.data.length : 0;
            }
        }
        
        // Fallback: try to count followers from the relation with full populate
        try {
            let fallbackUrl: string;
            if (isNumericId) {
                const numericId = typeof instructorId === 'string' ? Number(instructorId) : instructorId;
                fallbackUrl = `/api/instructors?filters[id][$eq]=${numericId}&populate[followers]=*`;
            } else {
                fallbackUrl = `/api/instructors/${instructorId}?populate[followers]=*`;
            }
            
            const countResponse = await strapiPublic.get(fallbackUrl);
            const data = Array.isArray(countResponse.data?.data) 
                ? countResponse.data.data[0] 
                : countResponse.data?.data;
            
            if (data?.followers) {
                if (Array.isArray(data.followers)) {
                    return data.followers.length;
                }
                if (data.followers?.data && Array.isArray(data.followers.data)) {
                    return data.followers.data.length;
                }
            }
        } catch (countError) {
            console.warn("Could not count followers from relation:", countError);
        }
        
        return 0;
    } catch (error) {
        console.error("Error fetching instructor follower count:", error);
        return 0;
    }
}

/**
 * Follow an instructor
 */
export async function followInstructor(instructorId: string | number, userId: string | number): Promise<boolean> {
    try {
        // Get current followers from Strapi with proper population
        const isNumericId = typeof instructorId === 'number' || (typeof instructorId === 'string' && /^\d+$/.test(instructorId));
        let queryUrl: string;
        
        if (isNumericId) {
            const numericId = typeof instructorId === 'string' ? Number(instructorId) : instructorId;
            queryUrl = `/api/instructors?filters[id][$eq]=${numericId}&populate[followers][fields][0]=id&fields[0]=id&fields[1]=documentId`;
        } else {
            queryUrl = `/api/instructors/${instructorId}?populate[followers][fields][0]=id&fields[0]=id&fields[1]=documentId`;
        }

        const response = await strapiPublic.get(queryUrl);
        const instructorData = Array.isArray(response.data?.data) 
            ? response.data.data[0] 
            : response.data?.data;

        if (!instructorData) {
            throw new Error("Instructor not found");
        }

        const updateId = instructorData.documentId || instructorData.id;
        
        // Extract current follower IDs
        let followerIds: number[] = [];
        if (instructorData.followers) {
            if (Array.isArray(instructorData.followers)) {
                followerIds = instructorData.followers.map((f: any) => Number(f.id || f)).filter((id: any) => !isNaN(id) && id > 0);
            } else if (instructorData.followers.data && Array.isArray(instructorData.followers.data)) {
                followerIds = instructorData.followers.data.map((f: any) => Number(f.id || f)).filter((id: any) => !isNaN(id) && id > 0);
            }
        }

        // Check if already following
        const userIdNum = Number(userId);
        if (followerIds.includes(userIdNum)) {
            return true; // Already following
        }

        // Add user to followers - send array of user IDs
        await strapi.put(`/api/instructors/${updateId}`, {
            data: {
                followers: [...followerIds, userIdNum]
            }
        });

        return true;
    } catch (error: any) {
        console.error("Error following instructor:", error);
        console.error("Error details:", error.response?.data);
        return false;
    }
}

/**
 * Unfollow an instructor
 */
export async function unfollowInstructor(instructorId: string | number, userId: string | number): Promise<boolean> {
    try {
        // Get current followers from Strapi with proper population
        const isNumericId = typeof instructorId === 'number' || (typeof instructorId === 'string' && /^\d+$/.test(instructorId));
        let queryUrl: string;
        
        if (isNumericId) {
            const numericId = typeof instructorId === 'string' ? Number(instructorId) : instructorId;
            queryUrl = `/api/instructors?filters[id][$eq]=${numericId}&populate[followers][fields][0]=id&fields[0]=id&fields[1]=documentId`;
        } else {
            queryUrl = `/api/instructors/${instructorId}?populate[followers][fields][0]=id&fields[0]=id&fields[1]=documentId`;
        }

        const response = await strapiPublic.get(queryUrl);
        const instructorData = Array.isArray(response.data?.data) 
            ? response.data.data[0] 
            : response.data?.data;

        if (!instructorData) {
            throw new Error("Instructor not found");
        }

        const updateId = instructorData.documentId || instructorData.id;
        
        // Extract current follower IDs
        let followerIds: number[] = [];
        if (instructorData.followers) {
            if (Array.isArray(instructorData.followers)) {
                followerIds = instructorData.followers.map((f: any) => Number(f.id || f)).filter((id: any) => !isNaN(id) && id > 0);
            } else if (instructorData.followers.data && Array.isArray(instructorData.followers.data)) {
                followerIds = instructorData.followers.data.map((f: any) => Number(f.id || f)).filter((id: any) => !isNaN(id) && id > 0);
            }
        }

        // Remove user from followers
        const userIdNum = Number(userId);
        const updatedFollowers = followerIds.filter((id: any) => id !== userIdNum);

        // Update with the filtered array
        await strapi.put(`/api/instructors/${updateId}`, {
            data: {
                followers: updatedFollowers
            }
        });

        return true;
    } catch (error: any) {
        console.error("Error unfollowing instructor:", error);
        console.error("Error details:", error.response?.data);
        return false;
    }
}

/**
 * Check if user is following an instructor
 */
export async function isFollowingInstructor(instructorId: string | number, userId: string | number): Promise<boolean> {
    try {
        // Get instructor with followers populated
        const isNumericId = typeof instructorId === 'number' || (typeof instructorId === 'string' && /^\d+$/.test(instructorId));
        let queryUrl: string;
        
        if (isNumericId) {
            const numericId = typeof instructorId === 'string' ? Number(instructorId) : instructorId;
            queryUrl = `/api/instructors?filters[id][$eq]=${numericId}&populate[followers][fields][0]=id`;
        } else {
            queryUrl = `/api/instructors/${instructorId}?populate[followers][fields][0]=id`;
        }

        const response = await strapiPublic.get(queryUrl);
        const instructorData = Array.isArray(response.data?.data) 
            ? response.data.data[0] 
            : response.data?.data;

        if (!instructorData || !instructorData.followers) {
            return false;
        }

        const userIdNum = Number(userId);
        
        // Check if userId is in followers array
        let followerIds: number[] = [];
        if (Array.isArray(instructorData.followers)) {
            followerIds = instructorData.followers.map((f: any) => Number(f.id || f)).filter((id: any) => !isNaN(id) && id > 0);
        } else if (instructorData.followers.data && Array.isArray(instructorData.followers.data)) {
            followerIds = instructorData.followers.data.map((f: any) => Number(f.id || f)).filter((id: any) => !isNaN(id) && id > 0);
        }

        return followerIds.includes(userIdNum);
    } catch (error) {
        console.error("Error checking follow status:", error);
        return false;
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

export async function createInstructor(data: Partial<Instructor> & { name: string; user: string }): Promise<Instructor | null> {
    try {
        // Resolve documentId for the user relation to ensure Strapi Admin UI displays it
        const userDocumentId = await resolveDocumentIdByNumericId("users", data.user);
        if (!userDocumentId) {
            console.error("Failed to resolve user documentId for instructor creation");
            return null;
        }

        // Only send allowed fields - security: prevents sending internal fields
        const payload = {
                name: data.name,
                // Use connect with documentId for CREATE to ensure Strapi Admin UI displays the relation
                user: {
                    connect: [{ documentId: userDocumentId }],
                },
                bio: data.bio,
                avatar: data.avatar,
                cover: data.cover,
                specializations: data.specializations,
                is_verified: data.is_verified ?? false,
                is_active: data.is_active ?? true,
                monetization: data.monetization ?? false,
                youtube: data.youtube,
                linkin: data.linkin,
                github: data.github,
                facebook: data.facebook,
                tiktok: data.tiktok,
                instagram: data.instagram,
        };
        
        const response = await strapi.post('/api/instructors', { data: payload });
        return mapInstructor(response.data.data);
    } catch (error) {
        console.error("Error creating instructor:", error);
        return null;
    }
}

export async function updateInstructor(id: string, data: Partial<Instructor>): Promise<Instructor | null> {
    try {
        // Only send allowed fields - security: prevents sending internal/read-only fields
        const allowedFields = [
            'name', 'user', 'bio', 'avatar', 'cover', 'specializations',
            'is_verified', 'is_active', 'monetization',
            'youtube', 'linkin', 'github', 'facebook', 'tiktok', 'instagram'
        ];
        
        const payload = Object.keys(data).reduce((acc: any, key) => {
            if (allowedFields.includes(key)) {
                acc[key] = data[key as keyof Instructor];
            }
            return acc;
        }, {});
        
        const response = await strapi.put(`/api/instructors/${id}`, { data: payload });
        return mapInstructor(response.data.data);
    } catch (error) {
        console.error("Error updating instructor:", error);
        return null;
    }
}

export async function deleteInstructor(id: string): Promise<boolean> {
    try {
        await strapi.delete(`/api/instructors/${id}`);
        return true;
    } catch (error) {
        console.error("Error deleting instructor:", error);
        return false;
    }
}

