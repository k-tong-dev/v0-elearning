import { strapiPublic } from './client';

export interface CourseBadge {
    id: number;
    documentId: string;
    name: string;
    code: string;
    createdAt?: string;
    updatedAt?: string;
}

export async function getCourseBadges(): Promise<CourseBadge[]> {
    try {
        const response = await strapiPublic.get('/api/course-badges?populate=*');
        return (response.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            code: item.name,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));
    } catch (error) {
        console.error("Error fetching course tags:", error);
        return [];
    }
}

