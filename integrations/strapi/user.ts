import { strapi, strapiPublic } from "./client";

export interface StrapiUserProfile {
    id?: number;
    documentId?: string;
    username?: string;
    email?: string;
    name?: string;
    bio?: string;
    avatar?: any;
    user_group_limit?: number | null;
    user_group_member_limit?: number | null;
    followers?: number;
    following?: number;
}

const mapUserProfile = (user: any): StrapiUserProfile => {
    if (!user) return {};
    if (user.attributes) {
        const attrs = user.attributes;
        return {
            id: user.id ?? attrs.id,
            documentId: attrs.documentId,
            username: attrs.username,
            email: attrs.email,
            name: attrs.name,
            bio: attrs.bio,
            avatar: attrs.avatar ?? user.avatar,
            user_group_limit: attrs.user_group_limit ?? null,
            user_group_member_limit: attrs.user_group_member_limit ?? null,
        };
    }
    return {
        id: user.id,
        documentId: user.documentId,
        username: user.username,
        email: user.email,
        name: user.name,
        bio: user.bio,
        avatar: user.avatar,
        user_group_limit: user.user_group_limit ?? null,
        user_group_member_limit: user.user_group_member_limit ?? null,
    };
};

export async function getUsersByIdentifiers(
    identifiers: Array<{ id?: number | string | null; documentId?: string | null }>
): Promise<StrapiUserProfile[]> {
    if (!Array.isArray(identifiers) || identifiers.length === 0) {
        return [];
    }

    const numericIds = new Set<number>();
    const documentIds = new Set<string>();

    identifiers.forEach(({ id, documentId }) => {
        if (id !== undefined && id !== null && id !== "") {
            const numeric = typeof id === "number" ? id : Number(id);
            if (Number.isFinite(numeric)) {
                numericIds.add(numeric);
            }
        }
        if (documentId) {
            documentIds.add(String(documentId));
        }
    });

    if (numericIds.size === 0 && documentIds.size === 0) {
        return [];
    }

    const params = new URLSearchParams();
    let orIndex = 0;

    if (numericIds.size > 0) {
        const index = orIndex++;
        Array.from(numericIds).forEach((value, idx) => {
            params.append(`filters[$or][${index}][id][$in][${idx}]`, String(value));
        });
    }

    if (documentIds.size > 0) {
        const index = orIndex++;
        Array.from(documentIds).forEach((value, idx) => {
            params.append(`filters[$or][${index}][documentId][$in][${idx}]`, value);
        });
    }

    params.set("populate[avatar]", "*");
    params.set("pagination[page]", "1");
    params.set("pagination[pageSize]", String(Math.max(identifiers.length, 50)));

    const response = await strapi.get(`/api/users?${params.toString()}`);
    const payload = response.data;
    const rawUsers = Array.isArray(payload) ? payload : payload?.data || [];

    return rawUsers.map(mapUserProfile);
}

/**
 * Get follower count for a user
 */
export async function getUserFollowerCount(userId: string | number): Promise<number> {
    try {
        const isNumericId = typeof userId === 'number' || (typeof userId === 'string' && /^\d+$/.test(userId));
        let queryUrl: string;
        
        if (isNumericId) {
            const numericId = typeof userId === 'string' ? Number(userId) : userId;
            queryUrl = `/api/users?filters[id][$eq]=${numericId}&populate[followers][fields][0]=id&fields[0]=id`;
        } else {
            queryUrl = `/api/users/${userId}?populate[followers][fields][0]=id&fields[0]=id`;
        }

        const response = await strapiPublic.get(queryUrl);
        const userData = Array.isArray(response.data?.data) 
            ? response.data.data[0] 
            : response.data?.data;

        if (!userData) {
            return 0;
        }

        // Check if followers is populated
        const followers = userData.followers || userData.attributes?.followers;
        if (Array.isArray(followers)) {
            return followers.length;
        }
        // If followers is a number (count), return it
        if (typeof followers === 'number') {
            return followers;
        }
        // If followers relation exists but not populated, try to count it
        if (followers?.data) {
            return Array.isArray(followers.data) ? followers.data.length : 0;
        }

        return 0;
    } catch (error: any) {
        console.error("Error fetching user follower count:", error);
        return 0;
    }
}

/**
 * Get following count for a user
 */
export async function getUserFollowingCount(userId: string | number): Promise<number> {
    try {
        const isNumericId = typeof userId === 'number' || (typeof userId === 'string' && /^\d+$/.test(userId));
        let queryUrl: string;
        
        if (isNumericId) {
            const numericId = typeof userId === 'string' ? Number(userId) : userId;
            queryUrl = `/api/users?filters[id][$eq]=${numericId}&populate[following][fields][0]=id&fields[0]=id`;
        } else {
            queryUrl = `/api/users/${userId}?populate[following][fields][0]=id&fields[0]=id`;
        }

        const response = await strapiPublic.get(queryUrl);
        const userData = Array.isArray(response.data?.data) 
            ? response.data.data[0] 
            : response.data?.data;

        if (!userData) {
            return 0;
        }

        // Check if following is populated
        const following = userData.following || userData.attributes?.following;
        if (Array.isArray(following)) {
            return following.length;
        }
        if (typeof following === 'number') {
            return following;
        }
        if (following?.data) {
            return Array.isArray(following.data) ? following.data.length : 0;
        }

        return 0;
    } catch (error: any) {
        console.error("Error fetching user following count:", error);
        return 0;
    }
}

/**
 * Follow a user
 */
export async function followUser(targetUserId: string | number, currentUserId: string | number): Promise<boolean> {
    try {
        // Use Next.js API route to handle follow logic
        const response = await fetch('/api/users/follow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                targetUserId,
                currentUserId,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to follow user');
        }

        return true;
    } catch (error: any) {
        console.error("Error following user:", error);
        return false;
    }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(targetUserId: string | number, currentUserId: string | number): Promise<boolean> {
    try {
        // Use Next.js API route to handle unfollow logic
        const response = await fetch('/api/users/unfollow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                targetUserId,
                currentUserId,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to unfollow user');
        }

        return true;
    } catch (error: any) {
        console.error("Error unfollowing user:", error);
        return false;
    }
}

/**
 * Check if user is following another user
 */
export async function isFollowingUser(targetUserId: string | number, currentUserId: string | number): Promise<boolean> {
    try {
        const response = await fetch(`/api/users/is-following?targetUserId=${targetUserId}&currentUserId=${currentUserId}`);
        
        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        return data.isFollowing || false;
    } catch (error: any) {
        console.error("Error checking follow status:", error);
        return false;
    }
}
