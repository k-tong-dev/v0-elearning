"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { PageLoading } from '@/components/page-loading';
import { getStrapiUserByEmail } from "@/integrations/strapi/utils"

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
            (async () => {
                try {
                    const isUser = await getStrapiUserByEmail(user?.email);
                    if (isUser) {
                        router.replace('/');
                    }
                } catch (error) {
                    console.error("Error checking Strapi user:", error);
                }
            })();
            return;
        }
        if(!user?.id  && pathname === '/dashboard') {
            router.replace('/');
        }

    }, [isLoading, isAuthenticated, user, pathname, router]);
    // if (isLoading) {
    //     return <PageLoading message="Session Loading..." />;
    // }

    return <>{children}</>;
}