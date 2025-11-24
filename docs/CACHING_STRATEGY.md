## Caching Strategy

### Goals
- Shield Strapi + its database from repeated read-heavy requests.
- Keep the cache server-side only, so public data can be reused safely.
- Offer explicit escape hatches (`forceRefresh`, tag invalidation) for time-sensitive data.

### Implementation Overview
1. `lib/cache.ts` provides a lightweight TTL-based in-memory cache with tag invalidation.
2. `integrations/strapi/courseCourse.ts` now caches the expensive `getPublicCourseCourses` call.
   - Cache key combines the query params to prevent collisions.
   - Tag (`strapi:courseCourse`) lets us invalidate related entries when a course changes.
   - Consumers can bypass cache via `forceRefresh` or override TTL with `cacheTtlMs`.
3. Environment variables let us tune cache behaviour without code changes:
   - `STRAPI_CACHE_TTL_MS` (default 300000) – global default TTL in ms.
   - `STRAPI_CACHE_MAX_ENTRIES` (default 256) – max number of in-memory entries.

### Usage Patterns
```ts
// Default cached response (5 min TTL)
const courses = await getPublicCourseCourses();

// Force a live refresh after a course mutation
await getPublicCourseCourses({ forceRefresh: true });

// Custom TTL for short-lived data
await getPublicCourseCourses({ cacheTtlMs: 60_000 });

// Manual invalidation after admin tooling publishes a course
invalidatePublicCourseCoursesCache();
```

### Extending To Other Fetches
1. Identify a deterministic key (URL + params) for the fetch.
2. Wrap the normalization result with `strapiResponseCache.set(key, data, { tags: [...] })`.
3. Expose optional `forceRefresh`/`cacheTtlMs` flags mirroring the current pattern.
4. When data can change via mutations, call `strapiResponseCache.invalidateTag(tag)` (or export a helper) right after the mutation.

Because Next.js serverless functions are short-lived, this cache primarily benefits API routes and long-lived Node processes (dev server, serverful deployments). For edge/serverless environments, consider pairing this pattern with a shared cache (Redis, Upstash, Vercel KV) to persist data across invocations.

