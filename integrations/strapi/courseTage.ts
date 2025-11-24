import { strapiPublic } from './client';

export interface CourseTage {
    id: number;
    documentId: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
}

export async function getCourseTages(): Promise<CourseTage[]> {
    try {
        const response = await strapiPublic.get('/api/course-tages?populate=*');
        return (response.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));
    } catch (error) {
        console.error("Error fetching course tags:", error);
        return [];
    }
}

