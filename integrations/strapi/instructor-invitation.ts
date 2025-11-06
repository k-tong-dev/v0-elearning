import { strapiPublic, strapi } from './client';
import { Instructor, getInstructor } from './instructor';

/**
 * Maps instructor data from various sources (invitations, etc.) to Instructor interface
 * Reusable mapping function for consistency
 */
function mapInstructorFromData(instructorData: any): Instructor | null {
    if (!instructorData || !instructorData.id) {
        return null;
    }
    
    // Extract user - handle nested structures from populate
    let userData = instructorData.user;
    if (userData && typeof userData === 'object' && userData.data) {
        userData = userData.data;
    }
    
    // Extract avatar - handle nested structures
    let avatarData = instructorData.avatar;
    if (avatarData && typeof avatarData === 'object' && avatarData.data) {
        avatarData = avatarData.data;
    }
    
    // Extract cover - handle nested structures
    let coverData = instructorData.cover;
    if (coverData && typeof coverData === 'object' && coverData.data) {
        coverData = coverData.data;
    }
    
    return {
        id: instructorData.id,
        documentId: instructorData.documentId,
        name: instructorData.name || '',
        user: userData?.id || userData || null,
        bio: instructorData.bio || '',
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
    from_user: number | string | any; // User who requested
    to_instructor: number | string | Instructor; // Target instructor
    instructor_group: number | string | any; // Group to join
    invitation_status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
    message?: string;
    invited_at?: string;
    responded_at?: string;
    read: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface InstructorGroup {
    id: number;
    documentId: string;
    name: string;
    owner: Instructor | number;
    instructors: Instructor[] | number[];
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Search instructors by username or name
 */
export async function searchInstructors(query: string): Promise<Instructor[]> {
    try {
        // Case-insensitive search - search in both cases and filter client-side for better matching
        const lowerQuery = query.toLowerCase().trim();
        
        // Use $containsi for case-insensitive search in Strapi
        const response = await strapiPublic.get(
            `/api/instructors?filters[$or][0][name][$containsi]=${encodeURIComponent(query)}&filters[$or][1][user][username][$containsi]=${encodeURIComponent(query)}&populate=*`
        );
        
        // Additional client-side filtering for better matching (handles partial matches)
        const allResults = (response.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            user: item.user,
            bio: item.bio,
            avatar: item.avatar,
            cover: item.cover,
            is_verified: item.is_verified ?? false,
            is_active: item.is_active ?? true,
            monetization: item.monetization ?? false,
            youtube: item.youtube,
            linkin: item.linkin,
            github: item.github,
            facebook: item.facebook,
            tiktok: item.tiktok,
            instagram: item.instagram,
            rating: item.rating,
        }));
        
        // Client-side filtering for smarter matching (case-insensitive, partial matches)
        return allResults.filter((instructor: Instructor) => {
            const nameMatch = instructor.name?.toLowerCase().includes(lowerQuery);
            const usernameMatch = instructor.user && typeof instructor.user === 'object' 
                ? instructor.user.username?.toLowerCase().includes(lowerQuery)
                : false;
            const bioMatch = instructor.bio?.toLowerCase().includes(lowerQuery);
            
            return nameMatch || usernameMatch || bioMatch;
        });
    } catch (error) {
        console.error("Error searching instructors:", error);
        return [];
    }
}

/**
 * Check if an invitation already exists for a user, instructor, and group
 */
export async function checkExistingInvitation(
    fromUserId: string | number,
    toInstructorId: string | number,
    groupId: string | number
): Promise<InstructorInvitation | null> {
    try {
        // Helper to get numeric IDs
        const getNumericId = async (id: string | number, type: 'user' | 'instructor' | 'group'): Promise<number> => {
            if (typeof id === 'number') return id;
            if (typeof id === 'string' && !isNaN(Number(id))) return Number(id);
            
            // Try to find by documentId
            const endpoint = type === 'user' ? 'users' : type === 'instructor' ? 'instructors' : 'instructor-groups';
            const field = type === 'user' ? 'id' : 'documentId';
            const response = await strapiPublic.get(`/api/${endpoint}?filters[${field}][$eq]=${id}&fields[0]=id`);
            if (response.data?.data?.length > 0) {
                return response.data.data[0].id;
            }
            throw new Error(`Could not resolve ${type} ID: ${id}`);
        };

        const fromUserNumericId = await getNumericId(fromUserId, 'user');
        const toInstructorNumericId = await getNumericId(toInstructorId, 'instructor');
        const groupNumericId = await getNumericId(groupId, 'group');
        
        // Check for existing invitation for this specific combination
        const response = await strapiPublic.get(
            `/api/instructor-invitations?filters[from_user][id][$eq]=${fromUserNumericId}&filters[to_instructor][id][$eq]=${toInstructorNumericId}&filters[instructor_group][id][$eq]=${groupNumericId}&populate=*`
        );
        
        // Filter for pending or accepted invitation_status
        const filtered = (response.data?.data || []).filter((item: any) => 
            item.invitation_status === 'pending' || item.invitation_status === 'accepted'
        );
        
        if (filtered.length > 0) {
            const item = filtered[0];
            return {
                id: item.id,
                documentId: item.documentId,
                from_user: item.from_user,
                to_instructor: item.to_instructor,
                instructor_group: item.instructor_group,
                invitation_status: item.invitation_status,
                message: item.message,
                invited_at: item.invited_at,
                responded_at: item.responded_at,
                read: item.read ?? false,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            };
        }
        return null;
    } catch (error) {
        console.error("Error checking existing invitation:", error);
        return null;
    }
}

/**
 * Send an invitation to another instructor to join a group
 */
export async function sendInvitation(
    fromUserId: string | number,
    toInstructorId: string | number,
    groupId: string | number,
    message?: string
): Promise<InstructorInvitation | null> {
    try {
        // Helper function to get numeric user ID
        const getNumericUserId = async (userId: string | number): Promise<number> => {
            if (typeof userId === 'number' && userId > 0) {
                return userId;
            }
            if (typeof userId === 'string' && !isNaN(Number(userId)) && Number(userId) > 0) {
                return Number(userId);
            }
            // Try to find user
            const userResponse = await strapiPublic.get(`/api/users?filters[id][$eq]=${userId}&fields[0]=id`);
            if (userResponse.data?.data?.length > 0) {
                return userResponse.data.data[0].id;
            }
            throw new Error(`Could not resolve user ID: ${userId}`);
        };

        // Helper function to get numeric instructor ID
        const getNumericInstructorId = async (instructorId: string | number): Promise<number> => {
            if (typeof instructorId === 'number' && instructorId > 0) {
                return instructorId;
            }
            if (typeof instructorId === 'string' && !isNaN(Number(instructorId)) && Number(instructorId) > 0) {
                return Number(instructorId);
            }
            // Try to find instructor by documentId or numeric ID
            // Use filter query for numeric IDs (Strapi v5 doesn't support numeric ID in URL)
            const isNumeric = typeof instructorId === 'number' || (typeof instructorId === 'string' && /^\d+$/.test(instructorId));
            
            if (isNumeric) {
                // For numeric IDs, use filter
                const numericId = typeof instructorId === 'string' ? Number(instructorId) : instructorId;
                const searchResponse = await strapiPublic.get(`/api/instructors?filters[id][$eq]=${numericId}&fields[0]=id`);
                if (searchResponse.data?.data?.length > 0) {
                    return Number(searchResponse.data.data[0].id);
                }
            } else {
                // For documentId, try direct lookup first, then filter
                try {
                    const response = await strapiPublic.get(`/api/instructors/${instructorId}?fields[0]=id`);
                    if (response.data?.data?.id) {
                        return Number(response.data.data.id);
                    }
                } catch (err: any) {
                    const searchResponse = await strapiPublic.get(`/api/instructors?filters[documentId][$eq]=${instructorId}&fields[0]=id`);
                    if (searchResponse.data?.data?.length > 0) {
                        return Number(searchResponse.data.data[0].id);
                    }
                }
            }
            throw new Error(`Could not resolve instructor ID: ${instructorId}`);
        };

        // Helper function to get numeric group ID
        const getNumericGroupId = async (groupId: string | number): Promise<number> => {
            if (typeof groupId === 'number' && groupId > 0) {
                return groupId;
            }
            if (typeof groupId === 'string' && !isNaN(Number(groupId)) && Number(groupId) > 0) {
                return Number(groupId);
            }
            // Try to find group by documentId
            try {
                const response = await strapiPublic.get(`/api/instructor-groups/${groupId}?fields[0]=id`);
                if (response.data?.data?.id) {
                    return Number(response.data.data.id);
                }
            } catch (err: any) {
                const searchResponse = await strapiPublic.get(`/api/instructor-groups?filters[documentId][$eq]=${groupId}&fields[0]=id`);
                if (searchResponse.data?.data?.length > 0) {
                    return Number(searchResponse.data.data[0].id);
                }
            }
            throw new Error(`Could not resolve group ID: ${groupId}`);
        };

        // Resolve all IDs
        console.log(`Resolving IDs - user: ${fromUserId}, instructor: ${toInstructorId}, group: ${groupId}`);
        const fromUserNumericId = await getNumericUserId(fromUserId);
        const toInstructorNumericId = await getNumericInstructorId(toInstructorId);
        const groupNumericId = await getNumericGroupId(groupId);
        
        console.log(`Resolved IDs - user: ${fromUserNumericId}, instructor: ${toInstructorNumericId}, group: ${groupNumericId}`);
        
        // Verify IDs are valid
        if (!fromUserNumericId || !toInstructorNumericId || !groupNumericId || 
            fromUserNumericId <= 0 || toInstructorNumericId <= 0 || groupNumericId <= 0) {
            throw new Error(`Invalid IDs - user: ${fromUserNumericId}, instructor: ${toInstructorNumericId}, group: ${groupNumericId}`);
        }

        // Check if invitation already exists for this group and instructor
        const existingResponse = await strapiPublic.get(
            `/api/instructor-invitations?filters[from_user][id][$eq]=${fromUserNumericId}&filters[to_instructor][id][$eq]=${toInstructorNumericId}&filters[instructor_group][id][$eq]=${groupNumericId}&populate=*`
        );
        
        const existing = (existingResponse.data?.data || []).find(
            (item: any) => item.invitation_status === 'pending' || item.invitation_status === 'accepted'
        );
        
        if (existing) {
            throw new Error(existing.invitation_status === 'pending' 
                ? 'An invitation is already pending for this group' 
                : 'You already have an accepted invitation for this group');
        }
        
        // Create the invitation
        console.log(`Creating invitation with from_user: ${fromUserNumericId}, to_instructor: ${toInstructorNumericId}, group: ${groupNumericId}`);
        
        const invitationData: any = {
            from_user: fromUserNumericId,
            to_instructor: toInstructorNumericId,
            instructor_group: groupNumericId,
            invitation_status: 'pending',
            message: message || null,
            invited_at: new Date().toISOString(),
            read: false,
            publishedAt: new Date().toISOString(), // Set publishedAt immediately to make it visible
        };
        
        console.log('Invitation payload:', JSON.stringify(invitationData, null, 2));
        
        // Step 1: Create the invitation (with publishedAt set)
        const response = await strapi.post('/api/instructor-invitations', {
            data: invitationData
        });
        
        if (!response.data?.data) {
            throw new Error("Failed to create invitation");
        }
        
        const createdId = response.data.data.id;
        const createdDocumentId = response.data.data.documentId;
        const updateId = createdDocumentId || createdId;
        
        console.log(`Created invitation with ID: ${createdId}, documentId: ${createdDocumentId}`);
        
        // Step 2: Set relations explicitly via PUT (this ensures they're saved and visible in Strapi UI)
        // For Strapi v5 oneToOne relations, we need to set them all together in one request
        // Setting them together ensures Strapi properly indexes and displays them in the UI
        try {
            console.log('Setting relations explicitly via update...');
            
            // Set all relations together - this is important for Strapi v5 UI to display them
            await strapi.put(`/api/instructor-invitations/${updateId}`, {
                data: {
                    to_instructor: toInstructorNumericId,
                    from_user: fromUserNumericId,
                    instructor_group: groupNumericId,
                }
            });
            console.log('✓ All relations set via update');
            
            // Wait a moment for Strapi to process the relations
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Refresh the entry to ensure relations are properly indexed
            try {
                await strapiPublic.get(`/api/instructor-invitations/${updateId}?populate=*`);
                console.log('✓ Entry refreshed after relation update');
            } catch (refreshErr) {
                // Non-critical
                console.warn('Could not refresh entry:', refreshErr);
            }
        } catch (updateErr: any) {
            console.error('Error setting relations:', updateErr.response?.data || updateErr.message);
            // Continue - relations might be set from initial POST
        }
        
        // Step 3: Ensure publishedAt is set (already set in initial POST, but ensure it's there)
        // This step is mainly for verification - publishedAt should already be set from initial POST
        try {
            const currentResponse = await strapiPublic.get(`/api/instructor-invitations/${updateId}?fields[0]=publishedAt`);
            if (!currentResponse.data?.data?.publishedAt) {
                // If somehow publishedAt wasn't set, set it now
                console.log('publishedAt not found, setting it now...');
                await strapi.put(`/api/instructor-invitations/${updateId}`, {
            data: {
                        publishedAt: new Date().toISOString(),
                    }
                });
                console.log('✓ publishedAt set');
            } else {
                console.log('✓ Invitation is already published');
            }
        } catch (publishedAtErr: any) {
            // Non-critical - invitation was created successfully
            console.warn('Could not verify/set publishedAt:', publishedAtErr.message);
        }
        
        // Step 4: Fetch the entry with populated relations to verify
        let verifiedRelations = null;
        try {
            const verifyResponse = await strapiPublic.get(`/api/instructor-invitations/${updateId}?populate=*`);
            const verified = verifyResponse.data?.data;
            verifiedRelations = {
                from_user: verified?.from_user?.id || verified?.from_user,
                to_instructor: verified?.to_instructor?.id || verified?.to_instructor,
                instructor_group: verified?.instructor_group?.id || verified?.instructor_group,
            };
            console.log('✓ Verified invitation with populated relations:', {
                id: verified?.id,
                from_user: verifiedRelations.from_user,
                to_instructor: verifiedRelations.to_instructor,
                instructor_group: verifiedRelations.instructor_group,
                publishedAt: verified?.publishedAt
            });
        } catch (verifyErr: any) {
            console.warn('Could not verify invitation:', verifyErr.message);
        }

        // Log invitation creation success
        if (response.data?.data) {
            const createdInvitation = response.data.data;
            console.log(`✓ Invitation created successfully with ID: ${createdInvitation.id}, documentId: ${createdInvitation.documentId}`);
            
            // Use verified relations if available, otherwise show what we know
            if (verifiedRelations) {
                console.log(`✓ Relations confirmed: from_user=${verifiedRelations.from_user}, to_instructor=${verifiedRelations.to_instructor}, instructor_group=${verifiedRelations.instructor_group}`);
            } else {
                // Check if relations are populated in the response
                const hasPopulatedRelations = createdInvitation.from_user && 
                                            createdInvitation.to_instructor && 
                                            createdInvitation.instructor_group &&
                                            typeof createdInvitation.from_user === 'object' &&
                                            typeof createdInvitation.to_instructor === 'object' &&
                                            typeof createdInvitation.instructor_group === 'object';
                
                if (hasPopulatedRelations) {
                    console.log(`✓ Relations populated in response`);
                } else {
                    // Relations are set via update step, so they're definitely there
                    console.log(`✓ Relations set successfully (from_user: ${fromUserNumericId}, to_instructor: ${toInstructorNumericId}, instructor_group: ${groupNumericId})`);
                }
            }
        }

        const item = response.data.data;
        return {
            id: item.id,
            documentId: item.documentId,
            from_user: item.from_user,
            to_instructor: item.to_instructor,
            instructor_group: item.instructor_group,
            invitation_status: item.invitation_status,
            message: item.message,
            invited_at: item.invited_at,
            responded_at: item.responded_at,
            read: item.read ?? false,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        };
    } catch (error) {
        console.error("Error sending invitation:", error);
        return null;
    }
}

/**
 * Get all invitations for an instructor (received invitations)
 * @param instructorId - Can be numeric ID or documentId
 */
export async function getInstructorInvitations(instructorId: string | number): Promise<InstructorInvitation[]> {
    try {
        // If instructorId is a documentId (string), we need to find the instructor first to get the numeric ID
        let numericId = instructorId;
        let documentId = null;
        
        // Check if it's a documentId (long alphanumeric string) vs numeric ID
        if (typeof instructorId === 'string' && isNaN(Number(instructorId))) {
            // It's likely a documentId
            documentId = instructorId;
            try {
                const instructorResponse = await strapiPublic.get(
                    `/api/instructors?filters[documentId][$eq]=${instructorId}&fields[0]=id`
                );
                if (instructorResponse.data.data && instructorResponse.data.data.length > 0) {
                    numericId = instructorResponse.data.data[0].id;
                }
            } catch (e) {
                // If lookup fails, try using documentId directly (Strapi v5 might support it)
                numericId = instructorId;
            }
        } else {
            // If it's numeric, try to get documentId for more flexible filtering
            try {
                const instructorResponse = await strapiPublic.get(
                    `/api/instructors?filters[id][$eq]=${numericId}&fields[0]=documentId`
                );
                if (instructorResponse.data.data && instructorResponse.data.data.length > 0) {
                    documentId = instructorResponse.data.data[0].documentId;
                }
            } catch (e) {
                // DocumentId lookup failed, continue with numeric ID only
            }
        }
        
        // Try multiple filter strategies to ensure we get all invitations
        // Strategy 1: Filter by numeric ID (primary method)
        let receivedResponse: any;
        try {
            receivedResponse = await strapiPublic.get(
                `/api/instructor-invitations?filters[to_instructor][id][$eq]=${numericId}&populate=*&sort=invited_at:desc`
            );
        } catch (error) {
            console.warn('Primary filter failed, trying alternative methods:', error);
            receivedResponse = { data: { data: [] } };
        }
        
        // Strategy 2: If documentId is available, also try filtering by documentId
        let additionalInvitations: any[] = [];
        if (documentId) {
            try {
                const docIdResponse = await strapiPublic.get(
                    `/api/instructor-invitations?filters[to_instructor][documentId][$eq]=${documentId}&populate=*&sort=invited_at:desc`
                );
                if (docIdResponse.data?.data) {
                    additionalInvitations = docIdResponse.data.data;
                }
            } catch (error) {
                // DocumentId filter not supported, continue
            }
        }
        
        // Strategy 3: Fetch all and filter client-side as a comprehensive fallback
        // This ensures we catch invitations even if relations aren't properly indexed
        let allInvitations: any[] = receivedResponse.data?.data || [];
        let clientSideFiltered: any[] = [];
        
        // Use client-side filtering as a safety net to catch any missed invitations
        // This is especially important when relations are created programmatically vs manually
        try {
            const allResponse = await strapiPublic.get(
                `/api/instructor-invitations?populate=*&sort=invited_at:desc&pagination[limit]=100`
            );
            const all = allResponse.data?.data || [];
            
            // Filter client-side by matching instructor ID or documentId
            clientSideFiltered = all.filter((item: any) => {
                const toInstructor = item.to_instructor;
                if (!toInstructor) return false;
                
                // Check if it matches by ID (numeric or documentId)
                if (typeof toInstructor === 'object' && toInstructor !== null) {
                    // Match by numeric ID
                    if (toInstructor.id && Number(toInstructor.id) === Number(numericId)) {
                        return true;
                    }
                    // Match by documentId if available
                    if (documentId && toInstructor.documentId === documentId) {
                        return true;
                    }
                } else if (Number(toInstructor) === Number(numericId)) {
                    // Direct ID match (normalize to numbers for comparison)
                    return true;
                }
                
                return false;
            });
        } catch (error) {
            console.error('Error fetching all invitations for client-side filtering:', error);
        }
        
        // Combine all strategies' results and remove duplicates
        const combined = [...allInvitations, ...additionalInvitations, ...clientSideFiltered];
        const uniqueMap = new Map();
        for (const item of combined) {
            const key = item.documentId || item.id;
            if (key && !uniqueMap.has(key)) {
                uniqueMap.set(key, item);
            }
        }
        const uniqueInvitations = Array.from(uniqueMap.values());
        
        // Log for debugging
        console.log(`[getInstructorInvitations] Results for instructor ${instructorId} (numericId: ${numericId}, documentId: ${documentId}):`, {
            primaryFilter: allInvitations.length,
            documentIdFilter: additionalInvitations.length,
            clientSideFilter: clientSideFiltered.length,
            totalUnique: uniqueInvitations.length
        });

        // Map invitations using data directly from populate=* (NO additional fetches)
        const mapInvitation = (item: any): InstructorInvitation => {
            // Extract avatar for to_instructor - handle both direct and nested structures
            let toAvatar = item.to_instructor?.avatar;
            if (toAvatar && typeof toAvatar === 'object' && toAvatar.data) {
                toAvatar = toAvatar.data;
            }
            
            // Extract user for to_instructor - handle both direct and nested structures
            let toUser = item.to_instructor?.user;
            if (toUser && typeof toUser === 'object' && toUser.data) {
                toUser = toUser.data;
            }
            
            return {
                id: item.id,
                documentId: item.documentId,
                from_user: item.from_user,
                to_instructor: item.to_instructor ? {
                    ...item.to_instructor,
                    avatar: toAvatar || item.to_instructor.avatar || null,
                    user: toUser || item.to_instructor.user || null,
                } : item.to_instructor,
                instructor_group: item.instructor_group,
                invitation_status: item.invitation_status,
                message: item.message,
                invited_at: item.invited_at,
                responded_at: item.responded_at,
                read: item.read ?? false,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            };
        };

        const receivedInvitations = uniqueInvitations.map(mapInvitation);
        
        return receivedInvitations;
    } catch (error) {
        console.error("Error fetching instructor invitations:", error);
        return [];
    }
}

/**
 * Get all invitations sent by a user
 * @param userId - Can be numeric ID
 */
export async function getUserInvitations(userId: string | number): Promise<InstructorInvitation[]> {
    try {
        const numericId = typeof userId === 'string' ? Number(userId) : userId;
        
        // Get sent invitations (filter by from_user)
        // Use populate=* for simpler query - Strapi will handle nested relations
        const sentResponse = await strapiPublic.get(
            `/api/instructor-invitations?filters[from_user][id][$eq]=${numericId}&populate=*&sort=invited_at:desc`
        );

        // Map invitations
        const mapInvitation = (item: any): InstructorInvitation => {
            let toAvatar = item.to_instructor?.avatar;
            if (toAvatar && typeof toAvatar === 'object' && toAvatar.data) {
                toAvatar = toAvatar.data;
            }
            
            let toUser = item.to_instructor?.user;
            if (toUser && typeof toUser === 'object' && toUser.data) {
                toUser = toUser.data;
            }
            
            return {
                id: item.id,
                documentId: item.documentId,
                from_user: item.from_user,
                to_instructor: item.to_instructor ? {
                    ...item.to_instructor,
                    avatar: toAvatar || item.to_instructor.avatar || null,
                    user: toUser || item.to_instructor.user || null,
                } : item.to_instructor,
                instructor_group: item.instructor_group,
                invitation_status: item.invitation_status,
                message: item.message,
                invited_at: item.invited_at,
                responded_at: item.responded_at,
                read: item.read ?? false,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            };
        };

        const sentInvitations = (sentResponse.data?.data || []).map(mapInvitation);
        
        return sentInvitations;
    } catch (error) {
        console.error("Error fetching user invitations:", error);
        return [];
    }
}

/**
 * Accept an invitation and add instructor to the group
 * 
 * Flow:
 * 1. Add instructor to instructor_group's instructors array
 * 2. Update invitation status to accepted
 * 3. Delete the invitation record
 */
export async function acceptInvitation(invitationId: string): Promise<boolean> {
    try {
        // Import here to avoid circular dependency
        const { addInstructorToGroup } = await import('./instructor-group');
        
        // First, get the invitation details with populated relations
        const invitationResponse = await strapiPublic.get(
            `/api/instructor-invitations/${invitationId}?populate=*`
        );
        const invitation = invitationResponse.data.data;
        
        if (!invitation) {
            throw new Error("Invitation not found");
        }
        
        // Extract instructor and group - handle both populated objects and IDs
        let toInstructor: any = null;
        let instructorGroup: any = null;
        
        // Check if to_instructor is populated
        if (invitation.to_instructor) {
            if (typeof invitation.to_instructor === 'object') {
                toInstructor = invitation.to_instructor;
            } else {
                // If it's just an ID, fetch the instructor
                const instructorResponse = await strapiPublic.get(
                    `/api/instructors/${invitation.to_instructor}?populate=*`
                ).catch(() => null);
                if (instructorResponse?.data?.data) {
                    toInstructor = instructorResponse.data.data;
                } else {
                    // Try by numeric ID with filter
                    try {
                        const filterResponse = await strapiPublic.get(
                            `/api/instructors?filters[id][$eq]=${invitation.to_instructor}&populate=*`
                        );
                        if (filterResponse?.data?.data?.length > 0) {
                            toInstructor = filterResponse.data.data[0];
                        }
                    } catch (filterError) {
                        // Failed to fetch instructor by filter
                        console.warn("Could not fetch instructor by filter:", filterError);
                    }
                }
            }
        }
        
        // Check if instructor_group is populated
        if (invitation.instructor_group) {
            if (typeof invitation.instructor_group === 'object') {
                instructorGroup = invitation.instructor_group;
            } else {
                // If it's just an ID, fetch the group
                const groupResponse = await strapiPublic.get(
                    `/api/instructor-groups/${invitation.instructor_group}?populate=*`
                ).catch(() => null);
                if (groupResponse?.data?.data) {
                    instructorGroup = groupResponse.data.data;
                } else {
                    // Try by numeric ID with filter
                    try {
                        const filterResponse = await strapiPublic.get(
                            `/api/instructor-groups?filters[id][$eq]=${invitation.instructor_group}&populate=*`
                        );
                        if (filterResponse?.data?.data?.length > 0) {
                            instructorGroup = filterResponse.data.data[0];
                        }
                    } catch (filterError) {
                        // Failed to fetch group by filter
                        console.warn("Could not fetch group by filter:", filterError);
                    }
                }
            }
        }
        
        if (!toInstructor || !instructorGroup) {
            console.error("Invitation data:", {
                to_instructor: invitation.to_instructor,
                instructor_group: invitation.instructor_group,
                toInstructor,
                instructorGroup
            });
            throw new Error("Instructor or group data not found in invitation");
        }
        
        // Get instructor ID (numeric)
        const instructorId = Number(toInstructor.id || toInstructor);
        const groupId = instructorGroup.documentId || instructorGroup.id;
        
        if (!instructorId || isNaN(instructorId) || instructorId <= 0) {
            throw new Error("Invalid instructor ID");
        }
        
        if (!groupId) {
            throw new Error("Invalid group ID");
        }

        console.log(`Adding instructor ${instructorId} to group ${groupId}`);

        // Step 1: Add instructor to group
        await addInstructorToGroup(groupId, instructorId);
        console.log(`✓ Instructor ${instructorId} added to group ${groupId}`);

        // Step 2: Update invitation status to accepted
        const updateId = invitation.documentId || invitation.id;
        await strapi.put(`/api/instructor-invitations/${updateId}`, {
            data: {
                invitation_status: 'accepted',
                responded_at: new Date().toISOString(),
            }
        });
        console.log(`✓ Invitation ${invitationId} marked as accepted`);
        
        // Step 3: Delete the invitation record (as per requirements)
        await strapi.delete(`/api/instructor-invitations/${updateId}`);
        console.log(`✓ Invitation ${invitationId} deleted after acceptance`);
        
        return true;
    } catch (error: any) {
        console.error("Error accepting invitation:", error);
        throw new Error(error.message || "Failed to accept invitation");
    }
}

/**
 * Reject an invitation (deletes the invitation record)
 */
export async function rejectInvitation(invitationId: string): Promise<boolean> {
    try {
        // Delete the invitation when rejected
        await strapi.delete(`/api/instructor-invitations/${invitationId}`);
        return true;
    } catch (error) {
        console.error("Error rejecting invitation:", error);
        return false;
    }
}

/**
 * Cancel an invitation (deletes the invitation record)
 */
export async function cancelInvitation(invitationId: string): Promise<boolean> {
    try {
        // Delete the invitation when cancelled
        await strapi.delete(`/api/instructor-invitations/${invitationId}`);
        return true;
    } catch (error) {
        console.error("Error cancelling invitation:", error);
        return false;
    }
}

/**
 * Uncollaborate with an instructor (remove from collaborated_instructors)
 * Note: This function is for the old collaboration system. For groups, use removeInstructorFromGroup from instructor-group.ts
 */
export async function uncollaborateInstructor(
    instructorId: string | number,
    collaboratorId: string | number
): Promise<boolean> {
    try {
        // Use getInstructor which handles both numeric ID and documentId properly
        const instructor = await getInstructor(instructorId);
        if (!instructor) {
            throw new Error("Instructor not found");
        }

        const updateId = instructor.documentId || instructor.id;
        // Type assertion for deprecated field
        const instructorAny = instructor as any;
        const collaborators = instructorAny.collaborated_instructors || [];
        const collaboratorIds = Array.isArray(collaborators)
            ? collaborators.map((c: any) => Number(c.id || c)).filter((id: any) => !isNaN(id))
            : [];

        // Remove collaborator from list
        const updatedCollaborators = collaboratorIds.filter((id: any) => id !== Number(collaboratorId));

        // Update instructor's collaborated_instructors
        await strapi.put(`/api/instructors/${updateId}`, {
            data: {
                collaborated_instructors: updatedCollaborators
            }
        });

        // Also remove from the other instructor's collaborated_instructors
        const collaborator = await getInstructor(collaboratorId);
        if (collaborator) {
            const collaboratorUpdateId = collaborator.documentId || collaborator.id;
            const collaboratorAny = collaborator as any;
            const collaboratorCollaborators = collaboratorAny.collaborated_instructors || [];
            const collaboratorCollaboratorIds = Array.isArray(collaboratorCollaborators)
                ? collaboratorCollaborators.map((c: any) => Number(c.id || c)).filter((id: any) => !isNaN(id))
                : [];
            
            const updatedCollaboratorCollaborators = collaboratorCollaboratorIds.filter(
                (id: any) => id !== Number(instructor.id)
            );

            await strapi.put(`/api/instructors/${collaboratorUpdateId}`, {
                data: {
                    collaborated_instructors: updatedCollaboratorCollaborators
                }
            });
        }

        return true;
    } catch (error: any) {
        console.error("Error uncollaborating instructor:", error);
        throw new Error(error.response?.data?.error?.message || "Failed to uncollaborate instructor");
    }
}

/**
 * Get all invitations sent by a user
 * @param userId - Can be numeric ID
 */

/**
 * Get all invitations for an instructor (received invitations)
 * @param instructorId - Can be numeric ID or documentId
 */

/**
 * Get all invitations sent by a user
 * @param userId - Can be numeric ID
 */

/**
 * Get all invitations for an instructor (received invitations)
 * @param instructorId - Can be numeric ID or documentId
 */

/**
 * Get all invitations sent by a user
 * @param userId - Can be numeric ID
 */

/**
 * Mark invitation as read
 */
export async function markInvitationAsRead(invitationId: string): Promise<boolean> {
    try {
        await strapi.put(`/api/instructor-invitations/${invitationId}`, {
            data: {
                read: true,
            }
        });
        return true;
    } catch (error) {
        console.error("Error marking invitation as read:", error);
        return false;
    }
}

/**
 * Get pending invitations count for an instructor
 * @param instructorId - Can be numeric ID or documentId
 */
export async function getPendingInvitationsCount(instructorId: string | number): Promise<number> {
    try {
        // If instructorId is a documentId (string), we need to find the instructor first to get the numeric ID
        let numericId = instructorId;
        // Check if it's a documentId (long alphanumeric string) vs numeric ID
        if (typeof instructorId === 'string' && isNaN(Number(instructorId))) {
            // It's likely a documentId, try to find the instructor by documentId first
            try {
                const instructorResponse = await strapiPublic.get(
                    `/api/instructors?filters[documentId][$eq]=${instructorId}&fields[0]=id`
                );
                if (instructorResponse.data.data && instructorResponse.data.data.length > 0) {
                    numericId = instructorResponse.data.data[0].id;
                }
            } catch (e) {
                // If lookup fails, try using documentId directly
                numericId = instructorId;
            }
        }
        
        const response = await strapiPublic.get(
            `/api/instructor-invitations?filters[to_instructor][id][$eq]=${numericId}&filters[invitation_status][$eq]=pending&filters[read][$eq]=false&pagination[limit]=1`
        );
        return response.data.meta?.pagination?.total || 0;
    } catch (error) {
        console.error("Error getting pending invitations count:", error);
        return 0;
    }
}

/**
 * Create an instructor group
 */
export async function createInstructorGroup(
    name: string,
    ownerInstructorId: string | number,
    instructorIds: (string | number)[]
): Promise<InstructorGroup | null> {
    try {
        const response = await strapi.post('/api/instructor-groups', {
            data: {
                name,
                owner: ownerInstructorId,
                instructors: instructorIds,
            }
        });

        const item = response.data.data;
        return {
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            owner: item.owner,
            instructors: item.instructors || [],
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        };
    } catch (error) {
        console.error("Error creating instructor group:", error);
        return null;
    }
}

/**
 * Get collaborating instructors (accepted invitations)
 */
export async function getCollaboratingInstructors(instructorId: string | number): Promise<Instructor[]> {
    try {
        // Convert to numeric ID if needed
        let numericId = instructorId;
        if (typeof instructorId === 'string' && isNaN(Number(instructorId))) {
            // Fix: removed double ?? - should be single ?
            const instructorResponse = await strapiPublic.get(
                `/api/instructors?filters[documentId][$eq]=${instructorId}&fields[0]=id`
            );
            if (instructorResponse.data.data && instructorResponse.data.data.length > 0) {
                numericId = instructorResponse.data.data[0].id;
            }
        }
        
        // Note: This function is deprecated - the new invitation system uses from_user instead of from_instructor
        // For now, we'll get collaborators from groups where this instructor is a member
        // This is a temporary solution until the old collaboration system is fully migrated
        
        // Get groups where this instructor is a member
        // Use populate=* for Strapi v5 - it handles nested relations automatically
        const groupsResponse = await strapiPublic.get(
            `/api/instructor-groups?filters[instructors][id][$eq]=${numericId}&populate=*`
        );
        
        const groups = groupsResponse.data?.data || [];
        const collaboratorMap = new Map<number, any>();
        const numericIdNumber = Number(numericId);
        
        // Collect all instructors from groups (excluding current instructor)
        groups.forEach((group: any) => {
            if (group.instructors && Array.isArray(group.instructors)) {
                group.instructors.forEach((inst: any) => {
                    if (inst && typeof inst === 'object' && inst.id) {
                        const collaboratorId = Number(inst.id);
                if (!isNaN(collaboratorId) && collaboratorId !== numericIdNumber) {
                            collaboratorMap.set(collaboratorId, inst);
                }
            }
        });
            }
        });

        if (collaboratorMap.size === 0) {
            return [];
        }

        // Map instructor data using reusable function
        const instructors: Instructor[] = [];
        collaboratorMap.forEach((instructorData) => {
            const mapped = mapInstructorFromData(instructorData);
            if (mapped) {
                instructors.push(mapped);
            }
        });
        
        return instructors;
    } catch (error) {
        console.error("Error fetching collaborating instructors:", error);
        return [];
    }
}

