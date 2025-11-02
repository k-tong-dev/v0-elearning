import { strapiPublic } from './client';

export interface PreferToLearn {
    id: number;
    documentId: string;
    name: string;
}

export async function getPreferToLearns(): Promise<PreferToLearn[]> {
    try {
        const res = await strapiPublic.get('/api/prefer-to-learns');
        return (res.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.attributes.name,
        }));
    } catch {
        return [];
    }
}