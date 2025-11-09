import { strapiPublic, strapi } from "./client";
import { Instructor, getInstructor } from "./instructor";

export interface InstructorGroup {
    id: number;
    documentId?: string;
    name: string;
    group_types: "instructor" | "user" | string;
    owner: number | string | any;
    instructors?: (number | Instructor)[];
    users?: any[];
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
}

const GROUP_ENDPOINT = "/api/user-group-groups";
const INSTRUCTOR_GROUP_TYPE = "instructor";
const USER_GROUP_TYPE = "user";
const BASE_FIELDS = "fields[0]=documentId&fields[1]=name";

interface GroupPaginationMeta {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
}

interface GroupPaginatedResult<T> {
    data: T[];
    pagination: GroupPaginationMeta;
    hasMore: boolean;
    nextPage: number | null;
}

function mapGroup(item: any): InstructorGroup {
    if (!item) return null as any;
    const attributes = item.attributes || {};
    const id = item.id ?? attributes.id;

    const normalizeRelation = (rel: any) => {
        if (!rel) return rel;
        if (Array.isArray(rel)) return rel;
        if (rel.data) {
            if (Array.isArray(rel.data)) {
                return rel.data.map((entry: any) => ({
                    id: entry.id,
                    documentId: entry.attributes?.documentId,
                    ...entry.attributes,
                }));
            }
            return {
                id: rel.data.id,
                documentId: rel.data.attributes?.documentId,
                ...rel.data.attributes,
            };
        }
        return rel;
    };

    return {
        id,
        documentId: attributes.documentId || item.documentId,
        name: attributes.name || item.name || "",
        group_types: attributes.group_types || item.group_types || INSTRUCTOR_GROUP_TYPE,
        owner: normalizeRelation(attributes.owner || item.owner),
        instructors: normalizeRelation(attributes.instructors || item.instructors) || [],
        users: normalizeRelation(attributes.users || item.users) || [],
        createdAt: attributes.createdAt || item.createdAt,
        updatedAt: attributes.updatedAt || item.updatedAt,
        publishedAt: attributes.publishedAt || item.publishedAt,
    };
}

function buildGroupPagination(meta: any, fallbackPage: number, fallbackPageSize: number, fallbackTotal: number): GroupPaginationMeta {
    const pagination = meta?.pagination || {};
    return {
        page: pagination.page ?? fallbackPage,
        pageSize: pagination.pageSize ?? fallbackPageSize,
        pageCount: pagination.pageCount ?? Math.max(1, Math.ceil(fallbackTotal / fallbackPageSize)),
        total: pagination.total ?? fallbackTotal,
    };
}

function formatGroupPaginatedResult<T>(records: T[], pagination: GroupPaginationMeta): GroupPaginatedResult<T> {
    const hasMore = pagination.page < pagination.pageCount;
    return {
        data: records,
        pagination,
        hasMore,
        nextPage: hasMore ? pagination.page + 1 : null,
    };
}

async function resolveGroupId(groupId: string | number): Promise<{ numericId?: number; documentId?: string }> {
    if (typeof groupId === "string" && groupId && !/^\d+$/.test(groupId)) {
        return { documentId: groupId };
    }

    const numeric = typeof groupId === "number" ? groupId : Number(groupId);
    if (!numeric || Number.isNaN(numeric)) {
        throw new Error(`Invalid group identifier: ${groupId}`);
    }

    const response = await strapiPublic.get(
        `${GROUP_ENDPOINT}?filters[id][$eq]=${numeric}&filters[group_types][$eq]=${INSTRUCTOR_GROUP_TYPE}&${BASE_FIELDS}`
    );
    const data = response.data?.data || [];
    if (data.length > 0) {
        const entry = data[0];
        return {
            numericId: entry.id,
            documentId: entry.attributes?.documentId || entry.documentId,
        };
    }

    throw new Error(`Unable to resolve group ID for ${groupId}`);
}

async function fetchGroupIdentifier(
    groupId: string | number,
    groupType: "instructor" | "user" = INSTRUCTOR_GROUP_TYPE
): Promise<{ id: number; documentId: string }> {
    const nonNumeric = typeof groupId === "string" && groupId.trim() !== "" && !/^\d+$/.test(groupId);

    if (nonNumeric) {
        const response = await strapiPublic.get(
            `${GROUP_ENDPOINT}/${groupId}?fields[0]=documentId&fields[1]=id&fields[2]=group_types`
        );
        const data = response.data?.data;
        if (!data) {
            throw new Error("Group not found");
        }
        const attributes = data.attributes || {};
        const type = attributes.group_types || data.group_types;
        if (type && type !== groupType) {
            throw new Error(`Group type mismatch. Expected "${groupType}" but found "${type}"`);
        }
        const documentId = attributes.documentId || data.documentId;
        if (!documentId) {
            throw new Error("Group documentId not found");
        }
        const id = data.id ?? attributes.id;
        return { id: Number(id), documentId };
    }

    const numericId = typeof groupId === "number" ? groupId : Number(groupId);
    if (!numericId || Number.isNaN(numericId)) {
        throw new Error("Invalid group identifier");
    }

    const response = await strapiPublic.get(
        `${GROUP_ENDPOINT}?filters[id][$eq]=${numericId}&filters[group_types][$eq]=${groupType}&fields[0]=documentId&fields[1]=id`
    );
    const entry = response.data?.data?.[0];
    if (!entry) {
        throw new Error("Group not found");
    }
    const attributes = entry.attributes || {};
    const documentId = attributes.documentId || entry.documentId;
    if (!documentId) {
        throw new Error("Group documentId not found");
    }
    const id = entry.id ?? attributes.id ?? numericId;
    return { id: Number(id), documentId };
}

export async function updateGroupName(
    groupId: string | number,
    newName: string,
    groupType: "instructor" | "user" = INSTRUCTOR_GROUP_TYPE
): Promise<InstructorGroup | null> {
    const trimmedName = newName?.trim();
    if (!trimmedName) {
        throw new Error("Group name is required");
    }

    const { documentId } = await fetchGroupIdentifier(groupId, groupType);

    await strapi.put(`${GROUP_ENDPOINT}/${documentId}`, {
        data: {
            name: trimmedName,
            group_types: groupType,
        },
    });

    const updatedResponse = await strapiPublic.get(`${GROUP_ENDPOINT}/${documentId}?populate=*`);
    const updated = updatedResponse.data?.data;
    return updated ? mapGroup(updated) : null;
}

export async function getUserGroupsForUserPaginated(
    userId: string | number,
    page = 1,
    pageSize = 10,
    userDocumentId?: string
): Promise<GroupPaginatedResult<InstructorGroup>> {
    const numericId = typeof userId === "number" ? userId : (typeof userId === "string" && /^\d+$/.test(userId) ? Number(userId) : undefined);
    const documentId = userDocumentId || (typeof userId === "string" && !/^\d+$/.test(userId) ? userId : undefined);

    const fetchRequests: Promise<any>[] = [];

    const makeParams = (entries: Record<string, string>): string => {
        const params = new URLSearchParams();
        params.set("filters[group_types][$eq]", USER_GROUP_TYPE);
        params.set("populate", "*");
        params.set("pagination[page]", "1");
        params.set("pagination[pageSize]", String(Math.max(pageSize * 3, 50)));
        params.set("sort[0]", "updatedAt:desc");
        Object.entries(entries).forEach(([key, value]) => params.set(key, value));
        return params.toString();
    };

    if (numericId !== undefined) {
        fetchRequests.push(
            strapiPublic.get(`${GROUP_ENDPOINT}?${makeParams({ "filters[owner][id][$eq]": String(numericId) })}`)
        );
        fetchRequests.push(
            strapiPublic.get(`${GROUP_ENDPOINT}?${makeParams({ "filters[users][id][$eq]": String(numericId) })}`)
        );
    }

    if (documentId) {
        fetchRequests.push(
            strapiPublic.get(`${GROUP_ENDPOINT}?${makeParams({ "filters[owner][documentId][$eq]": documentId })}`)
        );
        fetchRequests.push(
            strapiPublic.get(`${GROUP_ENDPOINT}?${makeParams({ "filters[users][documentId][$eq]": documentId })}`)
        );
    }

    if (fetchRequests.length === 0) {
        fetchRequests.push(strapiPublic.get(`${GROUP_ENDPOINT}?${makeParams({})}`));
    }

    const responses = await Promise.allSettled(fetchRequests);
    const groupMap = new Map<number, InstructorGroup>();

    responses.forEach((result) => {
        if (result.status !== "fulfilled") {
            console.warn("Failed to fetch user groups slice", result.reason?.response?.data || result.reason);
            return;
        }
        const data = result.value?.data?.data || [];
        data.forEach((item: any) => {
            const mapped = mapGroup(item);
            if (mapped?.id) {
                groupMap.set(mapped.id, mapped);
            }
        });
    });

    const allGroups = Array.from(groupMap.values()).sort((a, b) => {
        const aDate = a.updatedAt || a.createdAt || "";
        const bDate = b.updatedAt || b.createdAt || "";
        return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    const total = allGroups.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(page, 1), pageCount);
    const start = (safePage - 1) * pageSize;
    const paged = allGroups.slice(start, start + pageSize);

    return {
        data: paged,
        pagination: {
            page: safePage,
            pageSize,
            pageCount,
            total,
        },
        hasMore: safePage < pageCount,
        nextPage: safePage < pageCount ? safePage + 1 : null,
    };
}

export function isUserGroup(group: InstructorGroup | null | undefined): boolean {
    if (!group) return false;
    return (group.group_types || "").toLowerCase() === USER_GROUP_TYPE;
}

export async function getUserInstructorGroups(userId: string | number): Promise<InstructorGroup[]> {
    try {
        const response = await strapiPublic.get(
            `${GROUP_ENDPOINT}?filters[owner][id][$eq]=${userId}&filters[group_types][$eq]=${INSTRUCTOR_GROUP_TYPE}&${BASE_FIELDS}&populate=*`
        );
        const items = response.data?.data || [];
        return items.map(mapGroup).filter(Boolean);
    } catch (error: any) {
        console.error("Error fetching instructor groups:", error?.response?.data || error.message || error);
        return [];
    }
}

export async function getInstructorGroupsForInstructor(instructorId: string | number): Promise<InstructorGroup[]> {
    try {
        const response = await strapiPublic.get(
            `${GROUP_ENDPOINT}?filters[group_types][$eq]=${INSTRUCTOR_GROUP_TYPE}&filters[instructors][id][$eq]=${instructorId}&${BASE_FIELDS}&populate=*`
        );
        const items = response.data?.data || [];
        return items.map(mapGroup).filter(Boolean);
    } catch (error: any) {
        console.error("Error fetching instructor groups for instructor:", error?.response?.data || error.message || error);
        return [];
    }
}

export async function getInstructorGroup(groupId: string | number): Promise<InstructorGroup | null> {
    try {
        if (typeof groupId === "number" || (typeof groupId === "string" && /^\d+$/.test(groupId))) {
            const response = await strapiPublic.get(
                `${GROUP_ENDPOINT}?filters[id][$eq]=${groupId}&filters[group_types][$eq]=${INSTRUCTOR_GROUP_TYPE}&${BASE_FIELDS}&populate=*`
            );
            const item = response.data?.data?.[0];
            return item ? mapGroup(item) : null;
        }

        const response = await strapiPublic.get(
            `${GROUP_ENDPOINT}/${groupId}?${BASE_FIELDS}&populate=*`
        );
        const item = response.data?.data;
        if (!item) return null;
        const mapped = mapGroup(item);
        return mapped.group_types === INSTRUCTOR_GROUP_TYPE ? mapped : null;
    } catch (error: any) {
        console.error("Error fetching instructor group:", error?.response?.data || error.message || error);
        return null;
    }
}

export async function createInstructorGroup(name: string, ownerId: string | number): Promise<InstructorGroup | null> {
    try {
        const numericOwner = typeof ownerId === "number" ? ownerId : Number(ownerId);
        if (!numericOwner || Number.isNaN(numericOwner)) {
            throw new Error("Owner ID is required to create group");
        }

        const response = await strapi.post(GROUP_ENDPOINT, {
            data: {
                name,
                owner: numericOwner,
                group_types: INSTRUCTOR_GROUP_TYPE,
                instructors: [],
                publishedAt: new Date().toISOString(),
            },
        });

        const item = response.data?.data;
        if (!item) return null;

        return mapGroup(item);
    } catch (error: any) {
        console.error("Error creating instructor group:", error.response?.data || error.message || error);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to create instructor group");
    }
}

export async function updateInstructorGroup(groupId: string | number, data: Partial<InstructorGroup>): Promise<InstructorGroup | null> {
    try {
        const current = await getInstructorGroup(groupId);
        if (!current) {
            throw new Error("Group not found");
        }

        const updateId = current.documentId || (await resolveGroupId(current.id)).documentId;
        if (!updateId) {
            throw new Error("Unable to resolve document ID for group");
        }

        const payload: any = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.owner !== undefined) payload.owner = typeof data.owner === "number" ? data.owner : Number(data.owner);

        const response = await strapi.put(`${GROUP_ENDPOINT}/${updateId}`, {
            data: payload,
        });

        const item = response.data?.data;
        return item ? mapGroup(item) : null;
    } catch (error: any) {
        console.error("Error updating instructor group:", error.response?.data || error.message || error);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to update instructor group");
    }
}

export async function addInstructorsToGroup(groupId: string | number, instructorIds: (string | number)[]): Promise<boolean> {
    try {
        if (!Array.isArray(instructorIds) || instructorIds.length === 0) {
            return true;
        }

        const group = await getInstructorGroup(groupId);
        if (!group) {
            throw new Error("Group not found");
        }

        const numericInstructorIds: number[] = [];
        for (const value of instructorIds) {
            if (typeof value === "number") {
                numericInstructorIds.push(value);
                continue;
            }
            if (typeof value === "string" && /^\d+$/.test(value)) {
                numericInstructorIds.push(Number(value));
                continue;
            }
            const inst = await getInstructor(value);
            if (inst?.id) {
                numericInstructorIds.push(Number(inst.id));
            }
        }

        const currentIds = Array.isArray(group.instructors)
            ? group.instructors.map((inst: any) => Number(inst.id || inst)).filter((id) => !Number.isNaN(id))
            : [];

        const merged = Array.from(new Set([...currentIds, ...numericInstructorIds]));

        const updateId = group.documentId || (await resolveGroupId(group.id)).documentId;
        if (!updateId) {
            throw new Error("Unable to resolve document ID for group");
        }

        await strapi.put(`${GROUP_ENDPOINT}/${updateId}`, {
            data: {
                instructors: merged,
            },
        });

        return true;
    } catch (error: any) {
        console.error("Error adding instructors to group:", error.response?.data || error.message || error);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to add instructors to group");
    }
}

export async function addInstructorToGroup(groupId: string | number, instructorId: string | number): Promise<boolean> {
    return addInstructorsToGroup(groupId, [instructorId]);
}

export async function removeInstructorFromGroup(groupId: string | number, instructorId: string | number): Promise<boolean> {
    try {
        const group = await getInstructorGroup(groupId);
        if (!group) {
            throw new Error("Group not found");
        }

        const numericInstructorId = typeof instructorId === "number"
            ? instructorId
            : typeof instructorId === "string" && /^\d+$/.test(instructorId)
            ? Number(instructorId)
            : (await getInstructor(instructorId))?.id;

        if (!numericInstructorId) {
            throw new Error("Instructor not found");
        }

        const currentIds = Array.isArray(group.instructors)
            ? group.instructors.map((inst: any) => Number(inst.id || inst)).filter((id) => !Number.isNaN(id))
            : [];

        const updated = currentIds.filter((id) => id !== Number(numericInstructorId));

        const updateId = group.documentId || (await resolveGroupId(group.id)).documentId;
        if (!updateId) {
            throw new Error("Unable to resolve document ID for group");
        }

        await strapi.put(`${GROUP_ENDPOINT}/${updateId}`, {
            data: {
                instructors: updated,
            },
        });

        return true;
    } catch (error: any) {
        console.error("Error removing instructor from group:", error.response?.data || error.message || error);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to remove instructor from group");
    }
}

export async function deleteInstructorGroup(groupId: string | number): Promise<boolean> {
    try {
        const group = await getInstructorGroup(groupId);
        if (!group) {
            throw new Error("Group not found");
        }

        const deleteId = group.documentId || (await resolveGroupId(group.id)).documentId;
        if (!deleteId) {
            throw new Error("Unable to resolve document ID for group");
        }

        await strapi.delete(`${GROUP_ENDPOINT}/${deleteId}`);
        return true;
    } catch (error: any) {
        console.error("Error deleting instructor group:", error.response?.data || error.message || error);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to delete instructor group");
    }
}


