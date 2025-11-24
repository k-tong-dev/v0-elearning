"use client";

import React from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
    AlertCircle,
    GripVertical,
    Video,
    FileAudio,
    FileIcon,
    BookOpen,
    X,
    ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function DraggableCopyrightModal({
                                     isOpen,
                                     onClose,
                                     copyrightIssues,
                                     onGoBack,
                                 }: {
    isOpen: boolean;
    onClose: () => void;
    copyrightIssues: any[];
    onGoBack: () => void;
}) {
    const dragControls = useDragControls();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    const startDrag = (event: React.PointerEvent) => {
        const target = event.target as HTMLElement;
        if (
            target.closest("button") ||
            target.closest("select") ||
            target.closest("[role='combobox']")
        ) {
            return;
        }
        event.preventDefault();
        dragControls.start(event);
    };

    if (!isOpen || !mounted) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm"
                    />

                    {/* CENTER WRAPPER */}
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center">

                        {/* 🔥 DRAG WRAPPER (LIGHTWEIGHT) */}
                        <motion.div
                            drag
                            dragControls={dragControls}
                            dragListener={false}
                            dragMomentum={false}
                            dragElastic={0}
                            dragConstraints={false}
                            whileDrag={{ scale: 1 }}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            style={{
                                willChange: "transform",
                                touchAction: "manipulation",
                            }}
                            className="pointer-events-auto flex"
                        >

                            {/* 🔥 STATIC MODAL CONTENT (no drag lag!) */}
                            <div
                                className="liquid-glass-card border-2 border-red-200/50 
                                dark:border-red-900/30 bg-white/95 dark:bg-slate-900/95 
                                backdrop-blur-xl rounded-2xl shadow-2xl sm:max-w-3xl 
                                w-[95vw] max-h-[90vh] overflow-hidden flex flex-col mx-4"
                                onClick={(e) => e.stopPropagation()}
                            >

                                {/* HEADER (DRAG AREA) */}
                                <div
                                    onPointerDown={startDrag}
                                    className="relative bg-gradient-to-br 
                                    from-red-500 via-red-600 to-orange-600 p-6 
                                    cursor-grab active:cursor-grabbing select-none"
                                >
                                    <div className="absolute inset-0 bg-black/10"></div>

                                    <div className="relative z-10 flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <GripVertical className="w-5 h-5 text-white/80" />
                                                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                                                    <AlertCircle className="h-6 w-6 text-white" />
                                                </div>
                                                <h2 className="text-2xl font-bold text-white">
                                                    Copyright Issues Detected
                                                </h2>
                                            </div>

                                            <div className="text-red-50 text-base leading-relaxed">
                                                <p className="font-medium">
                                                    Cannot publish paid course with copyright violations
                                                </p>
                                                <div className="text-sm space-y-1 opacity-90">
                                                    <p>• Free courses with copyright issues can be published</p>
                                                    <p>• Paid courses without copyright issues can be published</p>
                                                    <p>• Paid courses with copyright issues cannot be published</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={onClose}
                                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
                                        >
                                            <X className="w-5 h-5 text-white" />
                                        </button>
                                    </div>
                                </div>

                                {/* CONTENT AREA */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background/50 scrollbar-hide">

                                    {/* Summary */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="rounded-xl border-2 border-red-300/50 dark:border-red-800/50 
                                        bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 
                                        dark:to-orange-950/20 p-4 shadow-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-red-500/20">
                                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-red-900 dark:text-red-200 text-base">
                                                    {copyrightIssues.length} Content
                                                    Item{copyrightIssues.length > 1 ? "s" : ""} with Issues
                                                </p>
                                                <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                                                    Please resolve these issues before publishing
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Issues List */}
                                    <div className="space-y-3">
                                        {copyrightIssues.map((issue, index) => (
                                            <motion.div
                                                key={`${issue.content.id}-${index}`}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.15 + index * 0.05 }}
                                                className="group rounded-xl border-2 border-border/50 bg-card/80 
                                                backdrop-blur-sm p-4 space-y-3 hover:border-red-300/50 
                                                dark:hover:border-red-800/50 transition-all duration-200 shadow-sm hover:shadow-md"
                                            >
                                                {/* CONTENT HEADER */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <div className="p-2 rounded-lg bg-gradient-to-br 
                                                            from-blue-500/10 to-purple-500/10 
                                                            border border-blue-200/50 dark:border-blue-800/50"
                                                        >
                                                            {issue.content.type === "video" ? (
                                                                <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                            ) : issue.content.type === "audio" ? (
                                                                <FileAudio className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                            ) : (
                                                                <FileIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                                <span className="font-semibold text-sm">
                                                                    {issue.content.name}
                                                                </span>

                                                                <Badge variant="outline" className="text-xs capitalize border-blue-200 dark:border-blue-800">
                                                                    {issue.content.type}
                                                                </Badge>

                                                                <Badge
                                                                    variant={
                                                                        issue.status === "failed"
                                                                            ? "destructive"
                                                                            : issue.status === "warning"
                                                                                ? "secondary"
                                                                                : "outline"
                                                                    }
                                                                    className="text-xs font-medium"
                                                                >
                                                                    {issue.status === "failed" && "✗ Failed"}
                                                                    {issue.status === "warning" && "⚠ Warning"}
                                                                    {issue.status === "manual_review" && "👁 Review Required"}
                                                                    {issue.status === "pending" && "⏳ Pending"}
                                                                </Badge>
                                                            </div>

                                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                                <BookOpen className="h-3 w-3" />
                                                                Chapter: {issue.material.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Violations */}
                                                {issue.violations?.length > 0 && (
                                                    <div className="mt-3 rounded-lg border border-red-200/50 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20 p-3 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                                            <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                                                                Violations ({issue.violations.length})
                                                            </p>
                                                        </div>

                                                        <ul className="space-y-1.5 ml-3.5">
                                                            {issue.violations.map((v: any, i: number) => (
                                                                <li key={i} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                                                                    <span className="text-red-500 mt-0.5">•</span>
                                                                    <span>{v.message || v.type}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Warnings */}
                                                {issue.warnings?.length > 0 && (
                                                    <div className="mt-2 rounded-lg border border-yellow-200/50 dark:border-yellow-800/50 bg-yellow-50/50 dark:bg-yellow-950/20 p-3 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                                            <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                                                                Warnings ({issue.warnings.length})
                                                            </p>
                                                        </div>

                                                        <ul className="space-y-1.5 ml-3.5">
                                                            {issue.warnings.map((w: any, i: number) => (
                                                                <li key={i} className="text-xs text-yellow-600 dark:text-yellow-400 flex items-start gap-2">
                                                                    <span className="text-yellow-500 mt-0.5">•</span>
                                                                    <span>{w.message || w.type}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Note */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="rounded-xl border-2 border-amber-300/50 dark:border-amber-800/50 
                                        bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 
                                        p-4 shadow-sm"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-1.5 rounded-lg bg-amber-500/20 mt-0.5">
                                                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                                                <strong>Note:</strong> Free courses can be published even with copyright
                                                issues, but paid courses require all copyright
                                                checks to pass. Please resolve all issues before publishing.
                                            </p>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* FOOTER */}
                                <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm p-4 flex items-center justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={onGoBack}
                                        className="h-10 px-6 rounded-xl border-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Go Back to Edit
                                    </Button>

                                    <Button
                                        onClick={onClose}
                                        className="h-10 px-6 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg transition-all"
                                    >
                                        I Understand
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

export default DraggableCopyrightModal;
