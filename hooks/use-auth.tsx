"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { User } from "@/types/user";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { getStrapiUserByEmail, storeAccessToken, getAccessToken } from "@/integrations/strapi/utils";
import { removeAccessToken } from "@/lib/cookies";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    loginWithGoogle: (credential: string) => Promise<{ newUser: boolean; user: any }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    userContext: (strapiUser: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const userContext = useCallback((strapiUser: any) => {
        if (!strapiUser) {
            console.error("[userContext] No strapiUser provided");
            return;
        }
        setUser((prev) => ({
            ...strapiUser, // Dynamically include all Strapi fields
            id: strapiUser.id?.toString() || prev?.id || null,
            supabaseId: prev?.supabaseId || strapiUser.supabaseId || null,
            email: strapiUser.email || prev?.email || "",
            name: strapiUser.username || strapiUser.email || prev?.username || "",
        }));
        setIsAuthenticated(true);
    }, []);

    const refreshUser = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = getAccessToken();
            if (token) {
                const res = await fetch(`${STRAPI_URL}/api/users/me?populate=*`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const userData = await res.json();
                    setUser({
                        ...userData,
                        id: userData.id.toString(),
                        supabaseId: userData.supabaseId || null,
                        email: userData.email || "",
                        name: userData.username || userData.email || "",
                    });
                    setIsAuthenticated(true);
                    return;
                } else {
                    // Clear invalid token from cookies
                    removeAccessToken();
                }
            } else {setIsLoading(false);}

            const { data } = await supabase.auth.getSession();
            const supabaseUser = data.session?.user;
            if (supabaseUser) {
                const strapiUser = await getStrapiUserByEmail(supabaseUser.email!);
                if (strapiUser) {
                    setUser({
                        ...strapiUser,
                        id: strapiUser.id.toString(),
                        supabaseId: supabaseUser.id,
                        email: supabaseUser.email!,
                        name: strapiUser.username || supabaseUser.email!,
                    });
                    setIsAuthenticated(true);
                } else {
                    setUser({
                        ...strapiUser,
                        id: null,
                        supabaseId: supabaseUser.id,
                        email: supabaseUser.email!,
                        username: null,
                        name: supabaseUser.user_metadata?.full_name || supabaseUser.email!,
                        avatar: supabaseUser.user_metadata?.avatar_url || null,
                    });
                    setIsAuthenticated(true);
                }
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (err: any) {
            console.error("[refreshUser] Error:", err);
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
        const { data: sub } = supabase.auth.onAuthStateChange(() => refreshUser());
        return () => sub?.subscription.unsubscribe();
    }, [refreshUser]);

    const loginWithGoogle = useCallback(async (credential: string): Promise<{ newUser: boolean; user: any }> => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: "google",
                token: credential,
            });
            if (error) throw error;

            const supabaseUser = data.user;
            if (!supabaseUser?.email) throw new Error("No Supabase user email found");

            const res = await fetch('/api/auth/google', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: supabaseUser.email,
                    name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
                    avatar: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to authenticate with Strapi");
            }
            
            const { jwt, user: strapiUser, newUser } = await res.json();

            storeAccessToken(jwt);
            userContext(strapiUser);
            
            if (!newUser) {
                toast.success("Signed in successfully!", { position: "top-center" });
            }
            
            return { newUser: newUser || false, user: strapiUser };
        } catch (error: any) {
            console.error("[loginWithGoogle] Error:", error);
            toast.error(error.message || "Login failed");
            setUser(null);
            setIsAuthenticated(false);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [userContext]);

    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            await supabase.auth.signOut();
            // Clear token from cookies
            removeAccessToken();
            setUser(null);
            setIsAuthenticated(false);
            toast.success("Signed out successfully");
            router.push("/");
        } catch (error: any) {
            toast.error(error.message || "Logout failed");
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoading,
                loginWithGoogle,
                logout,
                refreshUser,
                userContext,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}