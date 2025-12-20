import { strapiPublic, strapi } from './client';

export interface PurchaseTransaction {
    id: number;
    documentId: string;
    user: number | string;
    instructor: number | string;
    course_course?: number | string;
    amount_paid: number;
    currency?: {
        id: number;
        name: string;
        code: string;
    };
    state: 'pending' | 'completed' | 'failed' | 'refunded';
    stripe_payment_intent_id?: string;
    stripe_charge_id?: string;
    purchased_at: string;
    refunded_at?: string;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string | null;
    locale?: string;
}

export async function getPurchaseTransactions(userId?: string): Promise<PurchaseTransaction[]> {
    try {
        const url = userId
            ? `/api/purchase-transactions?filters[user][id][$eq]=${userId}&populate=*&sort=createdAt:desc`
            : '/api/purchase-transactions?populate=*&sort=createdAt:desc';
        
        const response = await strapiPublic.get(url);
        return (response.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            user: item.user?.id || item.user,
            instructor: item.instructor?.id || item.instructor,
            course_course: item.course_course?.id || item.course_course,
            amount_paid: item.amount_paid || 0,
            currency: item.currency,
            state: item.state,
            stripe_payment_intent_id: item.stripe_payment_intent_id,
            stripe_charge_id: item.stripe_charge_id,
            purchased_at: item.purchased_at,
            refunded_at: item.refunded_at,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            locale: item.locale,
        }));
    } catch (error) {
        console.error("Error fetching purchase transactions:", error);
        return [];
    }
}

export async function getPurchaseTransaction(id: string | number): Promise<PurchaseTransaction | null> {
    try {
        const response = await strapiPublic.get(`/api/purchase-transactions/${id}?populate=*`);
        const item = response.data.data;
        
        return {
            id: item.id,
            documentId: item.documentId,
            user: item.user?.id || item.user,
            instructor: item.instructor?.id || item.instructor,
            course_course: item.course_course?.id || item.course_course,
            amount_paid: item.amount_paid,
            currency: item.currency,
            state: item.state,
            stripe_payment_intent_id: item.stripe_payment_intent_id,
            stripe_charge_id: item.stripe_charge_id,
            purchased_at: item.purchased_at,
            refunded_at: item.refunded_at,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            locale: item.locale,
        };
    } catch (error) {
        console.error("Error fetching purchase transaction:", error);
        return null;
    }
}

// Helper to resolve documentId from numeric ID or string ID
async function resolveDocumentIdByNumericId(
    collection: string,
    idOrDocumentId: number | string,
): Promise<string | null> {
    // If it's already a documentId (non-numeric string), return it
    if (typeof idOrDocumentId === 'string' && !/^\d+$/.test(idOrDocumentId)) {
        return idOrDocumentId;
    }
    
    const numericId = typeof idOrDocumentId === 'string' ? Number(idOrDocumentId) : idOrDocumentId;
    const query = [`filters[id][$eq]=${numericId}`, "fields[0]=documentId"].join("&");
    
    // Users collection has a different base path and response structure
    const url = collection === "users" ? `/api/users?${query}` : `/api/${collection}?${query}`;
    const clients = [strapi, strapiPublic];
    for (const client of clients) {
        try {
            const response = await client.get(url);
            // Handle different response structures
            let items: any[] = [];
            if (collection === "users") {
                // Users endpoint might return array directly or wrapped
                items = Array.isArray(response.data) 
                    ? response.data 
                    : (response.data?.data ?? []);
            } else {
                items = response.data?.data ?? [];
            }
            
            // Find the matching item by numeric id to avoid accidental mismatches
            const item = items.find((it: any) => {
                const rawId = it?.id ?? it?.attributes?.id;
                return Number(rawId) === numericId;
            }) ?? items[0];
            
            if (item) {
                // In Strapi v5, documentId is directly on the item
                // Also check attributes in case of different response structure
                const documentId = item.documentId || item.attributes?.documentId;
                
                // Validate that we got the right item by checking numeric id matches
                const itemId = item.id || item.attributes?.id;
                if (itemId && Number(itemId) !== numericId) {
                    console.warn(`ID mismatch: expected ${numericId}, got ${itemId}`);
                    continue; // Try next client
                }
                
                if (documentId && typeof documentId === 'string') {
                    return documentId;
                }
                console.warn(`DocumentId not found for ${collection} id ${numericId}. Item:`, item);
            } else {
                console.warn(`No items found for ${collection} with id ${numericId}. Response:`, response.data);
            }
        } catch (error: any) {
            console.warn(`Failed to resolve documentId for ${collection}`, {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
        }
    }
    return null;
}

export async function createPurchaseTransaction(
    data: Partial<PurchaseTransaction> & { 
        user: string; 
        instructor: string; 
        amount_paid: number 
    }
): Promise<PurchaseTransaction | null> {
    try {
        const now = new Date().toISOString();
        
        // Resolve documentIds for relations to ensure Strapi Admin UI displays them
        const userDocumentId = await resolveDocumentIdByNumericId("users", data.user);
        if (!userDocumentId) {
            const errorMsg = `Failed to resolve user documentId for purchase transaction creation. User ID: ${data.user}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        const instructorDocumentId = await resolveDocumentIdByNumericId("instructors", data.instructor);
        if (!instructorDocumentId) {
            const errorMsg = `Failed to resolve instructor documentId for purchase transaction creation. Instructor ID: ${data.instructor}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        let courseConnect = undefined;
        if (data.course_course) {
            // Check if course_course is already a documentId (string UUID-like) or numeric ID
            const isDocumentId = typeof data.course_course === 'string' && !/^\d+$/.test(data.course_course);
            let courseDocId: string | null = null;
            
            if (isDocumentId) {
                // Already a documentId, use it directly
                courseDocId = data.course_course;
            } else {
                // Numeric ID, resolve to documentId
                const numericId = typeof data.course_course === 'string' ? Number(data.course_course) : data.course_course;
                if (!isNaN(numericId)) {
                    courseDocId = await resolveDocumentIdByNumericId("course-courses", numericId);
                }
            }
            
            if (courseDocId) {
                courseConnect = { connect: [{ documentId: courseDocId }] };
            }
        }

        let currencyConnect = undefined;
        if (data.currency) {
            const currencyId = typeof data.currency === 'number' ? data.currency : Number(data.currency);
            if (!isNaN(currencyId)) {
                const currencyDocId = await resolveDocumentIdByNumericId("currencies", currencyId);
                if (currencyDocId) {
                    currencyConnect = { connect: [{ documentId: currencyDocId }] };
                }
            }
        }
        
        const response = await strapi.post('/api/purchase-transactions', {
            data: {
                // Use connect with documentId for CREATE to ensure Strapi Admin UI displays the relation
                user: {
                    connect: [{ documentId: userDocumentId }],
                },
                instructor: {
                    connect: [{ documentId: instructorDocumentId }],
                },
                course_course: courseConnect,
                currency: currencyConnect,
                amount_paid: data.amount_paid,
                state: data.state || 'pending',
                stripe_payment_intent_id: data.stripe_payment_intent_id,
                stripe_charge_id: data.stripe_charge_id,
                purchased_at: data.purchased_at || now,
                refunded_at: data.refunded_at,
            }
        });
        
        if (!response.data?.data) {
            const errorMsg = `Invalid response from Strapi when creating purchase transaction. Response: ${JSON.stringify(response.data)}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        
        const item = response.data.data;
        return {
            id: item.id,
            documentId: item.documentId,
            user: item.user,
            instructor: item.instructor,
            course_course: item.course_course,
            amount_paid: item.amount_paid,
            currency: item.currency,
            state: item.state,
            stripe_payment_intent_id: item.stripe_payment_intent_id,
            stripe_charge_id: item.stripe_charge_id,
            purchased_at: item.purchased_at,
            refunded_at: item.refunded_at,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            locale: item.locale,
        };
    } catch (error: any) {
        const errorMsg = error?.response?.data?.error?.message || error?.message || 'Unknown error creating purchase transaction';
        const errorDetails = error?.response?.data ? JSON.stringify(error.response.data) : '';
        console.error("Error creating purchase transaction:", {
            message: errorMsg,
            details: errorDetails,
            stack: error?.stack,
            fullError: error
        });
        // Re-throw the error so the API route can handle it properly
        throw new Error(`Failed to create purchase transaction: ${errorMsg}${errorDetails ? ` - ${errorDetails}` : ''}`);
    }
}

export async function updatePurchaseTransaction(id: string, data: Partial<PurchaseTransaction>): Promise<PurchaseTransaction | null> {
    try {
        const response = await strapi.put(`/api/purchase-transactions/${id}`, {
            data
        });
        
        const item = response.data.data;
        return {
            id: item.id,
            documentId: item.documentId,
            user: item.user,
            instructor: item.instructor,
            course_course: item.course_course,
            amount_paid: item.amount_paid,
            currency: item.currency,
            state: item.state,
            stripe_payment_intent_id: item.stripe_payment_intent_id,
            stripe_charge_id: item.stripe_charge_id,
            purchased_at: item.purchased_at,
            refunded_at: item.refunded_at,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            locale: item.locale,
        };
    } catch (error) {
        console.error("Error updating purchase transaction:", error);
        return null;
    }
}

export async function checkUserPurchasedCourse(userId: string, courseId: string | number): Promise<boolean> {
    try {
        // Check if courseId is a documentId (string UUID-like) or numeric ID
        const isDocumentId = typeof courseId === 'string' && !/^\d+$/.test(courseId);
        
        let filterQuery: string;
        if (isDocumentId) {
            // Use documentId filter for course
            filterQuery = `filters[user][id][$eq]=${userId}&filters[course_course][documentId][$eq]=${courseId}&filters[state][$eq]=completed&populate=*`;
        } else {
            // Use numeric ID filter for course
            const numericCourseId = typeof courseId === 'string' ? Number(courseId) : courseId;
            filterQuery = `filters[user][id][$eq]=${userId}&filters[course_course][id][$eq]=${numericCourseId}&filters[state][$eq]=completed&populate=*`;
        }
        
        const response = await strapiPublic.get(
            `/api/purchase-transactions?${filterQuery}`
        );
        return response.data.data && response.data.data.length > 0;
    } catch (error) {
        console.error("Error checking if user purchased course:", error);
        return false;
    }
}

