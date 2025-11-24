import { strapiPublic, strapi } from './client';

// Helper to resolve documentId from numeric ID
async function resolveDocumentIdByNumericId(
    collection: string,
    numericId: number,
): Promise<string | null> {
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

export interface CourseMaterial {
    id: number;
    documentId: string;
    name: string;
    type: 'Video' | 'PDF' | 'URL' | 'Free Text';
    url?: string;
    free_text?: string;
    media?: any;
    course_content?: number;
    price: number;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string | null;
    locale?: string;
}

export interface CourseContent {
    id: number;
    documentId: string;
    name: string;
    is_paid: boolean;
    price: number;
    currency?: {
        id: number;
        name: string;
        code: string;
    };
    preview_duration?: number;
    purchase_count: number;
    revenue_generated: number;
    course_materials?: CourseMaterial[];
    course_course?: number;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string | null;
    locale?: string;
}

export async function getCourseContents(courseId?: string | number): Promise<CourseContent[]> {
    try {
        const url = courseId
            ? `/api/course-contents?filters[course_course][id][$eq]=${courseId}&populate=*`
            : '/api/course-contents?populate=*';
        
        const response = await strapiPublic.get(url);
        return (response.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            is_paid: item.is_paid || false,
            price: item.price || 0,
            currency: item.currency,
            preview_duration: item.preview_duration,
            purchase_count: item.purchase_count || 0,
            revenue_generated: item.revenue_generated || 0,
            course_materials: item.course_materials?.map((mat: any) => ({
                id: mat.id,
                documentId: mat.documentId,
                name: mat.name,
                type: mat.type,
                url: mat.url,
                free_text: mat.free_text,
                media: mat.media,
                course_content: mat.course_content,
                price: mat.price || 0,
                createdAt: mat.createdAt,
                updatedAt: mat.updatedAt,
                publishedAt: mat.publishedAt,
                locale: mat.locale,
            })),
            course_course: item.course_course?.id || item.course_course,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            locale: item.locale,
        }));
    } catch (error) {
        console.error("Error fetching course contents:", error);
        return [];
    }
}

export async function getCourseContent(id: string | number): Promise<CourseContent | null> {
    try {
        const response = await strapiPublic.get(`/api/course-contents/${id}?populate=*`);
        const item = response.data.data;
        
        return {
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            is_paid: item.is_paid || false,
            price: item.price || 0,
            currency: item.currency,
            preview_duration: item.preview_duration,
            purchase_count: item.purchase_count || 0,
            revenue_generated: item.revenue_generated || 0,
            course_materials: item.course_materials?.map((mat: any) => ({
                id: mat.id,
                documentId: mat.documentId,
                name: mat.name,
                type: mat.type,
                url: mat.url,
                free_text: mat.free_text,
                media: mat.media,
                course_content: mat.course_content,
                price: mat.price || 0,
                createdAt: mat.createdAt,
                updatedAt: mat.updatedAt,
                publishedAt: mat.publishedAt,
                locale: mat.locale,
            })),
            course_course: item.course_course?.id || item.course_course,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            locale: item.locale,
        };
    } catch (error) {
        console.error("Error fetching course content:", error);
        return null;
    }
}

export async function createCourseContent(data: Partial<CourseContent> & { name: string; course_course: number }): Promise<CourseContent | null> {
    try {
        // Resolve documentId for the course to ensure Strapi Admin UI displays the relation
        const courseDocumentId = await resolveDocumentIdByNumericId("course-courses", data.course_course);
        if (!courseDocumentId) {
            console.error("Failed to resolve course documentId for content creation");
            return null;
        }

        const response = await strapi.post('/api/course-contents', {
            data: {
                name: data.name,
                // Use connect with documentId for CREATE to ensure Strapi Admin UI displays the relation
                course_course: {
                    connect: [{ documentId: courseDocumentId }],
                },
                is_paid: data.is_paid || false,
                price: data.price || 0,
                currency: data.currency,
                preview_duration: data.preview_duration,
                purchase_count: data.purchase_count || 0,
                revenue_generated: data.revenue_generated || 0,
            }
        });
        
        const item = response.data.data;
        return {
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            is_paid: item.is_paid,
            price: item.price,
            currency: item.currency,
            preview_duration: item.preview_duration,
            purchase_count: item.purchase_count,
            revenue_generated: item.revenue_generated,
            course_course: item.course_course,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            locale: item.locale,
        };
    } catch (error) {
        console.error("Error creating course content:", error);
        return null;
    }
}

// Note: In Strapi v5, PUT/DELETE operations require documentId (string), not numeric id
export async function updateCourseContent(id: string, data: Partial<CourseContent>): Promise<CourseContent | null> {
    try {
        // id should be documentId, not numeric id
        const response = await strapi.put(`/api/course-contents/${id}`, {
            data
        });
        
        const item = response.data.data;
        return {
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            is_paid: item.is_paid,
            price: item.price,
            currency: item.currency,
            preview_duration: item.preview_duration,
            purchase_count: item.purchase_count,
            revenue_generated: item.revenue_generated,
            course_course: item.course_course,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            locale: item.locale,
        };
    } catch (error) {
        console.error("Error updating course content:", error);
        return null;
    }
}

// Note: In Strapi v5, DELETE operations require documentId (string), not numeric id
export async function deleteCourseContent(id: string): Promise<boolean> {
    try {
        // id should be documentId, not numeric id
        await strapi.delete(`/api/course-contents/${id}`);
        return true;
    } catch (error) {
        console.error("Error deleting course content:", error);
        return false;
    }
}

