export function getAvatarUrl(avatar: any): string | null {
    if (!avatar) return null;

    const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "";

    if (typeof avatar === "string") {
        if (avatar.startsWith("http")) return avatar;
        return baseUrl + avatar;
    }

    const url =
        avatar?.formats?.medium?.url ||
        avatar?.formats?.small?.url ||
        avatar?.url;

    return url ? baseUrl + url : null;
}
