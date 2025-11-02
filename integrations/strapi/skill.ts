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
        const data = response?.data;
        if (Array.isArray(data)) {
            return data;
        }
        console.warn("Unexpected skills response:", response);
        return [];
    } catch (error) {
        console.error("Error fetching skills:", error);
        return []; // ← ALWAYS RETURN ARRAY
    }
}

