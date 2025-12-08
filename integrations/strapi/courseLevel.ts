import { strapiPublic } from './client';

export interface CourseLevel {
    id: number;
    documentId: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
}

export async function getCourseLevels(): Promise<CourseLevel[]> {
    try {
        const response = await strapiPublic.get('/api/course-levels');
        return (response.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));
    } catch (error) {
        console.error("Error fetching course levels:", error);
        return [];
    }
}

