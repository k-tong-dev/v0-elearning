import { strapiPublic, strapi } from './client';

export interface CourseReviewer {
    id: number;
    documentId: string;
    user: number | string | any; // Can be ID or populated user object
    course_course: number | string;
    rating_stars: number;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string | null;
    isPublished?: boolean; // Flag to identify if review is published or draft
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

export async function getCourseReviewers(
    courseId?: string | number,
    includeDrafts: boolean = true
): Promise<CourseReviewer[]> {
    try {
        const params = new URLSearchParams();
        // Populate user relation with avatar - Strapi v5 format
        // Use array notation to populate user and nested avatar
        params.append('populate[0]', 'user');
        params.append('populate[1]', 'user.avatar');
        
        // Sort by creation date, newest first
        params.append('sort', 'createdAt:desc');
        
        // For authenticated requests, include draft entries if requested
        // In Strapi v5, authenticated requests can access drafts, but we need to explicitly request them
        // Public API only returns published entries (publishedAt is not null)
        if (includeDrafts) {
            // When using authenticated client, we can get both published and draft entries
            // No need to filter by publishedAt - authenticated client returns all
        } else {
            // Only get published reviews
            params.append('filters[publishedAt][$notNull]', 'true');
        }
        
        if (courseId) {
            const courseDocId = await resolveDocumentIdByNumericId('course-courses', courseId);
            if (courseDocId) {
                params.append('filters[course_course][documentId][$eq]', courseDocId);
            } else {
                // Fallback to numeric ID
                const numericId = typeof courseId === 'string' ? Number(courseId) : courseId;
                if (!isNaN(numericId)) {
                    params.append('filters[course_course][id][$eq]', numericId.toString());
                }
            }
        }

        // Try authenticated client first (for better data access including drafts), fallback to public
        let response;
        let usedAuthenticatedClient = false;
        try {
            response = await strapi.get(`/api/course-reviewers?${params.toString()}`);
            usedAuthenticatedClient = true;
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[getCourseReviewers] Using authenticated client, fetched ${response.data?.data?.length || 0} reviews`);
            }
        } catch (authError: any) {
            // Fallback to public client if authenticated fails
            // Public client only returns published entries, so add filter
            if (process.env.NODE_ENV !== 'production') {
                console.warn('[getCourseReviewers] Authenticated client failed, falling back to public:', authError?.message || authError);
            }
            if (!includeDrafts) {
                params.append('filters[publishedAt][$notNull]', 'true');
            }
            response = await strapiPublic.get(`/api/course-reviewers?${params.toString()}`);
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[getCourseReviewers] Using public client, fetched ${response.data?.data?.length || 0} reviews`);
            }
        }
        
        return (response.data.data || []).map((item: any) => {
            // Extract user data properly (handle both populated and non-populated)
            const userData = item.user?.data || item.user
            // Extract avatar - handle nested structure (user.avatar.data or user.avatar)
            // In Strapi v5, avatar can be: item.user.data.avatar.data or item.user.data.avatar
            const avatarData = userData?.avatar?.data || userData?.avatar?.data?.attributes || userData?.avatar?.attributes || userData?.avatar || null
            
            // Debug: Log avatar structure to understand what we're getting
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[getCourseReviewers] Review ${item.id} - User avatar structure:`, {
                    userId: userData?.id,
                    userName: userData?.name || userData?.username,
                    hasAvatar: !!userData?.avatar,
                    avatarType: typeof userData?.avatar,
                    avatarStructure: userData?.avatar ? Object.keys(userData.avatar) : null,
                    avatarData: avatarData ? (typeof avatarData === 'object' ? Object.keys(avatarData) : 'string') : null,
                });
            }
            
            const userInfo = typeof userData === 'object' && userData !== null
                ? {
                    id: userData.id,
                    documentId: userData.documentId,
                    name: userData.name || userData.username || 'Anonymous',
                    username: userData.username || userData.name || 'Anonymous',
                    avatar: avatarData, // Pass the full avatar object/data structure for ForumUserAvatar
                    email: userData.email || null,
                }
                : {
                    id: userData || null,
                    documentId: null,
                    name: 'Anonymous',
                    username: 'Anonymous',
                    avatar: null,
                    email: null,
                }
            
            // Determine if review is published (has publishedAt) or draft
            const isPublished = !!item.publishedAt;
            
            if (process.env.NODE_ENV !== 'production' && !isPublished) {
                console.log(`[getCourseReviewers] Found draft review: ID ${item.id}, User: ${userInfo.name}, Published: ${isPublished}`);
            }
            
            return {
                id: item.id,
                documentId: item.documentId,
                user: userInfo,
                course_course: item.course_course?.data?.id || item.course_course?.id || item.course_course,
                rating_stars: Number(item.rating_stars) || 0,
                description: item.description || '',
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                publishedAt: item.publishedAt,
                isPublished: isPublished, // Add flag to identify published vs draft
            };
        });
    } catch (error: any) {
        console.error("Error fetching course reviewers:", error?.response?.data || error?.message || error);
        return [];
    }
}

export async function getUserCourseReview(
    userId: string | number,
    courseId: string | number
): Promise<CourseReviewer | null> {
    try {
        const params = new URLSearchParams();
        // Populate user relation with avatar - Strapi v5 format
        params.append('populate[0]', 'user');
        params.append('populate[1]', 'user.avatar');
        
        // Resolve documentIds for proper relation filtering
        const userDocId = await resolveDocumentIdByNumericId('users', userId);
        const courseDocId = await resolveDocumentIdByNumericId('course-courses', courseId);
        
        if (userDocId) {
            params.append('filters[user][documentId][$eq]', userDocId);
        } else {
            const numericUserId = typeof userId === 'string' ? Number(userId) : userId;
            if (!isNaN(numericUserId)) {
                params.append('filters[user][id][$eq]', numericUserId.toString());
            }
        }
        
        if (courseDocId) {
            params.append('filters[course_course][documentId][$eq]', courseDocId);
        } else {
            const numericCourseId = typeof courseId === 'string' ? Number(courseId) : courseId;
            if (!isNaN(numericCourseId)) {
                params.append('filters[course_course][id][$eq]', numericCourseId.toString());
            }
        }

        const response = await strapi.get(`/api/course-reviewers?${params.toString()}`);
        const data = response.data.data;
        if (!data || data.length === 0) {
            return null;
        }
        
        const item = data[0];
        return {
            id: item.id,
            documentId: item.documentId,
            user: item.user?.data?.id || item.user?.id || item.user,
            course_course: item.course_course?.data?.id || item.course_course?.id || item.course_course,
            rating_stars: Number(item.rating_stars) || 0,
            description: item.description || '',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        };
    } catch (error: any) {
        console.error("Error fetching user course review:", error?.response?.data || error?.message || error);
        return null;
    }
}

export interface CreateCourseReviewInput {
    user: string | number;
    course_course: string | number;
    rating_stars: number;
    description?: string;
}

export async function createCourseReview(
    data: CreateCourseReviewInput
): Promise<CourseReviewer | null> {
    try {
        // Resolve documentIds for relations using Strapi v5 documentId connections
        // For users, try multiple approaches since users-permissions plugin might have different endpoints
        let userDocumentId: string | null = null;
        
        // Check if data.user is already a documentId (non-numeric string)
        if (typeof data.user === 'string' && !/^\d+$/.test(data.user)) {
            userDocumentId = data.user;
        } else {
            // First, try to get documentId from /api/users/me if we have an authenticated request
            try {
                const meResponse = await strapi.get('/api/users/me?fields[0]=documentId&fields[1]=id');
                if (meResponse.data?.documentId) {
                    const meId = meResponse.data.id;
                    const providedUserId = typeof data.user === 'string' ? Number(data.user) : data.user;
                    // Only use /me if the IDs match
                    if (meId === providedUserId || String(meId) === String(providedUserId)) {
                        userDocumentId = meResponse.data.documentId;
                    }
                }
            } catch (meError) {
                // /me endpoint might not be available, continue with other methods
            }
            
            // If /me didn't work, try resolving by numeric ID
            if (!userDocumentId) {
                userDocumentId = await resolveDocumentIdByNumericId("users", data.user);
            }
            
            // If still no documentId, try direct query with authenticated client
            if (!userDocumentId) {
                try {
                    const numericUserId = typeof data.user === 'string' ? Number(data.user) : data.user;
                    if (!isNaN(numericUserId)) {
                        // Try with data wrapper (Strapi v5 format)
                        const userResponse = await strapi.get(`/api/users?filters[id][$eq]=${numericUserId}&fields[0]=documentId`);
                        const users = userResponse.data?.data || userResponse.data || [];
                        if (Array.isArray(users) && users.length > 0) {
                            userDocumentId = users[0].documentId || null;
                        } else if (userResponse.data && !Array.isArray(userResponse.data) && userResponse.data.documentId) {
                            // Handle single object response
                            userDocumentId = userResponse.data.documentId;
                        }
                    }
                } catch (directError) {
                    console.warn("Failed to fetch user documentId via direct query:", directError);
                }
            }
        }
        
        if (!userDocumentId) {
            console.error("Failed to resolve user documentId for review creation. User ID:", data.user);
            throw new Error("Failed to resolve user documentId. Please try again.");
        }

        const courseDocumentId = await resolveDocumentIdByNumericId("course-courses", data.course_course);
        if (!courseDocumentId) {
            console.error("Failed to resolve course documentId for review creation");
            throw new Error("Failed to resolve course documentId. Please try again.");
        }

        const payload: any = {
            data: {
                user: { connect: [{ documentId: userDocumentId }] },
                course_course: { connect: [{ documentId: courseDocumentId }] },
                rating_stars: Math.max(0, Math.min(5, data.rating_stars)),
                description: data.description || '',
                publishedAt: new Date().toISOString(), // Auto-publish reviews when created
            }
        };

        const response = await strapi.post('/api/course-reviewers', payload);
        const item = response.data.data;
        
        return {
            id: item.id,
            documentId: item.documentId,
            user: item.user?.data?.id || item.user?.id || item.user,
            course_course: item.course_course?.data?.id || item.course_course?.id || item.course_course,
            rating_stars: Number(item.rating_stars) || 0,
            description: item.description || '',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        };
    } catch (error: any) {
        console.error("Error creating course review:", error?.response?.data || error?.message || error);
        throw error;
    }
}

export async function calculateCourseRating(courseId: string | number): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
}> {
    try {
        const reviews = await getCourseReviewers(courseId);
        if (reviews.length === 0) {
            return {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            };
        }

        const totalStars = reviews.reduce((sum, review) => sum + review.rating_stars, 0);
        const averageRating = totalStars / reviews.length;
        
        const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(review => {
            const stars = Math.round(review.rating_stars);
            if (stars >= 1 && stars <= 5) {
                ratingDistribution[stars] = (ratingDistribution[stars] || 0) + 1;
            }
        });

        return {
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            totalReviews: reviews.length,
            ratingDistribution
        };
    } catch (error: any) {
        console.error("Error calculating course rating:", error?.response?.data || error?.message || error);
        return {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
    }
}



