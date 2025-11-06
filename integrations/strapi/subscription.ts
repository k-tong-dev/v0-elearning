import { strapiPublic, strapi } from './client';

export interface Subscription {
    id: number;
    documentId: string;
    name: string;
    type: 'Free' | 'Basic' | 'Pro' | 'Enterpris';
    price: number;
    price_per_instructor: number;
    sequnce?: number; // Note: typo in schema, but keeping it as is
    group_plan?: 'base' | 'friend_extend';
    amount_instructor?: number; // Instructor limit from subscription
    amount_instructor_group_allowed?: number; // Instructor group limit from subscription
    subscription_tax?: {
        id: number;
        name: string;
        price: number; // This is the tax percentage
    };
    subscription_benefits?: Array<{
        id: number;
        name: string;
        locked: boolean;
    }>;
    currency?: {
        id: number;
        name: string;
        code: string;
    };
    is_popular: boolean;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string | null;
}

export interface UserSubscription {
    id: number;
    documentId: string;
    user: number | string;
    subscription: number | Subscription;
    state: 'active' | 'cancelled' | 'pending';
    current_instructor_count: number;
    next_billing_date: string;
    last_billing_date?: string;
    stripe_subscription_id?: string;
    stripe_customer_id?: string;
    cancelled_at?: string;
    auto_renew: boolean;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string | null;
}

// Get all subscription plans
export async function getSubscriptionPlans(): Promise<Subscription[]> {
    try {
        const response = await strapiPublic.get('/api/subscriptions?populate=*');
        return (response.data.data || []).map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            type: item.type,
            price: item.price,
            price_per_instructor: item.price_per_instructor,
            sequnce: item.sequnce || 0,
            group_plan: item.group_plan || 'base',
            amount_instructor: item.amount_instructor,
            amount_instructor_group_allowed: item.amount_instructor_group_allowed,
            subscription_tax: item.subscription_tax,
            subscription_benefits: item.subscription_benefits,
            currency: item.currency,
            is_popular: item.is_popular,
            description: item.description,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        }));
    } catch (error) {
        console.error("Error fetching subscription plans:", error);
        return [];
    }
}

// Get a single subscription plan
export async function getSubscriptionPlan(id: string | number): Promise<Subscription | null> {
    try {
        const response = await strapiPublic.get(`/api/subscriptions/${id}?populate=*`);
        const item = response.data.data;
        
        return {
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            type: item.type,
            price: item.price,
            price_per_instructor: item.price_per_instructor,
            subscription_tax: item.subscription_tax,
            subscription_benefits: item.subscription_benefits,
            currency: item.currency,
            is_popular: item.is_popular,
            description: item.description,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        };
    } catch (error) {
        console.error("Error fetching subscription plan:", error);
        return null;
    }
}

// Get user's subscription
export async function getUserSubscription(userId: string | number): Promise<UserSubscription | null> {
    try {
        const response = await strapi.get(
            `/api/user-subscriptions?filters[user][id][$eq]=${userId}&filters[state]=active&populate=*`
        );
        const data = response.data.data;
        
        if (!data || data.length === 0) return null;
        
        const item = data[0];
        return {
            id: item.id,
            documentId: item.documentId,
            user: item.user?.id || item.user,
            subscription: item.subscription,
            state: item.state,
            current_instructor_count: item.current_instructor_count,
            next_billing_date: item.next_billing_date,
            last_billing_date: item.last_billing_date,
            stripe_subscription_id: item.stripe_subscription_id,
            stripe_customer_id: item.stripe_customer_id,
            cancelled_at: item.cancelled_at,
            auto_renew: item.auto_renew,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        };
    } catch (error) {
        console.error("Error fetching user subscription:", error);
        return null;
    }
}

// Get all user subscriptions (all states)
export async function getAllUserSubscriptions(userId: string | number): Promise<UserSubscription[]> {
    try {
        const response = await strapi.get(
            `/api/user-subscriptions?filters[user][id][$eq]=${userId}&populate=*&sort=createdAt:desc`
        );
        const data = response.data.data;
        
        if (!data || data.length === 0) return [];
        
        return data.map((item: any) => {
            // Map subscription data if it's populated
            let subscriptionData: number | Subscription = item.subscription;
            if (item.subscription && typeof item.subscription === 'object') {
                subscriptionData = {
                    id: item.subscription.id,
                    documentId: item.subscription.documentId,
                    name: item.subscription.name,
                    type: item.subscription.type,
                    price: item.subscription.price,
                    price_per_instructor: item.subscription.price_per_instructor,
                    sequnce: item.subscription.sequnce || 0,
                    group_plan: item.subscription.group_plan || 'base',
                    amount_instructor: item.subscription.amount_instructor,
                    amount_instructor_group_allowed: item.subscription.amount_instructor_group_allowed,
                    subscription_tax: item.subscription.subscription_tax,
                    subscription_benefits: item.subscription.subscription_benefits,
                    currency: item.subscription.currency,
                    is_popular: item.subscription.is_popular,
                    description: item.subscription.description,
                    createdAt: item.subscription.createdAt,
                    updatedAt: item.subscription.updatedAt,
                    publishedAt: item.subscription.publishedAt,
                } as Subscription;
            }
            
            return {
                id: item.id,
                documentId: item.documentId,
                user: item.user?.id || item.user,
                subscription: subscriptionData,
                state: item.state,
                current_instructor_count: item.current_instructor_count || 0,
                next_billing_date: item.next_billing_date,
                last_billing_date: item.last_billing_date,
                stripe_subscription_id: item.stripe_subscription_id,
                stripe_customer_id: item.stripe_customer_id,
                cancelled_at: item.cancelled_at,
                auto_renew: item.auto_renew !== undefined ? item.auto_renew : true,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                publishedAt: item.publishedAt,
            };
        });
    } catch (error) {
        console.error("Error fetching user subscriptions:", error);
        return [];
    }
}

// Create user subscription
export async function createUserSubscription(
    userId: string,
    subscriptionId: string,
    data?: Partial<UserSubscription>
): Promise<UserSubscription | null> {
    try {
        const now = new Date();
        const nextBilling = new Date();
        nextBilling.setMonth(nextBilling.getMonth() + 1); // Default: 1 month from now
        
        const response = await strapi.post('/api/user-subscriptions', {
            data: {
                user: userId,
                subscription: subscriptionId,
                state: data?.state || 'pending',
                current_instructor_count: data?.current_instructor_count || 0,
                next_billing_date: data?.next_billing_date || nextBilling.toISOString().split('T')[0],
                last_billing_date: data?.last_billing_date,
                stripe_subscription_id: data?.stripe_subscription_id,
                stripe_customer_id: data?.stripe_customer_id,
                cancelled_at: data?.cancelled_at,
                auto_renew: data?.auto_renew !== undefined ? data.auto_renew : true,
            }
        });
        
        const item = response.data.data;
        return {
            id: item.id,
            documentId: item.documentId,
            user: item.user,
            subscription: item.subscription,
            state: item.state,
            current_instructor_count: item.current_instructor_count,
            next_billing_date: item.next_billing_date,
            last_billing_date: item.last_billing_date,
            stripe_subscription_id: item.stripe_subscription_id,
            stripe_customer_id: item.stripe_customer_id,
            cancelled_at: item.cancelled_at,
            auto_renew: item.auto_renew,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        };
    } catch (error) {
        console.error("Error creating user subscription:", error);
        return null;
    }
}

// Update user subscription
export async function updateUserSubscription(id: string, data: Partial<UserSubscription>): Promise<UserSubscription | null> {
    try {
        const response = await strapi.put(`/api/user-subscriptions/${id}`, {
            data
        });
        
        const item = response.data.data;
        return {
            id: item.id,
            documentId: item.documentId,
            user: item.user,
            subscription: item.subscription,
            state: item.state,
            current_instructor_count: item.current_instructor_count,
            next_billing_date: item.next_billing_date,
            last_billing_date: item.last_billing_date,
            stripe_subscription_id: item.stripe_subscription_id,
            stripe_customer_id: item.stripe_customer_id,
            cancelled_at: item.cancelled_at,
            auto_renew: item.auto_renew,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        };
    } catch (error) {
        console.error("Error updating user subscription:", error);
        return null;
    }
}

// Calculate billing amount based on usage
export function calculateSubscriptionBilling(
    instructorCount: number,
    subscription: Subscription
): {
    instructor_count: number;
    chargeable_instructors: number;
    subtotal: number;
    tax_percentage: number;
    tax_amount: number;
    total: number;
    currency?: string;
} {
    // First instructor is FREE
    const chargeableInstructors = Math.max(0, instructorCount - 1);
    // Note: price_per_instructor field has been removed, using base price instead
    const pricePerInstructor = subscription.price_per_instructor || 0;
    const subtotal = chargeableInstructors * pricePerInstructor;
    
    // Get tax percentage from subscription_tax
    const taxPercentage = subscription.subscription_tax?.price || 0;
    const taxAmount = subtotal * (taxPercentage / 100);
    const total = subtotal + taxAmount;
    
    return {
        instructor_count: instructorCount,
        chargeable_instructors: chargeableInstructors,
        subtotal,
        tax_percentage: taxPercentage,
        tax_amount: taxAmount,
        total,
        currency: subscription.currency?.code || 'USD'
    };
}

