"use client"

import React, { useState } from "react"
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react"
import { Button } from "@/components/ui/button"
import { Share2, Flag, Bookmark, Copy, X } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { createCourseReport } from "@/integrations/strapi/courseReport"
import ReportForm from "@/components/ui/report-form"

interface CourseActionsDropdownProps {
    courseId: string
    courseTitle: string
    // Removed isBookmarked and onBookmarkToggle props as bookmark is now a separate button
}

export function CourseActionsDropdown({
                                          courseId,
                                          courseTitle,
                                      }: CourseActionsDropdownProps) {
    const { user, isAuthenticated } = useAuth()
    const [showShareDialog, setShowShareDialog] = useState(false)
    const [showReportDialog, setShowReportDialog] = useState(false)
    const [isSubmittingReport, setIsSubmittingReport] = useState(false)

    const courseLink = typeof window !== "undefined" ? `${window.location.origin}/courses/${courseId}` : ""

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(courseLink)
            toast.success("Course link copied to clipboard!", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
        } catch (error) {
            console.error("Failed to copy link:", error)
            toast.error("Failed to copy link.", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
        }
        setShowShareDialog(false)
    }

    const handleShareToPlatform = (platform: string) => {
        let shareUrl = ""
        const text = `Check out this course: ${courseTitle}`

        switch (platform) {
            case "twitter":
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(courseLink)}`
                break
            case "facebook":
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(courseLink)}`
                break
            case "linkedin":
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(courseLink)}`
                break
            default:
                break
        }

        if (shareUrl) {
            window.open(shareUrl, "_blank", "width=600,height=400")
        }
        setShowShareDialog(false)
    }

    const handleReportSubmit = async (reportType: string, reason: string) => {
        if (!isAuthenticated || !user?.id) {
            toast.error("Please login to report a course", {
                position: "top-center",
            })
            return
        }

        if (!reason.trim()) {
            toast.error("Please provide a reason for reporting.", {
                position: "top-center",
            })
            return
        }

        try {
            setIsSubmittingReport(true)
            
            const reportTitle = `Course Report: ${courseTitle} - ${reportType}`
            const reportDescription = `Report Type: ${reportType}\n\nReason: ${reason}`
            
            await createCourseReport({
                title: reportTitle,
                description: reportDescription,
                type: reportType,
                course_course: Number(courseId),
                user: user.id,
                url: courseLink,
            })

            toast.success("Course reported successfully. We'll review it shortly.", {
                position: "top-center",
            })
            setShowReportDialog(false)
        } catch (error: any) {
            console.error("Error submitting report:", error)
            toast.error(error?.message || "Failed to submit report. Please try again.", {
                position: "top-center",
            })
        } finally {
            setIsSubmittingReport(false)
        }
    }

    return (
        <>
            <Dropdown>
                <DropdownTrigger>
                    <Button variant="outline" size="sm" className="duration-300 hover:scale-105">
                        <Share2 className="w-5 h-5 mr-1" />
                        Share
                    </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Course actions" variant="faded">
                    <DropdownItem
                        key="share"
                        startContent={<Share2 className="w-4 h-4" />}
                        onPress={() => setShowShareDialog(true)}
                    >
                        Share Course
                    </DropdownItem>
                    {/* Removed bookmark item */}
                    <DropdownItem
                        key="report"
                        className="text-red-500"
                        color="danger"
                        startContent={<Flag className="w-4 h-4 text-red-500" />}
                        onPress={() => setShowReportDialog(true)}
                    >
                        Report Course
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>

            {/* Share Dialog */}
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Share this course</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 p-2 bg-accent rounded-lg border border-border">
                            <Input value={courseLink} readOnly className="flex-1" />
                            <Button onClick={handleCopyLink}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => handleShareToPlatform("twitter")}>
                                Twitter
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={() => handleShareToPlatform("facebook")}>
                                Facebook
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={() => handleShareToPlatform("linkedin")}>
                                LinkedIn
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Report Dialog */}
            <ReportForm
                title={courseTitle}
                isOpen={showReportDialog}
                onOpenChange={setShowReportDialog}
                onSubmit={handleReportSubmit}
            />
        </>
    )
}