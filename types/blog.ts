// Legacy interface for backward compatibility
export interface BlogPost {
    id: string | number;
    documentId?: string; // Strapi documentId for routing (prevents duplicates)
    title: string;
    excerpt: string;
    content: string;
    author: {
        id: string | number;
        name: string;
        avatar: string | null;
        role?: string;
        bio?: string;
        reputation?: number;
        postCount?: number;
    };
    category: string; // Category slug or ID for filtering
    categoryData?: {
        id: string | number;
        name: string;
        slug: string;
        color?: string;
    };
    tags: string[];
    publishedAt: string;
    readTime: number;
    views: number;
    likes: number;
    comments: number; // Alias for commentsCount
    commentsCount?: number;
    featured: boolean; // Alias for isFeatured
    isFeatured?: boolean;
    coverImage: string | null;
    slug?: string;
    updatedAt?: string;
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string;
        ogImage?: string;
        ogType?: string;
    };
}

export interface BlogCategory {
    id: string | number;
    name: string;
    description?: string;
    postCount: number;
    color?: string;
    slug?: string;
}