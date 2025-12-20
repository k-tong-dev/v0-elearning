import { strapi, strapiPublic } from './client';

// User's payment method (with user relation)
export interface UserPaymentMethod {
    id: number;
    documentId: string;
    user: number | string | any;
    type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_account' | 'aba_bank';
    provider: 'stripe' | 'paypal' | 'aba_payway' | 'manual';
    details: {
        // For bank_account/aba_bank
        account_number?: string;
        account_name?: string;
        bank_name?: string;
        bank_swift_bic?: string;
        bank_country?: string;
        // For credit/debit cards
        last4?: string;
        brand?: string;
        expiry_month?: number;
        expiry_year?: number;
        // For PayPal
        paypal_email?: string;
        // For ABA Bank
        aba_account_number?: string;
        aba_account_name?: string;
    };
    default: boolean;
    active: boolean;
    stripe_payment_method_id?: string;
    added_at?: string;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string | null;
}

// Public catalog of payment methods (no user relation) - legacy
export interface PaymentMethod {
    id: number;
    documentId: string;
    name: string;
    code: string;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string | null;
}

// Get user's payment methods
export async function getUserPaymentMethods(userId: string | number): Promise<UserPaymentMethod[]> {
    try {
        const response = await strapi.get(
            `/api/payment-methods?filters[user][id][$eq]=${userId}&populate=*&sort=added_at:desc`
        );
        return (response.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            user: item.user?.id || item.user,
            type: item.type,
            provider: item.provider,
            details: item.details || {},
            default: item.default || false,
            active: item.active !== undefined ? item.active : true,
            stripe_payment_method_id: item.stripe_payment_method_id,
            added_at: item.added_at,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        }));
    } catch (error) {
        console.error("Error fetching user payment methods:", error);
        return [];
    }
}

// Get user's default payment method (only one should be default)
export async function getUserDefaultPaymentMethod(userId: string | number): Promise<UserPaymentMethod | null> {
    try {
        const methods = await getUserPaymentMethods(userId);
        const defaultMethod = methods.find(m => m.default === true);
        return defaultMethod || null;
    } catch (error) {
        console.error("Error fetching default payment method:", error);
        return null;
    }
}

// Create payment method for user
export async function createUserPaymentMethod(
    userId: string | number,
    data: Omit<UserPaymentMethod, 'id' | 'documentId' | 'user' | 'createdAt' | 'updatedAt' | 'publishedAt'>
): Promise<UserPaymentMethod | null> {
    try {
        // If setting as default, unset all other default payment methods for this user
        if (data.default) {
            await unsetAllDefaultPaymentMethods(userId);
        }

        // Resolve user documentId
        const { resolveDocumentIdByNumericId } = await import('./purchaseTransaction');
        const userDocumentId = await resolveDocumentIdByNumericId('users', userId);
        if (!userDocumentId) {
            throw new Error('Failed to resolve user documentId');
        }

        const response = await strapi.post('/api/payment-methods', {
            data: {
                user: {
                    connect: [{ documentId: userDocumentId }]
                },
                type: data.type,
                provider: data.provider,
                details: data.details,
                default: data.default || false,
                active: data.active !== undefined ? data.active : true,
                stripe_payment_method_id: data.stripe_payment_method_id,
                added_at: data.added_at || new Date().toISOString().split('T')[0],
            }
        });

        return {
            id: response.data.data.id,
            documentId: response.data.data.documentId,
            user: userId,
            type: response.data.data.type,
            provider: response.data.data.provider,
            details: response.data.data.details || {},
            default: response.data.data.default || false,
            active: response.data.data.active !== undefined ? response.data.data.active : true,
            stripe_payment_method_id: response.data.data.stripe_payment_method_id,
            added_at: response.data.data.added_at,
            createdAt: response.data.data.createdAt,
            updatedAt: response.data.data.updatedAt,
            publishedAt: response.data.data.publishedAt,
        };
    } catch (error) {
        console.error("Error creating payment method:", error);
        return null;
    }
}

// Update payment method
export async function updateUserPaymentMethod(
    documentId: string,
    data: Partial<UserPaymentMethod>
): Promise<UserPaymentMethod | null> {
    try {
        // If setting as default, unset all other default payment methods for this user
        if (data.default === true && data.user) {
            await unsetAllDefaultPaymentMethods(data.user, documentId);
        }

        const updateData: any = {};
        if (data.type !== undefined) updateData.type = data.type;
        if (data.provider !== undefined) updateData.provider = data.provider;
        if (data.details !== undefined) updateData.details = data.details;
        if (data.default !== undefined) updateData.default = data.default;
        if (data.active !== undefined) updateData.active = data.active;
        if (data.stripe_payment_method_id !== undefined) updateData.stripe_payment_method_id = data.stripe_payment_method_id;

        const response = await strapi.put(`/api/payment-methods/${documentId}`, {
            data: updateData
        });

        return {
            id: response.data.data.id,
            documentId: response.data.data.documentId,
            user: response.data.data.user?.id || response.data.data.user,
            type: response.data.data.type,
            provider: response.data.data.provider,
            details: response.data.data.details || {},
            default: response.data.data.default || false,
            active: response.data.data.active !== undefined ? response.data.data.active : true,
            stripe_payment_method_id: response.data.data.stripe_payment_method_id,
            added_at: response.data.data.added_at,
            createdAt: response.data.data.createdAt,
            updatedAt: response.data.data.updatedAt,
            publishedAt: response.data.data.publishedAt,
        };
    } catch (error) {
        console.error("Error updating payment method:", error);
        return null;
    }
}

// Delete payment method
export async function deleteUserPaymentMethod(documentId: string): Promise<boolean> {
    try {
        await strapi.delete(`/api/payment-methods/${documentId}`);
        return true;
    } catch (error) {
        console.error("Error deleting payment method:", error);
        return false;
    }
}

// Unset all default payment methods for a user (except the one being set as default)
async function unsetAllDefaultPaymentMethods(
    userId: string | number,
    excludeDocumentId?: string
): Promise<void> {
    try {
        const methods = await getUserPaymentMethods(userId);
        const promises = methods
            .filter(m => m.default && m.documentId !== excludeDocumentId)
            .map(m => updateUserPaymentMethod(m.documentId, { default: false }));
        await Promise.all(promises);
    } catch (error) {
        console.error("Error unsetting default payment methods:", error);
    }
}

// Public catalog of payment methods (no user relation) - legacy
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
        const response = await strapiPublic.get(`/api/payment-methods?populate=*`);
        return (response.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            code: item.code,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        }));
    } catch (error) {
        console.error("Error fetching payment methods:", error);
        return [];
    }
}

