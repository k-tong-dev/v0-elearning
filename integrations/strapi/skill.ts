import { strapi, strapiPublic } from './client';

export interface Skill {
    id: number;
    documentId: string;
    name: string;
    code?: string;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string | null;
    locale: string;
}


export async function getSkills(): Promise<Skill[]> {
    try {
        const response = await strapiPublic.get('/api/skills');
        return (response.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            code: item.code,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            locale: item.locale,
        }));
    } catch (error) {
        console.error("Error fetching skills:", error);
        return [];
    }
}

