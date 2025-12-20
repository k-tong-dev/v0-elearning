"use client";

import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { PageLoading } from '@/components/page-loading';

export function AuthRedirector({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading=false } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const authRoutes = [
        '/auth/email-auth',
        '/auth/verify-otp',
        '/auth/password-confirmation',
        '/auth/signup',
        '/auth/start',
        '/auth/forgot-password',
    ];

    const hasCompletedOnboarding = useMemo(() => {
        if (!user) return false;

        const localFlag = typeof window !== 'undefined' && window.localStorage?.getItem('onboardingComplete') === 'true';

        const hasCharacter = Boolean(user?.character);
        const hasLearningGoals = Array.isArray(user?.learning_goals) && user.learning_goals.length > 0;
        const hasLearningStyles = Array.isArray(user?.prefer_to_learns) && user.prefer_to_learns.length > 0;
        const hasInterests = Array.isArray(user?.interested) && user.interested.length > 0;
        const hasBadges = Array.isArray(user?.badges) && user.badges.length > 0;
        const hasAvatar = Boolean(user?.avatar);

        const profileComplete = hasCharacter && hasLearningGoals && hasLearningStyles && hasInterests && hasBadges && hasAvatar;

        return localFlag || profileComplete;
    }, [user]);

    useEffect(() => {
        // Clear any pending redirect timeout
        if (redirectTimeoutRef.current) {
            clearTimeout(redirectTimeoutRef.current);
            redirectTimeoutRef.current = null;
        }

        // Don't do any redirects while authentication is still loading
        if (isLoading) {
            return;
        }
        
        const isAuthFlowPage = authRoutes.some(route => pathname.startsWith(route));
        
        // If authenticated but user.id is null, redirect to signup (except if already on signup)
        if (isAuthenticated && user && user.id === null && pathname !== '/auth/signup') {
            router.replace('/auth/signup');
            return;
        }
        
        // If user has id and is on signup page, redirect to home if onboarding is complete
        if(user?.id  && pathname === '/auth/signup') {
            if (hasCompletedOnboarding) {
                router.replace('/');
            }
            return;
        }
        
        // For dashboard redirect, add a small delay to avoid race conditions
        // Only redirect if we're absolutely sure the user is NOT authenticated after a brief delay
        if(pathname === '/dashboard') {
            // If user is authenticated or has an id, don't redirect
            if (isAuthenticated || user?.id) {
                return;
            }
            
            // Add a delay to allow auth state to fully settle before redirecting
            redirectTimeoutRef.current = setTimeout(() => {
                // Double-check after delay - only redirect if still not authenticated
                // Re-check the current auth state at the time of timeout execution
                if(!isAuthenticated && !user?.id) {
                    router.replace('/');
                }
            }, 1000); // 1 second delay to allow auth state to settle
            
            return () => {
                if (redirectTimeoutRef.current) {
                    clearTimeout(redirectTimeoutRef.current);
                    redirectTimeoutRef.current = null;
                }
            };
        }

    }, [isLoading, isAuthenticated, user, pathname, router, hasCompletedOnboarding]);
    // if (isLoading) {
    //     return <PageLoading message="Session Loading..." />;
    // }

    return <>{children}</>;
}