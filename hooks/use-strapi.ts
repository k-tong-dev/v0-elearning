"use client";

import { useState, useEffect, useCallback } from "react";
import { strapi, strapiPublic } from "@/integrations/strapi/client";
import { toast } from "sonner";

interface UseStrapiOptions {
    showToast?: boolean;
}

export function useStrapi<T>(options?: UseStrapiOptions) {
    const { showToast = true } = options || {};
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (endpoint: string, isPublic: boolean = false) => {
        setLoading(true);
        setError(null);
        try {
            const client = isPublic ? strapiPublic : strapi;
            const response = await client.get(endpoint);
            setData(response.data);
        } catch (err: any) {
            console.error(`Error fetching from Strapi endpoint ${endpoint}:`, err);
            const errorMessage = err.response?.data?.error?.message || err.message || "An unexpected error occurred.";
            setError(errorMessage);
            if (showToast) {
                toast.error(`Failed to load data: ${errorMessage}`, { position: "top-center" });
            }
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    return { data, loading, error, fetchData };
}