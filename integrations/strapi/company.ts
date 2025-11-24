import { strapi } from "./client";

const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export interface CompanyEntity {
    id: number;
    name: string;
    logoUrl?: string | null;
}

const toAbsoluteUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${STRAPI_BASE_URL}${url}`;
};

export async function getCompaniesForUser(userId?: string | number | null): Promise<CompanyEntity[]> {
    if (!userId) return [];

    try {
        const params = new URLSearchParams();
        params.set("filters[users][id][$eq]", String(userId));
        params.append("populate", "logo");

        const response = await strapi.get(`/api/companies?${params.toString()}`);
        const items = response.data?.data ?? [];

        return items.map((item: any) => ({
            id: item.id,
            name: item.name,
            logoUrl: toAbsoluteUrl(item.logo?.data?.attributes?.url ?? item.logo?.url),
        }));
    } catch (error) {
        console.error("Error loading companies:", error);
        return [];
    }
}

