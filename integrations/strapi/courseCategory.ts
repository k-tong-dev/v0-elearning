import { strapiPublic } from './client';

export interface CourseCategory {
    id: number;
    documentId: string;
    name: string;
    code?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export async function getCourseCategories(): Promise<CourseCategory[]> {
    try {
        const response = await strapiPublic.get('/api/course-categories?populate=*');
        return (response.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            code: item.code,
            description: item.description,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));
    } catch (error) {
        console.error("Error fetching course categories:", error);
        return [];
    }
}

