type CacheEntry<T> = {
    value: T;
    expiresAt: number;
    tags: Set<string>;
};

export interface CacheSetOptions {
    ttlMs?: number;
    tags?: string[];
}

interface CacheConfig {
    defaultTtlMs: number;
    maxEntries: number;
}

/**
 * Lightweight in-memory cache with TTL + tag-based invalidation.
 * Designed for server-side usage (e.g. caching Strapi responses) to reduce DB load.
 */
export class InMemoryCache {
    private store = new Map<string, CacheEntry<unknown>>();
    private readonly defaultTtlMs: number;
    private readonly maxEntries: number;

    constructor(config: CacheConfig) {
        this.defaultTtlMs = Math.max(config.defaultTtlMs, 1000);
        this.maxEntries = Math.max(config.maxEntries, 1);
    }

    get<T>(key: string): T | undefined {
        const entry = this.store.get(key);
        if (!entry) return undefined;

        if (entry.expiresAt <= Date.now()) {
            this.store.delete(key);
            return undefined;
        }

        return entry.value as T;
    }

    set<T>(key: string, value: T, options: CacheSetOptions = {}): void {
        const ttlMs = options.ttlMs ?? this.defaultTtlMs;
        const tags = new Set(options.tags ?? []);
        const expiresAt = Date.now() + Math.max(ttlMs, 1000);

        this.store.set(key, { value, expiresAt, tags });
        this.trim();
    }

    delete(key: string): void {
        this.store.delete(key);
    }

    clear(): void {
        this.store.clear();
    }

    invalidateTag(tag: string): void {
        for (const [key, entry] of this.store.entries()) {
            if (entry.tags.has(tag)) {
                this.store.delete(key);
            }
        }
    }

    private trim(): void {
        if (this.store.size <= this.maxEntries) return;
        const toRemove = this.store.size - this.maxEntries;
        const keys = this.store.keys();
        for (let i = 0; i < toRemove; i++) {
            const nextKey = keys.next().value;
            if (!nextKey) break;
            this.store.delete(nextKey);
        }
    }
}

const DEFAULT_TTL = Number(process.env.STRAPI_CACHE_TTL_MS ?? 300_000);
const DEFAULT_MAX = Number(process.env.STRAPI_CACHE_MAX_ENTRIES ?? 256);

export const strapiResponseCache = new InMemoryCache({
    defaultTtlMs: Number.isFinite(DEFAULT_TTL) ? DEFAULT_TTL : 300_000,
    maxEntries: Number.isFinite(DEFAULT_MAX) ? DEFAULT_MAX : 256,
});

export function invalidateStrapiCacheByTag(tag: string): void {
    strapiResponseCache.invalidateTag(tag);
}

