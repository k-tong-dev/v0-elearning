import { strapiPublic } from './client';

export interface Character {
    id: number;
    documentId: string;
    name: string;
    code: string;
}

export async function getCharacters(): Promise<Character[]> {
    try {
        const res = await strapiPublic.get('/api/charactors');
        return (res.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            code: item.code,
        }));
    } catch {
        return [];
    }
}