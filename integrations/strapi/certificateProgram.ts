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
    courseContentId: number,
): Promise<CertificateProgramEntity | null> {
    try {
        const response = await strapiPublic.get(
            `/api/certificate-programs?filters[course_content][id][$eq]=${courseContentId}&populate=*`,
        );
        const items = response.data?.data ?? [];
        if (items.length === 0) {
            return null;
        }
        const item = items[0];
        const companyData = item.company?.data ?? item.company;
        const ownerData = item.owner?.data ?? item.owner;
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
        };
    } catch (error) {
        console.error("Error fetching certificate program:", error);
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

