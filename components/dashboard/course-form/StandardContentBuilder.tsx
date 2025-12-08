"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { NumberInput } from "@/components/ui/number-input";
import { Switch } from "@/components/ui/switch";
import {
    ArrowLeft,
    BookOpen,
    FileText,
    FileAudio,
    File as FileIcon,
    Link as LinkIcon,
    Image as ImageIcon,
    Video,
    Eye,
    Loader2,
    CheckCircle,
    X,
    AlertCircle,
    Clock,
    Download,
} from "lucide-react";
import ReactPlayer from "react-player";
import { cn } from "@/utils/utils";
import { FileUpload } from "@/components/ui/file-upload";
import { InstructorSelector } from "./InstructorSelector";
import { ArticleEditor } from "./ArticleEditor";
import { CourseMaterialEntity, CourseContentEntity, CopyrightCheckStatus } from "@/integrations/strapi/courseMaterial";
import { Instructor } from "@/integrations/strapi/instructor";
import { checkCopyright } from "@/integrations/strapi/copyrightCheck";
import { toast } from "sonner";

type StandardContentType = Exclude<
    "video" | "audio" | "document" | "url" | "article" | "image",
    "quiz" | "certificate"
>;

type UrlProvider = "youtube" | "vimeo" | "custom" | "unknown";

interface StandardContentBuilderProps {
    workspace: {
        type: StandardContentType;
        materialId: number;
        editingContent?: CourseContentEntity | null;
    };
    selectedContentType: StandardContentType;
    materials: CourseMaterialEntity[];
    pendingMaterials: Array<{ tempId: string; name: string }>;
    contentTypeOptions: Array<{
        type: string;
        label: string;
        icon: React.ComponentType<{ className?: string }>;
        description: string;
    }>;
    contentFormData: {
        name: string;
        instructor: number | null;
        estimated_minutes: number;
        is_preview: boolean;
        duration_seconds: number;
        can_track_progress: boolean;
        url?: string;
        url_provider?: UrlProvider;
        url_metadata?: Record<string, unknown> | null;
        url_checked_at?: string | null;
        copyright_check_status?: CopyrightCheckStatus | null;
        copyright_check_result?: Record<string, unknown> | null;
        copyright_check_date?: string | null;
        copyright_check_provider?: string | null;
        copyright_violations?: any[] | null;
        copyright_warnings?: any[] | null;
        video_fingerprint?: string | null;
        copyright_check_metadata?: Record<string, unknown> | null;
    };
    setContentFormData: React.Dispatch<React.SetStateAction<any>>;
    setIsCheckingCopyright: (checking: boolean) => void;
    collaboratingInstructors: Instructor[];
    uploadedFileInfo: { name: string; size: number } | null;
    isUploading: boolean;
    isCheckingCopyright: boolean;
    urlMetadataStatus: "idle" | "loading" | "success" | "error";
    urlMetadataError: string | null;
    onClose: () => void;
    onSave: () => void;
    onUpdate: () => void;
    onVideoUpload: (file: File) => void;
    onAudioUpload: (file: File) => void;
    onDocumentUpload: (file: File, type: "document" | "image") => void;
    onRefreshUrlMetadata: () => void;
    onResetUploadState: () => void;
    formatFileSize: (bytes: number) => string;
}

const isVideoUrl = (url: string) =>
    /\.(mp4|webm|ogg)$/i.test(url.split("?")[0]) ||
    url.includes("youtube.com/") ||
    url.includes("youtu.be/") ||
    url.includes("vimeo.com/");

const isImageUrl = (url: string) =>
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.split("?")[0]);

export function StandardContentBuilder({
    workspace,
    selectedContentType,
    materials,
    pendingMaterials,
    contentTypeOptions,
    contentFormData,
    setContentFormData,
    setIsCheckingCopyright,
    collaboratingInstructors,
    uploadedFileInfo,
    isUploading,
    isCheckingCopyright,
    urlMetadataStatus,
    urlMetadataError,
    onClose,
    onSave,
    onUpdate,
    onVideoUpload,
    onAudioUpload,
    onDocumentUpload,
    onRefreshUrlMetadata,
    onResetUploadState,
    formatFileSize,
}: StandardContentBuilderProps) {
    const { type, materialId, editingContent } = workspace;
    const materialName =
        materials.find((m) => m.id === materialId)?.name ||
        pendingMaterials.find((pm) => pm.tempId === materialId.toString())?.name ||
        "Selected material";
    const typeMeta = contentTypeOptions.find((opt) => opt.type === type);
    const Icon = typeMeta?.icon || BookOpen;

    return (
        <motion.div
            key={`builder-standard-${type}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Button variant="ghost" onClick={onClose} className="w-fit">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Course Materials
                </Button>
                <div className="flex items-center gap-3">
                    <Badge variant="outline">
                        Attaching to&nbsp;<span className="font-semibold">{materialName}</span>
                    </Badge>
                    {editingContent && (
                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20">
                            Editing existing content
                        </Badge>
                    )}
                </div>
            </div>

            <div className={cn("grid gap-6", type === "article" ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2")}>
                <div className={cn("space-y-6", type === "article" ? "w-full" : "")}>
                    <div className="flex items-center gap-3 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                            <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {typeMeta?.label || "Content"}
                            </p>
                            <p className="text-xs text-muted-foreground">{typeMeta?.description}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Content Name *</Label>
                        <Input
                            placeholder="Enter content name"
                            value={contentFormData.name}
                            onChange={(e) =>
                                setContentFormData((prev: any) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            className="h-11"
                        />
                    </div>

                    {type === "url" && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">External URL *</Label>
                                <Input
                                    placeholder="https://example.com"
                                    value={contentFormData.url || ""}
                                    onChange={(e) =>
                                        setContentFormData((prev: any) => ({
                                            ...prev,
                                            url: e.target.value,
                                        }))
                                    }
                                    className="h-11"
                                />
                                <p className="text-xs text-muted-foreground">
                                    We auto-detect providers (YouTube, Vimeo, etc.) and render live previews.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* For Article type, show config fields first, then full-width editor */}
                    {type === "article" && (
                        <>
                            <InstructorSelector
                                value={contentFormData.instructor}
                                collaboratingInstructors={collaboratingInstructors}
                                onChange={(instructorId) => {
                                    setContentFormData((prev: any) => ({
                                        ...prev,
                                        instructor: instructorId,
                                    }));
                                }}
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Estimated Minutes</Label>
                                    <NumberInput
                                        value={contentFormData.estimated_minutes}
                                        onValueChange={(value: number) =>
                                            setContentFormData((prev: any) => ({
                                                ...prev,
                                                estimated_minutes: value || 0,
                                            }))
                                        }
                                        minValue={0}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Preview Availability</Label>
                                    <div className="flex items-center gap-2 rounded-xl border border-border/40 p-3">
                                        <Switch
                                            id="is-preview"
                                            checked={contentFormData.is_preview}
                                            onCheckedChange={(checked) =>
                                                setContentFormData((prev: any) => ({
                                                    ...prev,
                                                    is_preview: checked,
                                                }))
                                            }
                                        />
                                        <Label htmlFor="is-preview" className="cursor-pointer">
                                            Free Preview
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Duration Seconds</Label>
                                    <NumberInput
                                        value={contentFormData.duration_seconds}
                                        minValue={0}
                                        onValueChange={(value: number) =>
                                            setContentFormData((prev: any) => ({
                                                ...prev,
                                                duration_seconds: value || 0,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Can Track Progress</Label>
                                    <div className="flex items-center gap-2 rounded-xl border border-border/40 p-3">
                                        <Switch
                                            id="can-track"
                                            checked={contentFormData.can_track_progress}
                                            onCheckedChange={(checked) =>
                                                setContentFormData((prev: any) => ({
                                                    ...prev,
                                                    can_track_progress: checked,
                                                }))
                                            }
                                        />
                                        <Label htmlFor="can-track" className="cursor-pointer">
                                            Enable progress tracking
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            <ArticleEditor
                                value={contentFormData.url || ""}
                                onChange={(value) =>
                                    setContentFormData((prev: any) => ({
                                        ...prev,
                                        url: value,
                                    }))
                                }
                                className="w-full"
                            />
                        </>
                    )}

                    {(type === "video" || type === "audio" || type === "document" || type === "image") && (
                        <div className="space-y-4">
                            <div className="space-y-4">
                                <FileUpload
                                    accept={
                                        type === "video"
                                            ? "video/*"
                                            : type === "audio"
                                                ? "audio/*"
                                                : type === "document"
                                                    ? ".pdf,.doc,.docx,.ppt,.pptx,.txt"
                                                    : type === "image"
                                                        ? "image/*"
                                                        : "video/*,audio/*,image/*"
                                    }
                                    multiple={false}
                                    maxSize={type === "video" ? 3 * 1024 * 1024 * 1024 : 100 * 1024 * 1024}
                                    placeholder="Upload file"
                                    description="Drag or drop your files here or click to upload"
                                    showFileList={true}
                                    showFileDetails={true}
                                    showUploadProgress={(type === "video" || type === "audio" || type === "document" || type === "image") && isUploading}
                                    onChange={(files) => {
                                        const file = files[0];
                                        if (file) {
                                            if (type === "video") {
                                                onVideoUpload(file);
                                            } else if (type === "audio") {
                                                onAudioUpload(file);
                                            } else if (type === "document" || type === "image") {
                                                onDocumentUpload(file, type as "document" | "image");
                                            }
                                        }
                                    }}
                                    onFileRemove={() => {
                                        onResetUploadState();
                                    }}
                                />
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-semibold">Source URL</Label>
                                        {(type === "video" || type === "audio") && contentFormData.copyright_check_status && (
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={
                                                        contentFormData.copyright_check_status === "passed"
                                                            ? "default"
                                                            : contentFormData.copyright_check_status === "failed"
                                                                ? "destructive"
                                                                : contentFormData.copyright_check_status === "warning"
                                                                    ? "secondary"
                                                                    : contentFormData.copyright_check_status === "checking"
                                                                        ? "outline"
                                                                        : "outline"
                                                    }
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium",
                                                        contentFormData.copyright_check_status === "checking"
                                                            ? "animate-pulse"
                                                            : "",
                                                        contentFormData.copyright_check_status === "passed"
                                                            ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                                            : contentFormData.copyright_check_status === "failed"
                                                                ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                                                                : contentFormData.copyright_check_status === "warning"
                                                                    ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                                                                    : ""
                                                    )}
                                                >
                                                    {contentFormData.copyright_check_status === "checking" && (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    )}
                                                    {contentFormData.copyright_check_status === "passed" && (
                                                        <CheckCircle className="h-3 w-3" />
                                                    )}
                                                    {contentFormData.copyright_check_status === "failed" && (
                                                        <X className="h-3 w-3" />
                                                    )}
                                                    {contentFormData.copyright_check_status === "warning" && (
                                                        <AlertCircle className="h-3 w-3" />
                                                    )}
                                                    {contentFormData.copyright_check_status === "pending" && (
                                                        <Clock className="h-3 w-3" />
                                                    )}
                                                    {contentFormData.copyright_check_status === "manual_review" && (
                                                        <Eye className="h-3 w-3" />
                                                    )}
                                                    <span>
                                                        {contentFormData.copyright_check_status === "checking" && "Checking Copyright..."}
                                                        {contentFormData.copyright_check_status === "passed" && "Copyright OK"}
                                                        {contentFormData.copyright_check_status === "failed" && "Copyright Failed"}
                                                        {contentFormData.copyright_check_status === "warning" && "Copyright Warning"}
                                                        {contentFormData.copyright_check_status === "pending" && "Copyright Pending"}
                                                        {contentFormData.copyright_check_status === "manual_review" && "Manual Review Required"}
                                                    </span>
                                                </Badge>
                                                {(contentFormData.copyright_violations?.length || contentFormData.copyright_warnings?.length) && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {contentFormData.copyright_violations?.length || 0} violation{(contentFormData.copyright_violations?.length || 0) !== 1 ? 's' : ''}
                                                        {contentFormData.copyright_warnings?.length ? `, ${contentFormData.copyright_warnings.length} warning${contentFormData.copyright_warnings.length !== 1 ? 's' : ''}` : ''}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <Input
                                        placeholder="https://cdn.example.com/asset.mp4"
                                        value={contentFormData.url || ""}
                                        onChange={async (e) => {
                                            const url = e.target.value;
                                            setContentFormData((prev: any) => ({
                                                ...prev,
                                                url: url,
                                            }));

                                            // Check copyright for YouTube URLs
                                            if (url && (url.includes("youtube.com") || url.includes("youtu.be"))) {
                                                setIsCheckingCopyright(true);
                                                setContentFormData((prev: any) => ({
                                                    ...prev,
                                                    copyright_check_status: "checking",
                                                }));

                                                try {
                                                    const checkResult = await checkCopyright({
                                                        videoUrl: url,
                                                        provider: "youtube_content_id",
                                                    });

                                                    setContentFormData((prev: any) => ({
                                                        ...prev,
                                                        copyright_check_status: checkResult.status,
                                                        copyright_check_result: checkResult.result || null,
                                                        copyright_check_date: new Date().toISOString(),
                                                        copyright_check_provider: checkResult.provider || null,
                                                        copyright_violations: checkResult.violations || null,
                                                        copyright_warnings: checkResult.warnings || null,
                                                        video_fingerprint: checkResult.fingerprint || null,
                                                        copyright_check_metadata: checkResult.metadata || null,
                                                    }));

                                                    if (checkResult.status === "warning") {
                                                        toast.warning("Copyright warnings detected for this URL.");
                                                    }
                                                } catch (error) {
                                                    console.error("Error checking copyright for URL:", error);
                                                    setContentFormData((prev: any) => ({
                                                        ...prev,
                                                        copyright_check_status: "warning",
                                                    }));
                                                } finally {
                                                    setIsCheckingCopyright(false);
                                                }
                                            }
                                        }}
                                        className="h-11 w-full"
                                    />
                                    <p className="text-xs text-muted-foreground break-words">
                                        We auto-detect providers (YouTube, Vimeo, etc.) and render live previews.
                                    </p>
                                </div>
                            </div>

                            {/* Preview sections for each type */}
                            {type === "video" && contentFormData.url && (
                                <div className="rounded-xl border border-border/40 bg-card/50 p-4 overflow-hidden">
                                    <Label className="text-sm font-semibold mb-2 block">Video Preview</Label>
                                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                                        {contentFormData.url && (
                                            <div className="w-full h-full">
                                                {contentFormData.url.startsWith("blob:") || contentFormData.url.startsWith("http://localhost") || contentFormData.url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                                    <video
                                                        src={contentFormData.url}
                                                        controls
                                                        className="w-full h-full object-contain"
                                                        preload="metadata"
                                                    >
                                                        Your browser does not support the video tag.
                                                    </video>
                                                ) : (
                                                    <div className="w-full h-full">
                                                        {/* @ts-ignore - ReactPlayer type definition issue */}
                                                        <ReactPlayer
                                                            // @ts-ignore
                                                            src={contentFormData.url}
                                                            width="100%"
                                                            height="100%"
                                                            controls
                                                            playing={false}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {type === "audio" && contentFormData.url && (
                                <div className="rounded-xl border border-border/40 bg-card/50 p-4 overflow-hidden">
                                    <Label className="text-sm font-semibold mb-2 block">Audio Preview</Label>
                                    <div className="relative w-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-6">
                                        {contentFormData.url && (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-center">
                                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border-2 border-purple-500/30">
                                                        <FileAudio className="w-16 h-16 text-purple-500" />
                                                    </div>
                                                </div>
                                                <div className="w-full">
                                                    <audio
                                                        src={contentFormData.url}
                                                        controls
                                                        className="w-full"
                                                        preload="metadata"
                                                    >
                                                        Your browser does not support the audio tag.
                                                    </audio>
                                                </div>
                                                {uploadedFileInfo && (
                                                    <div className="text-center space-y-1">
                                                        <p className="text-sm font-medium">{uploadedFileInfo.name}</p>
                                                        <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFileInfo.size)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {type === "document" && contentFormData.url && (
                                <div className="rounded-xl border border-border/40 bg-card/50 p-4 overflow-hidden">
                                    <Label className="text-sm font-semibold mb-2 block">Document Preview</Label>
                                    <div className="relative w-full bg-muted/50 rounded-lg overflow-hidden">
                                        {contentFormData.url && (() => {
                                            const isBlobUrl = contentFormData.url.startsWith('blob:');
                                            const isPdf = contentFormData.url.toLowerCase().includes('.pdf')
                                                || contentFormData.url.toLowerCase().includes('/pdf')
                                                || (editingContent?.name && editingContent.name.toLowerCase().endsWith('.pdf'))
                                                || (uploadedFileInfo?.name && uploadedFileInfo.name.toLowerCase().endsWith('.pdf'))
                                                || type === "document";
                                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(contentFormData.url)
                                                || (uploadedFileInfo?.name && /\.(jpg|jpeg|png|gif|webp)$/i.test(uploadedFileInfo.name));

                                            if (isPdf) {
                                                const isExternalUrl = !isBlobUrl && (contentFormData.url.startsWith('http://') || contentFormData.url.startsWith('https://'));
                                                const viewerUrl = isExternalUrl
                                                    ? `https://docs.google.com/viewer?url=${encodeURIComponent(contentFormData.url)}&embedded=true`
                                                    : contentFormData.url;

                                                return (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-center p-4">
                                                            <div className="text-center space-y-2">
                                                                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border-2 border-blue-500/30 mx-auto">
                                                                    <FileIcon className="w-8 h-8 text-blue-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium">{uploadedFileInfo?.name || editingContent?.name || "Document"}</p>
                                                                    {uploadedFileInfo?.size && (
                                                                        <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFileInfo.size)}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="border-t pt-4">
                                                            <iframe
                                                                src={viewerUrl}
                                                                className="w-full h-[600px] border rounded-lg"
                                                                title="Document Preview"
                                                                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                                                            />
                                                            <div className="mt-2 flex items-center justify-center gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => contentFormData.url && window.open(contentFormData.url, '_blank')}
                                                                >
                                                                    <FileIcon className="w-4 h-4 mr-2" />
                                                                    Open in New Tab
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const link = document.createElement('a');
                                                                        link.href = contentFormData.url || '';
                                                                        link.download = uploadedFileInfo?.name || editingContent?.name || 'document';
                                                                        link.target = '_blank';
                                                                        document.body.appendChild(link);
                                                                        link.click();
                                                                        document.body.removeChild(link);
                                                                    }}
                                                                >
                                                                    <Download className="w-4 h-4 mr-2" />
                                                                    Download
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            } else if (isImage) {
                                                return (
                                                    <div className="space-y-4">
                                                        <img
                                                            src={contentFormData.url}
                                                            alt={uploadedFileInfo?.name || editingContent?.name || "Document preview"}
                                                            className="w-full h-auto max-h-[600px] object-contain rounded-lg"
                                                        />
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-center p-8">
                                                            <div className="text-center space-y-3">
                                                                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border-2 border-blue-500/30 mx-auto">
                                                                    <FileIcon className="w-10 h-10 text-blue-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium">{uploadedFileInfo?.name || editingContent?.name || "Document"}</p>
                                                                    {uploadedFileInfo?.size && (
                                                                        <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFileInfo.size)}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="border-t pt-4 flex items-center justify-center">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const link = document.createElement('a');
                                                                    link.href = contentFormData.url || '';
                                                                    link.download = uploadedFileInfo?.name || editingContent?.name || 'document';
                                                                    link.target = '_blank';
                                                                    document.body.appendChild(link);
                                                                    link.click();
                                                                    document.body.removeChild(link);
                                                                }}
                                                            >
                                                                <Download className="w-4 h-4 mr-2" />
                                                                Download File
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </div>
                                </div>
                            )}

                            {type === "image" && contentFormData.url && (
                                <div className="rounded-xl border border-border/40 bg-card/50 p-4 overflow-hidden">
                                    <Label className="text-sm font-semibold mb-2 block">Image Preview</Label>
                                    <div className="relative w-full bg-muted/50 rounded-lg overflow-hidden">
                                        <img
                                            src={contentFormData.url}
                                            alt={uploadedFileInfo?.name || editingContent?.name || "Image preview"}
                                            className="w-full h-auto max-h-[600px] object-contain rounded-lg"
                                        />
                                        {uploadedFileInfo && (
                                            <div className="mt-2 text-center space-y-1">
                                                <p className="text-sm font-medium">{uploadedFileInfo.name}</p>
                                                <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFileInfo.size)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Copyright Status Display for Video and Audio in Edit View */}
                    {((type === "video" || type === "audio") && contentFormData.copyright_check_status) && (
                        <div className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold">Copyright Status</p>
                                    <p className="text-xs text-muted-foreground">
                                        {contentFormData.copyright_check_date
                                            ? `Last checked: ${new Date(contentFormData.copyright_check_date).toLocaleString()}`
                                            : "Status information"}
                                    </p>
                                </div>
                                <Badge
                                    variant={
                                        contentFormData.copyright_check_status === "passed"
                                            ? "default"
                                            : contentFormData.copyright_check_status === "failed"
                                                ? "destructive"
                                                : contentFormData.copyright_check_status === "warning"
                                                    ? "secondary"
                                                    : "outline"
                                    }
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium",
                                        contentFormData.copyright_check_status === "passed"
                                            ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                            : contentFormData.copyright_check_status === "failed"
                                                ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                                                : contentFormData.copyright_check_status === "warning"
                                                    ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                                                    : ""
                                    )}
                                >
                                    {contentFormData.copyright_check_status === "checking" && (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    )}
                                    {contentFormData.copyright_check_status === "passed" && (
                                        <CheckCircle className="h-3 w-3" />
                                    )}
                                    {contentFormData.copyright_check_status === "failed" && (
                                        <X className="h-3 w-3" />
                                    )}
                                    {contentFormData.copyright_check_status === "warning" && (
                                        <AlertCircle className="h-3 w-3" />
                                    )}
                                    {contentFormData.copyright_check_status === "pending" && (
                                        <Clock className="h-3 w-3" />
                                    )}
                                    {contentFormData.copyright_check_status === "manual_review" && (
                                        <Eye className="h-3 w-3" />
                                    )}
                                    <span>
                                        {contentFormData.copyright_check_status === "checking" && "Checking Copyright..."}
                                        {contentFormData.copyright_check_status === "passed" && "Copyright OK"}
                                        {contentFormData.copyright_check_status === "failed" && "Copyright Failed"}
                                        {contentFormData.copyright_check_status === "warning" && "Copyright Warning"}
                                        {contentFormData.copyright_check_status === "pending" && "Copyright Pending"}
                                        {contentFormData.copyright_check_status === "manual_review" && "Manual Review Required"}
                                    </span>
                                </Badge>
                            </div>
                            {(contentFormData.copyright_violations && contentFormData.copyright_violations.length > 0) || (contentFormData.copyright_warnings && contentFormData.copyright_warnings.length > 0) ? (
                                <div className="space-y-2">
                                    {contentFormData.copyright_violations && contentFormData.copyright_violations.length > 0 && (
                                        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                                            <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                                                Violations ({contentFormData.copyright_violations.length})
                                            </p>
                                            <ul className="text-xs text-red-600 dark:text-red-300 space-y-1">
                                                {contentFormData.copyright_violations.map((violation: any, idx: number) => (
                                                    <li key={idx}>• {typeof violation === 'string' ? violation : violation?.message || violation?.type || 'Violation'}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {contentFormData.copyright_warnings && contentFormData.copyright_warnings.length > 0 && (
                                        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                                            <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">
                                                Warnings ({contentFormData.copyright_warnings.length})
                                            </p>
                                            <ul className="text-xs text-yellow-600 dark:text-yellow-300 space-y-1">
                                                {contentFormData.copyright_warnings.map((warning: any, idx: number) => (
                                                    <li key={idx}>• {typeof warning === 'string' ? warning : warning?.message || warning?.type || 'Warning'}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                            {contentFormData.copyright_check_provider && (
                                <div className="text-xs text-muted-foreground">
                                    <span className="font-medium">Provider:</span> {contentFormData.copyright_check_provider}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Config fields for non-article content types only */}
                    {type !== "article" && (
                        <>
                            <InstructorSelector
                                value={contentFormData.instructor}
                                collaboratingInstructors={collaboratingInstructors}
                                onChange={(instructorId) => {
                                    setContentFormData((prev: any) => ({
                                        ...prev,
                                        instructor: instructorId,
                                    }));
                                }}
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Estimated Minutes</Label>
                                    <NumberInput
                                        value={contentFormData.estimated_minutes}
                                        onValueChange={(value: number) =>
                                            setContentFormData((prev: any) => ({
                                                ...prev,
                                                estimated_minutes: value || 0,
                                            }))
                                        }
                                        minValue={0}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Preview Availability</Label>
                                    <div className="flex items-center gap-2 rounded-xl border border-border/40 p-3">
                                        <Switch
                                            id="is-preview"
                                            checked={contentFormData.is_preview}
                                            onCheckedChange={(checked) =>
                                                setContentFormData((prev: any) => ({
                                                    ...prev,
                                                    is_preview: checked,
                                                }))
                                            }
                                        />
                                        <Label htmlFor="is-preview" className="cursor-pointer">
                                            Free Preview
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Duration Seconds</Label>
                                    <NumberInput
                                        value={contentFormData.duration_seconds}
                                        minValue={0}
                                        onValueChange={(value: number) =>
                                            setContentFormData((prev: any) => ({
                                                ...prev,
                                                duration_seconds: value || 0,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Can Track Progress</Label>
                                    <div className="flex items-center gap-2 rounded-xl border border-border/40 p-3">
                                        <Switch
                                            checked={contentFormData.can_track_progress}
                                            onCheckedChange={(checked) =>
                                                setContentFormData((prev: any) => ({
                                                    ...prev,
                                                    can_track_progress: checked,
                                                }))
                                            }
                                        />
                                        <span className="text-sm text-muted-foreground">
                                            Enable learner progress tracking
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {type === "url" && (
                        <>
                            <div className="space-y-3 rounded-2xl border border-border/40 bg-muted/10 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold">URL Provider (auto detected)</p>
                                        <p className="text-xs text-muted-foreground">
                                            We check the platform automatically to optimize preview.
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="capitalize">
                                        {contentFormData.url_provider || "unknown"}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    <span>Last checked:</span>
                                    <span>
                                        {contentFormData.url_checked_at
                                            ? new Date(contentFormData.url_checked_at).toLocaleString()
                                            : "Not yet"}
                                    </span>
                                    <Button variant="ghost" size="sm" onClick={onRefreshUrlMetadata}>
                                        Re-check
                                    </Button>
                                </div>
                                <div className="rounded-xl border border-border/30 bg-background/60 p-3 text-xs text-muted-foreground space-y-1">
                                    <p>
                                        <span className="font-medium">Metadata status:</span>{" "}
                                        {urlMetadataStatus === "loading"
                                            ? "Checking..."
                                            : urlMetadataStatus === "success"
                                                ? "Ready"
                                                : urlMetadataStatus === "error"
                                                    ? urlMetadataError || "Failed to check"
                                                    : "Idle"}
                                    </p>
                                    {contentFormData.url_metadata && (
                                        <p>
                                            Title:{" "}
                                            <span className="font-medium">
                                                {(contentFormData.url_metadata as any).title || "Untitled"}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-dashed border-border/40 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold">URL Metadata</p>
                                        <p className="text-xs text-muted-foreground">
                                            This data is read-only and stored for verification.
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={onRefreshUrlMetadata}>
                                        Refresh metadata
                                    </Button>
                                </div>
                                {urlMetadataStatus === "loading" && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Checking metadata...
                                    </div>
                                )}
                                {urlMetadataStatus === "error" && (
                                    <p className="text-sm text-destructive">{urlMetadataError}</p>
                                )}
                                {urlMetadataStatus !== "loading" && !contentFormData.url_metadata && (
                                    <p className="text-sm text-muted-foreground">
                                        No metadata available yet. Enter a valid URL and we will fetch it.
                                    </p>
                                )}
                                {contentFormData.url_metadata && (
                                    <div className="grid gap-3 text-sm">
                                        <div>
                                            <p className="text-xs uppercase text-muted-foreground">Title</p>
                                            <p className="font-medium">
                                                {(contentFormData.url_metadata as any).title || "—"}
                                            </p>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <p className="text-xs uppercase text-muted-foreground">Provider</p>
                                                <p className="font-medium">
                                                    {(contentFormData.url_metadata as any).provider_name || "—"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase text-muted-foreground">Author</p>
                                                <p className="font-medium">
                                                    {(contentFormData.url_metadata as any).author_name || "—"}
                                                </p>
                                            </div>
                                        </div>
                                        {(contentFormData.url_metadata as any).thumbnail_url && (
                                            <div>
                                                <p className="text-xs uppercase text-muted-foreground">Thumbnail</p>
                                                <img
                                                    src={(contentFormData.url_metadata as any).thumbnail_url}
                                                    alt="Preview thumbnail"
                                                    className="w-full max-w-sm rounded-lg border border-border/40"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Hide preview column for article type */}
                {type !== "article" && (
                    <div className="space-y-4">
                        <Label className="text-sm font-semibold">Preview</Label>
                        <div className="min-h-[300px] rounded-xl border border-slate-200 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-4 dark:border-white/20 dark:from-white/5 dark:via-white/[0.03]">
                            {(() => {
                                if (!contentFormData.url && !contentFormData.name) {
                                    return (
                                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                                            <Eye className="w-12 h-12 mb-3 opacity-50" />
                                            <p className="text-sm">Preview will appear here</p>
                                            <p className="text-xs mt-1">Enter content name and URL to see preview</p>
                                        </div>
                                    );
                                }

                                if (contentFormData.url && (type === "video" || type === "url")) {
                                    if (isVideoUrl(contentFormData.url)) {
                                        return (
                                            <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                                {/* @ts-ignore - ReactPlayer type definition issue */}
                                                <ReactPlayer
                                                    key={contentFormData.url}
                                                    // @ts-ignore
                                                    src={contentFormData.url}
                                                    width="100%"
                                                    height="100%"
                                                    controls
                                                    playing={false}
                                                    loop
                                                    muted
                                                />
                                            </div>
                                        );
                                    }
                                }

                                if (contentFormData.url && (type === "image" || isImageUrl(contentFormData.url))) {
                                    return (
                                        <div className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                                            <img
                                                src={contentFormData.url}
                                                alt="Content preview"
                                                className="w-full h-auto max-h-[400px] object-contain"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = "none";
                                                }}
                                            />
                                        </div>
                                    );
                                }

                                if (contentFormData.url && type === "url") {
                                    return (
                                        <div className="aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border">
                                            <iframe
                                                src={contentFormData.url}
                                                className="w-full h-full"
                                                title="Content preview"
                                                sandbox="allow-same-origin allow-scripts"
                                            />
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-3">
                                        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-400/20">
                                            <h4 className="font-semibold text-lg mb-2">{contentFormData.name || "Untitled Content"}</h4>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Badge className="capitalize">{type}</Badge>
                                                {contentFormData.estimated_minutes > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{contentFormData.estimated_minutes} min</span>
                                                    </>
                                                )}
                                                {contentFormData.is_preview && (
                                                    <>
                                                        <span>•</span>
                                                        <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">Preview</Badge>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {contentFormData.url && (
                                            <div className="text-sm text-muted-foreground break-all">
                                                <span className="font-medium">URL: </span>
                                                <a href={contentFormData.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                                    {contentFormData.url}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3 border-t border-border/40 pt-4 md:flex-row md:items-center md:justify-between">
                <Button variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    onClick={editingContent ? onUpdate : onSave}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:from-blue-600 hover:to-purple-600"
                >
                    {editingContent ? "Update Content" : "Save Content"}
                </Button>
            </div>
        </motion.div>
    );
}
