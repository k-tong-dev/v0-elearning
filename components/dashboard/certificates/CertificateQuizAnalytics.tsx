"use client";

import React, {useCallback, useEffect, useState, useMemo} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Search,
    Users,
    CheckCircle2,
    XCircle,
    Clock,
    TrendingUp,
    Award,
    FileText,
    Loader2,
    ChevronRight,
    Filter,
    Download,
    BarChart3,
} from "lucide-react";
import {toast} from "sonner";
import {cn} from "@/utils/utils";
import {getQuizAttempts, QuizAttemptEntity, QuizAttemptStatus} from "@/integrations/strapi/quizAttempt";
import {getQuizAttemptAnswers, QuizAttemptAnswerEntity} from "@/integrations/strapi/quizAttemptAnswer";
import {getCertificateIssuances, CertificateIssuanceEntity} from "@/integrations/strapi/certificateIssuance";
import {CourseQuizEntity} from "@/integrations/strapi/quizStructure";
import {getCertificateQuizzes} from "@/integrations/strapi/quizStructure";

interface CertificateQuizAnalyticsProps {
    certificateId: number;
    certificateName: string;
    onBack: () => void;
}

type ViewMode = "overview" | "attempts" | "details";

export function CertificateQuizAnalytics({
    certificateId,
    certificateName,
    onBack,
}: CertificateQuizAnalyticsProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("overview");
    const [attempts, setAttempts] = useState<QuizAttemptEntity[]>([]);
    const [selectedAttempt, setSelectedAttempt] = useState<QuizAttemptEntity | null>(null);
    const [attemptAnswers, setAttemptAnswers] = useState<QuizAttemptAnswerEntity[]>([]);
    const [certificateQuizzes, setCertificateQuizzes] = useState<CourseQuizEntity[]>([]);
    const [issuances, setIssuances] = useState<CertificateIssuanceEntity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<QuizAttemptStatus | "all">("all");
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [attemptsData, quizzesData, issuancesData] = await Promise.all([
                getQuizAttempts({certificateProgramId: certificateId}),
                getCertificateQuizzes(certificateId),
                getCertificateIssuances({certificateProgramId: certificateId}),
            ]);

            setAttempts(attemptsData);
            setCertificateQuizzes(quizzesData);
            setIssuances(issuancesData);
        } catch (error) {
            console.error("Error loading analytics data:", error);
            toast.error("Failed to load analytics data.");
        } finally {
            setIsLoading(false);
        }
    }, [certificateId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const loadAttemptDetails = useCallback(async (attemptId: number) => {
        try {
            const answers = await getQuizAttemptAnswers({quizAttemptId: attemptId});
            setAttemptAnswers(answers);
        } catch (error) {
            console.error("Error loading attempt details:", error);
            toast.error("Failed to load attempt details.");
        }
    }, []);

    const handleViewAttempt = async (attempt: QuizAttemptEntity) => {
        setSelectedAttempt(attempt);
        await loadAttemptDetails(attempt.id);
        setDetailsDialogOpen(true);
    };

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
        const totalIssuances = issuances.filter((i) => i.issuance_status === "active").length;

        return {
            totalAttempts,
            completedAttempts,
            inProgressAttempts,
            submittedAttempts,
            averageScore: Math.round(averageScore * 100) / 100,
            passedAttempts,
            passRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
            totalIssuances,
        };
    }, [attempts, issuances]);

    const renderOverview = () => (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
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
                        <p className="text-sm font-medium text-muted-foreground">Certificates Issued</p>
                        <Award className="h-5 w-5 text-purple-500" />
                    </div>
                    <p className="text-3xl font-bold">{analytics.totalIssuances}</p>
                    <p className="text-xs text-muted-foreground mt-1">Active certificates</p>
                </div>

                <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                        <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                    <p className="text-3xl font-bold">{analytics.inProgressAttempts}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {analytics.submittedAttempts} submitted
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
                <Button
                    onClick={() => setViewMode("attempts")}
                    className="h-auto p-6 justify-start bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                    <div className="flex items-center gap-4 w-full">
                        <div className="rounded-xl bg-white/20 p-3">
                            <Users className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold">View All Attempts</p>
                            <p className="text-sm opacity-90">See detailed quiz attempts and answers</p>
                        </div>
                        <ChevronRight className="h-5 w-5 ml-auto" />
                    </div>
                </Button>

                <Button
                    onClick={() => setViewMode("attempts")}
                    variant="outline"
                    className="h-auto p-6 justify-start"
                >
                    <div className="flex items-center gap-4 w-full">
                        <div className="rounded-xl bg-primary/10 p-3">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold">Analytics Dashboard</p>
                            <p className="text-sm text-muted-foreground">View performance metrics</p>
                        </div>
                        <ChevronRight className="h-5 w-5 ml-auto" />
                    </div>
                </Button>
            </div>

            {/* Recent Attempts */}
            <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Recent Attempts</h3>
                    <Button variant="ghost" size="sm" onClick={() => setViewMode("attempts")}>
                        View all
                    </Button>
                </div>
                {filteredAttempts.slice(0, 5).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No attempts yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredAttempts.slice(0, 5).map((attempt) => (
                            <div
                                key={attempt.id}
                                className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-background/60 hover:bg-background/80 transition-colors cursor-pointer"
                                onClick={() => handleViewAttempt(attempt)}
                            >
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border border-border/40">
                                        {attempt.user.avatarUrl && (
                                            <AvatarImage src={attempt.user.avatarUrl} alt={attempt.user.name ?? `User #${attempt.user.id}`} />
                                        )}
                                        <AvatarFallback>
                                            {(attempt.user.name ?? `U${attempt.user.id}`).slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">
                                            {attempt.user.name ?? `User #${attempt.user.id}`}
                                        </p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            {attempt.attempt_status.replace("_", " ")}
                                            {attempt.user.email && (
                                                <>
                                                    <span className="text-muted-foreground/50">•</span>
                                                    <span className="truncate">{attempt.user.email}</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {attempt.score !== null && attempt.score !== undefined && (
                                        <Badge
                                            variant={attempt.score >= 70 ? "default" : "destructive"}
                                            className="text-sm"
                                        >
                                            {attempt.score}%
                                        </Badge>
                                    )}
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );

    const renderAttemptsList = () => (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            className="space-y-6"
        >
            {/* Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by user ID or score..."
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
        </motion.div>
    );

    const renderAttemptDetails = () => {
        if (!selectedAttempt) return null;

        const quizMap = new Map(certificateQuizzes.map((q) => [q.id, q]));
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
                            {certificateQuizzes.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No questions in this certificate</p>
                                </div>
                            ) : (
                                certificateQuizzes.map((quiz, index) => {
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
                                                        Type: {quiz.type} | Points: {quiz.max_score}
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={onBack} className="h-10 w-10 rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-xl uppercase tracking-widest font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Quiz Analytics
                        </h2>
                        <p className="text-muted-foreground">{certificateName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === "overview" ? "default" : "outline"}
                        onClick={() => setViewMode("overview")}
                    >
                        Overview
                    </Button>
                    <Button
                        variant={viewMode === "attempts" ? "default" : "outline"}
                        onClick={() => setViewMode("attempts")}
                    >
                        All Attempts
                    </Button>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {viewMode === "overview" && renderOverview()}
                    {viewMode === "attempts" && renderAttemptsList()}
                </AnimatePresence>
            )}

            {/* Details Dialog */}
            {renderAttemptDetails()}
        </div>
    );
}

