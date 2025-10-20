"use client"

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const ReactPlayer = dynamic(() => import("react-player").then((mod) => {
    return mod;
}), { ssr: false });

const Document = dynamic(() => import("react-pdf").then((mod) => mod.Document), { ssr: false });
const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), { ssr: false });

interface CoursePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId?: string;
    courseTitle?: string;
    previewUrl?: string;
    fileType?: string;
}

export const CoursePreviewModal: React.FC<CoursePreviewModalProps> = ({
                                                                          isOpen,
                                                                          onClose,
                                                                          courseTitle = "Course Preview",
                                                                          previewUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                                                                          fileType = "video",
                                                                      }) => {
    const [showPlayer, setShowPlayer] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const playerRef = useRef<any>(null);
    const [hasPlayedTenSeconds, setHasPlayedTenSeconds] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setShowPlayer(true);
            if (fileType === "video" || fileType === "audio") {
                setIsPlaying(true);
            }
        } else {
            setShowPlayer(false);
            setIsPlaying(false);
            setHasPlayedTenSeconds(false);
            setError(null);
        }
    }, [isOpen, fileType]);

    const handleProgress = (state: { playedSeconds: number }) => {
        if (state.playedSeconds >= 10 && !hasPlayedTenSeconds) {
            console.log(`Preview for course "${courseTitle}" (ID: ${courseId}, Type: ${fileType}) reached 10 seconds at ${new Date().toLocaleString()}`);
            setIsPlaying(false);
            setHasPlayedTenSeconds(true);
            // Optional: Send to analytics
            /*
            fetch("/api/track-preview", {
                method: "POST",
                body: JSON.stringify({
                    courseId,
                    courseTitle,
                    fileType,
                    event: "preview_10_seconds",
                    timestamp: new Date().toISOString(),
                }),
                headers: { "Content-Type": "application/json" },
            });
            */
        }
    };

    const renderPreview = () => {
        switch (fileType.toLowerCase()) {
            case "video":
            case "audio":
                return (
                    <ReactPlayer
                        ref={playerRef}
                        url={previewUrl}
                        playing={isPlaying}
                        controls
                        width="100%"
                        height={fileType === "video" ? "100%" : "auto"}
                        style={fileType === "video" ? { position: "absolute", top: 0, left: 0 } : {}}
                        onProgress={handleProgress}
                        onError={(e) => {
                            console.error("ReactPlayer error:", e);
                            setError("Failed to load media. Please check the URL or file type.");
                        }}
                        config={{
                            youtube: {
                                playerVars: {
                                    autoplay: 0,
                                    modestbranding: 1,
                                    rel: 0,
                                },
                            },
                            file: {
                                attributes: {
                                    controlsList: fileType === "audio" ? "nodownload" : undefined,
                                },
                            },
                        }}
                    />
                );
            case "pdf":
                return (
                    <div className="w-full h-full overflow-auto">
                        <Document
                            file={previewUrl}
                            onLoadError={(e) => {
                                console.error("PDF load error:", e);
                                setError("Failed to load PDF. Please check the file.");
                            }}
                        >
                            <Page pageNumber={1} width={600} />
                        </Document>
                    </div>
                );
            case "doc":
            case "docx":
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <FileText className="w-16 h-16 text-gray-500" />
                        <p className="text-muted-foreground">Preview not available for DOC files. Download to view.</p>
                    </div>
                );
            default:
                return <p className="text-red-500">Unsupported file type: {fileType}</p>;
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
                            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-full aspect-video bg-black relative flex items-center justify-center">
                            {!showPlayer && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="animate-spin w-10 h-10 text-white/70" />
                                </div>
                            )}
                            {showPlayer && (
                                <>
                                    {error ? (
                                        <p className="text-red-500 text-center">{error}</p>
                                    ) : (
                                        renderPreview()
                                    )}
                                </>
                            )}
                        </div>

                        <div className="p-6 text-center">
                            <h2 className="text-xl md:text-2xl font-semibold mb-1 bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                                {courseTitle}
                            </h2>
                            <p className="text-muted-foreground text-sm md:text-base mb-4">
                                Enjoy a short preview of this course.
                            </p>
                            <Button
                                onClick={onClose}
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