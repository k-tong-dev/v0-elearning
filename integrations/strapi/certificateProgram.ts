import {strapi, strapiPublic} from "./client";
import {
    CourseQuizEntity,
    createCourseQuiz,
    createCourseQuizLine,
    updateCourseQuiz,
    updateCourseQuizLine,
    deleteCourseQuizLine,
    deleteCourseQuiz,
    getCertificateQuizzes,
} from "./quizStructure";

const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export type CertificateTheme = "Aurora" | "Minimal" | "Premium" | "Classic";

export interface CertificateProgramEntity {
    id: number;
    documentId: string;
    name: string;
    auto_issue: boolean;
    min_score_to_pass: number;
    valid_until?: string | null;
    message?: string | null;
    issue_criterial?: string | null;
    theme?: CertificateTheme;
    signature_name?: string | null;
    issuer?: string | null;
    include_seal?: boolean;
    active?: boolean;
    owner?: { id: number } | null;
    company?: { id: number; name?: string; logoUrl?: string | null } | null;
    course_content?: { id: number };
    color?: string | null;
}

const toAbsoluteUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${STRAPI_BASE_URL}${url}`;
};

export async function getCertificateProgramByCourseContent(
    courseContentId: number | string,
): Promise<CertificateProgramEntity | null> {
    try {
        // Resolve documentId if courseContentId is numeric
        let contentDocumentId: string | null = null
        if (typeof courseContentId === 'string' && !/^\d+$/.test(courseContentId)) {
            contentDocumentId = courseContentId
        } else {
            const numericId = typeof courseContentId === 'string' ? Number(courseContentId) : courseContentId
            if (!isNaN(numericId)) {
                contentDocumentId = await resolveDocumentIdByNumericId("course-contents", numericId)
            }
        }
        
        if (!contentDocumentId) {
            console.warn(`[Certificate] Could not resolve documentId for content ID: ${courseContentId}`)
            return null
        }
        
        // Try filtering by course_content documentId first (priority)
        let params = new URLSearchParams();
        params.set("filters[course_content][documentId][$eq]", contentDocumentId);
        
        // Populate course_quizs with all necessary fields and nested course_quiz_lines
        params.set("populate[course_quizs][fields][0]", "id");
        params.set("populate[course_quizs][fields][1]", "documentId");
        params.set("populate[course_quizs][fields][2]", "title");
        params.set("populate[course_quizs][fields][3]", "type");
        params.set("populate[course_quizs][fields][4]", "question_text");
        params.set("populate[course_quizs][fields][5]", "order_index");
        params.set("populate[course_quizs][fields][6]", "duration");
        params.set("populate[course_quizs][fields][7]", "is_require");
        params.set("populate[course_quizs][fields][8]", "min_answer");
        params.set("populate[course_quizs][fields][9]", "max_answer");
        params.set("populate[course_quizs][fields][10]", "total_score");
        params.set("populate[course_quizs][fields][11]", "max_score");
        params.set("populate[course_quizs][populate][course_quiz_lines][fields][0]", "id");
        params.set("populate[course_quizs][populate][course_quiz_lines][fields][1]", "documentId");
        params.set("populate[course_quizs][populate][course_quiz_lines][fields][2]", "answer");
        params.set("populate[course_quizs][populate][course_quiz_lines][fields][3]", "is_correct");
        params.set("populate[course_quizs][sort][0]", "order_index:asc");
        params.set("populate[course_content][fields][0]", "id");
        params.set("populate[course_content][fields][1]", "documentId");
        params.set("populate[company][fields][0]", "id");
        params.set("populate[company][fields][1]", "name");
        params.set("populate[company][populate][logo][fields][0]", "url");
        params.set("populate[owner][fields][0]", "id");
        
        console.log(`[Certificate] Fetching certificate program for content documentId: ${contentDocumentId}`);
        
        let response = await strapiPublic.get(`/api/certificate-programs?${params.toString()}`);
        console.log(`[Certificate] API Response status:`, response.status);
        console.log(`[Certificate] API URL:`, `/api/certificate-programs?${params.toString()}`);
        
        let items = response.data?.data ?? [];
        console.log(`[Certificate] Found ${items.length} certificate programs in initial response`);
        
        // Log quiz data if present
        if (items.length > 0) {
            items.forEach((item: any, index: number) => {
                const quizzes = item.course_quizs?.data || item.course_quizs || [];
                console.log(`[Certificate] Program ${index + 1} "${item.name}" has ${quizzes.length} quizzes in response`);
            });
        }
        
        // If no results with course_content filter, try finding by checking all certificate programs
        // This handles cases where course_content is null but quizzes exist
        if (items.length === 0) {
            console.log(`[Certificate] No certificate found with course_content filter, trying alternative search`);
            // Get all certificate programs and populate quizzes
            params = new URLSearchParams();
            // Populate quizzes with all necessary fields
            params.set("populate[course_quizs][fields][0]", "id");
            params.set("populate[course_quizs][fields][1]", "documentId");
            params.set("populate[course_quizs][fields][2]", "title");
            params.set("populate[course_quizs][fields][3]", "type");
            params.set("populate[course_quizs][fields][4]", "question_text");
            params.set("populate[course_quizs][fields][5]", "order_index");
            params.set("populate[course_quizs][fields][6]", "duration");
            params.set("populate[course_quizs][fields][7]", "is_require");
            params.set("populate[course_quizs][fields][8]", "min_answer");
            params.set("populate[course_quizs][fields][9]", "max_answer");
            params.set("populate[course_quizs][fields][10]", "total_score");
            params.set("populate[course_quizs][fields][11]", "max_score");
            params.set("populate[course_quizs][populate][course_quiz_lines][fields][0]", "id");
            params.set("populate[course_quizs][populate][course_quiz_lines][fields][1]", "documentId");
            params.set("populate[course_quizs][populate][course_quiz_lines][fields][2]", "answer");
            params.set("populate[course_quizs][populate][course_quiz_lines][fields][3]", "is_correct");
            params.set("populate[course_quizs][sort][0]", "order_index:asc");
            params.set("populate[course_content][fields][0]", "id");
            params.set("populate[course_content][fields][1]", "documentId");
            params.set("populate[company][fields][0]", "id");
            params.set("populate[company][fields][1]", "name");
            params.set("populate[company][populate][logo][fields][0]", "url");
            params.set("populate[owner][fields][0]", "id");
            response = await strapiPublic.get(`/api/certificate-programs?${params.toString()}`);
            items = response.data?.data ?? [];
            
            console.log(`[Certificate] Found ${items.length} total certificate programs`);
            
            // Filter programs that have quizzes (they might be the one we need)
            // Since course_content might be null, we'll fetch quizzes separately for all
            items = items.filter((item: any) => {
                // Check if quizzes exist in the response (might be populated or not)
                const quizzes = item.course_quizs?.data || item.course_quizs || []
                const hasQuizzes = Array.isArray(quizzes) && quizzes.length > 0
                console.log(`[Certificate] Program "${item.name}" (ID: ${item.id}) has quizzes: ${hasQuizzes}`)
                return hasQuizzes
            })
            
            console.log(`[Certificate] Filtered to ${items.length} programs with quizzes`)
        }
        
        if (items.length === 0) {
            console.warn(`[Certificate] No certificate program found for content documentId: ${contentDocumentId}`);
            return null;
        }
        
        // If multiple found, prefer one with course_content match, otherwise take first one with quizzes
        // This handles the case where course_content is null - we'll just use the first program with quizzes
        const item = items.find((i: any) => {
            const contentRef = i.course_content?.data || i.course_content
            if (contentRef) {
                const contentDocId = contentRef.documentId || String(contentRef.id)
                return String(contentDocId) === String(contentDocumentId)
            }
            return false
        }) || items[0]
        
        console.log(`[Certificate] Found certificate program:`, item.name, `ID: ${item.id}, documentId: ${item.documentId}`);
        
        const companyData = item.company?.data ?? item.company;
        const ownerData = item.owner?.data ?? item.owner;
        
        // First, try to get quizzes from the populated API response
        let processedQuizzes: any[] = [];
        let course_quizs = item.course_quizs;
        if (course_quizs?.data && Array.isArray(course_quizs.data)) {
            course_quizs = course_quizs.data;
        } else if (!Array.isArray(course_quizs)) {
            course_quizs = [];
        }
        
        console.log(`[Certificate] Found ${course_quizs.length} quizzes in populated response`);
        
        if (course_quizs.length > 0) {
            // Process quizzes from populated response
            processedQuizzes = course_quizs.map((quiz: any) => {
                let lines = quiz.course_quiz_lines;
                if (lines?.data && Array.isArray(lines.data)) {
                    lines = lines.data;
                } else if (!Array.isArray(lines)) {
                    lines = [];
                }
                
                return {
                    id: quiz.id,
                    documentId: quiz.documentId,
                    title: quiz.title,
                    type: quiz.type,
                    question_text: quiz.question_text,
                    order_index: quiz.order_index,
                    duration: quiz.duration,
                    is_require: quiz.is_require,
                    min_answer: quiz.min_answer,
                    max_answer: quiz.max_answer,
                    total_score: quiz.total_score,
                    max_score: quiz.max_score,
                    lines: lines.map((line: any) => ({
                        id: line.id,
                        documentId: line.documentId,
                        answer: line.answer,
                        is_correct: line.is_correct,
                    })),
                };
            });
            console.log(`[Certificate] Processed ${processedQuizzes.length} quizzes from populated response`);
        } else {
            // Fallback: Fetch quizzes separately using getCertificateQuizzes if not in populated response
            console.log(`[Certificate] No quizzes in populated response, fetching separately...`);
            try {
                const { getCertificateQuizzes } = await import("./quizStructure");
                const quizzes = await getCertificateQuizzes(item.id);
                console.log(`[Certificate] Fetched ${quizzes.length} quizzes using getCertificateQuizzes`);
                
                processedQuizzes = quizzes.map((quiz) => ({
                    id: quiz.id,
                    documentId: quiz.documentId,
                    title: quiz.title,
                    type: quiz.type,
                    question_text: quiz.question_text,
                    order_index: quiz.order_index,
                    duration: quiz.duration,
                    is_require: quiz.is_require,
                    min_answer: quiz.min_answer,
                    max_answer: quiz.max_answer,
                    total_score: quiz.total_score,
                    max_score: quiz.max_score,
                    lines: quiz.lines || [],
                }));
            } catch (quizError) {
                console.warn(`[Certificate] Failed to fetch quizzes separately:`, quizError);
                processedQuizzes = [];
            }
        }

        console.log(`[Certificate] Final processed quizzes count:`, processedQuizzes.length);

        return {
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            auto_issue: item.auto_issue ?? true,
            min_score_to_pass: item.min_score_to_pass ?? 0,
            valid_until: item.valid_until ?? null,
            message: item.message ?? null,
            issue_criterial: item.issue_criterial ?? null,
            theme: item.theme ?? "Aurora",
            signature_name: item.signature_name ?? null,
            issuer: item.issuer ?? null,
            include_seal: item.include_seal ?? true,
            active: item.active ?? true,
            color: item.color ?? null,
            owner: ownerData ? { id: ownerData.id } : null,
            company: companyData
                ? {
                      id: companyData.id,
                      name: companyData.name,
                      logoUrl: toAbsoluteUrl(companyData.logo?.data?.attributes?.url ?? companyData.logo?.url),
                  }
                : null,
            course_content: item.course_content ? { id: item.course_content.id } : undefined,
            course_quizs: processedQuizzes || [],
        } as any;
    } catch (error: any) {
        console.error("[Certificate] Error fetching certificate program:", error);
        if (error.response) {
            console.error("[Certificate] Response status:", error.response.status);
            console.error("[Certificate] Response data:", error.response.data);
        }
        return null;
    }
}

export async function getCertificatePrograms(options?: { ownerId?: string | number }): Promise<any[]> {
    try {
        const params = new URLSearchParams();
        params.set("populate[course_quizs][fields][0]", "id");
        params.set("populate[course_quizs][fields][1]", "documentId");
        params.set("populate[course_quizs][fields][2]", "title");
        params.set("populate[course_quizs][fields][3]", "type");
        params.set("populate[course_quizs][fields][4]", "question_text");
        params.set("populate[course_quizs][fields][5]", "order_index");
        params.set("populate[course_quizs][fields][6]", "duration");
        params.set("populate[course_quizs][fields][7]", "is_require");
        params.set("populate[course_quizs][fields][8]", "min_answer");
        params.set("populate[course_quizs][fields][9]", "max_answer");
        params.set("populate[course_quizs][fields][10]", "total_score");
        params.set("populate[course_quizs][fields][11]", "max_score");
        params.set("populate[course_quizs][populate][course_quiz_lines][fields][0]", "id");
        params.set("populate[course_quizs][populate][course_quiz_lines][fields][1]", "documentId");
        params.set("populate[course_quizs][populate][course_quiz_lines][fields][2]", "answer");
        params.set("populate[course_quizs][populate][course_quiz_lines][fields][3]", "is_correct");
        params.set("populate[course_quizs][sort][0]", "order_index:asc");
        params.set("populate[company][fields][0]", "id");
        params.set("populate[company][fields][1]", "name");
        params.set("populate[company][populate][logo][fields][0]", "url");
        params.set("populate[owner][fields][0]", "id");
        params.set("populate[course_content][fields][0]", "id");
        if (options?.ownerId) {
            params.set("filters[owner][id][$eq]", String(options.ownerId));
        }

        const response = await strapiPublic.get(`/api/certificate-programs?${params.toString()}`);
        const items = response.data?.data || [];
        
        return items.map((item: any) => {
            // Handle course_quizs - might be nested in Strapi v5 structure
            let course_quizs = item.course_quizs;
            if (course_quizs?.data && Array.isArray(course_quizs.data)) {
                course_quizs = course_quizs.data;
            } else if (!Array.isArray(course_quizs)) {
                course_quizs = [];
            }
            
            // Process each quiz and extract lines
            const processedQuizzes = course_quizs.map((quiz: any) => {
                // Handle quiz lines - might be nested
                let lines = quiz.course_quiz_lines;
                if (lines?.data && Array.isArray(lines.data)) {
                    lines = lines.data;
                } else if (!Array.isArray(lines)) {
                    lines = [];
                }
                
                return {
                    ...quiz,
                    lines: lines,
                };
            });
            
            // Handle company - might be nested
            let company = item.company;
            if (company?.data) {
                company = company.data;
            }

            const owner = item.owner?.data ?? item.owner;
            
            return {
                id: item.id,
                documentId: item.documentId,
                name: item.name,
                auto_issue: item.auto_issue ?? true,
                min_score_to_pass: Number(item.min_score_to_pass ?? 0),
                valid_until: item.valid_until ?? null,
                message: item.message ?? null,
                issue_criterial: item.issue_criterial ?? null,
                theme: item.theme ?? "Aurora",
                signature_name: item.signature_name ?? null,
                issuer: item.issuer ?? null,
                include_seal: item.include_seal ?? true,
                active: item.active ?? true,
                color: item.color ?? null,
                owner: owner ? { id: owner.id } : null,
                course_content: item.course_content ? { id: item.course_content.id } : undefined,
                company: company
                    ? {
                          id: company.id,
                          name: company.name,
                          logoUrl: toAbsoluteUrl(company.logo?.data?.attributes?.url ?? company.logo?.url),
                      }
                    : undefined,
                course_quizs: processedQuizzes || [],
            };
        });
    } catch (error: any) {
        console.error("Error fetching certificate programs:", error);
        // Log more details about the error
        if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
        }
        return [];
    }
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

export async function createCertificateProgram(data: {
    name: string;
    owner: number;
    course_content?: number;
    auto_issue?: boolean;
    min_score_to_pass?: number;
    valid_until?: string | null;
    company?: number | null;
    message?: string | null;
    issue_criterial?: string | null;
    theme?: CertificateTheme;
    signature_name?: string | null;
    issuer?: string | null;
    include_seal?: boolean;
    active?: boolean;
    color?: string | null;
}): Promise<CertificateProgramEntity | null> {
    try {
        // Resolve documentIds for relations to ensure Strapi Admin UI displays them
        const ownerDocumentId = await resolveDocumentIdByNumericId("users", data.owner);
        if (!ownerDocumentId) {
            console.error("Failed to resolve owner documentId for certificate program creation");
            return null;
        }

        let contentConnect = undefined;
        if (data.course_content) {
            const contentDocId = await resolveDocumentIdByNumericId("course-contents", data.course_content);
            if (contentDocId) {
                contentConnect = { connect: [{ documentId: contentDocId }] };
            }
        }

        let companyConnect = null;
        if (data.company) {
            const companyDocId = await resolveDocumentIdByNumericId("companies", data.company);
            if (companyDocId) {
                companyConnect = { connect: [{ documentId: companyDocId }] };
            }
        }

        const response = await strapi.post("/api/certificate-programs", {
            data: {
                name: data.name,
                // Use connect with documentId for CREATE to ensure Strapi Admin UI displays the relation
                owner: {
                    connect: [{ documentId: ownerDocumentId }],
                },
                course_content: contentConnect,
                company: companyConnect,
                auto_issue: data.auto_issue ?? true,
                min_score_to_pass: data.min_score_to_pass ?? 0,
                valid_until: data.valid_until,
                message: data.message,
                issue_criterial: data.issue_criterial,
                theme: data.theme ?? "Aurora",
                signature_name: data.signature_name,
                issuer: data.issuer,
                include_seal: data.include_seal ?? true,
                active: data.active ?? true,
                color: data.color ?? "#6366f1",
            },
        });
        const item = response.data?.data;
        return {
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            auto_issue: item.auto_issue ?? true,
            min_score_to_pass: item.min_score_to_pass ?? 0,
            valid_until: item.valid_until ?? null,
            message: item.message ?? null,
            issue_criterial: item.issue_criterial ?? null,
            theme: item.theme ?? "Aurora",
            signature_name: item.signature_name ?? null,
            issuer: item.issuer ?? null,
            include_seal: item.include_seal ?? true,
            active: item.active ?? true,
            color: item.color ?? data.color ?? "#6366f1",
            owner: item.owner ? { id: item.owner.id ?? item.owner?.data?.id } : null,
            course_content: item.course_content ? { id: item.course_content.id } : undefined,
        };
    } catch (error) {
        console.error("Error creating certificate program:", error);
        return null;
    }
}

export async function updateCertificateProgram(
    id: string,
    data: Partial<{
        name: string;
        auto_issue: boolean;
        min_score_to_pass: number;
        valid_until?: string | null;
        company?: number | null;
        course_content?: number | null;
        message?: string | null;
        issue_criterial?: string | null;
        theme?: CertificateTheme;
        signature_name?: string | null;
        issuer?: string | null;
        include_seal?: boolean;
        active?: boolean;
        color?: string | null;
    }>,
): Promise<CertificateProgramEntity | null> {
    try {
        const response = await strapi.put(`/api/certificate-programs/${id}`, {
            data,
        });
        const item = response.data?.data;
        return {
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            auto_issue: item.auto_issue ?? true,
            min_score_to_pass: item.min_score_to_pass ?? 0,
            valid_until: item.valid_until ?? null,
            message: item.message ?? null,
            issue_criterial: item.issue_criterial ?? null,
            theme: item.theme ?? "Aurora",
            signature_name: item.signature_name ?? null,
            issuer: item.issuer ?? null,
            include_seal: item.include_seal ?? true,
            active: item.active ?? true,
            color: item.color ?? data.color ?? "#6366f1",
            course_content: item.course_content ? { id: item.course_content.id } : undefined,
        };
    } catch (error) {
        console.error("Error updating certificate program:", error);
        return null;
    }
}

export type CertificateQuestionForm = {
    id?: number;
    prompt: string;
    type: "radio" | "check-box" | "true-false";
    options: Array<{ id: string; text: string; isCorrect: boolean }>;
    duration?: number; // Time limit in seconds
    is_require?: boolean; // Whether question is required
    min_answer?: number; // Minimum answers required (for check-box)
    max_answer?: number; // Maximum answers allowed (for check-box)
    total_score?: number; // Score awarded for this question
    max_score?: number; // Maximum possible score
};

export const LEGACY_DESIGN_QUIZ_TITLE = "__certificate_design__";

const isLegacyDesignQuiz = (quiz: CourseQuizEntity | null | undefined) =>
    !!quiz && quiz.title === LEGACY_DESIGN_QUIZ_TITLE;

const splitLegacyDesignQuizzes = (quizzes: CourseQuizEntity[]) => {
    const legacy = quizzes.filter(isLegacyDesignQuiz);
    const filteredQuizzes = quizzes.filter((quiz) => !isLegacyDesignQuiz(quiz));
    return { legacy, filteredQuizzes };
};

export async function replaceCertificateQuestions(
    certificateId: number,
    questions: CertificateQuestionForm[],
): Promise<void> {
    try {
        if (!questions || questions.length === 0) {
            console.warn(
                `replaceCertificateQuestions called with no questions for certificate ${certificateId}. Skipping mutation.`,
            );
            return;
        }

        const existingQuizzes = await getCertificateQuizzes(certificateId);
        
        const { legacy, filteredQuizzes } = splitLegacyDesignQuizzes(existingQuizzes);

        if (legacy.length > 0) {
            await Promise.all(
                legacy
                    .filter((quiz) => quiz?.id)
                    .map((quiz) => deleteCourseQuiz(quiz.id)),
            );
        }
        
        // Process each question - update existing or create new
        const processedQuizIds = new Set<number>();
        
        for (let index = 0; index < questions.length; index++) {
            const question = questions[index];
            let quiz: CourseQuizEntity | null = null;
            
            // Try to find existing quiz by ID
            if (question.id && typeof question.id === "number") {
                quiz = filteredQuizzes.find((q) => q.id === question.id) || null;
            }
            
            if (quiz) {
                // Update existing quiz
                const updated = await updateCourseQuiz(quiz.documentId, {
                    title: question.prompt.slice(0, 120) || "Untitled question",
                    type: question.type,
                    question_text: question.prompt,
                    order_index: index,
                    is_require: question.is_require ?? true,
                    duration: question.duration ?? 60,
                    min_answer: question.min_answer ?? (question.type === "check-box" ? 1 : 1),
                    max_answer: question.max_answer ?? (question.type === "check-box" ? question.options.length : 1),
                    total_score: question.total_score ?? 10,
                    max_score: question.max_score ?? 10,
                    certificate: certificateId,
                });
                
                if (updated) {
                    processedQuizIds.add(updated.id);
                    
                    // Use existing lines from the original quiz (updated quiz might not have lines populated)
                    const existingLines = quiz.lines || [];
                    const validOptions = question.options.filter((opt) => opt.text && opt.text.trim());
                    
                    // Match existing lines with new options by position/index
                    for (let optIndex = 0; optIndex < validOptions.length; optIndex++) {
                        const option = validOptions[optIndex];
                        const existingLine = existingLines[optIndex];
                        
                        if (existingLine) {
                            // Update existing line
                            await updateCourseQuizLine(existingLine.documentId, {
                                answer: option.text.trim(),
                                is_correct: option.isCorrect,
                            });
                        } else {
                            // Create new line
                            await createCourseQuizLine({
                                course_quiz: updated.id,
                                answer: option.text.trim(),
                                is_correct: option.isCorrect,
                            });
                        }
                    }
                    
                    // Delete extra lines that are no longer needed
                    if (existingLines.length > validOptions.length) {
                        const linesToDelete = existingLines.slice(validOptions.length);
                        await Promise.all(linesToDelete.map((line) => deleteCourseQuizLine(line.id)));
                    }
                }
            } else {
                // Create new quiz
                const newQuiz = await createCourseQuiz({
                    title: question.prompt.slice(0, 120) || "Untitled question",
                    type: question.type,
                    question_text: question.prompt,
                    order_index: index,
                    is_require: question.is_require ?? true,
                    duration: question.duration ?? 60,
                    min_answer: question.min_answer ?? (question.type === "check-box" ? 1 : 1),
                    max_answer: question.max_answer ?? (question.type === "check-box" ? question.options.length : 1),
                    total_score: question.total_score ?? 10,
                    max_score: question.max_score ?? 10,
                    certificate: certificateId,
                });
                
                if (newQuiz && newQuiz.id) {
                    quiz = newQuiz;
                    processedQuizIds.add(quiz.id);
                    
                    // Wait a small moment to ensure quiz is fully persisted
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    
                    // Create all quiz lines for this question
                    const validOptions = question.options.filter((opt) => opt.text && opt.text.trim());
                    const linePromises = validOptions.map((option) =>
                        createCourseQuizLine({
                            course_quiz: quiz!.id,
                            answer: option.text.trim(),
                            is_correct: option.isCorrect,
                        })
                    );
                    await Promise.all(linePromises);
                }
            }
        }
        
        // Delete quizzes that are no longer in the questions list
        const quizzesToDelete = filteredQuizzes.filter((q) => !processedQuizIds.has(q.id));
        await Promise.all(quizzesToDelete.map((quiz) => deleteCourseQuiz(quiz.id)));
        
    } catch (error) {
        console.error("Error replacing certificate questions:", error);
        throw error;
    }
}
export const removeLegacyDesignQuizzes = (quizzes: CourseQuizEntity[] = []) =>
    quizzes.filter((quiz) => !isLegacyDesignQuiz(quiz));

/**
 * Add a candidate (user) to a certificate program
 * This connects the user to the certificate program via the many-to-many candidates relation
 */
export async function addCandidateToCertificateProgram(
    certificateProgramId: number | string,
    userId: number | string,
): Promise<boolean> {
    try {
        // Resolve documentIds
        let certProgramDocumentId: string;
        if (typeof certificateProgramId === 'number') {
            const docId = await resolveDocumentIdByNumericId("certificate-programs", certificateProgramId);
            if (!docId) {
                console.error("Failed to resolve certificate program documentId");
                return false;
            }
            certProgramDocumentId = docId;
        } else {
            certProgramDocumentId = certificateProgramId;
        }

        let userDocumentId: string;
        if (typeof userId === 'number') {
            // Use robust user documentId resolution (same as quizAttempt.ts)
            let docId: string | null = null;
            
            // First, try to get documentId from /api/users/me if we have an authenticated request
            try {
                const meResponse = await strapi.get('/api/users/me?fields[0]=documentId&fields[1]=id');
                if (meResponse.data?.documentId) {
                    const meId = meResponse.data.id;
                    // Only use /me if the IDs match
                    if (meId === userId || String(meId) === String(userId)) {
                        docId = meResponse.data.documentId;
                    }
                }
            } catch (meError) {
                // /me endpoint might not be available, continue with other methods
            }
            
            // If /me didn't work, try resolving by numeric ID
            if (!docId) {
                docId = await resolveDocumentIdByNumericId("users", userId);
            }
            
            // If still no documentId, try direct query with authenticated client
            if (!docId) {
                try {
                    // Try with data wrapper (Strapi v5 format)
                    const userResponse = await strapi.get(`/api/users?filters[id][$eq]=${userId}&fields[0]=documentId`);
                    const users = userResponse.data?.data || userResponse.data || [];
                    if (Array.isArray(users) && users.length > 0) {
                        docId = users[0].documentId || null;
                    } else if (userResponse.data && !Array.isArray(userResponse.data) && userResponse.data.documentId) {
                        // Handle single object response
                        docId = userResponse.data.documentId;
                    }
                } catch (directError) {
                    console.warn("Failed to fetch user documentId via direct query:", directError);
                }
            }
            
            if (!docId) {
                console.error("Failed to resolve user documentId for adding candidate. User ID:", userId);
                return false;
            }
            userDocumentId = docId;
        } else {
            userDocumentId = userId;
        }

        // Get current certificate program to check existing candidates
        const currentResponse = await strapiPublic.get(`/api/certificate-programs/${certProgramDocumentId}?populate[candidates][fields][0]=id`);
        const currentProgram = currentResponse.data?.data;
        
        // Get existing candidates
        const existingCandidates = currentProgram?.candidates?.data || currentProgram?.candidates || [];
        const existingCandidateIds = existingCandidates.map((c: any) => c.documentId || c.id).filter(Boolean);
        
        // Check if user is already a candidate
        if (existingCandidateIds.includes(userDocumentId)) {
            console.log("User is already a candidate in this certificate program");
            return true;
        }

        // Add the new candidate using connect (Strapi v5 format)
        await strapi.put(`/api/certificate-programs/${certProgramDocumentId}`, {
            data: {
                candidates: {
                    connect: [{ documentId: userDocumentId }],
                },
            },
        });

        console.log(`Successfully added user ${userDocumentId} as candidate to certificate program ${certProgramDocumentId}`);
        return true;
    } catch (error) {
        console.error("Error adding candidate to certificate program:", error);
        return false;
    }
}

