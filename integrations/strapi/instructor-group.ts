import { strapiPublic, strapi } from './client';
import { Instructor } from './instructor';

export interface InstructorGroup {
    id: number;
    documentId: string;
    name: string;
    owner: number | string | any; // User ID or populated user object
    instructors?: (number | Instructor)[];
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
}

/**
 * Get all instructor groups for a user (owned by user)
 */
export async function getUserInstructorGroups(userId: string | number): Promise<InstructorGroup[]> {
    try {
        const response = await strapiPublic.get(
            `/api/instructor-groups?filters[owner][id][$eq]=${userId}&populate=*`
        );
        
        return (response.data?.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name || '',
            owner: item.owner?.id || item.owner || null,
            instructors: item.instructors || [],
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        }));
    } catch (error) {
        console.error("Error fetching instructor groups:", error);
        return [];
    }
}

/**
 * Get all instructor groups where user is a member (in instructors array)
 */
export async function getInstructorGroupsForInstructor(instructorId: string | number): Promise<InstructorGroup[]> {
    try {
        const response = await strapiPublic.get(
            `/api/instructor-groups?filters[instructors][id][$eq]=${instructorId}&populate=*`
        );
        
        return (response.data?.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name || '',
            owner: item.owner?.id || item.owner || null,
            instructors: item.instructors || [],
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        }));
    } catch (error) {
        console.error("Error fetching instructor groups for instructor:", error);
        return [];
    }
}

/**
 * Get a single instructor group by ID
 * Strapi v5: Handles both numeric ID and documentId
 */
export async function getInstructorGroup(groupId: string | number): Promise<InstructorGroup | null> {
    try {
        // Strapi v5: Direct lookup works for documentId (string), but numeric IDs require filtering
        const isNumericId = typeof groupId === 'number' || (typeof groupId === 'string' && /^\d+$/.test(groupId));
        
        let item: any = null;
        
        if (isNumericId) {
            // For numeric IDs, use filter query (Strapi v5 doesn't support numeric ID in URL path)
            const numericId = typeof groupId === 'string' ? Number(groupId) : groupId;
            const response = await strapiPublic.get(
                `/api/instructor-groups?filters[id][$eq]=${numericId}&populate=*`
            );
            
            if (response.data?.data && response.data.data.length > 0) {
                item = response.data.data[0];
            }
        } else {
            // For documentId (string), use direct lookup
            const response = await strapiPublic.get(
                `/api/instructor-groups/${groupId}?populate=*`
            );
            item = response.data?.data;
        }
        
        if (!item) return null;
        
        return {
            id: item.id,
            documentId: item.documentId,
            name: item.name || '',
            owner: item.owner?.id || item.owner || null,
            instructors: item.instructors || [],
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        };
    } catch (error: any) {
        // If direct lookup fails with 404, try filter as fallback
        if (error.response?.status === 404 && typeof groupId === 'string') {
            try {
                const response = await strapiPublic.get(
                    `/api/instructor-groups?filters[documentId][$eq]=${groupId}&populate=*`
                );
                
                if (response.data?.data && response.data.data.length > 0) {
                    const item = response.data.data[0];
                    return {
                        id: item.id,
                        documentId: item.documentId,
                        name: item.name || '',
                        owner: item.owner?.id || item.owner || null,
                        instructors: item.instructors || [],
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt,
                        publishedAt: item.publishedAt,
                    };
                }
            } catch (filterError) {
                console.error("Error fetching instructor group with filter:", filterError);
            }
        }
        console.error("Error fetching instructor group:", error);
        return null;
    }
}

/**
 * Create a new instructor group
 */
export async function createInstructorGroup(
    name: string,
    ownerId: string | number
): Promise<InstructorGroup | null> {
    try {
        // Validate input
        if (!ownerId) {
            throw new Error("Owner ID is required");
        }
        
        // Get numeric owner ID
        // Since ownerId comes from authenticated user context, we can trust it
        let ownerNumericId: number;
        if (typeof ownerId === 'number') {
            ownerNumericId = ownerId;
        } else if (typeof ownerId === 'string') {
            // Convert string to number (user IDs are typically numeric)
            const numericId = Number(ownerId);
            if (isNaN(numericId) || numericId <= 0) {
                throw new Error(`Invalid owner ID format: "${ownerId}" (expected numeric)`);
            }
            ownerNumericId = numericId;
        } else {
            throw new Error(`Invalid owner ID type: ${typeof ownerId}, value: ${ownerId}`);
        }
        
        console.log(`Creating group "${name}" with owner ID: ${ownerNumericId}`);

        const response = await strapi.post('/api/instructor-groups', {
            data: {
                name,
                owner: ownerNumericId,
                instructors: [], // Start with empty instructors array
            }
        });

        const item = response.data?.data;
        if (!item) return null;

        // Publish the group
        try {
            await strapi.put(`/api/instructor-groups/${item.documentId || item.id}`, {
                data: {
                    publishedAt: new Date().toISOString(),
                }
            });
        } catch (publishErr) {
            console.warn("Could not publish group:", publishErr);
        }

        return {
            id: item.id,
            documentId: item.documentId,
            name: item.name || '',
            owner: item.owner?.id || item.owner || ownerNumericId,
            instructors: item.instructors || [],
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        };
    } catch (error: any) {
        console.error("Error creating instructor group:", error);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to create instructor group");
    }
}

/**
 * Update an instructor group
 */
export async function updateInstructorGroup(
    groupId: string | number,
    data: Partial<InstructorGroup>
): Promise<InstructorGroup | null> {
    try {
        const updateId = typeof groupId === 'string' ? groupId : groupId;
        
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.owner !== undefined) updateData.owner = typeof data.owner === 'number' ? data.owner : Number(data.owner);

        const response = await strapi.put(`/api/instructor-groups/${updateId}`, {
            data: updateData
        });

        const item = response.data?.data;
        if (!item) return null;

        return {
            id: item.id,
            documentId: item.documentId,
            name: item.name || '',
            owner: item.owner?.id || item.owner || null,
            instructors: item.instructors || [],
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        };
    } catch (error: any) {
        console.error("Error updating instructor group:", error);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to update instructor group");
    }
}

/**
 * Add multiple instructors to group (batch operation)
 */
export async function addInstructorsToGroup(
    groupId: string | number,
    instructorIds: (string | number)[]
): Promise<boolean> {
    try {
        if (!instructorIds || instructorIds.length === 0) {
            return true; // Nothing to add
        }

        // Get current group data
        const group = await getInstructorGroup(groupId);
        if (!group) {
            throw new Error("Group not found");
        }

        // Get numeric instructor IDs
        const instructorNumericIds: number[] = [];
        for (const instructorId of instructorIds) {
            let instructorNumericId: number;
            if (typeof instructorId === 'number') {
                instructorNumericId = instructorId;
            } else {
                // Try to get numeric ID from documentId
                const instructorResponse = await strapiPublic.get(`/api/instructors?filters[documentId][$eq]=${instructorId}&fields[0]=id`);
                if (instructorResponse.data?.data?.length > 0) {
                    instructorNumericId = instructorResponse.data.data[0].id;
                } else {
                    // Try numeric ID filter
                    const numericId = Number(instructorId);
                    if (!isNaN(numericId) && numericId > 0) {
                        const numericResponse = await strapiPublic.get(`/api/instructors?filters[id][$eq]=${numericId}&fields[0]=id`);
                        if (numericResponse.data?.data?.length > 0) {
                            instructorNumericId = numericId;
                        } else {
                            console.warn(`Instructor not found: ${instructorId}`);
                            continue; // Skip invalid instructor IDs
                        }
                    } else {
                        console.warn(`Invalid instructor ID: ${instructorId}`);
                        continue;
                    }
                }
            }
            instructorNumericIds.push(instructorNumericId);
        }

        if (instructorNumericIds.length === 0) {
            throw new Error("No valid instructor IDs provided");
        }

        // Get current instructors array
        const currentInstructors = Array.isArray(group.instructors)
            ? group.instructors.map((inst: any) => Number(inst.id || inst)).filter((id: any) => !isNaN(id) && id > 0)
            : [];

        // Filter out instructors that are already in the group
        const newInstructors = instructorNumericIds.filter(id => !currentInstructors.includes(id));

        if (newInstructors.length === 0) {
            console.log("All instructors are already in the group");
            return true;
        }

        // Add all new instructors to array
        const updatedInstructors = [...currentInstructors, ...newInstructors];

        const updateId = group.documentId || group.id;
        await strapi.put(`/api/instructor-groups/${updateId}`, {
            data: {
                instructors: updatedInstructors
            }
        });

        console.log(`Added ${newInstructors.length} instructor(s) to group ${updateId}`);
        return true;
    } catch (error: any) {
        console.error("Error adding instructors to group:", error);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to add instructors to group");
    }
}

/**
 * Add instructor to group (when invitation is accepted)
 * Single instructor version - uses batch function internally
 */
export async function addInstructorToGroup(
    groupId: string | number,
    instructorId: string | number
): Promise<boolean> {
    return addInstructorsToGroup(groupId, [instructorId]);
}

/**
 * Remove instructor from group
 */
export async function removeInstructorFromGroup(
    groupId: string | number,
    instructorId: string | number
): Promise<boolean> {
    try {
        const group = await getInstructorGroup(groupId);
        if (!group) {
            throw new Error("Group not found");
        }

        // Get numeric instructor ID
        let instructorNumericId: number;
        if (typeof instructorId === 'number') {
            instructorNumericId = instructorId;
        } else {
            const instructorResponse = await strapiPublic.get(`/api/instructors?filters[documentId][$eq]=${instructorId}&fields[0]=id`);
            if (instructorResponse.data?.data?.length > 0) {
                instructorNumericId = instructorResponse.data.data[0].id;
            } else {
                throw new Error("Instructor not found");
            }
        }

        // Get current instructors array
        const currentInstructors = Array.isArray(group.instructors)
            ? group.instructors.map((inst: any) => Number(inst.id || inst)).filter((id: any) => !isNaN(id) && id > 0)
            : [];

        // Remove instructor from array
        const updatedInstructors = currentInstructors.filter(id => id !== instructorNumericId);

        const updateId = group.documentId || group.id;
        await strapi.put(`/api/instructor-groups/${updateId}`, {
            data: {
                instructors: updatedInstructors
            }
        });

        return true;
    } catch (error: any) {
        console.error("Error removing instructor from group:", error);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to remove instructor from group");
    }
}

/**
 * Delete an instructor group
 */
export async function deleteInstructorGroup(groupId: string | number): Promise<boolean> {
    try {
        const group = await getInstructorGroup(groupId);
        if (!group) {
            throw new Error("Group not found");
        }

        const deleteId = group.documentId || group.id;
        await strapi.delete(`/api/instructor-groups/${deleteId}`);
        return true;
    } catch (error: any) {
        console.error("Error deleting instructor group:", error);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to delete instructor group");
    }
}

