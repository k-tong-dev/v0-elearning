"use client";

import React, {useCallback, useEffect, useMemo, useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {Badge} from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import {NumberInput} from "@/components/ui/number-input";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {
    Plus,
    Eye,
    Edit,
    Loader2,
    Trash2,
    ArrowLeft,
    Search,
    Sparkles,
    ShieldCheck,
    CalendarDays,
    Building2,
} from "lucide-react";
import {toast} from "sonner";
import {
    getCertificatePrograms,
    createCertificateProgram,
    updateCertificateProgram,
} from "@/integrations/strapi/certificateProgram";
import {
    CertificateFormState,
    CertificateTemplate,
    createEmptyCertificateForm,
    mapCertificateRecord,
} from "@/components/dashboard/certificates/certificate-utils";
import {cn} from "@/utils/utils";
import {useAuth} from "@/hooks/use-auth";
import {CompanyEntity, getCompaniesForUser} from "@/integrations/strapi/company";
import {ThreeDCard} from "@/components/ui/three-d-card";
import {CertificateQuizAnalytics} from "@/components/dashboard/certificates/CertificateQuizAnalytics";
import {CertificateQuestionsManager} from "@/components/dashboard/certificates/CertificateQuestionsManager";
import {BarChart3, FileText} from "lucide-react";

type WorkspaceState = {
    mode: "create" | "edit";
    form: CertificateFormState;
};

const generateTempId = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const renderCertificatePreviewCard = (form: CertificateFormState) => {
    const themeBackground =
        form.theme === "Minimal"
            ? "from-slate-900 to-slate-800"
            : form.theme === "Classic"
                ? "from-amber-100 to-rose-100 text-slate-900"
                : form.theme === "Premium"
                    ? "from-amber-500 via-rose-500 to-purple-600"
                : "from-slate-900 via-indigo-900 to-slate-900";
    const isDark = form.theme !== "Classic";
    return (
        <div
            className={cn(
                "rounded-3xl border border-white/10 p-6 shadow-2xl bg-gradient-to-br",
                themeBackground,
                isDark ? "text-white" : "text-slate-900",
            )}
        >
            <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] opacity-70">
                    {form.subtitle || "Certificate"}
                </p>
                <h2 className="text-3xl font-bold">{form.name || "Untitled certificate"}</h2>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm space-y-3">
                    <p>{form.customMessage || "Your personalized message will appear here."}</p>
                    <p className="text-xs opacity-70">
                        Criteria: {form.issueCriteria || "Describe how learners earn this certificate."}
                    </p>
                </div>
                <div className="flex items-center justify-between pt-4 text-sm opacity-80">
                    <div>
                        <p className="font-semibold">{form.issuer || "Issuer"}</p>
                        <p>{form.signatureName || "Signature"}</p>
                    </div>
                    {form.includeSeal && (
                        <div
                            className="h-14 w-14 rounded-full border-2 flex items-center justify-center text-xs font-semibold"
                            style={{color: form.highlightColor, borderColor: isDark ? "white" : form.highlightColor}}
                        >
                            Seal
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export function DashboardCertificates() {
    const [certificateLibrary, setCertificateLibrary] = useState<CertificateTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
    const [preview, setPreview] = useState<CertificateTemplate | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [companies, setCompanies] = useState<CompanyEntity[]>([]);
    const [analyticsView, setAnalyticsView] = useState<{certificateId: number; certificateName: string} | null>(null);
    const [questionsView, setQuestionsView] = useState<{certificateId: number; certificateName: string} | null>(null);
    const { user, isLoading: authLoading } = useAuth();

    const loadCertificates = useCallback(async () => {
        const ownerId = user?.id ? Number(user.id) : null;
        if (!ownerId) {
            setCertificateLibrary([]);
            return;
        }

        setIsLoading(true);
        try {
            const records = await getCertificatePrograms({ ownerId });
            setCertificateLibrary(records.map(mapCertificateRecord));
        } catch (error) {
            console.error("Error loading certificates:", error);
            toast.error("Failed to load certificates.");
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    const loadCompanies = useCallback(async () => {
        const ownerId = user?.id ? Number(user.id) : null;
        if (!ownerId) {
            setCompanies([]);
            return;
        }
        try {
            const data = await getCompaniesForUser(ownerId);
            setCompanies(data);
        } catch (error) {
            console.error("Failed to load companies:", error);
        }
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;
        loadCertificates();
        loadCompanies();
    }, [user?.id, loadCertificates, loadCompanies]);

    useEffect(() => {
        if (!user?.id) {
            setCertificateLibrary([]);
            setCompanies([]);
        }
    }, [user?.id]);

    const openWorkspace = (template?: CertificateTemplate | null) => {
        if (template) {
            setWorkspace({
                mode: "edit",
                form: {
                    ...template,
                    questions: template.questions.map((question) => ({
                        ...question,
                        options: question.options.map((option) => ({...option})),
                    })),
                },
            });
        } else {
            if (!user?.id) {
                toast.error("You need to sign in before managing certificates.");
                return;
            }
            const initialForm = {
                ...createEmptyCertificateForm(),
                ownerId: Number(user.id),
            };
            setWorkspace({
                mode: "create",
                form: initialForm,
            });
        }
    };

    const updateWorkspaceForm = (updater: (prev: CertificateFormState) => CertificateFormState) => {
        setWorkspace((prev) => (prev ? {...prev, form: updater(prev.form)} : prev));
    };

    const handleFormFieldChange = <K extends keyof CertificateFormState>(field: K, value: CertificateFormState[K]) => {
        updateWorkspaceForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSaveCertificate = async () => {
        if (!workspace) return;
        if (!workspace.form.name.trim()) {
            toast.error("Certificate name is required.");
            return;
        }
        const ownerId = workspace.form.ownerId ?? (user?.id ? Number(user.id) : null);
        if (workspace.mode === "create" && !ownerId) {
            toast.error("Unable to determine certificate owner.");
            return;
        }
        setIsSaving(true);
        try {
            let savedCertificate;
            if (workspace.mode === "create") {
                savedCertificate = await createCertificateProgram({
                    name: workspace.form.name.trim(),
                    owner: ownerId!,
                    auto_issue: workspace.form.auto_issue,
                    active: workspace.form.active,
                    min_score_to_pass: workspace.form.min_score_to_pass,
                    valid_until: workspace.form.valid_until,
                    company: workspace.form.company ?? undefined,
                    message: workspace.form.customMessage,
                    issue_criterial: workspace.form.issueCriteria,
                    theme: workspace.form.theme,
                    signature_name: workspace.form.signatureName,
                    issuer: workspace.form.issuer,
                    include_seal: workspace.form.includeSeal,
                    color: workspace.form.highlightColor,
                });
            } else if (workspace.form.documentId) {
                savedCertificate = await updateCertificateProgram(workspace.form.documentId, {
                    name: workspace.form.name.trim(),
                    auto_issue: workspace.form.auto_issue,
                    active: workspace.form.active,
                    min_score_to_pass: workspace.form.min_score_to_pass,
                    valid_until: workspace.form.valid_until,
                    company: workspace.form.company ?? null,
                    message: workspace.form.customMessage,
                    issue_criterial: workspace.form.issueCriteria,
                    theme: workspace.form.theme,
                    signature_name: workspace.form.signatureName,
                    issuer: workspace.form.issuer,
                    include_seal: workspace.form.includeSeal,
                    color: workspace.form.highlightColor,
                });
            }

            if (!savedCertificate) {
                throw new Error("Unable to persist certificate");
            }

            await loadCertificates();
            setWorkspace(null);
            toast.success(workspace.mode === "create" ? "Certificate created." : "Certificate updated.");
        } catch (error) {
            console.error("Certificate save error:", error);
            toast.error("Failed to save certificate.");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredCertificates = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return certificateLibrary;
        return certificateLibrary.filter((certificate) =>
            certificate.name.toLowerCase().includes(query),
        );
    }, [certificateLibrary, search]);

    const renderLibraryView = () => (
        <motion.div
            key="library"
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -20}}
            transition={{duration: 0.3}}
            className="space-y-8"
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                    <h2 className="text-xl uppercase tracking-widest font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Certificate library
                    </h2>
                    <p className="text-muted-foreground text-md">
                        Build reusable certificates with customizable layouts and verification questions.
                    </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search certificates..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                            className="h-11 w-full pl-10 sm:w-64"
                    />
                    </div>
                    <Button
                        onClick={() => openWorkspace(null)}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:from-blue-600 hover:to-purple-600 h-11"
                        disabled={!user?.id || authLoading}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Certificate
                    </Button>
                </div>
            </div>

            {isLoading || authLoading ? (
                <div className="rounded-3xl border border-dashed border-border/40 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm p-20 text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground text-lg">Loading certificates...</p>
                        </div>
                    ) : filteredCertificates.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border/40 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm p-20 text-center space-y-6">
                    <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        <Sparkles className="h-12 w-12 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-semibold">No certificates yet</h3>
                        <p className="text-muted-foreground">Click &quot;New Certificate&quot; to get started.</p>
                    </div>
                    <Button
                        onClick={() => openWorkspace(null)}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:from-blue-600 hover:to-purple-600"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Certificate
                    </Button>
                        </div>
                    ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCertificates.map((certificate) => {
                        const resolvedCompany = certificate.company
                            ? companies.find((company) => company.id === certificate.company)
                            : null;
                        return (
                            <ThreeDCard key={certificate.id} className="h-full" rotationMultiplier={18}>
                                <motion.div
                                    initial={{opacity: 0, scale: 0.95}}
                                    animate={{opacity: 1, scale: 1}}
                                    className={cn(
                                        "group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/60 via-slate-900/40 to-slate-950/60 p-6 text-white shadow-lg shadow-primary/10 backdrop-blur transition-opacity",
                                        certificate.active ? "" : "opacity-70 grayscale"
                                    )}
                                >
                                    <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-pink-500/40 blur-3xl" />
                                    </div>
                                    <div className="relative flex h-full flex-col gap-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-300">
                                                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                                                <span>{certificate.auto_issue ? "Auto issue" : "Manual issue"}</span>
                                            </div>
                                            <h3 className="text-lg font-semibold truncate">
                                                {certificate.name}
                                            </h3>
                                            <p className="text-sm text-slate-300">
                                                Min score {Math.round(certificate.min_score_to_pass * 100)}%
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                                                {certificate.theme || "Aurora"}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "border px-2 text-xs",
                                                    certificate.active
                                                        ? "border-emerald-400/50 text-emerald-200"
                                                        : "border-amber-400/50 text-amber-200"
                                                )}
                                            >
                                                {certificate.active ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </div>

                                    {resolvedCompany && (
                                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                                            {resolvedCompany.logoUrl ? (
                                                <img
                                                    src={resolvedCompany.logoUrl}
                                                    alt={resolvedCompany.name}
                                                    className="h-10 w-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white/70">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                            )}
                                    <div>
                                                <p className="text-xs uppercase text-white/70">Company</p>
                                                <p className="text-sm font-medium text-white">{resolvedCompany.name}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <div className="flex items-center gap-2 text-xs uppercase text-white/70">
                                                <Sparkles className="h-4 w-4" />
                                                Questions
                                            </div>
                                            <p className="mt-2 text-2xl font-semibold">
                                                {certificate.questions.length}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <div className="flex items-center gap-2 text-xs uppercase text-white/70">
                                                <CalendarDays className="h-4 w-4" />
                                                Valid until
                                            </div>
                                            <p className="mt-2 text-base font-semibold">
                                                {certificate.valid_until
                                                    ? new Date(certificate.valid_until).toLocaleDateString()
                                                    : "No expiry"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-2 mt-auto">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPreview(certificate)}
                                            className="border-white/20 text-white hover:bg-white/10"
                                        >
                                            <Eye className="mr-1 h-4 w-4" />
                                            Preview
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openWorkspace(certificate)}
                                            className="border-white/20 text-white hover:bg-white/10"
                                        >
                                            <Edit className="mr-1 h-4 w-4" />
                                            Edit
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setQuestionsView({certificateId: certificate.id, certificateName: certificate.name})}
                                            className="border-white/20 text-white hover:bg-white/10 bg-gradient-to-r from-emerald-500/20 to-teal-500/20"
                                        >
                                            <FileText className="mr-1 h-4 w-4" />
                                            Questions
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setAnalyticsView({certificateId: certificate.id, certificateName: certificate.name})}
                                            className="border-white/20 text-white hover:bg-white/10 bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                                        >
                                            <BarChart3 className="mr-1 h-4 w-4" />
                                            Analytics
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {certificate.course_content ? (
                                            <Button variant="outline" size="sm" disabled className="border-white/10 text-white/50">
                                                Linked
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-white/20 text-red-200 hover:bg-red-500/10"
                                                onClick={() => toast.info("Deleting certificates is coming soon.")}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <div></div>
                                    </div>
                                    </div>
                                </motion.div>
                            </ThreeDCard>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );

    const renderCertificateBuilder = () => {
        if (!workspace) {
            return null;
        }

        return (
            <motion.div
                key="builder"
                initial={{opacity: 0, x: 50}}
                animate={{opacity: 1, x: 0}}
                exit={{opacity: 0, x: -50}}
                transition={{duration: 0.3}}
                className="space-y-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => setWorkspace(null)}
                            className="h-10 w-10 rounded-full"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent uppercase tracking-widest">
                                {workspace.mode === "create" ? "Create Certificate" : "Edit Certificate"}
                            </h2>
                            <p className="text-muted-foreground">
                                {workspace.mode === "create"
                                    ? "Design a new certificate with custom questions and styling"
                                    : "Update certificate settings and questions"}
                                        </p>
                                    </div>
                                </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setWorkspace(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveCertificate}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:from-blue-600 hover:to-purple-600"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </span>
                            ) : workspace.mode === "create" ? (
                                "Save Certificate"
                            ) : (
                                "Update Certificate"
                            )}
                        </Button>
                            </div>
                </div>

                {/* Split Pane Layout */}
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    {/* Left: Form */}
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-6 space-y-6">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label>Name *</Label>
                                        <Input
                                            value={workspace.form.name}
                                            onChange={(e) => handleFormFieldChange("name", e.target.value)}
                                            placeholder="Certificate name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Subtitle</Label>
                                        <Input
                                            value={workspace.form.subtitle}
                                            onChange={(e) => handleFormFieldChange("subtitle", e.target.value)}
                                            placeholder="Subtitle"
                                        />
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Issuer</Label>
                                            <Input
                                                value={workspace.form.issuer}
                                                onChange={(e) => handleFormFieldChange("issuer", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Signature name</Label>
                                            <Input
                                                value={workspace.form.signatureName}
                                                onChange={(e) => handleFormFieldChange("signatureName", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Custom message</Label>
                                        <Textarea
                                            value={workspace.form.customMessage}
                                            onChange={(e) => handleFormFieldChange("customMessage", e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Issue criteria</Label>
                                        <Textarea
                                            value={workspace.form.issueCriteria}
                                            onChange={(e) => handleFormFieldChange("issueCriteria", e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Highlight color</Label>
                                            <div className="flex items-center gap-3 rounded-xl border border-border/40 p-3">
                                                <input
                                                    type="color"
                                                    value={workspace.form.highlightColor}
                                                    onChange={(e) => handleFormFieldChange("highlightColor", e.target.value)}
                                                    className="h-10 w-16 rounded border border-border/40 bg-transparent"
                                                />
                                                <span className="text-sm text-muted-foreground">
                                                    {workspace.form.highlightColor}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Theme</Label>
                                            <Select
                                                value={workspace.form.theme}
                                                onValueChange={(value) =>
                                                    handleFormFieldChange("theme", value as CertificateFormState["theme"])
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select theme" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Aurora">Aurora</SelectItem>
                                                    <SelectItem value="Minimal">Minimal</SelectItem>
                                                    <SelectItem value="Premium">Premium</SelectItem>
                                                    <SelectItem value="Classic">Classic</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Min score (%)</Label>
                                            <NumberInput
                                                minValue={0}
                                                maxValue={100}
                                                value={workspace.form.min_score_to_pass * 100}
                                                onValueChange={(value) =>
                                                    handleFormFieldChange("min_score_to_pass", (value || 0) / 100)
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Valid until</Label>
                                            <Input
                                                type="datetime-local"
                                                value={
                                                    workspace.form.valid_until
                                                        ? new Date(workspace.form.valid_until).toISOString().slice(0, 16)
                                                        : ""
                                                }
                                                onChange={(e) =>
                                                    handleFormFieldChange(
                                                        "valid_until",
                                                        e.target.value ? new Date(e.target.value).toISOString() : null,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Company</Label>
                                            <Select
                                                value={workspace.form.company?.toString() || "__no_company__"}
                                                onValueChange={(value) =>
                                                    handleFormFieldChange("company", value === "__no_company__" ? null : parseInt(value, 10))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select company" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__no_company__">Not linked</SelectItem>
                                                    {companies.map((company) => (
                                                        <SelectItem key={company.id} value={company.id.toString()}>
                                                                <div className="flex items-center gap-2">
                                                                    {company.logoUrl && (
                                                                        <img
                                                                            src={company.logoUrl}
                                                                            alt={company.name}
                                                                            className="h-6 w-6 rounded-full object-cover"
                                                                        />
                                                                    )}
                                                                    <span>{company.name}</span>
                                                                </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center justify-between rounded-xl border border-border/40 p-4">
                                            <div>
                                                <p className="font-semibold">Auto issue</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Automatically issue when learners meet the criteria.
                                                </p>
                                            </div>
                                            <Switch
                                                checked={workspace.form.auto_issue}
                                                onCheckedChange={(checked) => handleFormFieldChange("auto_issue", checked)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                    <div className="flex items-center justify-between rounded-xl border border-border/40 p-4">
                                        <div>
                                            <p className="font-semibold">Include seal</p>
                                            <p className="text-xs text-muted-foreground">
                                                Toggle decorative seal on the certificate design.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={workspace.form.includeSeal}
                                            onCheckedChange={(checked) => handleFormFieldChange("includeSeal", checked)}
                                        />
                                    </div>
                                        <div className="flex items-center justify-between rounded-xl border border-border/40 p-4">
                                        <div>
                                                <p className="font-semibold">Active</p>
                                            <p className="text-xs text-muted-foreground">
                                                    Disable to hide this certificate from selection everywhere.
                                            </p>
                                            </div>
                                            <Switch
                                                checked={workspace.form.active}
                                                onCheckedChange={(checked) => handleFormFieldChange("active", checked)}
                                            />
                                        </div>
                                    </div>
                                                        </div>
                                                        </div>
                                                    </div>

                    {/* Right: Live Preview */}
                    <div className="space-y-6">
                        <div className="sticky top-6">
                            <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        Live Preview
                                    </h4>
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                        Live
                                    </Badge>
                                </div>
                                <div className="transform transition-transform duration-300 hover:scale-105">
                                {renderCertificatePreviewCard(workspace.form)}
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    // Show questions view if active
    if (questionsView) {
        return (
            <CertificateQuestionsManager
                certificateId={questionsView.certificateId}
                certificateName={questionsView.certificateName}
                onBack={() => setQuestionsView(null)}
                onSave={() => {
                    setQuestionsView(null);
                    loadCertificates();
                }}
            />
        );
    }

    // Show analytics view if active
    if (analyticsView) {
        return (
            <CertificateQuizAnalytics
                certificateId={analyticsView.certificateId}
                certificateName={analyticsView.certificateName}
                onBack={() => setAnalyticsView(null)}
            />
        );
    }

    return (
        <div className="space-y-8">
            <AnimatePresence mode="wait">
                {workspace ? renderCertificateBuilder() : renderLibraryView()}
            </AnimatePresence>

            <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Certificate preview</DialogTitle>
                        <DialogDescription>How learners will see this certificate once issued.</DialogDescription>
                    </DialogHeader>
                    {preview && (
                        <div className="space-y-4">
                            {renderCertificatePreviewCard(preview)}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-xl border border-border/40 p-4 text-sm">
                                    <p className="text-xs uppercase text-muted-foreground">Auto issue</p>
                                    <p className="text-base font-semibold">
                                        {preview.auto_issue ? "Enabled" : "Disabled"}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/40 p-4 text-sm">
                                    <p className="text-xs uppercase text-muted-foreground">Questions</p>
                                    <p className="text-base font-semibold">
                                        {preview.questions.length}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/40 p-4 text-sm">
                                    <p className="text-xs uppercase text-muted-foreground">Status</p>
                                    <p className="text-base font-semibold">
                                        {preview.active ? "Active" : "Inactive"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

