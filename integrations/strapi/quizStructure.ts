import {strapi, strapiPublic} from "./client";

export interface QuizLineEntity {
    id: number;
    documentId: string;
    answer: string;
    is_correct: boolean;
}

export interface CourseQuizEntity {
    id: number;
    documentId: string;
    title: string;
    type: "check-box" | "radio" | "true-false";
    question_text?: string;
    order_index: number;
    duration: number;
    is_require: boolean;
    min_answer: number;
    max_answer: number;
    total_score: number;
    max_score: number;
    lines: QuizLineEntity[];
    certificate?: { id: number } | null;
}

export interface QuizSectionEntity {
    id: number;
    documentId: string;
    name: string;
    description?: string;
    order_index: number;
    quizzes: CourseQuizEntity[];
}

export async function getQuizSectionsByCourseContent(courseContentId: number | string): Promise<QuizSectionEntity[]> {
    try {
        // Support both numeric ID and documentId
        let filterParam: string;
        if (typeof courseContentId === "string" && !/^\d+$/.test(courseContentId)) {
            // It's a documentId
            filterParam = `filters[course_content][documentId][$eq]=${courseContentId}`;
        } else {
            // It's a numeric ID
            const numericId = typeof courseContentId === "string" ? Number(courseContentId) : courseContentId;
            filterParam = `filters[course_content][id][$eq]=${numericId}`;
        }
        
        const response = await strapiPublic.get(
            `/api/quiz-sections?${filterParam}&populate[course_quizs][populate]=course_quiz_lines`,
        );
        const items = response.data?.data ?? [];
        return items.map((section: any) => ({
            id: section.id,
            documentId: section.documentId,
            name: section.name,
            description: section.description,
            order_index: section.order_index ?? 0,
            quizzes:
                section.course_quizs?.map((quiz: any) => ({
                    id: quiz.id,
                    documentId: quiz.documentId,
                    title: quiz.title,
                    type: quiz.type,
                    question_text: quiz.question_text,
                    order_index: quiz.order_index ?? 0,
                    duration: quiz.duration ?? 0,
                    is_require: quiz.is_require ?? true,
                    min_answer: quiz.min_answer ?? 1,
                    max_answer: quiz.max_answer ?? 0,
                    total_score: Number(quiz.total_score ?? 0),
                    max_score: quiz.max_score ?? 1,
                    certificate: quiz.certificate ? { id: quiz.certificate.id } : null,
                    lines:
                        quiz.course_quiz_lines?.map((line: any) => ({
                            id: line.id,
                            documentId: line.documentId,
                            answer: line.answer,
                            is_correct: line.is_correct ?? false,
                        })) || [],
                })) || [],
        }));
    } catch (error) {
        console.error("Error fetching quiz sections:", error);
        return [];
    }
}

export async function deleteQuizSection(id: number | string): Promise<boolean> {
    try {
        let documentId: string;
        const isNumericId = typeof id === "number" || (typeof id === "string" && /^\d+$/.test(id));
        if (isNumericId) {
            const numericId = typeof id === "string" ? Number(id) : id;
            const resolved = await resolveDocumentIdByNumericId("quiz-sections", numericId);
            if (!resolved) {
                console.warn("Quiz section not found (already deleted?) with id:", numericId);
                return true;
            }
            documentId = resolved;
        } else {
            documentId = id as string;
        }
        await strapi.delete(`/api/quiz-sections/${documentId}`);
        return true;
    } catch (error) {
        console.error("Error deleting quiz section:", error);
        return false;
    }
}

export async function createQuizSection(data: {
    name: string;
    description?: string;
    order_index?: number;
    course_content: number;
}): Promise<QuizSectionEntity | null> {
    try {
        // Resolve documentId for the course_content to ensure Strapi Admin UI displays the relation
        const contentDocumentId = await resolveDocumentIdByNumericId("course-contents", data.course_content);
        if (!contentDocumentId) {
            console.error("Failed to resolve course_content documentId for quiz section creation");
            return null;
        }

        const response = await strapi.post("/api/quiz-sections", {
            data: {
                name: data.name,
                description: data.description,
                order_index: data.order_index ?? 0,
                // Use connect with documentId for CREATE to ensure Strapi Admin UI displays the relation
                course_content: {
                    connect: [{ documentId: contentDocumentId }],
                },
            },
        });
        const item = response.data?.data;
        return {
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            description: item.description,
            order_index: item.order_index ?? 0,
            quizzes: [],
        };
    } catch (error) {
        console.error("Error creating quiz section:", error);
        return null;
    }
}

export async function createCourseQuiz(data: {
    title: string;
    type: "check-box" | "radio" | "true-false";
    description?: string;
    question_text?: string;
    order_index?: number;
    duration?: number;
    is_require?: boolean;
    min_answer?: number;
    max_answer?: number;
    total_score?: number;
    max_score?: number;
    course_content?: number;
    quiz_section?: number | string; // Accept both numeric ID and documentId
    certificate?: number | null;
}): Promise<CourseQuizEntity | null> {
    try {
        // Resolve documentIds for relations to ensure Strapi Admin UI displays them
        let contentConnect = undefined;
        if (data.course_content) {
            const contentDocId = await resolveDocumentIdByNumericId("course-contents", data.course_content);
            if (contentDocId) {
                contentConnect = { connect: [{ documentId: contentDocId }] };
            }
        }

        let sectionConnect = undefined;
        if (data.quiz_section) {
            // Handle both numeric ID and documentId string
            let sectionDocId: string | null;
            if (typeof data.quiz_section === "string" && !/^\d+$/.test(data.quiz_section)) {
                // It's already a documentId
                sectionDocId = data.quiz_section;
            } else {
                // It's a numeric ID, resolve it
                const numericId = typeof data.quiz_section === "string" ? Number(data.quiz_section) : data.quiz_section;
                sectionDocId = await resolveDocumentIdByNumericId("quiz-sections", numericId);
            }
            if (sectionDocId) {
                sectionConnect = { connect: [{ documentId: sectionDocId }] };
            }
        }

        let certificateConnect = null;
        if (data.certificate) {
            const certDocId = await resolveDocumentIdByNumericId("certificate-programs", data.certificate);
            if (certDocId) {
                certificateConnect = { connect: [{ documentId: certDocId }] };
            }
        }

        const response = await strapi.post("/api/course-quizs", {
            data: {
                title: data.title,
                type: data.type,
                description: data.description,
                question_text: data.question_text,
                order_index: data.order_index ?? 0,
                duration: data.duration ?? 0,
                is_require: data.is_require ?? true,
                min_answer: data.min_answer ?? 1,
                max_answer: data.max_answer ?? 0,
                total_score: data.total_score ?? 0,
                max_score: data.max_score ?? 1,
                // Use connect with documentId for CREATE to ensure Strapi Admin UI displays the relation
                course_content: contentConnect,
                quiz_section: sectionConnect,
                certificate: certificateConnect,
            },
        });
        const item = response.data?.data;
        return {
            id: item.id,
            documentId: item.documentId,
            title: item.title,
            type: item.type,
            question_text: item.question_text,
            order_index: item.order_index ?? 0,
            duration: item.duration ?? 0,
            is_require: item.is_require ?? true,
            min_answer: item.min_answer ?? 1,
            max_answer: item.max_answer ?? 0,
            total_score: Number(item.total_score ?? 0),
            max_score: item.max_score ?? 1,
            lines: [],
            certificate: item.certificate ? { id: item.certificate.id } : null,
        };
    } catch (error) {
        console.error("Error creating course quiz:", error);
        return null;
    }
}

export async function updateCourseQuiz(
    documentId: string,
    data: {
        title?: string;
        type?: "check-box" | "radio" | "true-false";
        description?: string;
        question_text?: string;
        order_index?: number;
        duration?: number;
        is_require?: boolean;
        min_answer?: number;
        max_answer?: number;
        total_score?: number;
        max_score?: number;
        course_content?: number;
        quiz_section?: number;
        certificate?: number | null;
    },
): Promise<CourseQuizEntity | null> {
    try {
        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.question_text !== undefined) updateData.question_text = data.question_text;
        if (data.order_index !== undefined) updateData.order_index = data.order_index;
        if (data.duration !== undefined) updateData.duration = data.duration;
        if (data.is_require !== undefined) updateData.is_require = data.is_require;
        if (data.min_answer !== undefined) updateData.min_answer = data.min_answer;
        if (data.max_answer !== undefined) updateData.max_answer = data.max_answer;
        if (data.total_score !== undefined) updateData.total_score = data.total_score;
        if (data.max_score !== undefined) updateData.max_score = data.max_score;
        if (data.course_content !== undefined) updateData.course_content = data.course_content;
        if (data.quiz_section !== undefined) updateData.quiz_section = data.quiz_section;
        if (data.certificate !== undefined) {
            updateData.certificate = data.certificate
                ? { connect: [{ id: data.certificate }] }
                : null;
        }

        const response = await strapi.put(`/api/course-quizs/${documentId}`, {
            data: updateData,
        });
        const item = response.data?.data;
        return {
            id: item.id,
            documentId: item.documentId,
            title: item.title,
            type: item.type,
            question_text: item.question_text,
            order_index: item.order_index ?? 0,
            duration: item.duration ?? 0,
            is_require: item.is_require ?? true,
            min_answer: item.min_answer ?? 1,
            max_answer: item.max_answer ?? 0,
            total_score: Number(item.total_score ?? 0),
            max_score: item.max_score ?? 1,
            lines: [],
            certificate: item.certificate ? { id: item.certificate.id } : null,
        };
    } catch (error) {
        console.error("Error updating course quiz:", error);
        return null;
    }
}

export async function createCourseQuizLine(data: {
    course_quiz: number | string;
    answer: string;
    is_correct?: boolean;
}): Promise<QuizLineEntity | null> {
    try {
        if (!data.answer || !data.answer.trim()) {
            console.warn("Skipping quiz line creation: answer is empty");
            return null;
        }

        if (!data.course_quiz) {
            console.error("Cannot create quiz line: course_quiz ID is missing");
            return null;
        }

        // Resolve documentId for the course_quiz to ensure Strapi Admin UI displays the relation
        const numericQuizId = typeof data.course_quiz === 'string' ? Number(data.course_quiz) : data.course_quiz;
        if (!numericQuizId || isNaN(numericQuizId)) {
            console.error("Invalid course_quiz ID for quiz line creation:", data.course_quiz);
            return null;
        }

        const quizDocumentId = await resolveDocumentIdByNumericId("course-quizs", numericQuizId);
        if (!quizDocumentId) {
            console.error("Failed to resolve course_quiz documentId for quiz line creation");
            return null;
        }

        const response = await strapi.post("/api/course-quiz-lines", {
            data: {
                // Use connect with documentId for CREATE to ensure Strapi Admin UI displays the relation
                course_quiz: {
                    connect: [{ documentId: quizDocumentId }],
                },
                answer: data.answer.trim(),
                is_correct: data.is_correct ?? false,
            },
        });
        
        const item = response.data?.data;
        if (!item) {
            console.error("Quiz line creation returned no data:", response.data);
            return null;
        }

        // Verify the relationship was set
        return {
            id: item.id,
            documentId: item.documentId,
            answer: item.answer,
            is_correct: item.is_correct ?? false,
        };
    } catch (error: any) {
        console.error("Error creating quiz line:", error);
        if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
            console.error("Request data:", { course_quiz: data.course_quiz, answer: data.answer });
        }
        return null;
    }
}

type StrapiRecord<T = any> = T & { id?: number; documentId?: string };

const normalizeEntry = (entry: any): StrapiRecord => {
    if (!entry) return {};
    if (entry.data) {
        return normalizeEntry(entry.data);
    }
    const attributes = entry.attributes ?? entry;
    return {
        ...attributes,
        id: entry.id ?? attributes?.id,
        documentId: attributes?.documentId ?? entry.documentId,
    };
};

const normalizeRelationArray = (relation: any): StrapiRecord[] => {
    if (!relation) return [];
    if (Array.isArray(relation)) {
        return relation.map((item: any) => normalizeEntry(item)) as StrapiRecord[];
    }
    if (relation.data) {
        const data = Array.isArray(relation.data) ? relation.data : [relation.data];
        return data.map((item: any) => normalizeEntry(item)) as StrapiRecord[];
    }
    return [];
};

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

async function resolveDocumentIdentifier(
    collection: string,
    idOrDocumentId?: number | string | null,
): Promise<string | null> {
    if (idOrDocumentId === null || idOrDocumentId === undefined) {
        return null;
    }
    if (typeof idOrDocumentId === "string" && !/^\d+$/.test(idOrDocumentId)) {
        return idOrDocumentId;
    }
    const numeric =
        typeof idOrDocumentId === "number" ? idOrDocumentId : Number(idOrDocumentId);
    if (!Number.isFinite(numeric)) {
        return null;
    }
    return resolveDocumentIdByNumericId(collection, numeric);
}

export async function getCertificateQuizzes(certificateId: number): Promise<CourseQuizEntity[]> {
    try {
        const queryParams = [
            `filters[certificate][id][$eq]=${certificateId}`,
            "fields[0]=id",
            "fields[1]=documentId",
            "fields[2]=title",
            "fields[3]=type",
            "fields[4]=question_text",
            "fields[5]=order_index",
            "fields[6]=duration",
            "fields[7]=is_require",
            "fields[8]=min_answer",
            "fields[9]=max_answer",
            "fields[10]=total_score",
            "fields[11]=max_score",
            "populate[course_quiz_lines][fields][0]=id",
            "populate[course_quiz_lines][fields][1]=documentId",
            "populate[course_quiz_lines][fields][2]=answer",
            "populate[course_quiz_lines][fields][3]=is_correct",
            "populate[course_quiz_lines][sort][0]=id:asc",
            "populate[certificate][fields][0]=id",
        ].join("&");
        const response = await strapiPublic.get(`/api/course-quizs?${queryParams}`);
        const items = response.data?.data ?? [];
        return items.map((rawQuiz: any) => {
            const quiz = normalizeEntry(rawQuiz) as any;
            const lines = normalizeRelationArray(quiz.course_quiz_lines);

            return {
                id: quiz.id,
                documentId: quiz.documentId,
                title: quiz.title,
                type: quiz.type,
                question_text: quiz.question_text ?? quiz.description ?? "",
                order_index: quiz.order_index ?? 0,
                duration: quiz.duration ?? 0,
                is_require: quiz.is_require ?? true,
                min_answer: quiz.min_answer ?? 1,
                max_answer: quiz.max_answer ?? 0,
                total_score: Number(quiz.total_score ?? 0),
                max_score: quiz.max_score ?? 1,
                certificate: quiz.certificate?.id ? { id: quiz.certificate.id } : null,
                lines: lines.map((line: any, index: number) => ({
                    id: line.id ?? index,
                    documentId: line.documentId ?? line.id?.toString() ?? `${quiz.id}-${index}`,
                    answer: line.answer ?? line.title ?? "",
                    is_correct: line.is_correct ?? line.correct ?? false,
                })),
            };
        });
    } catch (error) {
        console.error("Error fetching certificate quizzes:", error);
        return [];
    }
}

export async function updateCourseQuizLine(
    documentId: string,
    data: {
        answer?: string;
        is_correct?: boolean;
        course_quiz?: number | string | null;
    },
): Promise<QuizLineEntity | null> {
    try {
        const updateData: any = {};
        if (data.answer !== undefined) updateData.answer = data.answer.trim();
        if (data.is_correct !== undefined) updateData.is_correct = data.is_correct;
        if (data.course_quiz !== undefined) {
            if (data.course_quiz) {
                const courseQuizDocumentId = await resolveDocumentIdentifier("course-quizs", data.course_quiz);
                if (!courseQuizDocumentId) {
                    console.error(
                        "Failed to resolve course quiz documentId for",
                        data.course_quiz,
                        "while updating line",
                    );
                    return null;
                }
                updateData.course_quiz = { connect: [{ documentId: courseQuizDocumentId }] };
            } else {
                updateData.course_quiz = null;
            }
        }

        const response = await strapi.put(`/api/course-quiz-lines/${documentId}`, {
            data: updateData,
        });
        const item = response.data?.data;
        return {
            id: item.id,
            documentId: item.documentId,
            answer: item.answer,
            is_correct: item.is_correct ?? false,
        };
    } catch (error) {
        console.error("Error updating course quiz line:", error);
        return null;
    }
}

export async function deleteCourseQuizLine(id: number | string): Promise<boolean> {
    try {
        let documentId: string;
        const isNumericId = typeof id === "number" || (typeof id === "string" && /^\d+$/.test(id));
        if (isNumericId) {
            const numericId = typeof id === "string" ? Number(id) : id;
            const resolved = await resolveDocumentIdByNumericId("course-quiz-lines", numericId);
            if (!resolved) {
                console.warn("Course quiz line not found (already deleted?) with id:", numericId);
                return true;
            }
            documentId = resolved;
        } else {
            documentId = id as string;
        }
        await strapi.delete(`/api/course-quiz-lines/${documentId}`);
        return true;
    } catch (error) {
        console.error("Error deleting course quiz line:", error);
        return false;
    }
}

export async function deleteCourseQuiz(id: number | string): Promise<boolean> {
    try {
        let documentId: string;
        const isNumericId = typeof id === "number" || (typeof id === "string" && /^\d+$/.test(id));
        if (isNumericId) {
            const numericId = typeof id === "string" ? Number(id) : id;
            const resolved = await resolveDocumentIdByNumericId("course-quizs", numericId);
            if (!resolved) {
                console.warn("Course quiz not found (already deleted?) with id:", numericId);
                return true;
            }
            documentId = resolved;
        } else {
            documentId = id as string;
        }
        await strapi.delete(`/api/course-quizs/${documentId}`);
        return true;
    } catch (error) {
        console.error("Error deleting course quiz:", error);
        return false;
    }
}

