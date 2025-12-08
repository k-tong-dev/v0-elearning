import { strapiPublic } from './client';

export interface Interested {
    id: number;
    documentId: string;
    name: string;
}

export async function getInteresteds(): Promise<Interested[]> {
    try {
        const res = await strapiPublic.get('/api/interesteds');
        return (res.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name,
        }));
    } catch {
        return [];
    }
}

