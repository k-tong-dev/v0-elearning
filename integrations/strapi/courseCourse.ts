import { strapiPublic, strapi } from './client';
import { strapiResponseCache } from '@/lib/cache';
import {CoursePreview, getCoursePreview} from './coursePreview';

// Helper to resolve documentId from numeric ID
async function resolveDocumentIdByNumericId(
    collection: string,
    numericId: number,
): Promise<string | null> {
    const query = [`filters[id][$eq]=${numericId}`, "fields[0]=documentId"].join("&");
    const url = `/api/${collection}?${query}`;
    const clients = [strapi, strapiPublic];
    for (const client of clients) {
        try {
            const response = await client.get(url);
            const items = response.data?.data ?? [];
            if (items.length > 0) {
                return items[0].documentId;
            }
        } catch (error) {
            console.warn(`Failed to resolve documentId for ${collection}`, error);
        }
    }
    return null;
}

export interface CourseCourse {
    id: number;
    documentId: string;
    name: string;
    description?: string;
    Price: number;
    is_paid: boolean;
    preview_available: boolean;
    preview_url?: string;
    duration_minutes: number;
    preview_duration?: number;
    purchase_count: number;
    revenue_generated: number;
    course_level?: {
        id: number;
        name: string;
    };
    course_categories?: Array<{
        id: number;
        name: string;
    }>;
    course_tages?: Array<{
        id: number;
        name: string;
    }>;
    relevant_skills?: Array<{
        id: number;
        name: string;
    }>;
    course_badges?: Array<{
        id: number;
        name: string;
    }>;
    company?: {
        id: number;
        name: string;
    };
    currency?: {
        id: number;
        name: string;
        code: string;
    };
    instructors?: Array<{
        id: number;
        name?: string;
        avatar?: any;
        documentId?: string;
    }>;
    discount_type?: "percentage" | "fix_price" | null;
    discount_percentage?: number | null;
    discount_fix_price?: number | null;
    course_status?: "cancel" | "draft" | "published";
    active?: boolean;
    enrollment_count?: number;
    enrollment_limit?: number;
    can_edit_after_publish?: boolean;
    course_preview?: CoursePreview | null;
    rating_counts?: number; // Auto-computed rating count from Strapi
    average_rating?: number; // Auto-computed average rating from Strapi
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string | null;
    locale?: string;
}

function parseNumericId(value: any): number | undefined {
    if (value === undefined || value === null) return undefined
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string") {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : undefined
    }
    return undefined
}

function normalizeRelationArray(relation: any): Array<{ id: number; name: string; avatar?: any; documentId?: string }> {
    if (!relation) {
        if (process.env.NODE_ENV !== "production") {
            console.debug("[normalizeRelationArray] Relation is null/undefined")
        }
        return []
    }
    
    const data = Array.isArray(relation) ? relation : relation.data
    if (!Array.isArray(data)) {
        if (process.env.NODE_ENV !== "production") {
            console.debug("[normalizeRelationArray] Data is not an array:", { relation, data })
        }
        return []
    }
    
    const normalized: Array<{ id: number; name: string; avatar?: any; documentId?: string }> = []
    for (const entry of data) {
        // Skip null/undefined entries
        if (!entry) continue
        
        const attributes = entry.attributes ?? {}
        const rawId = entry.id ?? entry.documentId ?? attributes.id ?? ""
        const id = parseNumericId(rawId)
        const documentId = entry.documentId || attributes.documentId || null
        
        // For Strapi v5, accept entries with documentId even if id is missing
        // This is especially important for free courses where instructors might not have numeric IDs
        if (id === undefined && !documentId) {
            // Skip only if both id and documentId are missing
            if (process.env.NODE_ENV !== "production") {
                console.debug("[normalizeRelationArray] Skipping entry - no id or documentId:", entry)
            }
            continue
        }
        
        // Use 0 as fallback id if not available (but documentId exists)
        const normalizedEntry: { id: number; name: string; avatar?: any; documentId?: string } = {
            id: id ?? 0,
            name: entry.name ?? attributes.name ?? "",
        }
        // Preserve documentId if available (more reliable for deduplication)
        if (documentId) {
            normalizedEntry.documentId = documentId
        }
        const avatar = entry.avatar ?? attributes.avatar
        if (avatar) {
            normalizedEntry.avatar = avatar
        }
        normalized.push(normalizedEntry)
    }
    
    if (process.env.NODE_ENV !== "production" && normalized.length === 0 && data.length > 0) {
        console.warn("[normalizeRelationArray] No entries normalized from data:", { 
            dataLength: data.length, 
            sampleEntry: data[0],
            relationType: Array.isArray(relation) ? "array" : typeof relation
        })
    }
    
    return normalized
}

function normalizeSingleRelation(relation: any): { id: number; name: string } | undefined {
    if (!relation) return undefined
    const data = relation.data ?? relation
    if (!data) return undefined
    const attributes = data.attributes ?? {}
    const rawId = data.id ?? data.documentId ?? attributes.id ?? ""
    const id = parseNumericId(rawId)
    if (id === undefined) return undefined
    return {
        id,
        name: data.name ?? attributes.name ?? "",
    }
}

/**
 * Extract preview URL from course_preview relation based on its type
 * Handles nested structures: url field, image.url, or video.url
 */
function extractPreviewUrl(coursePreview: any, fallbackUrl?: string): string | undefined {
    if (!coursePreview) return fallbackUrl
    
    if (coursePreview.types === "url" && coursePreview.url) {
        return coursePreview.url
    }
    
    if (coursePreview.types === "image" && coursePreview.image) {
        const imageData = coursePreview.image?.data || coursePreview.image
        const url = imageData?.attributes?.url || imageData?.url
        if (url) {
            return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_STRAPI_URL || ''}${url}`
        }
    }
    
    if (coursePreview.types === "video" && coursePreview.video) {
        const videoData = coursePreview.video?.data || coursePreview.video
        const url = videoData?.attributes?.url || videoData?.url
        if (url) {
            return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_STRAPI_URL || ''}${url}`
        }
    }
    
    return fallbackUrl
}

async function buildDocumentIdEntriesFromIds(
    collection: string,
    ids: Array<number | string | { id?: number; documentId?: string }>,
): Promise<Array<{ documentId: string }>> {
    const entries: Array<{ documentId: string }> = []
    for (const raw of ids) {
        // Handle object format: { id: 1, documentId: "..." } or { documentId: "..." }
        if (typeof raw === 'object' && raw !== null) {
            const docId = raw.documentId || (raw.id ? await resolveDocumentIdByNumericId(collection, raw.id) : null)
            if (docId) {
                entries.push({ documentId: docId })
            }
            continue
        }
        
        // Handle string/number format
        // If it's already a documentId (non-numeric string), use it directly
        if (typeof raw === 'string' && !/^\d+$/.test(raw)) {
            entries.push({ documentId: raw })
            continue
        }
        
        // Otherwise, resolve numeric ID to documentId
        const numericId = parseNumericId(raw)
        if (numericId === undefined) continue
        const docId = await resolveDocumentIdByNumericId(collection, numericId)
        if (docId) {
            entries.push({ documentId: docId })
        }
    }
    return entries
}

async function buildRelationConnectPayload(
    collection: string,
    ids?: Array<number | string> | null,
): Promise<{ connect: Array<{ documentId: string }> } | { set: Array<{ documentId: string }> } | undefined> {
    if (ids === undefined) return undefined
    const values = Array.isArray(ids) ? ids : []
    if (values.length === 0) {
        return { set: [] }
    }
    const entries = await buildDocumentIdEntriesFromIds(collection, values)
    return entries.length ? { connect: entries } : { set: [] }
}

async function normalizeSingleRelationUpdate(
    value: any,
    collection: string,
): Promise<any> {
    if (value === undefined) return undefined
    if (value === null) return null
    
    // Handle documentId directly
    if (typeof value === 'string' && !/^\d+$/.test(value)) {
        // It's already a documentId
        return { connect: [{ documentId: value }] }
    }
    
    // Handle numeric ID
    if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) {
        const docId = await resolveDocumentIdByNumericId(collection, value)
        if (docId) {
            return { connect: [{ documentId: docId }] }
        }
        return null
    }
    
    // Handle object with id or documentId (e.g., { id: 1 } or { documentId: "..." })
    if (typeof value === 'object' && value !== null) {
        // Handle { connect: [{ id: 1 }] } format
        if (value.connect && Array.isArray(value.connect)) {
            const connectEntries = value.connect.map(async (entry: any) => {
                const docId = entry.documentId || (entry.id ? await resolveDocumentIdByNumericId(collection, entry.id) : null)
                return docId ? { documentId: docId } : null
            })
            const resolved = await Promise.all(connectEntries)
            const validEntries = resolved.filter(Boolean) as Array<{ documentId: string }>
            return validEntries.length ? { connect: validEntries } : null
        }
        
        // Handle simple object { id: 1 } or { documentId: "..." }
        const docId = value.documentId || (value.id ? await resolveDocumentIdByNumericId(collection, value.id) : null)
        if (docId) {
            return { connect: [{ documentId: docId }] }
        }
        return null
    }
    
    if (Array.isArray(value)) {
        const entries = await buildDocumentIdEntriesFromIds(collection, value)
        return entries.length ? { connect: entries } : null
    }
    
    return value
}

async function normalizeMultiRelationUpdate(
    value: any,
    collection: string,
): Promise<any> {
    if (value === undefined) return undefined
    if (value === null) return { set: [] }
    
    // Handle array of IDs (numeric or documentId strings or objects with id/documentId)
    if (Array.isArray(value)) {
        const entries = await buildDocumentIdEntriesFromIds(collection, value)
        return entries.length ? { connect: entries } : { set: [] }
    }
    
    // Handle { set: [...] } format - convert id to documentId
    if (value.set && Array.isArray(value.set)) {
        if (value.set.length === 0) {
            return { set: [] }
        }
        // Extract IDs from objects like { id: 1 } or use direct values
        const ids = value.set.map((entry: any) => {
            if (typeof entry === 'object' && entry !== null) {
                return entry.documentId || entry.id || entry
            }
            return entry
        })
        const entries = await buildDocumentIdEntriesFromIds(collection, ids)
        return { set: entries }
    }
    
    // Handle { connect: [...] } format - convert id to documentId
    if (value.connect && Array.isArray(value.connect)) {
        // Extract IDs from objects like { id: 1 } or use direct values
        const ids = value.connect.map((entry: any) => {
            if (typeof entry === 'object' && entry !== null) {
                return entry.documentId || entry.id || entry
            }
            return entry
        })
        const entries = await buildDocumentIdEntriesFromIds(collection, ids)
        return entries.length ? { connect: entries } : undefined
    }
    
    return value
}

async function normalizeCourseUpdatePayload(data: any, existingCourse?: CourseCourse | null): Promise<any> {
    if (!data || typeof data !== "object") return data
    const transformed: any = { ...data }

    // Preserve existing relations if not provided in update data
    // This ensures relations like instructors and owner are not lost during updates
    if (existingCourse) {
        // Preserve owner if not in update data
        if (!Object.prototype.hasOwnProperty.call(transformed, "owner") && existingCourse.owner) {
            // Don't add owner if it's not being updated - let Strapi preserve it
            // Only normalize if it's explicitly being updated
        }
        
        // Preserve instructors if not in update data
        if (!Object.prototype.hasOwnProperty.call(transformed, "instructors") && existingCourse.instructors && existingCourse.instructors.length > 0) {
            // Don't add instructors if not being updated - let Strapi preserve them
            // Only normalize if explicitly being updated
        }
    }

    // Normalize relations that ARE being updated (using documentId priority)
    if (Object.prototype.hasOwnProperty.call(transformed, "course_level")) {
        transformed.course_level = await normalizeSingleRelationUpdate(transformed.course_level, "course-levels")
    }
    if (Object.prototype.hasOwnProperty.call(transformed, "currency")) {
        transformed.currency = await normalizeSingleRelationUpdate(transformed.currency, "currencies")
    }
    if (Object.prototype.hasOwnProperty.call(transformed, "company")) {
        transformed.company = await normalizeSingleRelationUpdate(transformed.company, "companies")
    }
    if (Object.prototype.hasOwnProperty.call(transformed, "course_preview")) {
        transformed.course_preview = await normalizeSingleRelationUpdate(transformed.course_preview, "course-previews")
    }
    if (Object.prototype.hasOwnProperty.call(transformed, "owner")) {
        transformed.owner = await normalizeSingleRelationUpdate(transformed.owner, "users")
    }
    if (Object.prototype.hasOwnProperty.call(transformed, "instructors")) {
        transformed.instructors = await normalizeMultiRelationUpdate(transformed.instructors, "instructors")
    }
    if (Object.prototype.hasOwnProperty.call(transformed, "course_categories")) {
        transformed.course_categories = await normalizeMultiRelationUpdate(transformed.course_categories, "course-categories")
    }
    if (Object.prototype.hasOwnProperty.call(transformed, "course_tages")) {
        transformed.course_tages = await normalizeMultiRelationUpdate(transformed.course_tages, "course-tages")
    }
    if (Object.prototype.hasOwnProperty.call(transformed, "relevant_skills")) {
        transformed.relevant_skills = await normalizeMultiRelationUpdate(transformed.relevant_skills, "skills")
    }
    if (Object.prototype.hasOwnProperty.call(transformed, "course_badges")) {
        transformed.course_badges = await normalizeMultiRelationUpdate(transformed.course_badges, "course-badges")
    }

    return transformed
}

const PUBLIC_COURSE_CACHE_TAG = 'strapi:courseCourse';

interface CourseFetchOptions {
    forceRefresh?: boolean;
    cacheTtlMs?: number;
}

// Public courses for courses page - only published and active courses
export async function getPublicCourseCourses(options: CourseFetchOptions = {}): Promise<CourseCourse[]> {
    const { forceRefresh = false, cacheTtlMs } = options;

    try {
        // Strapi v5 - use populate=* for all relations, then filter
        // Build query params properly
        const params = new URLSearchParams()
        params.append('populate', '*')
        params.append('filters[course_status][$eq]', 'published')
        params.append('filters[active][$eq]', 'true')

        const url = `/api/course-courses?${params.toString()}`;
        const cacheKey = `public-course-courses:${params.toString()}`;

        if (!forceRefresh) {
            const cached = strapiResponseCache.get<CourseCourse[]>(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const response = await strapiPublic.get(url);

        // Process courses - need to use Promise.all for async fallback logic
        const normalizedCourses = await Promise.all(
            (response.data.data || []).map(async (item: any) => {
            const courseLevel = normalizeSingleRelation(item.course_level);
            const categories = normalizeRelationArray(item.course_categories);
            const tags = normalizeRelationArray(item.course_tages);
            const skills = normalizeRelationArray(item.relevant_skills);
            const badges = normalizeRelationArray(item.course_badges);
            let instructorsData = normalizeRelationArray(item.instructors);
            
            // Fallback: If no instructors found and course has an owner, try to get instructor from owner
            // This is especially important for free courses where instructors might not be properly linked
            if ((!instructorsData || instructorsData.length === 0) && item.owner) {
                try {
                    const ownerData = item.owner?.data || item.owner
                    const ownerId = typeof ownerData === 'object' ? (ownerData.id || ownerData.documentId) : ownerData
                    
                    if (ownerId) {
                        // Try to find instructor by user ID
                        const { getInstructors } = await import('./instructor')
                        const ownerInstructors = await getInstructors(String(ownerId))
                        
                        if (ownerInstructors && ownerInstructors.length > 0) {
                            // Use owner's instructor profile as fallback
                            instructorsData = ownerInstructors.map(inst => ({
                                id: inst.id,
                                name: inst.name || "Unknown Instructor",
                                avatar: inst.avatar,
                                documentId: inst.documentId,
                            }))
                            
                            if (process.env.NODE_ENV !== "production") {
                                console.log(`[getPublicCourseCourses] Using owner instructor for course "${item.name}" (ID: ${item.id})`)
                            }
                        }
                    }
                } catch (error) {
                    if (process.env.NODE_ENV !== "production") {
                        console.warn(`[getPublicCourseCourses] Could not fetch instructor from owner for course ${item.id}:`, error)
                    }
                }
            }
            
            // Debug logging for free courses with missing instructors
            if (process.env.NODE_ENV !== "production" && (!item.is_paid || item.Price === 0)) {
                if (!instructorsData || instructorsData.length === 0) {
                    console.warn(`[getPublicCourseCourses] Free course "${item.name}" (ID: ${item.id}) has no instructors:`, {
                        courseId: item.id,
                        courseName: item.name,
                        is_paid: item.is_paid,
                        price: item.Price,
                        rawInstructors: item.instructors,
                        owner: item.owner,
                        instructorsDataType: typeof item.instructors,
                        instructorsDataIsArray: Array.isArray(item.instructors),
                        instructorsDataLength: Array.isArray(item.instructors) ? item.instructors.length : 'N/A',
                        normalizedCount: instructorsData.length
                    })
                }
            }
            
            const currencyData = item.currency?.data || item.currency;
            
            // Extract preview URL from course_preview relation based on type
            const coursePreview = item.course_preview?.data || item.course_preview;
            const previewUrl = extractPreviewUrl(coursePreview, item.preview_url);
            const normalizedPreview = coursePreview
                ? {
                    id: coursePreview.id,
                    documentId: coursePreview.documentId,
                    types: coursePreview.types,
                    url: coursePreview.url ?? null,
                    image: coursePreview.image ?? null,
                    video: coursePreview.video ?? null,
                }
                : null;

            if (process.env.NODE_ENV !== "production") {
                try {
                    console.debug("[courseCourse:getPublic] preview normalization", {
                        courseId: item.id,
                        previewType: normalizedPreview?.types || coursePreview?.types,
                        previewUrl: previewUrl || item.preview_url || null,
                    });
                } catch (logError) {
                    // Ignore logging issues
                }
            }

            return {
                id: item.id,
                documentId: item.documentId,
                name: item.name,
                description: item.description,
                Price: Number(item.Price) || 0,
                is_paid: item.is_paid || false,
                preview_available: item.preview_available || false,
                preview_url: previewUrl,
                duration_minutes: item.duration_minutes || 0,
                preview_duration: item.preview_duration || 0,
                purchase_count: item.purchase_count || 0,
                revenue_generated: item.revenue_generated || 0,
                course_level: courseLevel,
                course_categories: categories,
                course_tages: tags,
                relevant_skills: skills,
                course_badges: badges,
                instructors: instructorsData.map((inst: any) => ({
                    id: inst.id,
                    name: inst.name,
                    avatar: inst.avatar,
                    documentId: inst.documentId,
                })),
                currency: currencyData
                    ? {
                        id: currencyData.id,
                        name: currencyData.name ?? currencyData.attributes?.name,
                        code: currencyData.code ?? currencyData.attributes?.code,
                    }
                    : undefined,
                discount_type: item.discount_type ?? null,
                discount_percentage: item.discount_percentage ?? 0,
                discount_fix_price: item.discount_fix_price ?? 0,
                course_status: item.course_status,
                active: item.active,
                enrollment_count: item.enrollment_count,
                enrollment_limit: item.enrollment_limit || 0,
                can_edit_after_publish: item.can_edit_after_publish,
                rating_counts: item.rating_counts || 0, // Use auto-computed rating count from Strapi
                average_rating: item.average_rating ?? undefined, // Use auto-computed average rating from Strapi
                course_preview: normalizedPreview,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                publishedAt: item.publishedAt,
                locale: item.locale,
            }
            })
        )

        strapiResponseCache.set(cacheKey, normalizedCourses, {
            ttlMs: cacheTtlMs,
            tags: [PUBLIC_COURSE_CACHE_TAG],
        });

        return normalizedCourses;
    } catch (error: any) {
        console.error("Error fetching public course courses:", error?.response?.data || error?.message || error);
        return [];
    }
}

export function invalidatePublicCourseCoursesCache(): void {
    strapiResponseCache.invalidateTag(PUBLIC_COURSE_CACHE_TAG);
}

// Dashboard courses - all courses for the logged-in user (no status filter)
interface DashboardCourseOptions {
    ownerId?: number;
    ownerDocumentId?: string;
}

export async function getDashboardCourseCourses(options: DashboardCourseOptions = {}): Promise<CourseCourse[]> {
    const { ownerId, ownerDocumentId } = options;
    try {
        // Strapi v5 - use populate=* for all relations
        const params = new URLSearchParams()
        params.append('populate', '*')
        
        // If userId provided, filter by instructors (check if user is in instructors array)
        // Note: We'll filter in code since Strapi v5 doesn't easily support filtering by array contains
        // Alternative: filter by owner if that's what we want
        if (ownerId !== undefined && Number.isFinite(ownerId)) {
            params.append('filters[owner][id][$eq]', ownerId.toString())
        } else if (ownerDocumentId) {
            params.append('filters[owner][documentId][$eq]', ownerDocumentId)
        }

        const response = await strapi.get(`/api/course-courses?${params.toString()}`);
        return (response.data.data || []).map((item: any) => {
            const courseLevel = normalizeSingleRelation(item.course_level);
            const categories = normalizeRelationArray(item.course_categories);
            const tags = normalizeRelationArray(item.course_tages);
            const skills = normalizeRelationArray(item.relevant_skills);
            const badges = normalizeRelationArray(item.course_badges);
            const instructorsData = normalizeRelationArray(item.instructors);
            const currencyData = item.currency?.data || item.currency;
            
            // Extract preview URL from course_preview relation
            const coursePreview = item.course_preview?.data || item.course_preview;
            const previewUrl = extractPreviewUrl(coursePreview, item.preview_url);

            const normalizedPreview = coursePreview
                ? {
                    id: coursePreview.id,
                    documentId: coursePreview.documentId,
                    types: coursePreview.types,
                    url: coursePreview.url ?? null,
                    image: coursePreview.image ?? null,
                    video: coursePreview.video ?? null,
                }
                : null;

            // Get first instructor for backward compatibility
            const firstInstructor = instructorsData.length > 0 ? instructorsData[0] : undefined;

            return {
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            description: item.description,
                Price: Number(item.Price) || 0,
            is_paid: item.is_paid || false,
            preview_available: item.preview_available || false,
            preview_url: previewUrl,
            duration_minutes: item.duration_minutes || 0,
            preview_duration: item.preview_duration || 0,
            purchase_count: item.purchase_count || 0,
            revenue_generated: item.revenue_generated || 0,
                course_level: courseLevel,
                course_categories: categories,
                course_tages: tags,
                relevant_skills: skills,
                course_badges: badges,
            instructors: instructorsData.map((inst: any) => ({
                id: inst.id,
                name: inst.name,
                avatar: inst.avatar,
                documentId: inst.documentId, // Preserve documentId for Strapi v5 compatibility
            })),
                currency: currencyData
                    ? {
                        id: currencyData.id,
                        name: currencyData.name ?? currencyData.attributes?.name,
                        code: currencyData.code ?? currencyData.attributes?.code,
                    }
                    : undefined,
            discount_type: item.discount_type ?? null,
            discount_percentage: item.discount_percentage ?? 0,
            discount_fix_price: item.discount_fix_price ?? 0,
            course_status: item.course_status,
            active: item.active,
            enrollment_count: item.enrollment_count,
            enrollment_limit: item.enrollment_limit || 0,
            can_edit_after_publish: item.can_edit_after_publish,
            rating_counts: item.rating_counts || 0, // Use auto-computed rating count from Strapi
            average_rating: item.average_rating ?? undefined, // Use auto-computed average rating from Strapi
            course_preview: normalizedPreview ?? null,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            locale: item.locale,
            }
        })
    } catch (error: any) {
        console.error("Error fetching dashboard course courses:", error?.response?.data || error?.message || error);
        return [];
    }
}

export async function getCourseCourses(): Promise<CourseCourse[]> {
    return getPublicCourseCourses();
}

export async function getCourseCourse(id: string | number): Promise<CourseCourse | null> {
    try {
        let item: any;
        
        // Check if id is a documentId (string UUID-like) or numeric ID
        const isDocumentId = typeof id === 'string' && !/^\d+$/.test(id);
        
        if (isDocumentId) {
            // Use documentId directly in URL path (Strapi v5 preferred method)
            const response = await strapiPublic.get(`/api/course-courses/${id}?populate=*`);
            item = response.data.data;
        } else {
            // Numeric ID: resolve to documentId first, or use filter query as fallback
            const numericId = typeof id === 'string' ? Number(id) : id;
            if (isNaN(numericId)) {
                console.error("getCourseCourse: Invalid ID format, got:", id);
                return null;
            }
            
            // Try to resolve documentId from numeric ID
            const documentId = await resolveDocumentIdByNumericId("course-courses", numericId);
            
            if (documentId) {
                // Use documentId in URL path
                const response = await strapiPublic.get(`/api/course-courses/${documentId}?populate=*`);
                item = response.data.data;
            } else {
                // Fallback to filter query if documentId resolution fails
                const params = new URLSearchParams()
                params.append('populate', '*')
                params.append('filters[id][$eq]', numericId.toString())
                const response = await strapiPublic.get(`/api/course-courses?${params.toString()}`);
                const data = response.data.data;
                if (!data || data.length === 0) {
                    return null;
                }
                item = data[0];
            }
        }
        
        if (!item) {
            return null;
        }
        
        // Extract course_preview - handle both direct object and nested data structure
        const coursePreview = item.course_preview?.data || item.course_preview;
        const coursePreviewData   = await getCoursePreview(coursePreview.documentId || coursePreview.id);
        if (!coursePreviewData) {
            return null;
        }
        const previewUrl = extractPreviewUrl(coursePreviewData, item.preview_url);
        
        // Normalize relations using the same helper functions
        const courseLevel = normalizeSingleRelation(item.course_level);
        const company = normalizeSingleRelation(item.company);
        const categories = normalizeRelationArray(item.course_categories);
        const tags = normalizeRelationArray(item.course_tages);
        const skills = normalizeRelationArray(item.relevant_skills);
        const badges = normalizeRelationArray(item.course_badges);
        let instructorsData = normalizeRelationArray(item.instructors);
        
        // Fallback: If no instructors found and course has an owner, try to get instructor from owner
        // This is especially important for free courses where instructors might not be properly linked
        if ((!instructorsData || instructorsData.length === 0) && item.owner) {
            try {
                const ownerData = item.owner?.data || item.owner
                const ownerId = typeof ownerData === 'object' ? (ownerData.id || ownerData.documentId) : ownerData
                
                if (ownerId) {
                    // Try to find instructor by user ID
                    const { getInstructors } = await import('./instructor')
                    const ownerInstructors = await getInstructors(String(ownerId))
                    
                    if (ownerInstructors && ownerInstructors.length > 0) {
                        // Use owner's instructor profile as fallback
                        instructorsData = ownerInstructors.map(inst => ({
                            id: inst.id,
                            name: inst.name || "Unknown Instructor",
                            avatar: inst.avatar,
                            documentId: inst.documentId,
                        }))
                        
                        if (process.env.NODE_ENV !== "production") {
                            console.log(`[getCourseCourse] Using owner instructor for course "${item.name}" (ID: ${item.id})`)
                        }
                    }
                }
            } catch (error) {
                if (process.env.NODE_ENV !== "production") {
                    console.warn(`[getCourseCourse] Could not fetch instructor from owner for course ${item.id}:`, error)
                }
            }
        }
        
        const currencyData = item.currency?.data || item.currency;
        
        // Get first instructor for backward compatibility
        const firstInstructor = instructorsData.length > 0 ? instructorsData[0] : undefined;

        return {
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            description: item.description,
            Price: Number(item.Price) || 0,
            is_paid: item.is_paid || false,
            preview_available: item.preview_available || false,
            preview_url: previewUrl,
            duration_minutes: item.duration_minutes || 0,
            preview_duration: item.preview_duration || 0,
            purchase_count: item.purchase_count || 0,
            revenue_generated: item.revenue_generated || 0,
            course_level: courseLevel,
            company: company,
            course_categories: categories,
            course_tages: tags,
            relevant_skills: skills,
            course_badges: badges,
            currency: currencyData
                ? {
                    id: currencyData.id,
                    name: currencyData.name ?? currencyData.attributes?.name,
                    code: currencyData.code ?? currencyData.attributes?.code,
                }
                : undefined,
            discount_type: item.discount_type ?? null,
            discount_percentage: item.discount_percentage ?? 0,
            discount_fix_price: item.discount_fix_price ?? 0,
            course_status: item.course_status,
            active: item.active,
            enrollment_count: item.enrollment_count,
            enrollment_limit: item.enrollment_limit || 0,
            can_edit_after_publish: item.can_edit_after_publish,
            rating_counts: item.rating_counts || 0, // Use auto-computed rating count from Strapi
            average_rating: item.average_rating ?? undefined, // Use auto-computed average rating from Strapi
            instructors: instructorsData.map((inst: any) => ({
                id: inst.id,
                name: inst.name,
                avatar: inst.avatar,
                documentId: inst.documentId, // Preserve documentId for Strapi v5 compatibility
            })),
            //@ts-ignore
            course_preview: coursePreviewData ? { id: coursePreviewData.id } : null,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            locale: item.locale,
        };

    } catch (error) {
        console.error("Error fetching course course:", error);
        return null;
    }
}

export interface CreateCourseCourseInput {
    name: string;
    description?: string;
    Price?: number;
    is_paid?: boolean;
    preview_available?: boolean;
    duration_minutes?: number;
    course_level?: number | null;
    currency?: number | null;
    company?: number | null;
    instructors?: number[];
    course_categories?: number[];
    course_tages?: number[];
    relevant_skills?: number[];
    course_badges?: number[];
    discount_type?: "percentage" | "fix_price" | null;
    discount_percentage?: number | null;
    discount_fix_price?: number | null;
    can_edit_after_publish?: boolean;
    active?: boolean;
    course_status?: "cancel" | "draft" | "published";
    owner?: number; // User ID (numeric) for the owner relation
    enrollment_limit?: number;
}

export async function createCourseCourse(data: CreateCourseCourseInput): Promise<CourseCourse | null> {
    try {
        const normalizedDiscountType = data.discount_type ?? null;

        // Resolve documentIds for single relations to ensure Strapi Admin UI displays them
        let courseLevelConnect = null;
        if (data.course_level) {
            const docId = await resolveDocumentIdByNumericId("course-levels", data.course_level);
            if (docId) {
                courseLevelConnect = { connect: [{ documentId: docId }] };
            }
        }

        let currencyConnect = null;
        if (data.currency) {
            const docId = await resolveDocumentIdByNumericId("currencies", data.currency);
            if (docId) {
                currencyConnect = { connect: [{ documentId: docId }] };
            }
        }

        let companyConnect = null;
        if (data.company) {
            const docId = await resolveDocumentIdByNumericId("companies", data.company);
            if (docId) {
                companyConnect = { connect: [{ documentId: docId }] };
            }
        }

        let ownerConnect = null;
        if (data.owner) {
            const docId = await resolveDocumentIdByNumericId("users", data.owner);
            if (docId) {
                ownerConnect = { connect: [{ documentId: docId }] };
            }
        }

        const instructorsSet = await buildRelationConnectPayload("instructors", data.instructors)
        const categoriesSet = await buildRelationConnectPayload("course-categories", data.course_categories)
        const tagsSet = await buildRelationConnectPayload("course-tages", data.course_tages)
        const skillsSet = await buildRelationConnectPayload("skills", data.relevant_skills)
        const badgesSet = await buildRelationConnectPayload("course-badges", data.course_badges)

        const payload: any = {
                name: data.name,
                description: data.description,
                Price: data.Price || 0,
                is_paid: data.is_paid || false,
                preview_available: data.preview_available || false,
                duration_minutes: data.duration_minutes || 0,
                enrollment_limit: data.enrollment_limit || 0,
            // Single relations: use connect with documentId for CREATE to ensure Strapi Admin UI displays them
            course_level: courseLevelConnect,
            currency: currencyConnect,
            company: companyConnect,
            owner: ownerConnect, // Connect owner using documentId
            // Multi relations: use set with documentId for CREATE
            instructors: instructorsSet,
            course_categories: categoriesSet,
            course_tages: tagsSet,
            relevant_skills: skillsSet,
            course_badges: badgesSet,
            discount_type: normalizedDiscountType,
                can_edit_after_publish: data.can_edit_after_publish ?? false,
                active: data.active ?? true,
                course_status: data.course_status || "draft",
        };

        if (normalizedDiscountType === "percentage") {
            payload.discount_percentage = Number(data.discount_percentage ?? 0);
            payload.discount_fix_price = null;
        } else if (normalizedDiscountType === "fix_price") {
            payload.discount_fix_price = Number(data.discount_fix_price ?? 0);
            payload.discount_percentage = null;
        } else {
            payload.discount_percentage = null;
            payload.discount_fix_price = null;
        }

        // Format relations for Strapi v5 - use { set: [{ id: ... }] } for array relations
        const response = await strapi.post('/api/course-courses', { data: payload });
        
        const item = response.data.data;
        return {
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            description: item.description,
            Price: item.Price,
            is_paid: item.is_paid,
            preview_available: item.preview_available,
            preview_url: item.preview_url,
            duration_minutes: item.duration_minutes,
            preview_duration: item.preview_duration,
            purchase_count: item.purchase_count,
            revenue_generated: item.revenue_generated,
            course_level: item.course_level,
            currency: item.currency,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            locale: item.locale,
        };
    } catch (error: any) {
        console.error("Error creating course course:", error.response?.data || error);
        return null;
    }
}

/**
 * Check if course has any copyright issues in its content
 */
async function checkCourseCopyrightStatus(courseId: number): Promise<{
    hasCopyrightIssues: boolean;
    details: string;
}> {
    try {
        // Import dynamically to avoid circular dependencies
        const { getCourseMaterials, getCourseContentsForMaterial } = await import('./courseMaterial');
        
        // Get all materials for this course
        const materials = await getCourseMaterials(courseId);
        
        if (!materials || materials.length === 0) {
            return { hasCopyrightIssues: false, details: 'No materials found' };
        }
        
        // Check each material's contents for copyright issues
        for (const material of materials) {
            const contents = await getCourseContentsForMaterial(material.id);
            
            for (const content of contents) {
                // Only check video, url, and image content types
                const needsCopyrightCheck = ['video', 'url', 'image'].includes(content.type);
                
                if (!needsCopyrightCheck) {
                    continue; // Skip other content types
                }
                
                // Check the NEW component structure first
                if (content.copyright_information) {
                    const copyrightInfo = content.copyright_information;
                    
                    // ONLY CHECK: If copyrighted = TRUE, it means content HAS copyright issues
                    if (copyrightInfo.copyrighted === true) {
                        return {
                            hasCopyrightIssues: true,
                            details: `Content "${content.name}" contains copyrighted material`,
                        };
                    }
                    
                    // If copyrighted = false OR undefined/null, content is SAFE
                    // Do NOT check copy_right_status - it's only for UI display
                    
                } else {
                    // Fallback to OLD fields for backward compatibility during migration
                    if (content.copyright_check_status === 'failed') {
                        return {
                            hasCopyrightIssues: true,
                            details: `Content "${content.name}" has copyright violations`,
                        };
                    }
                    
                    if (!content.copyright_check_status || content.copyright_check_status === 'pending') {
                        return {
                            hasCopyrightIssues: true,
                            details: `Content "${content.name}" has not completed copyright check`,
                        };
                    }
                }
            }
        }
        
        return { hasCopyrightIssues: false, details: 'All copyright checks passed' };
    } catch (error) {
        console.error('Error checking course copyright status:', error);
        return {
            hasCopyrightIssues: true,
            details: 'Error checking copyright status',
        };
    }
}

// Note: In Strapi v5, PUT/DELETE operations require documentId (string), not numeric id
export async function updateCourseCourse(id: string, data: any): Promise<CourseCourse | null> {
    try {
        // Get the existing course to check current status
        const numericId = typeof id === 'string' ? Number(id) : id;
        let existingCourse: CourseCourse | null = null;
        
        if (!isNaN(numericId)) {
            existingCourse = await getCourseCourse(numericId);
        }
        
        // Security validation before update
        if (existingCourse) {
            // Security Rule 1: If course is published, only allow status changes to draft or cancel
            if (existingCourse.course_status === 'published') {
                // Check if they're trying to change the status
                if (data.course_status && data.course_status !== 'published') {
                    // Allow changing from published to draft or cancel
                    console.log(`[Course Security] Allowing status change from published to ${data.course_status}`);
                    
                    // Only allow the course_status field to be updated, block all other changes
                    const allowedFields = ['course_status', 'active'];
                    const attemptedFields = Object.keys(data);
                    const blockedFields = attemptedFields.filter(
                        field => !allowedFields.includes(field)
                    );
                    
                    if (blockedFields.length > 0) {
                        throw new Error(
                            `Cannot update fields [${blockedFields.join(', ')}] while course is published. ` +
                            'Please change course status to "draft" or "cancel" first, then make your changes.'
                        );
                    }
                } else {
                    // They're trying to update other fields while status is still published
                    throw new Error(
                        'Cannot update a published course. Please change the course status to "draft" or "cancel" first before making any changes.'
                    );
                }
            }
            
            // Security Rule 2: Check copyright before allowing status change to published
            if (data.course_status === 'published' && existingCourse.course_status !== 'published') {
                // Changing from draft/cancel to published
                
                // Check if course is paid
                const isPaid = data.is_paid !== undefined ? data.is_paid : existingCourse.is_paid;
                
                if (isPaid) {
                    // For paid courses, verify all copyright checks have passed
                    const copyrightCheck = await checkCourseCopyrightStatus(existingCourse.id);
                    
                    if (copyrightCheck.hasCopyrightIssues) {
                        throw new Error(
                            `Cannot publish paid course with copyright issues: ${copyrightCheck.details}. ` +
                            'Please resolve all copyright violations before publishing.'
                        );
                    }
                }
            }
            
            // Security Rule 3: If course is being changed to paid, check copyright
            const wasPaid = existingCourse.is_paid;
            const willBePaid = data.is_paid !== undefined ? data.is_paid : wasPaid;
            
            if (!wasPaid && willBePaid && existingCourse.course_status === 'published') {
                // Course is already published and trying to change from free to paid
                const copyrightCheck = await checkCourseCopyrightStatus(existingCourse.id);
                
                if (copyrightCheck.hasCopyrightIssues) {
                    throw new Error(
                        `Cannot change to paid course with copyright issues: ${copyrightCheck.details}. ` +
                        'Please unpublish, resolve copyright issues, and then republish.'
                    );
                }
            }
        }
        
        // Get existing course to preserve relations that aren't being updated
        if (!existingCourse) {
            // Try to fetch existing course if we don't have it yet
            const numericId = typeof id === 'string' ? Number(id) : id;
            if (!isNaN(numericId)) {
                existingCourse = await getCourseCourse(numericId);
            } else {
                // If id is documentId, try fetching by documentId
                try {
                    const docIdResponse = await strapiPublic.get(`/api/course-courses/${id}?populate=*`);
                    if (docIdResponse.data?.data) {
                        const item = docIdResponse.data.data;
                        const instructorsData = normalizeRelationArray(item.instructors);
                        existingCourse = {
                            id: item.id,
                            documentId: item.documentId,
                            name: item.name,
                            description: item.description,
                            Price: Number(item.Price) || 0,
                            is_paid: item.is_paid || false,
                            instructors: instructorsData.map((inst: any) => ({
                                id: inst.id,
                                name: inst.name,
                                avatar: inst.avatar,
                                documentId: inst.documentId,
                            })),
                            owner: item.owner?.data?.id || item.owner?.id || item.owner,
                        } as CourseCourse;
                    }
                } catch (fetchError) {
                    console.warn("Could not fetch existing course for relation preservation:", fetchError);
                }
            }
        }
        
        // Merge existing relations with update data to preserve relations not being updated
        const mergedData: any = { ...data }
        
        // Preserve owner if not being updated
        // CRITICAL: If owner is not in update data, we must explicitly preserve it
        // because Strapi v5 might clear it if not included
        if (!Object.prototype.hasOwnProperty.call(data, "owner") && existingCourse) {
            // Owner not being updated - preserve existing owner using documentId
            const existingOwner = existingCourse.owner
            if (existingOwner) {
                // Resolve owner to documentId and preserve it
                const ownerId = typeof existingOwner === 'object' ? existingOwner.id : existingOwner
                if (ownerId) {
                    const ownerDocId = await resolveDocumentIdByNumericId("users", ownerId)
                    if (ownerDocId) {
                        mergedData.owner = { connect: [{ documentId: ownerDocId }] }
                        console.log("[Course Update] Preserving existing owner relation")
                    }
                }
            }
        }
        
        // Preserve instructors if not being updated (or if update is trying to clear them incorrectly)
        if (existingCourse) {
            // If instructors is being set to empty array, check if we should preserve existing
            if (Object.prototype.hasOwnProperty.call(data, "instructors")) {
                const instructorsValue = data.instructors
                
                // Check if it's trying to clear instructors with { set: [] }
                if (instructorsValue && typeof instructorsValue === 'object') {
                    if (instructorsValue.set && Array.isArray(instructorsValue.set) && instructorsValue.set.length === 0) {
                        // If existing course has instructors, this would clear them
                        // Only clear if explicitly intended (existing course has no instructors)
                        if (existingCourse.instructors && existingCourse.instructors.length > 0) {
                            console.warn("[Course Update] Attempting to clear instructors with empty set - preserving existing instructors. To update instructors, provide the full list.");
                            // Don't clear - remove from update data to preserve existing instructors
                            delete mergedData.instructors
                        }
                        // If existing course has no instructors, allow clearing (no-op)
                    } else if (instructorsValue.set && Array.isArray(instructorsValue.set) && instructorsValue.set.length > 0) {
                        // Instructors are being updated with a new list - allow it
                        // The normalization will convert ids to documentIds
                    } else if (instructorsValue.connect && Array.isArray(instructorsValue.connect)) {
                        // Using connect format - allow it, normalization will handle documentId conversion
                    }
                } else if (Array.isArray(instructorsValue) && instructorsValue.length === 0) {
                    // Empty array - same as { set: [] }
                    if (existingCourse.instructors && existingCourse.instructors.length > 0) {
                        console.warn("[Course Update] Attempting to clear instructors with empty array - preserving existing instructors.");
                        delete mergedData.instructors
                    }
                }
            } else {
                // Instructors not in update - will be preserved by Strapi
                // Don't add it to mergedData
            }
        }
        
        const normalizedData = await normalizeCourseUpdatePayload(mergedData, existingCourse)
        // id should be documentId, not numeric id
        const response = await strapi.put(`/api/course-courses/${id}`, {
            data: normalizedData,
        });
        
        const item = response.data.data;
        return {
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            description: item.description,
            Price: item.Price,
            is_paid: item.is_paid,
            preview_available: item.preview_available,
            preview_url: item.preview_url,
            duration_minutes: item.duration_minutes,
            preview_duration: item.preview_duration,
            purchase_count: item.purchase_count,
            revenue_generated: item.revenue_generated,
            course_level: item.course_level,
            course_categories: item.course_categories,
            course_tages: item.course_tages,
            currency: item.currency,
            discount_type: item.discount_type ?? null,
            discount_percentage: item.discount_percentage ?? 0,
            discount_fix_price: item.discount_fix_price ?? 0,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            locale: item.locale,
        };
    } catch (error: any) {
        console.error("Error updating course course:", error.response?.data || error);
        // Re-throw the error so the caller can handle it
        throw error;
    }
}

// Note: In Strapi v5, DELETE operations require documentId (string), not numeric id
export async function deleteCourseCourse(id: string): Promise<boolean> {
    try {
        // id should be documentId, not numeric id
        await strapi.delete(`/api/course-courses/${id}`);
        return true;
    } catch (error) {
        console.error("Error deleting course course:", error);
        return false;
    }
}

