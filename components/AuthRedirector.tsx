"use client";

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { PageLoading } from '@/components/page-loading';

export function AuthRedirector({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading=false } = useAuth();
    const router = useRouter();
    const pathname = usePathname();


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
        if (isLoading) {
            return;
        }
        const isAuthFlowPage = authRoutes.some(route => pathname.startsWith(route));
        if (isAuthenticated && user && user.id === null && pathname !== '/auth/signup') {
            router.replace('/auth/signup');
            return;
        }
        if(user?.id  && pathname === '/auth/signup') {
            if (hasCompletedOnboarding) {
                router.replace('/');
            }
            return;
        }
        if(!user?.id  && pathname === '/dashboard') {
            router.replace('/');
        }

    }, [isLoading, isAuthenticated, user, pathname, router, hasCompletedOnboarding]);
    // if (isLoading) {
    //     return <PageLoading message="Session Loading..." />;
    // }

    return <>{children}</>;
}