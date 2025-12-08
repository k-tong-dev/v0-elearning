"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Loader2,
    Target,
    Clock,
    CheckCircle,
    BookOpen,
    Award,
    Users,
    TrendingUp,
    FileText,
    Search,
    Filter,
    ChevronRight,
    CheckCircle2,
    XCircle,
    BarChart3,
} from "lucide-react";
import { cn } from "@/utils/utils";
import {
    getQuizSectionsByCourseContent,
    QuizSectionEntity,
} from "@/integrations/strapi/quizStructure";
import { CourseContentEntity } from "@/integrations/strapi/courseMaterial";
import {
    getQuizAttempts,
    QuizAttemptEntity,
    QuizAttemptStatus,
} from "@/integrations/strapi/quizAttempt";
import {
    getQuizAttemptAnswers,
    QuizAttemptAnswerEntity,
} from "@/integrations/strapi/quizAttemptAnswer";
import { toast } from "sonner";
import { InstructorEntity } from "@/integrations/strapi/instructor";
import { InstructorDisplay } from "./InstructorDisplay";

interface QuizViewerProps {
    content: CourseContentEntity;
    collaboratingInstructors?: InstructorEntity[];
    showAnalysis?: boolean;
    onShowAnalysis?: () => void;
}

export function QuizViewer({ content, collaboratingInstructors = [], showAnalysis = false, onShowAnalysis }: QuizViewerProps) {
    const [quizSections, setQuizSections] = useState<QuizSectionEntity[]>([]);
    const [loadingQuiz, setLoadingQuiz] = useState(true);
    const [attempts, setAttempts] = useState<QuizAttemptEntity[]>([]);
    const [selectedAttempt, setSelectedAttempt] = useState<QuizAttemptEntity | null>(null);
    const [attemptAnswers, setAttemptAnswers] = useState<QuizAttemptAnswerEntity[]>([]);
    const [isLoadingAttempts, setIsLoadingAttempts] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<QuizAttemptStatus | "all">("all");
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

    const loadQuizData = useCallback(async () => {
        if (!content.id) return;
        setLoadingQuiz(true);
        try {
            const sections = await getQuizSectionsByCourseContent(content.id);
            setQuizSections(sections);
        } catch (error) {
            console.error("Error loading quiz sections:", error);
            toast.error("Failed to load quiz data");
        } finally {
            setLoadingQuiz(false);
        }
    }, [content.id]);

    const loadAttempts = useCallback(async () => {
        if (!content.id) return;
        setIsLoadingAttempts(true);
        try {
            const attemptsData = await getQuizAttempts({ courseContentId: content.id });
            setAttempts(attemptsData);
        } catch (error) {
            console.error("Error loading quiz attempts:", error);
            toast.error("Failed to load quiz attempts");
        } finally {
            setIsLoadingAttempts(false);
        }
    }, [content.id]);

    useEffect(() => {
        loadQuizData();
        if (showAnalysis) {
            loadAttempts();
        }
    }, [loadQuizData, showAnalysis, loadAttempts]);

    const loadAttemptDetails = useCallback(async (attemptId: number) => {
        try {
            const answers = await getQuizAttemptAnswers({ quizAttemptId: attemptId });
            setAttemptAnswers(answers);
        } catch (error) {
            console.error("Error loading attempt details:", error);
            toast.error("Failed to load attempt details");
        }
    }, []);

    const handleViewAttempt = async (attempt: QuizAttemptEntity) => {
        setSelectedAttempt(attempt);
        await loadAttemptDetails(attempt.id);
        setDetailsDialogOpen(true);
    };

    const totalQuestions = quizSections.reduce(
        (sum, section) => sum + section.quizzes.length,
        0
    );
    const totalPoints = quizSections.reduce(
        (sum, section) =>
            sum +
            section.quizzes.reduce((s, q) => s + (q.total_score || 0), 0),
        0
    );

    const filteredAttempts = useMemo(() => {
        let filtered = attempts;

        if (statusFilter !== "all") {
            filtered = filtered.filter((a) => a.attempt_status === statusFilter);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((a) => {
                return (
                    a.user.id.toString().includes(query) ||
                    (a.user.name && a.user.name.toLowerCase().includes(query)) ||
                    (a.user.email && a.user.email.toLowerCase().includes(query)) ||
                    a.score?.toString().includes(query) ||
                    a.attempt_status.toLowerCase().includes(query)
                );
            });
        }

        return filtered;
    }, [attempts, statusFilter, searchQuery]);

    const analytics = useMemo(() => {
        const totalAttempts = attempts.length;
        const completedAttempts = attempts.filter((a) => a.attempt_status === "graded").length;
        const inProgressAttempts = attempts.filter((a) => a.attempt_status === "in_progress").length;
        const submittedAttempts = attempts.filter((a) => a.attempt_status === "submitted").length;
        const averageScore =
            attempts
                .filter((a) => a.score !== null && a.score !== undefined)
                .reduce((sum, a) => sum + (a.score || 0), 0) /
            (attempts.filter((a) => a.score !== null && a.score !== undefined).length || 1);
        const passedAttempts = attempts.filter(
            (a) => a.score !== null && a.score !== undefined && a.score >= 70,
        ).length;

        return {
            totalAttempts,
            completedAttempts,
            inProgressAttempts,
            submittedAttempts,
            averageScore: Math.round(averageScore * 100) / 100,
            passedAttempts,
            passRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
        };
    }, [attempts]);

    if (loadingQuiz) {
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
                        <p className="text-sm font-medium text-foreground">Loading quiz...</p>
                        <p className="text-xs text-muted-foreground mt-1">Please wait</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (quizSections.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-dashed border-border/40 bg-gradient-to-br from-muted/30 via-muted/20 to-muted/30 p-12 text-center"
            >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-2 border-violet-400/30 mb-4">
                    <Target className="w-10 h-10 text-violet-500/60" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No quiz questions added yet</p>
                <p className="text-xs text-muted-foreground">
                    Add questions to this quiz to get started
                </p>
            </motion.div>
        );
    }

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Quiz Info Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border/40 bg-card/50 p-6 space-y-4"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold">{content.name}</h3>
                        {content.instructor && (
                            <div className="mt-2">
                                <InstructorDisplay
                                    instructor={content.instructor}
                                    collaboratingInstructors={collaboratingInstructors}
                                    size="sm"
                                />
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        {content.estimated_minutes > 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>{content.estimated_minutes} minutes</span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Ultra Stats Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-4 md:grid-cols-3"
            >
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-400/30 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                Sections
                            </p>
                        </div>
                        <p className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                            {quizSections.length}
                        </p>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 flex items-center justify-center">
                                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                Questions
                            </p>
                        </div>
                        <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {totalQuestions}
                        </p>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-pink-500/10 via-pink-500/5 to-transparent backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-400/30 flex items-center justify-center">
                                <Award className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                            </div>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                Total Points
                            </p>
                        </div>
                        <p className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                            {totalPoints}
                        </p>
                    </div>
                </motion.div>
            </motion.div>

            {/* Quiz Sections - Ultra Design */}
            <div className="space-y-5">
                <AnimatePresence>
                    {quizSections.map((section, sectionIdx) => (
                        <motion.div
                            key={section.documentId || section.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: sectionIdx * 0.1 }}
                            className="group relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-muted/20 backdrop-blur-sm p-6 space-y-5 shadow-lg hover:shadow-xl hover:border-violet-400/40 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-2 border-violet-400/30 flex items-center justify-center">
                                            <span className="text-lg font-bold text-violet-700 dark:text-violet-300">
                                                {sectionIdx + 1}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xl bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                                {section.name}
                                            </h4>
                                            {section.description && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {section.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-400/30 text-violet-700 dark:text-violet-300 font-semibold px-3 py-1"
                                    >
                                        {section.quizzes.length} question
                                        {section.quizzes.length !== 1 ? "s" : ""}
                                    </Badge>
                                </div>

                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {section.quizzes.map((quiz, quizIdx) => (
                                            <motion.div
                                                key={quiz.documentId || quiz.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ delay: quizIdx * 0.05 }}
                                                className="group/quiz relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-background via-background to-muted/10 backdrop-blur-sm p-5 space-y-4 shadow-md hover:shadow-lg hover:border-violet-400/40 transition-all duration-300"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 opacity-0 group-hover/quiz:opacity-100 transition-opacity duration-300" />
                                                <div className="relative z-10">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-400/30 text-violet-700 dark:text-violet-300 font-bold text-sm px-3 py-1"
                                                            >
                                                                Q{quizIdx + 1}
                                                            </Badge>
                                                            <Badge
                                                                variant="secondary"
                                                                className="capitalize bg-muted/60 border-border/40 font-medium"
                                                            >
                                                                {quiz.type === "radio"
                                                                    ? "Single Choice"
                                                                    : quiz.type === "check-box"
                                                                      ? "Multiple Choice"
                                                                      : "True/False"}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {quiz.duration > 0 && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs bg-muted/40 border-border/40"
                                                                >
                                                                    <Clock className="w-3 h-3 mr-1" />
                                                                    {quiz.duration}s
                                                                </Badge>
                                                            )}
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-gradient-to-r from-pink-500/20 to-rose-500/20 border-pink-400/30 text-pink-700 dark:text-pink-300 font-semibold"
                                                            >
                                                                {quiz.total_score || 0} pt
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <p className="text-base font-semibold text-foreground mb-4 leading-relaxed">
                                                        {quiz.question_text || quiz.title || "—"}
                                                    </p>

                                                    <div className="space-y-2">
                                                        {quiz.lines.map((line, lineIdx) => (
                                                            <motion.div
                                                                key={
                                                                    line.documentId ||
                                                                    line.id ||
                                                                    lineIdx
                                                                }
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: lineIdx * 0.03 }}
                                                                className={cn(
                                                                    "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                                                                    line.is_correct
                                                                        ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-emerald-400/40 shadow-sm shadow-emerald-500/10"
                                                                        : "bg-muted/40 border-border/40 hover:border-violet-400/40 hover:bg-muted/60"
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border-2",
                                                                    line.is_correct
                                                                        ? "bg-gradient-to-br from-emerald-500 to-green-500 border-emerald-400 text-white shadow-md shadow-emerald-500/30"
                                                                        : "bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-violet-400/30 text-violet-700 dark:text-violet-300"
                                                                )}>
                                                                    {String.fromCharCode(65 + lineIdx)}
                                                                </div>
                                                                {line.is_correct && (
                                                                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                                                )}
                                                                <span className={cn(
                                                                    "text-sm flex-1",
                                                                    line.is_correct
                                                                        ? "font-semibold text-emerald-700 dark:text-emerald-300"
                                                                        : "text-foreground"
                                                                )}>
                                                                    {line.answer || "—"}
                                                                </span>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );

    const renderAnalysis = () => {
        const allQuizzes = quizSections.flatMap(section => section.quizzes);
        
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-muted-foreground">Total Attempts</p>
                            <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <p className="text-3xl font-bold">{analytics.totalAttempts}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {analytics.completedAttempts} completed
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-green-500/10 to-green-600/5 p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                            <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold">{analytics.averageScore}%</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {analytics.passedAttempts} passed ({analytics.passRate}%)
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                            <Clock className="h-5 w-5 text-purple-500" />
                        </div>
                        <p className="text-3xl font-bold">{analytics.inProgressAttempts}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {analytics.submittedAttempts} submitted
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
                            <Award className="h-5 w-5 text-amber-500" />
                        </div>
                        <p className="text-3xl font-bold">{analytics.passRate}%</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {analytics.passedAttempts} of {analytics.totalAttempts} passed
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by user name, email, or score..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as QuizAttemptStatus | "all")}
                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="in_progress">In Progress</option>
                            <option value="submitted">Submitted</option>
                            <option value="graded">Graded</option>
                        </select>
                    </div>
                </div>

                {/* Attempts Table */}
                {isLoadingAttempts ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b border-border/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Score
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Duration
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Completed
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredAttempts.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                                <p>No attempts found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAttempts.map((attempt) => (
                                            <tr
                                                key={attempt.id}
                                                className="hover:bg-muted/30 transition-colors cursor-pointer"
                                                onClick={() => handleViewAttempt(attempt)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10 border border-border/40">
                                                            {attempt.user.avatarUrl && (
                                                                <AvatarImage src={attempt.user.avatarUrl} alt={attempt.user.name ?? `User #${attempt.user.id}`} />
                                                            )}
                                                            <AvatarFallback>
                                                                {(attempt.user.name ?? `U${attempt.user.id}`).slice(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">{attempt.user.name ?? `User #${attempt.user.id}`}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {attempt.user.email ?? `Attempt #${attempt.id}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge
                                                        variant={
                                                            attempt.attempt_status === "graded"
                                                                ? "default"
                                                                : attempt.attempt_status === "submitted"
                                                                    ? "secondary"
                                                                    : "outline"
                                                        }
                                                        className={cn(
                                                            attempt.attempt_status === "graded" &&
                                                                "bg-green-500/20 text-green-600 border-green-500/30",
                                                            attempt.attempt_status === "submitted" &&
                                                                "bg-blue-500/20 text-blue-600 border-blue-500/30",
                                                        )}
                                                    >
                                                        {attempt.attempt_status.replace("_", " ")}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {attempt.score !== null && attempt.score !== undefined ? (
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={cn(
                                                                    "font-semibold",
                                                                    attempt.score >= 70
                                                                        ? "text-green-600"
                                                                        : "text-red-600",
                                                                )}
                                                            >
                                                                {attempt.score}%
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                / {attempt.max_score}%
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {attempt.duration_seconds ? (
                                                        <span className="text-sm">
                                                            {Math.floor(attempt.duration_seconds / 60)}m{" "}
                                                            {attempt.duration_seconds % 60}s
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {attempt.completed_at ? (
                                                        <span className="text-sm">
                                                            {new Date(attempt.completed_at).toLocaleDateString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewAttempt(attempt);
                                                        }}
                                                    >
                                                        View Details
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </motion.div>
        );
    };

    const renderAttemptDetails = () => {
        if (!selectedAttempt) return null;

        const allQuizzes = quizSections.flatMap(section => section.quizzes);
        const quizMap = new Map(allQuizzes.map((q) => [q.id, q]));
        const answersByQuiz = new Map<number, QuizAttemptAnswerEntity[]>();
        attemptAnswers.forEach((answer) => {
            const existing = answersByQuiz.get(answer.course_quiz.id) || [];
            existing.push(answer);
            answersByQuiz.set(answer.course_quiz.id, existing);
        });

        const userDisplayName = selectedAttempt.user.name ?? `User #${selectedAttempt.user.id}`;
        const userEmail = selectedAttempt.user.email;
        const userAvatar = selectedAttempt.user.avatarUrl;

        return (
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide">
                    <DialogHeader className="flex flex-col gap-3">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-14 w-14 border border-border/40">
                                {userAvatar && <AvatarImage src={userAvatar} alt={userDisplayName} />}
                                <AvatarFallback>
                                    {userDisplayName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <DialogTitle className="text-xl">{userDisplayName}</DialogTitle>
                                <DialogDescription className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    <span>Attempt #{selectedAttempt.id}</span>
                                    <span className="text-muted-foreground/50">•</span>
                                    <span>{userEmail ?? `User ID ${selectedAttempt.user.id}`}</span>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Attempt Summary */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-xl border border-border/40 p-4 bg-muted/20">
                                <p className="text-xs text-muted-foreground mb-1">Status</p>
                                <Badge
                                    variant={
                                        selectedAttempt.attempt_status === "graded"
                                            ? "default"
                                            : "outline"
                                    }
                                >
                                    {selectedAttempt.attempt_status.replace("_", " ")}
                                </Badge>
                            </div>
                            <div className="rounded-xl border border-border/40 p-4 bg-muted/20">
                                <p className="text-xs text-muted-foreground mb-1">Score</p>
                                <p
                                    className={cn(
                                        "text-2xl font-bold",
                                        selectedAttempt.score !== null &&
                                            selectedAttempt.score !== undefined &&
                                            selectedAttempt.score >= 70
                                            ? "text-green-600"
                                            : "text-red-600",
                                    )}
                                >
                                    {selectedAttempt.score !== null && selectedAttempt.score !== undefined
                                        ? `${selectedAttempt.score}%`
                                        : "—"}
                                </p>
                            </div>
                            <div className="rounded-xl border border-border/40 p-4 bg-muted/20">
                                <p className="text-xs text-muted-foreground mb-1">Duration</p>
                                <p className="text-2xl font-bold">
                                    {selectedAttempt.duration_seconds
                                        ? `${Math.floor(selectedAttempt.duration_seconds / 60)}m ${selectedAttempt.duration_seconds % 60}s`
                                        : "—"}
                                </p>
                            </div>
                        </div>

                        {/* Questions & Answers */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Questions & Answers</h3>
                            {allQuizzes.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No questions in this quiz</p>
                                </div>
                            ) : (
                                allQuizzes.map((quiz, index) => {
                                    const answers = answersByQuiz.get(quiz.id) || [];
                                    const hasAnswer = answers.length > 0;
                                    const isCorrect = answers.every((a) => a.is_correct);

                                    return (
                                        <div
                                            key={quiz.id}
                                            className="rounded-xl border border-border/40 p-6 bg-card/50 space-y-4"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Badge variant="outline">Q{index + 1}</Badge>
                                                        <Badge
                                                            variant={isCorrect ? "default" : "destructive"}
                                                            className={cn(
                                                                isCorrect
                                                                    ? "bg-green-500/20 text-green-600 border-green-500/30"
                                                                    : "bg-red-500/20 text-red-600 border-red-500/30",
                                                            )}
                                                        >
                                                            {isCorrect ? (
                                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            ) : (
                                                                <XCircle className="h-3 w-3 mr-1" />
                                                            )}
                                                            {isCorrect ? "Correct" : "Incorrect"}
                                                        </Badge>
                                                    </div>
                                                    <p className="font-medium text-lg mb-2">
                                                        {quiz.question_text || quiz.title}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Type: {quiz.type} | Points: {quiz.total_score || 0}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* User's Answer */}
                                            {hasAnswer ? (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-semibold text-muted-foreground">
                                                        User's Answer:
                                                    </p>
                                                    {answers.map((answer, ansIdx) => {
                                                        const selectedLine = quiz.lines?.find(
                                                            (l) => l.id === answer.selected_line?.id,
                                                        );
                                                        return (
                                                            <div
                                                                key={ansIdx}
                                                                className={cn(
                                                                    "rounded-lg border p-3",
                                                                    answer.is_correct
                                                                        ? "border-green-500/30 bg-green-500/10"
                                                                        : "border-red-500/30 bg-red-500/10",
                                                                )}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        {answer.is_correct ? (
                                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                        ) : (
                                                                            <XCircle className="h-4 w-4 text-red-600" />
                                                                        )}
                                                                        <span>
                                                                            {selectedLine?.answer ||
                                                                                "Selected option"}
                                                                        </span>
                                                                    </div>
                                                                    {answer.points_awarded !== null &&
                                                                        answer.points_awarded !== undefined && (
                                                                            <Badge variant="outline">
                                                                                {answer.points_awarded} pts
                                                                            </Badge>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border border-dashed border-border/40 p-3 text-center text-muted-foreground">
                                                    No answer provided
                                                </div>
                                            )}

                                            {/* Correct Answer(s) */}
                                            <div className="space-y-2">
                                                <p className="text-sm font-semibold text-muted-foreground">
                                                    Correct Answer(s):
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {quiz.lines
                                                        ?.filter((line) => line.is_correct)
                                                        .map((line) => (
                                                            <Badge
                                                                key={line.id}
                                                                variant="outline"
                                                                className="bg-green-500/10 text-green-600 border-green-500/30"
                                                            >
                                                                {line.answer}
                                                            </Badge>
                                                        ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    };

    return (
        <div className="space-y-6 w-full">
            {showAnalysis ? renderAnalysis() : renderOverview()}
            {renderAttemptDetails()}
        </div>
    );
}

