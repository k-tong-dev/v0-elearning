import { strapiPublic, strapi } from './client';
import { getAvatarUrl } from '@/lib/getAvatarUrl';
import { strapiResponseCache } from '@/lib/cache';

export interface ForumPost {
    id: number;
    documentId: string;
    title?: string; // Fallback
    content: string;
    name: string; // Main field - subject/title
    description?: string; // Description field
    author?: {
        id: number;
        documentId: string;
        username?: string;
        name?: string;
        email?: string;
        avatar?: any;
    };
    category: 'general' | 'courses' | 'technical' | 'projects' | 'career' | 'announcements'; // Enumeration
    forum_status?: 'draft' | 'published' | 'archived' | 'closed'; // Actual field name in Strapi
    status?: 'draft' | 'published' | 'archived' | 'closed'; // Alias for forum_status
    isPinned?: boolean;
    isAnswered?: boolean;
    views?: number;
    repliesCount?: number;
    likes?: number;
    dislikes?: number;
    liked?: number; // Alternative field name
    dislike?: number; // Alternative field name
    lastActivity?: string;
    tags?: Array<{
        id: number;
        name: string;
        code?: string;
    }>;
    forum_tags?: Array<{
        id: number;
        name: string;
        code?: string;
    }>;
    comments?: Array<any>;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string | null;
    locale?: string;
}

export interface ForumCategory {
    id: number;
    name: string;
    description?: string;
    color?: string;
    slug?: string;
    postCount?: number;
}

function parseNumericId(value: any): number | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}

function normalizeForumPost(post: any): ForumPost {
    if (!post) return {} as ForumPost;
    
    const attrs = post.attributes ?? post;
    const id = parseNumericId(post.id ?? attrs.id);
    const documentId = post.documentId ?? attrs.documentId ?? post.id?.toString() ?? '';
    
    // Normalize author
    let author: ForumPost['author'] = undefined;
    if (attrs.author) {
        const authorData = attrs.author.data ?? attrs.author;
        const authorAttrs = authorData?.attributes ?? authorData ?? {};
        const authorId = parseNumericId(authorData?.id ?? authorAttrs.id);
        if (authorId !== undefined) {
            // Extract avatar URL using getAvatarUrl helper
            const avatarSource = authorAttrs.avatar ?? authorData?.avatar;
            const avatarUrl = getAvatarUrl(avatarSource);
            
            // Debug: Log avatar structure if missing
            if (!avatarUrl && avatarSource) {
                console.warn('[normalizeForumPost] Author avatar not resolved:', {
                    hasAvatarSource: !!avatarSource,
                    avatarSourceType: typeof avatarSource,
                    avatarSource: avatarSource,
                });
            }
            
            author = {
                id: authorId,
                documentId: authorData?.documentId ?? authorAttrs.documentId ?? authorId.toString(),
                username: authorAttrs.username ?? authorData?.username ?? authorAttrs.email ?? '',
                name: authorAttrs.name ?? authorAttrs.username ?? authorAttrs.email ?? 'Anonymous',
                email: authorAttrs.email ?? authorData?.email,
                avatar: avatarUrl, // Use resolved URL only
            };
        }
    }
    
    // Normalize tags
    const tags: ForumPost['tags'] = [];
    const forumTags = attrs.forum_tags?.data ?? attrs.forum_tags ?? [];
    if (Array.isArray(forumTags)) {
        for (const tag of forumTags) {
            const tagAttrs = tag.attributes ?? tag;
            const tagId = parseNumericId(tag.id ?? tagAttrs.id);
            if (tagId !== undefined) {
                tags.push({
                    id: tagId,
                    name: tagAttrs.name ?? tag.name ?? '',
                    code: tagAttrs.code ?? tag.code,
                });
            }
        }
    }
    
    // Normalize comments count
    const comments = attrs.comments?.data ?? attrs.comments ?? [];
    const repliesCount = Array.isArray(comments) ? comments.length : (attrs.repliesCount ?? 0);
    
    // Get likes/dislikes (handle both field names)
    const likes = attrs.likes ?? attrs.liked ?? 0;
    const dislikes = attrs.dislikes ?? attrs.dislike ?? 0;
    
    // Category is an enumeration, not a relation - use directly
    const categoryValue = attrs.category ?? 'general';
    
    // Status field is actually 'forum_status' in Strapi schema
    const forumStatus = attrs.forum_status ?? attrs.status ?? 'published';
    
    return {
        id: id ?? 0,
        documentId,
        title: attrs.name ?? attrs.title ?? '', // name is the main field
        content: attrs.content ?? '',
        name: attrs.name ?? '',
        description: attrs.description ?? '',
        author,
        category: categoryValue as 'general' | 'courses' | 'technical' | 'projects' | 'career' | 'announcements',
        forum_status: forumStatus,
        status: forumStatus, // Alias for convenience
        isPinned: attrs.isPinned ?? false,
        isAnswered: attrs.isAnswered ?? false,
        views: attrs.views ?? 0,
        repliesCount,
        likes,
        dislikes,
        liked: likes,
        dislike: dislikes,
        lastActivity: attrs.lastActivity ?? attrs.updatedAt ?? attrs.createdAt,
        tags,
        forum_tags: tags,
        comments: Array.isArray(comments) ? comments : [],
        createdAt: attrs.createdAt,
        updatedAt: attrs.updatedAt,
        publishedAt: attrs.publishedAt,
        locale: attrs.locale,
    };
}

function buildQueryParams(filters?: {
    category?: string;
    status?: string;
    search?: string;
    isPinned?: boolean;
    sortBy?: 'recent' | 'popular' | 'views' | 'replies';
    populate?: string[];
}): string {
    const params = new URLSearchParams();
    
    // Build filters array
    const filterArray: string[] = [];
    let filterIndex = 0;
    
    // Category filter - Skip API filter for enumeration fields (causes 500 errors in Strapi)
    // Will filter in memory instead
    // if (filters?.category && filters.category !== 'all') {
    //     params.append(`filters[${filterIndex}][category][$eq]`, filters.category);
    //     filterIndex++;
    // }
    
    // Status filter - field name is 'forum_status' in Strapi schema
    if (filters?.status && filters.status !== 'all') {
        if (filters.status === 'published') {
            // Use publishedAt to filter published posts
            params.append(`filters[${filterIndex}][publishedAt][$notNull]`, 'true');
        } else {
            // Use forum_status field (the actual field name in schema)
            params.append(`filters[${filterIndex}][forum_status][$eq]`, filters.status);
        }
        filterIndex++;
    }
    
    // Pinned filter
    if (filters?.isPinned !== undefined) {
        params.append(`filters[${filterIndex}][isPinned][$eq]`, String(filters.isPinned));
        filterIndex++;
    }
    
    // Search filter
    if (filters?.search) {
        params.append(`filters[$or][0][title][$containsi]`, filters.search);
        params.append(`filters[$or][1][content][$containsi]`, filters.search);
        // Also search in name/description if they exist
        params.append(`filters[$or][2][name][$containsi]`, filters.search);
        params.append(`filters[$or][3][description][$containsi]`, filters.search);
    }
    
    // Populate relations - Strapi v4 format (simplified to avoid invalid field errors)
    const populateFields = filters?.populate ?? ['author', 'forum_tags', 'comments'];
    if (populateFields.length > 0) {
        // Use simple populate without wildcards to avoid field errors
        params.append('populate[0]', 'author');
        params.append('populate[1]', 'author.avatar'); // Populate author avatar
        params.append('populate[2]', 'forum_tags');
        params.append('populate[3]', 'comments');
        params.append('populate[4]', 'comments.author');
        params.append('populate[5]', 'comments.author.avatar'); // Populate comment author avatar
        params.append('populate[6]', 'comments.replies');
        params.append('populate[7]', 'comments.replies.author');
        params.append('populate[8]', 'comments.replies.author.avatar'); // Populate reply author avatar
    }
    
    // Sorting - use safe fallbacks
    let sortField = 'createdAt:desc';
    if (filters?.sortBy) {
        switch (filters.sortBy) {
            case 'popular':
                // Try likes, fallback to createdAt
                sortField = 'likes:desc,createdAt:desc';
                break;
            case 'views':
                // Try views, fallback to createdAt
                sortField = 'views:desc,createdAt:desc';
                break;
            case 'replies':
                // Try repliesCount, fallback to createdAt
                sortField = 'repliesCount:desc,createdAt:desc';
                break;
            case 'recent':
            default:
                // Try lastActivity, fallback to updatedAt, then createdAt
                sortField = 'updatedAt:desc,createdAt:desc';
                break;
        }
    }
    params.append('sort', sortField);
    
    // Pagination
    params.append('pagination[pageSize]', '100');
    
    return params.toString();
}

/**
 * Get all forum posts
 */
export async function getForumPosts(filters?: {
    category?: string;
    status?: string;
    search?: string;
    isPinned?: boolean;
    sortBy?: 'recent' | 'popular' | 'views' | 'replies';
    page?: number;
    pageSize?: number;
}): Promise<{ data: ForumPost[]; pagination?: { page: number; pageSize: number; pageCount?: number; total?: number } }> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 6;
    const cacheKey = `forum-posts-${JSON.stringify(filters)}-page-${page}`;
    const cached = strapiResponseCache.get<{ data: ForumPost[]; pagination?: any }>(cacheKey);
    if (cached) return cached;
    
    try {
        // Always filter category in memory (never send to API to avoid 500 errors)
        // Build query without category filter
        const apiFilters = { ...filters };
        const categoryFilter = apiFilters.category;
        delete apiFilters.category; // Remove category from API call
        
        // Build query with pagination
        const queryParams = buildQueryParams(apiFilters);
        const params = new URLSearchParams(queryParams);
        params.set('pagination[page]', String(page));
        params.set('pagination[pageSize]', String(pageSize));
        
        const query = params.toString();
        const response = await strapiPublic.get(`/api/forum-forums?${query}`);
        let posts = (response.data?.data ?? []).map(normalizeForumPost);
        
        // Filter by category in memory
        if (categoryFilter && categoryFilter !== 'all') {
            posts = posts.filter((p: ForumPost) => p.category === categoryFilter);
        }
        
        const pagination = response.data?.meta?.pagination;
        const result = { 
            data: posts,
            pagination: pagination ? {
                page: pagination.page ?? page,
                pageSize: pagination.pageSize ?? pageSize,
                pageCount: pagination.pageCount,
                total: pagination.total,
            } : undefined
        };
        
        strapiResponseCache.set(cacheKey, result, { ttlMs: 60000 }); // Cache for 60 seconds
        return result;
    } catch (error: any) {
        console.error('Error fetching forum posts:', error);
        
        // If error is due to invalid filter (400 or 500), try without problematic filters and filter in memory
        if (error.response?.status === 400 || error.response?.status === 500) {
            console.warn('Retrying without filters (will filter in memory)...');
            try {
                // Fetch all posts without any filters
                const retryFilters: any = {};
                if (filters?.sortBy) {
                    retryFilters.sortBy = filters.sortBy;
                }
                if (filters?.isPinned !== undefined) {
                    retryFilters.isPinned = filters.isPinned;
                }
                
                const query = buildQueryParams(retryFilters);
                const response = await strapiPublic.get(`/api/forum-forums?${query}`);
                let posts = (response.data?.data ?? []).map(normalizeForumPost);
                
                // Filter in memory
                // Filter by category in memory
                if (filters?.category && filters.category !== 'all') {
                    posts = posts.filter((p: ForumPost) => p.category === filters.category);
                }
                
                // Filter by status in memory
                if (filters?.status && filters.status !== 'all') {
                    if (filters.status === 'published') {
                        posts = posts.filter((p: ForumPost) => p.publishedAt !== null && p.publishedAt !== undefined);
                    } else {
                        posts = posts.filter((p: ForumPost) => (p.status === filters.status || p.forum_status === filters.status));
                    }
                }
                
                // Filter by search in memory
                if (filters?.search) {
                    const searchLower = filters.search.toLowerCase();
                    posts = posts.filter((p: ForumPost) => 
                        (p.name || p.title || '').toLowerCase().includes(searchLower) ||
                        (p.content || '').toLowerCase().includes(searchLower) ||
                        (p.description || '').toLowerCase().includes(searchLower) ||
                        (p.tags || []).some((tag: any) => {
                            // Tags are objects with name and code properties
                            const name = tag?.name;
                            const code = tag?.code;
                            if (name && typeof name === 'string') {
                                return name.toLowerCase().includes(searchLower);
                            }
                            if (code && typeof code === 'string') {
                                return code.toLowerCase().includes(searchLower);
                            }
                            return false;
                        })
                    );
                }
                
                const result = { 
                    data: Array.isArray(posts) ? posts : [],
                    pagination: {
                        page: page,
                        pageSize: pageSize,
                        pageCount: Array.isArray(posts) ? Math.ceil(posts.length / pageSize) : 0,
                        total: Array.isArray(posts) ? posts.length : 0,
                    }
                };
                strapiResponseCache.set(cacheKey, result, { ttlMs: 60000 });
                return result;
            } catch (retryError: any) {
                console.error('Retry also failed:', retryError);
            }
        }
        
        // Return empty result in correct format instead of throwing to prevent UI crashes
        console.warn('Returning empty result due to fetch error');
        return {
            data: [],
            pagination: {
                page: page,
                pageSize: pageSize,
                pageCount: 0,
                total: 0,
            }
        };
    }
}

/**
 * Get a single forum post by ID (supports both numeric ID and documentId)
 */
export async function getForumPost(id: string | number): Promise<ForumPost | null> {
    const cacheKey = `forum-post-${id}`;
    const cached = strapiResponseCache.get<ForumPost>(cacheKey);
    if (cached) return cached;
    
    try {
        // Build populate query - use simple array format
        const populateParams = new URLSearchParams();
        populateParams.append('populate[0]', 'author');
        populateParams.append('populate[1]', 'author.avatar'); // Populate author avatar
        populateParams.append('populate[2]', 'forum_tags');
        populateParams.append('populate[3]', 'comments');
        populateParams.append('populate[4]', 'comments.author');
        populateParams.append('populate[5]', 'comments.author.avatar'); // Populate comment author avatar
        populateParams.append('populate[6]', 'comments.replies');
        populateParams.append('populate[7]', 'comments.replies.author');
        populateParams.append('populate[8]', 'comments.replies.author.avatar'); // Populate reply author avatar
        populateParams.append('populate[9]', 'comments.parentComment');
        
        const populateQuery = populateParams.toString();
        
        // Check if it's a numeric ID vs documentId
        const isNumericId = typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id));
        
        let response;
        if (isNumericId) {
            // For numeric IDs, use filter query (Strapi v5 doesn't support numeric ID in URL path)
            const numericId = typeof id === 'string' ? Number(id) : id;
            response = await strapiPublic.get(
                `/api/forum-forums?filters[id][$eq]=${numericId}&${populateQuery}`
            );
            
            // Extract from array response
            if (response.data?.data && response.data.data.length > 0) {
                const rawPost = response.data.data[0];
                const post = normalizeForumPost(rawPost);
                
                // CRITICAL: Verify the post ID matches the requested ID
                // If it doesn't match, log a warning but still return the post
                // The caller should use the route parameter ID, not this ID
                const postId = post.id;
                if (postId && String(postId) !== String(numericId)) {
                    console.warn(`[getForumPost] ID mismatch! Requested: ${numericId}, Got: ${postId}. Caller should use route parameter ID.`);
                }
                
                if (post.id) {
                    strapiResponseCache.set(cacheKey, post, { ttlMs: 60000 });
                    return post;
                }
            }
            return null;
        } else {
            // For documentId (string), try direct lookup first
            try {
                response = await strapiPublic.get(`/api/forum-forums/${id}?${populateQuery}`);
                const post = normalizeForumPost(response.data?.data);
                if (post.id) {
                    strapiResponseCache.set(cacheKey, post, { ttlMs: 60000 });
                    return post;
                }
            } catch (directError: any) {
                // If direct lookup fails, try filtering by documentId
                if (directError.response?.status === 404) {
                    response = await strapiPublic.get(
                        `/api/forum-forums?filters[documentId][$eq]=${encodeURIComponent(String(id))}&${populateQuery}`
                    );
                    
                    if (response.data?.data && response.data.data.length > 0) {
                        const post = normalizeForumPost(response.data.data[0]);
                        if (post.id) {
                            strapiResponseCache.set(cacheKey, post, { ttlMs: 60000 });
                            return post;
                        }
                    }
                }
                throw directError;
            }
        }
        
        return null;
    } catch (error: any) {
        console.error(`Error fetching forum post ${id}:`, error);
        if (error.response?.status === 404) return null;
        // Don't throw, return null to prevent crashes
        return null;
    }
}

/**
 * Helper to resolve documentId from numeric ID or documentId
 */
async function resolveDocumentId(collection: string, id: string | number): Promise<string | null> {
    try {
        // If it's already a documentId format, return it
        if (typeof id === 'string' && id.includes('-')) {
            return id;
        }
        
        // Check if it's a numeric ID
        const isNumericId = typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id));
        
        if (isNumericId) {
            // For numeric IDs, use filter query (Strapi v5 doesn't support numeric ID in URL path)
            const numericId = typeof id === 'string' ? Number(id) : id;
            const response = await strapiPublic.get(
                `/api/${collection}?filters[id][$eq]=${numericId}&fields[0]=documentId`
            );
            
            // Extract from array response
            if (response.data?.data && response.data.data.length > 0) {
                const item = response.data.data[0];
                const docId = item.documentId ?? item.attributes?.documentId;
                return docId || null;
            }
        } else {
            // For documentId (string), try direct lookup
            try {
                const response = await strapiPublic.get(`/api/${collection}/${id}?fields[0]=documentId`);
                const docId = response.data?.data?.documentId ?? response.data?.data?.attributes?.documentId;
                return docId || null;
            } catch (directError: any) {
                // If direct lookup fails, try filtering by documentId
                if (directError.response?.status === 404) {
                    const response = await strapiPublic.get(
                        `/api/${collection}?filters[documentId][$eq]=${encodeURIComponent(String(id))}&fields[0]=documentId`
                    );
                    
                    if (response.data?.data && response.data.data.length > 0) {
                        const item = response.data.data[0];
                        const docId = item.documentId ?? item.attributes?.documentId;
                        return docId || null;
                    }
                }
                throw directError;
            }
        }
        
        return null;
    } catch (error) {
        console.warn(`Failed to resolve documentId for ${collection}:${id}`, error);
        return null;
    }
}

/**
 * Create a new forum post
 */
export async function createForumPost(data: {
    name: string; // subject/title
    description: string; // description
    content: string; // content
    category: string; // category (could be enum or relation)
    tags?: string[];
    status?: 'draft' | 'published' | 'archived' | 'closed';
    isAnswered?: boolean;
    authorId?: string | number; // Optional: allow passing author ID directly
}): Promise<ForumPost> {
    try {
        // Get current authenticated user for author relation
        let authorNumericId: number | null = null;
        let authorDocumentId: string | null = null;
        
        // If authorId is provided, use it directly
        if (data.authorId) {
            const isNumericId = typeof data.authorId === 'number' || (typeof data.authorId === 'string' && /^\d+$/.test(data.authorId));
            if (isNumericId) {
                authorNumericId = typeof data.authorId === 'string' ? Number(data.authorId) : data.authorId;
            } else {
                // It's a documentId, try to resolve numeric ID
                try {
                    const userLookup = await strapiPublic.get(`/api/users?filters[documentId][$eq]=${encodeURIComponent(String(data.authorId))}&fields[0]=id`);
                    if (userLookup.data?.data && userLookup.data.data.length > 0) {
                        authorNumericId = userLookup.data.data[0].id ?? userLookup.data.data[0].attributes?.id ?? null;
                    }
                } catch (error) {
                    console.warn('Failed to resolve author numeric ID from documentId:', error);
                }
            }
        } else {
            // Try to get current authenticated user
            try {
                const userResponse = await strapi.get('/api/users/me?fields[0]=id&fields[1]=documentId');
                const user = userResponse.data?.data ?? userResponse.data;
                authorNumericId = user?.id ? (typeof user.id === 'number' ? user.id : parseInt(String(user.id))) : null;
                authorDocumentId = user?.documentId ?? null;
                
                // If no numeric ID but have documentId, try to resolve
                if (!authorNumericId && authorDocumentId) {
                    try {
                        const userLookup = await strapiPublic.get(`/api/users?filters[documentId][$eq]=${encodeURIComponent(authorDocumentId)}&fields[0]=id`);
                        if (userLookup.data?.data && userLookup.data.data.length > 0) {
                            authorNumericId = userLookup.data.data[0].id ?? userLookup.data.data[0].attributes?.id ?? null;
                        }
                    } catch (error) {
                        console.warn('Failed to resolve author numeric ID:', error);
                    }
                }
            } catch (userError: any) {
                // User not authenticated - log error but allow post creation
                console.warn('User not authenticated, creating post without author:', userError.message);
                // Continue without author - Strapi might allow this or set a default
            }
        }
        
        const payload: any = {
            data: {
                name: data.name,
                description: data.description,
                content: data.content,
                category: data.category, // Will be enum value
                isPinned: false,
                isAnswered: data.isAnswered ?? false,
                views: 0,
                repliesCount: 0,
                likes: 0,
                dislikes: 0,
            }
        };
        
        // Connect author using numeric ID (preferred for manyToOne relations)
        if (authorNumericId) {
            payload.data.author = { connect: [{ id: authorNumericId }] };
        } else if (authorDocumentId) {
            // Fallback to documentId if numeric ID not available
            payload.data.author = { connect: [{ documentId: authorDocumentId }] };
        }
        
        // Status field is 'forum_status' in Strapi schema
        if (data.status) {
            payload.data.forum_status = data.status;
        }
        
        // Set publishedAt if status is published (for draftAndPublish)
        if (data.status === 'published' || !data.status) {
            payload.data.publishedAt = new Date().toISOString();
        }
        
        // Handle tags if provided - find or create tags and connect them using documentId
        if (data.tags && data.tags.length > 0) {
            try {
                const tagConnections: Array<{ documentId: string }> = [];
                
                for (const tagInput of data.tags) {
                    const tagName = tagInput.trim();
                    if (!tagName) continue;
                    
                    // Try to find existing tag by name or code
                    try {
                        const tagResponse = await strapiPublic.get(`/api/forum-tags?filters[$or][0][name][$eq]=${encodeURIComponent(tagName)}&filters[$or][1][code][$eq]=${encodeURIComponent(tagName)}&fields[0]=documentId`);
                        const existingTags = tagResponse.data?.data ?? [];
                        
                        if (existingTags.length > 0) {
                            // Use existing tag - get documentId
                            const tag = existingTags[0];
                            const tagDocId = tag.documentId ?? tag.attributes?.documentId;
                            if (tagDocId) {
                                tagConnections.push({ documentId: tagDocId });
                            } else {
                                // Fallback: try to resolve documentId from numeric ID
                                const tagId = tag.id ?? tag.attributes?.id;
                                if (tagId) {
                                    const docId = await resolveDocumentId('forum-tags', tagId);
                                    if (docId) {
                                        tagConnections.push({ documentId: docId });
                                    }
                                }
                            }
                        } else {
                            // Create new tag if authenticated user
                            try {
                                const createTagResponse = await strapi.post('/api/forum-tags', {
                                    data: {
                                        name: tagName,
                                        code: tagName.toLowerCase().replace(/\s+/g, '-'),
                                    }
                                });
                                const newTag = createTagResponse.data?.data;
                                const tagDocId = newTag?.documentId ?? newTag?.attributes?.documentId;
                                if (tagDocId) {
                                    tagConnections.push({ documentId: tagDocId });
                                } else if (newTag?.id) {
                                    // Fallback: resolve documentId
                                    const docId = await resolveDocumentId('forum-tags', newTag.id);
                                    if (docId) {
                                        tagConnections.push({ documentId: docId });
                                    }
                                }
                            } catch (createError) {
                                console.warn(`Failed to create tag "${tagName}":`, createError);
                                // Continue without this tag
                            }
                        }
                    } catch (findError) {
                        console.warn(`Failed to find tag "${tagName}":`, findError);
                        // Continue without this tag
                    }
                }
                
                // Connect tags if any were found/created - use documentId
                if (tagConnections.length > 0) {
                    payload.data.forum_tags = {
                        connect: tagConnections
                    };
                }
            } catch (tagError) {
                console.warn('Error processing tags:', tagError);
                // Continue without tags - they're optional
            }
        }
        
        // Category is an enumeration field in Strapi schema, not a relation
        // Just use the enum value directly: "general", "courses", "technical", "projects", "career", "announcements"
        // No need to handle as relation - it's already set above
        
        const response = await strapi.post('/api/forum-forums', payload);
        const post = normalizeForumPost(response.data?.data);
        
        // Clear cache
        strapiResponseCache.clear();
        
        return post;
    } catch (error: any) {
        console.error('Error creating forum post:', error);
        const errorMessage = error.response?.data?.error?.message 
            ?? error.response?.data?.message
            ?? error.message
            ?? 'Failed to create forum post';
        throw new Error(errorMessage);
    }
}

/**
 * Update a forum post
 */
export async function updateForumPost(
    id: string | number,
    data: Partial<{
        name?: string;
        description?: string;
        content?: string;
        category?: 'general' | 'courses' | 'technical' | 'projects' | 'career' | 'announcements';
        tags?: string[];
        forum_status?: 'draft' | 'published' | 'archived' | 'closed';
        status?: 'draft' | 'published' | 'archived' | 'closed'; // Alias for forum_status
        isPinned?: boolean;
        isAnswered?: boolean;
    }>
): Promise<ForumPost> {
    try {
        // Resolve documentId for the post (Strapi v5 requires documentId for updates)
        let postDocId: string | null = null;
        
        if (typeof id === 'string' && id.includes('-')) {
            // Already a documentId
            postDocId = id;
        } else {
            // First try to fetch the post to get documentId (most reliable)
            try {
                const post = await getForumPost(id);
                if (post) {
                    // Check if post has documentId property (we added it earlier)
                    const docId = (post as any).documentId;
                    if (docId) {
                        postDocId = docId;
                    } else {
                        // Try to resolve from the post's id
                        postDocId = await resolveDocumentId('forum-forums', post.id);
                    }
                }
            } catch (fetchError: any) {
                console.warn('Failed to fetch post to get documentId, trying resolveDocumentId:', fetchError);
            }
            
            // If still no documentId, try resolveDocumentId directly
            if (!postDocId) {
                postDocId = await resolveDocumentId('forum-forums', id);
            }
            
            // Last resort: try using the ID directly if it looks like a documentId
            if (!postDocId && typeof id === 'string') {
                // Check if it might be a documentId format we missed
                const testResponse = await strapiPublic.get(`/api/forum-forums/${id}?fields[0]=documentId`);
                if (testResponse.data?.data) {
                    const docId = testResponse.data.data.documentId ?? testResponse.data.data.attributes?.documentId;
                    if (docId) {
                        postDocId = docId;
                    } else {
                        // If direct lookup worked, use the ID as documentId
                        postDocId = id;
                    }
                }
            }
        }
        
        if (!postDocId) {
            throw new Error(`Failed to resolve forum post documentId for ID: ${id}. Please ensure the post exists.`);
        }
        
        const payload: any = {
            data: {}
        };
        
        if (data.name !== undefined) payload.data.name = data.name;
        if (data.description !== undefined) payload.data.description = data.description;
        if (data.content !== undefined) payload.data.content = data.content;
        if (data.category !== undefined) payload.data.category = data.category; // Enum value
        // Status field is 'forum_status' in Strapi schema
        if (data.forum_status !== undefined) {
            payload.data.forum_status = data.forum_status;
        } else if (data.status !== undefined) {
            payload.data.forum_status = data.status; // Alias support
        }
        if (data.isPinned !== undefined) payload.data.isPinned = data.isPinned;
        if (data.isAnswered !== undefined) payload.data.isAnswered = data.isAnswered;
        
        // Handle tags if provided - find or create tags and connect them using documentId
        if (data.tags && data.tags.length > 0) {
            try {
                const tagConnections: Array<{ documentId: string }> = [];
                
                for (const tagInput of data.tags) {
                    const tagName = tagInput.trim();
                    if (!tagName) continue;
                    
                    // Try to find existing tag by name or code
                    try {
                        const tagResponse = await strapiPublic.get(`/api/forum-tags?filters[$or][0][name][$eq]=${encodeURIComponent(tagName)}&filters[$or][1][code][$eq]=${encodeURIComponent(tagName)}&fields[0]=documentId`);
                        
                        if (tagResponse.data?.data && tagResponse.data.data.length > 0) {
                            const tag = tagResponse.data.data[0];
                            const docId = tag.documentId ?? tag.attributes?.documentId;
                            if (docId) {
                                tagConnections.push({ documentId: docId });
                            } else {
                                // Fallback: resolve documentId from numeric ID
                                const tagId = tag.id;
                                if (tagId) {
                                    const docId = await resolveDocumentId('forum-tags', tagId);
                                    if (docId) {
                                        tagConnections.push({ documentId: docId });
                                    }
                                }
                            }
                        } else {
                            // Tag doesn't exist, create it
                            try {
                                const createTagResponse = await strapi.post('/api/forum-tags', {
                                    data: {
                                        name: tagName,
                                        code: tagName.toLowerCase().replace(/\s+/g, '-'),
                                    }
                                });
                                
                                const newTag = createTagResponse.data?.data;
                                if (newTag) {
                                    const docId = newTag.documentId ?? newTag.attributes?.documentId;
                                    if (docId) {
                                        tagConnections.push({ documentId: docId });
                                    } else {
                                        // Fallback: resolve documentId
                                        const docId = await resolveDocumentId('forum-tags', newTag.id);
                                        if (docId) {
                                            tagConnections.push({ documentId: docId });
                                        }
                                    }
                                }
                            } catch (createError) {
                                console.warn(`Failed to create tag "${tagName}":`, createError);
                            }
                        }
                    } catch (fetchError) {
                        console.warn(`Failed to fetch tag "${tagName}":`, fetchError);
                    }
                }
                
                // Connect tags if any were found/created - use documentId
                if (tagConnections.length > 0) {
                    payload.data.forum_tags = {
                        connect: tagConnections
                    };
                } else {
                    // If no tags to connect, disconnect all tags (clear tags)
                    payload.data.forum_tags = {
                        disconnect: []
                    };
                }
            } catch (tagError) {
                console.warn('Error processing tags:', tagError);
                // Continue without tags - they're optional
            }
        } else if (data.tags !== undefined && data.tags.length === 0) {
            // Explicitly clear tags if empty array is passed
            payload.data.forum_tags = {
                disconnect: []
            };
        }
        
        // Use documentId for the update
        const response = await strapi.put(`/api/forum-forums/${postDocId}`, payload);
        const post = normalizeForumPost(response.data?.data);
        
        // Clear cache
        strapiResponseCache.clear();
        
        return post;
    } catch (error: any) {
        console.error(`Error updating forum post ${id}:`, error);
        throw new Error(error.response?.data?.error?.message ?? 'Failed to update forum post');
    }
}

/**
 * Delete a forum post
 */
export async function deleteForumPost(id: string | number): Promise<void> {
    try {
        await strapi.delete(`/api/forum-forums/${id}`);
        
        // Clear cache
        strapiResponseCache.clear();
    } catch (error: any) {
        console.error(`Error deleting forum post ${id}:`, error);
        throw new Error(error.response?.data?.error?.message ?? 'Failed to delete forum post');
    }
}

/**
 * Increment view count for a forum post
 */
export async function incrementForumPostViews(id: string | number): Promise<void> {
    try {
        // CRITICAL: Resolve documentId directly without fetching the full post
        // This prevents ID mismatches and ensures we use the correct identifier
        let documentId: string | null = null;
        
        // Check if it's already a documentId
        if (typeof id === 'string' && id.includes('-')) {
            documentId = id;
        } else {
            // Resolve documentId from numeric ID
            documentId = await resolveDocumentId('forum-forums', id);
        }
        
        if (!documentId) {
            console.warn(`[incrementForumPostViews] Could not resolve documentId for ID: ${id}`);
            return;
        }
        
        // Fetch current views without using getForumPost to avoid ID conflicts
        // Use a lightweight query to get just the views field
        try {
            const currentPostResponse = await strapiPublic.get(
                `/api/forum-forums/${documentId}?fields[0]=views&fields[1]=lastActivity`
            );
            const currentViews = currentPostResponse.data?.data?.attributes?.views ?? 
                                currentPostResponse.data?.data?.views ?? 0;
            
            // Update views and lastActivity using documentId
            await strapi.put(`/api/forum-forums/${documentId}`, {
                data: {
                    views: currentViews + 1,
                    lastActivity: new Date().toISOString(),
                }
            });
            
            // Clear cache to ensure fresh data on next fetch
            strapiResponseCache.clear();
        } catch (updateError: any) {
            // If lightweight fetch fails, try with public API (might not have auth)
            if (updateError.response?.status === 401 || updateError.response?.status === 403) {
                // Use public API for view increment (if Strapi allows it)
                console.warn(`[incrementForumPostViews] Auth required, skipping view increment for ${id}`);
            } else {
                throw updateError;
            }
        }
    } catch (error: any) {
        // Don't throw - views are not critical, fail silently
        // Only log if it's not a 404 (which might be expected for some posts)
        if (error.response?.status !== 404) {
            console.warn(`Error incrementing views for forum post ${id}:`, error.message || error);
        }
    }
}

/**
 * Create a forum comment
 */
export async function createForumComment(
    forumPostId: string | number,
    data: {
        content: string;
        parentCommentId?: string | number;
        userId?: string | number; // Optional: pass user ID directly to avoid fetching /api/users/me
    }
): Promise<any> {
    try {
        // Resolve documentId for forumPost relation
        // First check if it's already a documentId
        let postDocId: string | null = null;
        
        if (typeof forumPostId === 'string' && forumPostId.includes('-')) {
            // Already a documentId
            postDocId = forumPostId;
        } else {
            // Try to resolve it
            postDocId = await resolveDocumentId('forum-forums', forumPostId);
            
            // If that fails, try fetching the post directly to get documentId
            if (!postDocId) {
                try {
                    const post = await getForumPost(forumPostId);
                    if (post && post.documentId) {
                        postDocId = post.documentId;
                    }
                } catch (fetchError) {
                    console.warn('Failed to fetch post to get documentId:', fetchError);
                }
            }
        }
        
        if (!postDocId) {
            throw new Error(`Failed to resolve forum post documentId for ID: ${forumPostId}`);
        }
        
        // Get author documentId - use provided userId if available, otherwise fetch current user
        let authorDocumentId: string | null = null;
        
        if (data.userId) {
            // Use provided user ID
            // Check if it's numeric (should be resolved) or documentId (use directly)
            const isNumericId = typeof data.userId === 'number' || (typeof data.userId === 'string' && /^\d+$/.test(data.userId));
            
            if (isNumericId) {
                // Resolve documentId from numeric ID
                authorDocumentId = await resolveDocumentId('users', data.userId);
            } else {
                // Assume it's already a documentId (non-numeric string)
                authorDocumentId = String(data.userId);
            }
            
            if (!authorDocumentId) {
                throw new Error(`Could not resolve author document ID for user: ${data.userId}`);
            }
        } else {
            // Fallback: fetch current authenticated user
            try {
                const userResponse = await strapi.get('/api/users/me?fields[0]=id&fields[1]=documentId');
                const user = userResponse.data?.data ?? userResponse.data;
                authorDocumentId = user?.documentId;
                
                // If no documentId, try to resolve from numeric ID
                if (!authorDocumentId && user?.id) {
                    authorDocumentId = await resolveDocumentId('users', user.id);
                }
            } catch (userError: any) {
                console.error('Error fetching current user:', userError);
                throw new Error("User not authenticated. Cannot create comment.");
            }
            
            if (!authorDocumentId) {
                throw new Error("Could not resolve author document ID.");
            }
        }
        
        const payload: any = {
            data: {
                // Schema shows field name is 'attributes' (richtext type)
                attributes: data.content,
                forumPost: { connect: [{ documentId: postDocId }] },
                author: { connect: [{ documentId: authorDocumentId }] },
                likes: 0,
                dislikes: 0,
            }
        };

        if (data.parentCommentId) {
            // Resolve documentId for parentComment relation
            const parentDocId = await resolveDocumentId('forum-comments', data.parentCommentId);
            if (parentDocId) {
                payload.data.parentComment = { connect: [{ documentId: parentDocId }] };
            }
        }

        // Create comment
        const response = await strapi.post('/api/forum-comments', payload);
        
        // Fetch the created comment with populated relations to get author data
        const createdComment = response.data?.data;
        const createdCommentId = createdComment?.documentId ?? createdComment?.id;
        
        if (createdCommentId) {
            try {
                // Fetch the comment with populated author and avatar
                const populateParams = new URLSearchParams();
                populateParams.append('populate[0]', 'author');
                populateParams.append('populate[1]', 'author.avatar');
                populateParams.append('populate[2]', 'forumPost');
                populateParams.append('populate[3]', 'parentComment');
                
                // Check if it's a numeric ID or documentId
                const isNumericId = typeof createdCommentId === 'number' || (typeof createdCommentId === 'string' && /^\d+$/.test(createdCommentId));
                
                let commentResponse;
                if (isNumericId) {
                    // Use filter query for numeric IDs
                    const numericId = typeof createdCommentId === 'string' ? Number(createdCommentId) : createdCommentId;
                    commentResponse = await strapiPublic.get(
                        `/api/forum-comments?filters[id][$eq]=${numericId}&${populateParams.toString()}`
                    );
                    // Extract from array response
                    if (commentResponse.data?.data && commentResponse.data.data.length > 0) {
                        commentResponse.data.data = commentResponse.data.data[0];
                    }
                } else {
                    // Use documentId for direct lookup
                    commentResponse = await strapiPublic.get(
                        `/api/forum-comments/${createdCommentId}?${populateParams.toString()}`
                    );
                }
                
                // Update post replies count (non-blocking)
                try {
                    const post = await getForumPost(forumPostId);
                    if (post) {
                        const postId = post.documentId || forumPostId;
                        await strapi.put(`/api/forum-forums/${postId}`, {
                            data: {
                                repliesCount: (post.repliesCount || 0) + 1,
                                lastActivity: new Date().toISOString(),
                            }
                        });
                    }
                } catch (updateError) {
                    console.warn('Failed to update post replies count:', updateError);
                    // Don't throw - comment was created successfully
                }

                // Clear cache
                strapiResponseCache.clear();
                
                // Return the populated comment
                return commentResponse.data?.data ?? createdComment;
            } catch (fetchError) {
                console.warn('Failed to fetch created comment with relations, returning basic response:', fetchError);
                // Clear cache anyway
                strapiResponseCache.clear();
                return createdComment;
            }
        }
        
        // Clear cache
        strapiResponseCache.clear();
        
        return createdComment;
    } catch (error: any) {
        console.error('Error creating forum comment:', error);
        const errorMessage = error.response?.data?.error?.message 
            ?? error.response?.data?.message
            ?? error.message
            ?? 'Failed to create comment';
        throw new Error(errorMessage);
    }
}

/**
 * Like a forum comment
 */
export async function likeForumComment(commentId: string | number): Promise<any> {
    try {
        // Resolve documentId for the comment
        const commentDocId = await resolveDocumentId('forum-comments', commentId);
        if (!commentDocId) {
            throw new Error(`Failed to resolve comment documentId for ID: ${commentId}`);
        }
        
        // Fetch current comment to get current likes count
        try {
            const commentResponse = await strapiPublic.get(`/api/forum-comments/${commentDocId}?fields[0]=likes&fields[1]=dislikes`);
            const currentComment = commentResponse.data?.data;
            const currentLikes = currentComment?.attributes?.likes ?? currentComment?.likes ?? 0;
            const currentDislikes = currentComment?.attributes?.dislikes ?? currentComment?.dislikes ?? 0;
            
            // Increment likes, and if there were dislikes, decrement them (user switching from dislike to like)
            const newLikes = currentLikes + 1;
            const newDislikes = Math.max(0, currentDislikes - 1); // Prevent negative
            
            // Update the comment
            const updateResponse = await strapi.put(`/api/forum-comments/${commentDocId}`, {
                data: {
                    likes: newLikes,
                    dislikes: newDislikes,
                }
            });
            
            // Clear cache
            strapiResponseCache.clear();
            
            return {
                ...updateResponse.data?.data,
                likes: newLikes,
                dislikes: newDislikes,
            };
        } catch (fetchError: any) {
            // If fetch fails, try to increment anyway
            const updateResponse = await strapi.put(`/api/forum-comments/${commentDocId}`, {
                data: {
                    likes: { $inc: 1 }, // Try increment operator, might not work in Strapi
                }
            });
            strapiResponseCache.clear();
            return updateResponse.data?.data;
        }
    } catch (error: any) {
        console.error(`Error liking forum comment ${commentId}:`, error);
        throw new Error(error.response?.data?.error?.message ?? 'Failed to like comment');
    }
}

/**
 * Dislike a forum comment
 */
export async function dislikeForumComment(commentId: string | number): Promise<any> {
    try {
        // Resolve documentId for the comment
        const commentDocId = await resolveDocumentId('forum-comments', commentId);
        if (!commentDocId) {
            throw new Error(`Failed to resolve comment documentId for ID: ${commentId}`);
        }
        
        // Fetch current comment to get current likes/dislikes count
        try {
            const commentResponse = await strapiPublic.get(`/api/forum-comments/${commentDocId}?fields[0]=likes&fields[1]=dislikes`);
            const currentComment = commentResponse.data?.data;
            const currentLikes = currentComment?.attributes?.likes ?? currentComment?.likes ?? 0;
            const currentDislikes = currentComment?.attributes?.dislikes ?? currentComment?.dislikes ?? 0;
            
            // Increment dislikes, and if there were likes, decrement them (user switching from like to dislike)
            const newDislikes = currentDislikes + 1;
            const newLikes = Math.max(0, currentLikes - 1); // Prevent negative
            
            // Update the comment
            const updateResponse = await strapi.put(`/api/forum-comments/${commentDocId}`, {
                data: {
                    likes: newLikes,
                    dislikes: newDislikes,
                }
            });
            
            // Clear cache
            strapiResponseCache.clear();
            
            return {
                ...updateResponse.data?.data,
                likes: newLikes,
                dislikes: newDislikes,
            };
        } catch (fetchError: any) {
            // If fetch fails, try to increment anyway
            const updateResponse = await strapi.put(`/api/forum-comments/${commentDocId}`, {
                data: {
                    dislikes: { $inc: 1 }, // Try increment operator, might not work in Strapi
                }
            });
            strapiResponseCache.clear();
            return updateResponse.data?.data;
        }
    } catch (error: any) {
        console.error(`Error disliking forum comment ${commentId}:`, error);
        throw new Error(error.response?.data?.error?.message ?? 'Failed to dislike comment');
    }
}

/**
 * Remove like from a forum comment (toggle off)
 */
export async function unlikeForumComment(commentId: string | number): Promise<any> {
    try {
        const commentDocId = await resolveDocumentId('forum-comments', commentId);
        if (!commentDocId) {
            throw new Error(`Failed to resolve comment documentId for ID: ${commentId}`);
        }
        
        const commentResponse = await strapiPublic.get(`/api/forum-comments/${commentDocId}?fields[0]=likes`);
        const currentComment = commentResponse.data?.data;
        const currentLikes = currentComment?.attributes?.likes ?? currentComment?.likes ?? 0;
        const newLikes = Math.max(0, currentLikes - 1);
        
        const updateResponse = await strapi.put(`/api/forum-comments/${commentDocId}`, {
            data: {
                likes: newLikes,
            }
        });
        
        strapiResponseCache.clear();
        return {
            ...updateResponse.data?.data,
            likes: newLikes,
        };
    } catch (error: any) {
        console.error(`Error unliking forum comment ${commentId}:`, error);
        throw new Error(error.response?.data?.error?.message ?? 'Failed to unlike comment');
    }
}

/**
 * Remove dislike from a forum comment (toggle off)
 */
export async function undislikeForumComment(commentId: string | number): Promise<any> {
    try {
        const commentDocId = await resolveDocumentId('forum-comments', commentId);
        if (!commentDocId) {
            throw new Error(`Failed to resolve comment documentId for ID: ${commentId}`);
        }
        
        const commentResponse = await strapiPublic.get(`/api/forum-comments/${commentDocId}?fields[0]=dislikes`);
        const currentComment = commentResponse.data?.data;
        const currentDislikes = currentComment?.attributes?.dislikes ?? currentComment?.dislikes ?? 0;
        const newDislikes = Math.max(0, currentDislikes - 1);
        
        const updateResponse = await strapi.put(`/api/forum-comments/${commentDocId}`, {
            data: {
                dislikes: newDislikes,
            }
        });
        
        strapiResponseCache.clear();
        return {
            ...updateResponse.data?.data,
            dislikes: newDislikes,
        };
    } catch (error: any) {
        console.error(`Error undisliking forum comment ${commentId}:`, error);
        throw new Error(error.response?.data?.error?.message ?? 'Failed to undislike comment');
    }
}

/**
 * Update forum comment likes/dislikes
 */
/**
 * Update a forum comment's content
 */
export async function updateForumCommentContent(
    commentId: string | number,
    content: string
): Promise<any> {
    try {
        // Resolve documentId for the comment
        const commentDocId = await resolveDocumentId('forum-comments', commentId);
        if (!commentDocId) {
            throw new Error(`Failed to resolve comment documentId for ID: ${commentId}`);
        }
        
        // Update the comment content
        const updateResponse = await strapi.put(`/api/forum-comments/${commentDocId}`, {
            data: {
                attributes: content, // The content field is 'attributes' in Strapi schema
            }
        });
        
        // Clear cache
        strapiResponseCache.clear();
        
        return updateResponse.data?.data;
    } catch (error: any) {
        console.error(`Error updating forum comment ${commentId}:`, error);
        const errorMessage = error.response?.data?.error?.message 
            ?? error.response?.data?.message
            ?? error.message
            ?? 'Failed to update comment';
        throw new Error(errorMessage);
    }
}

/**
 * Delete a forum comment
 */
export async function deleteForumComment(commentId: string | number): Promise<void> {
    try {
        // Resolve documentId for the comment
        const commentDocId = await resolveDocumentId('forum-comments', commentId);
        if (!commentDocId) {
            throw new Error(`Failed to resolve comment documentId for ID: ${commentId}`);
        }
        
        // Delete the comment
        await strapi.delete(`/api/forum-comments/${commentDocId}`);
        
        // Clear cache
        strapiResponseCache.clear();
    } catch (error: any) {
        console.error(`Error deleting forum comment ${commentId}:`, error);
        const errorMessage = error.response?.data?.error?.message 
            ?? error.response?.data?.message
            ?? error.message
            ?? 'Failed to delete comment';
        throw new Error(errorMessage);
    }
}

export async function updateForumComment(
    commentId: string | number,
    data: {
        likes?: number;
        dislikes?: number;
    }
): Promise<void> {
    try {
        await strapi.put(`/api/forum-comments/${commentId}`, {
            data
        });
        
        // Clear cache
        strapiResponseCache.clear();
    } catch (error: any) {
        console.error(`Error updating forum comment ${commentId}:`, error);
        // Don't throw - likes are not critical
    }
}

/**
 * Get forum categories (if using dynamic categories)
 */
/**
 * Get forum statistics (total posts, published, pinned)
 */
export async function getForumStats(): Promise<{
    totalPosts: number;
    publishedPosts: number;
    pinnedPosts: number;
}> {
    try {
        // Fetch all posts with minimal fields to count them
        const [totalResponse, publishedResponse, pinnedResponse] = await Promise.all([
            // Total posts (all published posts)
            strapiPublic.get('/api/forum-forums?filters[publishedAt][$notNull]=true&pagination[pageSize]=1&pagination[withCount]=true'),
            // Published posts
            strapiPublic.get('/api/forum-forums?filters[publishedAt][$notNull]=true&filters[forum_status][$eq]=published&pagination[pageSize]=1&pagination[withCount]=true'),
            // Pinned posts
            strapiPublic.get('/api/forum-forums?filters[publishedAt][$notNull]=true&filters[isPinned][$eq]=true&pagination[pageSize]=1&pagination[withCount]=true'),
        ]);

        const totalPosts = totalResponse.data?.meta?.pagination?.total ?? 0;
        const publishedPosts = publishedResponse.data?.meta?.pagination?.total ?? 0;
        const pinnedPosts = pinnedResponse.data?.meta?.pagination?.total ?? 0;

        return {
            totalPosts,
            publishedPosts,
            pinnedPosts,
        };
    } catch (error: any) {
        console.error('Error fetching forum stats:', error);
        // Return zeros on error
        return {
            totalPosts: 0,
            publishedPosts: 0,
            pinnedPosts: 0,
        };
    }
}

/**
 * Get forum categories - dynamically fetch enum values from Strapi schema
 * Category is an enumeration field, not a relation
 */
export async function getForumCategories(): Promise<ForumCategory[]> {
    try {
        // Try to fetch schema from content-type-builder API (Strapi v5)
        // This requires admin access, so we'll fallback to static values if it fails
        try {
            const response = await strapi.get('/api/content-type-builder/content-types/api::forum-forum.forum-forum');
            const schema = response.data?.data;
            
            if (schema?.attributes?.category?.enum) {
                const enumValues = schema.attributes.category.enum;
                const colorMap: Record<string, string> = {
                    'general': 'bg-blue-500',
                    'courses': 'bg-green-500',
                    'technical': 'bg-red-500',
                    'projects': 'bg-purple-500',
                    'career': 'bg-orange-500',
                    'announcements': 'bg-blue-500',
                };
                
                return enumValues.map((value: string, index: number) => ({
                    id: index + 1,
                    name: value,
                    slug: value,
                    description: `${value.charAt(0).toUpperCase() + value.slice(1)} category`,
                    color: colorMap[value] || 'bg-gray-500',
                }));
            }
        } catch (schemaError) {
            console.warn('Could not fetch schema from content-type-builder, using fallback:', schemaError);
        }
        
        // Fallback: Return enum values from known schema
        // These match the Strapi schema: general, courses, technical, projects, career, announcements
        return [
            { id: 1, name: 'general', description: 'General topics and conversations', color: 'bg-blue-500', slug: 'general' },
            { id: 2, name: 'courses', description: 'Get help with specific courses', color: 'bg-green-500', slug: 'courses' },
            { id: 3, name: 'technical', description: 'Technical issues and troubleshooting', color: 'bg-red-500', slug: 'technical' },
            { id: 4, name: 'projects', description: 'Share your projects and get feedback', color: 'bg-purple-500', slug: 'projects' },
            { id: 5, name: 'career', description: 'Career guidance and job opportunities', color: 'bg-orange-500', slug: 'career' },
            { id: 6, name: 'announcements', description: 'Official announcements and updates', color: 'bg-blue-500', slug: 'announcements' },
        ];
    } catch (error) {
        console.error('Error fetching forum categories:', error);
        // Return fallback values
        return [
            { id: 1, name: 'general', slug: 'general', description: 'General topics', color: 'bg-blue-500' },
            { id: 2, name: 'courses', slug: 'courses', description: 'Course help', color: 'bg-green-500' },
            { id: 3, name: 'technical', slug: 'technical', description: 'Technical support', color: 'bg-red-500' },
            { id: 4, name: 'projects', slug: 'projects', description: 'Project showcase', color: 'bg-purple-500' },
            { id: 5, name: 'career', slug: 'career', description: 'Career advice', color: 'bg-orange-500' },
            { id: 6, name: 'announcements', slug: 'announcements', description: 'Announcements', color: 'bg-blue-500' },
        ];
    }
}

