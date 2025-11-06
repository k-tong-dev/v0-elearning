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
            ? `/api/purchase-transactions?filters[user][id][$eq]=${userId}&populate=*`
            : '/api/purchase-transactions?populate=*';
        
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

export async function createPurchaseTransaction(
    data: Partial<PurchaseTransaction> & { 
        user: string; 
        instructor: string; 
        amount_paid: number 
    }
): Promise<PurchaseTransaction | null> {
    try {
        const now = new Date().toISOString();
        
        const response = await strapi.post('/api/purchase-transactions', {
            data: {
                user: data.user,
                instructor: data.instructor,
                course_course: data.course_course,
                amount_paid: data.amount_paid,
                currency: data.currency,
                state: data.state || 'pending',
                stripe_payment_intent_id: data.stripe_payment_intent_id,
                stripe_charge_id: data.stripe_charge_id,
                purchased_at: data.purchased_at || now,
                refunded_at: data.refunded_at,
            }
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
        console.error("Error creating purchase transaction:", error);
        return null;
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

export async function checkUserPurchasedCourse(userId: string, courseId: string): Promise<boolean> {
    try {
        const response = await strapiPublic.get(
            `/api/purchase-transactions?filters[user][id][$eq]=${userId}&filters[course_course][id][$eq]=${courseId}&filters[state][$eq]=completed&populate=*`
        );
        return response.data.data && response.data.data.length > 0;
    } catch (error) {
        console.error("Error checking if user purchased course:", error);
        return false;
    }
}

