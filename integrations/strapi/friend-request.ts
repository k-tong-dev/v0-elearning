import { strapiPublic, strapi } from './client';

export interface FriendRequest {
    id: number;
    documentId: string;
    from_user: number | any; // User ID or populated user object
    to_user: number | any; // User ID or populated user object
    request_status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
    message?: string;
    requested_at?: string;
    responded_at?: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Maps Strapi response data to FriendRequest interface
 */
function mapFriendRequest(item: any): FriendRequest {
    if (!item) return null as any;

    return {
        id: item.id,
        documentId: item.documentId,
        from_user: item.from_user?.id || item.from_user || null,
        to_user: item.to_user?.id || item.to_user || null,
        request_status: item.request_status || 'pending',
        message: item.message,
        requested_at: item.requested_at || item.createdAt,
        responded_at: item.responded_at,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    };
}

/**
 * Get friend requests sent by a user
 */
export async function getSentFriendRequests(userId: string | number): Promise<FriendRequest[]> {
    try {
        const populateParams = [
            'populate[from_user][populate][0]=avatar',
            'populate[to_user][populate][0]=avatar'
        ].join('&');

        const response = await strapiPublic.get(
            `/api/friend-requests?filters[from_user][id][$eq]=${userId}&${populateParams}&sort=requested_at:desc`
        );
        return (response.data.data || []).map(mapFriendRequest);
    } catch (error) {
        console.error("Error fetching sent friend requests:", error);
        return [];
    }
}

/**
 * Get friend requests received by a user
 */
export async function getReceivedFriendRequests(userId: string | number): Promise<FriendRequest[]> {
    try {
        const populateParams = [
            'populate[from_user][populate][0]=avatar',
            'populate[to_user][populate][0]=avatar'
        ].join('&');

        const response = await strapiPublic.get(
            `/api/friend-requests?filters[to_user][id][$eq]=${userId}&${populateParams}&sort=requested_at:desc`
        );
        return (response.data.data || []).map(mapFriendRequest);
    } catch (error) {
        console.error("Error fetching received friend requests:", error);
        return [];
    }
}

/**
 * Get all friend requests for a user (sent + received)
 */
export async function getAllFriendRequests(userId: string | number): Promise<FriendRequest[]> {
    try {
        const [sent, received] = await Promise.all([
            getSentFriendRequests(userId),
            getReceivedFriendRequests(userId)
        ]);
        return [...sent, ...received].sort((a, b) => {
            const dateA = new Date(a.requested_at || a.createdAt || 0).getTime();
            const dateB = new Date(b.requested_at || b.createdAt || 0).getTime();
            return dateB - dateA;
        });
    } catch (error) {
        console.error("Error fetching all friend requests:", error);
        return [];
    }
}

/**
 * Get pending friend requests received by a user
 */
export async function getPendingFriendRequests(userId: string | number): Promise<FriendRequest[]> {
    try {
        const populateParams = [
            'populate[from_user][populate][0]=avatar',
            'populate[to_user][populate][0]=avatar'
        ].join('&');

        const response = await strapiPublic.get(
            `/api/friend-requests?filters[to_user][id][$eq]=${userId}&filters[request_status][$eq]=pending&${populateParams}&sort=requested_at:desc`
        );
        return (response.data.data || []).map(mapFriendRequest);
    } catch (error) {
        console.error("Error fetching pending friend requests:", error);
        return [];
    }
}

/**
 * Send a friend request
 */
export async function sendFriendRequest(fromUserId: string | number, toUserId: string | number, message?: string): Promise<FriendRequest | null> {
    try {
        const payload = {
            from_user: fromUserId,
            to_user: toUserId,
            request_status: 'pending',
            message: message || null,
            requested_at: new Date().toISOString(),
        };

        const response = await strapi.post('/api/friend-requests', { data: payload });
        return mapFriendRequest(response.data.data);
    } catch (error: any) {
        console.error("Error sending friend request:", error);
        throw new Error(error.response?.data?.error?.message || "Failed to send friend request");
    }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(requestId: string | number, fromUserId: string | number, toUserId: string | number): Promise<boolean> {
    try {
        // First, update the request status to accepted
        await strapi.put(`/api/friend-requests/${requestId}`, {
            data: {
                request_status: 'accepted',
                responded_at: new Date().toISOString(),
            }
        });

        // Then, add both users to each other's friends list
        // Get current friends for both users
        const toUserResponse = await strapiPublic.get(`/api/users/${toUserId}?populate=*`);
        const fromUserResponse = await strapiPublic.get(`/api/users/${fromUserId}?populate=*`);
        
        const toUserFriends = toUserResponse.data?.data?.friends || [];
        const fromUserFriends = fromUserResponse.data?.data?.friends || [];
        
        const toUserFriendIds = Array.isArray(toUserFriends) 
            ? toUserFriends.map((f: any) => Number(f.id || f)).filter((id: any) => !isNaN(id))
            : [];
        const fromUserFriendIds = Array.isArray(fromUserFriends)
            ? fromUserFriends.map((f: any) => Number(f.id || f)).filter((id: any) => !isNaN(id))
            : [];

        // Add from_user to to_user's friends (if not already added)
        if (!toUserFriendIds.includes(Number(fromUserId))) {
            await strapi.put(`/api/users/${toUserId}`, {
                data: {
                    friends: [...toUserFriendIds, Number(fromUserId)]
                }
            });
        }

        // Add to_user to from_user's friends (if not already added)
        if (!fromUserFriendIds.includes(Number(toUserId))) {
            await strapi.put(`/api/users/${fromUserId}`, {
                data: {
                    friends: [...fromUserFriendIds, Number(toUserId)]
                }
            });
        }

        return true;
    } catch (error: any) {
        console.error("Error accepting friend request:", error);
        throw new Error(error.response?.data?.error?.message || "Failed to accept friend request");
    }
}

/**
 * Reject a friend request (deletes the record)
 */
export async function rejectFriendRequest(requestId: string | number): Promise<boolean> {
    try {
        await strapi.delete(`/api/friend-requests/${requestId}`);
        return true;
    } catch (error: any) {
        console.error("Error rejecting friend request:", error);
        throw new Error(error.response?.data?.error?.message || "Failed to reject friend request");
    }
}

/**
 * Cancel a friend request (deletes the record)
 */
export async function cancelFriendRequest(requestId: string | number): Promise<boolean> {
    try {
        await strapi.delete(`/api/friend-requests/${requestId}`);
        return true;
    } catch (error: any) {
        console.error("Error cancelling friend request:", error);
        throw new Error(error.response?.data?.error?.message || "Failed to cancel friend request");
    }
}

/**
 * Check if there's a pending friend request between two users
 */
export async function checkFriendRequest(fromUserId: string | number, toUserId: string | number): Promise<FriendRequest | null> {
    try {
        const response = await strapiPublic.get(
            `/api/friend-requests?filters[from_user][id][$eq]=${fromUserId}&filters[to_user][id][$eq]=${toUserId}&filters[request_status][$eq]=pending`
        );
        const requests = (response.data.data || []).map(mapFriendRequest);
        return requests.length > 0 ? requests[0] : null;
    } catch (error) {
        console.error("Error checking friend request:", error);
        return null;
    }
}

/**
 * Get friend request history for a user
 */
export async function getFriendRequestHistory(userId: string | number): Promise<FriendRequest[]> {
    try {
        const populateParams = [
            'populate[from_user][populate][0]=avatar',
            'populate[to_user][populate][0]=avatar'
        ].join('&');

        const response = await strapiPublic.get(
            `/api/friend-requests?filters[$or][0][from_user][id][$eq]=${userId}&filters[$or][1][to_user][id][$eq]=${userId}&${populateParams}&sort=requested_at:desc`
        );
        return (response.data.data || []).map(mapFriendRequest);
    } catch (error) {
        console.error("Error fetching friend request history:", error);
        return [];
    }
}

/**
 * Get user's friends list
 */
export async function getUserFriends(userId: string | number): Promise<any[]> {
    try {
        const response = await strapiPublic.get(`/api/users/${userId}?populate=*`);
        const friends = response.data?.data?.friends || [];
        return Array.isArray(friends) ? friends : [];
    } catch (error) {
        console.error("Error fetching user friends:", error);
        return [];
    }
}

/**
 * Unfriend a user (remove from friends list)
 */
export async function unfriendUser(userId: string | number, friendId: string | number): Promise<boolean> {
    try {
        // Get current friends
        const userResponse = await strapiPublic.get(`/api/users/${userId}?populate=*`);
        const friends = userResponse.data?.data?.friends || [];
        const friendIds = Array.isArray(friends)
            ? friends.map((f: any) => Number(f.id || f)).filter((id: any) => !isNaN(id))
            : [];

        // Remove friend from list
        const updatedFriends = friendIds.filter((id: any) => id !== Number(friendId));

        // Update user's friends
        await strapi.put(`/api/users/${userId}`, {
            data: {
                friends: updatedFriends
            }
        });

        // Also remove from the other user's friends list
        const friendResponse = await strapiPublic.get(`/api/users/${friendId}?populate=*`);
        const friendFriends = friendResponse.data?.data?.friends || [];
        const friendFriendIds = Array.isArray(friendFriends)
            ? friendFriends.map((f: any) => Number(f.id || f)).filter((id: any) => !isNaN(id))
            : [];
        
        const updatedFriendFriends = friendFriendIds.filter((id: any) => id !== Number(userId));
        await strapi.put(`/api/users/${friendId}`, {
            data: {
                friends: updatedFriendFriends
            }
        });

        return true;
    } catch (error: any) {
        console.error("Error unfriending user:", error);
        throw new Error(error.response?.data?.error?.message || "Failed to unfriend user");
    }
}

/**
 * Search users by username or email
 */
export async function searchUsers(query: string): Promise<any[]> {
    try {
        const response = await strapiPublic.get(
            `/api/users?filters[$or][0][username][$containsi]=${encodeURIComponent(query)}&filters[$or][1][email][$containsi]=${encodeURIComponent(query)}&populate[avatar]=*`
        );
        return response.data?.data || [];
    } catch (error) {
        console.error("Error searching users:", error);
        return [];
    }
}

