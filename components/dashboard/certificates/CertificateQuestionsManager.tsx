"use client";

import React, {useCallback, useEffect, useMemo, useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Badge} from "@/components/ui/badge";
import {Switch} from "@/components/ui/switch";
import {NumberInput} from "@/components/ui/number-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {ChevronDown, ChevronUp, Clock, Target, Settings, GripVertical} from "lucide-react";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Loader2,
    FileText,
    AlertCircle,
} from "lucide-react";
import {toast} from "sonner";
import {cn} from "@/utils/utils";
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {
    CertificateQuestionForm,
    replaceCertificateQuestions,
    getCertificatePrograms,
    removeLegacyDesignQuizzes,
} from "@/integrations/strapi/certificateProgram";
import {getCertificateQuizzes} from "@/integrations/strapi/quizStructure";
import {CourseQuizEntity} from "@/integrations/strapi/quizStructure";
import {mapCertificateRecord} from "@/components/dashboard/certificates/certificate-utils";

interface CertificateQuestionsManagerProps {
    certificateId: number;
    certificateName: string;
    onBack: () => void;
    onSave?: () => void;
}

const generateTempId = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type EditableQuestion = CertificateQuestionForm & { clientId: string };

export function CertificateQuestionsManager({
    certificateId,
    certificateName,
    onBack,
    onSave,
}: CertificateQuestionsManagerProps) {
    const [questions, setQuestions] = useState<EditableQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [certificateData, setCertificateData] = useState<any>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
                delay: 0,
                tolerance: 5,
            },
        }),
    );
    const questionOrder = useMemo(() => questions.map((question) => question.clientId), [questions]);

    const loadQuestions = useCallback(async () => {
        setIsLoading(true);
        try {
            // Load quizzes directly to ensure we get the lines
            const quizzes = removeLegacyDesignQuizzes(await getCertificateQuizzes(certificateId));
            
            // Load certificate data to get design info
            const certificates = await getCertificatePrograms();
            const cert = certificates.find((c: any) => c.id === certificateId);
            
            if (cert) {
                setCertificateData(cert);
                // Use the quizzes we fetched directly (which have lines populated)
                const mapped = mapCertificateRecord({
                    ...cert,
                    course_quizs: quizzes, // Override with directly fetched quizzes that have lines
                });
                const normalizedQuestions = mapped.questions.map((q) => ({
                        ...q,
                    clientId: q.id ? `quiz-${q.id}` : generateTempId("question"),
                        options: q.options.map((opt) => ({...opt})),
                }));
                setQuestions(normalizedQuestions);
            } else {
                // If certificate not found, try to build questions from quizzes directly
                if (quizzes.length > 0) {
                    const questionsFromQuizzes = quizzes.map((quiz) => ({
                        id: quiz.id,
                        prompt: quiz.question_text || quiz.title || "Untitled question",
                        type: (quiz.type as "radio" | "check-box" | "true-false") || "radio",
                        options:
                            quiz.lines?.map((line, idx) => ({
                                id: `${quiz.id}-${line.id ?? idx}`,
                                text: line.answer,
                                isCorrect: !!line.is_correct,
                            })) || [],
                        duration: quiz.duration ?? 60,
                        is_require: quiz.is_require ?? true,
                        min_answer: quiz.min_answer ?? 1,
                        max_answer: quiz.max_answer ?? 1,
                        total_score: quiz.total_score ?? 10,
                        max_score: quiz.max_score ?? 10,
                        clientId: quiz.id ? `quiz-${quiz.id}` : generateTempId("question"),
                    }));
                    setQuestions(questionsFromQuizzes);
                } else {
                    setQuestions([]);
                }
            }
        } catch (error) {
            console.error("Error loading questions:", error);
            toast.error("Failed to load questions.");
            setQuestions([]);
        } finally {
            setIsLoading(false);
        }
    }, [certificateId]);

    useEffect(() => {
        loadQuestions();
    }, [loadQuestions]);

    const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
    
    // Auto-expand all questions on load
    useEffect(() => {
        if (questions.length > 0) {
            setExpandedQuestions(new Set(questions.map(q => q.clientId)));
        }
    }, [questions.length]);

    const toggleQuestionExpanded = (questionId: string) => {
        setExpandedQuestions((prev) => {
            const next = new Set(prev);
            if (next.has(questionId)) {
                next.delete(questionId);
            } else {
                next.add(questionId);
            }
            return next;
        });
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };
    
    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        setActiveId(null);
        if (!over || active.id === over.id) return;
        const oldIndex = questionOrder.indexOf(String(active.id));
        const newIndex = questionOrder.indexOf(String(over.id));
        if (oldIndex === -1 || newIndex === -1) return;
        setQuestions((prev) => arrayMove(prev, oldIndex, newIndex));
    };

    const addQuestion = () => {
        const newQuestion: EditableQuestion = {
                id: undefined,
            clientId: generateTempId("question"),
                prompt: "",
                type: "radio",
                options: [
                    {id: generateTempId("opt"), text: "", isCorrect: true},
                    {id: generateTempId("opt"), text: "", isCorrect: false},
                ],
            duration: 60,
                is_require: true,
                min_answer: 1,
                max_answer: 1,
                total_score: 10,
                max_score: 10,
        };
        setQuestions((prev) => [...prev, newQuestion]);
        setExpandedQuestions((prev) => {
            const next = new Set(prev);
            next.add(newQuestion.clientId);
            return next;
        });
    };

    const updateQuestion = (index: number, updates: Partial<CertificateQuestionForm>) => {
        setQuestions((prev) =>
            prev.map((question, idx) => {
                if (idx !== index) return question;
                
                const updatedQuestion = {
                    ...question,
                    ...updates,
                };

                // If changing to true-false, automatically create True/False options
                if (updates.type === "true-false") {
                    updatedQuestion.options = [
                        {id: generateTempId("opt"), text: "True", isCorrect: false},
                        {id: generateTempId("opt"), text: "False", isCorrect: true},
                    ];
                } else if (question.type === "true-false" && updates.type && updates.type !== "true-false") {
                    // If changing from true-false to another type, reset to default options
                    if (updatedQuestion.options.length === 2 && 
                        (updatedQuestion.options[0].text === "True" || updatedQuestion.options[0].text === "False")) {
                        updatedQuestion.options = [
                            {id: generateTempId("opt"), text: "", isCorrect: true},
                            {id: generateTempId("opt"), text: "", isCorrect: false},
                        ];
                    }
                }

                return updatedQuestion;
            }),
        );
    };

    const removeQuestion = (index: number) => {
        setQuestions((prev) => {
            const question = prev[index];
            if (question) {
                setExpandedQuestions((expanded) => {
                    const next = new Set(expanded);
                    next.delete(question.clientId);
                    return next;
                });
            }
            return prev.filter((_, idx) => idx !== index);
        });
    };

    const addOption = (questionIndex: number) => {
        setQuestions((prev) =>
            prev.map((question, idx) => {
                if (idx !== questionIndex) return question;
                // Don't allow adding options to true-false questions
                if (question.type === "true-false") {
                    return question;
                }
                return {
                    ...question,
                    options: [
                        ...question.options,
                        {id: generateTempId("opt"), text: "", isCorrect: false},
                    ],
                };
            }),
        );
    };

    const updateOption = (
        questionIndex: number,
        optionId: string,
        updates: {text?: string; isCorrect?: boolean},
    ) => {
        setQuestions((prev) =>
            prev.map((question, idx) => {
                if (idx !== questionIndex) return question;
                return {
                    ...question,
                    options: question.options.map((option) => {
                        if (option.id !== optionId) {
                            // For radio and true-false, only one option can be correct
                            return updates.isCorrect && (question.type === "radio" || question.type === "true-false")
                                ? {...option, isCorrect: false}
                                : option;
                        }
                        return {
                            ...option,
                            ...updates,
                        };
                    }),
                };
            }),
        );
    };

    const removeOption = (questionIndex: number, optionId: string) => {
        setQuestions((prev) =>
            prev.map((question, idx) => {
                if (idx !== questionIndex) return question;
                const filtered = question.options.filter((option) => option.id !== optionId);
                return {
                    ...question,
                    options: filtered.length > 0 ? filtered : question.options,
                };
            }),
        );
    };

    const handleSave = async () => {
        // Validate questions
        for (const question of questions) {
            if (!question.prompt.trim()) {
                toast.error(`Question ${questions.indexOf(question) + 1} needs a prompt.`);
                return;
            }
            if (question.options.length < 2) {
                toast.error(`Question ${questions.indexOf(question) + 1} needs at least 2 options.`);
                return;
            }
            const hasCorrectAnswer = question.options.some((opt) => opt.isCorrect);
            if (!hasCorrectAnswer) {
                toast.error(`Question ${questions.indexOf(question) + 1} needs at least one correct answer.`);
                return;
            }
            for (const option of question.options) {
                if (!option.text.trim()) {
                    toast.error(`Question ${questions.indexOf(question) + 1} has an empty option.`);
                    return;
                }
            }
        }

        setIsSaving(true);
        try {
            // Get design data from certificate if available
            await replaceCertificateQuestions(certificateId, questions);
            toast.success("Questions saved successfully.");
            if (onSave) {
                onSave();
            }
        } catch (error) {
            console.error("Error saving questions:", error);
            toast.error("Failed to save questions.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={onBack} className="h-10 w-10 rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Assessment Questions
                        </h2>
                        <p className="text-muted-foreground">{certificateName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={onBack}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:from-blue-600 hover:to-purple-600"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                Save Questions
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        Build verification questions
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Learners must answer these questions correctly before receiving the certificate. Each
                        question requires at least 2 options and one correct answer.
                    </p>
                </div>
            </div>

            {/* Questions List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold">Questions ({questions.length})</p>
                            <p className="text-xs text-muted-foreground">
                                Add questions to verify learner knowledge
                            </p>
                        </div>
                        <Button variant="outline" onClick={addQuestion}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Question
                        </Button>
                    </div>

                    {questions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border/50 bg-card/50 backdrop-blur-sm p-20 text-center">
                            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">No questions yet</h3>
                            <p className="text-muted-foreground mb-6">
                                Add your first question to start building the assessment.
                            </p>
                            <Button onClick={addQuestion} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                <Plus className="mr-2 h-4 w-4" />
                                Add First Question
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Sticky Add Question Button - Google Forms Style */}
                            <div className="sticky top-4 z-30 flex justify-end mb-4">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="shadow-lg shadow-violet-500/20"
                                >
                                    <Button
                                        onClick={addQuestion}
                                        size="sm"
                                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-violet-600 dark:text-violet-400 border border-violet-300 dark:border-violet-600 rounded-full px-4 py-2 font-medium shadow-md hover:shadow-lg transition-all"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Question
                                    </Button>
                                </motion.div>
                            </div>
                            <DndContext 
                                sensors={sensors} 
                                collisionDetection={closestCenter} 
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext items={questionOrder} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {questions.map((question, questionIndex) => (
                                            <SortableQuestionCard
                                                key={question.clientId}
                                                question={question}
                                                questionIndex={questionIndex}
                                                isExpanded={expandedQuestions.has(question.clientId)}
                                                onToggleExpanded={toggleQuestionExpanded}
                                                onRemove={removeQuestion}
                                                onUpdateQuestion={updateQuestion}
                                                onAddOption={addOption}
                                                onUpdateOption={updateOption}
                                                onRemoveOption={removeOption}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                                <DragOverlay 
                                    adjustScale={false} 
                                    style={{ cursor: 'grabbing' }}
                                >
                                    {activeId ? (
                                        <div className="rounded-lg border border-violet-500/40 bg-gradient-to-br from-card/95 to-card/60 backdrop-blur-md px-2 py-1 shadow-xl opacity-90 pointer-events-none whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <GripVertical className="h-3 w-3 text-violet-500" />
                                                <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400">Dragging...</span>
                                            </div>
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        </>
                    )}
                </div>
            )}
        </motion.div>
    );
}

type SortableQuestionCardProps = {
    question: EditableQuestion;
    questionIndex: number;
    isExpanded: boolean;
    onToggleExpanded: (questionId: string) => void;
    onRemove: (index: number) => void;
    onUpdateQuestion: (index: number, updates: Partial<CertificateQuestionForm>) => void;
    onAddOption: (questionIndex: number) => void;
    onUpdateOption: (
        questionIndex: number,
        optionId: string,
        updates: {text?: string; isCorrect?: boolean},
    ) => void;
    onRemoveOption: (questionIndex: number, optionId: string) => void;
};

function SortableQuestionCard({
    question,
    questionIndex,
    isExpanded,
    onToggleExpanded,
    onRemove,
    onUpdateQuestion,
    onAddOption,
    onUpdateOption,
    onRemoveOption,
}: SortableQuestionCardProps) {
    const {attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging} = useSortable({
        id: question.clientId,
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
                                <motion.div
            ref={setNodeRef}
            style={style}
            layout
                                    initial={{opacity: 0, y: 10}}
                                    animate={{opacity: isDragging ? 0.9 : 1, y: 0, scale: isDragging ? 1.02 : 1}}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-6 space-y-4 shadow-lg hover:shadow-xl transition-all duration-300",
                isDragging && "ring-2 ring-violet-500/40 shadow-2xl z-50",
            )}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="relative z-10">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                    <motion.button
                        type="button"
                        ref={setActivatorNodeRef}
                        {...listeners}
                        {...attributes}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="h-9 w-9 rounded-full border border-border/50 bg-background/60 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing flex items-center justify-center transition-all"
                        aria-label="Reorder question"
                    >
                        <GripVertical className="h-4 w-4" />
                    </motion.button>
                                            <Badge variant="outline" className="shrink-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-400/30 text-violet-700 dark:text-violet-300 font-bold text-sm px-3 py-1">
                                                Q{questionIndex + 1}
                                            </Badge>
                                            <Input
                                                value={question.prompt}
                                                onChange={(e) =>
                            onUpdateQuestion(questionIndex, {
                                                        prompt: e.target.value,
                                                    })
                                                }
                                                placeholder="Enter question prompt..."
                                                className="flex-1 rounded-xl border-border/40 focus:border-violet-500 focus:ring-violet-500/20"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Select
                                                value={question.type}
                                                onValueChange={(value: "radio" | "check-box" | "true-false") =>
                            onUpdateQuestion(questionIndex, {type: value})
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
                                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                        onClick={() => onRemove(questionIndex)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            </motion.div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pl-12">
                                        <Label className="text-xs text-muted-foreground">
                                            {question.type === "true-false" ? "True/False Options" : "Answer Options"}
                                        </Label>
                                        {question.options.map((option, optIndex) => (
                                            <motion.div
                                                key={option.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: optIndex * 0.05 }}
                                                className={cn(
                                                    "flex flex-col gap-3 rounded-xl border border-border/40 bg-background/60 p-4 md:flex-row md:items-center transition-all duration-200",
                                                    option.isCorrect && "bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-400/40 shadow-sm shadow-emerald-500/10",
                                                    question.type === "true-false" && "bg-blue-50/50 dark:bg-blue-950/20",
                                                )}
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    <span className={cn(
                                                        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border-2",
                                                        option.isCorrect
                                                            ? "bg-gradient-to-br from-emerald-500 to-green-500 border-emerald-400 text-white shadow-md shadow-emerald-500/30"
                                                            : "bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-violet-400/30 text-violet-700 dark:text-violet-300"
                                                    )}>
                                                        {String.fromCharCode(65 + optIndex)}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={option.isCorrect}
                                                            onCheckedChange={(checked) =>
                                        onUpdateOption(questionIndex, option.id, {
                                                                    isCorrect: checked,
                                                                })
                                                            }
                                                        />
                                                        <span className="text-xs text-muted-foreground min-w-[60px]">
                                                            {option.isCorrect ? (
                                                                <span className="text-green-600 font-semibold">Correct</span>
                                                            ) : (
                                                                <span>Incorrect</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <Input
                                                        value={option.text}
                                                        onChange={(e) =>
                                    onUpdateOption(questionIndex, option.id, {
                                                                text: e.target.value,
                                                            })
                                                        }
                                                        placeholder={question.type === "true-false" ? "True or False" : `Option ${optIndex + 1}...`}
                                                        className="flex-1 border-0 bg-transparent focus-visible:ring-2 focus-visible:ring-violet-500/20 rounded-lg"
                                                        disabled={question.type === "true-false"}
                                                    />
                                                </div>
                                                {question.type !== "true-false" && question.options.length > 2 && (
                                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive shrink-0"
                                onClick={() => onRemoveOption(questionIndex, option.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        ))}
                                        {question.type !== "true-false" && (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                <Button variant="outline" size="sm" onClick={() => onAddOption(questionIndex)} className="w-full md:w-auto rounded-xl border-dashed border-violet-400/40 hover:border-violet-500 hover:bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Option
                                            </Button>
                                        </motion.div>
                                        )}
                                        {question.type === "true-false" && (
                                            <div className="rounded-lg border border-blue-200/50 bg-blue-50/50 dark:bg-blue-950/20 p-3 text-xs">
                                                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">True/False Question</p>
                        <p className="text-blue-700 dark:text-blue-300">
                            Toggle the switch next to \"True\" or \"False\" to mark the correct answer. The text fields are locked for True/False questions.
                        </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-border/40 pt-4">
                                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                        onClick={() => onToggleExpanded(question.clientId)}
                                                className="w-full justify-between text-left rounded-xl hover:bg-violet-500/10 transition-all"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Settings className="h-4 w-4" />
                                                <span className="font-semibold">Question Settings & Conditions</span>
                                            </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                        </motion.div>

                                        <AnimatePresence>
                    {isExpanded && (
                                                <motion.div
                                                    initial={{opacity: 0, height: 0}}
                                                    animate={{opacity: 1, height: "auto"}}
                                                    exit={{opacity: 0, height: 0}}
                                                    transition={{duration: 0.2}}
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
                                                            value={question.duration ?? 60}
                                                            onValueChange={(value) =>
                                            onUpdateQuestion(questionIndex, {
                                                                    duration: value ?? 60,
                                                                })
                                                            }
                                                        />
                                    <p className="text-xs text-muted-foreground">Time limit for this question. Auto-advances when time expires.</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Required</Label>
                                                        <div className="flex items-center justify-between rounded-xl border border-border/40 p-4">
                                                            <div>
                                                                <p className="text-sm font-medium">Question is required</p>
                                            <p className="text-xs text-muted-foreground">Learner must answer before proceeding</p>
                                                            </div>
                                                            <Switch
                                                                checked={question.is_require ?? true}
                                                                onCheckedChange={(checked) =>
                                                onUpdateQuestion(questionIndex, {
                                                                        is_require: checked,
                                                                    })
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
                                                            value={question.total_score ?? 10}
                                                            onValueChange={(value) =>
                                            onUpdateQuestion(questionIndex, {
                                                                    total_score: value ?? 10,
                                                                })
                                                            }
                                                        />
                                    <p className="text-xs text-muted-foreground">Points awarded for correct answer</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Max Score</Label>
                                                        <NumberInput
                                                            minValue={0}
                                                            maxValue={1000}
                                                            value={question.max_score ?? 10}
                                                            onValueChange={(value) =>
                                            onUpdateQuestion(questionIndex, {
                                                                    max_score: value ?? 10,
                                                                })
                                                            }
                                                        />
                                    <p className="text-xs text-muted-foreground">Maximum possible score for this question</p>
                                                    </div>
                                                </div>

                                                {question.type === "check-box" && (
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <div className="space-y-2">
                                        <Label>Minimum answers required</Label>
                                                            <NumberInput
                                                                minValue={1}
                                                                maxValue={question.options.length}
                                                                value={question.min_answer ?? 1}
                                                                onValueChange={(value) =>
                                                onUpdateQuestion(questionIndex, {
                                                                        min_answer: value ?? 1,
                                                                    })
                                                                }
                                                            />
                                        <p className="text-xs text-muted-foreground">Only applied to multi-select questions.</p>
                                                        </div>
                                                        <div className="space-y-2">
                                        <Label>Maximum answers allowed</Label>
                                                            <NumberInput
                                                                minValue={1}
                                                                maxValue={question.options.length}
                                            value={question.max_answer ?? 1}
                                                                onValueChange={(value) =>
                                                onUpdateQuestion(questionIndex, {
                                                    max_answer: value ?? 1,
                                                                    })
                                                                }
                                                            />
                                        <p className="text-xs text-muted-foreground">Set to 1 for single-answer questions.</p>
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
                </div>
        </motion.div>
    );
}

