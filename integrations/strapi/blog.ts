import { strapiPublic, strapi } from './client';
import { getAvatarUrl } from '@/lib/getAvatarUrl';

export interface BlogPostAuthor {
    id: number | string;
    name: string;
    avatar: string | null;
    role?: string;
    bio?: string;
    reputation?: number;
    postCount?: number;
}

export interface BlogPost {
    id: number | string;
    documentId?: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string | null;
    author: BlogPostAuthor;
    category: {
        id: number | string;
        name: string;
        slug: string;
        color?: string;
    };
    tags: string[];
    publishedAt: string;
    updatedAt?: string;
    readTime: number;
    views: number;
    likes: number;
    commentsCount: number;
    isFeatured: boolean;
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string;
        ogImage?: string;
        ogType?: string;
    };
}

export interface BlogPostFilters {
    category?: string;
    featured?: boolean;
    search?: string;
    tags?: string[];
    author?: number | string;
}

export interface BlogPostSort {
    field: 'publishedAt' | 'views' | 'likes' | 'commentsCount' | 'title';
    order: 'asc' | 'desc';
}

export async function getBlogPosts(
    filters?: BlogPostFilters,
    sort?: BlogPostSort,
    pagination?: { page?: number; pageSize?: number }
): Promise<{ data: BlogPost[]; meta?: any }> {
    try {
        // Explicitly populate author and avatar for better reliability
        const populateParams = new URLSearchParams();
        populateParams.append('populate[0]', 'author');
        populateParams.append('populate[1]', 'author.avatar');
        populateParams.append('populate[2]', 'category');
        populateParams.append('populate[3]', 'coverImage');
        populateParams.append('populate[4]', 'SEO');
        populateParams.append('populate[5]', 'SEO.ogImage');
        
        let url = `/api/blog-posts?${populateParams.toString()}`;
        
        // Add filters
        const filterParams: string[] = [];
        if (filters?.category) {
            filterParams.push(`filters[category][slug][$eq]=${filters.category}`);
        }
        if (filters?.featured !== undefined) {
            filterParams.push(`filters[isFeatured][$eq]=${filters.featured}`);
        }
        if (filters?.search) {
            filterParams.push(`filters[$or][0][title][$containsi]=${filters.search}`);
            filterParams.push(`filters[$or][1][excerpt][$containsi]=${filters.search}`);
            filterParams.push(`filters[$or][2][content][$containsi]=${filters.search}`);
        }
        if (filters?.author) {
            filterParams.push(`filters[author][id][$eq]=${filters.author}`);
        }
        
        if (filterParams.length > 0) {
            url += '&' + filterParams.join('&');
        }
        
        // Add sorting
        if (sort) {
            url += `&sort=${sort.field}:${sort.order}`;
        } else {
            url += '&sort=publishedAt:desc';
        }
        
        // Add pagination
        if (pagination) {
            url += `&pagination[page]=${pagination.page || 1}`;
            url += `&pagination[pageSize]=${pagination.pageSize || 10}`;
        }
        
        const response = await strapiPublic.get(url);
        const posts = (response.data.data || []).map((item: any) => mapBlogPost(item));
        
        return {
            data: posts,
            meta: response.data.meta,
        };
    } catch (error) {
        console.error("Error fetching blog posts:", error);
        return { data: [] };
    }
}

export async function getBlogPostById(id: string | number): Promise<BlogPost | null> {
    try {
        // Check if id is numeric or a slug
        const isNumericId = typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id));
        
        // If it's not numeric, try fetching by slug first
        if (!isNumericId) {
            return await getBlogPostBySlug(String(id));
        }
        
        // Explicitly populate author and avatar
        const populateParams = new URLSearchParams();
        populateParams.append('populate[0]', 'author');
        populateParams.append('populate[1]', 'author.avatar');
        populateParams.append('populate[2]', 'category');
        populateParams.append('populate[3]', 'coverImage');
        populateParams.append('populate[4]', 'SEO');
        populateParams.append('populate[5]', 'SEO.ogImage');
        
        const response = await strapiPublic.get(`/api/blog-posts/${id}?${populateParams.toString()}`);
        const item = response.data.data;
        if (!item) return null;
        return mapBlogPost(item);
    } catch (error) {
        console.error("Error fetching blog post by id:", error);
        return null;
    }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
        // Explicitly populate author and avatar
        const populateParams = new URLSearchParams();
        populateParams.append('populate[0]', 'author');
        populateParams.append('populate[1]', 'author.avatar');
        populateParams.append('populate[2]', 'category');
        populateParams.append('populate[3]', 'coverImage');
        populateParams.append('populate[4]', 'SEO');
        populateParams.append('populate[5]', 'SEO.ogImage');
        populateParams.append('filters[slug][$eq]', slug);
        
        const response = await strapiPublic.get(`/api/blog-posts?${populateParams.toString()}`);
        const data = response.data.data || [];
        if (data.length === 0) return null;
        return mapBlogPost(data[0]);
    } catch (error) {
        console.error("Error fetching blog post by slug:", error);
        return null;
    }
}

export async function getBlogPostByDocumentId(documentId: string): Promise<BlogPost | null> {
    try {
        // Explicitly populate author and avatar
        const populateParams = new URLSearchParams();
        populateParams.append('populate[0]', 'author');
        populateParams.append('populate[1]', 'author.avatar');
        populateParams.append('populate[2]', 'category');
        populateParams.append('populate[3]', 'coverImage');
        populateParams.append('populate[4]', 'SEO');
        populateParams.append('populate[5]', 'SEO.ogImage');
        
        const response = await strapiPublic.get(`/api/blog-posts/${documentId}?${populateParams.toString()}`);
        const item = response.data.data;
        if (!item) return null;
        return mapBlogPost(item);
    } catch (error) {
        console.error("Error fetching blog post by documentId:", error);
        return null;
    }
}

export async function getFeaturedBlogPosts(limit?: number): Promise<BlogPost[]> {
    try {
        const result = await getBlogPosts(
            { featured: true },
            { field: 'publishedAt', order: 'desc' },
            { pageSize: limit || 3 }
        );
        return result.data;
    } catch (error) {
        console.error("Error fetching featured blog posts:", error);
        return [];
    }
}

export async function getRelatedBlogPosts(
    postId: number | string,
    categorySlug: string,
    limit: number = 3
): Promise<BlogPost[]> {
    try {
        const result = await getBlogPosts(
            { category: categorySlug },
            { field: 'publishedAt', order: 'desc' },
            { pageSize: limit + 1 } // Get one extra to exclude current post
        );
        return result.data.filter(post => post.id !== postId).slice(0, limit);
    } catch (error) {
        console.error("Error fetching related blog posts:", error);
        return [];
    }
}

function mapBlogPost(item: any): BlogPost {
    const attributes = item.attributes || item;
    const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || '';
    
    // Map cover image
    let coverImage: string | null = null;
    if (attributes.coverImage) {
        const imageData = attributes.coverImage.data || attributes.coverImage;
        if (imageData) {
            const imageUrl = imageData.attributes?.url || imageData.url;
            if (imageUrl) {
                coverImage = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
            }
        }
    }
    
    // Map author
    let author: BlogPostAuthor = {
        id: 'unknown',
        name: 'Unknown Author',
        avatar: null,
    };
    
    if (attributes.author) {
        const authorData = attributes.author.data || attributes.author;
        if (authorData) {
            const authorAttrs = authorData.attributes || authorData;
            
            // Debug: Log avatar structure to understand the data format
            if (!authorAttrs.avatar && !authorData.avatar) {
                console.warn('[mapBlogPost] Author avatar missing:', {
                    hasAuthor: !!attributes.author,
                    authorDataKeys: Object.keys(authorData || {}),
                    authorAttrsKeys: Object.keys(authorAttrs || {}),
                    authorData: authorData,
                });
            }
            
            // Extract avatar - try multiple possible locations
            const avatarSource = authorAttrs.avatar 
                ?? authorData.avatar 
                ?? authorAttrs.avatar?.data 
                ?? authorData.avatar?.data;
            
            author = {
                id: authorData.id || authorAttrs.id,
                name: authorAttrs.name || authorAttrs.username || 'Unknown Author',
                avatar: getAvatarUrl(avatarSource),
                role: authorAttrs.role || 'Author',
                bio: authorAttrs.bio,
                reputation: authorAttrs.reputation || 0,
                postCount: authorAttrs.postCount || 0,
            };
        }
    }
    
    // Map category
    let category = {
        id: 'unknown',
        name: 'Uncategorized',
        slug: 'uncategorized',
    };
    
    if (attributes.category) {
        const categoryData = attributes.category.data || attributes.category;
        if (categoryData) {
            const categoryAttrs = categoryData.attributes || categoryData;
            category = {
                id: categoryData.id || categoryAttrs.id,
                name: categoryAttrs.name || 'Uncategorized',
                slug: categoryAttrs.slug || 'uncategorized',
            };
        }
    }
    
    // Map tags
    let tags: string[] = [];
    if (attributes.tags) {
        if (Array.isArray(attributes.tags)) {
            tags = attributes.tags;
        } else if (typeof attributes.tags === 'string') {
            try {
                tags = JSON.parse(attributes.tags);
            } catch {
                tags = [attributes.tags];
            }
        }
    }
    
    // Map SEO
    let seo;
    if (attributes.seo) {
        const seoData = attributes.seo;
        const ogImage = seoData.ogImage?.data?.attributes?.url || seoData.ogImage?.url;
        seo = {
            metaTitle: seoData.metaTitle,
            metaDescription: seoData.metaDescription,
            keywords: seoData.keywords,
            ogImage: ogImage ? (ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`) : undefined,
            ogType: seoData.ogType || 'article',
        };
    }
    
    return {
        id: item.id,
        documentId: item.documentId || attributes.documentId,
        title: attributes.title || '',
        slug: attributes.slug || '',
        excerpt: attributes.excerpt || '',
        content: attributes.content || '',
        coverImage,
        author,
        category,
        tags,
        publishedAt: attributes.publishedAt || attributes.createdAt || new Date().toISOString(),
        updatedAt: attributes.updatedAt,
        readTime: attributes.readTime || 0,
        views: attributes.views || 0,
        likes: attributes.likes || 0,
        commentsCount: attributes.commentsCount || 0,
        isFeatured: attributes.isFeatured || false,
        seo,
    };
}

export interface CreateBlogPostData {
    title: string;
    excerpt: string;
    content: string;
    categoryId: string | number;
    tags?: string[];
    readTime?: number;
    isFeatured?: boolean;
    coverImage?: File | null;
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string;
        ogImage?: File | null;
        ogType?: 'website' | 'article';
    };
}

// Helper to resolve category and return both documentId and numeric ID
async function resolveCategoryInfo(
    categoryIdentifier: number | string,
    locale: string = 'en'
): Promise<{ documentId: string; numericId: number } | null> {
    const clients = [strapi, strapiPublic];
    
    // If it's a numeric ID (string or number)
    if (typeof categoryIdentifier === 'number' || (typeof categoryIdentifier === 'string' && /^\d+$/.test(categoryIdentifier))) {
        const numericId = typeof categoryIdentifier === 'string' ? Number(categoryIdentifier) : categoryIdentifier;
        const query = [`filters[id][$eq]=${numericId}`, `locale=${locale}`, "fields[0]=documentId"].join("&");
        const url = `/api/blog-categories?${query}`;
        
        for (const client of clients) {
            try {
                const response = await client.get(url);
                const items = response.data?.data ?? [];
                if (items.length > 0 && items[0].documentId) {
                    return { documentId: items[0].documentId, numericId: items[0].id };
                }
            } catch (error) {
                console.warn(`Failed to resolve category for id ${numericId}`, error);
            }
        }
        return null;
    }
    
    // Non-numeric string - could be documentId or slug
    const identifierStr = String(categoryIdentifier);
    
    // Try querying by slug first (most common case)
    for (const client of clients) {
        try {
            const query = [`filters[slug][$eq]=${encodeURIComponent(identifierStr)}`, `locale=${locale}`].join("&");
            const response = await client.get(`/api/blog-categories?${query}`);
            const items = response.data?.data ?? [];
            if (items.length > 0 && items[0].documentId && items[0].id) {
                return { documentId: items[0].documentId, numericId: items[0].id };
            }
        } catch (error) {
            // Continue to try documentId
        }
    }
    
    // Try as documentId directly
    for (const client of clients) {
        try {
            const response = await client.get(`/api/blog-categories/${identifierStr}?locale=${locale}`);
            if (response.data?.data?.documentId && response.data?.data?.id) {
                return { documentId: response.data.data.documentId, numericId: response.data.data.id };
            }
        } catch (error) {
            // DocumentId lookup failed
        }
    }
    
    return null;
}

export async function createBlogPost(data: CreateBlogPostData): Promise<BlogPost | null> {
    // Declare variables outside try block for error handler access
    let categoryInfo: { documentId: string; numericId: number } | null = null;
    let coverImageConnection: { set: Array<number | { documentId?: string; id?: number }> } | null = null;
    
    try {
        // Resolve category info (both documentId and numeric ID)
        categoryInfo = await resolveCategoryInfo(data.categoryId);
        if (!categoryInfo) {
            throw new Error(`Category "${data.categoryId}" not found. Please select a valid category.`);
        }

        // Upload cover image if provided
        if (data.coverImage) {
            const formData = new FormData();
            formData.append('files', data.coverImage);
            
            const uploadResponse = await strapi.post('/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            if (uploadResponse.data && uploadResponse.data.length > 0) {
                const uploadedFile = uploadResponse.data[0];
                // For single media fields in Strapi v5, use 'set' with numeric id
                // Prefer numeric id over documentId for media relations
                if (uploadedFile.id) {
                    coverImageConnection = {
                        set: [uploadedFile.id],
                    };
                } else if (uploadedFile.documentId) {
                    // Fallback to documentId if id is not available
                    coverImageConnection = {
                        set: [{ documentId: uploadedFile.documentId }],
                    };
                }
            }
        }

        // Generate slug from title and ensure uniqueness
        const baseSlug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        
        // Check if slug exists and make it unique if needed
        let slug = baseSlug;
        let attempt = 0;
        const maxAttempts = 10;
        
        while (attempt < maxAttempts) {
            try {
                // Check if slug already exists
                const checkResponse = await strapiPublic.get(`/api/blog-posts?filters[slug][$eq]=${encodeURIComponent(slug)}&fields[0]=id`);
                
                if (checkResponse.data?.data && checkResponse.data.data.length > 0) {
                    // Slug exists, append timestamp or number
                    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
                    slug = `${baseSlug}-${timestamp}${attempt > 0 ? `-${attempt}` : ''}`;
                    attempt++;
                } else {
                    // Slug is unique, break the loop
                    break;
                }
            } catch (checkError) {
                // If check fails, try with appended timestamp anyway
                if (attempt === 0) {
                    const timestamp = Date.now().toString().slice(-6);
                    slug = `${baseSlug}-${timestamp}`;
                }
                break; // Exit loop on error
            }
        }

        // Get current authenticated user for author relation
        let authorDocumentId: string | null = null;
        let authorNumericId: number | null = null;
        
        try {
            const userResponse = await strapi.get('/api/users/me?fields[0]=id&fields[1]=documentId');
            const user = userResponse.data?.data ?? userResponse.data;
            authorDocumentId = user?.documentId;
            authorNumericId = user?.id ? (typeof user.id === 'number' ? user.id : parseInt(String(user.id))) : null;
            
            // If no documentId, try to resolve from numeric ID
            if (!authorDocumentId && authorNumericId) {
                // Try to get documentId from users API
                try {
                    const userLookup = await strapiPublic.get(`/api/users?filters[id][$eq]=${authorNumericId}&fields[0]=documentId`);
                    if (userLookup.data?.data && userLookup.data.data.length > 0) {
                        authorDocumentId = userLookup.data.data[0].documentId ?? userLookup.data.data[0].attributes?.documentId ?? null;
                    }
                } catch (lookupError) {
                    console.warn('Failed to resolve author documentId:', lookupError);
                }
            }
        } catch (userError: any) {
            console.error('Error fetching current user for blog post:', userError);
            throw new Error("User not authenticated. Cannot create blog post.");
        }
        
        if (!authorDocumentId && !authorNumericId) {
            throw new Error("Could not resolve author information. Please log in again.");
        }

        // Prepare the blog post data
        const postData: any = {
            title: data.title,
            slug,
            excerpt: data.excerpt,
            content: data.content,
            readTime: data.readTime || 0,
            views: 0,
            likes: 0,
            commentsCount: 0,
            isFeatured: data.isFeatured || false,
            // Note: tags field is of type "blocks" in Strapi schema, not array of strings
            // Omitting tags for now to avoid validation errors - this may need schema fix in Strapi
            publishedAt: new Date().toISOString(),
        };

        // Add author relation - use connect format for manyToOne in Strapi v5
        if (authorNumericId) {
            postData.author = {
                connect: [{ id: authorNumericId }],
            };
        } else if (authorDocumentId) {
            postData.author = {
                connect: [{ documentId: authorDocumentId }],
            };
        }

        // Add category relation - use connect format for manyToOne
        postData.category = {
            connect: [{ id: categoryInfo.numericId }],
        };

        // Add cover image if uploaded - for media relations, use connect
        if (coverImageConnection) {
            postData.coverImage = coverImageConnection;
        }

        // Handle SEO component if provided
        if (data.seo && (data.seo.metaTitle || data.seo.metaDescription)) {
            let ogImageConnection: { set: Array<number | { documentId?: string; id?: number }> } | null = null;
            
            // Upload SEO ogImage if provided
            if (data.seo.ogImage) {
                const seoFormData = new FormData();
                seoFormData.append('files', data.seo.ogImage);
                
                const seoUploadResponse = await strapi.post('/api/upload', seoFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                
                if (seoUploadResponse.data && seoUploadResponse.data.length > 0) {
                    const uploadedFile = seoUploadResponse.data[0];
                    // For single media fields in Strapi v5, use 'set' with numeric id
                    // Prefer numeric id over documentId for media relations
                    if (uploadedFile.id) {
                        ogImageConnection = {
                            set: [uploadedFile.id],
                        };
                    } else if (uploadedFile.documentId) {
                        // Fallback to documentId if id is not available
                        ogImageConnection = {
                            set: [{ documentId: uploadedFile.documentId }],
                        };
                    }
                }
            }

            // Build SEO component - ensure all required fields are present
            const seoData: any = {
                metaTitle: data.seo.metaTitle || data.title,
                metaDescription: data.seo.metaDescription || data.excerpt,
                keywords: data.seo.keywords || '',
                ogType: data.seo.ogType || 'article',
            };
            
            // Only add ogImage if we have a connection (avoid empty set arrays)
            if (ogImageConnection && ogImageConnection.set && ogImageConnection.set.length > 0) {
                seoData.ogImage = ogImageConnection;
            }
            
            postData.SEO = seoData;
        }

        // Log the payload for debugging (remove in production)
        console.log('[createBlogPost] Payload:', JSON.stringify(postData, null, 2));

        // Create the blog post
        const response = await strapi.post('/api/blog-posts', {
            data: postData,
        });

        if (response.data?.data) {
            return mapBlogPost(response.data.data);
        }

        return null;
    } catch (error: any) {
        console.error("Error creating blog post:", error);
        
        // Provide more detailed error messages
        if (error.response?.data?.error) {
            const strapiError = error.response.data.error;
            let errorMessage = strapiError.message || "Failed to create blog post";
            
            // Handle slug uniqueness error specifically
            if (strapiError.details?.errors) {
                const slugError = strapiError.details.errors.find((err: any) => 
                    err.path.includes('slug') && err.message.includes('unique')
                );
                
                if (slugError) {
                    // Retry with a unique slug - recreate postData since it's not in scope
                    const timestamp = Date.now().toString().slice(-8);
                    const uniqueSlug = `${data.title
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '')}-${timestamp}`;
                    
                    // Recreate postData for retry
                    const retryPostData: any = {
                        title: data.title,
                        slug: uniqueSlug,
                        excerpt: data.excerpt,
                        content: data.content,
                        readTime: data.readTime || 0,
                        views: 0,
                        likes: 0,
                        commentsCount: 0,
                        isFeatured: data.isFeatured || false,
                        publishedAt: new Date().toISOString(),
                    };
                    
                    // Re-add relations
                    if (categoryInfo) {
                        retryPostData.category = {
                            connect: [{ id: categoryInfo.numericId }],
                        };
                    }
                    if (coverImageConnection) {
                        retryPostData.coverImage = coverImageConnection;
                    }
                    // Re-add author relation
                    if (authorNumericId) {
                        retryPostData.author = {
                            connect: [{ id: authorNumericId }],
                        };
                    } else if (authorDocumentId) {
                        retryPostData.author = {
                            connect: [{ documentId: authorDocumentId }],
                        };
                    }
                    if (data.seo && (data.seo.metaTitle || data.seo.metaDescription)) {
                        retryPostData.SEO = {
                            metaTitle: data.seo.metaTitle || data.title,
                            metaDescription: data.seo.metaDescription || data.excerpt,
                            keywords: data.seo.keywords || '',
                            ogType: data.seo.ogType || 'article',
                        };
                    }
                    
                    // Retry creation with unique slug
                    try {
                        const retryResponse = await strapi.post('/api/blog-posts', {
                            data: retryPostData,
                        });
                        
                        if (retryResponse.data?.data) {
                            return mapBlogPost(retryResponse.data.data);
                        }
                    } catch (retryError) {
                        // If retry fails, show original error
                        const errorDetails = strapiError.details.errors
                            .map((err: any) => `${err.path.join('.')}: ${err.message}`)
                            .join(', ');
                        errorMessage += ` (${errorDetails})`;
                        throw new Error(errorMessage);
                    }
                } else {
                    // Other validation errors
                    const errorDetails = strapiError.details.errors
                        .map((err: any) => `${err.path.join('.')}: ${err.message}`)
                        .join(', ');
                    errorMessage += ` (${errorDetails})`;
                    throw new Error(errorMessage);
                }
            } else {
                throw new Error(errorMessage);
            }
        }
        
        throw new Error(error.message || "Failed to create blog post");
    }
}

/**
 * Check if current user is the author of a blog post
 */
export async function isBlogPostAuthor(postId: string | number, postAuthorId?: string | number): Promise<boolean> {
    try {
        // Get current user
        const userResponse = await strapi.get('/api/users/me?fields[0]=id&fields[1]=documentId');
        const currentUser = userResponse.data?.data ?? userResponse.data;
        if (!currentUser?.id) {
            return false;
        }

        // If postAuthorId is provided, use it directly (avoids refetching and 404 errors)
        if (postAuthorId !== undefined) {
            const currentUserId = String(currentUser.id);
            const authorId = String(postAuthorId);
            return currentUserId === authorId;
        }

        // Otherwise, fetch the post to get author ID (fallback for cases where author ID not available)
        try {
            const post = await getBlogPostById(postId);
            if (!post || !post.author) {
                return false;
            }

            // Compare user IDs (handle both numeric and string)
            const currentUserId = String(currentUser.id);
            const authorId = String(post.author.id);
            
            return currentUserId === authorId;
        } catch (fetchError: any) {
            // If post fetch fails (e.g., 404), return false
            console.warn('Could not fetch post to check author:', fetchError.message);
            return false;
        }
    } catch (error: any) {
        console.error('Error checking blog post author:', error);
        return false;
    }
}

export interface UpdateBlogPostData {
    title?: string;
    excerpt?: string;
    content?: string;
    categoryId?: string | number;
    coverImage?: File | null;
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string;
        ogImage?: File | null;
        ogType?: string;
    };
    isFeatured?: boolean;
    readTime?: number;
}

/**
 * Update a blog post (only if user is the author)
 */
export async function updateBlogPost(
    postId: string | number,
    data: UpdateBlogPostData,
    postAuthorId?: string | number
): Promise<BlogPost | null> {
    try {
        // Get existing post to preserve fields not being updated
        // Try documentId first (if it looks like one), then slug, then numeric ID
        let existingPost = null;
        const looksLikeDocumentId = typeof postId === 'string' && postId.includes('-') && postId.length > 20;
        
        if (looksLikeDocumentId) {
          existingPost = await getBlogPostByDocumentId(postId);
        }
        
        if (!existingPost) {
          existingPost = await getBlogPostById(postId) || await getBlogPostBySlug(String(postId)) || await getBlogPostByDocumentId(String(postId));
        }
        
        if (!existingPost) {
            throw new Error("Blog post not found.");
        }

        // Permission check is already done in BlogEditForm before showing the edit form
        // So we skip the redundant check here to avoid issues with documentId vs numeric ID

        // Resolve category info if category is being updated
        let categoryNumericId: number | null = null;
        let shouldUpdateCategory = false;
        if (data.categoryId) {
            const categoryInfo = await resolveCategoryInfo(data.categoryId);
            if (!categoryInfo) {
                throw new Error(`Category "${data.categoryId}" not found. Please select a valid category.`);
            }
            // Check if category is actually changing
            const existingCategoryId = existingPost.category?.id;
            if (String(existingCategoryId) !== String(categoryInfo.numericId)) {
                shouldUpdateCategory = true;
                categoryNumericId = categoryInfo.numericId;
            }
        }

        // Get old cover image ID before updating (for cleanup)
        let oldCoverImageId: { id?: number; documentId?: string } | null = null;
        if (existingPost.coverImage) {
            // Fetch full post data to get cover image ID
            try {
                const fullPostResponse = await strapiPublic.get(
                    `/api/blog-posts/${existingPost.documentId || existingPost.id}?populate[coverImage][fields][0]=id&populate[coverImage][fields][1]=documentId`
                );
                const fullPost = fullPostResponse.data?.data;
                if (fullPost?.attributes?.coverImage?.data) {
                    const coverImage = fullPost.attributes.coverImage.data;
                    if (coverImage.id) {
                        oldCoverImageId = { id: coverImage.id };
                    } else if (coverImage.documentId) {
                        oldCoverImageId = { documentId: coverImage.documentId };
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch old cover image ID:', error);
            }
        }

        // Upload cover image if provided - use set format for single media fields in Strapi v5
        let coverImageConnection: { set: Array<number | { documentId?: string; id?: number }> } | null = null;
        if (data.coverImage) {
            const formData = new FormData();
            formData.append('files', data.coverImage);
            
            const uploadResponse = await strapi.post('/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            if (uploadResponse.data && uploadResponse.data.length > 0) {
                const uploadedFile = uploadResponse.data[0];
                // For single media fields in Strapi v5, use 'set' with numeric id
                // Prefer numeric id over documentId for media relations
                if (uploadedFile.id) {
                    coverImageConnection = {
                        set: [uploadedFile.id],
                    };
                } else if (uploadedFile.documentId) {
                    // Fallback to documentId if id is not available
                    coverImageConnection = {
                        set: [{ documentId: uploadedFile.documentId }],
                    };
                }
            }
        }

        // Prepare update data
        const updateData: any = {};
        
        if (data.title !== undefined) {
            updateData.title = data.title;
            // Regenerate slug if title changed and ensure uniqueness
            const baseSlug = data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            
            // Check if slug exists (excluding current post) and make it unique if needed
            let slug = baseSlug;
            let attempt = 0;
            const maxAttempts = 10;
            const currentPostId = existingPost.id;
            const currentPostDocumentId = existingPost.documentId;
            
            while (attempt < maxAttempts) {
                try {
                    // Check if slug already exists, excluding the current post
                    let checkUrl = `/api/blog-posts?filters[slug][$eq]=${encodeURIComponent(slug)}&fields[0]=id&fields[1]=documentId`;
                    const checkResponse = await strapiPublic.get(checkUrl);
                    
                    if (checkResponse.data?.data && checkResponse.data.data.length > 0) {
                        // Check if the slug belongs to a different post
                        const conflictingPost = checkResponse.data.data.find((post: any) => {
                            const postId = post.id || post.documentId;
                            const existingId = currentPostId || currentPostDocumentId;
                            return String(postId) !== String(existingId);
                        });
                        
                        if (conflictingPost) {
                            // Slug exists for another post, append timestamp
                            const timestamp = Date.now().toString().slice(-6);
                            slug = `${baseSlug}-${timestamp}${attempt > 0 ? `-${attempt}` : ''}`;
                            attempt++;
                        } else {
                            // Slug belongs to current post, it's fine to use
                            break;
                        }
                    } else {
                        // Slug is unique, break the loop
                        break;
                    }
                } catch (checkError) {
                    // If check fails, try with appended timestamp anyway
                    if (attempt === 0) {
                        const timestamp = Date.now().toString().slice(-6);
                        slug = `${baseSlug}-${timestamp}`;
                    }
                    break; // Exit loop on error
                }
            }
            
            updateData.slug = slug;
        }
        if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
        if (data.content !== undefined) updateData.content = data.content;
        if (data.readTime !== undefined) updateData.readTime = data.readTime;
        if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;

        // Update category if provided
        // For updates in Strapi v5, use direct numeric ID (no connect format)
        if (data.categoryId) {
            // Always resolve and include category if provided
            const categoryInfo = categoryNumericId !== null 
                ? { numericId: categoryNumericId }
                : await resolveCategoryInfo(data.categoryId);
            if (categoryInfo) {
                updateData.category = categoryInfo.numericId;
            }
        }

        // Update cover image if provided - use set format for single media fields
        if (coverImageConnection) {
            updateData.coverImage = coverImageConnection;
        } else if (data.coverImage === null) {
            // Remove cover image - use set with empty array or null for Strapi v5
            updateData.coverImage = { set: [] };
        }

        // Handle SEO component if provided
        if (data.seo) {
            let ogImageConnection: { set: Array<number | { documentId?: string; id?: number }> } | null = null;
            
            if (data.seo.ogImage) {
                const seoFormData = new FormData();
                seoFormData.append('files', data.seo.ogImage);
                
                const seoUploadResponse = await strapi.post('/api/upload', seoFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                
                if (seoUploadResponse.data && seoUploadResponse.data.length > 0) {
                    const uploadedFile = seoUploadResponse.data[0];
                    // For single media fields in Strapi v5, use 'set' with numeric id
                    // Prefer numeric id over documentId for media relations
                    if (uploadedFile.id) {
                        ogImageConnection = {
                            set: [uploadedFile.id],
                        };
                    } else if (uploadedFile.documentId) {
                        // Fallback to documentId if id is not available
                        ogImageConnection = {
                            set: [{ documentId: uploadedFile.documentId }],
                        };
                    }
                }
            }

            // Build SEO component (merge with existing if present)
            updateData.SEO = {
                metaTitle: data.seo.metaTitle ?? existingPost.seo?.metaTitle ?? data.title ?? existingPost.title,
                metaDescription: data.seo.metaDescription ?? existingPost.seo?.metaDescription ?? data.excerpt ?? existingPost.excerpt,
                keywords: data.seo.keywords ?? existingPost.seo?.keywords ?? '',
                ogType: data.seo.ogType ?? existingPost.seo?.ogType ?? 'article',
                ...(ogImageConnection ? { ogImage: ogImageConnection } : {}),
            };
        }

        // Use documentId from the fetched post for the update request
        // The existingPost should have documentId from mapBlogPost
        let updateUrl: string;
        
        if (existingPost.documentId) {
            // Use documentId if available
            updateUrl = `/api/blog-posts/${existingPost.documentId}`;
        } else {
            // Fallback: try to resolve documentId from numeric ID
            const isNumericId = typeof postId === 'number' || (typeof postId === 'string' && /^\d+$/.test(postId));
            if (isNumericId) {
                const numericId = typeof postId === 'string' ? Number(postId) : postId;
                const postResponse = await strapiPublic.get(`/api/blog-posts?filters[id][$eq]=${numericId}&fields[0]=documentId`);
                if (postResponse.data?.data && postResponse.data.data.length > 0) {
                    const docId = postResponse.data.data[0].documentId;
                    if (docId) {
                        updateUrl = `/api/blog-posts/${docId}`;
                    } else {
                        throw new Error("Could not resolve documentId for blog post.");
                    }
                } else {
                    throw new Error("Blog post not found.");
                }
            } else {
                // If it's a slug, we already fetched it, so use the documentId from existingPost
                // If documentId is still not available, try fetching by slug to get documentId
                const slugPost = await getBlogPostBySlug(String(postId));
                if (slugPost?.documentId) {
                    updateUrl = `/api/blog-posts/${slugPost.documentId}`;
                } else {
                    throw new Error("Could not resolve documentId for blog post.");
                }
            }
        }

        // Log the payload for debugging
        console.log('[updateBlogPost] Payload:', JSON.stringify(updateData, null, 2));
        console.log('[updateBlogPost] Update URL:', updateUrl);

        // Update the blog post
        const response = await strapi.put(updateUrl, {
            data: updateData,
        });

        // Delete old cover image if a new one was uploaded and update was successful
        if (response.data?.data && oldCoverImageId && coverImageConnection) {
            try {
                if (oldCoverImageId.id) {
                    await strapi.delete(`/api/upload/files/${oldCoverImageId.id}`);
                } else if (oldCoverImageId.documentId) {
                    await strapi.delete(`/api/upload/files/${oldCoverImageId.documentId}`);
                }
            } catch (deleteError: any) {
                // Log but don't fail if image deletion fails (image might already be deleted or not exist)
                console.warn(`Failed to delete old cover image ${oldCoverImageId.id || oldCoverImageId.documentId}:`, deleteError.message);
            }
        }

        if (response.data?.data) {
            return mapBlogPost(response.data.data);
        }

        return null;
    } catch (error: any) {
        console.error("Error updating blog post:", error);
        
        // Provide more detailed error messages
        if (error.response?.data?.error) {
            const strapiError = error.response.data.error;
            let errorMessage = strapiError.message || "Failed to update blog post";
            
            // Add details about validation errors
            if (strapiError.details?.errors) {
                const errorDetails = strapiError.details.errors
                    .map((err: any) => `${err.path.join('.')}: ${err.message}`)
                    .join(', ');
                errorMessage += ` (${errorDetails})`;
            }
            
            throw new Error(errorMessage);
        }
        
        throw new Error(error.message || "Failed to update blog post");
    }
}

// Blog Comment Types
export interface BlogComment {
    id: string | number;
    documentId?: string;
    content: string;
    author: {
        id: string | number;
        name: string;
        avatar?: string | null;
        username?: string;
    };
    createdAt: string;
    publishedAt?: string;
    replies?: BlogComment[];
    parentComment?: string | number;
}

export interface CreateBlogCommentData {
    content: string;
    postId: string | number;
    parentCommentId?: string | number;
    userId?: string | number;
}

/**
 * Get comments for a blog post
 */
export async function getBlogComments(postId: string | number): Promise<BlogComment[]> {
    try {
        const populateParams = new URLSearchParams();
        populateParams.append('populate[0]', 'author');
        populateParams.append('populate[1]', 'author.avatar');
        populateParams.append('populate[2]', 'replies');
        populateParams.append('populate[3]', 'replies.author');
        populateParams.append('populate[4]', 'replies.author.avatar');
        populateParams.append('filters[posts][id][$eq]', String(postId));
        populateParams.append('filters[parentComment][$null]', 'true'); // Only top-level comments
        
        const response = await strapiPublic.get(`/api/blog-comments?${populateParams.toString()}`);
        const comments = response.data?.data || [];
        
        return comments.map((comment: any) => {
            const attrs = comment.attributes || comment;
            const authorData = attrs.author?.data || attrs.author;
            const authorAttrs = authorData?.attributes || authorData || {};
            
            // Map replies
            const repliesData = attrs.replies?.data || attrs.replies || [];
            const replies = repliesData.map((reply: any) => {
                const replyAttrs = reply.attributes || reply;
                const replyAuthorData = replyAttrs.author?.data || replyAttrs.author;
                const replyAuthorAttrs = replyAuthorData?.attributes || replyAuthorData || {};
                
                return {
                    id: reply.id || replyAttrs.id,
                    documentId: reply.documentId || replyAttrs.documentId,
                    content: replyAttrs.content || reply.content,
                    author: {
                        id: replyAuthorAttrs.id || replyAuthorData?.id,
                        name: replyAuthorAttrs.name || replyAuthorAttrs.username || 'Anonymous',
                        avatar: getAvatarUrl(replyAuthorAttrs.avatar || replyAuthorData?.avatar),
                        username: replyAuthorAttrs.username,
                    },
                    createdAt: replyAttrs.createdAt || reply.createdAt,
                    publishedAt: replyAttrs.publishedAt || reply.publishedAt,
                };
            });
            
            return {
                id: comment.id || attrs.id,
                documentId: comment.documentId || attrs.documentId,
                content: attrs.content || comment.content,
                author: {
                    id: authorAttrs.id || authorData?.id,
                    name: authorAttrs.name || authorAttrs.username || 'Anonymous',
                    avatar: getAvatarUrl(authorAttrs.avatar || authorData?.avatar),
                    username: authorAttrs.username,
                },
                createdAt: attrs.createdAt || comment.createdAt,
                publishedAt: attrs.publishedAt || comment.publishedAt,
                replies,
            };
        });
    } catch (error) {
        console.error("Error fetching blog comments:", error);
        return [];
    }
}

/**
 * Create a blog comment
 */
export async function createBlogComment(data: CreateBlogCommentData): Promise<BlogComment | null> {
    try {
        // Get author documentId
        let authorNumericId: number | null = null;
        
        if (data.userId) {
            const isNumericId = typeof data.userId === 'number' || (typeof data.userId === 'string' && /^\d+$/.test(data.userId));
            if (isNumericId) {
                authorNumericId = typeof data.userId === 'string' ? Number(data.userId) : data.userId;
            }
        } else {
            // Get current authenticated user
            try {
                const userResponse = await strapi.get('/api/users/me?fields[0]=id&fields[1]=documentId');
                const user = userResponse.data?.data ?? userResponse.data;
                authorNumericId = user?.id ? (typeof user.id === 'number' ? user.id : parseInt(String(user.id))) : null;
            } catch (userError: any) {
                console.error('Error fetching current user for blog comment:', userError);
                throw new Error("User not authenticated. Cannot create comment.");
            }
        }
        
        if (!authorNumericId) {
            throw new Error("Could not resolve author information.");
        }

        // Resolve post ID
        const isNumericPostId = typeof data.postId === 'number' || (typeof data.postId === 'string' && /^\d+$/.test(data.postId));
        let postNumericId: number;
        
        if (isNumericPostId) {
            postNumericId = typeof data.postId === 'string' ? Number(data.postId) : data.postId;
        } else {
            // Try to resolve slug to ID
            const post = await getBlogPostBySlug(String(data.postId));
            if (!post || !post.id) {
                throw new Error("Blog post not found.");
            }
            postNumericId = typeof post.id === 'number' ? post.id : parseInt(String(post.id));
        }

        // Prepare comment data
        const commentData: any = {
            content: data.content,
            posts: postNumericId,
            author: authorNumericId,
            isApproved: true,
        };

        // Add parent comment if it's a reply
        if (data.parentCommentId) {
            const isNumericParentId = typeof data.parentCommentId === 'number' || (typeof data.parentCommentId === 'string' && /^\d+$/.test(data.parentCommentId));
            if (isNumericParentId) {
                commentData.parentComment = typeof data.parentCommentId === 'string' ? Number(data.parentCommentId) : data.parentCommentId;
            }
        }

        // Create the comment
        const response = await strapi.post('/api/blog-comments', {
            data: commentData,
        });

        if (response.data?.data) {
            // Fetch the created comment with populated relations
            const commentId = response.data.data.id || response.data.data.documentId;
            const populateParams = new URLSearchParams();
            populateParams.append('populate[0]', 'author');
            populateParams.append('populate[1]', 'author.avatar');
            
            const fetchResponse = await strapiPublic.get(`/api/blog-comments/${commentId}?${populateParams.toString()}`);
            const comment = fetchResponse.data?.data;
            
            if (comment) {
                const attrs = comment.attributes || comment;
                const authorData = attrs.author?.data || attrs.author;
                const authorAttrs = authorData?.attributes || authorData || {};
                
                return {
                    id: comment.id || attrs.id,
                    documentId: comment.documentId || attrs.documentId,
                    content: attrs.content || comment.content,
                    author: {
                        id: authorAttrs.id || authorData?.id,
                        name: authorAttrs.name || authorAttrs.username || 'Anonymous',
                        avatar: getAvatarUrl(authorAttrs.avatar || authorData?.avatar),
                        username: authorAttrs.username,
                    },
                    createdAt: attrs.createdAt || comment.createdAt,
                    publishedAt: attrs.publishedAt || comment.publishedAt,
                    replies: [],
                };
            }
        }

        return null;
    } catch (error: any) {
        console.error("Error creating blog comment:", error);
        
        if (error.response?.data?.error) {
            const strapiError = error.response.data.error;
            throw new Error(strapiError.message || "Failed to create comment");
        }
        
        throw new Error(error.message || "Failed to create comment");
    }
}

/**
 * Delete a blog post and its associated images
 */
export async function deleteBlogPost(postId: string | number): Promise<boolean> {
    try {
        // Check if user is the author
        const isAuthor = await isBlogPostAuthor(postId);
        if (!isAuthor) {
            throw new Error("You don't have permission to delete this blog post. Only the author can delete.");
        }

        // Get existing post to get image IDs before deletion
        const existingPost = await getBlogPostById(postId) || await getBlogPostBySlug(String(postId));
        if (!existingPost) {
            throw new Error("Blog post not found.");
        }

        // Get documentId for deletion
        let documentId: string | null = null;
        if (existingPost.documentId) {
            documentId = existingPost.documentId;
        } else {
            // Try to resolve documentId
            const isNumericId = typeof postId === 'number' || (typeof postId === 'string' && /^\d+$/.test(postId));
            if (isNumericId) {
                const numericId = typeof postId === 'string' ? Number(postId) : postId;
                const postResponse = await strapiPublic.get(`/api/blog-posts?filters[id][$eq]=${numericId}&fields[0]=documentId`);
                if (postResponse.data?.data && postResponse.data.data.length > 0) {
                    documentId = postResponse.data.data[0].documentId;
                }
            }
        }

        if (!documentId) {
            throw new Error("Could not resolve documentId for blog post.");
        }

        // Fetch full post data to get image IDs
        const fullPostResponse = await strapiPublic.get(`/api/blog-posts/${documentId}?populate[coverImage][fields][0]=id&populate[coverImage][fields][1]=documentId&populate[SEO][populate][ogImage][fields][0]=id&populate[SEO][populate][ogImage][fields][1]=documentId`);
        const fullPost = fullPostResponse.data?.data;
        
        // Collect image IDs to delete
        const imageIdsToDelete: Array<{ id?: number; documentId?: string }> = [];
        
        // Get cover image ID
        if (fullPost?.attributes?.coverImage?.data) {
            const coverImage = fullPost.attributes.coverImage.data;
            if (coverImage.documentId) {
                imageIdsToDelete.push({ documentId: coverImage.documentId });
            } else if (coverImage.id) {
                imageIdsToDelete.push({ id: coverImage.id });
            }
        }
        
        // Get SEO ogImage ID
        if (fullPost?.attributes?.SEO?.ogImage?.data) {
            const ogImage = fullPost.attributes.SEO.ogImage.data;
            if (ogImage.documentId) {
                imageIdsToDelete.push({ documentId: ogImage.documentId });
            } else if (ogImage.id) {
                imageIdsToDelete.push({ id: ogImage.id });
            }
        }

        // Delete the blog post first
        await strapi.delete(`/api/blog-posts/${documentId}`);

        // Delete associated images
        for (const imageId of imageIdsToDelete) {
            try {
                if (imageId.documentId) {
                    await strapi.delete(`/api/upload/files/${imageId.documentId}`);
                } else if (imageId.id) {
                    await strapi.delete(`/api/upload/files/${imageId.id}`);
                }
            } catch (imageError: any) {
                // Log but don't fail if image deletion fails (image might already be deleted or not exist)
                console.warn(`Failed to delete image ${imageId.documentId || imageId.id}:`, imageError.message);
            }
        }

        return true;
    } catch (error: any) {
        console.error("Error deleting blog post:", error);
        
        if (error.response?.data?.error) {
            const strapiError = error.response.data.error;
            throw new Error(strapiError.message || "Failed to delete blog post");
        }
        
        throw new Error(error.message || "Failed to delete blog post");
    }
}

/**
 * Increment blog post views count
 */
export async function incrementBlogPostViews(id: string | number): Promise<void> {
    try {
        // Resolve documentId
        let documentId: string | null = null;
        
        // Check if it's already a documentId
        if (typeof id === 'string' && id.includes('-') && id.length > 20) {
            documentId = id;
        } else {
            // Try to get the post to get documentId
            const post = await getBlogPostById(id) || await getBlogPostBySlug(String(id)) || await getBlogPostByDocumentId(String(id));
            if (post?.documentId) {
                documentId = post.documentId;
            } else if (post?.id) {
                // Try to resolve from numeric ID
                const isNumericId = typeof post.id === 'number' || (typeof post.id === 'string' && /^\d+$/.test(String(post.id)));
                if (isNumericId) {
                    const numericId = typeof post.id === 'string' ? Number(post.id) : post.id;
                    const postResponse = await strapiPublic.get(`/api/blog-posts?filters[id][$eq]=${numericId}&fields[0]=documentId`);
                    if (postResponse.data?.data && postResponse.data.data.length > 0) {
                        documentId = postResponse.data.data[0].documentId;
                    }
                }
            }
        }
        
        if (!documentId) {
            console.warn(`[incrementBlogPostViews] Could not resolve documentId for ID: ${id}`);
            return;
        }
        
        // Fetch current views
        try {
            const currentPostResponse = await strapiPublic.get(
                `/api/blog-posts/${documentId}?fields[0]=views`
            );
            const currentViews = currentPostResponse.data?.data?.attributes?.views ?? 
                                currentPostResponse.data?.data?.views ?? 0;
            
            // Update views using documentId
            await strapi.put(`/api/blog-posts/${documentId}`, {
                data: {
                    views: currentViews + 1,
                }
            });
        } catch (updateError: any) {
            // If update fails due to auth, log warning but don't throw
            if (updateError.response?.status === 401 || updateError.response?.status === 403) {
                console.warn(`[incrementBlogPostViews] Auth required, skipping view increment for ${id}`);
            } else {
                throw updateError;
            }
        }
    } catch (error: any) {
        // Don't throw - views are not critical, fail silently
        if (error.response?.status !== 404) {
            console.warn(`Error incrementing views for blog post ${id}:`, error.message || error);
        }
    }
}

