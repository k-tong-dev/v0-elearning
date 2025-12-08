import {strapi, strapiPublic} from "./client";

export interface QuizAttemptAnswerEntity {
    id: number;
    documentId: string;
    quiz_attempt: { id: number };
    course_quiz: { id: number };
    selected_line?: { id: number } | null;
    selected_lines?: number[] | null; // Array of course-quiz-line IDs for multi-select
    is_correct: boolean;
    points_awarded?: number | null;
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

export async function createQuizAttemptAnswer(data: {
    quiz_attempt: number;
    course_quiz: number;
    selected_line?: number | null;
    selected_lines?: number[] | null;
    is_correct: boolean;
    points_awarded?: number | null;
}): Promise<QuizAttemptAnswerEntity | null> {
    try {
        // Resolve documentIds for relations to ensure Strapi Admin UI displays them
        const attemptDocumentId = await resolveDocumentIdByNumericId("quiz-attempts", data.quiz_attempt);
        if (!attemptDocumentId) {
            console.error("Failed to resolve quiz_attempt documentId for quiz attempt answer creation");
            return null;
        }

        const quizDocumentId = await resolveDocumentIdByNumericId("course-quizs", data.course_quiz);
        if (!quizDocumentId) {
            console.error("Failed to resolve course_quiz documentId for quiz attempt answer creation");
            return null;
        }

        let selectedLineConnect = undefined;
        if (data.selected_line) {
            const lineDocId = await resolveDocumentIdByNumericId("course-quiz-lines", data.selected_line);
            if (lineDocId) {
                selectedLineConnect = { connect: [{ documentId: lineDocId }] };
            }
        }

        const response = await strapi.post("/api/quiz-attempt-answers", {
            data: {
                // Use connect with documentId for CREATE to ensure Strapi Admin UI displays the relation
                quiz_attempt: {
                    connect: [{ documentId: attemptDocumentId }],
                },
                course_quiz: {
                    connect: [{ documentId: quizDocumentId }],
                },
                selected_line: selectedLineConnect,
                selected_lines: data.selected_lines ?? undefined,
                is_correct: data.is_correct,
                points_awarded: data.points_awarded ?? undefined,
            },
        });
        const item = response.data?.data;
        return {
            id: item.id,
            documentId: item.documentId,
            quiz_attempt: item.quiz_attempt?.data ? { id: item.quiz_attempt.data.id } : { id: item.quiz_attempt.id },
            course_quiz: item.course_quiz?.data ? { id: item.course_quiz.data.id } : { id: item.course_quiz.id },
            selected_line: item.selected_line
                ? item.selected_line.data
                    ? { id: item.selected_line.data.id }
                    : { id: item.selected_line.id }
                : null,
            selected_lines: item.selected_lines ?? null,
            is_correct: item.is_correct ?? false,
            points_awarded: item.points_awarded ?? null,
        };
    } catch (error) {
        console.error("Error creating quiz attempt answer:", error);
        return null;
    }
}

export async function updateQuizAttemptAnswer(
    id: string | number,
    data: Partial<{
        selected_line: number | null;
        selected_lines: number[] | null;
        is_correct: boolean;
        points_awarded: number | null;
    }>,
): Promise<QuizAttemptAnswerEntity | null> {
    try {
        let documentId: string;
        const isNumericId = typeof id === "number" || (typeof id === "string" && /^\d+$/.test(id));
        if (isNumericId) {
            const numericId = typeof id === "string" ? Number(id) : id;
            const fetchResponse = await strapiPublic.get(`/api/quiz-attempt-answers?filters[id][$eq]=${numericId}`);
            const items = fetchResponse.data?.data ?? [];
            if (items.length === 0) {
                console.error("Quiz attempt answer not found with id:", numericId);
                return null;
            }
            documentId = items[0].documentId;
        } else {
            documentId = id as string;
        }

        const response = await strapi.put(`/api/quiz-attempt-answers/${documentId}`, {
            data,
        });
        const item = response.data?.data;
        return {
            id: item.id,
            documentId: item.documentId,
            quiz_attempt: item.quiz_attempt?.data ? { id: item.quiz_attempt.data.id } : { id: item.quiz_attempt.id },
            course_quiz: item.course_quiz?.data ? { id: item.course_quiz.data.id } : { id: item.course_quiz.id },
            selected_line: item.selected_line
                ? item.selected_line.data
                    ? { id: item.selected_line.data.id }
                    : { id: item.selected_line.id }
                : null,
            selected_lines: item.selected_lines ?? null,
            is_correct: item.is_correct ?? false,
            points_awarded: item.points_awarded ?? null,
        };
    } catch (error) {
        console.error("Error updating quiz attempt answer:", error);
        return null;
    }
}

export async function getQuizAttemptAnswers(filters?: {
    quizAttemptId?: number;
    courseQuizId?: number;
}): Promise<QuizAttemptAnswerEntity[]> {
    try {
        const params = new URLSearchParams();
        params.set("populate", "*");

        if (filters?.quizAttemptId) {
            params.set("filters[quiz_attempt][id][$eq]", String(filters.quizAttemptId));
        }
        if (filters?.courseQuizId) {
            params.set("filters[course_quiz][id][$eq]", String(filters.courseQuizId));
        }

        const response = await strapiPublic.get(`/api/quiz-attempt-answers?${params.toString()}`);
        const items = response.data?.data || [];

        return items.map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            quiz_attempt: item.quiz_attempt?.data
                ? { id: item.quiz_attempt.data.id }
                : { id: item.quiz_attempt?.id ?? 0 },
            course_quiz: item.course_quiz?.data
                ? { id: item.course_quiz.data.id }
                : { id: item.course_quiz?.id ?? 0 },
            selected_line: item.selected_line
                ? item.selected_line.data
                    ? { id: item.selected_line.data.id }
                    : { id: item.selected_line.id }
                : null,
            selected_lines: item.selected_lines ?? null,
            is_correct: item.is_correct ?? false,
            points_awarded: item.points_awarded ?? null,
        }));
    } catch (error) {
        console.error("Error fetching quiz attempt answers:", error);
        return [];
    }
}

export async function getQuizAttemptAnswer(id: string | number): Promise<QuizAttemptAnswerEntity | null> {
    try {
        let documentId: string;
        const isNumericId = typeof id === "number" || (typeof id === "string" && /^\d+$/.test(id));
        if (isNumericId) {
            const numericId = typeof id === "string" ? Number(id) : id;
            const fetchResponse = await strapiPublic.get(
                `/api/quiz-attempt-answers?filters[id][$eq]=${numericId}&populate=*`,
            );
            const items = fetchResponse.data?.data ?? [];
            if (items.length === 0) {
                return null;
            }
            documentId = items[0].documentId;
        } else {
            documentId = id as string;
        }

        const response = await strapiPublic.get(`/api/quiz-attempt-answers/${documentId}?populate=*`);
        const item = response.data?.data;

        return {
            id: item.id,
            documentId: item.documentId,
            quiz_attempt: item.quiz_attempt?.data
                ? { id: item.quiz_attempt.data.id }
                : { id: item.quiz_attempt?.id ?? 0 },
            course_quiz: item.course_quiz?.data ? { id: item.course_quiz.data.id } : { id: item.course_quiz?.id ?? 0 },
            selected_line: item.selected_line
                ? item.selected_line.data
                    ? { id: item.selected_line.data.id }
                    : { id: item.selected_line.id }
                : null,
            selected_lines: item.selected_lines ?? null,
            is_correct: item.is_correct ?? false,
            points_awarded: item.points_awarded ?? null,
        };
    } catch (error) {
        console.error("Error fetching quiz attempt answer:", error);
        return null;
    }
}

export async function deleteQuizAttemptAnswer(id: string | number): Promise<boolean> {
    try {
        let documentId: string;
        const isNumericId = typeof id === "number" || (typeof id === "string" && /^\d+$/.test(id));
        if (isNumericId) {
            const numericId = typeof id === "string" ? Number(id) : id;
            const fetchResponse = await strapiPublic.get(`/api/quiz-attempt-answers?filters[id][$eq]=${numericId}`);
            const items = fetchResponse.data?.data ?? [];
            if (items.length === 0) {
                console.error("Quiz attempt answer not found with id:", numericId);
                return false;
            }
            documentId = items[0].documentId;
        } else {
            documentId = id as string;
        }
        await strapi.delete(`/api/quiz-attempt-answers/${documentId}`);
        return true;
    } catch (error) {
        console.error("Error deleting quiz attempt answer:", error);
        return false;
    }
}

