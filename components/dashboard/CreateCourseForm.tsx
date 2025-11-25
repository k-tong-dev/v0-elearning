"use client";

import React, {useState, useEffect, useRef, useCallback, useMemo} from "react";
import {useRouter} from "next/navigation";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {NumberInput} from "@/components/ui/number-input";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import {
    ArrowLeft,
    Upload,
    Video,
    FileText,
    Target,
    Eye,
    Plus,
    BookOpen,
    CheckCircle,
    Loader2,
    ListOrdered,
    Image as ImageIcon,
    FileAudio,
    File as FileIcon,
    Link as LinkIcon,
    Award,
    X,
    GripVertical,
    Edit,
    Trash2,
    Clock,
    ChevronUp,
    ChevronDown,
    AlertCircle,
    Download,
    BarChart3,
    Users,
    TrendingUp,
    DollarSign,
    Star,
    MessageCircle,
    Activity,
    PieChart,
    ArrowUp,
    ArrowDown,
    Search,
    Filter,
    Target as TargetIcon,
    Building2,
} from "lucide-react";
import Image from "next/image";
import ReactPlayer from "react-player";
import {motion, AnimatePresence, useDragControls} from "framer-motion";
import {createPortal} from "react-dom";
import {toast} from "sonner";
import {
    CourseCourse,
    CreateCourseCourseInput,
    createCourseCourse,
    updateCourseCourse,
    getCourseCourse,
} from "@/integrations/strapi/courseCourse";
import {
    CourseMaterialEntity,
    CourseContentEntity,
    CourseContentType,
    createCourseMaterial,
    createCourseContentForMaterial,
    getCourseMaterials,
    getCourseContentsForMaterial,
    updateCourseMaterial,
    updateCourseContentForMaterial,
    deleteCourseMaterial,
    deleteCourseMaterialWithCascade,
    deleteCourseContentForMaterial,
    CopyrightCheckStatus,
    getContentDisplayUrl,
} from "@/integrations/strapi/courseMaterial";
import { checkCopyright, updateContentCopyrightCheck } from "@/integrations/strapi/copyrightCheck";
import {ContentProgressEntity, getContentProgressForContent} from "@/integrations/strapi/contentProgress";
import {cn} from "@/utils/utils";
import {getCertificatePrograms, updateCertificateProgram} from "@/integrations/strapi/certificateProgram";
import {
    CertificateFormState,
    CertificateTemplate,
    mapCertificateRecord,
} from "@/components/dashboard/certificates/certificate-utils";
import {
    CoursePreview,
    CoursePreviewType,
    createCoursePreview,
    updateCoursePreview,
    getCoursePreview,
} from "@/integrations/strapi/coursePreview";
import {getCourseCategories} from "@/integrations/strapi/courseCategory";
import {getCourseLevels} from "@/integrations/strapi/courseLevel";
import {getSkills} from "@/integrations/strapi/skill";
import {getInstructors, getCollaboratingInstructors, Instructor} from "@/integrations/strapi/instructor";
import {getAvatarUrl} from "@/lib/getAvatarUrl";
import {strapi} from "@/integrations/strapi/client";
import {uploadStrapiFile, deleteStrapiFile, getAccessToken} from "@/integrations/strapi/utils";
import {uploadToCloudinary, deleteFromCloudinary} from "@/integrations/cloudinary/upload";
import {InstructorDisplay} from "./course-form/InstructorDisplay";
import {InstructorSelector} from "./course-form/InstructorSelector";
import {ContentItem} from "./course-form/ContentItem";
import {ArticleEditor} from "./course-form/ArticleEditor";
import {ArticleViewer} from "./course-form/ArticleViewer";
import {QuizBuilder} from "./course-form/QuizBuilder";
import {QuizViewer} from "./course-form/QuizViewer";
import {StandardContentBuilder} from "./course-form/StandardContentBuilder";
import {CourseInsightsSection} from "./course-form/CourseInsightsSection";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { FileUpload } from "@/components/ui/file-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
    SaveProgressModal,
    SaveProgressSection,
    GlobalSaveProgressItem,
} from "@/components/ui/save-progress-modal";
import DraggableCopyrightModal from "@/components/dashboard/DraggableCopyrightModal";

interface CreateCourseFormProps {
    onCancel: () => void;
    onSuccess: () => void;
    courseId?: number | string; // Optional: if provided, load existing course for editing
}

const isImageUrl = (url: string) =>
    /\.(png|jpe?g|gif|webp)$/i.test(url.split("?")[0]);

const isVideoUrl = (url: string) =>
    /\.(mp4|webm|ogg)$/i.test(url.split("?")[0]) ||
    url.includes("youtube.com/") ||
    url.includes("youtu.be/") ||
    url.includes("vimeo.com/");

// Extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
};

// Extract Vimeo video ID from URL
const getVimeoVideoId = (url: string): string | null => {
    const match = url.match(/(?:vimeo\.com\/)(\d+)/);
    return match ? match[1] : null;
};

// Get embed URL for video platforms
const getVideoEmbedUrl = (url: string): string | null => {
    const youtubeId = getYouTubeVideoId(url);
    if (youtubeId) {
        return `https://www.youtube.com/embed/${youtubeId}`;
    }
    const vimeoId = getVimeoVideoId(url);
    if (vimeoId) {
        return `https://player.vimeo.com/video/${vimeoId}`;
    }
    return null;
};

type UrlProvider = "youtube" | "vimeo" | "custom" | "unknown";

const detectUrlProvider = (url?: string): UrlProvider => {
    if (!url) return "unknown";
    if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
    if (/vimeo\.com/.test(url)) return "vimeo";
    if (isVideoUrl(url)) return "custom";
    return "unknown";
};

const urlMetadataCache: Record<string, {data: Record<string, unknown> | null; checkedAt: string}> = {};

const fetchUrlMetadataFromService = async (url: string, signal?: AbortSignal) => {
    const cacheEntry = urlMetadataCache[url];
    if (cacheEntry) {
        return cacheEntry;
    }
    const endpoint = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
    const response = await fetch(endpoint, {signal});
    if (!response.ok) {
        throw new Error("Failed to fetch metadata");
    }
    const data = await response.json();
    const entry = {data, checkedAt: new Date().toISOString()};
    urlMetadataCache[url] = entry;
    return entry;
};

type BuilderStep =
    | "basics"
    | "materials"
    | "preview-publish";

interface BasicsState {
    name: string;
    description: string;
    is_paid: boolean;
    Price: number;
    discount_type: "percentage" | "fix_price" | null;
    discount_percentage: number;
    discount_fix_price: number;
    duration_minutes: number;
    preview_available: boolean;
    preview_url: string;
    course_level?: number | null;
    course_categories?: number[];
    course_tages?: number[];
    relevant_skills?: number[];
    course_badges?: number[];
    company?: number | null;
    currency?: number | null;
    instructor?: number[];
    can_edit_after_publish: boolean;
    active: boolean;
    course_status: "cancel" | "draft" | "published";
}

type QuizBuilderQuestion = {
    id: string;
    prompt: string;
    options: string[];
    correctIndex: number;
    points: number;
    hint?: string;
};

type QuizBuilderConfig = {
    title: string;
    description: string;
    instructions: string;
    passingScore: number;
    timeLimit: number;
    shuffleQuestions: boolean;
    showAnswers: boolean;
    estimatedMinutes: number;
    questions: QuizBuilderQuestion[];
};

type SpecialBuilderState = {
    type: "quiz";
    materialId: number | null;
    editingContent?: CourseContentEntity | null;
    config: QuizBuilderConfig;
};

const SPECIAL_CONFIG_PREFIX = "builder::";

const encodeSpecialContentPayload = (
    type: "quiz",
    config: QuizBuilderConfig,
) => {
    const payload = encodeURIComponent(JSON.stringify(config));
    return `${SPECIAL_CONFIG_PREFIX}${type}:${payload}`;
};

const decodeSpecialContentPayload = (
    type: "quiz",
    raw?: string | null,
) => {
    if (!raw) return null;
    const prefix = `${SPECIAL_CONFIG_PREFIX}${type}:`;
    if (!raw.startsWith(prefix)) return null;
    try {
        return JSON.parse(decodeURIComponent(raw.slice(prefix.length)));
    } catch (error) {
        console.error("Failed to decode special content payload", error);
        return null;
    }
};

const createQuizQuestion = (): QuizBuilderQuestion => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    prompt: "",
    options: ["", ""],
    correctIndex: 0,
    points: 1,
    hint: "",
});

const createDefaultQuizConfig = (): QuizBuilderConfig => ({
    title: "",
    description: "",
    instructions: "",
    passingScore: 70,
    timeLimit: 0,
    shuffleQuestions: true,
    showAnswers: true,
    estimatedMinutes: 15,
    questions: [createQuizQuestion()],
});

const isSpecialContentType = (type?: CourseContentType | null): type is "quiz" =>
    type === "quiz";
type StandardContentType = Exclude<CourseContentType, "quiz" | "certificate">;

const generateTempId = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatFileSize = (bytes: number) => {
    if (!bytes && bytes !== 0) return "";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }
    return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
};

export default function CreateCourseForm({
                                             onCancel,
                                             onSuccess,
                                             courseId,
                                         }: CreateCourseFormProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<BuilderStep>("basics");
    const [showContentTypeModal, setShowContentTypeModal] = useState(false);
    const [showMaterialEditModal, setShowMaterialEditModal] = useState(false);
    const [standardContentWorkspace, setStandardContentWorkspace] = useState<{
        type: StandardContentType;
        materialId: number;
        editingContent?: CourseContentEntity | null;
    } | null>(null);
    const [contentViewerWorkspace, setContentViewerWorkspace] = useState<{
        content: CourseContentEntity;
        materialId: number;
    } | null>(null);
    const [showQuizAnalysis, setShowQuizAnalysis] = useState(false);
    const [showContentAnalysis, setShowContentAnalysis] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<CourseMaterialEntity | null>(null);
    const [editingContent, setEditingContent] = useState<CourseContentEntity | null>(null);
    const [selectedContentType, setSelectedContentType] = useState<CourseContentType | null>(null);
    const [materialFormData, setMaterialFormData] = useState<{
        name: string;
        description: string;
    }>({
        name: "",
        description: "",
    });
    const [contentFormData, setContentFormData] = useState<{
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
        // Copyright fields
        copyright_check_status?: CopyrightCheckStatus | null;
        copyright_check_result?: Record<string, unknown> | null;
        copyright_check_date?: string | null;
        copyright_check_provider?: string | null;
        copyright_violations?: any[] | null;
        copyright_warnings?: any[] | null;
        video_fingerprint?: string | null;
        copyright_check_metadata?: Record<string, unknown> | null;
    }>({
        name: "",
        instructor: null,
        estimated_minutes: 0,
        is_preview: false,
        duration_seconds: 0,
        can_track_progress: false,
        url: "",
        url_provider: "unknown",
        url_metadata: null,
        url_checked_at: null,
        copyright_check_status: null,
        copyright_check_result: null,
        copyright_check_date: null,
        copyright_check_provider: null,
        copyright_violations: null,
        copyright_warnings: null,
        video_fingerprint: null,
        copyright_check_metadata: null,
    });
    const [isCheckingCopyright, setIsCheckingCopyright] = useState(false);
    const [copyrightCheckFile, setCopyrightCheckFile] = useState<File | null>(null);
    const [uploadedStrapiFile, setUploadedStrapiFile] = useState<any | null>(null);
    // Store pending file to upload only when saving
    const [pendingFileToUpload, setPendingFileToUpload] = useState<File | null>(null);
    // Track old file ID for deletion when updating content
    const [oldFileIdForDeletion, setOldFileIdForDeletion] = useState<number | string | null>(null);
    // Track Cloudinary public_id for deletion when updating content
    const [oldCloudinaryPublicId, setOldCloudinaryPublicId] = useState<string | null>(null);
    const [showCopyrightWarningDialog, setShowCopyrightWarningDialog] = useState(false);
    const [copyrightIssues, setCopyrightIssues] = useState<Array<{
        content: CourseContentEntity;
        material: CourseMaterialEntity;
        status: CopyrightCheckStatus | null;
        violations?: any[];
        warnings?: any[];
    }>>([]);
    const [course, setCourse] = useState<CourseCourse | null>(null);
    const [basics, setBasics] = useState<BasicsState>({
        name: "",
        description: "",
        is_paid: false,
        Price: 0,
        discount_type: null,
        discount_percentage: 0,
        discount_fix_price: 0,
        duration_minutes: 0,
        preview_available: false,
        preview_url: "",
        course_level: null,
        course_categories: [],
        course_tages: [],
        relevant_skills: [],
        course_badges: [],
        company: null,
        currency: null,
        instructor: [],
        can_edit_after_publish: false,
        active: true,
        course_status: "draft",
    });
    
    // State declarations that are used in useEffects
    const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);
    const [previewVideoSrc, setPreviewVideoSrc] = useState<string | null>(null);
    const [previewFileToUpload, setPreviewFileToUpload] = useState<File | null>(null);
    const [isUploadingPreview, setIsUploadingPreview] = useState(false);
    const [materials, setMaterials] = useState<CourseMaterialEntity[]>([]);
    const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(
        null
    );
    const [contentsByMaterial, setContentsByMaterial] = useState<
        Record<number, CourseContentEntity[]>
    >({});
    
    type PendingContentEntry = {
        tempId: string;
        materialTempId: string;
        name: string;
        type: CourseContentType;
        instructor: number | null;
        estimated_minutes: number;
        is_preview: boolean;
        url?: string;
        order_index: number;
        config?: QuizBuilderConfig;
        duration_seconds?: number;
        can_track_progress?: boolean;
        url_provider?: UrlProvider;
        url_metadata?: Record<string, unknown> | null;
        url_checked_at?: string | null;
        certificateId?: number;
        certificateDocumentId?: string;
        status: "saving" | "error";
        errorMessage?: string;
    };

    // Pending materials and contents (not yet saved to database)
    const [pendingMaterials, setPendingMaterials] = useState<Array<{
        tempId: string;
        name: string;
        description?: string;
        order_index: number;
    }>>([]);
    const [pendingContents, setPendingContents] = useState<Record<string, PendingContentEntry[]>>({});
    const [urlMetadataStatus, setUrlMetadataStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [urlMetadataError, setUrlMetadataError] = useState<string | null>(null);
    const [lastMetadataUrl, setLastMetadataUrl] = useState<string>("");
    const [uploadedFileInfo, setUploadedFileInfo] = useState<{ name: string; size: number } | null>(null);
    const fileObjectUrlRef = useRef<string | null>(null);
    const [isCreatingMaterial, setIsCreatingMaterial] = useState(false);
    const [fileUploadProgress, setFileUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState(false);
    const [contentProgressState, setContentProgressState] = useState<{
        entries: ContentProgressEntity[];
        loading: boolean;
        error?: string;
    }>({
        entries: [],
        loading: false,
    });
    const [certificateLibrary, setCertificateLibrary] = useState<CertificateTemplate[]>([]);
    const [isLoadingCertificates, setIsLoadingCertificates] = useState(false);
    const [certificatePreview, setCertificatePreview] = useState<CertificateTemplate | null>(null);
    const [certificateAttachContext, setCertificateAttachContext] = useState<{
        materialId: number;
        editingContent?: CourseContentEntity | null;
    } | null>(null);
    const [selectedCertificateId, setSelectedCertificateId] = useState<number | null>(null);
    const [certificateSearch, setCertificateSearch] = useState("");
    const [isCertificateActionLoading, setIsCertificateActionLoading] = useState(false);
    
    // Save progress tracking
    type SaveProgressItem = GlobalSaveProgressItem;
    const [saveProgressList, setSaveProgressList] = useState<SaveProgressItem[]>([]);
    
    // Track initial state for change detection
    const [initialBasics, setInitialBasics] = useState<BasicsState | null>(null);
    const [initialMaterials, setInitialMaterials] = useState<CourseMaterialEntity[]>([]);
    const [initialContents, setInitialContents] = useState<Record<number, CourseContentEntity[]>>({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [specialContentBuilder, setSpecialContentBuilder] = useState<SpecialBuilderState | null>(null);
    
    // Complete basics state
    useEffect(() => {
        setBasics(prev => ({
            ...prev,
            company: prev.company ?? null,
            currency: prev.currency ?? null,
            instructor: prev.instructor ?? [],
            can_edit_after_publish: prev.can_edit_after_publish ?? false,
            active: prev.active ?? true,
            course_status: prev.course_status ?? "draft",
        }));
    }, []);

    const cleanupObjectUrl = () => {
        if (fileObjectUrlRef.current) {
            URL.revokeObjectURL(fileObjectUrlRef.current);
            fileObjectUrlRef.current = null;
        }
    };

    const resetUploadState = () => {
        cleanupObjectUrl();
        setUploadedFileInfo(null);
        setUploadedStrapiFile(null);
        setPendingFileToUpload(null);
        setOldFileIdForDeletion(null);
        setOldCloudinaryPublicId(null);
    };

    // Helper function to extract Cloudinary public_id from URL
    const extractCloudinaryPublicId = (url: string | null | undefined): string | null => {
        if (!url) return null;
        // Cloudinary URL pattern: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{public_id}.{format}
        // or: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{public_id}.{format}
        const cloudinaryPattern = /res\.cloudinary\.com\/[^/]+\/[^/]+\/upload\/(?:v\d+\/)?([^.]+)/;
        const match = url.match(cloudinaryPattern);
        if (match && match[1]) {
            return match[1];
        }
        return null;
    };

    const handleFileUploadSelection = (file?: File | null) => {
        if (!file) return;
        cleanupObjectUrl();
        const objectUrl = URL.createObjectURL(file);
        fileObjectUrlRef.current = objectUrl;
        setUploadedFileInfo({ name: file.name, size: file.size });
        setContentFormData((prev) => ({
            ...prev,
            url: objectUrl,
            url_provider: "custom",
        }));
        setHasUnsavedChanges(true);
    };

    // Helper function to extract file ID from Strapi URL
    const extractFileIdFromUrl = (url: string): number | null => {
        if (!url) return null;
        // Try to extract from URL pattern like /uploads/file_name_hash.ext
        // We'll need to query Strapi to find the file by URL
        // For now, we'll store the old URL and delete it after upload
        return null;
    };

    const handleVideoUploadWithProgress = async (file: File) => {
        setIsUploading(true);
        setFileUploadProgress(0);
        setUploadedFileInfo({ name: file.name, size: file.size });
        setCopyrightCheckFile(file);
        
        // Store file for upload when saving (don't upload now)
        setPendingFileToUpload(file);
        
        try {
            // Create object URL for immediate preview only
            cleanupObjectUrl();
            const objectUrl = URL.createObjectURL(file);
            fileObjectUrlRef.current = objectUrl;
            
            // Set the preview URL immediately (local preview only)
            setContentFormData((prev) => ({
                ...prev,
                url: objectUrl,
                url_provider: "custom",
                copyright_check_status: "checking",
            }));
            
            setFileUploadProgress(50);
            
            // Start copyright check in the background (no upload needed)
            setIsCheckingCopyright(true);
            checkCopyright({
                videoFile: file,
                provider: "automated",
            })
                .then((checkResult) => {
                    setContentFormData((prev) => ({
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
                    
                    // Show toast based on result
                    if (checkResult.status === "failed") {
                        toast.error("Copyright check failed. Please review the content.");
                    } else if (checkResult.status === "warning") {
                        toast.warning("Copyright warnings detected. Please review.");
                    } else if (checkResult.status === "passed") {
                        toast.success("Copyright check passed.");
                    }
                })
                .catch((error) => {
                    console.error("Error checking copyright:", error);
                    setContentFormData((prev) => ({
                        ...prev,
                        copyright_check_status: "warning",
                        copyright_check_result: { error: "Check failed" },
                    }));
                    toast.warning("Copyright check encountered an error.");
                })
                .finally(() => {
                    setIsCheckingCopyright(false);
                });
            
            setFileUploadProgress(100);
            setIsUploading(false);
            setHasUnsavedChanges(true);
            toast.success("Video ready for upload. Click 'Save Content' to upload.");
        } catch (error) {
            console.error("Error processing video:", error);
            setIsUploading(false);
            setFileUploadProgress(0);
            setIsCheckingCopyright(false);
            toast.error("Failed to process video");
        }
    };

    const handleAudioUploadWithProgress = async (file: File) => {
        setIsUploading(true);
        setFileUploadProgress(0);
        setUploadedFileInfo({ name: file.name, size: file.size });
        setCopyrightCheckFile(file);
        
        // Store file for upload when saving (don't upload now)
        setPendingFileToUpload(file);
        
        try {
            // Create object URL for immediate preview only
            cleanupObjectUrl();
            const objectUrl = URL.createObjectURL(file);
            fileObjectUrlRef.current = objectUrl;
            
            // Set the preview URL immediately (local preview only)
            setContentFormData((prev) => ({
                ...prev,
                url: objectUrl,
                url_provider: "custom",
                copyright_check_status: "checking",
            }));
            
            setFileUploadProgress(50);
            
            // Start copyright check in the background (no upload needed)
            setIsCheckingCopyright(true);
            checkCopyright({
                audioFile: file,
                provider: "automated",
            })
                .then((checkResult) => {
                    setContentFormData((prev) => ({
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
                    
                    // Show toast based on result
                    if (checkResult.status === "failed") {
                        toast.error("Copyright check failed. Please review the content.");
                    } else if (checkResult.status === "warning") {
                        toast.warning("Copyright warnings detected. Please review.");
                    } else if (checkResult.status === "passed") {
                        toast.success("Copyright check passed.");
                    }
                })
                .catch((error) => {
                    console.error("Error checking copyright:", error);
                    setContentFormData((prev) => ({
                        ...prev,
                        copyright_check_status: "warning",
                        copyright_check_result: { error: "Check failed" },
                    }));
                    toast.warning("Copyright check encountered an error.");
                })
                .finally(() => {
                    setIsCheckingCopyright(false);
                });
            
            setFileUploadProgress(100);
            setIsUploading(false);
            setHasUnsavedChanges(true);
            toast.success("Audio ready for upload. Click 'Save Content' to upload.");
        } catch (error) {
            console.error("Error processing audio:", error);
            setIsUploading(false);
            setFileUploadProgress(0);
            setIsCheckingCopyright(false);
            toast.error("Failed to process audio");
        }
    };

    const handleDocumentUploadWithProgress = async (file: File, contentType?: "document" | "image") => {
        setIsUploading(true);
        setFileUploadProgress(0);
        setUploadedFileInfo({ name: file.name, size: file.size });
        
        // Get content type from parameter or from selectedContentType
        const fileType = contentType || selectedContentType || "document";
        
        // Store file for upload when saving (don't upload now)
        setPendingFileToUpload(file);
        
        try {
            // Create object URL for immediate preview only
            cleanupObjectUrl();
            const objectUrl = URL.createObjectURL(file);
            fileObjectUrlRef.current = objectUrl;
            
            // Set the preview URL immediately (local preview only)
            setContentFormData((prev) => ({
                ...prev,
                url: objectUrl,
                url_provider: "custom",
            }));
            
            setFileUploadProgress(100);
            setIsUploading(false);
            setHasUnsavedChanges(true);
            toast.success(`${fileType === "document" ? "Document" : "Image"} ready for upload. Click 'Save Content' to upload.`);
        } catch (error) {
            console.error(`Error processing ${fileType}:`, error);
            setIsUploading(false);
            setFileUploadProgress(0);
            toast.error(`Failed to process ${fileType}`);
        }
    };

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        handleFileUploadSelection(file);
        event.target.value = "";
    };

    const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        handleFileUploadSelection(file);
    };

    useEffect(() => {
        return () => {
            cleanupObjectUrl();
        };
    }, []);

    const loadCertificates = useCallback(async () => {
        setIsLoadingCertificates(true);
        try {
            const records = await getCertificatePrograms();
            const mapped = records.map(mapCertificateRecord);
            setCertificateLibrary(mapped);
        } catch (error) {
            console.error("Error loading certificates:", error);
            toast.error("Failed to load certificates.");
        } finally {
            setIsLoadingCertificates(false);
        }
    }, []);

    useEffect(() => {
        loadCertificates();
    }, [loadCertificates]);

    useEffect(() => {
        if (!certificateAttachContext) {
            setSelectedCertificateId(null);
            return;
        }
        if (selectedCertificateId) return;
        if (!certificateLibrary.length) return;
        const editingId = certificateAttachContext.editingContent?.url
            ? decodeCertificateRef(certificateAttachContext.editingContent.url)
            : null;
        const fallbackId =
            (editingId && certificateLibrary.some((item) => item.id === editingId) && editingId) ||
            certificateLibrary[0]?.id ||
            null;
        if (fallbackId) {
            setSelectedCertificateId(fallbackId);
        }
    }, [certificateAttachContext, certificateLibrary, selectedCertificateId]);

    const handleConfirmCertificateAttach = async () => {
        if (!certificateAttachContext || !selectedCertificateId) {
            toast.error("Select a certificate to continue.");
            return;
        }
        const certificate = certificateLibrary.find((item) => item.id === selectedCertificateId);
        if (!certificate) {
            toast.error("Certificate not found.");
            return;
        }
        const { materialId, editingContent } = certificateAttachContext;

        if (editingContent) {
            setIsCertificateActionLoading(true);
            try {
                const newUrl = encodeCertificateRef(certificate.id);
                const updated = await updateCourseContentForMaterial(editingContent.id, {
                    name: certificate.name,
                    url: newUrl,
                });
                if (!updated) {
                    toast.error("Failed to update content.");
                    return;
                }
                setContentsByMaterial((prev) => ({
                    ...prev,
                    [materialId]: (prev[materialId] || []).map((item) =>
                        item.id === editingContent.id ? updated : item,
                    ),
                }));
                const previousCertificateId = decodeCertificateRef(editingContent.url);
                if (previousCertificateId && previousCertificateId !== certificate.id) {
                    const previousCertificate = certificateLibrary.find((item) => item.id === previousCertificateId);
                    if (previousCertificate) {
                        await updateCertificateProgram(previousCertificate.documentId, { course_content: null });
                    }
                }
                await updateCertificateProgram(certificate.documentId, { course_content: updated.id });
                await loadCertificates();
                toast.success("Certificate updated for this content.");
            } catch (error) {
                console.error("Certificate attach error:", error);
                toast.error("Failed to update certificate.");
            } finally {
                setIsCertificateActionLoading(false);
                setCertificateAttachContext(null);
                setSelectedCertificateId(null);
            }
            return;
        }

        const pendingMaterial = pendingMaterials.find((pm) => pm.tempId === materialId.toString());
        const materialTempId = pendingMaterial?.tempId || materialId.toString();
        const existingContents = contentsByMaterial[materialId] || [];
        const pendingContentsForMaterial = pendingContents[materialTempId] || [];
        const order_index = existingContents.length + pendingContentsForMaterial.length;
        const tempId = generateTempId("temp-content");
        const pendingEntry: PendingContentEntry = {
                    tempId,
                    materialTempId,
                    name: certificate.name,
                    type: "certificate",
                    instructor: null,
                    estimated_minutes: 0,
                    is_preview: false,
                    url: encodeCertificateRef(certificate.id),
                    order_index,
                    config: undefined,
                    duration_seconds: 0,
                    can_track_progress: false,
                    url_provider: "custom",
                    url_metadata: null,
                    url_checked_at: null,
                    certificateId: certificate.id,
                    certificateDocumentId: certificate.documentId,
            status: "saving",
        };

        setPendingContents((prev) => ({
            ...prev,
            [materialTempId]: [...(prev[materialTempId] || []), pendingEntry],
        }));

        toast.info("Saving certificate content...");
        persistPendingContent(materialId, materialTempId, pendingEntry, { silent: true });
        setCertificateAttachContext(null);
        setSelectedCertificateId(null);
    };

    const handleCancelCertificateAttach = () => {
        setCertificateAttachContext(null);
        setSelectedCertificateId(null);
    };

    const encodeCertificateRef = (id: number) => `certificate::${id}`;
    const decodeCertificateRef = (value?: string | null) => {
        if (!value) return null;
        if (!value.startsWith("certificate::")) return null;
        const idPart = value.split("certificate::")[1];
        const parsed = parseInt(idPart, 10);
        return Number.isFinite(parsed) ? parsed : null;
    };

    // Detect changes
    useEffect(() => {
        if (!courseId || !initialBasics) {
            setHasUnsavedChanges(false);
            return;
        }
        
        // Compare basics
        const basicsChanged = JSON.stringify(basics) !== JSON.stringify(initialBasics);
        
        // Compare materials
        const materialsChanged = JSON.stringify(materials) !== JSON.stringify(initialMaterials);
        
        // Compare contents
        const contentsChanged = JSON.stringify(contentsByMaterial) !== JSON.stringify(initialContents);
        
        setHasUnsavedChanges(basicsChanged || materialsChanged || contentsChanged);
    }, [basics, materials, contentsByMaterial, initialBasics, initialMaterials, initialContents, courseId]);
    const [completedSteps, setCompletedSteps] = useState<Set<BuilderStep>>(new Set());
    const [thumbnailPreview, setThumbnailPreview] = useState<
        string | ArrayBuffer | null
    >(null);
    // Options for dropdowns
    const [courseCategories, setCourseCategories] = useState<Array<{ id: number; name: string }>>([]);
    const [courseLevels, setCourseLevels] = useState<Array<{ id: number; name: string }>>([]);
    const [skills, setSkills] = useState<Array<{ id: number; name: string }>>([]);
    const [badges, setBadges] = useState<Array<{ id: number; name: string }>>([]);
    const [courseTags, setCourseTags] = useState<Array<{ id: number; name: string }>>([]);
    const [companies, setCompanies] = useState<Array<{ id: number; name: string; logoUrl?: string | null }>>([]);
    const [currencies, setCurrencies] = useState<Array<{ id: number; name: string; code: string; is_default?: boolean }>>([]);
    const [instructors, setInstructors] = useState<Array<{ id: number; name?: string; avatar?: any }>>([]);
    const [collaboratingInstructors, setCollaboratingInstructors] = useState<Instructor[]>([]);

    // Fetch options on mount
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                // Get current user ID from Strapi
                let currentUserId: number | null = null;
                try {
                    const userResponse = await strapi.get('/api/users/me');
                    currentUserId = userResponse.data?.id || null;
                } catch (userError) {
                    console.warn("Could not fetch current user:", userError);
                }

                const [cats, levels, skillsData, badgesData, tagsData, companiesData, currenciesData, instructorsData, collaboratingInstructorsData] = await Promise.all([
                    getCourseCategories(),
                    getCourseLevels(),
                    getSkills(),
                    strapi.get('/api/course-badges').then(r => r.data.data || []).catch(() => []),
                    strapi.get('/api/course-tages').then(r => r.data.data || []).catch(() => []),
                    strapi.get('/api/companies?populate=*').then(r => r.data.data || []).catch(() => []),
                    strapi.get('/api/currencies?populate=*').then(r => r.data.data || []).catch(() => []),
                    getInstructors(),
                    currentUserId ? getCollaboratingInstructors(currentUserId) : Promise.resolve([]),
                ]);
                setCourseCategories(cats.map((c: any) => ({id: c.id, name: c.name})));
                setCourseLevels(levels.map((l: any) => ({id: l.id, name: l.name})));
                setSkills(skillsData.map((s: any) => ({id: s.id, name: s.name})));
                setBadges((badgesData || []).map((b: any) => ({id: b.id, name: b.name})));
                setCourseTags((tagsData || []).map((t: any) => ({id: t.id, name: t.name})));
                const baseMediaUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "";
                const mappedCompanies = (companiesData || []).map((c: any) => {
                    const logo = c.logo?.data || c.logo;
                    let logoUrl: string | null = null;
                    if (logo) {
                        const logoAttributes = logo.attributes || logo;
                        const url = logoAttributes?.url || logo.url;
                        if (url) {
                            logoUrl = url.startsWith("http") ? url : `${baseMediaUrl}${url}`;
                        }
                    }
                    return {
                        id: c.id,
                        name: c.name,
                        logoUrl: logoUrl,
                    };
                });
                setCompanies(mappedCompanies);
                const mappedCurrencies = (currenciesData || []).map((c: any) => ({id: c.id, name: c.name, code: c.code, is_default: c.is_default ?? false}));
                setCurrencies(mappedCurrencies);
                
                // Auto-select the default currency if one exists and no currency is currently selected
                const defaultCurrency = mappedCurrencies.find((c: { id: number; name: string; code: string; is_default?: boolean }) => c.is_default === true);
                if (defaultCurrency) {
                    handleBasicsChange("currency", defaultCurrency.id);
                }
                setInstructors((instructorsData || []).map((i: any) => ({id: i.id, name: i.name, avatar: i.avatar})));
                setCollaboratingInstructors(collaboratingInstructorsData);
            } catch (error) {
                console.error("Error fetching options:", error);
            }
        };
        fetchOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load existing course data when courseId is provided (edit mode)
    useEffect(() => {
        const loadCourseData = async () => {
            if (!courseId) return;
            
            try {
                // Ensure we use numeric id, not documentId
                const numericId = typeof courseId === 'string' && isNaN(Number(courseId)) 
                    ? null 
                    : Number(courseId);
                
                if (!numericId || isNaN(numericId)) {
                    toast.error("Invalid course ID. Please use numeric ID only.");
                    return;
                }
                
                const existingCourse = await getCourseCourse(numericId);
                if (!existingCourse) {
                    toast.error("Course not found.");
                    return;
                }

                setCourse(existingCourse);
                
                // Load course basics
                const loadedBasics: BasicsState = {
                    name: existingCourse.name || "",
                    description: existingCourse.description || "",
                    is_paid: existingCourse.is_paid || false,
                    Price: existingCourse.Price || 0,
                    discount_type: existingCourse.discount_type || null,
                    discount_percentage: existingCourse.discount_percentage || existingCourse.discount_percentage || 0,
                    discount_fix_price: existingCourse.discount_fix_price || 0,
                    duration_minutes: existingCourse.duration_minutes || 0,
                    preview_available: existingCourse.preview_available || false,
                    preview_url: existingCourse.preview_url || "",
                    course_level: existingCourse.course_level?.id || null,
                    course_categories: Array.isArray(existingCourse.course_categories) 
                        ? existingCourse.course_categories.map((c: any) => c.id || c)
                        : [],
                    course_tages: Array.isArray(existingCourse.course_tages)
                        ? existingCourse.course_tages.map((t: any) => t.id || t)
                        : [],
                    relevant_skills: Array.isArray(existingCourse.relevant_skills)
                        ? existingCourse.relevant_skills.map((s: any) => s.id || s)
                        : [],
                    course_badges: Array.isArray(existingCourse.course_badges)
                        ? existingCourse.course_badges.map((b: any) => b.id || b)
                        : [],
                    company: existingCourse.company?.id || null,
                    currency: existingCourse.currency?.id || null,
                    instructor: Array.isArray(existingCourse.instructors)
                        ? existingCourse.instructors.map((i: any) => i.id || i)
                        : (existingCourse as any).instructor ? [(existingCourse as any).instructor.id || (existingCourse as any).instructor] : [], // Fallback to instructor for backward compatibility
                    can_edit_after_publish: existingCourse.can_edit_after_publish || false,
                    active: existingCourse.active ?? true,
                    course_status: existingCourse.course_status || "draft",
                };
                setBasics(loadedBasics);
                setInitialBasics(loadedBasics);

                // Load course materials and contents
                const mats = await getCourseMaterials(existingCourse.id);
                setMaterials(mats);
                setInitialMaterials([...mats]);
                
                // Load contents for each material
                const contentsMap: Record<number, CourseContentEntity[]> = {};
                for (const mat of mats) {
                    const contents = await getCourseContentsForMaterial(mat.id);
                    contentsMap[mat.id] = contents;
                }
                setContentsByMaterial(contentsMap);
                setInitialContents({...contentsMap});

                // Load preview if exists
                if (existingCourse.course_preview?.id) {
                    try {
                        const preview = await getCoursePreview(existingCourse.course_preview.id);
                        if (preview) {
                            setPreviewEntity(preview);
                            // Dynamically set preview mode based on existing preview type
                            setPreviewMode(preview.types);
                            
                            // Extract URL based on type from nested structure
                            let extractedUrl: string | null = null;
                            
                            if (preview.types === "url" && preview.url) {
                                // For URL type, use url field directly
                                extractedUrl = preview.url;
                                setBasics(prev => ({
                                    ...prev,
                                    preview_url: preview.url || "",
                                    preview_available: true,
                                }));
                                // Check URL type for display
                                    const url = preview.url;
                                    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
                                        setUrlCheckResult("video");
                                        setIsCheckingUrl(false);
                                    } else {
                                        setTimeout(() => {
                                            checkUrlType(preview.url || "");
                                        }, 200);
                                    }
                            } else if (preview.types === "image" && preview.image) {
                                // Extract URL from nested image structure
                                // Handle both direct object and nested data structure
                                const imageData = preview.image?.data || preview.image;
                                extractedUrl = imageData?.attributes?.url 
                                    ? (imageData.attributes.url.startsWith('http') 
                                        ? imageData.attributes.url 
                                        : `${process.env.NEXT_PUBLIC_STRAPI_URL}${imageData.attributes.url}`)
                                    : imageData?.url || null;
                                
                                if (extractedUrl) {
                                    setPreviewImageSrc(extractedUrl);
                                    setBasics(prev => ({
                                        ...prev,
                                        preview_available: true,
                                    }));
                                }
                            } else if (preview.types === "video" && preview.video) {
                                // Extract URL from nested video structure
                                // Handle both direct object and nested data structure
                                const videoData = preview.video?.data || preview.video;
                                extractedUrl = videoData?.attributes?.url
                                    ? (videoData.attributes.url.startsWith('http')
                                        ? videoData.attributes.url
                                        : `${process.env.NEXT_PUBLIC_STRAPI_URL}${videoData.attributes.url}`)
                                    : videoData?.url || null;
                                
                                if (extractedUrl) {
                                    setPreviewVideoSrc(extractedUrl);
                                    setBasics(prev => ({
                                        ...prev,
                                        preview_available: true,
                                    }));
                                }
                            }
                        }
                    } catch (error) {
                        console.error("Error loading preview:", error);
                    }
                }

                // toast.success("Course loaded successfully!");
            } catch (error) {
                console.error("Error loading course:", error);
                toast.error("Failed to load course data.");
            }
        };

        loadCourseData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewMode, setPreviewMode] =
        useState<CoursePreviewType>("image");
    const [previewEntity, setPreviewEntity] = useState<CoursePreview | null>(
        null
    );
    const [isCheckingUrl, setIsCheckingUrl] = useState(false);
    const [urlCheckResult, setUrlCheckResult] = useState<"image" | "video" | "unknown" | null>(null);
    const [saveProgress, setSaveProgress] = useState<{
        preview?: number;
        course?: number;
        materials?: number;
    }>({});
    const [isSaveProgressModalOpen, setIsSaveProgressModalOpen] = useState(false);
    const hasActiveSaveJobs = useMemo(
        () => isSubmitting || saveProgressList.some((item) => item.status === "saving"),
        [isSubmitting, saveProgressList]
    );
    const progressSections = useMemo<SaveProgressSection[]>(() => {
        const determineStatus = (value?: number): SaveProgressSection["status"] => {
            if (value !== undefined && value >= 100) return "success";
            if (value !== undefined && value > 0) return "running";
            return hasActiveSaveJobs ? "running" : "idle";
        };
        return [
            {
                id: "preview",
                label: "Preview Upload",
                progress: saveProgress.preview ?? 0,
                status: determineStatus(saveProgress.preview),
                accent: "purple",
            },
            {
                id: "course",
                label: "Course Update",
                progress: saveProgress.course ?? 0,
                status: determineStatus(saveProgress.course),
                accent: "blue",
            },
            {
                id: "materials",
                label: "Materials",
                progress: saveProgress.materials ?? 0,
                status: determineStatus(saveProgress.materials),
                accent: "emerald",
            },
        ];
    }, [hasActiveSaveJobs, saveProgress.course, saveProgress.materials, saveProgress.preview]);
    useEffect(() => {
        if (hasActiveSaveJobs || saveProgressList.length > 0) {
            setIsSaveProgressModalOpen(true);
        } else {
            setIsSaveProgressModalOpen(false);
        }
    }, [hasActiveSaveJobs, saveProgressList.length]);

    // Ensure preview mode and URL are synced when preview entity changes
    useEffect(() => {
        if (previewEntity) {
            console.log("Preview entity changed, updating mode to:", previewEntity.types);
            setPreviewMode(previewEntity.types);
            if (previewEntity.url) {
                setBasics(prev => ({
                    ...prev,
                    preview_url: previewEntity.url || "",
                    preview_available: true,
                }));
                // Check URL type if it's a URL preview
                if (previewEntity.types === "url") {
                    const url = previewEntity.url;
                    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
                        setUrlCheckResult("video");
                        setIsCheckingUrl(false);
                    } else if (url) {
                        // Use setTimeout to ensure checkUrlType is available
                        setTimeout(() => {
                            checkUrlType(url);
                        }, 100);
                    }
                }
            }
        }
    }, [previewEntity]);

    // Ensure company is set after companies are loaded when editing a course
    useEffect(() => {
        if (courseId && companies.length > 0) {
            // First, try to get company from course object
            const courseCompanyId = course?.company?.id || null;
            // Fallback to basics.company if course object not available yet
            const companyIdToSet = courseCompanyId || basics.company;

            if (companyIdToSet) {
                // Check if this company exists in the companies list
                const companyExists = companies.find((c: { id: number; name: string; logoUrl?: string | null }) => c.id === companyIdToSet);
                if (companyExists) {
                    // Force set company in basics to ensure Select component displays it
                    setBasics(prev => {
                        if (prev.company !== companyIdToSet) {
                            return { ...prev, company: companyIdToSet };
                        }
                        return prev;
                    });
                }
            }
        }
    }, [companies, courseId, course]);

    const stepsOrder: BuilderStep[] = ["basics", "materials", "preview-publish"];

    const stepLabels: Record<BuilderStep, string> = {
        basics: "Basics",
        materials: "Course Materials",
        "preview-publish": "Analysis",
    };

    const currentStepIndex = stepsOrder.indexOf(currentStep);

    // Currency calculation helper
    const getEffectivePrice = () => {
        if (!basics.is_paid) return 0;
        if (basics.discount_type === "percentage") {
            return Math.max(0, basics.Price - (basics.Price * (basics.discount_percentage || 0)) / 100);
        } else if (basics.discount_type === "fix_price") {
            return Math.max(0, basics.Price - (basics.discount_fix_price || 0));
        }
        return basics.Price;
    };

    const formatPrice = (price: number) => {
        const effectivePrice = price || getEffectivePrice();
        if (!basics.currency) return `$${effectivePrice.toFixed(2)}`;
        const currency = currencies.find((c) => c.id === basics.currency);
        if (!currency) return `$${effectivePrice.toFixed(2)}`;
        if (currency.code === "USD") {
            return `$${effectivePrice.toFixed(2)}`;
        } else if (currency.code === "KHR") {
            const khrPrice = effectivePrice * 4100;
            return `៛${khrPrice.toLocaleString('en-US', {maximumFractionDigits: 0})} (${effectivePrice > 0 ? `≈$${effectivePrice.toFixed(2)}` : '$0.00'})`;
        }
        return `${currency.code} ${effectivePrice.toFixed(2)}`;
    };

    const handleBasicsChange = (field: keyof BasicsState, value: any) => {
        setBasics((prev) => ({...prev, [field]: value}));
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
            reader.onloadend = () => {
            setThumbnailPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handlePreviewMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate video file
        if (previewMode === "video") {
            // Check file size - approximate 30s video is around 5-10MB for compressed video
            const maxSize = 50 * 1024 * 1024; // 50MB max
            if (file.size > maxSize) {
                toast.error("Video file is too large. Please use a file under 50MB.");
                e.target.value = ""; // Clear file input
                return;
            }

            // Validate video duration (must be 30 seconds or less)
            try {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.src = URL.createObjectURL(file);
                
                await new Promise((resolve, reject) => {
                    video.onloadedmetadata = () => {
                        URL.revokeObjectURL(video.src);
                        resolve(null);
                    };
                    video.onerror = () => {
                        URL.revokeObjectURL(video.src);
                        reject(new Error("Failed to load video metadata"));
                    };
                    // Timeout after 5 seconds
                    setTimeout(() => {
                        URL.revokeObjectURL(video.src);
                        reject(new Error("Video metadata loading timeout"));
                    }, 5000);
                });

                const duration = video.duration;
                if (isNaN(duration) || duration <= 0) {
                    toast.error("Unable to determine video duration. Please try another file.");
                    e.target.value = ""; // Clear file input
                    return;
                }

                if (duration > 30) {
                    toast.error(`Video duration (${Math.round(duration)}s) exceeds 30 seconds limit. Please use a video that is 30 seconds or less.`);
                    e.target.value = ""; // Clear file input
                    URL.revokeObjectURL(video.src);
                    return;
                }

                // Video is valid
                console.log(`Video duration: ${duration.toFixed(2)}s - OK`);
            } catch (error) {
                console.error("Error validating video duration:", error);
                toast.error("Failed to validate video duration. Please try another file.");
                e.target.value = ""; // Clear file input
                return;
            }
        }

        // Create preview URL for immediate display
        const url = URL.createObjectURL(file);
        if (previewMode === "image") {
            setPreviewImageSrc(url);
        } else if (previewMode === "video") {
            setPreviewVideoSrc(url);
        }

        // Store file for upload when saving
        setPreviewFileToUpload(file);
        setHasUnsavedChanges(true);
        toast.success(`${previewMode === "image" ? "Image" : "Video"} ready for upload. Click 'Save' to upload.`);
    };

    // Check existing preview source when switching preview mode
    const checkExistingPreviewSource = (newMode: CoursePreviewType) => {
        if (!previewEntity) return;
        
        if (newMode === "image" && previewEntity.image) {
            // Extract image URL from nested structure
            const imageData = previewEntity.image?.data || previewEntity.image;
            const imageUrl = imageData?.attributes?.url 
                ? (imageData.attributes.url.startsWith('http') 
                    ? imageData.attributes.url 
                    : `${process.env.NEXT_PUBLIC_STRAPI_URL}${imageData.attributes.url}`)
                : imageData?.url;
            
            if (imageUrl) {
                setPreviewImageSrc(imageUrl);
                console.log("Found existing image source:", imageUrl);
            }
        } else if (newMode === "video" && previewEntity.video) {
            // Extract video URL from nested structure
            const videoData = previewEntity.video?.data || previewEntity.video;
            const videoUrl = videoData?.attributes?.url
                ? (videoData.attributes.url.startsWith('http')
                    ? videoData.attributes.url
                    : `${process.env.NEXT_PUBLIC_STRAPI_URL}${videoData.attributes.url}`)
                : videoData?.url;
            
            if (videoUrl) {
                setPreviewVideoSrc(videoUrl);
                console.log("Found existing video source:", videoUrl);
            }
        } else if (newMode === "url" && previewEntity.url) {
            // Set URL and check type
            setBasics(prev => ({
                ...prev,
                preview_url: previewEntity.url || "",
            }));
            const url = previewEntity.url;
            if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
                setUrlCheckResult("video");
                setIsCheckingUrl(false);
            } else if (url) {
                setTimeout(() => {
                    checkUrlType(url);
                }, 200);
            }
        }
    };

    const handlePreviewModeChange = (newMode: CoursePreviewType) => {
        // Check existing source before switching
        checkExistingPreviewSource(newMode);
        setPreviewMode(newMode);
    };

    const checkUrlType = async (url: string) => {
        if (!url || !url.startsWith("http")) return;
        setIsCheckingUrl(true);
        setUrlCheckResult(null);
        try {
            // First check if it's a YouTube/Vimeo URL (video platform)
            const youtubeId = getYouTubeVideoId(url);
            const vimeoId = getVimeoVideoId(url);
            if (youtubeId || vimeoId) {
                setUrlCheckResult("video");
                setIsCheckingUrl(false);
                setTimeout(() => {
                    setUrlCheckResult(null);
                }, 2000);
                return;
            }

            // Check if it's an image URL
            if (isImageUrl(url)) {
                // Verify the image loads
                const img = new (window as any).Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = url;
                    setTimeout(reject, 5000); // 5s timeout
                });
                setUrlCheckResult("image");
            } else if (isVideoUrl(url)) {
                // For direct video file URLs
                setUrlCheckResult("video");
            } else {
                // Try to fetch and check content type
                try {
                    const response = await fetch(url, {method: "HEAD", mode: "no-cors"}).catch(() => null);
                    // If we can't check, assume it's valid but unknown type
                    setUrlCheckResult("unknown");
                } catch {
                    setUrlCheckResult("unknown");
                }
            }
        } catch (error) {
            console.error("Error checking URL:", error);
            setUrlCheckResult("unknown");
        } finally {
            setIsCheckingUrl(false);
            // Auto-close progress after 2 seconds
            setTimeout(() => {
                setUrlCheckResult(null);
            }, 2000);
        }
    };

    const handlePreviewUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        handleBasicsChange("preview_url", url);
        if (url && url.startsWith("http")) {
            checkUrlType(url);
        }
    };

    const ensureCourseCreated = async (): Promise<CourseCourse | null> => {
        if (!basics.name.trim()) {
            toast.error("Course name is required.");
            return null;
        }
        
        const computedDiscountPercentage =
            basics.is_paid && basics.discount_type === "percentage"
                ? Number(basics.discount_percentage ?? 0)
                : null;
        const computedDiscountFixPrice =
            basics.is_paid && basics.discount_type === "fix_price"
                ? Number(basics.discount_fix_price ?? 0)
                : null;
        
        // Get current user ID for owner field
        let currentUserId: number | undefined = undefined;
        const ownerAccessToken = getAccessToken();
        if (!ownerAccessToken) {
            console.warn("Cannot fetch current user for owner field - no access token found.");
        } else {
        try {
            const userResponse = await strapi.get('/api/users/me');
            currentUserId = userResponse.data?.id ? Number(userResponse.data.id) : undefined;
        } catch (userError) {
            console.warn("Could not fetch current user for owner field:", userError);
            }
        }

        const courseData: CreateCourseCourseInput = {
            name: basics.name,
            description: basics.description,
            Price: basics.Price,
            is_paid: basics.is_paid,
            discount_type: basics.is_paid ? basics.discount_type : null,
            discount_percentage: computedDiscountPercentage,
            discount_fix_price: computedDiscountFixPrice,
            preview_available: basics.preview_available,
            duration_minutes: basics.duration_minutes,
            course_level: basics.course_level ?? null,
            course_categories: basics.course_categories ?? [],
            course_tages: basics.course_tages ?? [],
            relevant_skills: basics.relevant_skills ?? [],
            course_badges: basics.course_badges ?? [],
            company: basics.company ?? null,
            currency: basics.currency ?? null,
            instructors: basics.instructor ?? [], // Map instructor to instructors for API
            can_edit_after_publish: basics.can_edit_after_publish,
            active: basics.active,
            course_status: basics.course_status,
            owner: currentUserId, // Set owner to current user
        };

        // If course exists (edit mode), update it
        if (course) {
            // Format relations for Strapi v5 update - use { set: [{ id: ... }] } for array relations
        const updateData: any = {
            name: courseData.name,
            description: courseData.description,
            Price: courseData.Price,
            is_paid: courseData.is_paid,
            discount_type: courseData.discount_type,
            discount_percentage: courseData.discount_percentage,
            discount_fix_price: courseData.discount_fix_price,
            preview_available: courseData.preview_available,
            duration_minutes: courseData.duration_minutes,
            course_level: courseData.course_level ? { connect: [{ id: courseData.course_level }] } : null,
            course_categories: courseData.course_categories && courseData.course_categories.length > 0 ? { set: courseData.course_categories.map(id => ({ id })) } : { set: [] },
            course_tages: courseData.course_tages && courseData.course_tages.length > 0 ? { set: courseData.course_tages.map(id => ({ id })) } : { set: [] },
            relevant_skills: courseData.relevant_skills && courseData.relevant_skills.length > 0 ? { set: courseData.relevant_skills.map(id => ({ id })) } : { set: [] },
            course_badges: courseData.course_badges && courseData.course_badges.length > 0 ? { set: courseData.course_badges.map(id => ({ id })) } : { set: [] },
            company: courseData.company ? { connect: [{ id: courseData.company }] } : null,
            currency: courseData.currency ? { connect: [{ id: courseData.currency }] } : null,
            instructors: courseData.instructors && courseData.instructors.length > 0 ? { set: courseData.instructors.map(id => ({ id })) } : { set: [] },
            can_edit_after_publish: courseData.can_edit_after_publish,
            active: courseData.active,
            course_status: courseData.course_status,
        };
            
            const updated = await updateCourseCourse(course.documentId, updateData);
            if (!updated) {
                toast.error("Failed to update course in Strapi.");
                return null;
            }
            setCourse(updated);
            return updated;
        }

        // Otherwise, create new course
        const created = await createCourseCourse(courseData);
        if (!created) {
            toast.error("Failed to create course in Strapi.");
            return null;
        }
        let updatedCourse = created;

        // If preview is enabled, ensure a course-preview record exists and is linked
        if (basics.preview_available) {
            try {
                // Create CoursePreview (relation is one-way from Course, so don't set course_course)
                const createdPreview = await createCoursePreview({
                    types: previewMode,
                    url: previewMode === "url" ? basics.preview_url : undefined,
                });
                if (createdPreview) {
                    setPreviewEntity(createdPreview);
                    // Connect Course to CoursePreview using documentId (this is the correct way)
                    const linked = await updateCourseCourse(
                        created.documentId,
                        {
                            course_preview: { connect: [{ documentId: createdPreview.documentId }] },
                        } as any,
                    );
                    if (linked) {
                        updatedCourse = linked;
                    }
                }
            } catch (e) {
                console.error("Failed to create initial course preview", e);
            }
        }

        setCourse(updatedCourse);
        return updatedCourse;
    };

    const handleReorderMaterial = async (materialId: number, direction: "up" | "down") => {
        const currentIndex = materials.findIndex((m) => m.id === materialId);
        if (currentIndex === -1) return;
        const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= materials.length) return;

        const previousMaterials = materials.map((m) => ({ ...m }));

        const reordered = [...materials];
        const [moved] = reordered.splice(currentIndex, 1);
        reordered.splice(targetIndex, 0, moved);
        const reindexed = reordered.map((material, idx) => ({
            ...material,
            order_index: idx,
        }));

        setMaterials(reindexed);

        try {
            await Promise.all(
                reindexed.map((material) =>
                    updateCourseMaterial(material.id, { order_index: material.order_index }),
                ),
            );
            setInitialMaterials(reindexed);
            toast.success("Materials reordered.");
        } catch (error) {
            console.error("Failed to reorder materials:", error);
            setMaterials(previousMaterials);
            toast.error("Failed to reorder materials. Please try again.");
        }
    };

    const handleMoveContentToMaterial = async (
        content: CourseContentEntity,
        fromMaterialId: number,
        targetMaterialId: number,
    ) => {
        if (targetMaterialId === fromMaterialId) return;
        const sourceList = contentsByMaterial[fromMaterialId] || (await ensureContentsForMaterial(fromMaterialId));
        const targetList = contentsByMaterial[targetMaterialId] || (await ensureContentsForMaterial(targetMaterialId));

        const sourceIndex = sourceList.findIndex((c) => c.id === content.id);
        if (sourceIndex === -1) {
            toast.error("Content not found in source material.");
            return;
        }

        // Verify content exists and has documentId
        if (!content.documentId) {
            console.error("Content missing documentId:", content);
            toast.error("Content data is invalid. Please refresh and try again.");
            return;
        }

        const previousState = {
            from: sourceList.map((item) => ({ ...item })),
            to: targetList.map((item) => ({ ...item })),
        };

        const updatedSource = sourceList.filter((c) => c.id !== content.id);
        const reindexedSource = updatedSource.map((item, idx) => ({ ...item, order_index: idx }));
        const movedContent = { ...content, order_index: targetList.length };
        const updatedTarget = [...targetList, movedContent];

        setContentsByMaterial((prev) => ({
            ...prev,
            [fromMaterialId]: reindexedSource,
            [targetMaterialId]: updatedTarget,
        }));

        try {
            // Use documentId for update (Strapi v5 requirement)
            await updateCourseContentForMaterial(content.documentId, {
                course_material: targetMaterialId,
                order_index: movedContent.order_index,
            });
            await Promise.all(
                reindexedSource.map((item) =>
                    updateCourseContentForMaterial(item.documentId, { order_index: item.order_index }),
                ),
            );
            setInitialContents((prev) => ({
                ...prev,
                [fromMaterialId]: reindexedSource,
                [targetMaterialId]: updatedTarget,
            }));
            toast.success("Content moved successfully.");
        } catch (error) {
            console.error("Failed to move content:", error);
            setContentsByMaterial((prev) => ({
                ...prev,
                [fromMaterialId]: previousState.from,
                [targetMaterialId]: previousState.to,
            }));
            toast.error("Failed to move content. Please try again.");
        }
    };

    const handleNextStep = async () => {
        if (currentStep === "basics") {
            const created = await ensureCourseCreated();
            if (!created) return;
            setCourse(created);
            const mats = await getCourseMaterials(created.id);
            setMaterials(mats);
            setCompletedSteps(prev => new Set([...prev, "basics"]));
        } else if (currentStep === "materials") {
            if (materials.length === 0) {
                toast.error("Please add at least one material/chapter.");
                return;
            }
            const allContents = Object.values(contentsByMaterial).flat();
            if (allContents.length === 0) {
                toast.error("Please add at least one content item to your materials.");
                return;
            }
            setCompletedSteps(prev => new Set([...prev, "materials"]));
        }

        if (currentStepIndex < stepsOrder.length - 1) {
            const nextIndex = currentStepIndex + 1;
                setCurrentStep(stepsOrder[nextIndex]);
        }
    };

    const handlePrevStep = () => {
        if (currentStepIndex > 0) {
            const prevIndex = currentStepIndex - 1;
                setCurrentStep(stepsOrder[prevIndex]);
            }
    };

    const handleCancelWithCheck = () => {
        onCancel();
    };

    const handleAddMaterial = async () => {
        if (isCreatingMaterial) return;
        const baseCourse = await ensureCourseCreated();
        if (!baseCourse) {
            toast.error("Please complete the basics step before adding materials.");
            return;
        }
        setIsCreatingMaterial(true);
        const order_index = materials.length;
            const defaultName = `Chapter ${order_index + 1}`;
        const progressId = `material-${Date.now()}`;
        
        // Add to progress list
        setSaveProgressList((prev) => [
            ...prev,
            { id: progressId, type: "material", name: defaultName, status: "saving" },
        ]);
        
        try {
        const created = await createCourseMaterial({
            course_course: baseCourse.id,
                name: defaultName,
            order_index,
        });
        if (!created) {
                throw new Error("Failed to create material");
        }
        setMaterials((prev) => [...prev, created]);
            setInitialMaterials((prev) => [...prev, created]);
            setContentsByMaterial((prev) => ({
                ...prev,
                [created.id]: [],
            }));
            setInitialContents((prev) => ({
                ...prev,
                [created.id]: [],
            }));
            setSelectedMaterialId(created.id);
            setPendingMaterials([]);
            
            // Update progress to success
            setSaveProgressList((prev) =>
                prev.map((item) =>
                    item.id === progressId ? { ...item, status: "success" as const } : item
                )
            );
            
            // Remove from progress after 2 seconds
            setTimeout(() => {
                setSaveProgressList((prev) => prev.filter((item) => item.id !== progressId));
            }, 2000);
            
            toast.success("Material created and saved.");
        } catch (error) {
            console.error("Error creating material:", error);
            setSaveProgressList((prev) =>
                prev.map((item) =>
                    item.id === progressId
                        ? { ...item, status: "error" as const, errorMessage: "Failed to create material" }
                        : item
                )
            );
            toast.error("Failed to create material.");
        } finally {
            setIsCreatingMaterial(false);
        }
    };

    const ensureContentsForMaterial = async (materialId: number) => {
        if (contentsByMaterial[materialId]) {
            return contentsByMaterial[materialId];
        }
        const list = await getCourseContentsForMaterial(materialId);
        setContentsByMaterial((prev) => ({ ...prev, [materialId]: list }));
        return list;
    };

    const handleSelectMaterial = async (materialId: number) => {
        setSelectedMaterialId(materialId);
        if (!contentsByMaterial[materialId]) {
            const list = await getCourseContentsForMaterial(materialId);
            setContentsByMaterial((prev) => ({...prev, [materialId]: list}));
        }
    };

    // Load contents for all materials when entering materials step
    useEffect(() => {
        if (currentStep === "materials" && materials.length > 0) {
            materials.forEach(async (material) => {
                if (!contentsByMaterial[material.id]) {
                    const list = await getCourseContentsForMaterial(material.id);
                    setContentsByMaterial((prev) => ({...prev, [material.id]: list}));
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, materials.length]);

    const handleOpenContentTypeModal = (materialId: number) => {
        if (!materialId) {
            toast.error("Please select a material first.");
            return;
        }
        setSelectedMaterialId(materialId);
        setShowContentTypeModal(true);
    };

    const openStandardBuilder = (
        type: StandardContentType,
        materialId: number,
        content?: CourseContentEntity,
    ) => {
        resetUploadState();
        setSelectedContentType(type);
        setEditingContent(content ?? null);
        // Extract instructor ID from content - handle both number and object formats
        let editingInstructor: number | null = null;
        if (content?.instructor) {
          if (typeof content.instructor === 'number') {
            editingInstructor = content.instructor;
          } else if (typeof content.instructor === 'object' && content.instructor !== null) {
            editingInstructor = (content.instructor as any)?.id || null;
          }
        }
        // Removed debug console.log
        
        // Get the display URL - this is the Cloudinary URL or external URL
        const displayUrl = content ? getContentDisplayUrl(content) : "";
        
        // For article type, use article field; for others, use url field
        const isArticleType = type === "article";
        const formUrl = isArticleType 
            ? (content?.article || "") 
            : (displayUrl || "");
        
        // Detect URL provider for external URLs (not for article type)
        const isExternalUrl = content?.type === "url";
        const urlProvider = (content?.url_provider as UrlProvider) || (isExternalUrl && displayUrl ? detectUrlProvider(displayUrl) : "unknown");
        
        setContentFormData(
            content
                ? {
                      name: content.name,
                      instructor: editingInstructor,
                      estimated_minutes: content.estimated_minutes || 0,
                      is_preview: content.is_preview || false,
                      duration_seconds: content.duration_seconds || 0,
                      can_track_progress: content.can_track_progress || false,
                      url: formUrl, // For article: article field content; for others: displayUrl (Cloudinary URL or external URL)
                      url_provider: urlProvider,
                      url_metadata: (content.url_metadata as Record<string, unknown>) || null,
                      url_checked_at: content.url_checked_at || null,
                      // Copyright fields
                      copyright_check_status: (content.copyright_check_status as CopyrightCheckStatus) || null,
                      copyright_check_result: (content.copyright_check_result as Record<string, unknown>) || null,
                      copyright_check_date: content.copyright_check_date || null,
                      copyright_check_provider: content.copyright_check_provider || null,
                      copyright_violations: content.copyright_violations || null,
                      copyright_warnings: content.copyright_warnings || null,
                      video_fingerprint: content.video_fingerprint || null,
                      copyright_check_metadata: (content.copyright_check_metadata as Record<string, unknown>) || null,
                  }
                : {
                      name: "",
                      instructor: null,
                      estimated_minutes: 0,
                      is_preview: false,
                      duration_seconds: 0,
                      can_track_progress: false,
                      url: "",
                      url_provider: "unknown",
                      url_metadata: null,
                      url_checked_at: null,
                      // Copyright fields
                      copyright_check_status: null,
                      copyright_check_result: null,
                      copyright_check_date: null,
                      copyright_check_provider: null,
                      copyright_violations: null,
                      copyright_warnings: null,
                      video_fingerprint: null,
                      copyright_check_metadata: null,
                  },
        );
        setUrlMetadataStatus(content?.url_metadata ? "success" : "idle");
        setUrlMetadataError(null);
        setLastMetadataUrl(formUrl);
        
        // Set preview URL for video/audio/document/image content
        if (displayUrl && (type === "video" || type === "audio" || type === "document" || type === "image")) {
            cleanupObjectUrl();
            // Use the display URL (Cloudinary URL) for preview
            fileObjectUrlRef.current = displayUrl;
            
            // Extract Cloudinary public_id for potential deletion when updating
            if (content?.url) {
                const cloudinaryPublicId = extractCloudinaryPublicId(content.url);
                if (cloudinaryPublicId) {
                    setOldCloudinaryPublicId(cloudinaryPublicId);
                }
            }
        } else {
            // Clear old file references if not a file-based content type
            setOldFileIdForDeletion(null);
            setOldCloudinaryPublicId(null);
        }
        setStandardContentWorkspace({
            type,
            materialId,
            editingContent: content ?? null,
        });
    };

    const openCertificateAttachModal = (materialId: number, editingContent?: CourseContentEntity | null) => {
        if (!certificateLibrary.length) {
            loadCertificates();
        }
        const defaultId =
            editingContent?.url ? decodeCertificateRef(editingContent.url) : certificateLibrary[0]?.id ?? null;
        setSelectedCertificateId(defaultId);
        setCertificateAttachContext({
            materialId,
            editingContent: editingContent ?? null,
        });
    };

    const handleSelectContentType = (type: CourseContentType) => {
        if (!selectedMaterialId) {
            toast.error("Please pick a material first.");
            return;
        }
        setShowContentTypeModal(false);

        if (type === "quiz") {
            // Initialize content form data for quiz
            setContentFormData({
                name: "",
                instructor: null,
                estimated_minutes: 15,
                is_preview: false,
                duration_seconds: 0,
                can_track_progress: true,
                url: "",
                url_provider: "unknown",
                url_metadata: null,
                url_checked_at: null,
            });
            setSpecialContentBuilder({
                type: "quiz",
                materialId: selectedMaterialId,
                editingContent: null,
                config: createDefaultQuizConfig(),
            });
            setEditingContent(null);
            return;
        }
        if (type === "certificate") {
            openCertificateAttachModal(selectedMaterialId, null);
            return;
        }

        openStandardBuilder(type as StandardContentType, selectedMaterialId);
    };

    const closeStandardBuilder = () => {
        // Clear pending file when canceling (don't upload if user cancels)
        setPendingFileToUpload(null);
        resetUploadState();
        setStandardContentWorkspace(null);
        setSelectedContentType(null);
        setEditingContent(null);
        setContentFormData({
            name: "",
            instructor: null,
            estimated_minutes: 0,
            is_preview: false,
            duration_seconds: 0,
            can_track_progress: false,
            url: "",
            url_provider: "unknown",
            url_metadata: null,
            url_checked_at: null,
        });
        setUrlMetadataStatus("idle");
        setUrlMetadataError(null);
        setLastMetadataUrl("");
        resetUploadState();
    };

    const handleRefreshUrlMetadata = async () => {
        if (!contentFormData.url) return;
        try {
            setUrlMetadataStatus("loading");
            setUrlMetadataError(null);
            const metadata = await fetchUrlMetadataFromService(contentFormData.url.trim());
            setContentFormData((prev) => ({
                ...prev,
                url_metadata: metadata.data,
                url_checked_at: metadata.checkedAt,
            }));
            setUrlMetadataStatus("success");
            setLastMetadataUrl(contentFormData.url.trim());
        } catch (error) {
            setUrlMetadataStatus("error");
            setUrlMetadataError("Unable to fetch metadata. Please verify the URL.");
        }
    };

    useEffect(() => {
        if (!standardContentWorkspace || selectedContentType !== "url") return;
        const url = contentFormData.url?.trim() || "";
        const provider = detectUrlProvider(url);
        setContentFormData((prev) =>
            prev.url_provider === provider
                ? prev
                : {
                      ...prev,
                      url_provider: provider,
                  },
        );
        if (!url) {
            setUrlMetadataStatus("idle");
            setUrlMetadataError(null);
            setLastMetadataUrl("");
            return;
        }
        if (url === lastMetadataUrl && urlMetadataStatus === "success") {
            return;
        }
        const controller = new AbortController();
        const timeout = setTimeout(async () => {
            try {
                setUrlMetadataStatus("loading");
                setUrlMetadataError(null);
                const metadata = await fetchUrlMetadataFromService(url, controller.signal);
                setContentFormData((prev) => ({
                    ...prev,
                    url_metadata: metadata.data,
                    url_checked_at: metadata.checkedAt,
                }));
                setUrlMetadataStatus("success");
                setLastMetadataUrl(url);
            } catch (error: any) {
                if (error?.name === "AbortError") return;
                setUrlMetadataStatus("error");
                setUrlMetadataError("Unable to fetch metadata. Please verify the URL.");
            }
        }, 600);
        return () => {
            controller.abort();
            clearTimeout(timeout);
        };
    }, [
        contentFormData.url,
        selectedContentType,
        standardContentWorkspace,
        lastMetadataUrl,
        urlMetadataStatus,
    ]);

    const openContentViewer = (content: CourseContentEntity, materialId: number) => {
        setContentViewerWorkspace({ content, materialId });
    };

    const closeContentViewer = () => {
        setContentViewerWorkspace(null);
        setShowQuizAnalysis(false);
        setShowContentAnalysis(false);
    };

    useEffect(() => {
        if (!contentViewerWorkspace || !contentViewerWorkspace.content.can_track_progress) {
            setContentProgressState({ entries: [], loading: false });
            return;
        }
        let isMounted = true;
        setContentProgressState((prev) => ({ ...prev, loading: true, error: undefined }));
        getContentProgressForContent(contentViewerWorkspace.content.id)
            .then((entries) => {
                if (!isMounted) return;
                setContentProgressState({ entries, loading: false });
            })
            .catch(() => {
                if (!isMounted) return;
                setContentProgressState({
                    entries: [],
                    loading: false,
                    error: "Unable to load learner progress.",
                });
            });
        return () => {
            isMounted = false;
        };
    }, [contentViewerWorkspace]);

    const updatePendingContentEntry = useCallback(
        (materialTempId: string, tempId: string, updates: Partial<PendingContentEntry>) => {
            setPendingContents((prev) => {
                const list = prev[materialTempId];
                if (!list) return prev;
                const nextList = list.map((item) =>
                    item.tempId === tempId ? { ...item, ...updates } : item,
                );
                return {
                    ...prev,
                    [materialTempId]: nextList,
                };
            });
        },
        [],
    );

    const removePendingContentEntry = useCallback((materialTempId: string, tempId: string) => {
        setPendingContents((prev) => {
            const list = prev[materialTempId];
            if (!list) return prev;
            const nextList = list.filter((item) => item.tempId !== tempId);
            if (nextList.length === 0) {
                const { [materialTempId]: _, ...rest } = prev;
                return rest;
            }
            return {
                ...prev,
                [materialTempId]: nextList,
            };
        });
    }, []);

    const persistPendingContent = useCallback(
        async (
            materialId: number,
            materialTempId: string,
            pendingContent: PendingContentEntry,
            options?: { silent?: boolean },
        ) => {
            try {
                const createdContent = await createCourseContentForMaterial({
                    course_material: materialId,
                    name: pendingContent.name,
                    type: pendingContent.type,
                    order_index: pendingContent.order_index,
                    instructor: pendingContent.instructor || undefined,
                    estimated_minutes: pendingContent.estimated_minutes,
                    is_preview: pendingContent.is_preview,
                    url: pendingContent.url || undefined,
                    duration_seconds: pendingContent.duration_seconds ?? 0,
                    can_track_progress: pendingContent.can_track_progress ?? false,
                    url_provider:
                        pendingContent.url_provider && pendingContent.url_provider !== "unknown"
                            ? pendingContent.url_provider
                            : undefined,
                    url_metadata: pendingContent.url_metadata ?? undefined,
                    url_checked_at: pendingContent.url_checked_at ?? undefined,
                });

                if (!createdContent) {
                    throw new Error("Failed to create content");
                }

                if (
                    pendingContent.type === "certificate" &&
                    pendingContent.certificateDocumentId
                ) {
                    await updateCertificateProgram(pendingContent.certificateDocumentId, {
                        course_content: createdContent.id,
                    });
                    await loadCertificates();
                }

                setContentsByMaterial((prev) => {
                    const existing = prev[materialId] || [];
                    const updatedList = [...existing, createdContent].sort(
                        (a, b) => a.order_index - b.order_index,
                    );
                    setInitialContents((initialPrev) => ({
                        ...initialPrev,
                        [materialId]: updatedList,
                    }));
                    return {
                        ...prev,
                        [materialId]: updatedList,
                    };
                });

                removePendingContentEntry(materialTempId, pendingContent.tempId);

                if (!options?.silent) {
                    toast.success("Content saved.");
                }
            } catch (error: any) {
                console.error("Error auto-saving content:", error);
                const message = error?.message || "Failed to save content.";
                updatePendingContentEntry(materialTempId, pendingContent.tempId, {
                    status: "error",
                    errorMessage: message,
                });
                if (!options?.silent) {
                    toast.error("Failed to save content. Click Save to retry.");
                }
            }
        },
        [loadCertificates, removePendingContentEntry, updatePendingContentEntry],
    );

    const handleRetryPendingContent = useCallback(
        (materialId: number, entry: PendingContentEntry) => {
            updatePendingContentEntry(entry.materialTempId, entry.tempId, {
                status: "saving",
                errorMessage: undefined,
            });
            persistPendingContent(materialId, entry.materialTempId, entry, { silent: false });
        },
        [persistPendingContent, updatePendingContentEntry],
    );

    const handleCreateContent = async () => {
        if (!selectedMaterialId || !selectedContentType) {
            toast.error("Missing required information.");
            return;
        }
        if (isSpecialContentType(selectedContentType)) {
            toast.error("Use the dedicated builder for this content type.");
            return;
        }
        if (!contentFormData.name.trim()) {
            toast.error("Please enter a content name.");
            return;
        }

        // Check if instructor is in collaboration (instructor must be in collaborating instructors list)
        if (contentFormData.instructor && !collaboratingInstructors.some(inst => inst.id === contentFormData.instructor)) {
            toast.error("Selected instructor must be in collaboration with you.");
            return;
        }

        // If editing existing content, update it
        if (editingContent) {
            handleUpdateContent();
            return;
        }

        const baseCourse = await ensureCourseCreated();
        if (!baseCourse) {
            toast.error("Please complete the basics step before adding content.");
            return;
        }

        const progressId = `content-${Date.now()}`;
        
        // Add to progress list
        setSaveProgressList((prev) => [
            ...prev,
            { id: progressId, type: "content", name: contentFormData.name, status: "saving" },
        ]);

        try {
            // Upload file to Cloudinary first, then optionally to Strapi for backup
            // Store Cloudinary URL in url field for all content types
            let finalUrl: string | undefined = undefined;
            if (pendingFileToUpload) {
                try {
                    // Upload to Cloudinary first
                    const resourceType = pendingFileToUpload.type.startsWith("video/") ? "video" 
                        : pendingFileToUpload.type.startsWith("audio/") ? "video" 
                        : pendingFileToUpload.type.startsWith("image/") ? "image"
                        : "raw";
                    
                    const cloudinaryResult = await uploadToCloudinary(pendingFileToUpload, {
                        folder: "Contents",
                        resource_type: resourceType,
                    });
                    
                    finalUrl = cloudinaryResult.secure_url || cloudinaryResult.url;
                    console.log("[handleCreateContent] File uploaded to Cloudinary, URL:", finalUrl);
                    
                    // Optionally upload to Strapi for backup/reference (non-blocking)
                    try {
                        const strapiFile = await uploadStrapiFile(pendingFileToUpload, "Contents");
                        setUploadedStrapiFile(strapiFile);
                        console.log("[handleCreateContent] File also uploaded to Strapi, ID:", strapiFile.id);
                    } catch (strapiError) {
                        console.warn("[handleCreateContent] Strapi upload failed (non-critical):", strapiError);
                        // Don't fail if Strapi upload fails - Cloudinary is the primary source
                    }
                    
                    // Clear pending file after successful upload
                    setPendingFileToUpload(null);
                } catch (uploadError) {
                    console.error("Error uploading file to Cloudinary:", uploadError);
                    toast.error("Failed to upload file. Please try again.");
                    throw uploadError;
                }
            } else if (contentFormData.url) {
                // Use provided URL (external URLs or already uploaded)
                finalUrl = contentFormData.url;
            }
            
            // For article type, use article field instead of url field
            const isArticleType = selectedContentType === "article";
            const articleContent = isArticleType ? contentFormData.url : undefined;
            const urlForNonArticle = !isArticleType ? finalUrl : undefined;
            
            const createdContent = await createCourseContentForMaterial({
                course_material: selectedMaterialId,
                    name: contentFormData.name,
                    type: selectedContentType,
                instructor: contentFormData.instructor || undefined,
                    estimated_minutes: contentFormData.estimated_minutes,
                    is_preview: contentFormData.is_preview,
                url: urlForNonArticle, // Cloudinary URL for uploaded files, or external URL (not for article)
                article: articleContent, // Rich text content for article type
                    duration_seconds: contentFormData.duration_seconds,
                    can_track_progress: contentFormData.can_track_progress,
                    url_provider: contentFormData.url_provider,
                url_metadata: contentFormData.url_metadata ?? undefined,
                url_checked_at: contentFormData.url_checked_at ?? undefined,
                order_index: (contentsByMaterial[selectedMaterialId]?.length || 0),
                // Don't attach media file ID - we're using url field instead
                // mediaFileId: uploadedStrapiFile?.id || undefined,
                // Copyright fields
                copyright_check_status: contentFormData.copyright_check_status || undefined,
                copyright_check_result: contentFormData.copyright_check_result || undefined,
                copyright_check_date: contentFormData.copyright_check_date || undefined,
                copyright_check_provider: contentFormData.copyright_check_provider || undefined,
                copyright_violations: contentFormData.copyright_violations || undefined,
                copyright_warnings: contentFormData.copyright_warnings || undefined,
                video_fingerprint: contentFormData.video_fingerprint || undefined,
                copyright_check_metadata: contentFormData.copyright_check_metadata || undefined,
            });
            
            // Clear uploaded file state after successful creation
            setUploadedStrapiFile(null);

            if (!createdContent) {
                throw new Error("Failed to create content");
            }

            setContentsByMaterial((prev) => ({
                ...prev,
                [selectedMaterialId]: [...(prev[selectedMaterialId] || []), createdContent],
            }));
            setInitialContents((prev) => ({
                ...prev,
                [selectedMaterialId]: [...(prev[selectedMaterialId] || []), createdContent],
            }));
            
            // Update progress to success
            setSaveProgressList((prev) =>
                prev.map((item) =>
                    item.id === progressId ? { ...item, status: "success" as const } : item
                )
            );
            
            // Remove from progress after 2 seconds
            setTimeout(() => {
                setSaveProgressList((prev) => prev.filter((item) => item.id !== progressId));
            }, 2000);
        
            // Reload content from server to get fresh data (especially instructor)
            try {
                const freshContents = await getCourseContentsForMaterial(selectedMaterialId);
                setContentsByMaterial((prev) => ({
                    ...prev,
                    [selectedMaterialId]: freshContents,
                }));
                setInitialContents((prev) => ({
                    ...prev,
                    [selectedMaterialId]: freshContents,
                }));
                
                // Update contentViewerWorkspace if viewing this content
                if (contentViewerWorkspace && contentViewerWorkspace.content.id === createdContent.id) {
                    const updatedContent = freshContents.find(c => c.id === createdContent.id);
                    if (updatedContent) {
                        setContentViewerWorkspace({
                            ...contentViewerWorkspace,
                            content: updatedContent,
                        });
                    }
                }
            } catch (error) {
                console.error("Error reloading content after create:", error);
            }
            
            // Reload collaborating instructors to ensure fresh data
            try {
                const userResponse = await strapi.get('/api/users/me');
                const currentUserId = userResponse.data?.id || null;
                if (currentUserId) {
                    const freshInstructors = await getCollaboratingInstructors(currentUserId);
                    setCollaboratingInstructors(freshInstructors);
                }
            } catch (error) {
                console.error("Error reloading collaborating instructors:", error);
            }
        
            // Don't close the builder - stay in edit view
            // Update editingContent to the newly created content
            setEditingContent(createdContent);
            setContentFormData((prev) => ({
                ...prev,
                name: createdContent.name,
                instructor: createdContent.instructor as number | null,
                estimated_minutes: createdContent.estimated_minutes,
                is_preview: createdContent.is_preview,
                duration_seconds: createdContent.duration_seconds,
                can_track_progress: createdContent.can_track_progress,
            }));
            
            toast.success("Content created and saved.");

            // Handle certificate linking if applicable
            if (selectedContentType === "certificate" && contentFormData.url) {
                const certificateId = decodeCertificateRef(contentFormData.url);
                if (certificateId) {
                    const certificate = certificateLibrary.find((item) => item.id === certificateId);
                    if (certificate) {
                        await updateCertificateProgram(certificate.documentId, {
                            course_content: createdContent.id,
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Error creating content:", error);
            setSaveProgressList((prev) =>
                prev.map((item) =>
                    item.id === progressId
                        ? { ...item, status: "error" as const, errorMessage: "Failed to create content" }
                        : item
                )
            );
            toast.error("Failed to create content.");
        }
    };

    const handleEditMaterial = (material: CourseMaterialEntity) => {
        setEditingMaterial(material);
        setMaterialFormData({
            name: material.name,
            description: material.description || "",
        });
        setShowMaterialEditModal(true);
    };

    const handleUpdateMaterial = async () => {
        if (!editingMaterial) return;
        if (!materialFormData.name.trim()) {
            toast.error("Material name is required.");
            return;
        }
        
        const progressId = `material-${editingMaterial.id}-${Date.now()}`;
        
        // Add to progress list
        setSaveProgressList((prev) => [
            ...prev,
            { id: progressId, type: "material", name: materialFormData.name, status: "saving" },
        ]);
        
        try {
        const updated = await updateCourseMaterial(editingMaterial.id, {
            name: materialFormData.name,
            description: materialFormData.description,
        });
        if (!updated) {
                throw new Error("Failed to update material");
        }
        setMaterials((prev) =>
            prev.map((m) => (m.id === editingMaterial.id ? updated : m))
        );
            setInitialMaterials((prev) =>
                prev.map((m) => (m.id === editingMaterial.id ? updated : m))
            );
            
            // Reload contents for the updated material
            try {
                const contents = await getCourseContentsForMaterial(updated.id);
                setContentsByMaterial((prev) => ({
                    ...prev,
                    [updated.id]: contents,
                }));
            } catch (error) {
                console.error("Error reloading contents after material update:", error);
            }
            
            // Update progress to success
            setSaveProgressList((prev) =>
                prev.map((item) =>
                    item.id === progressId ? { ...item, status: "success" as const } : item
                )
            );
            
            // Remove from progress after 2 seconds
            setTimeout(() => {
                setSaveProgressList((prev) => prev.filter((item) => item.id !== progressId));
            }, 2000);
            
        setShowMaterialEditModal(false);
        setEditingMaterial(null);
        setMaterialFormData({ name: "", description: "" });
        toast.success("Material updated successfully!");
        } catch (error) {
            console.error("Error updating material:", error);
            setSaveProgressList((prev) =>
                prev.map((item) =>
                    item.id === progressId
                        ? { ...item, status: "error" as const, errorMessage: "Failed to update material" }
                        : item
                )
            );
            toast.error("Failed to update material.");
        }
    };

    const handleDeleteMaterial = async (materialId: number) => {
        if (!confirm("Are you sure you want to delete this material? All contents, quiz sections, quizzes, and quiz lines in this material will also be permanently deleted.")) {
            return;
        }
        
        // Show loading toast
        const loadingToast = toast.loading("Deleting material and all related content...");
        
        try {
            // Use cascading delete to ensure all child entities are deleted
            const success = await deleteCourseMaterialWithCascade(materialId);
            
        if (!success) {
                toast.error("Failed to delete material and related content.", { id: loadingToast });
            return;
        }
            
            // Update local state
        setMaterials((prev) => prev.filter((m) => m.id !== materialId));
        setContentsByMaterial((prev) => {
            const newContents = { ...prev };
            delete newContents[materialId];
            return newContents;
        });
            
            toast.success("Material and all related content deleted successfully!", { id: loadingToast });
        } catch (error) {
            console.error("Error deleting material:", error);
            toast.error("An error occurred while deleting the material.", { id: loadingToast });
        }
    };

    const openSpecialBuilder = (
        type: "quiz",
        materialId: number,
        content?: CourseContentEntity,
    ) => {
        // Extract instructor ID from content - handle both number and object formats
        let editingInstructor: number | null = null;
        if (content?.instructor) {
            if (typeof content.instructor === 'number') {
                editingInstructor = content.instructor;
            } else if (typeof content.instructor === 'object' && content.instructor !== null) {
                editingInstructor = (content.instructor as any)?.id || null;
            }
        }
        
        // Set content form data
        setContentFormData({
            name: content?.name || "",
            instructor: editingInstructor,
            estimated_minutes: content?.estimated_minutes || 15,
            is_preview: content?.is_preview || false,
            duration_seconds: content?.duration_seconds || 0,
            can_track_progress: content?.can_track_progress ?? true,
            url: "",
            url_provider: "unknown",
            url_metadata: null,
            url_checked_at: null,
        });
        
        // For quiz, we don't use the old config structure anymore
        // QuizBuilder will load quiz sections from the content ID
        setSpecialContentBuilder({
            type,
            materialId,
            editingContent: content ?? null,
            config: createDefaultQuizConfig(), // Not used by new QuizBuilder, but kept for type compatibility
        });
    };

    const handleEditContent = (content: CourseContentEntity, materialId: number) => {
        setSelectedMaterialId(materialId);
        if (content.type === "certificate") {
            openCertificateAttachModal(materialId, content);
            return;
        }
        if (isSpecialContentType(content.type)) {
            setEditingContent(content);
            openSpecialBuilder(content.type, materialId, content);
            setSelectedContentType(content.type);
            return;
        }
        openStandardBuilder(content.type as StandardContentType, materialId, content);
    };

    const closeSpecialBuilder = () => {
        setSpecialContentBuilder(null);
        setEditingContent(null);
        setSelectedContentType(null);
        // Reset content form data
        setContentFormData({
            name: "",
            instructor: null,
            estimated_minutes: 0,
            is_preview: false,
            duration_seconds: 0,
            can_track_progress: false,
            url: "",
            url_provider: "unknown",
            url_metadata: null,
            url_checked_at: null,
        });
    };

    const handleSpecialBuilderSave = async () => {
        if (!specialContentBuilder || !specialContentBuilder.materialId) {
            toast.error("Select a material to attach this content.");
            return;
        }

        const { materialId, config, editingContent } = specialContentBuilder;
        const displayName = config.title?.trim() || "Untitled Quiz";
        const estimatedMinutes = config.estimatedMinutes;
        const encodedPayload = encodeSpecialContentPayload("quiz", config);

        if (editingContent) {
            const updated = await updateCourseContentForMaterial(editingContent.id, {
                name: displayName,
                type: "quiz",
                estimated_minutes: estimatedMinutes,
                url: encodedPayload,
            });
            if (!updated) {
                toast.error("Failed to update content.");
            return;
        }
        setContentsByMaterial((prev) => ({
            ...prev,
                [materialId]: (prev[materialId] || []).map((c) =>
                    c.id === editingContent.id ? { ...updated, url: encodedPayload } : c
                ),
            }));
            toast.success("Quiz updated.");
            closeSpecialBuilder();
            return;
        }

        const pendingMaterial = pendingMaterials.find(
            (pm) => pm.tempId === materialId.toString(),
        );
        const materialTempId = pendingMaterial?.tempId || materialId.toString();
        const existingContents = contentsByMaterial[materialId] || [];
        const pendingContentsForMaterial = pendingContents[materialTempId] || [];
        const order_index = existingContents.length + pendingContentsForMaterial.length;
        const tempId = generateTempId("temp-content");
        const pendingEntry: PendingContentEntry = {
                    tempId,
                    materialTempId,
                    name: displayName,
                    type: "quiz",
                    instructor: null,
                    estimated_minutes: estimatedMinutes,
                    is_preview: false,
                    url: encodedPayload,
                    order_index,
                    config,
            status: "saving",
        };

        setPendingContents((prev) => ({
            ...prev,
            [materialTempId]: [...(prev[materialTempId] || []), pendingEntry],
        }));
        toast.info("Saving quiz content...");
        persistPendingContent(materialId, materialTempId, pendingEntry, { silent: true });
        closeSpecialBuilder();
    };

    const updateQuizConfig = (updater: (config: QuizBuilderConfig) => QuizBuilderConfig) => {
        setSpecialContentBuilder((prev) => {
            if (!prev || prev.type !== "quiz") return prev;
            return {
                ...prev,
                config: updater(prev.config),
            };
        });
    };

    const addQuizQuestionBlock = () => {
        updateQuizConfig((config) => ({
            ...config,
            questions: [...config.questions, createQuizQuestion()],
        }));
    };

    const removeQuizQuestionBlock = (questionId: string) => {
        updateQuizConfig((config) => {
            if (config.questions.length === 1) return config;
            return {
                ...config,
                questions: config.questions.filter((q) => q.id !== questionId),
            };
        });
    };

    const updateQuizQuestion = (questionId: string, updates: Partial<QuizBuilderQuestion>) => {
        updateQuizConfig((config) => ({
            ...config,
            questions: config.questions.map((q) =>
                q.id === questionId ? { ...q, ...updates } : q,
            ),
        }));
    };

    const updateQuizOption = (questionId: string, index: number, value: string) => {
        updateQuizConfig((config) => ({
            ...config,
            questions: config.questions.map((q) =>
                q.id === questionId
                    ? {
                        ...q,
                        options: q.options.map((option, idx) => (idx === index ? value : option)),
                    }
                    : q,
            ),
        }));
    };

    const addQuizOption = (questionId: string) => {
        updateQuizConfig((config) => ({
            ...config,
            questions: config.questions.map((q) =>
                q.id === questionId
                    ? {
                        ...q,
                        options: [...q.options, ""],
                    }
                    : q,
            ),
        }));
    };

    const removeQuizOption = (questionId: string, index: number) => {
        updateQuizConfig((config) => ({
            ...config,
            questions: config.questions.map((q) => {
                if (q.id !== questionId || q.options.length <= 2) return q;
                const options = q.options.filter((_, idx) => idx !== index);
                let correctIndex = q.correctIndex;
                if (correctIndex >= options.length) {
                    correctIndex = options.length - 1;
                } else if (index <= correctIndex && correctIndex > 0) {
                    correctIndex -= 1;
                }
                return {
                    ...q,
                    options,
                    correctIndex,
                };
            }),
        }));
    };

    const handleUpdateContent = async () => {
        if (!editingContent || !selectedMaterialId || !selectedContentType) return;
        if (!contentFormData.name.trim()) {
            toast.error("Content name is required.");
            return;
        }
        const progressId = `content-${editingContent.id}-${Date.now()}`;
        
        // Add to progress list
        setSaveProgressList((prev) => [
            ...prev,
            { id: progressId, type: "content", name: contentFormData.name, status: "saving" },
        ]);
        
        try {
            // Upload file to Cloudinary first, then optionally to Strapi for backup
            // Store Cloudinary URL in url field for all content types
            // Extract old Cloudinary public_id from URL for deletion
            let oldCloudinaryPublicId: string | null = null;
            if (editingContent?.url) {
                const extractedId = extractCloudinaryPublicId(editingContent.url);
                if (extractedId) {
                    oldCloudinaryPublicId = extractedId;
                }
            }
            
            let finalUrl: string | undefined = undefined;
            if (pendingFileToUpload) {
                try {
                    // Upload to Cloudinary first
                    const resourceType = pendingFileToUpload.type.startsWith("video/") ? "video" 
                        : pendingFileToUpload.type.startsWith("audio/") ? "video" 
                        : pendingFileToUpload.type.startsWith("image/") ? "image"
                        : "raw";
                    
                    const cloudinaryResult = await uploadToCloudinary(pendingFileToUpload, {
                        folder: "Contents",
                        resource_type: resourceType,
                    });
                    
                    finalUrl = cloudinaryResult.secure_url || cloudinaryResult.url;
                    console.log("[handleUpdateContent] File uploaded to Cloudinary, URL:", finalUrl);
                    
                    // Delete old Cloudinary file if exists
                    if (oldCloudinaryPublicId && cloudinaryResult.public_id !== oldCloudinaryPublicId) {
                        try {
                            await deleteFromCloudinary(oldCloudinaryPublicId);
                            console.log("[handleUpdateContent] Old Cloudinary file deleted:", oldCloudinaryPublicId);
                        } catch (deleteError: any) {
                            // Don't fail if file doesn't exist
                            console.warn("[handleUpdateContent] Failed to delete old Cloudinary file:", deleteError);
                        }
                    }
                    
                    // Optionally upload to Strapi for backup/reference (non-blocking)
                    try {
                        const strapiFile = await uploadStrapiFile(pendingFileToUpload, "Contents");
                        setUploadedStrapiFile(strapiFile);
                        console.log("[handleUpdateContent] File also uploaded to Strapi, ID:", strapiFile.id);
                    } catch (strapiError) {
                        console.warn("[handleUpdateContent] Strapi upload failed (non-critical):", strapiError);
                        // Don't fail if Strapi upload fails - Cloudinary is the primary source
                    }
                    
                    // Clear pending file after successful upload
                    setPendingFileToUpload(null);
                } catch (uploadError) {
                    console.error("Error uploading file to Cloudinary:", uploadError);
                    toast.error("Failed to upload file. Please try again.");
                    throw uploadError;
                }
            } else if (contentFormData.url) {
                // Use provided URL (external URLs or already uploaded)
                finalUrl = contentFormData.url;
            }
            
            // For article type, use article field instead of url field
            const isArticleType = selectedContentType === "article";
            const articleContent = isArticleType ? contentFormData.url : undefined;
            const urlForNonArticle = !isArticleType ? finalUrl : undefined;
            
        const updated = await updateCourseContentForMaterial(editingContent.id, {
            name: contentFormData.name,
            instructor: contentFormData.instructor || undefined,
            estimated_minutes: contentFormData.estimated_minutes,
            is_preview: contentFormData.is_preview,
            url: urlForNonArticle, // Cloudinary URL for uploaded files, or external URL (not for article)
            article: articleContent, // Rich text content for article type
            duration_seconds: contentFormData.duration_seconds,
            can_track_progress: contentFormData.can_track_progress,
            url_provider: contentFormData.url_provider,
            url_metadata: contentFormData.url_metadata || undefined,
            url_checked_at: contentFormData.url_checked_at || undefined,
            // Don't attach media file ID - we're using url field instead
            // mediaFileId: uploadedStrapiFile?.id || undefined,
            // Copyright fields
            copyright_check_status: contentFormData.copyright_check_status || undefined,
            copyright_check_result: contentFormData.copyright_check_result || undefined,
            copyright_check_date: contentFormData.copyright_check_date || undefined,
            copyright_check_provider: contentFormData.copyright_check_provider || undefined,
            copyright_violations: contentFormData.copyright_violations || undefined,
            copyright_warnings: contentFormData.copyright_warnings || undefined,
            video_fingerprint: contentFormData.video_fingerprint || undefined,
            copyright_check_metadata: contentFormData.copyright_check_metadata || undefined,
        });
        if (!updated) {
                throw new Error("Failed to update content");
        }
        setContentsByMaterial((prev) => {
            const nextList = (prev[selectedMaterialId] || []).map((c) =>
                c.id === editingContent.id ? updated : c,
            );
            setInitialContents((initialPrev) => ({
                ...initialPrev,
                [selectedMaterialId]: nextList,
            }));
            return {
                ...prev,
                [selectedMaterialId]: nextList,
            };
        });
            
            // Update progress to success
            setSaveProgressList((prev) =>
                prev.map((item) =>
                    item.id === progressId ? { ...item, status: "success" as const } : item
                )
            );
            
            // Remove from progress after 2 seconds
            setTimeout(() => {
                setSaveProgressList((prev) => prev.filter((item) => item.id !== progressId));
            }, 2000);
            
            // Reload content from server to get fresh data (especially instructor)
            try {
                const freshContents = await getCourseContentsForMaterial(selectedMaterialId);
                setContentsByMaterial((prev) => ({
                    ...prev,
                    [selectedMaterialId]: freshContents,
                }));
                setInitialContents((prev) => ({
                    ...prev,
                    [selectedMaterialId]: freshContents,
                }));
                
                // Update editingContent with fresh data
                const updatedContent = freshContents.find(c => c.id === editingContent.id);
                if (updatedContent) {
                    setEditingContent(updatedContent);
                    
                    // Update contentFormData with fresh data
                    let editingInstructor: number | null = null;
                    if (updatedContent.instructor) {
                        if (typeof updatedContent.instructor === 'number') {
                            editingInstructor = updatedContent.instructor;
                        } else if (typeof updatedContent.instructor === 'object' && updatedContent.instructor !== null) {
                            editingInstructor = (updatedContent.instructor as any)?.id || null;
                        }
                    }
                    
                    setContentFormData({
                        name: updatedContent.name,
                        instructor: editingInstructor,
                        estimated_minutes: updatedContent.estimated_minutes || 0,
                        is_preview: updatedContent.is_preview || false,
                        duration_seconds: updatedContent.duration_seconds || 0,
                        can_track_progress: updatedContent.can_track_progress || false,
                        url: getContentDisplayUrl(updatedContent) || "",
                        url_provider: (updatedContent.url_provider as UrlProvider) || "unknown",
                        url_metadata: (updatedContent.url_metadata as Record<string, unknown>) || null,
                        url_checked_at: updatedContent.url_checked_at || null,
                        copyright_check_status: (updatedContent.copyright_check_status as CopyrightCheckStatus) || null,
                        copyright_check_result: (updatedContent.copyright_check_result as Record<string, unknown>) || null,
                        copyright_check_date: updatedContent.copyright_check_date || null,
                        copyright_check_provider: updatedContent.copyright_check_provider || null,
                        copyright_violations: updatedContent.copyright_violations || null,
                        copyright_warnings: updatedContent.copyright_warnings || null,
                        video_fingerprint: updatedContent.video_fingerprint || null,
                        copyright_check_metadata: (updatedContent.copyright_check_metadata as Record<string, unknown>) || null,
                    });
                }
                
                // Update contentViewerWorkspace if viewing this content
                if (contentViewerWorkspace && contentViewerWorkspace.content.id === editingContent.id) {
                    const updatedContent = freshContents.find(c => c.id === editingContent.id);
                    if (updatedContent) {
                        setContentViewerWorkspace({
                            ...contentViewerWorkspace,
                            content: updatedContent,
                        });
                    }
                }
            } catch (error) {
                console.error("Error reloading content after update:", error);
            }
            
            // Reload collaborating instructors to ensure fresh data
            try {
                const userResponse = await strapi.get('/api/users/me');
                const currentUserId = userResponse.data?.id || null;
                if (currentUserId) {
                    const freshInstructors = await getCollaboratingInstructors(currentUserId);
                    setCollaboratingInstructors(freshInstructors);
                }
            } catch (error) {
                console.error("Error reloading collaborating instructors:", error);
            }
            
            // Don't close the builder - stay in edit view
        toast.success("Content updated successfully!");
        } catch (error) {
            console.error("Error updating content:", error);
            setSaveProgressList((prev) =>
                prev.map((item) =>
                    item.id === progressId
                        ? { ...item, status: "error" as const, errorMessage: "Failed to update content" }
                        : item
                )
            );
            toast.error("Failed to update content.");
        }
    };

    const handleDeleteContent = async (content: CourseContentEntity, materialId: number) => {
        if (!confirm("Are you sure you want to delete this content?")) {
            return;
        }
        const certificateId = content.type === "certificate" ? decodeCertificateRef(content.url) : null;
        if (certificateId) {
            const certificate = certificateLibrary.find((item) => item.id === certificateId);
            if (certificate) {
                await updateCertificateProgram(certificate.documentId, { course_content: null });
            }
        }
        const success = await deleteCourseContentForMaterial(content.id);
        if (!success) {
            toast.error("Failed to delete content.");
            return;
        }
        setContentsByMaterial((prev) => {
            const filtered = (prev[materialId] || []).filter((c) => c.id !== content.id);
            setInitialContents((initialPrev) => ({
                ...initialPrev,
                [materialId]: filtered,
            }));
            return {
                ...prev,
                [materialId]: filtered,
            };
        });
        loadCertificates();
        toast.success("Content deleted successfully!");
    };

    const handleReorderContent = async (
        materialId: number,
        contentId: number,
        direction: "up" | "down",
    ) => {
        const currentList = contentsByMaterial[materialId];
        if (!currentList?.length) return;
        const fromIndex = currentList.findIndex((c) => c.id === contentId);
        if (fromIndex === -1) return;
        const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
        if (toIndex < 0 || toIndex >= currentList.length) return;

        const previousList = currentList.map((item) => ({ ...item }));
        const reordered = [...currentList];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);
        const reindexed = reordered.map((content, idx) => ({
            ...content,
            order_index: idx,
        }));

        setContentsByMaterial((prev) => ({
            ...prev,
            [materialId]: reindexed,
        }));

        try {
            await Promise.all(
                reindexed.map((content) =>
                    updateCourseContentForMaterial(content.id, { order_index: content.order_index }),
                ),
            );
            setInitialContents((prev) => ({
                ...prev,
                [materialId]: reindexed,
            }));
            toast.success("Content order updated.");
        } catch (error) {
            console.error("Failed to reorder content:", error);
            setContentsByMaterial((prev) => ({
                ...prev,
                [materialId]: previousList,
            }));
            toast.error("Failed to update order. Please try again.");
        }
    };

    const handleViewContent = (content: CourseContentEntity, materialId: number) => {
        openContentViewer(content, materialId);
    };

    // Batch save function with multi-step loader

    /**
     * Check ALL course content for copyright issues
     * Returns content items that have copyright problems
     * Rule: Only "passed" status means NO copyright issues. Everything else (pending, checking, null) = HAS copyright issues
     */
    const checkAllContentCopyright = (): Array<{
        content: CourseContentEntity;
        material: CourseMaterialEntity;
        status: CopyrightCheckStatus | null;
        violations?: any[];
        warnings?: any[];
    }> => {
        const issues: Array<{
            content: CourseContentEntity;
            material: CourseMaterialEntity;
            status: CopyrightCheckStatus | null;
            violations?: any[];
            warnings?: any[];
        }> = [];

        console.log("[Copyright Check] Starting check - Total materials:", Object.keys(contentsByMaterial).length);

        // Check ALL content in the course - filter by copyright_check_status field
        Object.entries(contentsByMaterial).forEach(([materialId, contents]) => {
            const material = materials.find(m => m.id === Number(materialId));
            if (!material) {
                console.warn("[Copyright Check] Material not found for ID:", materialId);
            return;
        }
        
            console.log(`[Copyright Check] Checking material "${material.name}" - ${contents.length} contents`);

            contents.forEach((content) => {
                // Check ALL content types that have copyright_check_status field
                // The copyright field exists for video and audio, but we check all to be safe
                const copyrightStatus = content.copyright_check_status;
                
                // Rule: Only "passed" means NO copyright issues
                // Everything else (pending, checking, null, undefined) = HAS copyright issues
                const hasCopyrightIssue = copyrightStatus !== "passed";
                
                // Also check if there are violations or warnings (even if status is "passed")
                const hasViolations = content.copyright_violations && Array.isArray(content.copyright_violations) && content.copyright_violations.length > 0;
                const hasWarnings = content.copyright_warnings && Array.isArray(content.copyright_warnings) && content.copyright_warnings.length > 0;
                
                // If status is not "passed" OR has violations/warnings, it's an issue
                if (hasCopyrightIssue || hasViolations || hasWarnings) {
                    console.log("[Copyright Check] ❌ Found copyright issue:", {
                        contentName: content.name,
                        contentType: content.type,
                        copyrightStatus: copyrightStatus,
                        hasViolations: hasViolations,
                        hasWarnings: hasWarnings,
                        materialName: material.name
                    });
                    
                    issues.push({
                        content,
                        material,
                        status: copyrightStatus || "pending" as CopyrightCheckStatus,
                        violations: content.copyright_violations || undefined,
                        warnings: content.copyright_warnings || undefined,
                    });
                    } else {
                    console.log("[Copyright Check] ✅ No copyright issue:", {
                        contentName: content.name,
                        contentType: content.type,
                        copyrightStatus: copyrightStatus
                    });
                }
            });
        });

        console.log("[Copyright Check] ========================================");
        console.log("[Copyright Check] Total copyright issues found:", issues.length);
        if (issues.length > 0) {
            console.log("[Copyright Check] Issues details:", issues.map(i => ({
                content: i.content.name,
                type: i.content.type,
                status: i.status,
                material: i.material.name
            })));
        }
        console.log("[Copyright Check] ========================================");
        
        return issues;
    };

    const handleSubmitCourse = async () => {
        const baseCourse = await ensureCourseCreated();
        if (!baseCourse) return;
        
        // Validation Rule:
        // - If content does NOT have copyright issues -> allow published (OK)
        // - If content HAS copyright issues BUT course is NOT paid -> allow published (OK)
        // - If content HAS copyright issues AND course IS paid -> DO NOT allow published (BLOCK)
        
        // Check ALL content for copyright issues BEFORE allowing publication
        // Only block publishing if BOTH conditions are true:
        // 1. Course status is "published"
        // 2. Course is paid (is_paid === true)
        // 3. There are copyright issues in ANY content
        if (basics.course_status === "published" && basics.is_paid) {
            console.log("[Copyright Check] ========== VALIDATION START ==========");
            console.log("[Copyright Check] Course status:", basics.course_status);
            console.log("[Copyright Check] Course is paid:", basics.is_paid);
            console.log("[Copyright Check] Total materials:", materials.length);
            console.log("[Copyright Check] Total contents:", Object.values(contentsByMaterial).flat().length);
            
            const issues = checkAllContentCopyright();
            
            console.log("[Copyright Check] Validation result:", {
                courseStatus: basics.course_status,
                isPaid: basics.is_paid,
                issuesFound: issues.length,
                willBlock: issues.length > 0
            });
            
            if (issues.length > 0) {
                console.warn("[Copyright Check] ❌ BLOCKING PUBLICATION - Paid course has copyright issues!");
                console.warn("[Copyright Check] Issues:", issues);
                setCopyrightIssues(issues);
                setShowCopyrightWarningDialog(true);
                toast.error(`Cannot publish paid course: ${issues.length} content item(s) have copyright issues`);
                setIsSubmitting(false);
                return; // Prevent publishing paid course with copyright issues - DO NOT proceed with API call
            }
            
            console.log("[Copyright Check] ✅ ALLOWING PUBLICATION - No copyright issues found");
            console.log("[Copyright Check] ========== VALIDATION END ==========");
        } else {
            console.log("[Copyright Check] Skipping validation - Course is not paid or not being published");
        }
        
        // If course is not paid OR has no copyright issues, allow publishing
        
        setIsSubmitting(true);
        setSaveProgress({ preview: 0, course: 0, materials: 0 });
        try {
            let previewId: number | null = previewEntity?.id ?? null;

            if (basics.preview_available) {
                setSaveProgress(prev => ({ ...prev, preview: 10 }));
                let previewUrl: string | undefined = undefined;
                let previewType: CoursePreviewType = previewMode;

                // Handle file uploads (image/video) - upload to Strapi which auto-uploads to Cloudinary
                let uploadedFileId: number | null = null;
                let uploadedFile: any = null;
                
                if ((previewMode === "image" || previewMode === "video") && previewFileToUpload) {
                    setIsUploadingPreview(true);
                    try {
                        // Only delete old file if updating within the same type
                        // Keep old files when switching between different types
                        if (previewEntity) {
                            const oldType = previewEntity.types;
                            const newType = previewMode;
                            
                            // Only delete if updating within the same type
                            if (oldType === "image" && newType === "image" && previewEntity.image?.id) {
                                try {
                                    await deleteStrapiFile(previewEntity.image.id);
                                    console.log("Deleted old preview image (same type update):", previewEntity.image.id);
                                } catch (deleteError) {
                                    console.warn("Failed to delete old preview image:", deleteError);
                                }
                            } else if (oldType === "video" && newType === "video" && previewEntity.video?.id) {
                                try {
                                    await deleteStrapiFile(previewEntity.video.id);
                                    console.log("Deleted old preview video (same type update):", previewEntity.video.id);
                                } catch (deleteError) {
                                    console.warn("Failed to delete old preview video:", deleteError);
                                }
                            } else {
                                // Switching types - keep old files
                                console.log(`Keeping old ${oldType} file when switching to ${newType}`);
                            }
                        }

                        // Upload to Strapi (which auto-uploads to Cloudinary)
                        setSaveProgress(prev => ({ ...prev, preview: 30 }));
                        uploadedFile = await uploadStrapiFile(previewFileToUpload, "course-previews");
                        uploadedFileId = uploadedFile.id;
                        setSaveProgress(prev => ({ ...prev, preview: 60 }));

                        toast.success(`${previewMode === "image" ? "Image" : "Video"} uploaded successfully.`);
                    } catch (error) {
                        console.error("Error uploading preview file:", error);
                        toast.error(`Failed to upload ${previewMode === "image" ? "image" : "video"}. Please try again.`);
                        setIsUploadingPreview(false);
                        return;
                    } finally {
                        setIsUploadingPreview(false);
                        setPreviewFileToUpload(null);
                    }
                } else if (previewMode === "url" && basics.preview_url) {
                    previewUrl = basics.preview_url;
                    
                    // When switching to URL, keep old image/video files (don't delete)
                    if (previewEntity) {
                        console.log("Switching to URL type - keeping old image/video files");
                    }
                }

                // Create or update CoursePreview
                setSaveProgress(prev => ({ ...prev, preview: 80 }));
                
                // Check if we need to update (either new file/URL provided OR type changed)
                const typeChanged = previewEntity && previewEntity.types !== previewType;
                const hasNewData = (previewMode === "url" && previewUrl) || 
                                   ((previewMode === "image" || previewMode === "video") && uploadedFileId);
                
                // Update if: new data provided OR type changed (even without new data)
                if (hasNewData || typeChanged) {
                    if (previewMode === "url") {
                        // For URL type
                    if (previewId && previewEntity) {
                            const updatePayload: any = {
                                types: previewType,
                            };
                            // Only update URL if new URL provided, otherwise keep existing
                            if (previewUrl) {
                                updatePayload.url = previewUrl;
                            }
                            // Don't set image/video to null - keep old files when switching types
                            
                            const updated = await updateCoursePreview(previewEntity.documentId || previewId, updatePayload);
                        if (updated) {
                            setPreviewEntity(updated);
                            previewId = updated.id;
                        }
                        } else if (previewUrl) {
                            // Only create if URL is provided
                        const created = await createCoursePreview({
                                types: previewType,
                                url: previewUrl,
                        });
                        if (created) {
                            setPreviewEntity(created);
                            previewId = created.id;
                        }
                    }
                    } else if (previewMode === "image" || previewMode === "video") {
                        // For image/video type
                        if (previewId && previewEntity) {
                            const updatePayload: any = {
                                types: previewType,
                            };
                            
                            // Only update image/video field if new file uploaded
                            if (uploadedFileId) {
                                if (previewMode === "image") {
                                    updatePayload.image = uploadedFileId;
                                } else {
                                    updatePayload.video = uploadedFileId;
                                }
                            }
                            // Don't set opposite field to null - keep old files when switching types
                            
                            const updated = await updateCoursePreview(previewEntity.documentId || previewId, updatePayload);
                            if (updated) {
                                setPreviewEntity(updated);
                                previewId = updated.id;
                            }
                        } else if (uploadedFileId) {
                            // Only create if file is uploaded
                            const createPayload: any = {
                                types: previewType,
                            };
                            
                            if (previewMode === "image") {
                                createPayload.image = uploadedFileId;
                            } else {
                                createPayload.video = uploadedFileId;
                            }
                            
                            const created = await createCoursePreview(createPayload);
                            if (created) {
                                setPreviewEntity(created);
                                previewId = created.id;
                            }
                        }
                    }
                }
            }

            // Update course with proper data format - use Strapi v5 relation syntax
            setSaveProgress(prev => ({ ...prev, preview: 100, course: 20 }));
            const updateData: any = {
                name: basics.name,
                description: basics.description,
                Price: basics.Price,
                is_paid: basics.is_paid,
                discount_type: basics.is_paid ? basics.discount_type : null,
                discount_percentage:
                    basics.is_paid && basics.discount_type === "percentage"
                        ? Number(basics.discount_percentage ?? 0)
                        : null,
                discount_fix_price:
                    basics.is_paid && basics.discount_type === "fix_price"
                        ? Number(basics.discount_fix_price ?? 0)
                        : null,
                preview_available: basics.preview_available,
                duration_minutes: basics.duration_minutes,
                course_level: basics.course_level ? { connect: [{ id: basics.course_level }] } : null,
                course_categories: basics.course_categories && basics.course_categories.length > 0 ? { set: basics.course_categories.map(id => ({ id })) } : { set: [] },
                course_tages: basics.course_tages && basics.course_tages.length > 0 ? { set: basics.course_tages.map(id => ({ id })) } : { set: [] },
                relevant_skills: basics.relevant_skills && basics.relevant_skills.length > 0 ? { set: basics.relevant_skills.map(id => ({ id })) } : { set: [] },
                course_badges: basics.course_badges && basics.course_badges.length > 0 ? { set: basics.course_badges.map(id => ({ id })) } : { set: [] },
                company: basics.company ? { connect: [{ id: basics.company }] } : null,
                currency: basics.currency ? { connect: [{ id: basics.currency }] } : null,
                instructors: basics.instructor && basics.instructor.length > 0 ? { set: basics.instructor.map(id => ({ id })) } : { set: [] },
                can_edit_after_publish: basics.can_edit_after_publish,
                active: basics.active,
                course_status: basics.course_status || "draft",
            };
            
            // Connect course_preview using documentId (for one-to-one relation)
            if (previewId && previewEntity && previewEntity.documentId) {
                // Use documentId for Strapi v5 one-to-one relations
                (updateData as any).course_preview = { connect: [{ documentId: previewEntity.documentId }] };
            } else if (previewId) {
                // Fallback: if we only have numeric id, use it (normalizeCourseUpdatePayload will handle it)
                (updateData as any).course_preview = { connect: [{ id: previewId }] };
            } else {
                (updateData as any).course_preview = null;
            }

            // Use documentId for Strapi v5 API calls (endpoint URL)
            // But relations should use numeric id, not documentId
            setSaveProgress(prev => ({ ...prev, course: 60 }));
            await updateCourseCourse(baseCourse.documentId, updateData);
            setSaveProgress(prev => ({ ...prev, course: 100 }));
            
            // Show appropriate success message based on status
            if (basics.course_status === "published") {
                toast.success("Course published successfully!");
            } else {
            toast.success("Course saved as draft.");
            }
            // Reset unsaved changes after successful save
            if (courseId) {
                setHasUnsavedChanges(false);
                // Update initial state to current state
                setInitialBasics({...basics});
                setInitialMaterials([...materials]);
                setInitialContents({...contentsByMaterial});
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to finalize course.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderBasicsStep = () => {
        return (
                    <motion.div
            key="basics"
            initial={{opacity: 0, x: 50}}
            animate={{opacity: 1, x: 0}}
            exit={{opacity: 0, x: -50}}
            transition={{duration: 0.3}}
            className="grid gap-6" // md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]
        >
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Course basics</h2>
                <p className="text-muted-foreground">
                    Define the core identity of your course.
                </p>
                        <div>
                    <Label htmlFor="name">Course title</Label>
                            <Input
                        id="name"
                        value={basics.name}
                        onChange={(e) => handleBasicsChange("name", e.target.value)}
                        placeholder="e.g., Ultra Advanced React & TypeScript"
                    />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                        value={basics.description}
                        onChange={(e) =>
                            handleBasicsChange("description", e.target.value)
                        }
                        placeholder="Describe outcomes, audience, and what makes this course unique."
                        className="min-h-32"
                    />
                        </div>
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] gap-4">
                    <div className="space-y-3 rounded-xl border bg-background/80 p-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                Pricing
                            </Label>
                                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={basics.is_paid}
                                    onCheckedChange={(checked) =>
                                        handleBasicsChange("is_paid", checked)
                                    }
                                />
                                <span className="text-xs text-muted-foreground">
                  {basics.is_paid ? "Paid" : "Free"}
                </span>
                                            </div>
                                            </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="price" className="text-xs">
                                    Base price
                                </Label>
                                <NumberInput
                                    id="price"
                                    value={basics.Price}
                                    onValueChange={(val) => handleBasicsChange("Price", val)}
                                    disabled={!basics.is_paid}
                                    minValue={0}
                                    formatOptions={
                                        basics.currency && currencies.find((c) => c.id === basics.currency)?.code === "USD"
                                            ? {
                                                style: "currency",
                                                currency: "USD",
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }
                                            : basics.currency && currencies.find((c) => c.id === basics.currency)?.code === "KHR"
                                                ? {
                                                    style: "decimal",
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0,
                                                }
                                                : undefined
                                    }
                                    endContent={
                                        basics.is_paid && basics.currency ? (
                                            <span className="text-xs text-muted-foreground">
                        {currencies.find((c) => c.id === basics.currency)?.code === "USD"
                            ? ""
                            : currencies.find((c) => c.id === basics.currency)?.code === "KHR"
                                ? "៛"
                                : currencies.find((c) => c.id === basics.currency)?.code || ""}
                      </span>
                                        ) : undefined
                                    }
                                />
                                {basics.is_paid && basics.Price > 0 && basics.currency && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatPrice(basics.Price)}
                                    </p>
                                )}
                                            </div>
                            <div>
                                <Label className="text-xs">Discount type</Label>
                                <Select
                                    value={basics.discount_type === "percentage" ? "percentage" : basics.discount_type === "fix_price" ? "fix_price" : basics.discount_type === "percentage" ? "percentage" : "none"}
                                    onValueChange={(value) =>
                                        handleBasicsChange(
                                            "discount_type",
                                            value === "none"
                                                ? null
                                                : (value as "percentage" | "fix_price")
                                        )
                                    }
                                    disabled={!basics.is_paid}
                                >
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="No discount">
                                            {basics.discount_type === "percentage" ? "Percentage" : basics.discount_type === "fix_price" ? "Fixed price" : "No discount"}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No discount</SelectItem>
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                        <SelectItem value="fix_price">Fixed price</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {basics.is_paid && (basics.discount_type === "percentage") && (
                            <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                                    <Label className="text-xs">Discount percent</Label>
                                    <NumberInput
                                        value={basics.discount_percentage || (basics as any).discount_percentage || 0}
                                        onValueChange={(val) => handleBasicsChange("discount_percentage", val)}
                                        minValue={0}
                                        maxValue={100}
                                        formatOptions={{
                                            style: "percent",
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 2,
                                        }}
                                    />
                            </div>
                                <div className="flex items-end justify-end text-xs text-muted-foreground">
                                    Effective price:{" "}
                                    <span className="ml-1 font-medium">
                    {formatPrice(getEffectivePrice())}
                  </span>
                        </div>
                            </div>
                        )}
                        {basics.is_paid && basics.discount_type === "fix_price" && (
                            <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                                    <Label className="text-xs">Discount amount</Label>
                                    <NumberInput
                                        value={basics.discount_fix_price}
                                        onValueChange={(val) => handleBasicsChange("discount_fix_price", val)}
                                        minValue={0}
                                        formatOptions={
                                            basics.currency && currencies.find((c) => c.id === basics.currency)?.code === "USD"
                                                ? {
                                                    style: "currency",
                                                    currency: "USD",
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                }
                                                : basics.currency && currencies.find((c) => c.id === basics.currency)?.code === "KHR"
                                                    ? {
                                                        style: "decimal",
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 0,
                                                    }
                                                    : undefined
                                        }
                                        endContent={
                                            basics.currency ? (
                                                <span className="text-xs text-muted-foreground">
                          {currencies.find((c) => c.id === basics.currency)?.code === "USD"
                              ? ""
                              : currencies.find((c) => c.id === basics.currency)?.code === "KHR"
                                  ? "៛"
                                  : currencies.find((c) => c.id === basics.currency)?.code || ""}
                        </span>
                                            ) : undefined
                                        }
                                    />
                            </div>
                                <div className="flex items-end justify-end text-xs text-muted-foreground">
                                    Effective price:{" "}
                                    <span className="ml-1 font-medium">
                    {formatPrice(getEffectivePrice())}
                  </span>
                        </div>
                                        </div>
                                    )}
                                                    </div>
                    <div>
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <NumberInput
                            id="duration"
                            value={basics.duration_minutes}
                            onValueChange={(val) => handleBasicsChange("duration_minutes", Math.floor(val))}
                            minValue={0}
                            endContent={<span className="text-xs text-muted-foreground">min</span>}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            Approximate total runtime across all materials.
                        </p>
                                                    </div>
                                                </div>

                {/* Course Metadata Section */}
                <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-semibold">Course metadata</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                            <Label>Course level</Label>
                                                    <Select
                                value={basics.course_level?.toString() || ""}
                                onValueChange={(value) =>
                                    handleBasicsChange("course_level", value ? parseInt(value) : null)
                                }
                                                    >
                                                        <SelectTrigger>
                                    <SelectValue placeholder="Select level"/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                    {courseLevels.map((level) => (
                                        <SelectItem key={level.id} value={level.id.toString()}>
                                            {level.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                                                                </div>
                        <div>
                            <Label>Company</Label>
                            <Select
                                value={basics.company?.toString() || ""}
                                onValueChange={(value) =>
                                    handleBasicsChange("company", value ? parseInt(value) : null)
                                }
                            >
                                <SelectTrigger>
                                    {basics.company ? (() => {
                                        const selectedCompany = companies.find(c => c.id === basics.company);
                                        if (selectedCompany) {
                                            return (
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    {selectedCompany.logoUrl ? (
                                                        <span className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 dark:border-white/20">
                                                            <Image
                                                                src={selectedCompany.logoUrl}
                                                                alt={selectedCompany.name || "Company"}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </span>
                                                    ) : (
                                                        <Building2 className="w-4 h-4 flex-shrink-0 text-slate-500" />
                                                    )}
                                                    <span className="truncate">{selectedCompany.name}</span>
                                                </div>
                                            );
                                        }
                                        return <SelectValue placeholder="Select company" />;
                                    })() : (
                                        <SelectValue placeholder="Select company" />
                                    )}
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((company) => (
                                        <SelectItem key={company.id} value={company.id.toString()}>
                                            <div className="flex items-center gap-2">
                                                {company.logoUrl ? (
                                                    <span className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 dark:border-white/20">
                                                        <Image
                                                            src={company.logoUrl}
                                                            alt={company.name || "Company"}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </span>
                                                ) : (
                                                    <Building2 className="w-4 h-4 flex-shrink-0 text-slate-500" />
                                                )}
                                                <span>{company.name}</span>
                                            </div>
                                                            </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                                                                </div>
                        <div>
                            <Label>Currency</Label>
                            <Select
                                value={basics.currency?.toString() || ""}
                                onValueChange={(value) =>
                                    handleBasicsChange("currency", value ? parseInt(value) : null)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select currency"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {currencies.map((currency) => (
                                        <SelectItem key={currency.id} value={currency.id.toString()}>
                                            {currency.code} - {currency.name}
                                                            </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Instructors (Collaboration)</Label>
                            <Select
                                value=""
                                onValueChange={(value) => {
                                    const instructorId = parseInt(value);
                                    if (!basics.instructor?.includes(instructorId)) {
                                        handleBasicsChange("instructor", [
                                            ...(basics.instructor || []),
                                            instructorId,
                                        ]);
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Add instructor"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {instructors
                                        .filter((inst) => !basics.instructor?.includes(inst.id))
                                        .map((instructor) => {
                                            const avatarUrl = getAvatarUrl(instructor.avatar);
                                            const initial = (instructor.name || `I${instructor.id}`).charAt(0).toUpperCase();
                                            return (
                                                <SelectItem key={instructor.id} value={instructor.id.toString()}>
                                                                <div className="flex items-center gap-2">
                                                        {avatarUrl ? (
                                                            <img
                                                                src={avatarUrl}
                                                                alt={instructor.name || `Instructor ${instructor.id}`}
                                                                className="w-6 h-6 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                                                                {initial}
                                                            </div>
                                                        )}
                                                        <span>{instructor.name || `Instructor ${instructor.id}`}</span>
                                                                </div>
                                                            </SelectItem>
                                            );
                                        })}
                                                        </SelectContent>
                                                    </Select>
                            {basics.instructor && basics.instructor.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {basics.instructor.map((instId) => {
                                        const instructor = instructors.find((i) => i.id === instId);
                                        if (!instructor) return null;
                                        const avatarUrl = getAvatarUrl(instructor.avatar);
                                        const initial = (instructor.name || `I${instructor.id}`).charAt(0).toUpperCase();
                                        return (
                                            <div
                                                key={instId}
                                                className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-full flex items-center gap-2"
                                            >
                                                {avatarUrl ? (
                                                    <img
                                                        src={avatarUrl}
                                                        alt={instructor.name || `Instructor ${instructor.id}`}
                                                        className="w-5 h-5 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center font-medium">
                                                        {initial}
                                                </div>
                                                )}
                                                <span>{instructor.name || `Instructor ${instructor.id}`}</span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleBasicsChange(
                                                            "instructor",
                                                            basics.instructor?.filter((id) => id !== instId) || []
                                                        )
                                                    }
                                                    className="ml-1 hover:text-red-500"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                            <div>
                            <Label>Categories</Label>
                            <Select
                                value=""
                                onValueChange={(value) => {
                                    if (!basics.course_categories?.includes(parseInt(value))) {
                                        handleBasicsChange("course_categories", [
                                            ...(basics.course_categories || []),
                                            parseInt(value),
                                        ]);
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Add category"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {courseCategories
                                        .filter((cat) => !basics.course_categories?.includes(cat.id))
                                        .map((category) => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            {basics.course_categories && basics.course_categories.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {basics.course_categories.map((catId) => {
                                        const cat = courseCategories.find((c) => c.id === catId);
                                        return cat ? (
                                            <span
                                                key={catId}
                                                className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full flex items-center gap-1"
                                            >
                        {cat.name}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleBasicsChange(
                                                            "course_categories",
                                                            basics.course_categories?.filter((id) => id !== catId) || []
                                                        )
                                                    }
                                                    className="hover:text-red-500"
                                                >
                          ×
                        </button>
                      </span>
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </div>
                        <div>
                            <Label>Tags</Label>
                            <Select
                                value=""
                                onValueChange={(value) => {
                                    if (!basics.course_tages?.includes(parseInt(value))) {
                                        handleBasicsChange("course_tages", [
                                            ...(basics.course_tages || []),
                                            parseInt(value),
                                        ]);
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Add tag"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {courseTags
                                        .filter((tag) => !basics.course_tages?.includes(tag.id))
                                        .map((tag) => (
                                            <SelectItem key={tag.id} value={tag.id.toString()}>
                                                {tag.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            {basics.course_tages && basics.course_tages.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {basics.course_tages.map((tagId) => {
                                        const tag = courseTags.find((t) => t.id === tagId);
                                        return tag ? (
                                            <span
                                                key={tagId}
                                                className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full flex items-center gap-1"
                                            >
                        {tag.name}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleBasicsChange(
                                                            "course_tages",
                                                            basics.course_tages?.filter((id) => id !== tagId) || []
                                                        )
                                                    }
                                                    className="hover:text-red-500"
                                                >
                          ×
                        </button>
                      </span>
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </div>
                                <div>
                            <Label>Skills</Label>
                            <Select
                                value=""
                                onValueChange={(value) => {
                                    if (!basics.relevant_skills?.includes(parseInt(value))) {
                                        handleBasicsChange("relevant_skills", [
                                            ...(basics.relevant_skills || []),
                                            parseInt(value),
                                        ]);
                                    }
                                }}
                            >
                                        <SelectTrigger>
                                    <SelectValue placeholder="Add skill"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                    {skills
                                        .filter((skill) => !basics.relevant_skills?.includes(skill.id))
                                        .map((skill) => (
                                            <SelectItem key={skill.id} value={skill.id.toString()}>
                                                {skill.name}
                                            </SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                            {basics.relevant_skills && basics.relevant_skills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {basics.relevant_skills.map((skillId) => {
                                        const skill = skills.find((s) => s.id === skillId);
                                        return skill ? (
                                            <span
                                                key={skillId}
                                                className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full flex items-center gap-1"
                                            >
                        {skill.name}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleBasicsChange(
                                                            "relevant_skills",
                                                            basics.relevant_skills?.filter((id) => id !== skillId) || []
                                                        )
                                                    }
                                                    className="hover:text-red-500"
                                                >
                          ×
                        </button>
                      </span>
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </div>
                                    <div>
                            <Label>Badges</Label>
                            <Select
                                value=""
                                onValueChange={(value) => {
                                    if (!basics.course_badges?.includes(parseInt(value))) {
                                        handleBasicsChange("course_badges", [
                                            ...(basics.course_badges || []),
                                            parseInt(value),
                                        ]);
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Add badge"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {badges
                                        .filter((badge) => !basics.course_badges?.includes(badge.id))
                                        .map((badge) => (
                                            <SelectItem key={badge.id} value={badge.id.toString()}>
                                                {badge.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            {basics.course_badges && basics.course_badges.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {basics.course_badges.map((badgeId) => {
                                        const badge = badges.find((b) => b.id === badgeId);
                                        return badge ? (
                                            <span
                                                key={badgeId}
                                                className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full flex items-center gap-1"
                                            >
                        {badge.name}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleBasicsChange(
                                                            "course_badges",
                                                            basics.course_badges?.filter((id) => id !== badgeId) || []
                                                        )
                                                    }
                                                    className="hover:text-red-500"
                                                >
                          ×
                        </button>
                      </span>
                                        ) : null;
                                    })}
                                    </div>
                            )}
                        </div>
                    </div>

                    {/* Preview Available Toggle - Same line as metadata */}
                    <div className="flex items-center gap-4 pt-2 border-t border-border/30">
                        <div className="flex items-center gap-2">
                                    <Switch
                                checked={basics.preview_available}
                                onCheckedChange={(checked) =>
                                    handleBasicsChange("preview_available", checked)
                                }
                            />
                            <Label className="text-sm font-medium">Preview available</Label>
                        </div>
                    </div>
                                </div>

                {/* Preview Source Section */}
                <div className="space-y-3">
                    {basics.preview_available && (
                        <div
                            className="rounded-xl bg-background/30 backdrop-blur-xl border border-border/30 p-4 space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Preview source
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => handlePreviewModeChange("image")}
                                    className={cn(
                                        "group relative rounded-xl p-4 transition-all duration-200",
                                        "border-2 border-transparent",
                                        "bg-background/40 backdrop-blur-sm",
                                        "hover:bg-background/60 hover:scale-[1.02]",
                                        "focus:outline-none focus:ring-2 focus:ring-primary/20",
                                        previewMode === "image"
                                            ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/10"
                                            : "hover:border-border/50"
                                    )}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={cn(
                                            "p-2.5 rounded-lg transition-colors",
                                            previewMode === "image"
                                                ? "bg-primary/20 text-primary"
                                                : "bg-muted/50 text-muted-foreground group-hover:bg-muted/70"
                                        )}>
                                            <ImageIcon className="w-5 h-5"/>
                                    </div>
                                        <span className={cn(
                                            "text-xs font-medium",
                                            previewMode === "image" ? "text-primary" : "text-muted-foreground"
                                        )}>
                      Image
                    </span>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePreviewModeChange("video")}
                                    className={cn(
                                        "group relative rounded-xl p-4 transition-all duration-200",
                                        "border-2 border-transparent",
                                        "bg-background/40 backdrop-blur-sm",
                                        "hover:bg-background/60 hover:scale-[1.02]",
                                        "focus:outline-none focus:ring-2 focus:ring-primary/20",
                                        previewMode === "video"
                                            ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/10"
                                            : "hover:border-border/50"
                                    )}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={cn(
                                            "p-2.5 rounded-lg transition-colors",
                                            previewMode === "video"
                                                ? "bg-primary/20 text-primary"
                                                : "bg-muted/50 text-muted-foreground group-hover:bg-muted/70"
                                        )}>
                                            <Video className="w-5 h-5"/>
                                        </div>
                                        <span className={cn(
                                            "text-xs font-medium",
                                            previewMode === "video" ? "text-primary" : "text-muted-foreground"
                                        )}>
                      Video
                    </span>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePreviewModeChange("url")}
                                    className={cn(
                                        "group relative rounded-xl p-4 transition-all duration-200",
                                        "border-2 border-transparent",
                                        "bg-background/40 backdrop-blur-sm",
                                        "hover:bg-background/60 hover:scale-[1.02]",
                                        "focus:outline-none focus:ring-2 focus:ring-primary/20",
                                        previewMode === "url"
                                            ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/10"
                                            : "hover:border-border/50"
                                    )}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={cn(
                                            "p-2.5 rounded-lg transition-colors",
                                            previewMode === "url"
                                                ? "bg-primary/20 text-primary"
                                                : "bg-muted/50 text-muted-foreground group-hover:bg-muted/70"
                                        )}>
                                            <LinkIcon className="w-5 h-5"/>
                                        </div>
                                        <span className={cn(
                                            "text-xs font-medium",
                                            previewMode === "url" ? "text-primary" : "text-muted-foreground"
                                        )}>
                      URL
                    </span>
                                    </div>
                                </button>
                            </div>
                            {previewMode === "url" && (
                                <div className="space-y-2">
                                    <Label className="text-xs">Preview URL (image or video)</Label>
                                <Input
                                        placeholder="https://... (YouTube, Vimeo, or image URL)"
                                        value={basics.preview_url}
                                        onChange={handlePreviewUrlChange}
                                    />
                                    {(isCheckingUrl || urlCheckResult) && (
                                        <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                                            {isCheckingUrl && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary"/>
                                                    <span className="text-muted-foreground">Checking URL...</span>
                                </div>
                                            )}
                                            {urlCheckResult && !isCheckingUrl && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    {urlCheckResult === "image" && (
                                                        <>
                                                            <CheckCircle className="w-4 h-4 text-green-500"/>
                                                            <span className="text-green-600">Valid image URL</span>
                                                        </>
                                                    )}
                                                    {urlCheckResult === "video" && (
                                                        <>
                                                            <Video className="w-4 h-4 text-blue-500"/>
                                                            <span className="text-blue-600">Valid video URL</span>
                                                        </>
                                                    )}
                                                    {urlCheckResult === "unknown" && (
                                                        <>
                                                            <LinkIcon className="w-4 h-4 text-yellow-500"/>
                                                            <span className="text-yellow-600">URL detected (type unknown)</span>
                                                        </>
                                                    )}
                        </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Course Preview Card - Same layout as Preview Source */}
                            <div
                                className="rounded-xl bg-background/30 backdrop-blur-xl border border-border/30 p-4 space-y-3">
                                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Course preview card
                                </Label>
                                <div
                                    className="aspect-video rounded-lg bg-muted/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border border-border/30">
                                    {/* Debug: Show preview mode and URL */}
                                    {previewMode === "url" && basics.preview_url ? (
                                            (() => {
                                            // Check if it's a video URL (YouTube, Vimeo, or video file)
                                            const isVideo = urlCheckResult === "video" || 
                                                          isVideoUrl(basics.preview_url) ||
                                                          basics.preview_url.includes('youtube.com') ||
                                                          basics.preview_url.includes('youtu.be') ||
                                                          basics.preview_url.includes('vimeo.com');
                                            
                                            if (isVideo) {
                                                const embedUrl = getVideoEmbedUrl(basics.preview_url);
                                                if (embedUrl) {
                                                    return (
                                                        <iframe
                                                            key={basics.preview_url}
                                                            src={embedUrl}
                                                            className="w-full h-full"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                            title="Video preview"
                                                        />
                                                    );
                                                }
                                                // Fallback for direct video URLs
                                                return (
                                                    <video
                                                        key={basics.preview_url}
                                                        src={basics.preview_url}
                                                        className="w-full h-full object-cover"
                                                        controls
                                                    />
                                                );
                                            }
                                            
                                            // Check if it's an image
                                            if (urlCheckResult === "image" || isImageUrl(basics.preview_url)) {
                                                return (
                                                    <img
                                                        key={basics.preview_url}
                                                        src={basics.preview_url}
                                                        alt="Preview from URL"
                                                        className="w-full h-full object-cover"
                                                    />
                                                );
                                            }
                                            
                                            // Still checking
                                            if (isCheckingUrl) {
                                                return (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="w-6 h-6 animate-spin"/>
                                                <span className="text-sm">Checking...</span>
                                            </div>
                                                );
                                            }
                                            
                                            // Default: try to display as iframe (for YouTube/Vimeo) or image
                                            const embedUrl = getVideoEmbedUrl(basics.preview_url);
                                            if (embedUrl) {
                                                return (
                                                    <iframe
                                                        key={basics.preview_url}
                                                        src={embedUrl}
                                                        className="w-full h-full"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        title="Video preview"
                                                    />
                                                );
                                            }
                                            
                                            // Try as image with fallback to video
                                            return (
                                                <div className="relative w-full h-full">
                                                    <img
                                                        key={basics.preview_url}
                                                        src={basics.preview_url}
                                                        alt="Preview from URL"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            // If image fails, try as video
                                                            const video = document.createElement('video');
                                                            video.src = basics.preview_url;
                                                            video.className = "w-full h-full object-cover";
                                                            video.controls = true;
                                                            const parent = e.currentTarget.parentElement;
                                                            if (parent) {
                                                                parent.appendChild(video);
                                                                e.currentTarget.style.display = 'none';
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })()
                                    ) : previewMode === "image" && previewImageSrc ? (
                                        <img
                                            src={previewImageSrc}
                                            alt="Preview image"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : previewMode === "video" && previewVideoSrc ? (
                                        <video
                                            src={previewVideoSrc}
                                            className="w-full h-full object-cover"
                                            controls
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Video className="w-8 h-8"/>
                                            <span className="text-xs">No preview available</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Per-type media picker for Course Preview model */}
                            {previewMode === "image" && (
                                    <div>
                                    <Label
                                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                                        Preview image
                                    </Label>
                                    <div
                                        className="border-2 border-dashed border-border/40 rounded-xl bg-background/20 backdrop-blur-sm p-8 text-center hover:border-primary/50 hover:bg-background/30 transition-all duration-200 relative">
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept="image/*"
                                            onChange={handlePreviewMediaChange}
                                        />
                                        <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground"/>
                                        <p className="text-xs text-muted-foreground">
                                            Click or drag & drop to upload preview image
                                        </p>
                                    </div>
                                </div>
                            )}
                            {previewMode === "video" && (
                                <div>
                                    <Label
                                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                                        Preview video file
                                    </Label>
                                    <div
                                        className="border-2 border-dashed border-border/40 rounded-xl bg-background/20 backdrop-blur-sm p-8 text-center hover:border-primary/50 hover:bg-background/30 transition-all duration-200 relative">
                                        <input
                                            type="file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept="video/*"
                                            onChange={handlePreviewMediaChange}
                                        />
                                        <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground"/>
                                        <p className="text-xs text-muted-foreground">
                                            Click or drag & drop to upload a teaser video
                                </p>
                            </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                        </div>

                        {/* Save/Cancel Buttons - Sticky at Bottom for Better UX */}
                        <div className="sticky bottom-0 mt-4 sm:mt-6 pt-3 sm:pt-4 bg-background/95 backdrop-blur-sm -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 z-10">
                            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:items-center sm:justify-between">
                                <Button
                                    variant="outline"
                                    onClick={handleCancelWithCheck}
                                    className="w-full sm:w-auto sm:min-w-[110px] h-9 sm:h-10"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmitCourse}
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto sm:min-w-[140px] h-9 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:from-blue-600 hover:to-purple-600"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save"
                                    )}
                                </Button>
                </div>
                        </div>
                    </motion.div>
    );
    };

    // Content type options for the content creation modal
    const contentTypeOptions = [
        {
            type: "video",
            label: "Video",
            icon: Video,
            description: "Upload or link a trackable video lesson.",
        },
        {
            type: "audio",
            label: "Audio",
            icon: FileAudio,
            description: "Audio lecture or podcast-style content.",
        },
        {
            type: "document",
            label: "Document",
            icon: FileIcon,
            description: "PDF or other document with preview.",
        },
        {
            type: "url",
            label: "URL",
            icon: LinkIcon,
            description: "External link (YouTube, Vimeo, article) with preview.",
        },
        {
            type: "article",
            label: "Article",
            icon: FileText,
            description: "Rich text article or long-form note.",
        },
        {
            type: "image",
            label: "Image",
            icon: ImageIcon,
            description: "Single image or illustration.",
        },
        {
            type: "quiz",
            label: "Quiz",
            icon: Target,
            description: "Interactive questions and answers.",
        },
        {
            type: "certificate",
            label: "Certificate",
            icon: Award,
            description: "Completion certificate builder.",
        },
    ] as const;

    // Render materials step - StandardContentBuilder is now extracted to a separate component

    const renderSpecialContentBuilder = () => {
        if (!specialContentBuilder || !specialContentBuilder.materialId) return null;

        return (
            <QuizBuilder
                workspace={{
                    materialId: specialContentBuilder.materialId,
                    editingContent: specialContentBuilder.editingContent || null,
                }}
                contentFormData={{
                    name: contentFormData.name || "",
                    instructor: contentFormData.instructor || null,
                    estimated_minutes: contentFormData.estimated_minutes || 0,
                    is_preview: contentFormData.is_preview || false,
                }}
                setContentFormData={setContentFormData}
                collaboratingInstructors={collaboratingInstructors || []}
                onClose={closeSpecialBuilder}
                onSave={async (): Promise<number | null> => {
                    // Save the content first, then QuizBuilder will save the quiz sections
                    if (!specialContentBuilder.materialId || !contentFormData.name.trim()) {
                        toast.error("Please enter a content name.");
                        return null;
                    }
                    
                    // Check if instructor is in collaboration
                    if (contentFormData.instructor && !collaboratingInstructors.some(inst => inst.id === contentFormData.instructor)) {
                        toast.error("Selected instructor must be in collaboration with you.");
                        return null;
                    }
                    
                    const baseCourse = await ensureCourseCreated();
                    if (!baseCourse) {
                        toast.error("Please complete the basics step before adding content.");
                        return null;
                    }
                    
                    try {
                        let contentId: number;
                        let content: CourseContentEntity;
                        
                        if (specialContentBuilder.editingContent) {
                            // Update existing content
                            const updated = await updateCourseContentForMaterial(
                                specialContentBuilder.editingContent.documentId,
                                {
                                    name: contentFormData.name,
                                    instructor: contentFormData.instructor || undefined,
                                    estimated_minutes: contentFormData.estimated_minutes,
                                    is_preview: contentFormData.is_preview,
                                }
                            );
                            if (!updated) {
                                throw new Error("Failed to update content");
                            }
                            contentId = updated.id;
                            content = updated;
                        } else {
                            // Create new content
                            const created = await createCourseContentForMaterial({
                                course_material: specialContentBuilder.materialId,
                                name: contentFormData.name,
                                type: "quiz",
                                instructor: contentFormData.instructor || undefined,
                                estimated_minutes: contentFormData.estimated_minutes,
                                is_preview: contentFormData.is_preview,
                                order_index: (contentsByMaterial[specialContentBuilder.materialId]?.length || 0),
                            });
                            if (!created) {
                                throw new Error("Failed to create content");
                            }
                            contentId = created.id;
                            content = created;
                            
                            // Update state
                            setContentsByMaterial((prev) => ({
                                            ...prev,
                                [specialContentBuilder.materialId!]: [
                                    ...(prev[specialContentBuilder.materialId!] || []),
                                    created,
                                ],
                            }));
                            setInitialContents((prev) => ({
                                                ...prev,
                                [specialContentBuilder.materialId!]: [
                                    ...(prev[specialContentBuilder.materialId!] || []),
                                    created,
                                ],
                            }));
                            
                            // Update editingContent so QuizBuilder can save quiz sections
                            setSpecialContentBuilder((prev) => ({
                                ...prev!,
                                editingContent: created,
                            }));
                        }
                        
                        // Reload to get fresh data
                        const freshContents = await getCourseContentsForMaterial(specialContentBuilder.materialId!);
                        setContentsByMaterial((prev) => ({
                                            ...prev,
                            [specialContentBuilder.materialId!]: freshContents,
                        }));
                        setInitialContents((prev) => ({
                                                ...prev,
                            [specialContentBuilder.materialId!]: freshContents,
                        }));
                        
                        // Return content ID so QuizBuilder can save quiz sections
                        return contentId;
                    } catch (error: any) {
                        console.error("Error saving quiz content:", error);
                        toast.error(error?.message || "Failed to save quiz content");
                        return null;
                    }
                }}
            />
        );
    };
    
    // Old renderSpecialContentBuilder code removed - replaced with QuizBuilder component above
    const _oldRenderSpecialContentBuilder = () => {
        if (!specialContentBuilder) return null;
        const materialName =
            materials.find((m) => m.id === specialContentBuilder.materialId)?.name ||
            pendingMaterials.find((pm) => pm.tempId === specialContentBuilder.materialId?.toString())
                ?.name ||
            "Selected material";
        const quizConfig = specialContentBuilder.config;

        return (
            <motion.div
                key={`builder-${specialContentBuilder.type}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
            >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <Button variant="ghost" onClick={closeSpecialBuilder} className="w-fit">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Course Materials
                    </Button>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline">
                            Attaching to&nbsp;<span className="font-semibold">{materialName}</span>
                        </Badge>
                        {specialContentBuilder.editingContent && (
                            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20">
                                Editing existing {specialContentBuilder.type}
                            </Badge>
                        )}
                    </div>
                </div>

                {quizConfig && (
                    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-border/40 bg-background/40 p-6 shadow-inner">
                <div className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Quiz title *</Label>
                                            <Input
                                                value={quizConfig.title}
                                                onChange={(e) =>
                                                    updateQuizConfig((cfg) => ({
                                                        ...cfg,
                                                        title: e.target.value,
                                                    }))
                                                }
                                                placeholder="e.g. Module 2 knowledge check"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Estimated minutes</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={quizConfig.estimatedMinutes}
                                                onChange={(e) =>
                                                    updateQuizConfig((cfg) => ({
                                                        ...cfg,
                                                        estimatedMinutes: Number(e.target.value) || 1,
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Passing score (%)</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={quizConfig.passingScore}
                                                onChange={(e) =>
                                                    updateQuizConfig((cfg) => ({
                                                        ...cfg,
                                                        passingScore: Math.min(
                                                            100,
                                                            Math.max(0, Number(e.target.value) || 0),
                                                        ),
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Time limit (minutes)</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={quizConfig.timeLimit}
                                                onChange={(e) =>
                                                    updateQuizConfig((cfg) => ({
                                                        ...cfg,
                                                        timeLimit: Math.max(0, Number(e.target.value) || 0),
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={quizConfig.description}
                                            onChange={(e) =>
                                                updateQuizConfig((cfg) => ({
                                                    ...cfg,
                                                    description: e.target.value,
                                                }))
                                            }
                                            placeholder="Describe the goal of this quiz."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Instructions</Label>
                                        <Textarea
                                            value={quizConfig.instructions}
                                            onChange={(e) =>
                                                updateQuizConfig((cfg) => ({
                                                    ...cfg,
                                                    instructions: e.target.value,
                                                }))
                                            }
                                            placeholder="Provide learner instructions, hints, or rules."
                                        />
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="flex items-center justify-between rounded-xl border border-border/30 p-3">
                        <div>
                                                <p className="font-medium">Shuffle questions</p>
                            <p className="text-xs text-muted-foreground">
                                                    Randomize order for each attempt.
                            </p>
                        </div>
                                            <Switch
                                                checked={quizConfig.shuffleQuestions}
                                                onCheckedChange={(checked) =>
                                                    updateQuizConfig((cfg) => ({
                                                        ...cfg,
                                                        shuffleQuestions: checked,
                                                    }))
                                                }
                                            />
                    </div>
                                        <div className="flex items-center justify-between rounded-xl border border-border/30 p-3">
                                            <div>
                                                <p className="font-medium">Show answers after submit</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Reveal correct answers & feedback.
                                                </p>
                                            </div>
                        <Switch
                            checked={quizConfig.showAnswers}
                            onCheckedChange={(checked) =>
                                updateQuizConfig((cfg) => ({
                                    ...cfg,
                                    showAnswers: checked,
                                }))
                            }
                        />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-border/40 bg-background/40 p-6 shadow-inner space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold">Quiz questions</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Build each question with answer options and scoring.
                                        </p>
                                    </div>
                                    <Button onClick={addQuizQuestionBlock}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add question
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {quizConfig.questions.map((question, index) => (
                                        <div
                                            key={question.id}
                                            className="rounded-xl border border-border/20 bg-card/40 p-5 space-y-4"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">Q{index + 1}</Badge>
                                                    <p className="text-sm text-muted-foreground">
                                                        {question.options.length} option(s)
                                                    </p>
                                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => addQuizOption(question.id)}
                                                    >
                                                        <Plus className="mr-1 h-4 w-4" />
                                                        Option
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={quizConfig.questions.length === 1}
                                                        onClick={() => removeQuizQuestionBlock(question.id)}
                                                        className="text-destructive"
                                                    >
                                                        Remove
                                                    </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                                                <Label>Prompt</Label>
                                                <Textarea
                                                    value={question.prompt}
                                                    onChange={(e) =>
                                                        updateQuizQuestion(question.id, {
                                                            prompt: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Ask the learner something meaningful..."
                                                />
                                            </div>
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label>Points</Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={question.points}
                                                        onChange={(e) =>
                                                            updateQuizQuestion(question.id, {
                                                                points: Math.max(1, Number(e.target.value) || 1),
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Hint (optional)</Label>
                                                    <Input
                                                        value={question.hint || ""}
                                                        onChange={(e) =>
                                                            updateQuizQuestion(question.id, {
                                                                hint: e.target.value,
                                                            })
                                                        }
                                                        placeholder="Provide a gentle hint."
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <Label>Answer options</Label>
                                                {question.options.map((option, optIdx) => (
                                                    <div
                                                        key={`${question.id}-${optIdx}`}
                                                        className="flex flex-col gap-2 rounded-xl border border-border/20 bg-card/30 p-3 md:flex-row md:items-center"
                                                    >
                                                        <Button
                                                            type="button"
                                                            variant={
                                                                question.correctIndex === optIdx
                                                                    ? "default"
                                                                    : "outline"
                                                            }
                                                            size="sm"
                                                            className="md:w-28"
                                                            onClick={() =>
                                                                updateQuizQuestion(question.id, {
                                                                    correctIndex: optIdx,
                                                                })
                                                            }
                                                        >
                                                            {question.correctIndex === optIdx ? "Correct" : "Mark correct"}
                                                        </Button>
                                                        <Input
                                                            value={option}
                                                            onChange={(e) =>
                                                                updateQuizOption(question.id, optIdx, e.target.value)
                                                            }
                                                            placeholder={`Option ${optIdx + 1}`}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={question.options.length <= 2}
                                                            onClick={() => removeQuizOption(question.id, optIdx)}
                                                            className="text-destructive"
                                                        >
                                                            Remove
                                                        </Button>
                                                                </div>
                        ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="rounded-2xl border border-border/40 bg-background/60 p-5 shadow-lg">
                                <h4 className="text-base font-semibold mb-3">Quiz summary</h4>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li>• {quizConfig.questions.length} question(s)</li>
                                    <li>
                                        • Total points{" "}
                                        {quizConfig.questions.reduce((sum, q) => sum + q.points, 0)}
                                    </li>
                                    <li>• Passing score {quizConfig.passingScore}%</li>
                                    <li>
                                        • Time limit{" "}
                                        {quizConfig.timeLimit > 0
                                            ? `${quizConfig.timeLimit} min`
                                            : "No limit"}
                                    </li>
                                </ul>
                            </div>
                            <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900/80 p-6 text-white space-y-4 shadow-xl">
                                <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                                    Learner experience
                                </p>
                                <h3 className="text-2xl font-semibold">{quizConfig.title || "Untitled quiz"}</h3>
                                <p className="text-sm text-white/80">
                                    {quizConfig.description || "Description will appear here."}
                                </p>
                                <div className="rounded-xl border border-white/20 p-4 space-y-2 bg-white/5">
                                    <p className="text-xs text-white/70">Instructions</p>
                                    <p className="text-sm">
                                        {quizConfig.instructions || "Provide learners with instructions."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3 border-t border-border/40 pt-4 md:flex-row md:items-center md:justify-between">
                    <Button variant="outline" onClick={closeSpecialBuilder}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSpecialBuilderSave}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:from-blue-600 hover:to-purple-600"
                    >
                        Save Quiz
                    </Button>
                                            </div>
            </motion.div>
        );
    };

    const renderMaterialsStep = () => {
        if (contentViewerWorkspace) {
            return renderContentViewer();
        }
        if (standardContentWorkspace && selectedContentType && !isSpecialContentType(selectedContentType)) {
            return (
                <StandardContentBuilder
                    workspace={standardContentWorkspace}
                    selectedContentType={selectedContentType as StandardContentType}
                    materials={materials}
                    pendingMaterials={pendingMaterials}
                    contentTypeOptions={contentTypeOptions as unknown as Array<{
                        type: string;
                        label: string;
                        icon: React.ComponentType<{ className?: string }>;
                        description: string;
                    }>}
                    contentFormData={contentFormData}
                    setContentFormData={setContentFormData}
                    setIsCheckingCopyright={setIsCheckingCopyright}
                    collaboratingInstructors={collaboratingInstructors}
                    uploadedFileInfo={uploadedFileInfo}
                    isUploading={isUploading}
                    isCheckingCopyright={isCheckingCopyright}
                    urlMetadataStatus={urlMetadataStatus}
                    urlMetadataError={urlMetadataError}
                    onClose={closeStandardBuilder}
                    onSave={handleCreateContent}
                    onUpdate={handleUpdateContent}
                    onVideoUpload={handleVideoUploadWithProgress}
                    onAudioUpload={handleAudioUploadWithProgress}
                    onDocumentUpload={handleDocumentUploadWithProgress}
                    onRefreshUrlMetadata={handleRefreshUrlMetadata}
                    onResetUploadState={resetUploadState}
                    formatFileSize={formatFileSize}
                />
            );
        }
        if (certificateAttachContext) {
            return renderCertificateSelector();
        }
        if (specialContentBuilder) {
            return renderSpecialContentBuilder();
        }

        return (
            <motion.div
                key="materials"
                initial={{opacity: 0, x: 50}}
                animate={{opacity: 1, x: 0}}
                exit={{opacity: 0, x: -50}}
                transition={{duration: 0.3}}
                className="space-y-6"
            >
                {/* Ultra-Advanced Header */}
                <div className="rounded-2xl border border-border/50 bg-card/70 p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Course Materials
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Organize your course into chapters and add rich content to each material
                            </p>
                        </div>
                        <Button
                            onClick={handleAddMaterial}
                            disabled={isCreatingMaterial}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isCreatingMaterial ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Plus className="w-4 h-4 mr-2" />
                            )}
                            {isCreatingMaterial ? "Creating..." : "Add Material"}
                        </Button>
                    </div>
                </div>

                {/* Materials List with Ultra-Advanced Design */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {/* Render existing materials */}
                        {materials.map((material, idx) => {
                            const contents = contentsByMaterial[material.id] || [];
                            const pendingList = pendingContents[material.id.toString()] || [];
                            const totalMinutes = contents.reduce((sum, c) => sum + (c.estimated_minutes || 0), 0);
                            const hours = Math.floor(totalMinutes / 60);
                            const minutes = totalMinutes % 60;
                            const durationText = hours > 0 ? `${hours} hr ${minutes > 0 ? minutes + " min" : ""}` : `${minutes} min`;

                            return (
                                <motion.div
                                    key={`material-${material.id}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group relative overflow-visible"
                                >
                                    <div className="relative rounded-2xl border border-border/40 bg-card/70 transition-all duration-500 hover:border-primary/40">
                                        {/* Material Header */}
                                        <div className="p-6 border-b border-border/40">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                                    <div className="flex-shrink-0 mt-1">
                                                        <GripVertical className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-400/30 dark:border-purple-400/30">
                                                                <span className="text-lg font-bold text-blue-600 dark:text-purple-400">
                                                                    {idx + 1}
                                                                </span>
                                                            </div>
                                                            <h3 className="font-bold text-xl text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                                {material.name}
                                                            </h3>
                                                        </div>
                                                        {material.description && (
                                                            <p className="text-sm text-muted-foreground line-clamp-2 pl-14">
                                                                {material.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-4 pl-14">
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <BookOpen className="w-4 h-4" />
                                                                <span>{contents.length} {contents.length === 1 ? "lesson" : "lessons"}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <Clock className="w-4 h-4" />
                                                                <span>{durationText}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-9 w-9 p-0 hover:text-primary"
                                                            disabled={idx === 0}
                                                            onClick={() => handleReorderMaterial(material.id, "up")}
                                                            title="Move material up"
                                                        >
                                                            <ChevronUp className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-9 w-9 p-0 hover:text-primary"
                                                            disabled={idx === materials.length - 1}
                                                            onClick={() => handleReorderMaterial(material.id, "down")}
                                                            title="Move material down"
                                                        >
                                                            <ChevronDown className="w-4 h-4" />
                                                        </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-9 w-9 p-0 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
                                                        onClick={() => handleEditMaterial(material)}
                                                        title="Edit Material"
                                                    >
                                                        <Edit className="w-4 h-4"/>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() => handleDeleteMaterial(material.id)}
                                                        title="Delete Material"
                                                    >
                                                        <Trash2 className="w-4 h-4"/>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleOpenContentTypeModal(material.id)}
                                                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg shadow-purple-500/30"
                                                    >
                                                        <Plus className="w-4 h-4 mr-1"/>
                                                        Add Content
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Items with Advanced Design */}
                                        <div className="p-6 space-y-3">
                                            {contents.length > 0 ? (
                                                <AnimatePresence>
                                                    {contents.map((content, cIdx) => (
                                                        <ContentItem
                                                                key={content.id}
                                                            content={content}
                                                            material={material}
                                                            materials={materials}
                                                            collaboratingInstructors={collaboratingInstructors}
                                                            index={cIdx}
                                                            onView={handleViewContent}
                                                            onEdit={handleEditContent}
                                                            onDelete={handleDeleteContent}
                                                            onReorder={handleReorderContent}
                                                            onMoveToMaterial={handleMoveContentToMaterial}
                                                        />
                                                    ))}
                                                </AnimatePresence>
                                            ) : (
                                                <div className="text-center py-12 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-900/30 dark:to-slate-800/20">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-400/30">
                                                            <BookOpen className="w-8 h-8 text-blue-500/50" />
                                                                    </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No content yet</p>
                                                            <p className="text-xs text-muted-foreground">Click [ Add Content ] to add your first content item</p>
                                                                </div>
                                                    </div>
                                                                </div>
                                                                            )}

                                            {pendingList.length > 0 && (
                                                <div className="space-y-2">
                                                    {pendingList.map((pending) => (
                                                        <div
                                                            key={pending.tempId}
                                                            className="rounded-xl border border-dashed border-blue-200/60 bg-blue-50/40 dark:bg-slate-900/40 p-4"
                                                        >
                                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                        {pending.name || "Untitled content"}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                                        <span className="px-2 py-0.5 rounded-full bg-white/60 dark:bg-slate-800/60">
                                                                            {pending.type}
                                                                        </span>
                                                                        <span>Pending save</span>
                                                                        </div>
                                                                    </div>
                                                                {pending.status === "saving" ? (
                                                                    <span className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-300">
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                        Saving...
                                                                    </span>
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="inline-flex items-center gap-1 text-sm text-destructive">
                                                                            <AlertCircle className="h-4 w-4" />
                                                                            Failed
                                                                        </span>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => handleRetryPendingContent(material.id, pending)}
                                                                        >
                                                                            Retry
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                                    </div>
                                                            {pending.errorMessage && (
                                                                <p className="text-xs text-destructive mt-2">{pending.errorMessage}</p>
                                                            )}
                                                                </div>
                                                    ))}
                                                                </div>
                        )}
                                                </div>
                                            </div>
            </motion.div>
        );
                        })}
                    </AnimatePresence>

                    {materials.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative overflow-hidden rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-gradient-to-br from-slate-50/50 via-white/30 to-slate-100/30 dark:from-slate-900/30 dark:via-slate-800/20 dark:to-slate-900/20 backdrop-blur-sm py-16"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
                            <div className="relative z-10 text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 mb-4">
                                    <BookOpen className="w-10 h-10 text-blue-500/60" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">No materials yet</p>
                                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                        Create your first material/chapter to start organizing your course content
                                    </p>
                                </div>
                                <Button 
                                    onClick={handleAddMaterial}
                                    className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg shadow-purple-500/30"
                                >
                                    <Plus className="w-4 h-4 mr-2"/>
                                    Add Material
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Ultra-Advanced Content Type Selection Modal */}
                <Dialog open={showContentTypeModal} onOpenChange={setShowContentTypeModal}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Add Content
                            </DialogTitle>
                            <DialogDescription className="text-base">
                                Select the type of content you want to add to this material. Each type has specialized features.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
                            <AnimatePresence>
                                {contentTypeOptions.map((opt, idx) => {
                            const Icon = opt.icon;
                                    const getTypeGradient = () => {
                                        switch (opt.type) {
                                            case "video": return "from-red-500/20 to-orange-500/20 border-red-400/30 hover:from-red-500/30 hover:to-orange-500/30";
                                            case "audio": return "from-purple-500/20 to-pink-500/20 border-purple-400/30 hover:from-purple-500/30 hover:to-pink-500/30";
                                            case "document": return "from-blue-500/20 to-cyan-500/20 border-blue-400/30 hover:from-blue-500/30 hover:to-cyan-500/30";
                                            case "article": return "from-green-500/20 to-emerald-500/20 border-green-400/30 hover:from-green-500/30 hover:to-emerald-500/30";
                                            case "image": return "from-yellow-500/20 to-amber-500/20 border-yellow-400/30 hover:from-yellow-500/30 hover:to-amber-500/30";
                                            case "url": return "from-indigo-500/20 to-blue-500/20 border-indigo-400/30 hover:from-indigo-500/30 hover:to-blue-500/30";
                                            case "quiz": return "from-violet-500/20 to-purple-500/20 border-violet-400/30 hover:from-violet-500/30 hover:to-purple-500/30";
                                            case "certificate": return "from-rose-500/20 to-pink-500/20 border-rose-400/30 hover:from-rose-500/30 hover:to-pink-500/30";
                                            default: return "from-gray-500/20 to-slate-500/20 border-gray-400/30";
                                        }
                                    };
                                    const gradient = getTypeGradient();
                            return (
                                        <motion.button
                                    key={opt.type}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                    type="button"
                                            onClick={() => handleSelectContentType(opt.type)}
                                            className={`relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br ${gradient} backdrop-blur-sm hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-1 transition-all duration-300 p-5 text-left group`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                                            <div className="relative z-10 space-y-3">
                                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center border transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                                                    <Icon className="w-7 h-7 text-primary" />
                                                    </div>
                                                <div>
                                                    <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">{opt.label}</div>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {opt.description}
                                    </p>
                                                </div>
                                            </div>
                                        </motion.button>
                            );
                        })}
                            </AnimatePresence>
                                                </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowContentTypeModal(false)}>
                                Cancel
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>


                {/* Material Edit Modal - Editable - Mobile Responsive */}
                <Dialog open={showMaterialEditModal} onOpenChange={setShowMaterialEditModal}>
                    <DialogContent className="max-w-lg w-[calc(100%-2rem)] sm:w-full">
                        <DialogHeader>
                            <DialogTitle className="text-lg sm:text-xl">Edit Material</DialogTitle>
                            <DialogDescription className="text-sm">
                                Update the material name and description.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                    <div className="space-y-2">
                                <Label htmlFor="material-name" className="text-sm">Material Name *</Label>
                                <Input
                                    id="material-name"
                                    placeholder="Enter material name"
                                    value={materialFormData.name}
                                    onChange={(e) => setMaterialFormData(prev => ({...prev, name: e.target.value}))}
                                    className="text-sm sm:text-base"
                                />
                </div>
                            <div className="space-y-2">
                                <Label htmlFor="material-description" className="text-sm">Description</Label>
                                <Textarea
                                    id="material-description"
                                    placeholder="Enter material description (optional)"
                                    value={materialFormData.description}
                                    onChange={(e) => setMaterialFormData(prev => ({...prev, description: e.target.value}))}
                                    rows={3}
                                    className="text-sm sm:text-base resize-none"
                                />
                        </div>
                    </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                setShowMaterialEditModal(false);
                                setEditingMaterial(null);
                                setMaterialFormData({ name: "", description: "" });
                                }}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleUpdateMaterial}
                                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:from-blue-600 hover:to-purple-600"
                            >
                                Update Material
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </motion.div>
        );
    };


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
                className={`rounded-3xl border border-white/10 p-6 text-${isDark ? "white" : "slate-900"} shadow-2xl bg-gradient-to-br ${themeBackground}`}
            >
                <div className="space-y-4">
                    <p className="text-xs uppercase tracking-[0.3em] opacity-70">{form.subtitle}</p>
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
                                style={{ color: form.highlightColor, borderColor: form.highlightColor }}
                            >
                                Seal
                                                                </div>
                        )}
                                                </div>
                                            </div>
            </div>
        );
    };

    const renderCertificateSelector = () => {
        if (!certificateAttachContext) return null;
        const {materialId, editingContent} = certificateAttachContext;
        const material =
            materials.find((m) => m.id === materialId) ||
            pendingMaterials.find((pm) => pm.tempId === materialId.toString());
        const materialName = material?.name || "Selected material";
        const filteredCertificates = certificateLibrary.filter((certificate) =>
            certificate.name.toLowerCase().includes(certificateSearch.toLowerCase()),
        );
        const resolvedSelected =
            (selectedCertificateId && certificateLibrary.find((item) => item.id === selectedCertificateId)) ||
            filteredCertificates[0] ||
            null;
        const isEditingExisting = Boolean(editingContent);

        const metadataCard = (label: string, value: React.ReactNode) => (
            <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                <p className="text-xs uppercase text-muted-foreground">{label}</p>
                <p className="text-base font-semibold">{value}</p>
            </div>
        );

        return (
        <motion.div
                key="certificate-selector"
            initial={{opacity: 0, x: 50}}
            animate={{opacity: 1, x: 0}}
            exit={{opacity: 0, x: -50}}
            transition={{duration: 0.3}}
                className="space-y-6"
            >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button variant="ghost" onClick={handleCancelCertificateAttach} className="w-fit">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Course Materials
                        </Button>
                        <Badge variant="outline">
                            Attaching to&nbsp;<span className="font-semibold">{materialName}</span>
                        </Badge>
                        {isEditingExisting && (
                            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20">
                                Updating existing certificate
                            </Badge>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (typeof window !== "undefined") {
                                    window.open("/dashboard?tab=certificates", "_blank", "noopener,noreferrer");
                                }
                            }}
                        >
                            Manage certificates
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Input
                        placeholder="Search certificates..."
                        value={certificateSearch}
                        onChange={(e) => setCertificateSearch(e.target.value)}
                        className="h-11 sm:w-80"
                    />
                    <Button
                        variant="ghost"
                        onClick={loadCertificates}
                        disabled={isLoadingCertificates}
                        className="w-full sm:w-auto"
                    >
                        {isLoadingCertificates ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Refreshing
                            </>
                        ) : (
                            "Reload list"
                        )}
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                    <div className="space-y-4">
                        {isLoadingCertificates ? (
                            <div className="rounded-2xl border border-dashed border-border/40 p-10 text-center text-muted-foreground">
                                Loading certificates...
                            </div>
                        ) : filteredCertificates.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border/40 p-10 text-center text-muted-foreground space-y-3">
                                <p>No certificates available. Use the manager to create one.</p>
                                <Button
                                    onClick={() => {
                                        if (typeof window !== "undefined") {
                                            window.open("/dashboard?tab=certificates", "_blank", "noopener,noreferrer");
                                        }
                                    }}
                                >
                                    Open certificate manager
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredCertificates.map((certificate) => {
                                    const isSelected = resolvedSelected?.id === certificate.id;
                                    return (
                                        <div
                                            key={certificate.id}
                                            className={cn(
                                                "rounded-2xl border border-border/30 bg-card/70 p-5 transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5 cursor-pointer",
                                                isSelected && "border-primary/60 bg-primary/5 shadow-lg"
                                            )}
                                            onClick={() => setSelectedCertificateId(certificate.id)}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold">{certificate.name}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Min score {Math.round(certificate.min_score_to_pass * 100)}% •{" "}
                                                        {certificate.auto_issue ? "Auto issue" : "Manual issue"}
                                                    </p>
                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setCertificatePreview(certificate);
                                                        }}
                                                    >
                                                        <Eye className="mr-1 h-4 w-4" />
                                                        Preview
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                                {metadataCard("Questions", certificate.questions.length)}
                                                {metadataCard(
                                                    "Valid until",
                                                    certificate.valid_until
                                                        ? new Date(certificate.valid_until).toLocaleDateString()
                                                        : "No expiry",
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-2xl border border-border/40 bg-card/80 p-5 space-y-4">
                            <h4 className="text-sm font-semibold text-muted-foreground">Certificate preview</h4>
                            {resolvedSelected ? (
                                renderCertificatePreviewCard(resolvedSelected)
                            ) : (
                                <div className="rounded-xl border border-dashed border-border/40 p-6 text-center text-muted-foreground">
                                    Select a certificate to preview its design.
                                </div>
                            )}
                        </div>
                        <div className="rounded-2xl border border-border/40 bg-card/80 p-5 space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                {metadataCard(
                                    "Min score",
                                    resolvedSelected ? `${Math.round(resolvedSelected.min_score_to_pass * 100)}%` : "—",
                                )}
                                {metadataCard(
                                    "Issuance",
                                    resolvedSelected ? (resolvedSelected.auto_issue ? "Automatic" : "Manual") : "—",
                                )}
                                {metadataCard(
                                    "Questions",
                                    resolvedSelected ? resolvedSelected.questions.length : "0",
                                )}
                                {metadataCard(
                                    "Validity",
                                    resolvedSelected?.valid_until
                                        ? new Date(resolvedSelected.valid_until).toLocaleDateString()
                                        : "No expiry",
                                )}
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={handleConfirmCertificateAttach}
                                    disabled={!resolvedSelected || isCertificateActionLoading}
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:from-blue-600 hover:to-purple-600"
                                >
                                    {isCertificateActionLoading
                                        ? "Attaching..."
                                        : isEditingExisting
                                            ? "Update Certificate"
                                            : "Attach Certificate"}
                                </Button>
                                <Button variant="outline" onClick={handleCancelCertificateAttach}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <Dialog open={!!certificatePreview} onOpenChange={(open) => !open && setCertificatePreview(null)}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Certificate preview</DialogTitle>
                            <DialogDescription>
                                This is how learners will see the certificate once issued.
                            </DialogDescription>
                        </DialogHeader>
                        {certificatePreview && (
                            <div className="space-y-4">
                                {renderCertificatePreviewCard(certificatePreview)}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-xl border border-border/40 p-4 text-sm">
                                        <p className="text-xs uppercase text-muted-foreground">Auto issue</p>
                                        <p className="text-base font-semibold">
                                            {certificatePreview.auto_issue ? "Enabled" : "Disabled"}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-border/40 p-4 text-sm">
                                        <p className="text-xs uppercase text-muted-foreground">Questions</p>
                                        <p className="text-base font-semibold">
                                            {certificatePreview.questions.length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
                    </motion.div>
    );
    };

    const renderContentViewer = () => {
        if (!contentViewerWorkspace) return null;
        const { content, materialId } = contentViewerWorkspace;
        const Icon = (() => {
            switch (content.type) {
                case "video":
                    return Video;
                case "audio":
                    return FileAudio;
                case "document":
                    return FileIcon;
                case "article":
                    return FileText;
                case "image":
                    return ImageIcon;
                case "url":
                    return LinkIcon;
                case "quiz":
                    return Target;
                case "certificate":
                    return Award;
                default:
                    return BookOpen;
            }
        })();

        // Quiz content now uses quiz sections from database, not encoded in URL
        // Note: This will be handled in the quiz rendering section below
        const certificateId = content.type === "certificate" ? decodeCertificateRef(content.url) : null;
        const certificateSummary = certificateId
            ? certificateLibrary.find((item) => item.id === certificateId) || null
            : null;
        const provider = content.url_provider || detectUrlProvider(content.url || "");
        const metadata = (content.url_metadata as Record<string, unknown>) || null;

        const renderMediaPreview = () => {
            // Get display URL from media field or url field
            // For URL type, always use content.url directly
            const displayUrl = content.type === "url" 
                ? (content.url || null)
                : getContentDisplayUrl(content);

            if (!displayUrl) {
                return (
                    <div className="rounded-2xl border border-border/40 bg-muted/30 p-8 text-center">
                        <p className="text-muted-foreground">No URL available for this content</p>
                    </div>
                );
            }
            
            // For video type content, always show video player
            if (content.type === "video") {
                return (
                    <div className="rounded-2xl border border-border/40 bg-black/80 p-2">
                        {/* @ts-ignore - ReactPlayer type definition issue */}
                        <ReactPlayer
                            key={`viewer-player-${content.id}-${displayUrl}`}
                            // @ts-ignore
                            src={displayUrl}
                            width="100%"
                            height="360px"
                            controls
                            playing={false}
                            loop
                            muted
                        />
                    </div>
                );
            }
            
            // For URL type content, check if it's a video URL
            if (content.type === "url") {
                const urlString = String(displayUrl || content.url || "").trim();
                

                if (!urlString || urlString === 'null' || urlString === 'undefined') {
                return (
                        <div className="rounded-2xl border border-border/40 bg-muted/30 p-8 text-center">
                            <p className="text-muted-foreground">No URL available</p>
                    </div>
                );
            }
                
                // Check for YouTube
                const isYouTube = urlString.includes("youtube.com") || urlString.includes("youtu.be");
                // Check for Vimeo
                const isVimeo = urlString.includes("vimeo.com");
                // Check for direct video files
                const isDirectVideo = /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(urlString) || urlString.startsWith("blob:");
                

                // For direct video files, use native video element
                if (isDirectVideo) {
                    return (
                        <div className="rounded-2xl border border-border/40 bg-black/80 p-2">
                            <video
                                src={urlString}
                                controls
                                className="w-full h-[360px] object-contain"
                                preload="metadata"
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    );
                }
                
                // For YouTube or Vimeo, ALWAYS use ReactPlayer
                if (isYouTube || isVimeo || provider === "youtube" || provider === "vimeo") {
                    // Double-check URL is valid
                    if (!urlString || urlString.length === 0) {
                        return (
                            <div className="rounded-2xl border border-border/40 bg-muted/30 p-8 text-center">
                                <p className="text-muted-foreground">Invalid video URL</p>
                            </div>
                        );
                    }
                    
                    // Use the same structure as edit view - simple and clean
                    // ReactPlayer v3.0+ uses 'src' prop instead of 'url'
                    return (
                        <div className="rounded-2xl border border-border/40 bg-black/80 p-2">
                            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                                <div className="w-full h-full">
                                    {/* @ts-ignore - ReactPlayer type definition issue */}
                                    <ReactPlayer
                                        key={`viewer-url-${content.id}-${urlString}`}
                                        // @ts-ignore
                                        src={urlString}
                                        width="100%"
                                        height="100%"
                                        controls
                                        playing={false}
                                        onError={(error: any) => {
                                            console.error("[ReactPlayer] Error loading video:", error);
                                            console.error("[ReactPlayer] Failed URL:", urlString);
                                        }}
                                        onReady={() => {
                                            console.log("[ReactPlayer] Video player ready!");
                                            console.log("[ReactPlayer] URL loaded:", urlString);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                }
                
                // For other URLs, show iframe
                return (
                    <div className="rounded-2xl border border-border/40 overflow-hidden">
                        <iframe
                            src={urlString}
                            className="w-full h-[360px]"
                            title="Content preview"
                            sandbox="allow-same-origin allow-scripts allow-popups"
                        />
                    </div>
                );
            }
            
            if (isImageUrl(displayUrl) || content.type === "image") {
                return (
                    <div className="rounded-2xl border border-border/40 p-2 bg-muted/30">
                        <img src={displayUrl} alt={content.name} className="w-full h-auto rounded-lg object-contain" />
                    </div>
                );
            }
            
            if (content.type === "article") {
                return (
                    <ArticleViewer content={content.article || ""} />
                );
            }
            
            return null;
        };

        return (
        <motion.div
                key={`viewer-${content.id}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
            >
                {/* Sticky Back Button */}
                <div className="sticky -top-4 z-20 bg-background/95 backdrop-blur-sm -mx-6 px-6 py-3">
                    <Button variant="ghost" onClick={closeContentViewer} className="w-fit">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Course Materials
                    </Button>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Type:</span>
                        <Badge className="capitalize">{content.type}</Badge>
                        {content.is_preview && (
                            <Badge variant="outline" className="border-blue-400/40 text-blue-500">
                                Preview enabled
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Content Header */}
                <div className="space-y-4 rounded-2xl border border-border/40 bg-card/50 p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary/10">
                            <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold">{content.name}</h3>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span>{content.estimated_minutes || 0} minute(s)</span>
                                <InstructorDisplay
                                    instructor={content.instructor}
                                    collaboratingInstructors={collaboratingInstructors}
                                    size="md"
                                    showLabel={true}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    closeContentViewer();
                                    handleEditContent(content, materialId);
                                }}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                            <Button
                                variant={showContentAnalysis || showQuizAnalysis ? "default" : "outline"}
                                onClick={() => {
                                    if (content.type === "quiz") {
                                        setShowQuizAnalysis(!showQuizAnalysis);
                                    } else {
                                        setShowContentAnalysis(!showContentAnalysis);
                                    }
                                }}
                            >
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Analysis
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content Body - Full Width */}
                <div className="space-y-6">
                    {/* Show Analysis View */}
                    {(showContentAnalysis || showQuizAnalysis) && content.type !== "quiz" ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Stats Grid */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-6 backdrop-blur-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-muted-foreground">Total Learners</p>
                                        <Users className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <p className="text-3xl font-bold">{contentProgressState.entries.length}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {contentProgressState.entries.filter(e => e.tracking_status === "completed").length} completed
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-green-500/10 to-green-600/5 p-6 backdrop-blur-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                                        <Clock className="h-5 w-5 text-green-500" />
                                    </div>
                                    <p className="text-3xl font-bold">
                                        {contentProgressState.entries.filter(e => e.tracking_status === "in_progress").length}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Active learners
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-6 backdrop-blur-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-muted-foreground">Average Progress</p>
                                        <TrendingUp className="h-5 w-5 text-purple-500" />
                                    </div>
                                    <p className="text-3xl font-bold">
                                        {contentProgressState.entries.length > 0
                                            ? Math.round(
                                                  contentProgressState.entries.reduce(
                                                      (sum, e) => sum + (e.watched_percent || 0),
                                                      0
                                                  ) / contentProgressState.entries.length
                                              )
                                            : 0}%
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Average completion rate
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-6 backdrop-blur-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                                        <Award className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <p className="text-3xl font-bold">
                                        {contentProgressState.entries.length > 0
                                            ? Math.round(
                                                  (contentProgressState.entries.filter(e => e.tracking_status === "completed").length /
                                                      contentProgressState.entries.length) *
                                                      100
                                              )
                                            : 0}%
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {contentProgressState.entries.filter(e => e.tracking_status === "completed").length} of{" "}
                                        {contentProgressState.entries.length} completed
                                    </p>
                                </div>
                            </div>

                            {/* Learner Progress Table */}
                            <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                                <div className="p-6 border-b border-border/50">
                                    <h3 className="text-lg font-semibold">Learner Engagement</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Detailed view of all learners who have engaged with this content
                                    </p>
                                </div>
                                <div className="overflow-x-auto">
                                    {contentProgressState.loading ? (
                                        <div className="flex items-center justify-center py-20">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : contentProgressState.entries.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p>No learners have engaged with this content yet.</p>
                                        </div>
                                    ) : (
                                        <table className="w-full">
                                            <thead className="bg-muted/50 border-b border-border/50">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                        Learner
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                        Progress
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                        Last Updated
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {contentProgressState.entries.map((entry) => (
                                                    <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-10 w-10 border border-border/40">
                                                                    <AvatarFallback>
                                                                        {(entry.user?.full_name ||
                                                                            entry.user?.username ||
                                                                            `U${entry.user?.id}`)
                                                                            .slice(0, 2)
                                                                            .toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-medium">
                                                                        {entry.user?.full_name ||
                                                                            entry.user?.username ||
                                                                            `User #${entry.user?.id}`}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {entry.user?.email || `ID: ${entry.user?.id}`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Badge
                                                                variant={
                                                                    entry.tracking_status === "completed"
                                                                        ? "default"
                                                                        : entry.tracking_status === "in_progress"
                                                                            ? "secondary"
                                                                            : "outline"
                                                                }
                                                                className={cn(
                                                                    entry.tracking_status === "completed" &&
                                                                        "bg-green-500/20 text-green-600 border-green-500/30",
                                                                    entry.tracking_status === "in_progress" &&
                                                                        "bg-blue-500/20 text-blue-600 border-blue-500/30"
                                                                )}
                                                            >
                                                                {entry.tracking_status.replace("_", " ")}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 bg-muted rounded-full h-2 max-w-[100px]">
                                                                    <div
                                                                        className="bg-primary h-2 rounded-full transition-all"
                                                                        style={{
                                                                            width: `${entry.watched_percent || 0}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="text-sm font-medium">
                                                                    {Math.round(entry.watched_percent || 0)}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm">
                                                                {entry.last_updated_at
                                                                    ? new Date(entry.last_updated_at).toLocaleDateString()
                                                                    : "—"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            {/* Media Preview */}
                            {content.type !== "quiz" && content.type !== "certificate" && renderMediaPreview()}
                            
                            {/* URL Metadata */}
                            {content.type !== "quiz" && content.type !== "certificate" && metadata && (
                            <div className="rounded-2xl border border-border/40 bg-card/50 p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold">URL metadata</p>
                                        <p className="text-xs text-muted-foreground">
                                            Checked{" "}
                                            {content.url_checked_at
                                                ? new Date(content.url_checked_at).toLocaleString()
                                                : "Not available"}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="capitalize">
                                        {provider}
                                    </Badge>
                                </div>
                                <div className="grid gap-3 text-sm">
                                    <div>
                                        <p className="text-xs uppercase text-muted-foreground">Title</p>
                                        <p className="font-medium">{(metadata as any).title || "—"}</p>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs uppercase text-muted-foreground">Provider</p>
                                            <p className="font-medium">{(metadata as any).provider_name || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-muted-foreground">Author</p>
                                            <p className="font-medium">{(metadata as any).author_name || "—"}</p>
                                        </div>
                                    </div>
                                    {(metadata as any).thumbnail_url && (
                                        <div>
                                            <p className="text-xs uppercase text-muted-foreground">Thumbnail</p>
                                            <img
                                                src={(metadata as any).thumbnail_url}
                                                alt="URL thumbnail"
                                                className="w-full max-w-sm rounded-lg border border-border/30"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    
                    {/* Learner Progress */}
                        {content.can_track_progress && (
                            <div className="rounded-2xl border border-border/40 bg-card/50 p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold">Learner progress</p>
                                        <p className="text-xs text-muted-foreground">
                                            Track who is engaging with this content
                                        </p>
                                    </div>
                                    <Badge variant="outline">
                                        {contentProgressState.entries.length} tracking
                                    </Badge>
                                </div>
                                {contentProgressState.loading ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading learner progress...
                                    </div>
                                ) : contentProgressState.error ? (
                                    <p className="text-sm text-destructive">{contentProgressState.error}</p>
                                ) : contentProgressState.entries.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No learners have started this content yet.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {contentProgressState.entries.slice(0, 5).map((entry) => (
                                            <div
                                                key={entry.id}
                                                className="flex items-center justify-between rounded-xl border border-border/40 bg-background/40 p-3"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold">
                                                        {entry.user?.full_name ||
                                                            entry.user?.username ||
                                                            `User ${entry.user?.id ?? "—"}`}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {entry.tracking_status.replace("_", " ")} •{" "}
                                                        {entry.last_updated_at
                                                            ? new Date(entry.last_updated_at).toLocaleString()
                                                            : "—"}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="outline" className="capitalize mb-1">
                                                        {entry.tracking_status.replace("_", " ")}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground">
                                                        {Math.round(entry.watched_percent ?? 0)}% watched
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    
                    {/* Article Preview */}
                    {content.type === "article" && (() => {
                        const articleContent = content.url || "";
                        if (!articleContent) return null;
                        return (
                            <div className="rounded-2xl border border-border/40 bg-card/50 p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold">Article Content</p>
                                        <p className="text-xs text-muted-foreground">
                                            View the article content
                                        </p>
                    </div>
                                </div>
                                <ArticleViewer content={articleContent} />
                            </div>
                        );
                    })()}

                    {/* Document Preview */}
                    {content.type === "document" && (() => {
                        const displayUrl = getContentDisplayUrl(content);
                        if (!displayUrl) return null;
                        return (
                            <div className="rounded-2xl border border-border/40 bg-card/50 p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold">Document Preview</p>
                                            <p className="text-xs text-muted-foreground">
                                                Preview the document content
                                        </p>
                            </div>
                                </div>
                                    <div className="w-full border rounded-lg overflow-hidden bg-white">
                                        {/* Prevent auto-download by using embed-friendly URL */}
                                        {(() => {
                                            // Detect PDF - check URL, content name, or default to PDF for document type
                                            const isPdf = displayUrl.toLowerCase().includes('.pdf') 
                                                || displayUrl.toLowerCase().includes('/pdf')
                                                || (content.name && content.name.toLowerCase().endsWith('.pdf'))
                                                || content.type === "document"; // Default to PDF for document type
                                            
                                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(displayUrl)
                                                || (content.name && /\.(jpg|jpeg|png|gif|webp)$/i.test(content.name));
                                            
                                            if (isPdf) {
                                                // Use Google Docs Viewer for PDFs to prevent download
                                                const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(displayUrl)}&embedded=true`;
                                                return (
                                                    <iframe
                                                        src={viewerUrl}
                                                        className="w-full h-[500px]"
                                                        title="Document Preview"
                                                        sandbox="allow-same-origin allow-scripts allow-popups"
                                                    />
                                                );
                                            } else if (isImage) {
                                                // For images, use img tag
                                                return (
                                                    <img
                                                        src={displayUrl}
                                                        alt={content.name || "Document preview"}
                                                        className="w-full h-auto max-h-[500px] object-contain"
                                                    />
                                                );
                                            } else {
                                                // For other file types, show a message with download option
                                                return (
                                                    <div className="w-full h-[500px] flex flex-col items-center justify-center p-8 text-center">
                                                        <FileIcon className="w-16 h-16 text-muted-foreground mb-4" />
                                                        <p className="text-sm text-muted-foreground mb-4">
                                                            Preview not available for this file type
                                                        </p>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                const link = document.createElement('a');
                                                                link.href = displayUrl;
                                                                link.download = content.name || 'document';
                                                                link.target = '_blank';
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                document.body.removeChild(link);
                                                            }}
                                                        >
                                                            <FileIcon className="w-4 h-4 mr-2" />
                                                            Download File
                                                        </Button>
                            </div>
                                                );
                                            }
                                        })()}
                                    </div>
                                    <div className="flex items-center justify-center gap-2 pt-2 border-t">
                                <Button
                                    variant="outline"
                                            size="sm"
                                            onClick={() => displayUrl && window.open(displayUrl, '_blank')}
                                        >
                                            <FileIcon className="w-4 h-4 mr-2" />
                                            Open in New Tab
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                    onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = displayUrl;
                                                link.download = content.name || 'document';
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
                        );
                    })()}

                    {/* Audio Preview */}
                    {content.type === "audio" && (() => {
                        const displayUrl = getContentDisplayUrl(content);
                        if (!displayUrl) return null;
                        return (
                            <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold">Audio Preview</p>
                                            <p className="text-xs text-muted-foreground">
                                                Listen to the audio content
                                            </p>
                                    </div>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border-2 border-purple-500/30">
                                            <FileAudio className="w-16 h-16 text-purple-500" />
                                    </div>
                                </div>
                                    <div className="w-full">
                                        <audio
                                            src={displayUrl}
                                            controls
                                            className="w-full"
                                            preload="metadata"
                                        >
                                            Your browser does not support the audio tag.
                                        </audio>
                                    </div>
                            </div>
                        );
                    })()}

                    {/* Video Preview */}
                    {content.type === "video" && (() => {
                        const displayUrl = getContentDisplayUrl(content);
                        if (!displayUrl) return null;
                        return (
                            <div className="rounded-2xl border border-border/40 bg-card/50 p-6 space-y-4">
                                            <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold">Video Preview</p>
                                        <p className="text-xs text-muted-foreground">
                                            Watch the video content
                                        </p>
                                            </div>
                                </div>
                                <div className="w-full rounded-lg overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
                                    {/* @ts-ignore - ReactPlayer type definition issue */}
                                    <ReactPlayer
                                        src={displayUrl}
                                        width="100%"
                                        height="100%"
                                        controls
                                        playing={false}
                                    />
                                </div>
                            </div>
                        );
                    })()}

                    {/* Image Preview */}
                    {content.type === "image" && (() => {
                        const displayUrl = getContentDisplayUrl(content);
                        if (!displayUrl) return null;
                        return (
                            <div className="rounded-2xl border border-border/40 bg-card/50 p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold">Image Preview</p>
                                        <p className="text-xs text-muted-foreground">
                                            View the image content
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-lg overflow-hidden">
                                    <img 
                                        src={displayUrl} 
                                        alt={content.name} 
                                        className="w-full h-auto object-contain" 
                                    />
                                </div>
                            </div>
                        );
                    })()}

                    {/* URL Preview */}
                    {content.type === "url" && (() => {
                        const displayUrl = getContentDisplayUrl(content);
                        if (!displayUrl) return null;
                        return (
                            <div className="rounded-2xl border border-border/40 bg-card/50 p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold">URL Content</p>
                                        <p className="text-xs text-muted-foreground">
                                            External link content
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => displayUrl && window.open(displayUrl, '_blank')}
                                    >
                                        <LinkIcon className="w-4 h-4 mr-2" />
                                        Open Link
                                    </Button>
                                        </div>
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <p className="text-sm break-all">{displayUrl}</p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Quiz Content */}
                    {content.type === "quiz" && (
                        <div className="w-full">
                            <QuizViewer 
                                content={content} 
                                collaboratingInstructors={collaboratingInstructors}
                                showAnalysis={showQuizAnalysis}
                            />
                            </div>
                        )}

                    {/* Certificate Detail View - Enhanced UI */}
                    {content.type === "certificate" && certificateSummary && (
                        <div className="space-y-6">
                            {/* Certificate Info Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-muted/20 backdrop-blur-sm p-6 space-y-4 shadow-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-400/30 flex items-center justify-center">
                                        <Award className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                                        </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                            Certificate Program
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {content.name}
                                        </p>
                                </div>
                            </div>
                            </motion.div>

                            {/* Certificate Details Grid */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-400/30 flex items-center justify-center">
                                                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                                Theme
                                            </p>
                                        </div>
                                        <p className="text-2xl font-bold capitalize">{certificateSummary.theme}</p>
                                        {certificateSummary.customMessage && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                                {certificateSummary.customMessage}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                                Issuer & Signature
                                    </p>
                                </div>
                                        <p className="text-lg font-bold">{certificateSummary.issuer || "—"}</p>
                                        {certificateSummary.signatureName && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Signed by: {certificateSummary.signatureName}
                                            </p>
                                        )}
                                </div>
                                </motion.div>
                            </div>

                            {/* Issue Criteria */}
                            {certificateSummary.issueCriteria && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="rounded-2xl border border-border/40 bg-card/50 p-6 space-y-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-400/30 flex items-center justify-center">
                                            <Target className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">Issue Criteria</p>
                                            <p className="text-xs text-muted-foreground">
                                                Requirements for certificate issuance
                                    </p>
                                </div>
                                    </div>
                                    <div className="pl-13">
                                        <p className="text-sm leading-relaxed">{certificateSummary.issueCriteria}</p>
                                    </div>
                                </motion.div>
                            )}
                            </div>
                        )}

                        {content.type !== "quiz" && content.type !== "certificate" && (
                            <div className="space-y-4">
                                {/* Responsible Instructor */}
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Responsible Instructor</Label>
                                    <InstructorDisplay
                                        instructor={content.instructor}
                                        collaboratingInstructors={collaboratingInstructors}
                                        size="sm"
                                        showLabel={false}
                                    />
                                </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Estimated Duration</Label>
                                    <p className="text-sm font-medium">
                                        {content.estimated_minutes > 0
                                            ? `${content.estimated_minutes} minutes`
                                            : "Not set"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Content Type</Label>
                                    <p className="text-sm font-medium capitalize">{content.type}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Duration Seconds</Label>
                                    <p className="text-sm font-medium">
                                        {content.duration_seconds > 0 ? `${content.duration_seconds}s` : "Not set"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Tracking</Label>
                                    <p className="text-sm font-medium">
                                        {content.can_track_progress ? "Enabled" : "Disabled"}
                                    </p>
                                </div>
                                {content.url && (
                                    <div className="space-y-1 md:col-span-2">
                                        <Label className="text-xs text-muted-foreground">URL</Label>
                                        <a
                                            href={content.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary hover:underline break-all"
                                        >
                                            {content.url}
                                        </a>
                                    </div>
                                )}
                            </div>

                                {/* Copyright Status for Video and Audio */}
                                {(content.type === "video" || content.type === "audio") && content.copyright_check_status && (
                                    <div className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold">Copyright Status</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Last checked: {content.copyright_check_date 
                                                        ? new Date(content.copyright_check_date).toLocaleString()
                                                        : "Not available"}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={
                                                    content.copyright_check_status === "passed"
                                                        ? "default"
                                                        : content.copyright_check_status === "failed"
                                                            ? "destructive"
                                                            : content.copyright_check_status === "warning"
                                                                ? "secondary"
                                                                : "outline"
                                                }
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium",
                                                    content.copyright_check_status === "passed"
                                                        ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                                        : content.copyright_check_status === "failed"
                                                            ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                                                            : content.copyright_check_status === "warning"
                                                                ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                                                                : ""
                                                )}
                                            >
                                                {content.copyright_check_status === "checking" && (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                )}
                                                {content.copyright_check_status === "passed" && (
                                                    <CheckCircle className="h-3 w-3" />
                                                )}
                                                {content.copyright_check_status === "failed" && (
                                                    <X className="h-3 w-3" />
                                                )}
                                                {content.copyright_check_status === "warning" && (
                                                    <AlertCircle className="h-3 w-3" />
                                                )}
                                                {content.copyright_check_status === "pending" && (
                                                    <Clock className="h-3 w-3" />
                                                )}
                                                {content.copyright_check_status === "manual_review" && (
                                                    <Eye className="h-3 w-3" />
                                                )}
                                                <span>
                                                    {content.copyright_check_status === "checking" && "Checking Copyright..."}
                                                    {content.copyright_check_status === "passed" && "Copyright OK"}
                                                    {content.copyright_check_status === "failed" && "Copyright Failed"}
                                                    {content.copyright_check_status === "warning" && "Copyright Warning"}
                                                    {content.copyright_check_status === "pending" && "Copyright Pending"}
                                                    {content.copyright_check_status === "manual_review" && "Manual Review Required"}
                                                </span>
                                            </Badge>
                    </div>
                                        {((content.copyright_violations && content.copyright_violations.length > 0) || (content.copyright_warnings && content.copyright_warnings.length > 0)) && (
                                            <div className="space-y-2">
                                                {content.copyright_violations && Array.isArray(content.copyright_violations) && content.copyright_violations.length > 0 && (
                                                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                                                        <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                                                            Violations ({content.copyright_violations.length})
                                                        </p>
                                                        <ul className="text-xs text-red-600 dark:text-red-300 space-y-1">
                                                    {content.copyright_violations.map((violation: any, idx: number) => (
                                                        <li key={idx}>• {typeof violation === 'string' ? violation : violation?.message || violation?.type || 'Violation'}</li>
                                                    ))}
                                                </ul>
                                                    </div>
                                                )}
                                                {content.copyright_warnings && Array.isArray(content.copyright_warnings) && content.copyright_warnings.length > 0 && (
                                                    <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                                                        <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">
                                                            Warnings ({content.copyright_warnings.length})
                                                        </p>
                                                        <ul className="text-xs text-yellow-600 dark:text-yellow-300 space-y-1">
                                                    {content.copyright_warnings.map((warning: any, idx: number) => (
                                                        <li key={idx}>• {typeof warning === 'string' ? warning : warning?.message || warning?.type || 'Warning'}</li>
                                                    ))}
                                                </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {content.copyright_check_provider && (
                                            <div className="text-xs text-muted-foreground">
                                                <span className="font-medium">Provider:</span> {content.copyright_check_provider}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        </>
                    )}
                                </div>
                    </motion.div>
    );
    };

    // State for dynamic preview data
    const [previewCourseData, setPreviewCourseData] = useState<{
        course: CourseCourse | null;
        materials: CourseMaterialEntity[];
        contents: Record<number, CourseContentEntity[]>;
    } | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    // State for course insights
    const [insightsData, setInsightsData] = useState<{
        enrollments: Array<{
            id: string;
            studentName: string;
            studentAvatar?: string;
            enrolledAt: string;
            progress: number;
            status: string;
        }>;
        ratings: Array<{
            id: string;
            userName: string;
            userAvatar?: string;
            rating: number;
            comment?: string;
            createdAt: string;
        }>;
        analytics: {
            totalEnrollments: number;
            activeEnrollments: number;
            completedEnrollments: number;
            totalRevenue: number;
            averageRating: number;
            totalRatings: number;
            completionRate: number;
            averageProgress: number;
        } | null;
    }>({
        enrollments: [],
        ratings: [],
        analytics: null,
    });
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);
    const [insightsSearchQuery, setInsightsSearchQuery] = useState("");
    const [insightsStatusFilter, setInsightsStatusFilter] = useState("all");
    const [insightsActiveTab, setInsightsActiveTab] = useState("overview");

    // Fetch fresh course data for preview
    const fetchPreviewData = useCallback(async () => {
        if (!courseId) {
            // Use current form data if no course ID
            setPreviewCourseData({
                course: course,
                materials: materials,
                contents: contentsByMaterial,
            });
            return;
        }

        setIsLoadingPreview(true);
        try {
            const [freshCourse, freshMaterials] = await Promise.all([
                getCourseCourse(courseId),
                getCourseMaterials(courseId),
            ]);

            const freshContents: Record<number, CourseContentEntity[]> = {};
            for (const material of freshMaterials) {
                freshContents[material.id] = await getCourseContentsForMaterial(material.id);
            }

            setPreviewCourseData({
                course: freshCourse,
                materials: freshMaterials,
                contents: freshContents,
            });
        } catch (error) {
            console.error("Error fetching preview data:", error);
            // Fallback to current form data
            setPreviewCourseData({
                course: course,
                materials: materials,
                contents: contentsByMaterial,
            });
        } finally {
            setIsLoadingPreview(false);
        }
    }, [courseId, course, materials, contentsByMaterial]);

    // Fetch insights data
    const fetchInsightsData = useCallback(async () => {
        if (!courseId) {
            // Use mock data if no course ID
            setInsightsData({
                enrollments: [],
                ratings: [],
                analytics: {
                    totalEnrollments: 0,
                    activeEnrollments: 0,
                    completedEnrollments: 0,
                    totalRevenue: 0,
                    averageRating: 0,
                    totalRatings: 0,
                    completionRate: 0,
                    averageProgress: 0,
                },
            });
            return;
        }

        setIsLoadingInsights(true);
        try {
            const access_token = getAccessToken();
            const strapiURL = process.env.NEXT_PUBLIC_STRAPI_URL || "";

            // Fetch enrollments
            const enrollmentsResponse = await fetch(
                `${strapiURL}/api/course-enrollments?filters[course_course][id][$eq]=${courseId}&populate[user][populate]=*&sort=started_at:desc`,
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                }
            );

            let enrollments: any[] = [];
            if (enrollmentsResponse.ok) {
                const enrollmentsData = await enrollmentsResponse.json();
                enrollments = (enrollmentsData.data || []).map((item: any) => ({
                    id: item.id,
                    studentName: item.user?.username || item.user?.email || "Unknown",
                    studentAvatar: item.user?.avatar || undefined,
                    enrolledAt: item.started_at || item.createdAt,
                    progress: parseFloat(item.progress_percent || 0),
                    status: item.enroll_status || "active",
                }));
            }

            // Fetch ratings/reviews (mock for now - replace with actual API when available)
            const ratings: any[] = [];

            // Calculate analytics
            const totalEnrollments = enrollments.length;
            const activeEnrollments = enrollments.filter((e) => e.status === "active").length;
            const completedEnrollments = enrollments.filter((e) => e.status === "completed").length;
            const averageProgress = enrollments.length > 0
                ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
                : 0;
            const completionRate = totalEnrollments > 0
                ? (completedEnrollments / totalEnrollments) * 100
                : 0;

            const totalRatings = ratings.length;
            const averageRating = totalRatings > 0
                ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
                : 0;

            // Get course data - use course from props/state, not previewCourseData to avoid circular dependency
            const currentCourse = course;
            const totalRevenue = currentCourse?.revenue_generated || 0;

            setInsightsData({
                enrollments,
                ratings,
                analytics: {
                    totalEnrollments,
                    activeEnrollments,
                    completedEnrollments,
                    totalRevenue,
                    averageRating,
                    totalRatings,
                    completionRate,
                    averageProgress,
                },
            });
        } catch (error) {
            console.error("Error fetching insights data:", error);
        } finally {
            setIsLoadingInsights(false);
        }
    }, [courseId, course]);

    // Fetch insights data when entering analysis step
    useEffect(() => {
        if (currentStep === "preview-publish" && courseId) {
            fetchInsightsData();
        }
        // Only fetch when step or courseId changes, not when functions change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, courseId]);

    const renderPreviewPublishStep = () => {
        const previewData = previewCourseData || {
            course: course,
            materials: materials,
            contents: contentsByMaterial,
        };
        const allContents = Object.values(previewData.contents).flat();
        const displayCourse = previewData.course || {
            name: basics.name,
            description: basics.description,
            duration_minutes: basics.duration_minutes,
            course_level: basics.course_level,
            course_categories: basics.course_categories,
        } as any;
        
        return (
            <motion.div
                key="preview-publish"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
            >

            {/* Course Insights Section */}
            <CourseInsightsSection
                isLoading={isLoadingInsights}
                enrollments={insightsData.enrollments}
                ratings={insightsData.ratings}
                analytics={insightsData.analytics}
                searchQuery={insightsSearchQuery}
                onSearchChange={setInsightsSearchQuery}
                statusFilter={insightsStatusFilter}
                onStatusFilterChange={setInsightsStatusFilter}
                activeTab={insightsActiveTab}
                onTabChange={setInsightsActiveTab}
            />
            </motion.div>
        );
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case "basics":
                return renderBasicsStep();
            case "materials":
                return renderMaterialsStep();
            case "preview-publish":
                return renderPreviewPublishStep();
            default:
                return null;
        }
    };

    // Prevent page reload/refresh when there are unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges || pendingMaterials.length > 0 || Object.values(pendingContents).flat().length > 0) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedChanges, pendingMaterials.length, pendingContents]);

    // Build breadcrumb items based on current state
    const breadcrumbItems: BreadcrumbItem[] = [
        { 
            label: "My Courses", 
            onClick: onCancel 
        },
    ];
    
    if (course) {
        breadcrumbItems.push({
            label: course.name || "Course",
            onClick: currentStep !== "basics" ? () => setCurrentStep("basics") : undefined,
            icon: <BookOpen className="h-3.5 w-3.5" />,
        });
    }
    
    if (contentViewerWorkspace) {
        breadcrumbItems.push({
            label: contentViewerWorkspace.content.name,
        });
    } else if (currentStep === "materials") {
        breadcrumbItems.push({ label: "Course Materials" });
    } else if (currentStep === "preview-publish") {
        breadcrumbItems.push({ label: "Analysis" });
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-accent/5">
            <div className="w-full mx-auto">
                {/* Breadcrumb Navigation - Outside Card */}
                <div className="mb-4 sm:mb-6">
                    <Breadcrumb items={breadcrumbItems} />
                </div>
                
                <div
                    className="w-full min-h-[70vh] p-0 border border-border -shadow-lg bg-background/80 backdrop-blur-xl flex flex-col gap-0 border-0">
                    <div className="space-y-2 sm:space-y-3 md:space-y-4 py-3 sm:py-4">
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 sm:gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="text-lg sm:text-xl md:text-2xl font-semibold uppercase tracking-widest">
                                    Create course
                                </div>
                                <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                                    Follow the steps to configure your course, materials and analyze performance.
                                </p>
                        </div>
                            {/* Course Status & Active Buttons - Responsive */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Status:</Label>
                                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={basics.course_status === "draft" ? "default" : "outline"}
                                            onClick={async () => {
                                                handleBasicsChange("course_status", "draft");
                                                if (course) {
                                                    await updateCourseCourse(course.documentId, {course_status: "draft"});
                                                    toast.success("Course status updated to Draft");
                                                }
                                            }}
                                            className={cn(
                                                "h-8 sm:h-9 px-2 sm:px-4 text-xs font-medium transition-all duration-200 border-2",
                                                basics.course_status === "draft"
                                                    ? "bg-gray-400 dark:shadow-gray-500/30"
                                                    : "border-border hover:bg-gray-400/10 dark:border-border/60"
                                            )}
                                            disabled={basics.course_status === "draft"}
                                        >
                                            <span className={cn(
                                                "w-2 h-2 rounded-full mr-2 transition-colors",
                                                basics.course_status === "draft" ? "bg-orange-100 dark:bg-orange-200" : "bg-orange-400 dark:bg-orange-500"
                                            )}/>
                                            Draft
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={basics.course_status === "published" ? "default" : "outline"}
                                            onClick={async () => {
                                                // Validation: Check ALL content for copyright issues BEFORE publishing
                                                console.log("[Copyright Check] ========== BUTTON CLICK VALIDATION ==========");
                                                console.log("[Copyright Check] Course is paid:", basics.is_paid);
                                                
                                                if (basics.is_paid) {
                                                    const issues = checkAllContentCopyright();
                                                    console.log("[Copyright Check] Button click - checking for copyright issues:", {
                                                        isPaid: basics.is_paid,
                                                        issuesFound: issues.length,
                                                        willBlock: issues.length > 0
                                                    });
                                                    
                                                    if (issues.length > 0) {
                                                        console.warn("[Copyright Check] ❌ BLOCKING - Paid course has copyright issues!");
                                                        setCopyrightIssues(issues);
                                                        setShowCopyrightWarningDialog(true);
                                                        toast.error(`Cannot publish paid course: ${issues.length} content item(s) have copyright issues`);
                                                        return; // Prevent publishing paid course with copyright issues
                                                    }
                                                }
                                                
                                                console.log("[Copyright Check] ✅ ALLOWING - No copyright issues or course is free");
                                                handleBasicsChange("course_status", "published");
                                                if (course) {
                                                    await updateCourseCourse(course.documentId, {course_status: "published"});
                                                    toast.success("Course status updated to Published");
                                                }
                                            }}
                                            className={cn(
                                                "h-9 px-4 text-xs font-medium transition-all duration-200 border-2",
                                                basics.course_status === "published"
                                                    ? "bg-green-500 hover:bg-green-600 text-white border-green-500 shadow-md dark:bg-green-600 dark:hover:bg-green-700 dark:border-green-600 dark:shadow-green-500/30"
                                                    : "border-border hover:border-green-400/50 hover:bg-green-50 dark:hover:bg-green-950/30 dark:border-border/60 dark:hover:border-green-500/50"
                                            )}
                                            disabled={basics.course_status === "published"}
                                        >
                                            <span className={cn(
                                                "w-2 h-2 rounded-full mr-2 transition-colors",
                                                basics.course_status === "published" ? "bg-green-100 dark:bg-green-200" : "bg-green-400/50 dark:bg-green-500/30"
                                            )}/>
                                            Published
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={basics.course_status === "cancel" ? "default" : "outline"}
                                            onClick={async () => {
                                                handleBasicsChange("course_status", "cancel");
                                                if (course) {
                                                    await updateCourseCourse(course.documentId, {course_status: "cancel"});
                                                    toast.success("Course status updated to Canceled");
                                                }
                                            }}
                                            className={cn(
                                                "h-9 px-4 text-xs font-medium transition-all duration-200 border-2",
                                                basics.course_status === "cancel"
                                                    ? "bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-md dark:bg-red-600 dark:hover:bg-red-700 dark:border-red-600 dark:shadow-red-500/30"
                                                    : "border-border hover:border-red-400/50 hover:bg-red-50 dark:hover:bg-red-950/30 dark:border-border/60 dark:hover:border-red-500/50"
                                            )}
                                            disabled={basics.course_status === "cancel"}
                                        >
                                            <span className={cn(
                                                "w-2 h-2 rounded-full mr-2 transition-colors",
                                                basics.course_status === "cancel" ? "bg-red-100 dark:bg-red-200" : "bg-red-400/50 dark:bg-red-500/30"
                                            )}/>
                                            Canceled
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs text-muted-foreground">Active:</Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={basics.active ? "default" : "outline"}
                                        onClick={async () => {
                                            const newActive = !basics.active;
                                            handleBasicsChange("active", newActive);
                                            if (course) {
                                                await updateCourseCourse(course.documentId, {active: newActive});
                                                toast.success(`Course ${newActive ? "activated" : "deactivated"}`);
                                            }
                                        }}
                                        className={cn(
                                                "h-8 sm:h-9 px-2 sm:px-4 text-xs font-medium transition-all duration-200 border-2",
                                            basics.active
                                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 shadow-md dark:shadow-emerald-500/20"
                                                    : "border-border hover:border-emerald-400/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                        )}
                                    >
                    <span className={cn(
                        "w-2 h-2 rounded-full mr-2 transition-colors duration-200",
                                            basics.active ? "bg-emerald-100" : "bg-emerald-400/50"
                    )}/>
                                        {basics.active ? "Active" : "Inactive"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                        {/* Enhanced Step Indicator with Modern Design and Animations - Responsive */}
                        <ol className="flex items-center w-full mt-2 sm:mt-4">
                            {stepsOrder.map((step, index) => {
                                const isActive = index === currentStepIndex;
                                const isCompleted = completedSteps.has(step);
                                const isLast = index === stepsOrder.length - 1;
                                return (
                                    <li
                                        key={step}
                                        className={cn(
                                            "flex items-center w-full",
                                            !isLast && "after:content-[''] after:flex-1 after:h-0.5 after:mx-1.5 sm:after:mx-2 md:after:mx-3 after:transition-all after:duration-500 after:ease-in-out",
                                            !isLast && isCompleted && "after:bg-gradient-to-r after:from-emerald-500 after:to-emerald-400 after:shadow-sm after:shadow-emerald-500/20",
                                            !isLast && !isCompleted && "after:bg-border/50"
                                        )}
                                    >
                                        <motion.button
                                            type="button"
                                            onClick={() => setCurrentStep(step)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className={cn(
                                                "flex items-center gap-1.5 sm:gap-2 md:gap-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 rounded-lg px-1 sm:px-2 py-1 transition-all duration-300",
                                                isActive && "text-primary font-semibold",
                                                isCompleted && "text-emerald-600 dark:text-emerald-400",
                                                !isActive && !isCompleted && "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <motion.span
                                                initial={false}
                                                animate={{
                                                    scale: isActive ? 1.1 : isCompleted ? 1 : 1,
                                                }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                          className={cn(
                                                    "flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 items-center justify-center rounded-full border-2 text-xs sm:text-sm font-semibold transition-all duration-300 shadow-sm",
                                                    isCompleted && "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-600 dark:border-emerald-500 shadow-emerald-500/30",
                                                    isActive && "border-primary bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary shadow-primary/20",
                                                    !isActive && !isCompleted && "border-border/60 bg-background text-muted-foreground dark:bg-muted/50"
                                                )}
                                            >
                                                {isCompleted ? (
                                                    <motion.div
                                                        initial={{ scale: 0, rotate: -180 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                                                    >
                                                        <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                                    </motion.div>
                                                ) : (
                                                    <motion.span
                                                        animate={{ scale: isActive ? 1.1 : 1 }}
                                                        transition={{ duration: 0.2 }}
                      >
                        {index + 1}
                                                    </motion.span>
                                                )}
                                            </motion.span>
                                            <motion.span 
                                                className="hidden sm:inline text-xs sm:text-sm font-medium"
                                                animate={{ opacity: isActive ? 1 : 0.7 }}
                                                transition={{ duration: 0.2 }}
                                            >
                        {stepLabels[step]}
                                            </motion.span>
                                        </motion.button>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>

                    <div className="px-2 pt-3 sm:pt-4 space-y-4 sm:space-y-6 flex-1 overflow-x-hidden overflow-y-auto scrollbar-hide">
                        <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
                    </div>
                </div>
            </div>
            <SaveProgressModal
                open={isSaveProgressModalOpen}
                onClose={() => {
                    setIsSaveProgressModalOpen(false)
                    if (!hasActiveSaveJobs) {
                        setSaveProgressList([])
                    }
                }}
                sections={progressSections}
                items={saveProgressList}
                summary={{
                    saving: saveProgressList.filter((i) => i.status === "saving").length,
                    success: saveProgressList.filter((i) => i.status === "success").length,
                    error: saveProgressList.filter((i) => i.status === "error").length,
                }}
                disableClose={hasActiveSaveJobs}
                onClearHistory={() => setSaveProgressList([])}
            />

            {showCopyrightWarningDialog && typeof window !== 'undefined' && createPortal(
                <DraggableCopyrightModal
                    isOpen={showCopyrightWarningDialog}
                    onClose={() => setShowCopyrightWarningDialog(false)}
                    copyrightIssues={copyrightIssues}
                    onGoBack={() => {
                        setShowCopyrightWarningDialog(false);
                        handleBasicsChange("course_status", "draft");
                    }}
                />,
                document.body
            )}
        </div>
    );
}


