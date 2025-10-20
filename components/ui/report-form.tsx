"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/moving-border"
import { Textarea } from "@/components/ui/textarea"
import { Flag, ArrowLeft, AlertCircle, Info } from "lucide-react"
import { toast } from "sonner"

interface ReportFormProps {
    title: string
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (reportType: string, reason: string) => void
}

export default function ReportForm({ title, isOpen, onOpenChange, onSubmit }: ReportFormProps) {
    const [step, setStep] = useState(1)
    const [reportType, setReportType] = useState("")
    const [reportReason, setReportReason] = useState("")
    const [error, setError] = useState("")
    const [animate, setAnimate] = useState(false)

    const reportTypes = [
        { value: "inappropriate", label: "Inappropriate Content", icon: AlertCircle, description: "Content that violates community guidelines" },
        { value: "misinformation", label: "Misinformation", icon: Info, description: "False or misleading information" },
        { value: "spam", label: "Spam or Advertising", icon: AlertCircle, description: "Promotional or irrelevant content" },
        { value: "offensive", label: "Offensive Content", icon: Flag, description: "Hateful or abusive content" },
        { value: "other", label: "Other", icon: Info, description: "Any other issue not listed" },
    ]

    const maxReasonLength = 500

    useEffect(() => {
        if (isOpen) {
            setAnimate(true)
        }
    }, [isOpen, step])

    const handleNext = () => {
        if (!reportType) {
            setError("Please select a report type.")
            toast.error("Please select a report type.", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
            return
        }
        setError("")
        setStep(2)
    }

    const handleBack = () => {
        setError("")
        setStep(1)
    }

    const handleSubmit = () => {
        if (!reportReason.trim()) {
            setError("Please provide a reason for your report.")
            toast.error("Please provide a reason for your report.", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
            return
        }
        if (reportReason.length > maxReasonLength) {
            setError(`Reason must be ${maxReasonLength} characters or less.`)
            toast.error(`Reason must be ${maxReasonLength} characters or less.`, {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
            return
        }
        onSubmit(reportType, reportReason)
        toast.success("Report submitted successfully!", {
            position: "top-center",
            action: {
                label: "Close",
                onClick: () => {},
            },
            closeButton: false,
        })
        setReportType("")
        setReportReason("")
        setError("")
        setStep(1)
        onOpenChange(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            onOpenChange(open)
            if (!open) {
                setStep(1)
                setReportType("")
                setReportReason("")
                setError("")
                setAnimate(false)
            }
        }}>
            <DialogContent className="max-w-md sm:max-w-lg p-6">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">Report Article: {title}</DialogTitle>
                    <p className="text-sm text-muted-foreground">Step {step} of 2</p>
                </DialogHeader>
                <div className={`space-y-4 transition-opacity duration-300 ${animate ? "opacity-100" : "opacity-0"}`}>
                    {step === 1 ? (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Why are you reporting this article?
                            </p>
                            <div className="grid gap-2 max-h-64 overflow-y-auto">
                                {reportTypes.map((type) => {
                                    const Icon = type.icon
                                    return (
                                        <label
                                            key={type.value}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                                reportType === type.value
                                                    ? "border-primary bg-primary/10"
                                                    : "border-border hover:bg-gray-200 dark:hover:bg-cyan-100/10"
                                            }`}
                                            htmlFor={type.value}
                                        >
                                            <input
                                                type="radio"
                                                id={type.value}
                                                name="reportType"
                                                value={type.value}
                                                checked={reportType === type.value}
                                                onChange={(e) => setReportType(e.target.value)}
                                                className="h-4 w-4 text-primary focus:ring-primary"
                                                aria-describedby={`${type.value}-description`}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Icon className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-medium text-foreground">{type.label}</span>
                                                </div>
                                                <p
                                                    id={`${type.value}-description`}
                                                    className="text-xs text-muted-foreground"
                                                >
                                                    {type.description}
                                                </p>
                                            </div>
                                        </label>
                                    )
                                })}
                            </div>
                            {error && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </p>
                            )}
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleNext} className="hover:bg-primary-dark">
                                    Next
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Please provide details for your report (max {maxReasonLength} characters):
                            </p>
                            <div className="relative">
                                <Textarea
                                    placeholder="Describe the issue in detail..."
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    className="min-h-[120px] resize-none"
                                    maxLength={maxReasonLength}
                                    aria-describedby="reason-error"
                                />
                                <p className="text-xs text-muted-foreground text-right mt-1">
                                    {reportReason.length}/{maxReasonLength}
                                </p>
                                {error && (
                                    <p
                                        id="reason-error"
                                        className="text-sm text-destructive flex items-center gap-1 mt-1"
                                    >
                                        <AlertCircle className="w-4 h-4" /> {error}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleSubmit}
                                    className="hover:bg-destructive-dark"
                                >
                                    <Flag className="w-4 h-4 mr-2" />
                                    Submit Report
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}