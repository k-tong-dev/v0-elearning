import { strapi, strapiPublic } from './client';

export interface PaymentMethod {
    id: number;
    documentId: string;
    name: string;
    code: string; // e.g., bank_transfer, paypal, stripe, manual
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string | null;
}

// Public catalog of payment methods (no user relation)
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
// No create/update/delete here; methods are managed in Strapi and selected during checkout.

