import {strapi, strapiPublic} from "./client";

export type CertificateIssuanceStatus = "active" | "expired" | "revoked";

export interface CertificateIssuanceEntity {
    id: number;
    documentId: string;
    certificate_program: { id: number };
    user: { id: number };
    quiz_attempt?: { id: number } | null;
    issued_at: string;
    valid_until?: string | null;
    revoked_at?: string | null;
    issuance_status: CertificateIssuanceStatus;
    metadata?: Record<string, any> | null;
}

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

export async function createCertificateIssuance(data: {
    certificate_program: number;
    user: number;
    quiz_attempt?: number | null;
    issued_at?: string;
    valid_until?: string | null;
    issuance_status?: CertificateIssuanceStatus;
    metadata?: Record<string, any>;
}): Promise<CertificateIssuanceEntity | null> {
    try {
        // Resolve documentIds for relations to ensure Strapi Admin UI displays them
        const certProgramDocumentId = await resolveDocumentIdByNumericId("certificate-programs", data.certificate_program);
        if (!certProgramDocumentId) {
            console.error("Failed to resolve certificate_program documentId for certificate issuance creation");
            return null;
        }

        const userDocumentId = await resolveDocumentIdByNumericId("users", data.user);
        if (!userDocumentId) {
            console.error("Failed to resolve user documentId for certificate issuance creation");
            return null;
        }

        let quizAttemptConnect = undefined;
        if (data.quiz_attempt) {
            const attemptDocId = await resolveDocumentIdByNumericId("quiz-attempts", data.quiz_attempt);
            if (attemptDocId) {
                quizAttemptConnect = { connect: [{ documentId: attemptDocId }] };
            }
        }

        const response = await strapi.post("/api/certificate-issuances", {
            data: {
                // Use connect with documentId for CREATE to ensure Strapi Admin UI displays the relation
                certificate_program: {
                    connect: [{ documentId: certProgramDocumentId }],
                },
                user: {
                    connect: [{ documentId: userDocumentId }],
                },
                quiz_attempt: quizAttemptConnect,
                issued_at: data.issued_at ?? new Date().toISOString(),
                valid_until: data.valid_until ?? undefined,
                issuance_status: data.issuance_status ?? "active",
                metadata: data.metadata ?? undefined,
            },
        });
        const item = response.data?.data;
        return {
            id: item.id,
            documentId: item.documentId,
            certificate_program: item.certificate_program?.data
                ? { id: item.certificate_program.data.id }
                : { id: item.certificate_program.id },
            user: item.user?.data ? { id: item.user.data.id } : { id: item.user.id },
            quiz_attempt: item.quiz_attempt
                ? item.quiz_attempt.data
                    ? { id: item.quiz_attempt.data.id }
                    : { id: item.quiz_attempt.id }
                : null,
            issued_at: item.issued_at ?? new Date().toISOString(),
            valid_until: item.valid_until ?? null,
            revoked_at: item.revoked_at ?? null,
            issuance_status: item.issuance_status ?? "active",
            metadata: item.metadata ?? null,
        };
    } catch (error) {
        console.error("Error creating certificate issuance:", error);
        return null;
    }
}

export async function updateCertificateIssuance(
    id: string | number,
    data: Partial<{
        valid_until: string | null;
        revoked_at: string | null;
        issuance_status: CertificateIssuanceStatus;
        metadata: Record<string, any>;
    }>,
): Promise<CertificateIssuanceEntity | null> {
    try {
        let documentId: string;
        const isNumericId = typeof id === "number" || (typeof id === "string" && /^\d+$/.test(id));
        if (isNumericId) {
            const numericId = typeof id === "string" ? Number(id) : id;
            const fetchResponse = await strapiPublic.get(`/api/certificate-issuances?filters[id][$eq]=${numericId}`);
            const items = fetchResponse.data?.data ?? [];
            if (items.length === 0) {
                console.error("Certificate issuance not found with id:", numericId);
                return null;
            }
            documentId = items[0].documentId;
        } else {
            documentId = id as string;
        }

        const response = await strapi.put(`/api/certificate-issuances/${documentId}`, {
            data,
        });
        const item = response.data?.data;
        return {
            id: item.id,
            documentId: item.documentId,
            certificate_program: item.certificate_program?.data
                ? { id: item.certificate_program.data.id }
                : { id: item.certificate_program.id },
            user: item.user?.data ? { id: item.user.data.id } : { id: item.user.id },
            quiz_attempt: item.quiz_attempt
                ? item.quiz_attempt.data
                    ? { id: item.quiz_attempt.data.id }
                    : { id: item.quiz_attempt.id }
                : null,
            issued_at: item.issued_at ?? new Date().toISOString(),
            valid_until: item.valid_until ?? null,
            revoked_at: item.revoked_at ?? null,
            issuance_status: item.issuance_status ?? "active",
            metadata: item.metadata ?? null,
        };
    } catch (error) {
        console.error("Error updating certificate issuance:", error);
        return null;
    }
}

export async function getCertificateIssuances(filters?: {
    userId?: number;
    certificateProgramId?: number;
    quizAttemptId?: number;
    issuanceStatus?: CertificateIssuanceStatus;
}): Promise<CertificateIssuanceEntity[]> {
    try {
        const params = new URLSearchParams();
        params.set("populate", "*");

        if (filters?.userId) {
            params.set("filters[user][id][$eq]", String(filters.userId));
        }
        if (filters?.certificateProgramId) {
            params.set("filters[certificate_program][id][$eq]", String(filters.certificateProgramId));
        }
        if (filters?.quizAttemptId) {
            params.set("filters[quiz_attempt][id][$eq]", String(filters.quizAttemptId));
        }
        if (filters?.issuanceStatus) {
            params.set("filters[issuance_status][$eq]", filters.issuanceStatus);
        }

        const response = await strapiPublic.get(`/api/certificate-issuances?${params.toString()}`);
        const items = response.data?.data || [];

        return items.map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            certificate_program: item.certificate_program?.data
                ? { id: item.certificate_program.data.id }
                : { id: item.certificate_program?.id ?? 0 },
            user: item.user?.data ? { id: item.user.data.id } : { id: item.user?.id ?? 0 },
            quiz_attempt: item.quiz_attempt
                ? item.quiz_attempt.data
                    ? { id: item.quiz_attempt.data.id }
                    : { id: item.quiz_attempt.id }
                : null,
            issued_at: item.issued_at ?? new Date().toISOString(),
            valid_until: item.valid_until ?? null,
            revoked_at: item.revoked_at ?? null,
            issuance_status: item.issuance_status ?? "active",
            metadata: item.metadata ?? null,
        }));
    } catch (error) {
        console.error("Error fetching certificate issuances:", error);
        return [];
    }
}

export async function getCertificateIssuance(id: string | number): Promise<CertificateIssuanceEntity | null> {
    try {
        let documentId: string;
        const isNumericId = typeof id === "number" || (typeof id === "string" && /^\d+$/.test(id));
        if (isNumericId) {
            const numericId = typeof id === "string" ? Number(id) : id;
            const fetchResponse = await strapiPublic.get(
                `/api/certificate-issuances?filters[id][$eq]=${numericId}&populate=*`,
            );
            const items = fetchResponse.data?.data ?? [];
            if (items.length === 0) {
                return null;
            }
            documentId = items[0].documentId;
        } else {
            documentId = id as string;
        }

        const response = await strapiPublic.get(`/api/certificate-issuances/${documentId}?populate=*`);
        const item = response.data?.data;

        return {
            id: item.id,
            documentId: item.documentId,
            certificate_program: item.certificate_program?.data
                ? { id: item.certificate_program.data.id }
                : { id: item.certificate_program?.id ?? 0 },
            user: item.user?.data ? { id: item.user.data.id } : { id: item.user?.id ?? 0 },
            quiz_attempt: item.quiz_attempt
                ? item.quiz_attempt.data
                    ? { id: item.quiz_attempt.data.id }
                    : { id: item.quiz_attempt.id }
                : null,
            issued_at: item.issued_at ?? new Date().toISOString(),
            valid_until: item.valid_until ?? null,
            revoked_at: item.revoked_at ?? null,
            issuance_status: item.issuance_status ?? "active",
            metadata: item.metadata ?? null,
        };
    } catch (error) {
        console.error("Error fetching certificate issuance:", error);
        return null;
    }
}

export async function deleteCertificateIssuance(id: string | number): Promise<boolean> {
    try {
        let documentId: string;
        const isNumericId = typeof id === "number" || (typeof id === "string" && /^\d+$/.test(id));
        if (isNumericId) {
            const numericId = typeof id === "string" ? Number(id) : id;
            const fetchResponse = await strapiPublic.get(`/api/certificate-issuances?filters[id][$eq]=${numericId}`);
            const items = fetchResponse.data?.data ?? [];
            if (items.length === 0) {
                console.error("Certificate issuance not found with id:", numericId);
                return false;
            }
            documentId = items[0].documentId;
        } else {
            documentId = id as string;
        }
        await strapi.delete(`/api/certificate-issuances/${documentId}`);
        return true;
    } catch (error) {
        console.error("Error deleting certificate issuance:", error);
        return false;
    }
}

