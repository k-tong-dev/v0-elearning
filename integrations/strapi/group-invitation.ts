import { strapi, strapiPublic } from "./client"
import { addUsersToGroup, getUserGroup, getUserGroupsForUserPaginated } from "./instructor-group"
import { getUsersByIdentifiers } from "./user"

const REQUEST_ENDPOINT = "/api/user-request-requests"
const GROUP_REQUEST_TYPE = "group"

type RequestStatus = "pending" | "accepted" | "rejected" | "cancelled"

export interface GroupInvitation {
    id: number | string
    documentId?: string
    from_user: any
    to_user: any
    user_group_group: any
    request_status: RequestStatus
    message?: string | null
    invited_at?: string
    responded_at?: string
    read: boolean
    createdAt?: string
    updatedAt?: string
}

async function resolveUserId(userId: string | number): Promise<number> {
    if (typeof userId === "number" && Number.isFinite(userId)) return userId
    if (typeof userId === "string" && /^\d+$/.test(userId)) return Number(userId)

    const response = await strapiPublic.get(
        `/api/users?filters[$or][0][id][$eq]=${encodeURIComponent(String(userId))}&filters[$or][1][documentId][$eq]=${encodeURIComponent(
            String(userId)
        )}&fields[0]=id`
    )

    const found = response.data?.data?.[0]?.id
    if (!found) {
        throw new Error(`Unable to resolve user identifier "${userId}"`)
    }
    return Number(found)
}

async function resolveGroupId(groupId: string | number): Promise<number> {
    if (typeof groupId === "number" && Number.isFinite(groupId)) return groupId
    if (typeof groupId === "string" && /^\d+$/.test(groupId)) return Number(groupId)

    try {
        const direct = await strapiPublic.get(`/api/user-group-groups/${groupId}?fields[0]=id`)
        if (direct.data?.data?.id) return Number(direct.data.data.id)
    } catch {
        // ignore and fall through
    }

    const response = await strapiPublic.get(
        `/api/user-group-groups?filters[$or][0][id][$eq]=${encodeURIComponent(String(groupId))}&filters[$or][1][documentId][$eq]=${encodeURIComponent(
            String(groupId)
        )}&fields[0]=id`
    )

    const found = response.data?.data?.[0]?.id
    if (!found) {
        throw new Error(`Unable to resolve group identifier "${groupId}"`)
    }
    return Number(found)
}

const mapGroupInvitation = (item: any): GroupInvitation => {
    const fromUser = item.from_user?.data ?? item.from_user
    const toUser = item.to_user?.data ?? item.to_user
    const group = item.user_group_group?.data ?? item.user_group_group
    return {
        id: item.id,
        documentId: item.documentId,
        from_user: fromUser,
        to_user: toUser,
        user_group_group: group,
        request_status: item.request_status ?? "pending",
        message: item.message ?? null,
        invited_at: item.invited_at ?? item.createdAt,
        responded_at: item.responded_at,
        read: item.read ?? false,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    }
}

export async function checkExistingGroupInvitation(
    fromUserId: string | number,
    toUserId: string | number,
    groupId: string | number
): Promise<GroupInvitation | null> {
    try {
        const [fromId, toId, groupNumericId] = await Promise.all([
            resolveUserId(fromUserId),
            resolveUserId(toUserId),
            resolveGroupId(groupId),
        ])

        const response = await strapiPublic.get(
            `${REQUEST_ENDPOINT}?filters[request_type][$eq]=${GROUP_REQUEST_TYPE}&filters[from_user][id][$eq]=${fromId}&filters[to_user][id][$eq]=${toId}&filters[user_group_group][id][$eq]=${groupNumericId}&populate=*`
        )

        const record = (response.data?.data || []).find(
            (item: any) => item.request_status === "pending" || item.request_status === "accepted"
        )
        return record ? mapGroupInvitation(record) : null
    } catch (error) {
        console.error("Error checking existing group invitation:", error)
        return null
    }
}

export async function sendGroupInvitation(
    fromUserId: string | number,
    toUserId: string | number,
    groupId: string | number,
    message?: string | null
): Promise<GroupInvitation> {
    try {
        const [fromId, toId, groupNumericId] = await Promise.all([
            resolveUserId(fromUserId),
            resolveUserId(toUserId),
            resolveGroupId(groupId),
        ])

        const existing = await checkExistingGroupInvitation(fromId, toId, groupNumericId)
        if (existing) {
            throw new Error(
                existing.request_status === "pending"
                    ? "An invitation is already pending for this member"
                    : "This member is already part of the group"
            )
        }

        const createPayload = {
            request_type: GROUP_REQUEST_TYPE,
            request_status: "pending" as RequestStatus,
            message: message ?? null,
            invited_at: new Date().toISOString(),
            read: false,
        }

        const createResponse = await strapi.post(REQUEST_ENDPOINT, { data: createPayload })
        const created = createResponse.data?.data
        if (!created) {
            throw new Error("Failed to create invitation")
        }

        const updateId = created.documentId || created.id
        await strapi.put(`${REQUEST_ENDPOINT}/${updateId}`, {
            data: {
                from_user: fromId,
                to_user: toId,
                user_group_group: groupNumericId,
            },
        })

        try {
            const populated = await strapiPublic.get(`${REQUEST_ENDPOINT}/${updateId}?populate=*`)
            if (populated.data?.data) {
                return mapGroupInvitation(populated.data.data)
            }
        } catch {
            // ignore and fall back to created data
        }

        return mapGroupInvitation({
            ...created,
            from_user: fromId,
            to_user: toId,
            user_group_group: groupNumericId,
        })
    } catch (error: any) {
        console.error("Error sending group invitation:", error.response?.data || error.message || error)
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to send group invitation")
    }
}

export async function getGroupInvitationsForUser(userId: string | number): Promise<GroupInvitation[]> {
    try {
        const numericId = await resolveUserId(userId)
        const response = await strapiPublic.get(
            `${REQUEST_ENDPOINT}?filters[request_type][$eq]=${GROUP_REQUEST_TYPE}&filters[to_user][id][$eq]=${numericId}&populate=*`
        )
        return (response.data?.data || []).map(mapGroupInvitation)
    } catch (error) {
        console.error("Error fetching group invitations for user:", error)
        return []
    }
}

export async function getGroupInvitationsSentByUser(userId: string | number): Promise<GroupInvitation[]> {
    try {
        const numericId = await resolveUserId(userId)
        const response = await strapiPublic.get(
            `${REQUEST_ENDPOINT}?filters[request_type][$eq]=${GROUP_REQUEST_TYPE}&filters[from_user][id][$eq]=${numericId}&populate=*`
        )
        return (response.data?.data || []).map(mapGroupInvitation)
    } catch (error) {
        console.error("Error fetching group invitations sent by user:", error)
        return []
    }
}

export async function acceptGroupInvitation(invitationId: string): Promise<boolean> {
    try {
        const invitationResponse = await strapiPublic.get(`${REQUEST_ENDPOINT}/${invitationId}?populate=*`)
        const invitation = invitationResponse.data?.data
        if (!invitation) throw new Error("Invitation not found")

        const group = invitation.user_group_group?.data ?? invitation.user_group_group
        const toUser = invitation.to_user?.data ?? invitation.to_user

        const groupIdentifier = group?.documentId || group?.id
        const toUserId = toUser?.id || toUser
        if (!groupIdentifier || !toUserId) throw new Error("Invalid invitation data")

        // ensure invitee still has capacity to join new groups
        try {
            const profiles = await getUsersByIdentifiers([{ id: toUserId }])
            const profile = profiles[0]
            if (profile?.user_group_limit && profile.user_group_limit > 0) {
                const capacity = await getUserGroupsForUserPaginated(toUserId, 1, 1, profile.documentId)
                if (capacity.pagination.total >= profile.user_group_limit) {
                    throw new Error("You have reached your group limit")
                }
            }
        } catch (limitError: any) {
            throw new Error(limitError?.message || "Unable to join this group right now")
        }

        // ensure group still has capacity
        const groupDetails = await getUserGroup(groupIdentifier)
        if (groupDetails) {
            const rawMembers = Array.isArray(groupDetails.users) ? groupDetails.users : []
            const memberIds = new Set<number>()
            rawMembers.forEach((member: any) => {
                const memberRecord = member?.data?.attributes ?? member?.attributes ?? member
                const id = typeof memberRecord?.id === "number" ? memberRecord.id : extractNumericId(memberRecord?.id ?? member)
                if (id !== undefined && id !== null) memberIds.add(Number(id))
            })

            const ownerRecord = groupDetails.owner?.data?.attributes ?? groupDetails.owner?.attributes ?? groupDetails.owner
            const ownerMemberLimit = ownerRecord?.user_group_member_limit
            if (typeof ownerMemberLimit === "number" && ownerMemberLimit > 0 && memberIds.size >= ownerMemberLimit) {
                throw new Error("This group has reached its member limit")
            }
        }

        await addUsersToGroup(groupIdentifier, [toUserId])

        await strapi.put(`${REQUEST_ENDPOINT}/${invitation.documentId || invitation.id}`, {
            data: {
                request_status: "accepted",
                responded_at: new Date().toISOString(),
            },
        })

        await strapi.delete(`${REQUEST_ENDPOINT}/${invitation.documentId || invitation.id}`)
        return true
    } catch (error: any) {
        console.error("Error accepting group invitation:", error.response?.data || error.message || error)
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to accept group invitation")
    }
}

export async function rejectGroupInvitation(invitationId: string): Promise<boolean> {
    try {
        await strapi.put(`${REQUEST_ENDPOINT}/${invitationId}`, {
            data: {
                request_status: "rejected",
                responded_at: new Date().toISOString(),
            },
        })
        await strapi.delete(`${REQUEST_ENDPOINT}/${invitationId}`)
        return true
    } catch (error: any) {
        console.error("Error rejecting group invitation:", error.response?.data || error.message || error)
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to reject group invitation")
    }
}

export async function userHasCapacityForMoreGroups(userId: string | number, userDocumentId?: string | null): Promise<{ canJoin: boolean; total: number }> {
    try {
        const numericId = await resolveUserId(userId)
        const documentId = userDocumentId ?? (typeof userId === "string" && !/^\d+$/.test(userId) ? userId : undefined)
        const result = await getUserGroupsForUserPaginated(numericId, 1, 1, documentId)
        const total = result.pagination.total
        return { canJoin: true, total }
    } catch (error) {
        console.error("Error checking user group capacity:", error)
        return { canJoin: true, total: 0 }
    }
}

const extractNumericId = (value: any): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && /^\d+$/.test(value)) return Number(value)
    return undefined
}
