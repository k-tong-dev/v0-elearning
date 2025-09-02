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

interface CourseActionsDropdownProps {
    courseId: string
    courseTitle: string
    // Removed isBookmarked and onBookmarkToggle props as bookmark is now a separate button
}

export function CourseActionsDropdown({
                                          courseId,
                                          courseTitle,
                                      }: CourseActionsDropdownProps) {
    const [showShareDialog, setShowShareDialog] = useState(false)
    const [showReportDialog, setShowReportDialog] = useState(false)
    const [reportReason, setReportReason] = useState("")

    const courseLink = `${window.location.origin}/courses/${courseId}`

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(courseLink)
            toast.success("Course link copied to clipboard!")
        } catch (error) {
            console.error("Failed to copy link:", error)
            toast.error("Failed to copy link.")
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

    const handleReportSubmit = () => {
        if (reportReason.trim()) {
            console.log(`Reporting course ${courseId} for reason: ${reportReason}`)
            toast.success("Course reported successfully. We'll review it shortly.")
            setReportReason("")
            setShowReportDialog(false)
        } else {
            toast.error("Please provide a reason for reporting.")
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
            <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Report Course: {courseTitle}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Textarea
                            placeholder="Please describe why you are reporting this course..."
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleReportSubmit}>
                                <Flag className="w-4 h-4 mr-2" />
                                Submit Report
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}