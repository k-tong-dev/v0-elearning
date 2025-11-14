import { strapi } from "./client";

export interface StrapiUserProfile {
    id?: number;
    documentId?: string;
    username?: string;
    email?: string;
    name?: string;
    bio?: string;
    avatar?: any;
    user_group_limit?: number | null;
    user_group_member_limit?: number | null;
}

const mapUserProfile = (user: any): StrapiUserProfile => {
    if (!user) return {};
    if (user.attributes) {
        const attrs = user.attributes;
        return {
            id: user.id ?? attrs.id,
            documentId: attrs.documentId,
            username: attrs.username,
            email: attrs.email,
            name: attrs.name,
            bio: attrs.bio,
            avatar: attrs.avatar ?? user.avatar,
            user_group_limit: attrs.user_group_limit ?? null,
            user_group_member_limit: attrs.user_group_member_limit ?? null,
        };
    }
    return {
        id: user.id,
        documentId: user.documentId,
        username: user.username,
        email: user.email,
        name: user.name,
        bio: user.bio,
        avatar: user.avatar,
        user_group_limit: user.user_group_limit ?? null,
        user_group_member_limit: user.user_group_member_limit ?? null,
    };
};

export async function getUsersByIdentifiers(
    identifiers: Array<{ id?: number | string | null; documentId?: string | null }>
): Promise<StrapiUserProfile[]> {
    if (!Array.isArray(identifiers) || identifiers.length === 0) {
        return [];
    }

    const numericIds = new Set<number>();
    const documentIds = new Set<string>();

    identifiers.forEach(({ id, documentId }) => {
        if (id !== undefined && id !== null && id !== "") {
            const numeric = typeof id === "number" ? id : Number(id);
            if (Number.isFinite(numeric)) {
                numericIds.add(numeric);
            }
        }
        if (documentId) {
            documentIds.add(String(documentId));
        }
    });

    if (numericIds.size === 0 && documentIds.size === 0) {
        return [];
    }

    const params = new URLSearchParams();
    let orIndex = 0;

    if (numericIds.size > 0) {
        const index = orIndex++;
        Array.from(numericIds).forEach((value, idx) => {
            params.append(`filters[$or][${index}][id][$in][${idx}]`, String(value));
        });
    }

    if (documentIds.size > 0) {
        const index = orIndex++;
        Array.from(documentIds).forEach((value, idx) => {
            params.append(`filters[$or][${index}][documentId][$in][${idx}]`, value);
        });
    }

    params.set("populate[avatar]", "*");
    params.set("pagination[page]", "1");
    params.set("pagination[pageSize]", String(Math.max(identifiers.length, 50)));

    const response = await strapi.get(`/api/users?${params.toString()}`);
    const payload = response.data;
    const rawUsers = Array.isArray(payload) ? payload : payload?.data || [];

    return rawUsers.map(mapUserProfile);
}
