import { strapiPublic } from './client';

export interface MenuItem {
    id: number;
    code: string;
    title: string;
    description: string;
    href: string;
    icon: string; // Font Awesome icon class
    category: "page" | "feature" | "course" | "instructor" | "blog" | "forum";
    keywords: string[];
    gradient: string;
    requiresAuth?: boolean;
    requiresPro?: boolean;
    publishedAt?: string;
}

export async function getMenuItems(): Promise<MenuItem[]> {
    try {
        // First try with publicationState=live (published items)
        // Note: With i18n enabled, we may need to specify locale
        let response = await strapiPublic.get('/api/menu-controllers', {
            params: {
                'pagination[limit]': 1000,
                'sort': 'id:asc',
                'publicationState': 'live', // Only get published items
                'locale': 'en', // Explicitly request English locale
            },
        });

        // If no results, try without publicationState filter (in case items exist but aren't marked as published)
        if (!response.data?.data || response.data.data.length === 0) {
            console.warn('No published items found, trying without publicationState filter...');
            response = await strapiPublic.get('/api/menu-controllers', {
                params: {
                    'pagination[limit]': 1000,
                    'sort': 'id:asc',
                    'locale': 'en', // Explicitly request English locale
                },
            });
        }

        if (!response.data || !response.data.data) {
            console.warn('No menu items data found in response:', response.data);
            return [];
        }

        console.log(`Found ${response.data.data.length} menu items from Strapi`);
        
        // Debug: Log first item structure to see actual response format
        // if (response.data.data.length > 0) {
        //     console.log('Sample item structure:', JSON.stringify(response.data.data[0], null, 2));
        // }

        const mappedItems = response.data.data.map((item: any) => {
            // Handle both direct attributes and nested attributes structure
            const attrs = item.attributes || item;
            
            const mapped = {
                id: item.id || item.documentId || 0,
                code: attrs.code || '',
                title: attrs.title || '',
                description: attrs.description || '',
                href: attrs.href || '#',
                icon: attrs.icon || '',
                category: (attrs.category || 'page') as "page" | "feature" | "course" | "instructor" | "blog" | "forum",
                keywords: Array.isArray(attrs.keywords) 
                    ? attrs.keywords 
                    : (attrs.keywords ? [attrs.keywords] : []),
                gradient: attrs.gradient || 'from-blue-500 to-cyan-500',
                requiresAuth: attrs.requiresAuth || attrs.requires_auth || false,
                requiresPro: attrs.requiresPro || attrs.requires_pro || false,
                publishedAt: attrs.publishedAt || attrs.published_at,
            };
            
            return mapped;
        });

        // console.log('Mapped items:', mappedItems.slice(0, 3)); // Log first 3 items
        return mappedItems;
    } catch (error: any) {
        // console.error('Error fetching menu items from Strapi:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error message:', error.message);
        }
        return [];
    }
}

export async function getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
    const allItems = await getMenuItems();
    return allItems.filter(item => item.category === category);
}

