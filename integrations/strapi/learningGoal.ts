import { strapiPublic } from './client';

export interface LearningGoal {
    id: number;
    documentId: string;
    name: string;
}

export async function getLearningGoals(): Promise<LearningGoal[]> {
    try {
        const res = await strapiPublic.get('/api/learning-goals');
        return (res.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name,
        }));
    } catch {
        return [];
    }
}