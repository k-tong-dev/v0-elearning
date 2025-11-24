import {
    CertificateQuestionForm,
    CertificateTheme,
    removeLegacyDesignQuizzes,
} from "@/integrations/strapi/certificateProgram";
import {CourseQuizEntity} from "@/integrations/strapi/quizStructure";

export type CertificateQuestionOption = {
    id: string;
    text: string;
    isCorrect: boolean;
};

export type CertificateFormState = {
    id?: number;
    documentId?: string;
    name: string;
    subtitle: string;
    issuer: string;
    signatureName: string;
    customMessage: string;
    highlightColor: string;
    issueCriteria: string;
    includeSeal: boolean;
    theme: CertificateTheme;
    auto_issue: boolean;
    active: boolean;
    min_score_to_pass: number;
    valid_until?: string | null;
    company?: number | null;
    questions: CertificateQuestionForm[];
    ownerId?: number | null;
};

export type CertificateTemplate = CertificateFormState & {
    id: number;
    documentId: string;
    course_content?: { id: number } | undefined;
};

const generateTempId = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const createEmptyCertificateForm = (): CertificateFormState => ({
    name: "",
    subtitle: "Certificate of Achievement",
    issuer: "",
    signatureName: "",
    customMessage: "",
    highlightColor: "#6366f1",
    issueCriteria: "",
    includeSeal: true,
    theme: "Aurora",
    auto_issue: true,
    active: true,
    min_score_to_pass: 0.7,
    valid_until: null,
    company: null,
    questions: [],
    ownerId: null,
});

export const mapCertificateRecord = (record: any): CertificateTemplate => {
    const rawQuizzes = (record.course_quizs || []) as CourseQuizEntity[];
    const filteredQuizzes = removeLegacyDesignQuizzes(rawQuizzes).sort(
        (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
    );
    const questions: CertificateQuestionForm[] = filteredQuizzes.map((quiz) => {
        // Debug logging
        if (!quiz.lines || quiz.lines.length === 0) {
            console.warn(`Quiz ${quiz.id} has no lines:`, {
                quizId: quiz.id,
                title: quiz.title,
                lines: quiz.lines,
            });
        }
        
        return {
            id: quiz.id,
            prompt: quiz.question_text || quiz.title || "Untitled question",
            type: (quiz.type as "radio" | "check-box" | "true-false") || "radio",
            options:
                quiz.lines && quiz.lines.length > 0
                    ? quiz.lines.map((line, idx) => ({
                          id: `${quiz.id}-${line.id ?? idx}`,
                          text: line.answer || "",
                          isCorrect: !!line.is_correct,
                      }))
                    : [
                          {id: generateTempId("opt"), text: "", isCorrect: false},
                          {id: generateTempId("opt"), text: "", isCorrect: false},
                      ],
            duration: quiz.duration ?? 60,
            is_require: quiz.is_require ?? true,
            min_answer: quiz.min_answer ?? 1,
            max_answer: quiz.max_answer ?? 1,
            total_score: quiz.total_score ?? 10,
            max_score: quiz.max_score ?? 10,
        };
    });

    return {
        id: record.id,
        documentId: record.documentId,
        name: record.name,
        subtitle: "Certificate of Achievement",
        issuer: record.issuer ?? "",
        signatureName: record.signature_name ?? "",
        customMessage: record.message ?? "",
        highlightColor: record.color ?? "#6366f1",
        issueCriteria: record.issue_criterial ?? "",
        includeSeal: record.include_seal ?? true,
        theme: (record.theme as CertificateTheme) ?? "Aurora",
        auto_issue: record.auto_issue ?? true,
        active: record.active ?? true,
        min_score_to_pass: Number(record.min_score_to_pass ?? 0),
        valid_until: record.valid_until ?? null,
        company: record.company?.id ?? null,
        ownerId: record.owner?.id ?? null,
        questions,
        course_content: record.course_content,
    };
};

