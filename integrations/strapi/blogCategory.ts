import { strapiPublic } from './client';

export interface BlogCategory {
    id: number;
    documentId: string;
    name: string;
    slug: string;
    color?: string;
    description?: string;
    postCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export async function getBlogCategories(): Promise<BlogCategory[]> {
    try {
        const response = await strapiPublic.get('/api/blog-categories?populate=*');
        return (response.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.attributes?.name || item.name,
            slug: item.attributes?.slug || item.slug,
            color: item.attributes?.color || item.color,
            description: item.attributes?.description || item.description,
            postCount: item.attributes?.postCount || item.postCount || 0,
            createdAt: item.attributes?.createdAt || item.createdAt,
            updatedAt: item.attributes?.updatedAt || item.updatedAt,
        }));
    } catch (error) {
        console.error("Error fetching blog categories:", error);
        return [];
    }
}

export async function getBlogCategoryBySlug(slug: string): Promise<BlogCategory | null> {
    try {
        const response = await strapiPublic.get(`/api/blog-categories?filters[slug][$eq]=${slug}&populate=*`);
        const data = response.data.data || [];
        if (data.length === 0) return null;
        
        const item = data[0];
        return {
            id: item.id,
            documentId: item.documentId,
            name: item.attributes?.name || item.name,
            slug: item.attributes?.slug || item.slug,
            color: item.attributes?.color || item.color,
            description: item.attributes?.description || item.description,
            postCount: item.attributes?.postCount || item.postCount || 0,
            createdAt: item.attributes?.createdAt || item.createdAt,
            updatedAt: item.attributes?.updatedAt || item.updatedAt,
        };
    } catch (error) {
        console.error("Error fetching blog category by slug:", error);
        return null;
    }
}

