export interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    author: {
        id: string;
        name: string;
        avatar: string;
        role: string;
    };
    category: string;
    tags: string[];
    publishedAt: string;
    readTime: number;
    views: number;
    likes: number;
    comments: number;
    featured: boolean;
    coverImage: string;
}

export interface BlogCategory {
    id: string;
    name: string;
    description: string;
    postCount: number;
    color: string;
}