"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, Send, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

interface CourseRatingFormProps {
    courseId: string
    initialRating: number | null
    initialComment: string
    hasRated: boolean
    onSubmit: (rating: number, comment: string) => Promise<void>
    isLoading: boolean
}

export function CourseRatingForm({
                                     courseId,
                                     initialRating,
                                     initialComment,
                                     hasRated,
                                     onSubmit,
                                     isLoading,
                                 }: CourseRatingFormProps) {
    const [currentRating, setCurrentRating] = useState(initialRating || 0)
    const [hoverRating, setHoverRating] = useState(0)
    const [commentText, setCommentText] = useState(initialComment)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        setCurrentRating(initialRating || 0)
        setCommentText(initialComment)
    }, [initialRating, initialComment])

    const handleStarClick = (ratingValue: number) => {
        if (!hasRated && !isLoading) {
            setCurrentRating(ratingValue)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (hasRated) {
            toast.info("You have already rated this course.", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
            return
        }
        if (currentRating === 0) {
            toast.error("Please select a star rating.", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
            return
        }

        setIsSubmitting(true)
        try {
            await onSubmit(currentRating, commentText)
            toast.success("Your review has been submitted!", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
        } catch (error) {
            console.error("Failed to submit review:", error)
            toast.error("Failed to submit review. Please try again.", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="liquid-glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    {hasRated ? "Your Review" : "Leave a Review"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((starValue) => (
                            <Star
                                key={starValue}
                                className={`w-8 h-8 cursor-pointer transition-colors duration-200 ${
                                    (hoverRating || currentRating) >= starValue
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                } ${hasRated || isLoading ? "cursor-not-allowed" : ""}`}
                                onMouseEnter={() => !hasRated && !isLoading && setHoverRating(starValue)}
                                onMouseLeave={() => !hasRated && !isLoading && setHoverRating(0)}
                                onClick={() => handleStarClick(starValue)}
                            />
                        ))}
                        {hasRated && (
                            <span className="ml-3 text-sm text-muted-foreground">
                You rated this course {initialRating} stars.
              </span>
                        )}
                    </div>
                    <Textarea
                        placeholder={hasRated ? "Your comment" : "Share your thoughts about this course..."}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        disabled={hasRated || isLoading || isSubmitting}
                        className="min-h-[100px]"
                    />
                    <Button
                        type="submit"
                        disabled={hasRated || isLoading || isSubmitting || currentRating === 0}
                        className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Submitting...
                            </div>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                {hasRated ? "Update Review" : "Submit Review"}
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}