/**
 * Hook to track user activity (browser open/active status)
 * Updates user's is_active status in real-time
 */

import { useEffect, useRef } from 'react';
import { useAuth } from './use-auth';
import { strapi } from '@/integrations/strapi/client';

const ACTIVITY_UPDATE_INTERVAL = 30000; // Update every 30 seconds
const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes of inactivity

export function useActivityTracker() {
    const { user } = useAuth();
    const lastActivityRef = useRef<number>(Date.now());
    const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isActiveRef = useRef<boolean>(true);

    useEffect(() => {
        if (!user?.id) return;

        let activityTimeout: NodeJS.Timeout;

        const updateActivity = async (isActive: boolean) => {
            if (!user?.id || isActiveRef.current === isActive) return;

            try {
                // Update user's activity status
                await strapi.put(`/api/users/${user.id}`, {
                    data: {
                        is_active: isActive,
                    }
                });
                isActiveRef.current = isActive;
            } catch (error) {
                console.error('Error updating activity status:', error);
            }
        };

        const handleActivity = () => {
            const now = Date.now();
            const timeSinceLastActivity = now - lastActivityRef.current;

            // Mark as active if user was idle but now active
            if (!isActiveRef.current || timeSinceLastActivity > IDLE_THRESHOLD) {
                updateActivity(true);
            }

            lastActivityRef.current = now;

            // Clear existing timeout
            if (activityTimeout) {
                clearTimeout(activityTimeout);
            }

            // Set new timeout to mark as inactive
            activityTimeout = setTimeout(() => {
                updateActivity(false);
            }, IDLE_THRESHOLD);
        };

        // Track various user activities
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Handle visibility change (tab switch)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                updateActivity(false);
            } else {
                updateActivity(true);
                lastActivityRef.current = Date.now();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Periodic update to ensure activity status is synced
        updateIntervalRef.current = setInterval(() => {
            const now = Date.now();
            const timeSinceLastActivity = now - lastActivityRef.current;

            if (timeSinceLastActivity < IDLE_THRESHOLD && !document.hidden) {
                updateActivity(true);
            } else if (document.hidden || timeSinceLastActivity >= IDLE_THRESHOLD) {
                updateActivity(false);
            }
        }, ACTIVITY_UPDATE_INTERVAL);

        // Initial activity update
        updateActivity(true);
        lastActivityRef.current = Date.now();

        // Cleanup
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            
            if (activityTimeout) {
                clearTimeout(activityTimeout);
            }
            
            if (updateIntervalRef.current) {
                clearInterval(updateIntervalRef.current);
            }

            // Mark as inactive on unmount
            updateActivity(false);
        };
    }, [user?.id]);

    return null; // This hook doesn't return anything, it just tracks activity
}

