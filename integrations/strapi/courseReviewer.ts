import { strapiPublic, strapi } from './client';

export interface CourseReviewer {
    id: number;
    documentId: string;
    user: number | string;
    course_course: number | string;
    rating_stars: number;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string | null;
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
    courseId?: string | number
): Promise<CourseReviewer[]> {
    try {
        const params = new URLSearchParams();
        params.append('populate', '*');
        
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

        const response = await strapiPublic.get(`/api/course-reviewers?${params.toString()}`);
        return (response.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            user: item.user?.data?.id || item.user?.id || item.user,
            course_course: item.course_course?.data?.id || item.course_course?.id || item.course_course,
            rating_stars: Number(item.rating_stars) || 0,
            description: item.description || '',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        }));
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
        params.append('populate', '*');
        
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
        const userDocumentId = await resolveDocumentIdByNumericId("users", data.user);
        if (!userDocumentId) {
            console.error("Failed to resolve user documentId for review creation");
            return null;
        }

        const courseDocumentId = await resolveDocumentIdByNumericId("course-courses", data.course_course);
        if (!courseDocumentId) {
            console.error("Failed to resolve course documentId for review creation");
            return null;
        }

        const payload: any = {
            data: {
                user: { connect: [{ documentId: userDocumentId }] },
                course_course: { connect: [{ documentId: courseDocumentId }] },
                rating_stars: Math.max(0, Math.min(5, data.rating_stars)),
                description: data.description || '',
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



