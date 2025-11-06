import { strapiPublic, strapi } from './client';

export interface CourseCourse {
    id: number;
    documentId: string;
    name: string;
    description?: string;
    Price: number;
    is_paid: boolean;
    preview_available: boolean;
    preview_url?: string;
    duration_minutes: number;
    preview_duration?: number;
    purchase_count: number;
    revenue_generated: number;
    course_level?: {
        id: number;
        name: string;
    };
    course_categories?: Array<{
        id: number;
        name: string;
    }>;
    course_tages?: Array<{
        id: number;
        name: string;
    }>;
    course_contents?: Array<{
        id: number;
        name: string;
    }>;
    currency?: {
        id: number;
        name: string;
        code: string;
    };
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string | null;
    locale?: string;
}

export async function getCourseCourses(): Promise<CourseCourse[]> {
    try {
        const response = await strapiPublic.get('/api/course-courses?populate=*');
        return (response.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            description: item.description,
            Price: item.Price || 0,
            is_paid: item.is_paid || false,
            preview_available: item.preview_available || false,
            preview_url: item.preview_url,
            duration_minutes: item.duration_minutes || 0,
            preview_duration: item.preview_duration || 0,
            purchase_count: item.purchase_count || 0,
            revenue_generated: item.revenue_generated || 0,
            course_level: item.course_level,
            course_categories: item.course_categories,
            course_tages: item.course_tages,
            course_contents: item.course_contents,
            currency: item.currency,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            locale: item.locale,
        }));
    } catch (error) {
        console.error("Error fetching course courses:", error);
        return [];
    }
}

export async function getCourseCourse(id: string | number): Promise<CourseCourse | null> {
    try {
        const response = await strapiPublic.get(`/api/course-courses/${id}?populate=*`);
        const item = response.data.data;
        
        return {
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            description: item.description,
            Price: item.Price || 0,
            is_paid: item.is_paid || false,
            preview_available: item.preview_available || false,
            preview_url: item.preview_url,
            duration_minutes: item.duration_minutes || 0,
            preview_duration: item.preview_duration || 0,
            purchase_count: item.purchase_count || 0,
            revenue_generated: item.revenue_generated || 0,
            course_level: item.course_level,
            course_categories: item.course_categories,
            course_tages: item.course_tages,
            course_contents: item.course_contents,
            currency: item.currency,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            locale: item.locale,
        };
    } catch (error) {
        console.error("Error fetching course course:", error);
        return null;
    }
}

export async function createCourseCourse(data: Partial<CourseCourse> & { name: string }): Promise<CourseCourse | null> {
    try {
        const response = await strapi.post('/api/course-courses', {
            data: {
                name: data.name,
                description: data.description,
                Price: data.Price || 0,
                is_paid: data.is_paid || false,
                preview_available: data.preview_available || false,
                preview_url: data.preview_url,
                duration_minutes: data.duration_minutes || 0,
                preview_duration: data.preview_duration || 0,
                purchase_count: data.purchase_count || 0,
                revenue_generated: data.revenue_generated || 0,
                course_level: data.course_level,
                currency: data.currency,
            }
        });
        
        const item = response.data.data;
        return {
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            description: item.description,
            Price: item.Price,
            is_paid: item.is_paid,
            preview_available: item.preview_available,
            preview_url: item.preview_url,
            duration_minutes: item.duration_minutes,
            preview_duration: item.preview_duration,
            purchase_count: item.purchase_count,
            revenue_generated: item.revenue_generated,
            course_level: item.course_level,
            currency: item.currency,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            locale: item.locale,
        };
    } catch (error) {
        console.error("Error creating course course:", error);
        return null;
    }
}

export async function updateCourseCourse(id: string, data: Partial<CourseCourse>): Promise<CourseCourse | null> {
    try {
        const response = await strapi.put(`/api/course-courses/${id}`, {
            data
        });
        
        const item = response.data.data;
        return {
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            description: item.description,
            Price: item.Price,
            is_paid: item.is_paid,
            preview_available: item.preview_available,
            preview_url: item.preview_url,
            duration_minutes: item.duration_minutes,
            preview_duration: item.preview_duration,
            purchase_count: item.purchase_count,
            revenue_generated: item.revenue_generated,
            course_level: item.course_level,
            course_categories: item.course_categories,
            course_tages: item.course_tages,
            course_contents: item.course_contents,
            currency: item.currency,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            locale: item.locale,
        };
    } catch (error) {
        console.error("Error updating course course:", error);
        return null;
    }
}

export async function deleteCourseCourse(id: string): Promise<boolean> {
    try {
        await strapi.delete(`/api/course-courses/${id}`);
        return true;
    } catch (error) {
        console.error("Error deleting course course:", error);
        return false;
    }
}

