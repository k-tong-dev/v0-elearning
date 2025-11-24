import {strapi, strapiPublic} from "./client";
import {getAvatarUrl} from "@/lib/getAvatarUrl";
import {getUsersByIdentifiers} from "./user";

export type QuizAttemptStatus = "in_progress" | "submitted" | "graded";

export interface QuizAttemptEntity {
    id: number;
    documentId: string;
    user: { id: number; name?: string | null; email?: string | null; avatarUrl?: string | null };
    certificate_program: { id: number };
    course_content?: { id: number } | null;
    issued_certificate?: { id: number } | null;
    attempt_status: QuizAttemptStatus;
    score?: number | null;
    max_score: number;
    started_at: string;
    completed_at?: string | null;
    duration_seconds?: number | null;
    metadata?: Record<string, any> | null;
}

type QuizAttemptUser = {
    id: number;
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
};

const normalizeUser = (user: any): QuizAttemptUser => {
    if (!user) {
        return { id: 0, name: null, email: null, avatarUrl: null };
    }
    const data = user.data ?? user;
    const attributes = data.attributes ?? data;
    const id = data.id ?? attributes?.id ?? 0;
    const firstName = attributes?.first_name ?? attributes?.firstname;
    const lastName = attributes?.last_name ?? attributes?.lastname;
    const fullName =
        attributes?.full_name ||
        attributes?.name ||
        [firstName, lastName].filter(Boolean).join(" ") ||
        attributes?.username ||
        attributes?.email ||
        (id ? `User #${id}` : null);
    const email = attributes?.email ?? null;
    const avatarSource =
        attributes?.avatar ??
        attributes?.profile_picture ??
        attributes?.picture ??
        attributes?.image ??
        attributes?.avatarUrl;
    const avatarUrl = getAvatarUrl(avatarSource);
    return {
        id,
        name: fullName,
        email,
        avatarUrl,
    };
};

// Helper to resolve documentId from numeric ID
async function resolveDocumentIdByNumericId(
    collection: string,
    numericId: number,
): Promise<string | null> {
    const query = [`filters[id][$eq]=${numericId}`, "fields[0]=documentId"].join("&");
    const url = `/api/${collection}?${query}`;
    const clients = [strapi, strapiPublic];
    for (const client of clients) {
        try {
            const response = await client.get(url);
            const items = response.data?.data ?? [];
            if (items.length > 0) {
                return items[0].documentId;
            }
        } catch (error) {
            console.warn(`Failed to resolve documentId for ${collection}`, error);
        }
    }
    return null;
}

export async function createQuizAttempt(data: {
    user: number;
    certificate_program: number;
    course_content?: number | null;
    attempt_status?: QuizAttemptStatus;
    max_score?: number;
    started_at?: string;
    metadata?: Record<string, any>;
}): Promise<QuizAttemptEntity | null> {
    try {
        // Resolve documentIds for relations to ensure Strapi Admin UI displays them
        const userDocumentId = await resolveDocumentIdByNumericId("users", data.user);
        if (!userDocumentId) {
            console.error("Failed to resolve user documentId for quiz attempt creation");
            return null;
        }

        const certProgramDocumentId = await resolveDocumentIdByNumericId("certificate-programs", data.certificate_program);
        if (!certProgramDocumentId) {
            console.error("Failed to resolve certificate_program documentId for quiz attempt creation");
            return null;
        }

        let contentConnect = undefined;
        if (data.course_content) {
            const contentDocId = await resolveDocumentIdByNumericId("course-contents", data.course_content);
            if (contentDocId) {
                contentConnect = { connect: [{ documentId: contentDocId }] };
            }
        }

        const response = await strapi.post("/api/quiz-attempts", {
            data: {
                // Use connect with documentId for CREATE to ensure Strapi Admin UI displays the relation
                user: {
                    connect: [{ documentId: userDocumentId }],
                },
                certificate_program: {
                    connect: [{ documentId: certProgramDocumentId }],
                },
                course_content: contentConnect,
                attempt_status: data.attempt_status ?? "in_progress",
                max_score: data.max_score ?? 100,
                started_at: data.started_at ?? new Date().toISOString(),
                metadata: data.metadata ?? undefined,
            },
        });
        const item = response.data?.data;
        return {
            id: item.id,
            documentId: item.documentId,
            user: normalizeUser(item.user),
            certificate_program: item.certificate_program?.data
                ? { id: item.certificate_program.data.id }
                : { id: item.certificate_program.id },
            course_content: item.course_content
                ? item.course_content.data
                    ? { id: item.course_content.data.id }
                    : { id: item.course_content.id }
                : null,
            issued_certificate: item.issued_certificate
                ? item.issued_certificate.data
                    ? { id: item.issued_certificate.data.id }
                    : { id: item.issued_certificate.id }
                : null,
            attempt_status: item.attempt_status ?? "in_progress",
            score: item.score ?? null,
            max_score: Number(item.max_score ?? 100),
            started_at: item.started_at ?? new Date().toISOString(),
            completed_at: item.completed_at ?? null,
            duration_seconds: item.duration_seconds ?? null,
            metadata: item.metadata ?? null,
        };
    } catch (error) {
        console.error("Error creating quiz attempt:", error);
        return null;
    }
}

export async function updateQuizAttempt(
    id: string | number,
    data: Partial<{
        attempt_status: QuizAttemptStatus;
        score: number;
        completed_at: string;
        duration_seconds: number;
        issued_certificate: number;
        metadata: Record<string, any>;
    }>,
): Promise<QuizAttemptEntity | null> {
    try {
        let documentId: string;
        const isNumericId = typeof id === "number" || (typeof id === "string" && /^\d+$/.test(id));
        if (isNumericId) {
            const numericId = typeof id === "string" ? Number(id) : id;
            const fetchResponse = await strapiPublic.get(`/api/quiz-attempts?filters[id][$eq]=${numericId}`);
            const items = fetchResponse.data?.data ?? [];
            if (items.length === 0) {
                console.error("Quiz attempt not found with id:", numericId);
                return null;
            }
            documentId = items[0].documentId;
        } else {
            documentId = id as string;
        }

        const response = await strapi.put(`/api/quiz-attempts/${documentId}`, {
            data,
        });
        const item = response.data?.data;
        return {
            id: item.id,
            documentId: item.documentId,
            user: normalizeUser(item.user),
            certificate_program: item.certificate_program?.data
                ? { id: item.certificate_program.data.id }
                : { id: item.certificate_program.id },
            course_content: item.course_content
                ? item.course_content.data
                    ? { id: item.course_content.data.id }
                    : { id: item.course_content.id }
                : null,
            issued_certificate: item.issued_certificate
                ? item.issued_certificate.data
                    ? { id: item.issued_certificate.data.id }
                    : { id: item.issued_certificate.id }
                : null,
            attempt_status: item.attempt_status ?? "in_progress",
            score: item.score ?? null,
            max_score: Number(item.max_score ?? 100),
            started_at: item.started_at ?? new Date().toISOString(),
            completed_at: item.completed_at ?? null,
            duration_seconds: item.duration_seconds ?? null,
            metadata: item.metadata ?? null,
        };
    } catch (error) {
        console.error("Error updating quiz attempt:", error);
        return null;
    }
}

export async function getQuizAttempts(filters?: {
    userId?: number;
    certificateProgramId?: number;
    courseContentId?: number;
    attemptStatus?: QuizAttemptStatus;
}): Promise<QuizAttemptEntity[]> {
    try {
        const params = new URLSearchParams();
        params.set("populate", "*");
        
        if (filters?.userId) {
            params.set("filters[user][id][$eq]", String(filters.userId));
        }
        if (filters?.certificateProgramId) {
            params.set("filters[certificate_program][id][$eq]", String(filters.certificateProgramId));
        }
        if (filters?.courseContentId) {
            params.set("filters[course_content][id][$eq]", String(filters.courseContentId));
        }
        if (filters?.attemptStatus) {
            params.set("filters[attempt_status][$eq]", filters.attemptStatus);
        }

        const response = await strapiPublic.get(`/api/quiz-attempts?${params.toString()}`);
        const items = response.data?.data || [];

        const attempts: QuizAttemptEntity[] = items.map((item: any): QuizAttemptEntity => ({
            id: item.id,
            documentId: item.documentId,
            user: normalizeUser(item.user),
            certificate_program: item.certificate_program?.data
                ? { id: item.certificate_program.data.id }
                : { id: item.certificate_program?.id ?? 0 },
            course_content: item.course_content
                ? item.course_content.data
                    ? { id: item.course_content.data.id }
                    : { id: item.course_content.id }
                : null,
            issued_certificate: item.issued_certificate
                ? item.issued_certificate.data
                    ? { id: item.issued_certificate.data.id }
                    : { id: item.issued_certificate.id }
                : null,
            attempt_status: item.attempt_status ?? "in_progress",
            score: item.score ?? null,
            max_score: Number(item.max_score ?? 100),
            started_at: item.started_at ?? new Date().toISOString(),
            completed_at: item.completed_at ?? null,
            duration_seconds: item.duration_seconds ?? null,
            metadata: item.metadata ?? null,
        }));

        const missingEntries: Array<[number, { id: number }]> = attempts
            .filter(
                (attempt: QuizAttemptEntity) =>
                    !attempt.user.avatarUrl ||
                    !attempt.user.name ||
                    attempt.user.name?.startsWith("User #"),
            )
            .map(
                (attempt): [number, { id: number }] => [
                    attempt.user.id,
                    { id: attempt.user.id },
                ],
            );

        const missingProfiles: { id: number }[] = Array.from(
            new Map<number, { id: number }>(missingEntries).values(),
        );

        if (missingProfiles.length > 0) {
            try {
                const profiles = await getUsersByIdentifiers(missingProfiles);
                const profileMap = new Map(
                    profiles.map((profile) => [profile.id, profile]),
                );
                return attempts.map((attempt: QuizAttemptEntity) => {
                    const profile = profileMap.get(attempt.user.id);
                    if (!profile) return attempt;
                    return {
                        ...attempt,
                        user: {
                            ...attempt.user,
                            name:
                                profile.name ||
                                profile.username ||
                                attempt.user.name,
                            email: profile.email ?? attempt.user.email,
                            avatarUrl:
                                getAvatarUrl(profile.avatar) ||
                                attempt.user.avatarUrl,
                        },
                    };
                });
            } catch (error) {
                console.warn("Failed to load user profiles for quiz attempts:", error);
            }
        }

        return attempts;
    } catch (error) {
        console.error("Error fetching quiz attempts:", error);
        return [];
    }
}

export async function getQuizAttempt(id: string | number): Promise<QuizAttemptEntity | null> {
    try {
        let documentId: string;
        const isNumericId = typeof id === "number" || (typeof id === "string" && /^\d+$/.test(id));
        if (isNumericId) {
            const numericId = typeof id === "string" ? Number(id) : id;
            const fetchResponse = await strapiPublic.get(
                `/api/quiz-attempts?filters[id][$eq]=${numericId}&populate=*`,
            );
            const items = fetchResponse.data?.data ?? [];
            if (items.length === 0) {
                return null;
            }
            documentId = items[0].documentId;
        } else {
            documentId = id as string;
        }

        const response = await strapiPublic.get(`/api/quiz-attempts/${documentId}?populate=*`);
        const item = response.data?.data;

        return {
            id: item.id,
            documentId: item.documentId,
            user: normalizeUser(item.user),
            certificate_program: item.certificate_program?.data
                ? { id: item.certificate_program.data.id }
                : { id: item.certificate_program?.id ?? 0 },
            course_content: item.course_content
                ? item.course_content.data
                    ? { id: item.course_content.data.id }
                    : { id: item.course_content.id }
                : null,
            issued_certificate: item.issued_certificate
                ? item.issued_certificate.data
                    ? { id: item.issued_certificate.data.id }
                    : { id: item.issued_certificate.id }
                : null,
            attempt_status: item.attempt_status ?? "in_progress",
            score: item.score ?? null,
            max_score: Number(item.max_score ?? 100),
            started_at: item.started_at ?? new Date().toISOString(),
            completed_at: item.completed_at ?? null,
            duration_seconds: item.duration_seconds ?? null,
            metadata: item.metadata ?? null,
        };
    } catch (error) {
        console.error("Error fetching quiz attempt:", error);
        return null;
    }
}

export async function deleteQuizAttempt(id: string | number): Promise<boolean> {
    try {
        let documentId: string;
        const isNumericId = typeof id === "number" || (typeof id === "string" && /^\d+$/.test(id));
        if (isNumericId) {
            const numericId = typeof id === "string" ? Number(id) : id;
            const fetchResponse = await strapiPublic.get(`/api/quiz-attempts?filters[id][$eq]=${numericId}`);
            const items = fetchResponse.data?.data ?? [];
            if (items.length === 0) {
                console.error("Quiz attempt not found with id:", numericId);
                return false;
            }
            documentId = items[0].documentId;
        } else {
            documentId = id as string;
        }
        await strapi.delete(`/api/quiz-attempts/${documentId}`);
        return true;
    } catch (error) {
        console.error("Error deleting quiz attempt:", error);
        return false;
    }
}

