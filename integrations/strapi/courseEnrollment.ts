import { strapiPublic, strapi } from './client';

export interface CourseEnrollment {
    id: number;
    documentId: string;
    user: number | string;
    course_course: number | string;
    enroll_status: 'active' | 'completed' | 'cancelled' | 'refunded';
    started_at?: string;
    completed_at?: string;
    progress_percent: number;
    is_owner: boolean;
    enrolled_via: 'purchase' | 'free' | 'admin' | 'promotion' | 'gift';
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

export async function getCourseEnrollments(
    userId?: string | number,
    courseId?: string | number
): Promise<CourseEnrollment[]> {
    try {
        const params = new URLSearchParams();
        params.append('populate', '*');
        
        if (userId) {
            const userDocId = await resolveDocumentIdByNumericId('users', userId);
            if (userDocId) {
                params.append('filters[user][documentId][$eq]', userDocId);
            }
        }
        
        if (courseId) {
            const courseDocId = await resolveDocumentIdByNumericId('course-courses', courseId);
            if (courseDocId) {
                params.append('filters[course_course][documentId][$eq]', courseDocId);
            }
        }

        const response = await strapi.get(`/api/course-enrollments?${params.toString()}`);
        return (response.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            user: item.user?.data?.id || item.user?.id || item.user,
            course_course: item.course_course?.data?.id || item.course_course?.id || item.course_course,
            enroll_status: item.enroll_status || 'active',
            started_at: item.started_at,
            completed_at: item.completed_at,
            progress_percent: Number(item.progress_percent) || 0,
            is_owner: item.is_owner || false,
            enrolled_via: item.enrolled_via || 'free',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        }));
    } catch (error: any) {
        console.error("Error fetching course enrollments:", error?.response?.data || error?.message || error);
        return [];
    }
}

export async function getCourseEnrollment(
    id: string | number
): Promise<CourseEnrollment | null> {
    try {
        const numericId = typeof id === 'string' ? Number(id) : id;
        if (isNaN(numericId)) {
            console.error("getCourseEnrollment: Invalid ID - must be numeric, got:", id);
            return null;
        }
        
        const params = new URLSearchParams();
        params.append('populate', '*');
        params.append('filters[id][$eq]', numericId.toString());
        
        const response = await strapi.get(`/api/course-enrollments?${params.toString()}`);
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
            enroll_status: item.enroll_status || 'active',
            started_at: item.started_at,
            completed_at: item.completed_at,
            progress_percent: Number(item.progress_percent) || 0,
            is_owner: item.is_owner || false,
            enrolled_via: item.enrolled_via || 'free',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        };
    } catch (error: any) {
        console.error("Error fetching course enrollment:", error?.response?.data || error?.message || error);
        return null;
    }
}

export async function checkUserEnrollment(
    userId: string | number,
    courseId: string | number
): Promise<CourseEnrollment | null> {
    try {
        const enrollments = await getCourseEnrollments(userId, courseId);
        const activeEnrollment = enrollments.find(
            (e) => e.enroll_status === 'active' && 
                   String(e.user) === String(userId) && 
                   String(e.course_course) === String(courseId)
        );
        return activeEnrollment || null;
    } catch (error: any) {
        console.error("Error checking user enrollment:", error?.response?.data || error?.message || error);
        return null;
    }
}

export interface CreateCourseEnrollmentInput {
    user: string | number;
    course_course: string | number;
    enroll_status?: 'active' | 'completed' | 'cancelled' | 'refunded';
    enrolled_via?: 'purchase' | 'free' | 'admin' | 'promotion' | 'gift';
    started_at?: string;
    progress_percent?: number;
    is_owner?: boolean;
}

export async function createCourseEnrollment(
    data: CreateCourseEnrollmentInput
): Promise<CourseEnrollment | null> {
    try {
        const now = new Date().toISOString();
        
        // Resolve documentIds for relations
        const userDocumentId = await resolveDocumentIdByNumericId("users", data.user);
        if (!userDocumentId) {
            console.error("Failed to resolve user documentId for enrollment creation");
            return null;
        }

        const courseDocumentId = await resolveDocumentIdByNumericId("course-courses", data.course_course);
        if (!courseDocumentId) {
            console.error("Failed to resolve course documentId for enrollment creation");
            return null;
        }

        const payload: any = {
            data: {
                user: { connect: [{ documentId: userDocumentId }] },
                course_course: { connect: [{ documentId: courseDocumentId }] },
                enroll_status: data.enroll_status || 'active',
                enrolled_via: data.enrolled_via || 'free',
                started_at: data.started_at || now,
                progress_percent: data.progress_percent || 0,
                is_owner: data.is_owner || false,
            }
        };

        const response = await strapi.post('/api/course-enrollments', payload);
        const item = response.data.data;
        
        return {
            id: item.id,
            documentId: item.documentId,
            user: item.user?.data?.id || item.user?.id || item.user,
            course_course: item.course_course?.data?.id || item.course_course?.id || item.course_course,
            enroll_status: item.enroll_status || 'active',
            started_at: item.started_at,
            completed_at: item.completed_at,
            progress_percent: Number(item.progress_percent) || 0,
            is_owner: item.is_owner || false,
            enrolled_via: item.enrolled_via || 'free',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        };
    } catch (error: any) {
        console.error("Error creating course enrollment:", error?.response?.data || error?.message || error);
        throw error;
    }
}

export async function updateCourseEnrollment(
    id: string,
    data: Partial<CreateCourseEnrollmentInput>
): Promise<CourseEnrollment | null> {
    try {
        const payload: any = { data: {} };
        
        if (data.user !== undefined) {
            const userDocumentId = await resolveDocumentIdByNumericId("users", data.user);
            if (userDocumentId) {
                payload.data.user = { connect: [{ documentId: userDocumentId }] };
            }
        }
        
        if (data.course_course !== undefined) {
            const courseDocumentId = await resolveDocumentIdByNumericId("course-courses", data.course_course);
            if (courseDocumentId) {
                payload.data.course_course = { connect: [{ documentId: courseDocumentId }] };
            }
        }
        
        if (data.enroll_status !== undefined) payload.data.enroll_status = data.enroll_status;
        if (data.enrolled_via !== undefined) payload.data.enrolled_via = data.enrolled_via;
        if (data.started_at !== undefined) payload.data.started_at = data.started_at;
        if (data.progress_percent !== undefined) payload.data.progress_percent = data.progress_percent;
        if (data.is_owner !== undefined) payload.data.is_owner = data.is_owner;

        const response = await strapi.put(`/api/course-enrollments/${id}`, payload);
        const item = response.data.data;
        
        return {
            id: item.id,
            documentId: item.documentId,
            user: item.user?.data?.id || item.user?.id || item.user,
            course_course: item.course_course?.data?.id || item.course_course?.id || item.course_course,
            enroll_status: item.enroll_status || 'active',
            started_at: item.started_at,
            completed_at: item.completed_at,
            progress_percent: Number(item.progress_percent) || 0,
            is_owner: item.is_owner || false,
            enrolled_via: item.enrolled_via || 'free',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        };
    } catch (error: any) {
        console.error("Error updating course enrollment:", error?.response?.data || error?.message || error);
        throw error;
    }
}

