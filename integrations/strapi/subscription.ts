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
    amount_friend_allowed?: number; // Friend limit from subscription (for friend_extend type)
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
            amount_friend_allowed: item.amount_friend_allowed,
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
        // Strapi v5: Direct lookup works for documentId (string), but numeric IDs require filtering
        // Check if it's a numeric ID vs documentId
        const isNumericId = typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id));
        
        if (isNumericId) {
            // For numeric IDs, use filter query (Strapi v5 doesn't support numeric ID in URL path)
            const numericId = typeof id === 'string' ? Number(id) : id;
            const response = await strapiPublic.get(
                `/api/subscriptions?filters[id][$eq]=${numericId}&populate=*`
            );
            
            if (response.data?.data && response.data.data.length > 0) {
                const item = response.data.data[0];
                return {
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
                    amount_friend_allowed: item.amount_friend_allowed,
                    subscription_tax: item.subscription_tax,
                    subscription_benefits: item.subscription_benefits,
                    currency: item.currency,
                    is_popular: item.is_popular,
                    description: item.description,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                    publishedAt: item.publishedAt,
                };
            }
            return null;
        } else {
            // For documentId (string), use direct lookup
            const response = await strapiPublic.get(`/api/subscriptions/${id}?populate=*`);
            if (response.data?.data) {
        const item = response.data.data;
                return {
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
                    amount_friend_allowed: item.amount_friend_allowed,
                    subscription_tax: item.subscription_tax,
                    subscription_benefits: item.subscription_benefits,
                    currency: item.currency,
                    is_popular: item.is_popular,
                    description: item.description,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                    publishedAt: item.publishedAt,
                };
            }
            return null;
        }
    } catch (error: any) {
        // If direct lookup fails with 404, try filter as fallback
        if (error.response?.status === 404 && typeof id === 'string') {
            try {
                // Might be a documentId that needs filtering, try by documentId
                const response = await strapiPublic.get(
                    `/api/subscriptions?filters[documentId][$eq]=${id}&populate=*`
                );
                
                if (response.data?.data && response.data.data.length > 0) {
                    const item = response.data.data[0];
        return {
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
                        amount_friend_allowed: item.amount_friend_allowed,
            subscription_tax: item.subscription_tax,
            subscription_benefits: item.subscription_benefits,
            currency: item.currency,
            is_popular: item.is_popular,
            description: item.description,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
        };
                }
            } catch (filterError) {
                // If filter also fails, return null
                console.error("Error fetching subscription plan with filter:", filterError);
            }
        }
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
                    amount_friend_allowed: item.subscription.amount_friend_allowed,
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
    subscriptionId: string | number,
    data?: Partial<UserSubscription>
): Promise<UserSubscription | null> {
    try {
        const now = new Date();
        const nextBilling = new Date();
        nextBilling.setMonth(nextBilling.getMonth() + 1); // Default: 1 month from now
        
        // Convert userId to number if it's a string (Strapi relations need numeric IDs)
        const userIdNum = typeof userId === 'string' ? Number(userId) : userId;
        
        // Convert subscriptionId to number if it's a documentId string
        // If it's already a number or numeric string, use it directly
        let subscriptionIdNum: number;
        if (typeof subscriptionId === 'string') {
            // Check if it's a numeric string (ID) or documentId
            if (/^\d+$/.test(subscriptionId)) {
                subscriptionIdNum = Number(subscriptionId);
            } else {
                // It's a documentId, we need to get the numeric ID
                // For now, try to use it as-is (Strapi v5 might accept documentId)
                // But relations typically need numeric IDs
                const plan = await getSubscriptionPlan(subscriptionId);
                if (!plan) {
                    throw new Error(`Subscription plan not found: ${subscriptionId}`);
                }
                subscriptionIdNum = plan.id;
            }
        } else {
            subscriptionIdNum = subscriptionId;
        }
        
        const response = await strapi.post('/api/user-subscriptions', {
            data: {
                user: userIdNum,
                subscription: subscriptionIdNum,
                state: data?.state || 'pending',
                // Remove current_instructor_count - it's not in the schema
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
            user: item.user?.id || item.user,
            subscription: item.subscription,
            state: item.state,
            current_instructor_count: item.current_instructor_count || 0, // Keep for interface compatibility
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
    } catch (error: any) {
        console.error("Error creating user subscription:", error);
        console.error("Error details:", error.response?.data || error.message);
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

// Get all free plans
export async function getFreePlans(): Promise<Subscription[]> {
    try {
        const response = await strapiPublic.get('/api/subscriptions?filters[type][$eq]=Free&populate=*');
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
            amount_friend_allowed: item.amount_friend_allowed,
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
        console.error("Error fetching free plans:", error);
        return [];
    }
}

// Check which free plans user doesn't have
export async function getMissingFreePlans(userId: string | number): Promise<Subscription[]> {
    try {
        // Get all free plans
        const freePlans = await getFreePlans();
        if (freePlans.length === 0) return [];

        // Get user's existing subscriptions
        const userSubscriptions = await getAllUserSubscriptions(userId);
        
        // If user has no subscriptions at all, return all free plans
        if (!userSubscriptions || userSubscriptions.length === 0) {
            return freePlans;
        }
        
        // Extract subscription IDs user already has
        const userSubscriptionIds = new Set<number>();
        userSubscriptions.forEach(sub => {
            if (typeof sub.subscription === 'object' && sub.subscription.id) {
                userSubscriptionIds.add(sub.subscription.id);
            } else if (typeof sub.subscription === 'number') {
                userSubscriptionIds.add(sub.subscription);
            }
        });

        // Return free plans user doesn't have
        return freePlans.filter(plan => !userSubscriptionIds.has(plan.id));
    } catch (error) {
        console.error("Error checking missing free plans:", error);
        return [];
    }
}

// Create user subscriptions for free plans and update user fields
export async function createFreePlanSubscriptions(
    userId: string | number,
    planIds: (string | number)[]
): Promise<{ success: boolean; message: string }> {
    try {
        // Get the plans to create subscriptions for
        const plans = await Promise.all(
            planIds.map(id => getSubscriptionPlan(id))
        );
        const validPlans = plans.filter(p => p !== null) as Subscription[];

        if (validPlans.length === 0) {
            return { success: false, message: "No valid plans found" };
        }

        // Create user subscriptions - use numeric ID for relations (Strapi requires numeric IDs for relations)
        const subscriptionPromises = validPlans.map(plan => {
            // Use numeric ID for the relation, not documentId
            return createUserSubscription(String(userId), plan.id, {
                state: 'active',
                auto_renew: false, // Free plans don't auto-renew
            });
        });

        const createdSubscriptions = await Promise.all(subscriptionPromises);
        const successful = createdSubscriptions.filter(s => s !== null);

        if (successful.length === 0) {
            return { success: false, message: "Failed to create subscriptions" };
        }

        // Update user fields based on plan types
        // First, get current user data to accumulate values (take maximum)
        const userIdNum = typeof userId === 'string' ? Number(userId) : userId;
        let userUpdateData: any = {};
        
        try {
            // Fetch current user to get existing limits and documentId
            const { strapi } = await import('./client');
            
            // For Strapi v5, we need to get user by filter if using numeric ID
            let currentUser: any = {};
            let userDocumentId: string | number = userIdNum;
            
            try {
                // Try to get user by numeric ID using filter
                const userResponse = await strapi.get(`/api/users?filters[id][$eq]=${userIdNum}&populate=*`);
                if (userResponse.data?.data && userResponse.data.data.length > 0) {
                    currentUser = userResponse.data.data[0];
                    userDocumentId = currentUser.documentId || currentUser.id;
                } else {
                    // Fallback: try direct lookup (might work with documentId)
                    const directResponse = await strapi.get(`/api/users/${userIdNum}?populate=*`);
                    currentUser = directResponse.data || {};
                    userDocumentId = currentUser.documentId || userIdNum;
                }
            } catch (fetchError: any) {
                console.error("Error fetching user:", fetchError);
                // Continue with defaults if fetch fails
            }
            
            // Initialize with current values or defaults
            userUpdateData = {
                instructor_limit: currentUser.instructor_limit ?? 1,
                instructor_group_limit: currentUser.instructor_group_limit ?? 20,
                friend_limit: currentUser.friend_limit ?? 1000,
            };
            
            console.log(`[createFreePlanSubscriptions] Current user limits:`, userUpdateData);
            console.log(`[createFreePlanSubscriptions] Plans to process:`, validPlans.map(p => ({
                id: p.id,
                name: p.name,
                group_plan: p.group_plan,
                amount_instructor: p.amount_instructor,
                amount_instructor_group_allowed: p.amount_instructor_group_allowed,
                amount_friend_allowed: p.amount_friend_allowed,
            })));
            
            // Update user fields based on plan types by ADDING plan values on top of current limits
            // friend_extend plans only add to friend_limit
            // base plans add to BOTH instructor_group_limit AND instructor_limit
        for (const plan of validPlans) {
            if (plan.group_plan === 'friend_extend' && plan.amount_friend_allowed) {
                    // friend_extend: add the allowed amount on top of current friend_limit
                    const currentFriendLimit = userUpdateData.friend_limit ?? 0;
                    const increment = Number(plan.amount_friend_allowed) || 0;
                    userUpdateData.friend_limit = currentFriendLimit + increment;
                    console.log(`[createFreePlanSubscriptions] Added ${increment} to friend_limit. New total:`, userUpdateData.friend_limit);
            } else if (plan.group_plan === 'base') {
                    // base: add both instructor group and instructor limits
                    if (plan.amount_instructor_group_allowed !== undefined && plan.amount_instructor_group_allowed !== null) {
                        const currentGroupLimit = userUpdateData.instructor_group_limit ?? 0;
                        const incrementGroup = Number(plan.amount_instructor_group_allowed) || 0;
                        userUpdateData.instructor_group_limit = currentGroupLimit + incrementGroup;
                        console.log(`[createFreePlanSubscriptions] Added ${incrementGroup} to instructor_group_limit. New total:`, userUpdateData.instructor_group_limit);
                    }
                    if (plan.amount_instructor !== undefined && plan.amount_instructor !== null) {
                        const currentInstructorLimit = userUpdateData.instructor_limit ?? 0;
                        const incrementInstructor = Number(plan.amount_instructor) || 0;
                        userUpdateData.instructor_limit = currentInstructorLimit + incrementInstructor;
                        console.log(`[createFreePlanSubscriptions] Added ${incrementInstructor} to instructor_limit. New total:`, userUpdateData.instructor_limit);
                    }
            }
        }

            // Update user with accumulated values
            console.log(`[createFreePlanSubscriptions] Updating user ${userDocumentId} (numeric ID: ${userIdNum}) with:`, userUpdateData);
            
            // Ensure we have access token for authenticated request
            const { getAccessToken } = await import('@/lib/cookies');
            const accessToken = getAccessToken();
            
            if (!accessToken) {
                throw new Error("No access token available. User must be authenticated to update user fields.");
            }
            
            console.log(`[createFreePlanSubscriptions] Using access token for user update`);
            
            // Update user using authenticated strapi client (automatically includes Bearer token)
            const updatePayload = {
                ...userUpdateData
            };

            const updateResponse = await strapi.put(`/api/users/${userIdNum}`, updatePayload);
            console.log(`✅ [createFreePlanSubscriptions] User update successful:`, updateResponse.data);
            
            console.log(`✅ [createFreePlanSubscriptions] User update successful:`, updateResponse.data);
            
            // Verify the update was successful by checking the response
            if (updateResponse?.data) {
                const updatedUser = updateResponse.data;
                const actualValues = {
                    instructor_limit: updatedUser.instructor_limit,
                    instructor_group_limit: updatedUser.instructor_group_limit,
                    friend_limit: updatedUser.friend_limit
                };
                console.log(`[createFreePlanSubscriptions] Verification - Updated user fields:`, actualValues);
                
                // Check if values actually changed
                if (actualValues.instructor_limit === userUpdateData.instructor_limit &&
                    actualValues.instructor_group_limit === userUpdateData.instructor_group_limit &&
                    actualValues.friend_limit === userUpdateData.friend_limit) {
                    console.log(`✅ [createFreePlanSubscriptions] All fields updated successfully!`);
                } else {
                    console.warn(`⚠️ [createFreePlanSubscriptions] Fields did not update correctly!`, {
                        expected: userUpdateData,
                        actual: actualValues
                    });
                    
                    // Try fetching the user again to verify
                    try {
                        const verifyResponse = await strapi.get(`/api/users/${userIdNum}`);
                        const verifiedUser = verifyResponse.data;
                        if (verifiedUser) {
                            console.log(`[createFreePlanSubscriptions] Verified user from database:`, {
                                instructor_limit: verifiedUser.instructor_limit,
                                instructor_group_limit: verifiedUser.instructor_group_limit,
                                friend_limit: verifiedUser.friend_limit
                            });
                        }
                    } catch (verifyError) {
                        console.error("Error verifying user update:", verifyError);
                    }
                }
            }
        } catch (updateError: any) {
            console.error("❌ ERROR UPDATING USER FIELDS:", updateError);
            console.error("Update error details:", {
                status: updateError.response?.status,
                statusText: updateError.response?.statusText,
                data: updateError.response?.data,
                errorMessage: updateError.response?.data?.error?.message,
                errorDetails: updateError.response?.data?.error?.details,
                message: updateError.message,
                url: updateError.config?.url,
                method: updateError.config?.method
            });
            
            // Log the data we tried to send
            console.error("Data that was attempted to be sent:", userUpdateData);
            
            // Don't fail the whole operation if user update fails, but make error very visible
            // The subscriptions were created successfully, so we return success but log the error
            console.warn("⚠️ WARNING: User subscriptions created but user field update failed. User fields may not be updated correctly.");
            console.warn("⚠️ TROUBLESHOOTING: Check Strapi server logs and verify user permissions for:");
            console.warn("   - instructor_limit");
            console.warn("   - instructor_group_limit");
            console.warn("   - friend_limit");
            console.warn("⚠️ These fields may be protected or require admin permissions to update.");
        }

        return {
            success: true,
            message: `Successfully activated ${successful.length} free plan(s)`
        };
    } catch (error) {
        console.error("Error creating free plan subscriptions:", error);
        return { success: false, message: "Failed to activate free plans" };
    }
}

