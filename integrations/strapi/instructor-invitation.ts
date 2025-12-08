import { strapiPublic, strapi } from "./client";
import { Instructor, getInstructor } from "./instructor";

const REQUEST_ENDPOINT = "/api/user-request-requests";
const INSTRUCTOR_TYPE = "instructor";
const GROUP_ENDPOINT = "/api/user-group-groups";

function mapInstructorFromData(instructorData: any): Instructor | null {
    if (!instructorData || !instructorData.id) {
        return null;
    }

    let userData = instructorData.user;
    if (userData && typeof userData === "object" && userData.data) {
        userData = userData.data;
    }

    let avatarData = instructorData.avatar;
    if (avatarData && typeof avatarData === "object" && avatarData.data) {
        avatarData = avatarData.data;
    }

    let coverData = instructorData.cover;
    if (coverData && typeof coverData === "object" && coverData.data) {
        coverData = coverData.data;
    }

    return {
        id: instructorData.id,
        documentId: instructorData.documentId,
        name: instructorData.name || "",
        user: userData?.id || userData || null,
        bio: instructorData.bio || "",
        avatar: avatarData || instructorData.avatar || null,
        cover: coverData || instructorData.cover || null,
        specializations: instructorData.specializations,
        is_verified: instructorData.is_verified ?? false,
        is_active: instructorData.is_active ?? true,
        banking_info: instructorData.banking_info,
        monetization: instructorData.monetization ?? false,
        youtube: instructorData.youtube,
        linkin: instructorData.linkin,
        github: instructorData.github,
        facebook: instructorData.facebook,
        tiktok: instructorData.tiktok,
        instagram: instructorData.instagram,
        rating: instructorData.rating,
        stats: instructorData.stats,
        createdAt: instructorData.createdAt,
        updatedAt: instructorData.updatedAt,
        publishedAt: instructorData.publishedAt,
        locale: instructorData.locale,
    };
}

export interface InstructorInvitation {
    id: number;
    documentId: string;
    from_user: any;
    to_instructor: any;
    instructor_group: any;
    invitation_status: "pending" | "accepted" | "rejected" | "cancelled";
    message?: string | null;
    invited_at?: string;
    responded_at?: string;
    read: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export async function searchInstructors(query: string): Promise<Instructor[]> {
    try {
        const response = await strapiPublic.get(
            `/api/instructors?filters[$or][0][name][$containsi]=${encodeURIComponent(query)}&filters[$or][1][user][username][$containsi]=${encodeURIComponent(query)}&populate=*`
        );

        const allResults = (response.data?.data || []).map(mapInstructorFromData).filter(Boolean) as Instructor[];
        const lower = query.toLowerCase().trim();

        return allResults.filter((inst) => {
            const userObj = inst.user as any;
            return (
                inst.name?.toLowerCase().includes(lower) ||
                userObj?.username?.toLowerCase().includes(lower) ||
                inst.bio?.toLowerCase().includes(lower)
            );
        });
    } catch (error) {
        console.error("Error searching instructors:", error);
        return [];
    }
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

async function resolveInstructorId(instructorId: string | number): Promise<number> {
    if (typeof instructorId === "number" && instructorId > 0) return instructorId;
    if (typeof instructorId === "string" && /^\d+$/.test(instructorId)) return Number(instructorId);

    try {
        const direct = await strapiPublic.get(`/api/instructors/${instructorId}?fields[0]=id`);
        if (direct.data?.data?.id) return Number(direct.data.data.id);
    } catch {
        // ignore and fallback to search
    }

    const response = await strapiPublic.get(
        `/api/instructors?filters[$or][0][id][$eq]=${encodeURIComponent(String(instructorId))}&filters[$or][1][documentId][$eq]=${encodeURIComponent(
            String(instructorId)
        )}&fields[0]=id`
    );

    const found = response.data?.data?.[0]?.id;
    if (!found) {
        throw new Error(`Unable to resolve instructor ID for "${instructorId}"`);
    }
    return Number(found);
}

async function resolveGroupId(groupId: string | number): Promise<number> {
    if (typeof groupId === "number" && groupId > 0) return groupId;
    if (typeof groupId === "string" && /^\d+$/.test(groupId)) return Number(groupId);

    try {
        const direct = await strapiPublic.get(`/api/user-group-groups/${groupId}?fields[0]=id`);
        if (direct.data?.data?.id) return Number(direct.data.data.id);
    } catch {
        // ignore and fallback to search
    }

    const response = await strapiPublic.get(
        `/api/user-group-groups?filters[$or][0][id][$eq]=${encodeURIComponent(String(groupId))}&filters[$or][1][documentId][$eq]=${encodeURIComponent(
            String(groupId)
        )}&fields[0]=id`
    );

    const found = response.data?.data?.[0]?.id;
    if (!found) {
        throw new Error(`Unable to resolve group ID for "${groupId}"`);
    }
    return Number(found);
}

export async function checkExistingInvitation(
    fromUserId: string | number,
    toInstructorId: string | number,
    groupId: string | number
): Promise<InstructorInvitation | null> {
    try {
        const [fromId, instructorId, groupNumericId] = await Promise.all([
            resolveUserId(fromUserId),
            resolveInstructorId(toInstructorId),
            resolveGroupId(groupId),
        ]);

        const response = await strapiPublic.get(
            `${REQUEST_ENDPOINT}?filters[request_type][$eq]=${INSTRUCTOR_TYPE}&filters[from_user][id][$eq]=${fromId}&filters[to_instructor][id][$eq]=${instructorId}&filters[user_group_group][id][$eq]=${groupNumericId}&populate=*`
        );

        const match = (response.data?.data || []).find(
            (item: any) => item.request_status === "pending" || item.request_status === "accepted"
        );

        return match
            ? {
                  id: match.id,
                  documentId: match.documentId,
                  from_user: match.from_user,
                  to_instructor: match.to_instructor,
                  instructor_group: match.user_group_group,
                  invitation_status: match.request_status,
                  message: match.message,
                  invited_at: match.invited_at,
                  responded_at: match.responded_at,
                  read: match.read ?? false,
                  createdAt: match.createdAt,
                  updatedAt: match.updatedAt,
              }
            : null;
    } catch (error) {
        console.error("Error checking existing invitation:", error);
        return null;
    }
}

export async function sendInvitation(
    fromUserId: string | number,
    toInstructorId: string | number,
    groupId: string | number,
    message?: string
): Promise<InstructorInvitation | null> {
    try {
        const [fromId, instructorId, groupNumericId] = await Promise.all([
            resolveUserId(fromUserId),
            resolveInstructorId(toInstructorId),
            resolveGroupId(groupId),
        ]);

        const existing = await checkExistingInvitation(fromId, instructorId, groupNumericId);
        if (existing) {
            throw new Error(
                existing.invitation_status === "pending"
                    ? "An invitation is already pending for this group"
                    : "You already have an accepted invitation for this group"
            );
        }

        const basePayload = {
            request_type: INSTRUCTOR_TYPE,
            request_status: "pending" as const,
            message: message ?? null,
            invited_at: new Date().toISOString(),
            read: false,
        };

        const response = await strapi.post(REQUEST_ENDPOINT, { data: basePayload });
        const created = response.data?.data;
        if (!created) {
            throw new Error("Failed to create invitation");
        }

        const updateId = created.documentId || created.id;

        try {
            await strapi.put(`${REQUEST_ENDPOINT}/${updateId}`, {
                data: {
                    from_user: fromId,
                    to_instructor: instructorId,
                    user_group_group: groupNumericId,
                },
            });
        } catch (relationErr: any) {
            console.error("Failed to attach relations for instructor invitation:", relationErr.response?.data || relationErr.message);
            throw new Error(relationErr.response?.data?.error?.message || "Failed to attach invitation relations");
        }

        try {
            const populated = await strapiPublic.get(`${REQUEST_ENDPOINT}/${updateId}?populate=*`);
            if (populated.data?.data) {
                return mapInstructorInvitation(populated.data.data);
            }
        } catch (err) {
            console.warn("Unable to fetch populated instructor invitation:", err);
        }

        return mapInstructorInvitation({
            ...created,
            from_user: fromId,
            to_instructor: instructorId,
            user_group_group: groupNumericId,
        });
    } catch (error: any) {
        console.error("Error sending invitation:", error.response?.data || error.message || error);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to send invitation");
    }
}

function mapInstructorInvitation(item: any): InstructorInvitation {
    const toInstructor = item.to_instructor && item.to_instructor.data ? item.to_instructor.data : item.to_instructor;
    const group = item.user_group_group && item.user_group_group.data ? item.user_group_group.data : item.user_group_group;
    const fromUser = item.from_user && item.from_user.data ? item.from_user.data : item.from_user;

    return {
        id: item.id,
        documentId: item.documentId,
        from_user: fromUser,
        to_instructor: toInstructor,
        instructor_group: group,
        invitation_status: item.request_status || "pending",
        message: item.message,
        invited_at: item.invited_at || item.createdAt,
        responded_at: item.responded_at,
        read: item.read ?? false,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    };
}

export async function getInstructorInvitations(instructorId: string | number): Promise<InstructorInvitation[]> {
    try {
        let numericId = instructorId;
        let documentId: string | null = null;

        if (typeof instructorId === "string" && isNaN(Number(instructorId))) {
            documentId = instructorId;
            try {
                const response = await strapiPublic.get(
                    `/api/instructors?filters[documentId][$eq]=${instructorId}&fields[0]=id`
                );
                if (response.data?.data?.length) {
                    numericId = response.data.data[0].id;
                }
            } catch {
                numericId = instructorId;
            }
        } else {
            try {
                const response = await strapiPublic.get(
                    `/api/instructors?filters[id][$eq]=${numericId}&fields[0]=documentId`
                );
                if (response.data?.data?.length) {
                    documentId = response.data.data[0].documentId;
                }
            } catch {
                documentId = null;
            }
        }

        const primary = await strapiPublic.get(
            `${REQUEST_ENDPOINT}?filters[request_type][$eq]=${INSTRUCTOR_TYPE}&filters[to_instructor][id][$eq]=${numericId}&populate=*&sort=invited_at:desc`
        );

        let combined = primary.data?.data || [];

        if (documentId) {
            try {
                const byDocument = await strapiPublic.get(
                    `${REQUEST_ENDPOINT}?filters[request_type][$eq]=${INSTRUCTOR_TYPE}&filters[to_instructor][documentId][$eq]=${documentId}&populate=*&sort=invited_at:desc`
                );
                combined = combined.concat(byDocument.data?.data || []);
            } catch {
                // ignore
            }
        }

        const unique = new Map<string | number, any>();
        combined.forEach((item: any) => {
            const key = item.documentId || item.id;
            if (!unique.has(key)) {
                unique.set(key, item);
            }
        });

        return Array.from(unique.values()).map(mapInstructorInvitation);
    } catch (error) {
        console.error("Error fetching instructor invitations:", error);
        return [];
    }
}

export async function getUserInvitations(userId: string | number): Promise<InstructorInvitation[]> {
    try {
        const numericId = await resolveUserId(userId);
        const response = await strapiPublic.get(
            `${REQUEST_ENDPOINT}?filters[request_type][$eq]=${INSTRUCTOR_TYPE}&filters[from_user][id][$eq]=${numericId}&populate=*&sort=invited_at:desc`
        );

        return (response.data?.data || []).map(mapInstructorInvitation);
    } catch (error) {
        console.error("Error fetching user invitations:", error);
        return [];
    }
}

export async function acceptInvitation(invitationId: string): Promise<boolean> {
    try {
        const { addInstructorToGroup } = await import("./instructor-group");

        const invitationResponse = await strapiPublic.get(
            `${REQUEST_ENDPOINT}/${invitationId}?populate=*`
        );
        const invitation = invitationResponse.data?.data;
        if (!invitation) {
            throw new Error("Invitation not found");
        }

        let toInstructor = invitation.to_instructor && invitation.to_instructor.data ? invitation.to_instructor.data : invitation.to_instructor;
        if (!toInstructor || !toInstructor.id) {
            const resolved = await strapiPublic.get(
                `/api/instructors/${invitation.to_instructor}?populate=*`
            );
            toInstructor = resolved.data?.data;
        }

        let instructorGroup = invitation.user_group_group && invitation.user_group_group.data ? invitation.user_group_group.data : invitation.user_group_group;
        if (!instructorGroup || !instructorGroup.id) {
            const resolved = await strapiPublic.get(
                `/api/user-group-groups/${invitation.user_group_group}?populate=*`
            );
            instructorGroup = resolved.data?.data;
        }

        if (!toInstructor || !instructorGroup) {
            throw new Error("Instructor or group data not found in invitation");
        }

        const instructorId = Number(toInstructor.id || toInstructor);
        const groupIdentifier = instructorGroup.documentId || instructorGroup.id;
        if (!instructorId || !groupIdentifier) {
            throw new Error("Invalid invitation data");
        }

        await addInstructorToGroup(groupIdentifier, instructorId);

        await strapi.put(`${REQUEST_ENDPOINT}/${invitation.documentId || invitation.id}`, {
            data: {
                request_status: "accepted",
                responded_at: new Date().toISOString(),
            },
        });

        await strapi.delete(`${REQUEST_ENDPOINT}/${invitation.documentId || invitation.id}`);
        return true;
    } catch (error: any) {
        console.error("Error accepting invitation:", error);
        throw new Error(error.message || "Failed to accept invitation");
    }
}

export async function rejectInvitation(invitationId: string): Promise<boolean> {
    try {
        await strapi.delete(`${REQUEST_ENDPOINT}/${invitationId}`);
        return true;
    } catch (error) {
        console.error("Error rejecting invitation:", error);
        return false;
    }
}

export async function cancelInvitation(invitationId: string): Promise<boolean> {
    try {
        await strapi.delete(`${REQUEST_ENDPOINT}/${invitationId}`);
        return true;
    } catch (error) {
        console.error("Error cancelling invitation:", error);
        return false;
    }
}

export async function markInvitationAsRead(invitationId: string): Promise<boolean> {
    try {
        await strapi.put(`${REQUEST_ENDPOINT}/${invitationId}`, {
            data: { read: true },
        });
        return true;
    } catch (error) {
        console.error("Error marking invitation as read:", error);
        return false;
    }
}

export async function getPendingInvitationsCount(instructorId: string | number): Promise<number> {
    try {
        const numericId = await resolveInstructorId(instructorId);
        const response = await strapiPublic.get(
            `${REQUEST_ENDPOINT}?filters[request_type][$eq]=${INSTRUCTOR_TYPE}&filters[to_instructor][id][$eq]=${numericId}&filters[request_status][$eq]=pending&filters[read][$eq]=false&pagination[limit]=1`
        );
        return response.data?.meta?.pagination?.total || 0;
    } catch (error) {
        console.error("Error getting pending invitations count:", error);
        return 0;
    }
}

export async function getCollaboratingInstructors(instructorId: string | number): Promise<Instructor[]> {
    try {
        const numericId = await resolveInstructorId(instructorId);
        const response = await strapiPublic.get(
            `${GROUP_ENDPOINT}?filters[group_types][$eq]=${INSTRUCTOR_TYPE}&filters[instructors][id][$eq]=${numericId}&populate[instructors][populate][0]=avatar&populate[instructors][populate][1]=user`
        );

        const groups = response.data?.data || [];
        const collaboratorIds = new Set<number>();

        groups.forEach((group: any) => {
            const instructors = group.attributes?.instructors?.data || group.instructors?.data || group.instructors || [];
            if (Array.isArray(instructors)) {
                instructors.forEach((inst: any) => {
                    const instId = inst.id ?? inst.attributes?.id;
                    if (!instId) return;
                    if (Number(instId) !== Number(numericId)) {
                        collaboratorIds.add(Number(instId));
                    }
                });
            }
        });

        if (collaboratorIds.size === 0) {
            return [];
        }

        const collaborators = await Promise.all(
            Array.from(collaboratorIds).map(async (id) => {
                const instructor = await getInstructor(id);
                return instructor || null;
            })
        );

        return collaborators.filter(Boolean) as Instructor[];
    } catch (error) {
        console.error("Error fetching collaborating instructors:", error);
        return [];
    }
}

export async function uncollaborateInstructor(
    instructorId: string | number,
    collaboratorId: string | number
): Promise<boolean> {
    try {
        const instructor = await getInstructor(instructorId);
        if (!instructor) {
            throw new Error("Instructor not found");
        }

        const collaborator = await getInstructor(collaboratorId);
        if (!collaborator) {
            throw new Error("Collaborator not found");
        }

        const instructorUpdateId = instructor.documentId || instructor.id;
        const collaboratorUpdateId = collaborator.documentId || collaborator.id;

        const instructorCollaborators = Array.isArray((instructor as any).collaborated_instructors)
            ? (instructor as any).collaborated_instructors.map((inst: any) => Number(inst.id || inst)).filter((id: number) => !isNaN(id))
            : [];

        const collaboratorCollaborators = Array.isArray((collaborator as any).collaborated_instructors)
            ? (collaborator as any).collaborated_instructors
                  .map((inst: any) => Number(inst.id || inst))
                  .filter((id: number) => !isNaN(id))
            : [];

        await strapi.put(`/api/instructors/${instructorUpdateId}`, {
            data: {
                collaborated_instructors: instructorCollaborators.filter((id: number) => id !== Number(collaboratorUpdateId)),
            },
        });

        await strapi.put(`/api/instructors/${collaboratorUpdateId}`, {
            data: {
                collaborated_instructors: collaboratorCollaborators.filter((id: number) => id !== Number(instructorUpdateId)),
            },
        });

        return true;
    } catch (error: any) {
        console.error("Error uncollaborating instructor:", error);
        throw new Error(error.response?.data?.error?.message || "Failed to uncollaborate instructor");
    }
}
