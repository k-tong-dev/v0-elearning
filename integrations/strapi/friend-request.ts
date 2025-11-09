import { strapiPublic, strapi } from "./client";

export interface FriendRequest {
    id: number;
    documentId: string;
    from_user: any;
    to_user: any;
    friend_status: "pending" | "accepted" | "declined" | "cancelled" | "blocked";
    message?: string | null;
    requested_at?: string;
    responded_at?: string;
    read: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface PaginationMeta {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
}

interface PaginatedResult<T> {
    data: T[];
    pagination: PaginationMeta;
    hasMore: boolean;
    nextPage: number | null;
}

const REQUEST_ENDPOINT = "/api/user-friends";

type CandidateStatus = "available" | "friend" | "incoming" | "outgoing" | "self";

function mapFriendRequest(item: any): FriendRequest {
    if (!item) return null as any;

    const attributes = item.attributes || {};
    const fromRel = attributes.from_user ?? item.from_user;
    const toRel = attributes.to_user ?? item.to_user;

    const normalizeRelation = (rel: any) => {
        if (!rel) return rel;
        if (rel.data) return rel.data;
        return rel;
    };

    const fromUser = normalizeRelation(fromRel);
    const toUser = normalizeRelation(toRel);

    return {
        id: item.id ?? attributes.id,
        documentId: attributes.documentId || item.documentId,
        from_user: fromUser,
        to_user: toUser,
        friend_status: (attributes.friend_status || item.friend_status || "pending") as FriendRequest["friend_status"],
        message: attributes.message ?? item.message,
        requested_at: attributes.requested_at || attributes.createdAt || item.requested_at || item.createdAt,
        responded_at: attributes.responded_at || item.responded_at,
        read: attributes.read ?? item.read ?? false,
        createdAt: attributes.createdAt || item.createdAt,
        updatedAt: attributes.updatedAt || item.updatedAt,
    };
}

async function resolveUserId(userId: string | number): Promise<number> {
    if (typeof userId === "number" && userId > 0) return userId;
    if (typeof userId === "string" && /^\d+$/.test(userId)) return Number(userId);

    const response = await strapiPublic.get(
        `/api/users?filters[$or][0][id][$eq]=${encodeURIComponent(String(userId))}&filters[$or][1][documentId][$eq]=${encodeURIComponent(
            String(userId)
        )}&fields[0]=id`
    );

    const found = response.data?.data?.[0]?.id;
    if (!found) {
        throw new Error(`Unable to resolve user ID for "${userId}"`);
    }
    return Number(found);
}

function buildPaginationMeta(meta: any, fallbackPage: number, fallbackPageSize: number, total: number): PaginationMeta {
    const pagination = meta?.pagination || {};
    return {
        page: pagination.page ?? fallbackPage,
        pageSize: pagination.pageSize ?? fallbackPageSize,
        pageCount: pagination.pageCount ?? Math.max(1, Math.ceil(total / fallbackPageSize)),
        total: pagination.total ?? total,
    };
}

function formatPaginatedResult<T>(records: T[], pagination: PaginationMeta): PaginatedResult<T> {
    const hasMore = pagination.page < pagination.pageCount;
    return {
        data: records,
        pagination,
        hasMore,
        nextPage: hasMore ? pagination.page + 1 : null,
    };
}

export async function getUserFriendsPaginated(
    userId: string | number,
    page = 1,
    pageSize = 10
): Promise<PaginatedResult<any>> {
    const numericId = await resolveUserId(userId);
    const params = new URLSearchParams();
    params.set("filters[friend_status][$eq]", "accepted");
    params.set("filters[$or][0][from_user][id][$eq]", String(numericId));
    params.set("filters[$or][1][to_user][id][$eq]", String(numericId));
    params.set("populate[from_user][populate][0]", "avatar");
    params.set("populate[to_user][populate][0]", "avatar");
    params.set("pagination[page]", String(page));
    params.set("pagination[pageSize]", String(pageSize));
    params.set("sort[0]", "updatedAt:desc");

    const response = await strapi.get(`/api/user-friends?${params.toString()}`);
    const rawItems = response.data?.data || [];

    const friends = rawItems
        .map((entry: any) => {
            const mapped = mapFriendRequest(entry);
            if (!mapped) return null;
            const fromId = mapped.from_user?.id || mapped.from_user?.attributes?.id;
            const isInitiator = Number(fromId) === numericId;
            const friendUser = isInitiator ? mapped.to_user : mapped.from_user;
            const friendData = friendUser?.attributes ? { id: friendUser.id, documentId: friendUser.attributes?.documentId, ...friendUser.attributes } : friendUser;
            return friendData;
        })
        .filter(Boolean);

    const pagination = buildPaginationMeta(response.data?.meta, page, pageSize, friends.length);
    return formatPaginatedResult(friends, pagination);
}

interface FriendRequestPageOptions {
    page?: number;
    pageSize?: number;
    status?: "pending" | "accepted" | "rejected" | "cancelled";
}

export async function getFriendRequestsPaginated(
    userId: string | number,
    direction: "received" | "sent",
    options: FriendRequestPageOptions = {}
): Promise<PaginatedResult<FriendRequest>> {
    const numericId = await resolveUserId(userId);
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 10;

    const params = new URLSearchParams();
    params.set("filters[friend_status][$eq]", options.status ?? "pending");
    if (direction === "received") {
        params.set("filters[to_user][id][$eq]", String(numericId));
    } else {
        params.set("filters[from_user][id][$eq]", String(numericId));
    }

    params.set("pagination[page]", String(page));
    params.set("pagination[pageSize]", String(pageSize));
    params.set("sort[0]", "requested_at:desc");
    params.append("populate[from_user][populate][0]", "avatar");
    params.append("populate[to_user][populate][0]", "avatar");

    const response = await strapi.get(`${REQUEST_ENDPOINT}?${params.toString()}`);
    const rawData = response.data?.data || [];
    const requests = rawData.map(mapFriendRequest);
    const pagination = buildPaginationMeta(response.data?.meta, page, pageSize, requests.length);
    return formatPaginatedResult(requests, pagination);
}

export async function getFriendRequestHistoryPaginated(
    userId: string | number,
    options: FriendRequestPageOptions = {}
): Promise<PaginatedResult<FriendRequest>> {
    const numericId = await resolveUserId(userId);
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 10;

    const params = new URLSearchParams();
    params.set("filters[$or][0][from_user][id][$eq]", String(numericId));
    params.set("filters[$or][1][to_user][id][$eq]", String(numericId));
    if (options.status) {
        params.set("filters[friend_status][$eq]", options.status);
    }
    params.set("pagination[page]", String(page));
    params.set("pagination[pageSize]", String(pageSize));
    params.set("sort[0]", "requested_at:desc");
    params.append("populate[from_user][populate][0]", "avatar");
    params.append("populate[to_user][populate][0]", "avatar");

    const response = await strapi.get(`${REQUEST_ENDPOINT}?${params.toString()}`);
    const rawData = response.data?.data || [];
    const requests = rawData.map(mapFriendRequest);
    const pagination = buildPaginationMeta(response.data?.meta, page, pageSize, requests.length);
    return formatPaginatedResult(requests, pagination);
}

export async function sendFriendRequest(
    fromUserId: string | number,
    toUserId: string | number,
    message?: string
): Promise<FriendRequest | null> {
    try {
        const [fromId, toId] = await Promise.all([resolveUserId(fromUserId), resolveUserId(toUserId)]);

        if (fromId === toId) {
            throw new Error("You cannot send a friend request to yourself");
        }

        const existing = await getFriendRequestsPaginated(fromId, "sent", { status: "pending", pageSize: 100 }).then((res) =>
            res.data.find((req) => {
                const to = req.to_user as any;
                const toIdValue = typeof to === "object" ? to?.id : to;
                return Number(toIdValue) === Number(toId);
            })
        );
        if (existing) {
            throw new Error("Friend request already pending");
        }

        const basePayload = {
            from_user: fromId,
            to_user: toId,
            friend_status: "pending" as const,
            message: message ?? null,
            requested_at: new Date().toISOString(),
            read: false,
        };

        const response = await strapi.post(REQUEST_ENDPOINT, { data: basePayload });
        const created = response.data?.data;
        if (!created) {
            throw new Error("Failed to create friend request");
        }

        const updateId = created.documentId || created.id;

        try {
            await strapi.put(`${REQUEST_ENDPOINT}/${updateId}`, {
                data: {
                    from_user: fromId,
                    to_user: toId,
                },
            });
        } catch (relationErr: any) {
            console.error("Failed to attach relations for friend request:", relationErr.response?.data || relationErr.message);
            throw new Error(relationErr.response?.data?.error?.message || "Failed to attach friend relation");
        }

        try {
            const populated = await strapi.get(`${REQUEST_ENDPOINT}/${updateId}?populate=*`);
            if (populated.data?.data) {
                return mapFriendRequest(populated.data.data);
            }
        } catch (err) {
            console.warn("Unable to fetch populated friend request:", err);
        }

        return mapFriendRequest({ ...created, from_user: fromId, to_user: toId });
    } catch (error: any) {
        console.error("Error sending friend request:", error.response?.data || error.message || error);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to send friend request");
    }
}

export async function acceptFriendRequest(
    requestId: string | number,
    fromUserId: string | number,
    toUserId: string | number
): Promise<boolean> {
    try {
        const [fromId, toId] = await Promise.all([resolveUserId(fromUserId), resolveUserId(toUserId)]);

        await strapi.put(`${REQUEST_ENDPOINT}/${requestId}`, {
            data: {
                friend_status: "accepted",
                responded_at: new Date().toISOString(),
            },
        });

        return true;
    } catch (error: any) {
        console.error("Error accepting friend request:", error);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to accept friend request");
    }
}

export async function rejectFriendRequest(requestId: string | number): Promise<boolean> {
    try {
        await strapi.put(`${REQUEST_ENDPOINT}/${requestId}`, {
            data: {
                friend_status: "declined",
                responded_at: new Date().toISOString(),
            },
        });
        return true;
    } catch (error: any) {
        console.error("Error rejecting friend request:", error);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to reject friend request");
    }
}

export async function cancelFriendRequest(requestId: string | number): Promise<boolean> {
    try {
        await strapi.put(`${REQUEST_ENDPOINT}/${requestId}`, {
            data: {
                friend_status: "cancelled",
                responded_at: new Date().toISOString(),
            },
        });
        return true;
    } catch (error: any) {
        console.error("Error cancelling friend request:", error);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to cancel friend request");
    }
}

export async function getFriendRequestHistory(
    userId: string | number
): Promise<FriendRequest[]> {
    const result = await getFriendRequestHistoryPaginated(userId, { page: 1, pageSize: 100 });
    return result.data;
}

export async function getFriendRequestHistoryLimited(
    userId: string | number,
    page = 1,
    pageSize = 10
): Promise<PaginatedResult<FriendRequest>> {
    return getFriendRequestHistoryPaginated(userId, { page, pageSize });
}

export async function getFriendRequestHistoryAll(
    userId: string | number
): Promise<FriendRequest[]> {
    const firstPage = await getFriendRequestHistoryPaginated(userId, { page: 1, pageSize: 200 });
    return firstPage.data;
}

export async function getUserFriends(userId: string | number): Promise<any[]> {
    const friends: any[] = [];
    const pageSize = 100;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const result = await getUserFriendsPaginated(userId, page, pageSize);
        friends.push(...result.data);

        hasMore = result.hasMore;
        if (!hasMore) {
            break;
        }

        page = result.nextPage ?? result.pagination.page + 1;
    }

    return friends;
}

export async function getPendingFriendRequests(
    userId: string | number,
    direction: "received" | "sent" = "received",
    pageSize = 25
): Promise<FriendRequest[]> {
    const pending: FriendRequest[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const result = await getFriendRequestsPaginated(userId, direction, {
            page,
            pageSize,
            status: "pending",
        });

        pending.push(...result.data);
        hasMore = result.hasMore;
        page = result.nextPage ?? 0;

        if (!hasMore || !page) {
            break;
        }
    }

    return pending;
}

export async function unfriendUser(userId: string | number, friendId: string | number): Promise<boolean> {
    try {
        const [userNumericId, friendNumericId] = await Promise.all([
            resolveUserId(userId),
            resolveUserId(friendId),
        ]);

        const params = new URLSearchParams();
        params.set("filters[friend_status][$eq]", "accepted");
        params.set("filters[$or][0][$and][0][from_user][id][$eq]", String(userNumericId));
        params.set("filters[$or][0][$and][1][to_user][id][$eq]", String(friendNumericId));
        params.set("filters[$or][1][$and][0][from_user][id][$eq]", String(friendNumericId));
        params.set("filters[$or][1][$and][1][to_user][id][$eq]", String(userNumericId));
        params.set("pagination[page]", "1");
        params.set("pagination[pageSize]", "1");

        const response = await strapi.get(`${REQUEST_ENDPOINT}?${params.toString()}`);
        const record = response.data?.data?.[0];
        if (!record?.id) {
            return true;
        }

        await strapi.put(`${REQUEST_ENDPOINT}/${record.id}`, {
            data: {
                friend_status: "cancelled",
                responded_at: new Date().toISOString(),
            },
        });

        return true;
    } catch (error: any) {
        console.error("Error unfriending user:", error);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to unfriend user");
    }
}

export async function searchUsersPaginated(
    query = "",
    page = 1,
    pageSize = 10
): Promise<PaginatedResult<any>> {
    const trimmed = query.trim();
    const params = new URLSearchParams();
    if (trimmed) {
        params.set("filters[$or][0][username][$containsi]", trimmed);
        params.set("filters[$or][1][email][$containsi]", trimmed);
    }
    params.set("pagination[page]", String(page));
    params.set("pagination[pageSize]", String(pageSize));
    params.set("sort[0]", "username:asc");
    params.set("populate", "*");

    const response = await strapi.get(`/api/users?${params.toString()}`);
    const rawUsers = response.data?.data || [];

    const users = rawUsers.map((user: any) => {
        if (user?.attributes) {
            return {
                id: user.id,
                documentId: user.attributes.documentId,
                ...user.attributes,
            };
        }
        return user;
    });

    const pagination = buildPaginationMeta(response.data?.meta, page, pageSize, users.length);
    return formatPaginatedResult(users, pagination);
}

export async function searchUsers(query: string): Promise<any[]> {
    const result = await searchUsersPaginated(query, 1, 20);
    return result.data;
}

export async function getUsersWithFriendshipContext(
    currentUserId: string | number,
    query = "",
    page = 1,
    pageSize = 10
): Promise<PaginatedResult<any>> {
    const [userResult, requestsReceived, requestsSent] = await Promise.all([
        searchUsersPaginated(query, page, pageSize),
        getFriendRequestsPaginated(currentUserId, "received", { status: "pending", page: 1, pageSize: 100 }),
        getFriendRequestsPaginated(currentUserId, "sent", { status: "pending", page: 1, pageSize: 100 }),
    ]);
    const friends = await getUserFriends(currentUserId);
    console.debug("[FriendRequest] Friendship context", {
        currentUserId,
        query,
        page,
        pageSize,
        usersReturned: userResult.data.length,
        totalUsers: userResult.pagination.total,
        outgoingRequests: requestsSent.data.length,
        incomingRequests: requestsReceived.data.length,
        friendCount: friends.length,
    });
    const friendIds = new Set(friends.map((f: any) => Number(f.id || f?.attributes?.id)).filter((id) => Number.isFinite(id)));
    const friendDocs = new Set(friends.map((f: any) => f.documentId || f?.attributes?.documentId).filter(Boolean));

    const outgoingIds = new Set(requestsSent.data.map((req) => Number(req.to_user?.id || req.to_user)).filter((id) => Number.isFinite(id)));
    const outgoingDocs = new Set(requestsSent.data.map((req) => req.to_user?.documentId).filter(Boolean));

    const incomingIds = new Set(requestsReceived.data.map((req) => Number(req.from_user?.id || req.from_user)).filter((id) => Number.isFinite(id)));
    const incomingDocs = new Set(requestsReceived.data.map((req) => req.from_user?.documentId).filter(Boolean));

    const augmentedUsers = userResult.data.map((user: any) => {
        const numericId = Number(user.id || user?.attributes?.id);
        const docId = user.documentId || user?.attributes?.documentId;

        let status: CandidateStatus = "available";
        if (numericId === Number(currentUserId) || (docId && docId === String(currentUserId))) {
            status = "self";
        } else if ((numericId && friendIds.has(numericId)) || (docId && friendDocs.has(docId))) {
            status = "friend";
        } else if ((numericId && outgoingIds.has(numericId)) || (docId && outgoingDocs.has(docId))) {
            status = "outgoing";
        } else if ((numericId && incomingIds.has(numericId)) || (docId && incomingDocs.has(docId))) {
            status = "incoming";
        }

        return {
            ...user,
            friendshipStatus: status,
            pendingRequestId:
                status === "outgoing"
                    ? requestsSent.data.find((req) => req.to_user?.id === numericId || req.to_user?.documentId === docId)?.id
                    : status === "incoming"
                    ? requestsReceived.data.find((req) => req.from_user?.id === numericId || req.from_user?.documentId === docId)?.id
                    : undefined,
        };
    });

    return {
        data: augmentedUsers,
        pagination: userResult.pagination,
        hasMore: userResult.hasMore,
        nextPage: userResult.nextPage,
    };
}


