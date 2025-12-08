"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CoursePreviewModalProps {
    isOpen: boolean
    onClose: () => void
    courseId: string
    previewUrl?: string // optional direct video link
}

export const CoursePreviewModal: React.FC<CoursePreviewModalProps> = ({
                                                                          isOpen,
                                                                          onClose,
                                                                          courseId,
                                                                          previewUrl,
                                                                      }) => {
    const [videoSrc, setVideoSrc] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    // --- Algorithm Integration ---
    useEffect(() => {
        async function fetchVideo() {
            setLoading(true)
            try {
                // 1. Use provided URL first
                if (previewUrl) {
                    setVideoSrc(previewUrl)
                    return
                }

                const localPath = `/videos/preview_${courseId}.mp4`
                const response = await fetch(localPath, { method: "HEAD" })
                if (response.ok) {
                    setVideoSrc(localPath)
                    return
                }

                const apiResponse = await fetch(`/api/courses/${courseId}/preview`)
                if (apiResponse.ok) {
                    const data = await apiResponse.json()
                    if (data?.preview_video) {
                        setVideoSrc(data.preview_video)
                        return
                    }
                }

                setVideoSrc("/videos/default-preview.mp4")
            } catch (err) {
                console.error("Error fetching preview:", err)
                setVideoSrc("/videos/default-preview.mp4")
            } finally {
                setLoading(false)
            }
        }

        if (isOpen) fetchVideo()
    }, [isOpen, previewUrl, courseId])

    // --- Render ---
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
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Content */}
                        <div className="flex flex-col items-center">
                            {/* Video Section */}
                            <div className="w-full aspect-video bg-black relative">
                                {loading ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="animate-spin w-10 h-10 text-white/70" />
                                    </div>
                                ) : (
                                    <video
                                        src={videoSrc ?? ""}
                                        controls
                                        autoPlay
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover"
                                        onLoadedMetadata={(e) => {
                                            const video = e.currentTarget
                                            if (video.duration > 10) {
                                                video.currentTime = 0
                                                setTimeout(() => video.pause(), 10000)
                                            }
                                        }}
                                    />
                                )}
                            </div>

                            {/* Info Section */}
                            <div className="p-6 text-center">
                                <h2 className="text-xl md:text-2xl font-semibold mb-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                                    Course Preview
                                </h2>
                                <p className="text-muted-foreground text-sm md:text-base mb-4">
                                    Watch a short 10-second highlight before enrolling.
                                </p>
                                <Button
                                    onClick={onClose}
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90 rounded-full px-6 py-2"
                                >
                                    Close Preview
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
