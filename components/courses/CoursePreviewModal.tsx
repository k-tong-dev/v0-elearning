"use client"

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, FileText, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { PdfPreview } from "./course-previews/PdfPreview";
import { ContentPreviewer } from "./course-previews/ContentPreviewer";
import { ImagePreview } from "./course-previews/ImagePreview";

interface CoursePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId?: string;
    courseTitle?: string;
    previewUrl?: string;
    fileType?: string;
    isCourseRestricted?: boolean;
    maxPreviewPages?: number;
    onUrlChange?: (url: string) => void;
}

export const CoursePreviewModal: React.FC<CoursePreviewModalProps> = ({
                                                                          isOpen,
                                                                          onClose,
                                                                          courseTitle = "Course Preview",
                                                                          previewUrl = "https://res.cloudinary.com/dpf3zv351/video/upload/v1761051642/gaze-of-the-blade_jilgoe.mp4",
                                                                          fileType = "video",
                                                                          isCourseRestricted = false,
                                                                          maxPreviewPages = 1,
                                                                          onUrlChange,
                                                                      }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasPlayedThirtySeconds, setHasPlayedThirtySeconds] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoProgress, setVideoProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [customUrl, setCustomUrl] = useState(previewUrl);
    const playerRef = useRef<any>(null);

    useEffect(() => {
        if (isOpen) {
            setIsPlaying(true);
            setHasPlayedThirtySeconds(false);
            setError(null);
            setVideoProgress(0);
            setIsLoading(true);
            setCustomUrl(previewUrl);
        } else {
            setIsPlaying(false);
            setHasPlayedThirtySeconds(false);
            setError(null);
            setVideoProgress(0);
        }
    }, [isOpen, previewUrl, fileType]);

    const onReady = () => {
        console.log("Player is ready");
        setIsLoading(false);
    };

    const handleProgress = (state: { playedSeconds: number, played: number }) => {
        setVideoProgress(state.played * 100);

        if (isCourseRestricted && state.playedSeconds >= 30 && !hasPlayedThirtySeconds) {
            console.log(`Intro preview for course "${courseTitle}" reached 30 seconds at ${new Date().toLocaleString()}`);
            setIsPlaying(false);
            setHasPlayedThirtySeconds(true);
            if (playerRef.current) {
                playerRef.current.seekTo(30); // Ensure it stays at 30s
                playerRef.current.pause();
            }
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        setCustomUrl(newUrl);
        if (onUrlChange) onUrlChange(newUrl);
    };

    const renderPreview = () => {
        if (!customUrl) {
            return <p className="text-red-500 text-center">No preview URL provided.</p>;
        }

        const lowerCaseFileType = fileType.toLowerCase();

        switch (lowerCaseFileType) {
            case "video":
            case "audio":
                return (
                    <div className="relative w-full h-full min-h-[200px]">
                        <ContentPreviewer
                            url={customUrl}
                            fileType={lowerCaseFileType as "video" | "audio"}
                            isPlaying={isPlaying}
                            onError={(msg) => setError(msg)}
                            onReady={onReady}
                            onProgress={handleProgress} // Tracks 30s limit
                        />
                        {isCourseRestricted && hasPlayedThirtySeconds && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white text-center p-8 z-50">
                                <BookOpen className="w-16 h-16 mb-4" />
                                <h3 className="text-2xl font-bold mb-2">Preview Ended</h3>
                                <p className="text-lg mb-6">Enroll in the course to watch the full video.</p>
                                <Button
                                    onClick={() => { /* TODO: Implement enrollment action */ }}
                                    className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:opacity-90 rounded-full px-6 py-2"
                                >
                                    Enroll Now
                                </Button>
                            </div>
                        )}
                        {(lowerCaseFileType === "video" || lowerCaseFileType === "audio") && (
                            <div className="absolute bottom-0 left-0 w-full z-20">
                                <Progress value={videoProgress} className="h-2 rounded-none" />
                            </div>
                        )}
                    </div>
                );
            case "image":
                return (
                    <div className="relative w-full h-full min-h-[200px]">
                        <ImagePreview
                            url={customUrl}
                            onError={(msg) => setError(msg)}
                            onLoad={onReady}
                        />
                    </div>
                );
            case "pdf":
                return (
                    <div className="w-full h-full overflow-auto relative">
                        <PdfPreview
                            url={customUrl}
                            onError={(msg) => setError(msg)}
                            isRestricted={isCourseRestricted}
                        />
                    </div>
                );
            case "quiz":
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <FileText className="w-16 h-16 text-gray-500 mb-4" />
                        <p className="text-muted-foreground text-lg font-semibold">No preview available for quizzes.</p>
                        <p className="text-sm text-muted-foreground">Quizzes are interactive and cannot be previewed here.</p>
                    </div>
                );
            case "doc":
            case "docx":
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <FileText className="w-16 h-16 text-gray-500 mb-4" />
                        <p className="text-muted-foreground text-lg font-semibold">Preview not available for DOC files.</p>
                        <p className="text-sm text-muted-foreground">Please download the file to view its content.</p>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <FileText className="w-16 h-16 text-red-500 mb-4" />
                        <p className="text-red-500 text-lg font-semibold">Unsupported file type: {fileType}</p>
                        <p className="text-sm text-muted-foreground">We cannot display a preview for this content type.</p>
                    </div>
                );
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 z-50 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-full aspect-video bg-black relative flex items-center justify-center min-h-[200px]">
                            <div key={`${customUrl}-${fileType}`} className="w-full h-full">
                                {renderPreview()}
                                {error && <p className="text-red-500 text-center mt-2">{error}</p>}
                            </div>
                        </div>

                        <div className="p-6 text-center">
                            <h2 className="text-xl md:text-2xl font-semibold mb-1 bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                                {courseTitle}
                            </h2>
                            <p className="text-muted-foreground text-sm md:text-base mb-4">
                                Enjoy a short preview of this course.
                            </p>
                            <Button
                                onClick={() => {
                                    onClose();
                                    if (isCourseRestricted && hasPlayedThirtySeconds) {
                                        // router.push(`/courses/${courseId}/enroll`);
                                    }
                                }}
                                className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:opacity-90 rounded-full px-6 py-2"
                            >
                                Close Preview
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};