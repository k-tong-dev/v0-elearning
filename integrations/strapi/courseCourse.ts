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
    if (!relation) return []
    const data = Array.isArray(relation) ? relation : relation.data
    if (!Array.isArray(data)) return []
    const normalized: Array<{ id: number; name: string; avatar?: any; documentId?: string }> = []
    for (const entry of data) {
        const attributes = entry.attributes ?? {}
        const rawId = entry.id ?? entry.documentId ?? attributes.id ?? ""
        const id = parseNumericId(rawId)
        if (id === undefined) continue
        const documentId = entry.documentId || attributes.documentId || null
        const normalizedEntry: { id: number; name: string; avatar?: any; documentId?: string } = {
            id,
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
    ids: Array<number | string>,
): Promise<Array<{ documentId: string }>> {
    const entries: Array<{ documentId: string }> = []
    for (const raw of ids) {
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
    if (Array.isArray(value)) {
        const entries = await buildDocumentIdEntriesFromIds(collection, value)
        return entries.length ? { connect: entries } : { set: [] }
    }
    if (value.connect && Array.isArray(value.connect)) {
        const entries = await buildDocumentIdEntriesFromIds(
            collection,
            value.connect.map((entry: any) => entry?.id ?? entry),
        )
        return entries.length ? { connect: entries } : undefined
    }
    return value
}

async function normalizeMultiRelationUpdate(
    value: any,
    collection: string,
): Promise<any> {
    if (value === undefined) return undefined
    if (value === null) return { set: [] }
    if (Array.isArray(value)) {
        const entries = await buildDocumentIdEntriesFromIds(collection, value)
        return entries.length ? { connect: entries } : { set: [] }
    }
    if (value.set && Array.isArray(value.set)) {
        if (value.set.length === 0) {
            return { set: [] }
        }
        const entries = await buildDocumentIdEntriesFromIds(
            collection,
            value.set.map((entry: any) => entry?.id ?? entry),
        )
        return { set: entries }
    }
    if (value.connect && Array.isArray(value.connect)) {
        const entries = await buildDocumentIdEntriesFromIds(
            collection,
            value.connect.map((entry: any) => entry?.id ?? entry),
        )
        return entries.length ? { connect: entries } : undefined
    }
    return value
}

async function normalizeCourseUpdatePayload(data: any): Promise<any> {
    if (!data || typeof data !== "object") return data
    const transformed: any = { ...data }

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

        const normalizedCourses = (response.data.data || [])
            .map((item: any) => {
            const courseLevel = normalizeSingleRelation(item.course_level);
            const categories = normalizeRelationArray(item.course_categories);
            const tags = normalizeRelationArray(item.course_tages);
            const skills = normalizeRelationArray(item.relevant_skills);
            const badges = normalizeRelationArray(item.course_badges);
            const instructorsData = normalizeRelationArray(item.instructors);
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
                course_preview: normalizedPreview,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                publishedAt: item.publishedAt,
                locale: item.locale,
            }
        })

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
        // Always use numeric id, not documentId
        // In Strapi v5, numeric IDs must use filter queries, not path parameters
        const numericId = typeof id === 'string' ? Number(id) : id;
        if (isNaN(numericId)) {
            console.error("getCourseCourse: Invalid ID - must be numeric, got:", id);
            return null;
        }
        // Use filter query for numeric ID (Strapi v5 doesn't support numeric ID in URL path)
        // Use populate=* for all relations (this should include company)
        const params = new URLSearchParams()
        params.append('populate', '*')
        params.append('filters[id][$eq]', numericId.toString())
        const response = await strapiPublic.get(`/api/course-courses?${params.toString()}`);
        const data = response.data.data;
        if (!data || data.length === 0) {
            return null;
        }
        const item = data[0];
        
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
        const instructorsData = normalizeRelationArray(item.instructors);
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
            instructors: instructorsData.map((inst: any) => ({
                id: inst.id,
                name: inst.name,
                avatar: inst.avatar,
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
        
        const normalizedData = await normalizeCourseUpdatePayload(data)
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

