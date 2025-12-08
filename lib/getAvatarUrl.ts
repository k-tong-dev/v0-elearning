export function getAvatarUrl(avatar: any): string | null {
    if (!avatar) return null;

    const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "";

    const resolveUrl = (value: any): string | null => {
        if (!value) return null;

        if (typeof value === "string") {
            if (value.startsWith("http")) return value;
            return baseUrl ? `${baseUrl}${value}` : value;
        }

        if (Array.isArray(value)) {
            for (const item of value) {
                const resolved = resolveUrl(item);
                if (resolved) return resolved;
            }
            return null;
        }

        const node =
            value?.data?.attributes ||
            value?.data ||
            value?.attributes ||
            value;

        const url =
            node?.formats?.medium?.url ||
            node?.formats?.small?.url ||
            node?.formats?.thumbnail?.url ||
            node?.url;

        if (typeof url === "string") {
            if (url.startsWith("http")) return url;
            return baseUrl ? `${baseUrl}${url}` : url;
        }

        return null;
    };

    return resolveUrl(avatar);
}
