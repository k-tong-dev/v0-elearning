"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    GripVertical,
    ChevronUp,
    ChevronDown,
    Edit,
    Trash2,
    Eye,
    Clock,
    Video,
    FileAudio,
    File,
    FileText,
    Image,
    Link,
    Target,
    Award,
    BookOpen,
    LucideIcon,
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    Loader2,
    ShieldAlert,
} from "lucide-react";
import { CourseContentEntity, CourseMaterialEntity, CopyrightCheckStatus } from "@/integrations/strapi/courseMaterial";
import { Instructor } from "@/integrations/strapi/instructor";
import { InstructorDisplay } from "./InstructorDisplay";

interface ContentItemProps {
    content: CourseContentEntity;
    material: CourseMaterialEntity;
    materials: CourseMaterialEntity[];
    collaboratingInstructors: Instructor[];
    index: number;
    onView: (content: CourseContentEntity, materialId: number) => void;
    onEdit: (content: CourseContentEntity, materialId: number) => void;
    onDelete: (content: CourseContentEntity, materialId: number) => void;
    onReorder: (materialId: number, contentId: number, direction: "up" | "down") => void;
    onMoveToMaterial: (content: CourseContentEntity, fromMaterialId: number, targetMaterialId: number) => void;
}

/**
 * Reusable component for displaying a content item in the materials list
 */
export function ContentItem({
    content,
    material,
    materials,
    collaboratingInstructors,
    index,
    onView,
    onEdit,
    onDelete,
    onReorder,
    onMoveToMaterial,
}: ContentItemProps) {
    const getIcon = (): LucideIcon => {
        switch (content.type) {
            case "video": return Video;
            case "audio": return FileAudio;
            case "document": return File;
            case "article": return FileText;
            case "image": return Image;
            case "url": return Link;
            case "quiz": return Target;
            case "certificate": return Award;
            default: return BookOpen;
        }
    };

    const getTypeColor = () => {
        switch (content.type) {
            case "video": return "from-red-500/20 to-orange-500/20 border-red-400/30";
            case "audio": return "from-purple-500/20 to-pink-500/20 border-purple-400/30";
            case "document": return "from-blue-500/20 to-cyan-500/20 border-blue-400/30";
            case "article": return "from-green-500/20 to-emerald-500/20 border-green-400/30";
            case "image": return "from-yellow-500/20 to-amber-500/20 border-yellow-400/30";
            case "url": return "from-indigo-500/20 to-blue-500/20 border-indigo-400/30";
            case "quiz": return "from-violet-500/20 to-purple-500/20 border-violet-400/30";
            case "certificate": return "from-rose-500/20 to-pink-500/20 border-rose-400/30";
            default: return "from-gray-500/20 to-slate-500/20 border-gray-400/30";
        }
    };

    const getCopyrightBadge = () => {
        const status = content.copyright_check_status;
        
        // Only show for video, audio, and url content
        if (!['video', 'audio', 'url'].includes(content.type)) {
            return null;
        }
        
        switch (status) {
            case 'passed':
                return (
                    <Badge variant="outline" className="gap-1 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700">
                        <CheckCircle className="w-3 h-3" />
                        <span className="text-xs">Copyright OK</span>
                    </Badge>
                );
            case 'failed':
                return (
                    <Badge variant="outline" className="gap-1 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700">
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-xs">Failed</span>
                    </Badge>
                );
            case 'warning':
                return (
                    <Badge variant="outline" className="gap-1 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-xs">Warning</span>
                    </Badge>
                );
            case 'checking':
                return (
                    <Badge variant="outline" className="gap-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-xs">Checking...</span>
                    </Badge>
                );
            case 'manual_review':
                return (
                    <Badge variant="outline" className="gap-1 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700">
                        <ShieldAlert className="w-3 h-3" />
                        <span className="text-xs">Manual Review</span>
                    </Badge>
                );
            case 'pending':
            default:
                return (
                    <Badge variant="outline" className="gap-1 bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">Pending Check</span>
                    </Badge>
                );
        }
    };

    const Icon = getIcon();
    const typeColor = getTypeColor();
    const copyrightBadge = getCopyrightBadge();

    return (
        <motion.div
            key={content.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.03 }}
            className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/80 transition-all duration-300 cursor-pointer hover:border-primary/40"
            onClick={() => onView(content, material.id)}
        >
            <div className="relative flex items-center gap-4 p-4">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-move hover:text-primary transition-colors flex-shrink-0" />
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${typeColor} flex items-center justify-center border transition-transform group-hover:scale-110`}>
                    <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {content.name}
                        </span>
                        {content.is_preview && (
                            <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-sm">
                                Preview
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="capitalize font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                            {content.type}
                        </span>
                        {copyrightBadge}
                        {content.estimated_minutes > 0 && (
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{content.estimated_minutes} min</span>
                            </div>
                        )}
                        <InstructorDisplay
                            instructor={content.instructor}
                            collaboratingInstructors={collaboratingInstructors}
                            size="sm"
                            showLabel={false}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                        onClick={() => onReorder(material.id, content.id, "up")}
                        title="Move up"
                    >
                        <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                        onClick={() => onReorder(material.id, content.id, "down")}
                        title="Move down"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </Button>
                    {materials.length > 1 && (
                        <Select
                            onValueChange={(value) =>
                                onMoveToMaterial(
                                    content,
                                    material.id,
                                    parseInt(value, 10),
                                )
                            }
                        >
                            <SelectTrigger className="h-8 w-[140px] text-xs">
                                <SelectValue placeholder="Move to..." />
                            </SelectTrigger>
                            <SelectContent>
                                {materials
                                    .filter((m) => m.id !== material.id)
                                    .map((m) => (
                                        <SelectItem
                                            key={m.id}
                                            value={m.id.toString()}
                                        >
                                            {m.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => onEdit(content, material.id)}
                        title="Edit Content"
                    >
                        <Edit className="w-4 h-4"/>
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDelete(content, material.id)}
                        title="Delete Content"
                    >
                        <Trash2 className="w-4 h-4"/>
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400"
                        onClick={() => onView(content, material.id)}
                        title="View Content"
                    >
                        <Eye className="w-4 h-4"/>
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

