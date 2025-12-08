import { strapiPublic } from './client';

export interface Badge {
    id: number;
    documentId: string;
    name: string;
}

export async function getBadges(): Promise<Badge[]> {
    try {
        const res = await strapiPublic.get('/api/badges');
        return (res.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name,
        }));
    } catch {
        return [];
    }
}

