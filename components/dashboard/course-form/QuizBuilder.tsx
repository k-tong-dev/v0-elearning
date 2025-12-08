"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { NumberInput } from "@/components/ui/number-input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Plus,
    Trash2,
    GripVertical,
    Edit,
    Save,
    X,
    CheckCircle,
    AlertCircle,
    Clock,
    HelpCircle,
    Target,
    BookOpen,
    Settings,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { cn } from "@/utils/utils";
import { toast } from "sonner";
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    useDndMonitor,
    DragOverlayProps,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    QuizSectionEntity,
    CourseQuizEntity,
    QuizLineEntity,
    createQuizSection,
    createCourseQuiz,
    createCourseQuizLine,
    updateCourseQuiz,
    updateCourseQuizLine,
    deleteCourseQuiz,
    deleteCourseQuizLine,
    getQuizSectionsByCourseContent,
    deleteQuizSection,
} from "@/integrations/strapi/quizStructure";
import { CourseContentEntity } from "@/integrations/strapi/courseMaterial";
import { InstructorSelector } from "./InstructorSelector";
import { Instructor } from "@/integrations/strapi/instructor";

interface QuizBuilderProps {
    workspace: {
        materialId: number;
        editingContent?: CourseContentEntity | null;
    };
    contentFormData: {
        name: string;
        instructor: number | null;
        estimated_minutes: number;
        is_preview: boolean;
    };
    setContentFormData: React.Dispatch<React.SetStateAction<any>>;
    collaboratingInstructors: Instructor[];
    onClose: () => void;
    onSave: () => Promise<number | null>; // Returns content ID or null
}

type QuizQuestionType = "radio" | "check-box" | "true-false";

interface LocalQuizLine {
    id: string;
    answer: string;
    is_correct: boolean;
    documentId?: string;
    quizId?: number;
}

interface LocalQuiz {
    id: string;
    documentId?: string;
    title: string;
    type: QuizQuestionType;
    question_text: string;
    order_index: number;
    duration: number;
    is_require: boolean;
    min_answer: number;
    max_answer: number;
    total_score: number;
    max_score: number;
    lines: LocalQuizLine[];
}

interface LocalQuizSection {
    id: string;
    documentId?: string;
    name: string;
    description: string;
    order_index: number;
    quizzes: LocalQuiz[];
}

export function QuizBuilder({
    workspace,
    contentFormData,
    setContentFormData,
    collaboratingInstructors,
    onClose,
    onSave,
}: QuizBuilderProps) {
    const { materialId, editingContent } = workspace;
    const [sections, setSections] = useState<LocalQuizSection[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set()); // Auto-expand all sections
    const [editingQuiz, setEditingQuiz] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    
    // Drag and drop sensors - optimized for smooth dragging
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { 
                distance: 1,
                delay: 0,
                tolerance: 0,
            },
        }),
    );
    
    
    // Saving progress tracking
    interface SaveProgressItem {
        id: string;
        type: "section" | "quiz" | "line";
        name: string;
        status: "saving" | "success" | "error";
    }
    const [saveProgressList, setSaveProgressList] = useState<SaveProgressItem[]>([]);

    // Load existing quiz data
    useEffect(() => {
        if (editingContent?.id) {
            loadQuizData();
        } else {
            // Start with one empty section
            setSections([
                {
                    id: generateTempId("section"),
                    name: "Quiz Section 1",
                    description: "",
                    order_index: 0,
                    quizzes: [],
                },
            ]);
        }
    }, [editingContent?.id]);

    const loadQuizData = async () => {
        if (!editingContent?.id) return;

        setLoading(true);
        try {
            const quizSections = await getQuizSectionsByCourseContent(editingContent.id);
            if (quizSections.length > 0) {
                const localSections: LocalQuizSection[] = quizSections.map((section) => ({
                    id: section.documentId || `section-${section.id}`,
                    documentId: section.documentId,
                    name: section.name,
                    description: section.description || "",
                    order_index: section.order_index,
                    quizzes: section.quizzes.map((quiz) => ({
                        id: quiz.documentId || `quiz-${quiz.id}`,
                        documentId: quiz.documentId,
                        title: quiz.title,
                        type: quiz.type,
                        question_text: quiz.question_text || "",
                        order_index: quiz.order_index,
                        duration: quiz.duration,
                        is_require: quiz.is_require,
                        min_answer: quiz.min_answer,
                        max_answer: quiz.max_answer,
                        total_score: quiz.total_score,
                        max_score: quiz.max_score,
                        lines: quiz.lines.map((line) => ({
                            id: line.documentId || `line-${line.id}`,
                            documentId: line.documentId,
                            answer: line.answer,
                            is_correct: line.is_correct,
                        })),
                    })),
                }));
                setSections(localSections);
                // Auto-expand all sections
                setExpandedSections(new Set(localSections.map(s => s.id)));
            } else {
                // No sections, create one empty section
                const newSection = {
                    id: generateTempId("section"),
                    name: "Quiz Section 1",
                    description: "",
                    order_index: 0,
                    quizzes: [],
                };
                setSections([newSection]);
                setExpandedSections(new Set([newSection.id]));
            }
        } catch (error) {
            console.error("Error loading quiz data:", error);
            toast.error("Failed to load quiz data");
        } finally {
            setLoading(false);
        }
    };

    const generateTempId = (prefix: string) =>
        `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const addSection = () => {
        const newSection: LocalQuizSection = {
            id: generateTempId("section"),
            name: `Quiz Section ${sections.length + 1}`,
            description: "",
            order_index: sections.length,
            quizzes: [],
        };
        setSections([...sections, newSection]);
        // Auto-expand new section
        setExpandedSections((prev) => {
            const next = new Set(prev);
            next.add(newSection.id);
            return next;
        });
    };

    const removeSection = (sectionId: string) => {
        setSections(sections.filter((s) => s.id !== sectionId));
        setExpandedSections((prev) => {
            const next = new Set(prev);
            next.delete(sectionId);
            return next;
        });
    };
    
    // Drag and drop handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };
    
    const handleDragEnd = () => {
        setActiveId(null);
    };
    
    const handleSectionDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over || active.id === over.id) return;
        
        const oldIndex = sections.findIndex((s) => s.id === active.id);
        const newIndex = sections.findIndex((s) => s.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
            const newSections = arrayMove(sections, oldIndex, newIndex);
            // Update order_index
            const updatedSections = newSections.map((s, idx) => ({
                ...s,
                order_index: idx,
            }));
            setSections(updatedSections);
        }
    };
    
    const handleQuizDragEnd = (sectionId: string) => (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over || active.id === over.id) return;
        
        const section = sections.find((s) => s.id === sectionId);
        if (!section) return;
        
        const oldIndex = section.quizzes.findIndex((q) => q.id === active.id);
        const newIndex = section.quizzes.findIndex((q) => q.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
            const newQuizzes = arrayMove(section.quizzes, oldIndex, newIndex);
            const updatedQuizzes = newQuizzes.map((q, idx) => ({
                ...q,
                order_index: idx,
            }));
            updateSection(sectionId, { quizzes: updatedQuizzes });
        }
    };
    
    const handleLineDragEnd = (sectionId: string, quizId: string) => (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over || active.id === over.id) return;
        
        const section = sections.find((s) => s.id === sectionId);
        if (!section) return;
        const quiz = section.quizzes.find((q) => q.id === quizId);
        if (!quiz) return;
        
        const oldIndex = quiz.lines.findIndex((l) => l.id === active.id);
        const newIndex = quiz.lines.findIndex((l) => l.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
            const newLines = arrayMove(quiz.lines, oldIndex, newIndex);
            updateQuiz(sectionId, quizId, { lines: newLines });
        }
    };

    const updateSection = (sectionId: string, updates: Partial<LocalQuizSection>) => {
        setSections(
            sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s))
        );
    };

    const addQuiz = (sectionId: string) => {
        const section = sections.find((s) => s.id === sectionId);
        if (!section) return;

        const newQuiz: LocalQuiz = {
            id: generateTempId("quiz"),
            title: "New Question",
            type: "radio",
            question_text: "",
            order_index: section.quizzes.length,
            duration: 60,
            is_require: true,
            min_answer: 1,
            max_answer: 1,
            total_score: 10,
            max_score: 10,
            lines: [
                { id: generateTempId("line"), answer: "", is_correct: false },
                { id: generateTempId("line"), answer: "", is_correct: false },
            ],
        };

        updateSection(sectionId, {
            quizzes: [...section.quizzes, newQuiz],
        });
        setEditingQuiz(newQuiz.id);
    };

    const removeQuiz = (sectionId: string, quizId: string) => {
        const section = sections.find((s) => s.id === sectionId);
        if (!section) return;

        updateSection(sectionId, {
            quizzes: section.quizzes.filter((q) => q.id !== quizId),
        });
        if (editingQuiz === quizId) {
            setEditingQuiz(null);
        }
    };

    const updateQuiz = (sectionId: string, quizId: string, updates: Partial<LocalQuiz>) => {
        const section = sections.find((s) => s.id === sectionId);
        if (!section) return;

        const updatedQuizzes = section.quizzes.map((q) =>
            q.id === quizId ? { ...q, ...updates } : q
        );
        updateSection(sectionId, { quizzes: updatedQuizzes });
    };

    const addQuizLine = (sectionId: string, quizId: string) => {
        const section = sections.find((s) => s.id === sectionId);
        if (!section) return;
        const quiz = section.quizzes.find((q) => q.id === quizId);
        if (!quiz) return;

        const newLine: LocalQuizLine = {
            id: generateTempId("line"),
            answer: "",
            is_correct: false,
        };

        updateQuiz(sectionId, quizId, {
            lines: [...quiz.lines, newLine],
        });
    };

    const removeQuizLine = (sectionId: string, quizId: string, lineId: string) => {
        const section = sections.find((s) => s.id === sectionId);
        if (!section) return;
        const quiz = section.quizzes.find((q) => q.id === quizId);
        if (!quiz) return;

        if (quiz.lines.length <= 2) {
            toast.error("A question must have at least 2 options");
            return;
        }

        updateQuiz(sectionId, quizId, {
            lines: quiz.lines.filter((l) => l.id !== lineId),
        });
    };

    const updateQuizLine = (
        sectionId: string,
        quizId: string,
        lineId: string,
        updates: Partial<LocalQuizLine>
    ) => {
        const section = sections.find((s) => s.id === sectionId);
        if (!section) return;
        const quiz = section.quizzes.find((q) => q.id === quizId);
        if (!quiz) return;

        const updatedLines = quiz.lines.map((l) =>
            l.id === lineId ? { ...l, ...updates } : l
        );
        updateQuiz(sectionId, quizId, { lines: updatedLines });
    };

    const validateQuiz = (quiz: LocalQuiz): string | null => {
        if (!quiz.question_text.trim()) {
            return "Question text is required";
        }
        if (quiz.lines.length < 2) {
            return "At least 2 options are required";
        }
        const validLines = quiz.lines.filter((l) => l.answer.trim());
        if (validLines.length < 2) {
            return "At least 2 valid options are required";
        }
        if (quiz.type === "radio" || quiz.type === "true-false") {
            const correctCount = validLines.filter((l) => l.is_correct).length;
            if (correctCount !== 1) {
                return "Exactly one correct answer is required for this question type";
            }
        } else if (quiz.type === "check-box") {
            const correctCount = validLines.filter((l) => l.is_correct).length;
            if (correctCount < quiz.min_answer) {
                return `At least ${quiz.min_answer} correct answer(s) required`;
            }
            if (quiz.max_answer > 0 && correctCount > quiz.max_answer) {
                return `Maximum ${quiz.max_answer} correct answer(s) allowed`;
            }
        }
        return null;
    };

    const handleSave = async () => {
        // Validate all quizzes
        for (const section of sections) {
            for (const quiz of section.quizzes) {
                const error = validateQuiz(quiz);
                if (error) {
                    toast.error(`Error in "${quiz.title || quiz.question_text}": ${error}`);
                    return;
                }
            }
        }

        if (sections.length === 0 || sections.every((s) => s.quizzes.length === 0)) {
            toast.error("Please add at least one question");
            return;
        }

        setSaving(true);
        // Don't clear immediately - let it build up
        const progressItems: SaveProgressItem[] = [];
        
        const updateProgress = (id: string, type: "section" | "quiz" | "line", name: string, status: "saving" | "success" | "error") => {
            const existingIndex = progressItems.findIndex((p) => p.id === id);
            if (existingIndex >= 0) {
                progressItems[existingIndex] = { id, type, name, status };
            } else {
                progressItems.push({ id, type, name, status });
            }
            // Update state immediately
            setSaveProgressList([...progressItems]);
        };
        
        try {
            // First, save/update the content (this will be handled by parent)
            let contentId = editingContent?.id;
            if (!contentId) {
                // Content doesn't exist yet, create it via parent callback
                const newContentId = await onSave();
                if (!newContentId) {
                    toast.error("Failed to create content. Please try again.");
                    setSaving(false);
                    return;
                }
                contentId = newContentId;
            }
            
            if (!contentId) {
                toast.error("Content ID is required. Please save the content first.");
                setSaving(false);
                return;
            }

            // Get existing sections to delete ones that are no longer present
            const existingSections = editingContent?.id
                ? await getQuizSectionsByCourseContent(contentId)
                : [];

            // Save or update sections
            for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
                const section = sections[sectionIndex];
                let sectionDocumentId = section.documentId;
                const sectionProgressId = `section-${section.id}`;

                if (!sectionDocumentId) {
                    // Create new section
                    updateProgress(sectionProgressId, "section", section.name, "saving");
                    const newSection = await createQuizSection({
                        name: section.name,
                        description: section.description,
                        order_index: sectionIndex,
                        course_content: contentId,
                    });
                    if (newSection) {
                        sectionDocumentId = newSection.documentId;
                        updateSection(section.id, { documentId: sectionDocumentId });
                        updateProgress(sectionProgressId, "section", section.name, "success");
                    } else {
                        updateProgress(sectionProgressId, "section", section.name, "error");
                    }
                } else {
                    updateProgress(sectionProgressId, "section", section.name, "success");
                }

                if (!sectionDocumentId) continue;

                // Get existing quizzes for this section
                const existingQuizzes = existingSections
                    .find((s) => s.documentId === sectionDocumentId)
                    ?.quizzes || [];

                // Save or update quizzes
                for (let quizIndex = 0; quizIndex < section.quizzes.length; quizIndex++) {
                    const quiz = section.quizzes[quizIndex];
                    let quizDocumentId = quiz.documentId;
                    let quizNumericId: number | undefined;
                    const quizProgressId = `quiz-${quiz.id}`;
                    const quizName = quiz.title || quiz.question_text || `Question ${quizIndex + 1}`;

                    if (!quizDocumentId) {
                        // Create new quiz - pass documentId directly for quiz_section
                        updateProgress(quizProgressId, "quiz", quizName, "saving");
                        const newQuiz = await createCourseQuiz({
                            title: quiz.title,
                            type: quiz.type,
                            question_text: quiz.question_text,
                            order_index: quizIndex,
                            duration: quiz.duration,
                            is_require: quiz.is_require,
                            min_answer: quiz.min_answer,
                            max_answer: quiz.max_answer,
                            total_score: quiz.total_score,
                            max_score: quiz.max_score,
                            course_content: contentId,
                            quiz_section: sectionDocumentId || undefined, // Pass documentId directly
                        });
                        if (newQuiz) {
                            quizDocumentId = newQuiz.documentId;
                            quizNumericId = newQuiz.id;
                            updateQuiz(section.id, quiz.id, {
                                documentId: quizDocumentId,
                            });
                            updateProgress(quizProgressId, "quiz", quizName, "success");
                        } else {
                            updateProgress(quizProgressId, "quiz", quizName, "error");
                        }
                    } else {
                        // Update existing quiz
                        updateProgress(quizProgressId, "quiz", quizName, "saving");
                        const existingQuiz = existingQuizzes.find(
                            (q) => q.documentId === quizDocumentId
                        );
                        if (existingQuiz) {
                            quizNumericId = existingQuiz.id;
                            const updated = await updateCourseQuiz(quizDocumentId, {
                                title: quiz.title,
                                type: quiz.type,
                                question_text: quiz.question_text,
                                order_index: quizIndex,
                                duration: quiz.duration,
                                is_require: quiz.is_require,
                                min_answer: quiz.min_answer,
                                max_answer: quiz.max_answer,
                                total_score: quiz.total_score,
                                max_score: quiz.max_score,
                            });
                            if (updated) {
                                quizNumericId = updated.id;
                                updateProgress(quizProgressId, "quiz", quizName, "success");
                            } else {
                                updateProgress(quizProgressId, "quiz", quizName, "error");
                            }
                        } else {
                            updateProgress(quizProgressId, "quiz", quizName, "success");
                        }
                    }

                    if (!quizNumericId) continue;

                    // Get existing lines for this quiz
                    const existingLines =
                        existingQuizzes.find((q) => q.documentId === quizDocumentId)?.lines ||
                        [];

                    // Save or update lines
                    for (let lineIndex = 0; lineIndex < quiz.lines.length; lineIndex++) {
                        const line = quiz.lines[lineIndex];
                        const validLine = line.answer.trim();
                        if (!validLine) continue;
                        
                        const lineProgressId = `line-${line.id}`;
                        const lineName = `Option ${String.fromCharCode(65 + lineIndex)}: ${validLine.substring(0, 30)}${validLine.length > 30 ? "..." : ""}`;

                        if (!line.documentId) {
                            // Create new line
                            updateProgress(lineProgressId, "line", lineName, "saving");
                            const created = await createCourseQuizLine({
                                course_quiz: quizNumericId,
                                answer: validLine,
                                is_correct: line.is_correct,
                            });
                            if (created) {
                                updateProgress(lineProgressId, "line", lineName, "success");
                            } else {
                                updateProgress(lineProgressId, "line", lineName, "error");
                            }
                        } else {
                            // Update existing line
                            updateProgress(lineProgressId, "line", lineName, "saving");
                            const existingLine = existingLines.find(
                                (l) => l.documentId === line.documentId
                            );
                            if (existingLine) {
                                const updated = await updateCourseQuizLine(line.documentId, {
                                    answer: validLine,
                                    is_correct: line.is_correct,
                                });
                                if (updated) {
                                    updateProgress(lineProgressId, "line", lineName, "success");
                                } else {
                                    updateProgress(lineProgressId, "line", lineName, "error");
                                }
                            } else {
                                updateProgress(lineProgressId, "line", lineName, "success");
                            }
                        }
                    }

                    // Delete lines that are no longer present
                    const currentLineIds = new Set(
                        quiz.lines
                            .map((l) => l.documentId)
                            .filter((id): id is string => !!id)
                    );
                    const linesToDelete = existingLines.filter(
                        (l) => l.documentId && !currentLineIds.has(l.documentId)
                    );
                    for (const lineToDelete of linesToDelete) {
                        if (lineToDelete.documentId) {
                            await deleteCourseQuizLine(lineToDelete.documentId);
                        }
                    }
                }

                // Delete quizzes that are no longer present
                const currentQuizIds = new Set(
                    section.quizzes
                        .map((q) => q.documentId)
                        .filter((id): id is string => !!id)
                );
                const quizzesToDelete = existingQuizzes.filter(
                    (q) => q.documentId && !currentQuizIds.has(q.documentId)
                );
                for (const quizToDelete of quizzesToDelete) {
                    if (quizToDelete.documentId) {
                        await deleteCourseQuiz(quizToDelete.documentId);
                    }
                }
            }

            // Delete sections that are no longer present
            const currentSectionIds = new Set(
                sections
                    .map((s) => s.documentId)
                    .filter((id): id is string => !!id)
            );
            const sectionsToDelete = existingSections.filter(
                (s) => s.documentId && !currentSectionIds.has(s.documentId)
            );
            for (const sectionToDelete of sectionsToDelete) {
                if (sectionToDelete.documentId) {
                    await deleteQuizSection(sectionToDelete.documentId);
                }
            }

            toast.success("Quiz saved successfully!");
            // Refresh content list via parent callback
            await onSave();
        } catch (error) {
            console.error("Error saving quiz:", error);
            toast.error("Failed to save quiz");
        } finally {
            setSaving(false);
        }
    };
    
    // Auto-close progress when all items are done
    useEffect(() => {
        if (saveProgressList.length > 0 && !saving) {
            const allDone = saveProgressList.every(item => item.status === "success" || item.status === "error");
            const hasSaving = saveProgressList.some(item => item.status === "saving");
            
            if (allDone && !hasSaving) {
                const timer = setTimeout(() => {
                    setSaveProgressList([]);
                }, 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [saveProgressList, saving]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4"
                >
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-2 border-violet-400/30 flex items-center justify-center mx-auto">
                            <Target className="w-8 h-8 text-violet-500 animate-pulse" />
                        </div>
                        <motion.div
                            className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-2 border-violet-400/30"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">Loading quiz data...</p>
                        <p className="text-xs text-muted-foreground mt-1">Please wait</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    const totalQuestions = sections.reduce((sum, s) => sum + s.quizzes.length, 0);
    const totalPoints = sections.reduce(
        (sum, s) => sum + s.quizzes.reduce((qSum, q) => qSum + (q.total_score || 0), 0),
        0
    );

    return (
        <div className="space-y-6">
            {/* Ultra Header with Gradient */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-pink-500/10 backdrop-blur-sm p-6 shadow-lg"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5" />
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: -5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </motion.div>
                        <div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Quiz Builder
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Create interactive questions and assessments
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-xl bg-background/60 border border-border/40">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Sections</p>
                                <p className="text-lg font-bold text-violet-600 dark:text-violet-400">{sections.length}</p>
                            </div>
                            <div className="w-px h-8 bg-border/40" />
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Questions</p>
                                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{totalQuestions}</p>
                            </div>
                            <div className="w-px h-8 bg-border/40" />
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Points</p>
                                <p className="text-lg font-bold text-pink-600 dark:text-pink-400">{totalPoints}</p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={onClose} className="rounded-xl">
                            Cancel
                        </Button>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white border-0 shadow-lg shadow-violet-500/30 rounded-xl"
                            >
                                {saving ? (
                                    <>
                                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Quiz
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Content Form Fields - Ultra Design */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-sm shadow-lg"
            >
                <div className="space-y-2">
                    <Label htmlFor="content-name" className="text-sm font-semibold">
                        Content Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="content-name"
                        value={contentFormData.name}
                        onChange={(e) =>
                            setContentFormData({ ...contentFormData, name: e.target.value })
                        }
                        placeholder="Enter quiz name"
                        className="rounded-xl border-border/40 focus:border-violet-500 focus:ring-violet-500/20"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-semibold">Responsible Instructor</Label>
                    <InstructorSelector
                        collaboratingInstructors={collaboratingInstructors || []}
                        value={contentFormData.instructor}
                        onChange={(instructorId) =>
                            setContentFormData({
                                ...contentFormData,
                                instructor: instructorId,
                            })
                        }
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="estimated-minutes" className="text-sm font-semibold">
                        Estimated Minutes
                    </Label>
                    <NumberInput
                        id="estimated-minutes"
                        value={contentFormData.estimated_minutes}
                        onValueChange={(value: number) =>
                            setContentFormData({
                                ...contentFormData,
                                estimated_minutes: value || 0,
                            })
                        }
                        minValue={0}
                        className="rounded-xl"
                    />
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-muted/30">
                    <Switch
                        id="is-preview"
                        checked={contentFormData.is_preview}
                        onCheckedChange={(checked) =>
                            setContentFormData({
                                ...contentFormData,
                                is_preview: checked,
                            })
                        }
                    />
                    <Label htmlFor="is-preview" className="text-sm font-medium cursor-pointer">
                        Allow Preview
                    </Label>
                </div>
            </motion.div>

            {/* Quiz Sections - Ultra Design */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
            >
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 border border-violet-400/20">
                    <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                            Quiz Sections
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Organize questions into sections
                        </p>
                    </div>
                </div>
                
                {/* Sticky Add Section Button - Google Forms Style */}
                <div className="sticky top-4 z-30 flex justify-end mb-4">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="shadow-lg shadow-violet-500/20"
                    >
                        <Button
                            onClick={addSection}
                            size="sm"
                            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-violet-600 dark:text-violet-400 border border-violet-300 dark:border-violet-600 rounded-full px-4 py-2 font-medium shadow-md hover:shadow-lg transition-all"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Section
                        </Button>
                    </motion.div>
                </div>

                <DndContext 
                    sensors={sensors} 
                    collisionDetection={closestCenter} 
                    onDragStart={handleDragStart}
                    onDragEnd={handleSectionDragEnd}
                >
                    <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        <AnimatePresence>
                            {sections.map((section, sectionIndex) => (
                                <SortableSectionCard
                                    key={section.id}
                                    section={section}
                                    sectionIndex={sectionIndex}
                                    expandedSections={expandedSections}
                                    onToggleExpanded={(id) => {
                                        setExpandedSections((prev) => {
                                            const next = new Set(prev);
                                            if (next.has(id)) {
                                                next.delete(id);
                                            } else {
                                                next.add(id);
                                            }
                                            return next;
                                        });
                                    }}
                                    onUpdateSection={updateSection}
                                    onRemoveSection={removeSection}
                                    onAddQuiz={addQuiz}
                                    onUpdateQuiz={updateQuiz}
                                    onRemoveQuiz={removeQuiz}
                                    onAddQuizLine={addQuizLine}
                                    onUpdateQuizLine={updateQuizLine}
                                    onRemoveQuizLine={removeQuizLine}
                                    validateQuiz={validateQuiz}
                                    handleQuizDragEnd={handleQuizDragEnd(section.id)}
                                    handleLineDragEnd={handleLineDragEnd}
                                    handleDragStart={handleDragStart}
                                    sensors={sensors}
                                    activeId={activeId}
                                />
                            ))}
                        </AnimatePresence>
                    </SortableContext>
                    <DragOverlay 
                        adjustScale={false}
                        dropAnimation={null}
                        style={{ 
                            cursor: 'grabbing',
                        }}
                        className="!pointer-events-none z-[9999]"
                    >
                        {activeId ? (
                            <div className="rounded-lg border border-violet-500/40 bg-gradient-to-br from-card/95 to-card/60 backdrop-blur-md px-2 py-1 shadow-xl opacity-95 pointer-events-none whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                    <GripVertical className="h-3 w-3 text-violet-500" />
                                    <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400">Dragging...</span>
                                </div>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </motion.div>
            
            {/* Saving Progress List - Ultra Compact & Modern */}
            {typeof window !== "undefined" && saveProgressList.length > 0 && createPortal(
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className="fixed bottom-6 right-6 z-[9999] w-80"
                    style={{ position: "fixed" }}
                >
                    <Card className="border border-violet-500/20 shadow-2xl shadow-violet-500/10 bg-background/98 backdrop-blur-xl overflow-hidden">
                        <CardHeader className="pb-3 px-4 pt-4 border-b border-violet-500/10 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="relative flex-shrink-0">
                                        <div className="absolute inset-0 bg-violet-500/30 rounded-full blur-md animate-pulse" />
                                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center border-2 border-violet-400/50 shadow-lg">
                                            <Clock className="h-5 w-5 text-white animate-spin" />
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <CardTitle className="text-base font-bold text-foreground truncate">
                                            Saving Progress
                                        </CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
                                                {saveProgressList.filter(i => i.status === "saving").length} saving
                                            </span>
                                            <span className="text-xs text-muted-foreground">•</span>
                                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                {saveProgressList.filter(i => i.status === "success").length} done
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all flex-shrink-0"
                                    onClick={() => setSaveProgressList([])}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-1.5 max-h-[320px] overflow-y-auto px-3 py-3 scrollbar-thin scrollbar-thumb-violet-500/30 scrollbar-track-transparent">
                            <AnimatePresence>
                                {saveProgressList.map((item, index) => {
                                    const getTypeIcon = () => {
                                        switch (item.type) {
                                            case "section": return BookOpen;
                                            case "quiz": return Target;
                                            case "line": return CheckCircle;
                                            default: return BookOpen;
                                        }
                                    };
                                    const getTypeColor = () => {
                                        switch (item.type) {
                                            case "section": return "from-violet-500/20 to-purple-500/20 border-violet-400/30";
                                            case "quiz": return "from-purple-500/20 to-pink-500/20 border-purple-400/30";
                                            case "line": return "from-pink-500/20 to-rose-500/20 border-pink-400/30";
                                            default: return "from-gray-500/20 to-slate-500/20 border-gray-400/30";
                                        }
                                    };
                                    const TypeIcon = getTypeIcon();
                                    const typeColor = getTypeColor();
                                    
                                    return (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                                            transition={{ 
                                                delay: index * 0.05,
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 25
                                            }}
                                            className={cn(
                                                "group relative overflow-hidden rounded-lg border transition-all duration-200",
                                                item.status === "saving" && "border-violet-400/40 bg-gradient-to-r from-violet-500/10 to-violet-500/5 shadow-sm",
                                                item.status === "success" && "border-emerald-400/40 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 shadow-sm",
                                                item.status === "error" && "border-red-400/40 bg-gradient-to-r from-red-500/10 to-red-500/5 shadow-sm"
                                            )}
                                        >
                                            <div className="relative flex items-center gap-2.5 px-3 py-2">
                                                <div className="flex-shrink-0 relative">
                                                    {item.status === "saving" && (
                                                        <>
                                                            <div className="absolute inset-0 bg-violet-500/30 rounded-full blur-md animate-pulse" />
                                                            <div className={cn("relative w-7 h-7 rounded-lg bg-gradient-to-br border-2 flex items-center justify-center shadow-sm", typeColor)}>
                                                                <Clock className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 animate-spin" />
                                                            </div>
                                                        </>
                                                    )}
                                                    {item.status === "success" && (
                                                        <div className={cn("w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 border-2 border-emerald-400 flex items-center justify-center shadow-sm shadow-emerald-500/30")}>
                                                            <CheckCircle className="h-3.5 w-3.5 text-white" />
                                                        </div>
                                                    )}
                                                    {item.status === "error" && (
                                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-400 flex items-center justify-center shadow-sm shadow-red-500/30">
                                                            <AlertCircle className="h-3.5 w-3.5 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-semibold text-foreground truncate">
                                                            {item.name}
                                                        </p>
                                                        <Badge variant="outline" className="h-4 px-1.5 text-[10px] shrink-0">
                                                            {item.type}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </motion.div>,
                document.body
            )}
        </div>
    );
}

// Sortable Section Card Component - Unified UI/UX Design
interface SortableSectionCardProps {
    section: LocalQuizSection;
    sectionIndex: number;
    expandedSections: Set<string>;
    onToggleExpanded: (id: string) => void;
    onUpdateSection: (sectionId: string, updates: Partial<LocalQuizSection>) => void;
    onRemoveSection: (sectionId: string) => void;
    onAddQuiz: (sectionId: string) => void;
    onUpdateQuiz: (sectionId: string, quizId: string, updates: Partial<LocalQuiz>) => void;
    onRemoveQuiz: (sectionId: string, quizId: string) => void;
    onAddQuizLine: (sectionId: string, quizId: string) => void;
    onUpdateQuizLine: (sectionId: string, quizId: string, lineId: string, updates: Partial<LocalQuizLine>) => void;
    onRemoveQuizLine: (sectionId: string, quizId: string, lineId: string) => void;
    validateQuiz: (quiz: LocalQuiz) => string | null;
    handleQuizDragEnd: (event: DragEndEvent) => void;
    handleLineDragEnd: (sectionId: string, quizId: string) => (event: DragEndEvent) => void;
    handleDragStart: (event: DragStartEvent) => void;
    sensors: ReturnType<typeof useSensors>;
    activeId: string | null;
}

function SortableSectionCard({
    section,
    sectionIndex,
    expandedSections,
    onToggleExpanded,
    onUpdateSection,
    onRemoveSection,
    onAddQuiz,
    onUpdateQuiz,
    onRemoveQuiz,
    onAddQuizLine,
    onUpdateQuizLine,
    onRemoveQuizLine,
    validateQuiz,
    handleQuizDragEnd,
    handleLineDragEnd,
    handleDragStart,
    sensors,
    activeId,
}: SortableSectionCardProps) {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
        id: section.id,
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.9 : 1,
    };
    
    const isExpanded = expandedSections.has(section.id);
    const quizOrder = section.quizzes.map((q) => q.id);

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: isDragging ? 0.9 : 1, y: 0, scale: isDragging ? 1.02 : 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-6 space-y-4 shadow-lg hover:shadow-xl transition-all duration-300",
                isDragging && "ring-2 ring-violet-500/40 shadow-2xl z-50"
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
                {/* Section Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                            type="button"
                            ref={setActivatorNodeRef}
                            {...listeners}
                            {...attributes}
                            className="h-9 w-9 rounded-full border border-border/50 bg-background/60 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing flex items-center justify-center flex-shrink-0"
                            aria-label="Reorder section"
                        >
                            <GripVertical className="h-4 w-4" />
                        </button>
                        <Badge variant="outline" className="shrink-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-400/30 text-violet-700 dark:text-violet-300 font-semibold">
                            Section {sectionIndex + 1}
                        </Badge>
                        <Input
                            value={section.name}
                            onChange={(e) => onUpdateSection(section.id, { name: e.target.value })}
                            className="flex-1 font-bold text-lg border-0 bg-transparent focus-visible:ring-2 focus-visible:ring-violet-500/20 rounded-xl"
                            placeholder="Section name"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="secondary"
                            className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-400/30 text-violet-700 dark:text-violet-300 font-semibold"
                        >
                            {section.quizzes.length} question{section.quizzes.length !== 1 ? "s" : ""}
                        </Badge>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onToggleExpanded(section.id)}
                                className="rounded-xl hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400"
                            >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onRemoveSection(section.id)}
                                className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </motion.div>
                    </div>
                </div>

                {/* Section Content - Always Expanded (like Certificate quiz) */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-4 space-y-4 pl-12 border-l-2 border-violet-400/40"
                        >
                            {/* Section Description */}
                            <div className="rounded-xl border border-border/30 bg-muted/20 p-3">
                                <Textarea
                                    value={section.description}
                                    onChange={(e) => onUpdateSection(section.id, { description: e.target.value })}
                                    placeholder="Section description (optional)"
                                    rows={2}
                                    className="border-0 bg-transparent focus-visible:ring-2 focus-visible:ring-violet-500/20 rounded-lg resize-none"
                                />
                            </div>

                            {/* Questions Header */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-400/20">
                                <div>
                                    <h4 className="text-md font-bold text-foreground">Questions</h4>
                                    <p className="text-xs text-muted-foreground">
                                        {section.quizzes.length} question{section.quizzes.length !== 1 ? "s" : ""} in this section
                                    </p>
                                </div>
                            </div>

                            {/* Sticky Add Question Button */}
                            <div className="sticky top-4 z-20 flex justify-end mb-3">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="shadow-lg shadow-purple-500/20"
                                >
                                    <Button
                                        onClick={() => onAddQuiz(section.id)}
                                        size="sm"
                                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-600 rounded-full px-4 py-2 font-medium shadow-md hover:shadow-lg transition-all"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Question
                                    </Button>
                                </motion.div>
                            </div>

                            {/* Questions List with Drag and Drop */}
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleQuizDragEnd}>
                                <SortableContext items={quizOrder} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-4">
                                        {section.quizzes.map((quiz, quizIndex) => (
                                            <SortableQuizCard
                                                key={quiz.id}
                                                quiz={quiz}
                                                quizIndex={quizIndex}
                                                sectionId={section.id}
                                                onUpdateQuiz={onUpdateQuiz}
                                                onRemoveQuiz={onRemoveQuiz}
                                                onAddQuizLine={onAddQuizLine}
                                                onUpdateQuizLine={onUpdateQuizLine}
                                                onRemoveQuizLine={onRemoveQuizLine}
                                                validateQuiz={validateQuiz}
                                                handleLineDragEnd={handleLineDragEnd(section.id, quiz.id)}
                                                handleDragStart={handleDragStart}
                                                sensors={sensors}
                                                activeId={activeId}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                                <DragOverlay 
                                    adjustScale={false}
                                    dropAnimation={null}
                                    style={{ 
                                        cursor: 'grabbing',
                                    }}
                                    className="!pointer-events-none z-[9999]"
                                >
                                    {activeId && section.quizzes.find(q => q.id === activeId) ? (
                                        <div className="rounded-lg border border-purple-500/40 bg-gradient-to-br from-background/95 to-muted/60 backdrop-blur-md px-2 py-1 shadow-xl opacity-95 pointer-events-none whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <GripVertical className="h-3 w-3 text-purple-500" />
                                                <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400">Dragging...</span>
                                            </div>
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// Sortable Quiz Card Component
interface SortableQuizCardProps {
    quiz: LocalQuiz;
    quizIndex: number;
    sectionId: string;
    onUpdateQuiz: (sectionId: string, quizId: string, updates: Partial<LocalQuiz>) => void;
    onRemoveQuiz: (sectionId: string, quizId: string) => void;
    onAddQuizLine: (sectionId: string, quizId: string) => void;
    onUpdateQuizLine: (sectionId: string, quizId: string, lineId: string, updates: Partial<LocalQuizLine>) => void;
    onRemoveQuizLine: (sectionId: string, quizId: string, lineId: string) => void;
    validateQuiz: (quiz: LocalQuiz) => string | null;
    handleLineDragEnd: (event: DragEndEvent) => void;
    handleDragStart: (event: DragStartEvent) => void;
    sensors: ReturnType<typeof useSensors>;
    activeId: string | null;
}

function SortableQuizCard({
    quiz,
    quizIndex,
    sectionId,
    onUpdateQuiz,
    onRemoveQuiz,
    onAddQuizLine,
    onUpdateQuizLine,
    onRemoveQuizLine,
    validateQuiz,
    handleLineDragEnd,
    handleDragStart,
    sensors,
    activeId,
}: SortableQuizCardProps) {
    const [isExpanded, setIsExpanded] = useState(true); // Auto-expand like Certificate quiz
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
        id: quiz.id,
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.9 : 1,
    };
    
    const lineOrder = quiz.lines.map((l) => l.id);

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: isDragging ? 0.9 : 1, x: 0, scale: isDragging ? 1.02 : 1 }}
            transition={{ delay: quizIndex * 0.05, duration: 0.2, ease: "easeOut" }}
            className={cn(
                "group relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-background via-background to-muted/10 backdrop-blur-sm p-5 space-y-4 shadow-md hover:shadow-lg hover:border-violet-400/40 transition-all duration-300",
                isDragging && "ring-2 ring-purple-500/40 shadow-xl z-40"
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
                {/* Quiz Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                            type="button"
                            ref={setActivatorNodeRef}
                            {...listeners}
                            {...attributes}
                            className="h-9 w-9 rounded-full border border-border/50 bg-background/60 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing flex items-center justify-center flex-shrink-0"
                            aria-label="Reorder question"
                        >
                            <GripVertical className="h-4 w-4" />
                        </button>
                        <Badge variant="outline" className="shrink-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-400/30 text-violet-700 dark:text-violet-300 font-bold text-sm px-3 py-1">
                            Q{quizIndex + 1}
                        </Badge>
                        <Input
                            value={quiz.title}
                            onChange={(e) => onUpdateQuiz(sectionId, quiz.id, { title: e.target.value })}
                            placeholder="Enter question title..."
                            className="flex-1 rounded-xl border-border/40 focus:border-violet-500 focus:ring-violet-500/20"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Select
                            value={quiz.type}
                            onValueChange={(value: QuizQuestionType) =>
                                onUpdateQuiz(sectionId, quiz.id, {
                                    type: value,
                                    min_answer: value === "check-box" ? quiz.min_answer : 1,
                                    max_answer: value === "check-box" ? quiz.max_answer : 1,
                                })
                            }
                        >
                            <SelectTrigger className="w-44 rounded-xl border-violet-400/30 focus:border-violet-500 focus:ring-violet-500/20">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="radio">Single answer</SelectItem>
                                <SelectItem value="check-box">Multiple answers</SelectItem>
                                <SelectItem value="true-false">True/False</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => onRemoveQuiz(sectionId, quiz.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Question Text */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                        Question Text <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                        value={quiz.question_text}
                        onChange={(e) => onUpdateQuiz(sectionId, quiz.id, { question_text: e.target.value })}
                        placeholder="Enter your question here..."
                        rows={3}
                        className="rounded-xl border-border/40 focus:border-violet-500 focus:ring-violet-500/20 resize-none"
                    />
                </div>

                {/* Answer Options with Drag and Drop */}
                <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground">
                        {quiz.type === "true-false" ? "True/False Options" : "Answer Options"}
                    </Label>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleLineDragEnd}>
                        <SortableContext items={lineOrder} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                                {quiz.lines.map((line, lineIndex) => (
                                    <SortableLineCard
                                        key={line.id}
                                        line={line}
                                        lineIndex={lineIndex}
                                        sectionId={sectionId}
                                        quizId={quiz.id}
                                        quizType={quiz.type}
                                        onUpdateLine={onUpdateQuizLine}
                                        onRemoveLine={onRemoveQuizLine}
                                        onToggleCorrect={() => {
                                            const newCorrect = !line.is_correct;
                                            if (quiz.type === "radio" || quiz.type === "true-false") {
                                                const updatedLines = quiz.lines.map((l) => ({
                                                    ...l,
                                                    is_correct: l.id === line.id ? newCorrect : false,
                                                }));
                                                onUpdateQuiz(sectionId, quiz.id, { lines: updatedLines });
                                            } else {
                                                onUpdateQuizLine(sectionId, quiz.id, line.id, { is_correct: newCorrect });
                                            }
                                        }}
                                        canRemove={quiz.lines.length > 2}
                                        activeId={activeId}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                        <DragOverlay 
                            adjustScale={false}
                            dropAnimation={null}
                            style={{ 
                                cursor: 'grabbing',
                            }}
                            className="!pointer-events-none z-[9999] [&>div]:transform-none [&>div]:translate-x-[-45%] [&>div]:translate-y-[40%]"
                        >
                            {activeId && quiz.lines.find(l => l.id === activeId) ? (
                                <div className="rounded-lg border border-pink-500/40 bg-gradient-to-r from-background/95 to-muted/60 backdrop-blur-md px-2 py-5 shadow-xl opacity-95 pointer-events-none whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                        <GripVertical className="h-3 w-3 text-pink-500" />
                                        <span className="text-[10px] font-medium text-pink-600 dark:text-pink-400">Dragging...</span>
                                    </div>
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                    {quiz.type !== "true-false" && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAddQuizLine(sectionId, quiz.id)}
                            className="w-full md:w-auto rounded-xl border-dashed border-violet-400/40 hover:border-violet-500 hover:bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Option
                        </Button>
                    )}
                </div>

                {/* Settings Toggle */}
                <div className="border-t border-border/40 pt-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full justify-between text-left"
                    >
                        <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            <span className="font-semibold">Question Settings & Conditions</span>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-4 space-y-4 pl-12"
                            >
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Duration (seconds)
                                        </Label>
                                        <NumberInput
                                            minValue={0}
                                            maxValue={3600}
                                            value={quiz.duration ?? 60}
                                            onValueChange={(value) =>
                                                onUpdateQuiz(sectionId, quiz.id, { duration: value ?? 60 })
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">Time limit for this question</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Required</Label>
                                        <div className="flex items-center justify-between rounded-xl border border-border/40 p-4">
                                            <div>
                                                <p className="text-sm font-medium">Question is required</p>
                                                <p className="text-xs text-muted-foreground">Learner must answer before proceeding</p>
                                            </div>
                                            <Switch
                                                checked={quiz.is_require ?? true}
                                                onCheckedChange={(checked) =>
                                                    onUpdateQuiz(sectionId, quiz.id, { is_require: checked })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Target className="h-4 w-4" />
                                            Total Score
                                        </Label>
                                        <NumberInput
                                            minValue={0}
                                            maxValue={1000}
                                            value={quiz.total_score ?? 10}
                                            onValueChange={(value) =>
                                                onUpdateQuiz(sectionId, quiz.id, { total_score: value ?? 10 })
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">Points awarded for correct answer</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Max Score</Label>
                                        <NumberInput
                                            minValue={0}
                                            maxValue={1000}
                                            value={quiz.max_score ?? 10}
                                            onValueChange={(value) =>
                                                onUpdateQuiz(sectionId, quiz.id, { max_score: value ?? 10 })
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">Maximum possible score</p>
                                    </div>
                                </div>

                                {quiz.type === "check-box" && (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Minimum answers required</Label>
                                            <NumberInput
                                                minValue={1}
                                                maxValue={quiz.lines.length}
                                                value={quiz.min_answer ?? 1}
                                                onValueChange={(value) =>
                                                    onUpdateQuiz(sectionId, quiz.id, { min_answer: value ?? 1 })
                                                }
                                            />
                                            <p className="text-xs text-muted-foreground">Only applied to multi-select questions</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Maximum answers allowed</Label>
                                            <NumberInput
                                                minValue={1}
                                                maxValue={quiz.lines.length}
                                                value={quiz.max_answer ?? 1}
                                                onValueChange={(value) =>
                                                    onUpdateQuiz(sectionId, quiz.id, { max_answer: value ?? 1 })
                                                }
                                            />
                                            <p className="text-xs text-muted-foreground">Set to 1 for single-answer questions</p>
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 text-xs text-violet-900 dark:text-violet-200">
                                    <p className="font-semibold mb-1 flex items-center gap-2">
                                        <Target className="h-4 w-4" />
                                        Pro tip
                                    </p>
                                    <p>Use scoring + required toggles to make certain questions count more toward the passing criteria.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Validation Error */}
                {validateQuiz(quiz) && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm"
                    >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{validateQuiz(quiz)}</span>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

// Sortable Line Card Component
interface SortableLineCardProps {
    line: LocalQuizLine;
    lineIndex: number;
    sectionId: string;
    quizId: string;
    quizType: QuizQuestionType;
    onUpdateLine: (sectionId: string, quizId: string, lineId: string, updates: Partial<LocalQuizLine>) => void;
    onRemoveLine: (sectionId: string, quizId: string, lineId: string) => void;
    onToggleCorrect: () => void;
    canRemove: boolean;
    activeId: string | null;
}

function SortableLineCard({
    line,
    lineIndex,
    sectionId,
    quizId,
    quizType,
    onUpdateLine,
    onRemoveLine,
    onToggleCorrect,
    canRemove,
    activeId,
}: SortableLineCardProps) {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
        id: line.id,
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.9 : 1,
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isDragging ? 0.9 : 1, x: 0, scale: isDragging ? 1.01 : 1 }}
            transition={{ delay: lineIndex * 0.05, duration: 0.2, ease: "easeOut" }}
            className={cn(
                "flex flex-col gap-3 rounded-xl border border-border/40 bg-background/60 p-4 md:flex-row md:items-center transition-all duration-200",
                line.is_correct && "bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-400/40 shadow-sm shadow-emerald-500/10",
                isDragging && "ring-2 ring-pink-500/40 shadow-lg z-30"
            )}
        >
            <div className="flex items-center gap-3 flex-1">
                <button
                    type="button"
                    ref={setActivatorNodeRef}
                    {...listeners}
                    {...attributes}
                    className="h-8 w-8 rounded-full border border-border/50 bg-background/60 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing flex items-center justify-center flex-shrink-0"
                    aria-label="Reorder option"
                >
                    <GripVertical className="h-3 w-3" />
                </button>
                <span className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border-2",
                    line.is_correct
                        ? "bg-gradient-to-br from-emerald-500 to-green-500 border-emerald-400 text-white shadow-md shadow-emerald-500/30"
                        : "bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-violet-400/30 text-violet-700 dark:text-violet-300"
                )}>
                    {String.fromCharCode(65 + lineIndex)}
                </span>
                <div className="flex items-center gap-2">
                    <Switch
                        checked={line.is_correct}
                        onCheckedChange={onToggleCorrect}
                    />
                    <span className="text-xs text-muted-foreground min-w-[60px]">
                        {line.is_correct ? (
                            <span className="text-green-600 font-semibold">Correct</span>
                        ) : (
                            <span>Incorrect</span>
                        )}
                    </span>
                </div>
                <Input
                    value={line.answer}
                    onChange={(e) => onUpdateLine(sectionId, quizId, line.id, { answer: e.target.value })}
                    placeholder={quizType === "true-false" ? "True or False" : `Option ${lineIndex + 1}...`}
                    className="flex-1 border-0 bg-transparent focus-visible:ring-2 focus-visible:ring-violet-500/20 rounded-lg"
                    disabled={quizType === "true-false"}
                />
            </div>
            {quizType !== "true-false" && canRemove && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => onRemoveLine(sectionId, quizId, line.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </motion.div>
    );
}

