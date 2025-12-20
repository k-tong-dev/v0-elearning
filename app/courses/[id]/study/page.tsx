"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Star,
    Clock,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Play,
    CheckCircle,
    BookOpen,
    FileText,
    Video,
    Music,
    ImageIcon,
    File,
    Link as LinkIcon,
    Award,
    ClipboardList,
    Lock,
    X,
    Menu,
    ArrowLeft,
    Trophy,
    Zap,
    Sparkles,
    Target,
    Medal,
    Flame,
    Rocket,
    Crown,
} from "lucide-react"
import { getCourseCourse } from "@/integrations/strapi/courseCourse"
import { getCourseMaterials, getCourseContentsForMaterial, CourseMaterialEntity, CourseContentEntity } from "@/integrations/strapi/courseMaterial"
import { checkUserEnrollment, createCourseEnrollment, updateCourseEnrollment, CourseEnrollment } from "@/integrations/strapi/courseEnrollment"
import { getUserContentProgress, createOrUpdateContentProgress, ContentProgressEntity } from "@/integrations/strapi/contentProgress"
import { getCertificateProgramByCourseContent, addCandidateToCertificateProgram } from "@/integrations/strapi/certificateProgram"
import { createQuizAttempt, updateQuizAttempt, getQuizAttempts, QuizAttemptEntity } from "@/integrations/strapi/quizAttempt"
import { createQuizAttemptAnswer } from "@/integrations/strapi/quizAttemptAnswer"
import { createCertificateIssuance, getCertificateIssuances } from "@/integrations/strapi/certificateIssuance"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { cn } from "@/utils/utils"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import dynamic from "next/dynamic"

// Dynamically import ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import("react-player"), { 
    ssr: false 
})

interface CourseSection {
    material: CourseMaterialEntity;
    contents: CourseContentEntity[];
}

type StudyView = 'lesson' | 'quiz' | 'certificate'

export default function CourseStudyPage() {
    const params = useParams()
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const courseId = params?.id as string

    const [course, setCourse] = useState<any>(null)
    const [sections, setSections] = useState<CourseSection[]>([])
    const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    
    // Study state
    const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0)
    const [activeContentIndex, setActiveContentIndex] = useState<number>(0)
    const [expandedSections, setExpandedSections] = useState<number[]>([])
    const [completedContents, setCompletedContents] = useState<Set<string>>(new Set())
    const [currentView, setCurrentView] = useState<StudyView>('lesson')
    
    // Quiz state
    const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
    const [quizFeedback, setQuizFeedback] = useState<Record<string, { correct: boolean; message: string }>>({})
    const [quizSubmitted, setQuizSubmitted] = useState(false)
    const [xpEarned, setXpEarned] = useState(0)
    
    // Progress tracking state
    const [viewingStartTime, setViewingStartTime] = useState<number | null>(null)
    const [viewedSeconds, setViewedSeconds] = useState<number>(0)
    const [contentProgress, setContentProgress] = useState<ContentProgressEntity | null>(null)

    // Calculate progress - use enrollment progress if available, otherwise calculate from completed contents
    const totalContents = sections.reduce((sum, section) => sum + section.contents.length, 0)
    const completedCount = completedContents.size
    const calculatedProgress = totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0
    const progressPercent = enrollment?.progress_percent ?? calculatedProgress

    // Use ref to prevent unnecessary reloads when user object reference changes
    const dataLoadedRef = useRef(false)
    const userIdRef = useRef<string | number | null>(null)
    
    // Prevent page reload/refresh without confirmation
    // Show confirmation dialog on every page reload/close attempt
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Always show confirmation dialog when user tries to reload/close the page
            e.preventDefault()
            e.returnValue = 'Are you sure you want to leave? Your progress may be lost.' // Required for Chrome
            return 'Are you sure you want to leave? Your progress may be lost.' // Required for other browsers
        }
        
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [])
    
    // Start tracking when user opens/clicks content
    const startContentTracking = useCallback(async (contentId: string | number) => {
        if (!isAuthenticated || !user || !enrollment) {
            return // Silent fail - tracking is optional
        }

        // CRITICAL: Check if content is already marked as completed in local state FIRST
        const contentIdStr = String(contentId)
        if (completedContents.has(contentIdStr)) {
            return // Don't restart tracking for completed content
        }

        // Find the content by ID across all sections
        let content: CourseContentEntity | undefined
        for (const section of sections) {
            content = section.contents.find(c => String(c.id) === String(contentId))
            if (content) break
        }

        if (!content) return

        // CRITICAL: Do NOT start tracking for Quiz or Certificate content types
        // These should only be completed when user answers questions/submits
        const isQuizOrCert = content.type?.toLowerCase().includes('quiz') || 
                           content.type?.toLowerCase().includes('certificate')
        if (isQuizOrCert) {
            console.log(`[Tracking] Skipping tracking for ${content.type} content - tracking only on completion`)
            return
        }

        // Only track if:
        // 1. can_track_progress is true
        // 2. estimated_minutes > 0 (if estimated_minutes is 0, no tracking even if can_track_progress is true)
        if (!content.can_track_progress || (content.estimated_minutes || 0) === 0) {
            return
        }

        try {
            // Check if progress already exists in backend
            // Get existing progress with enrollment filter for precision
            const existingProgress = enrollment 
                ? await getUserContentProgress(user.id, contentId, enrollment.documentId)
                : await getUserContentProgress(user.id, contentId)
            
            // CRITICAL: Only start tracking if not already completed (double-check)
            if (existingProgress && existingProgress.tracking_status === "completed") {
                // Ensure it's in completedContents set
                setCompletedContents(prev => {
                    if (!prev.has(contentIdStr)) {
                        return new Set([...prev, contentIdStr])
                    }
                    return prev
                })
                return // Don't restart tracking for completed content
            }

            // Create or update progress to "in_progress"
            await createOrUpdateContentProgress({
                user: user.id,
                course_content: contentId,
                course_enrollment: enrollment.documentId,
                tracking_status: "in_progress",
                watched_percent: existingProgress?.watched_percent || 0,
            })
        } catch (error) {
            // Silent fail - don't interrupt user experience
            console.warn("Failed to start content tracking:", error)
        }
    }, [isAuthenticated, user, enrollment, sections, completedContents])
    
    useEffect(() => {
        if (courseId) {
            // Only reload if courseId changes or user.id changes (not just user object reference)
            const currentUserId = user?.id || null
            // Don't reload if we already have enrollment - prevents duplicate creation
            const shouldReload = !dataLoadedRef.current || 
                                 userIdRef.current !== currentUserId ||
                                 (dataLoadedRef.current && !enrollment && isAuthenticated && user && !dataLoadedRef.current)
            
            if (shouldReload && !enrollment) { // Only load if no enrollment exists
                dataLoadedRef.current = true
                userIdRef.current = currentUserId
                loadCourseData()
            }
        }
    }, [courseId, user?.id, isAuthenticated])

    // CRITICAL: Reload progress when enrollment becomes available (handles page refresh/return)
    useEffect(() => {
        if (enrollment && sections.length > 0 && isAuthenticated && user) {
            // Only reload if completedContents is empty (progress not loaded yet)
            if (completedContents.size === 0) {
                const reloadProgress = async () => {
                    const completedSet = new Set<string>()
                    const progressPromises: Promise<void>[] = []
                    
                    for (const section of sections) {
                        for (const content of section.contents) {
                            progressPromises.push(
                                getUserContentProgress(user.id, content.id, enrollment.documentId)
                                    .then(progress => {
                                        if (progress && progress.tracking_status === "completed") {
                                            completedSet.add(String(content.id))
                                        }
                                    })
                                    .catch(err => {
                                        console.warn(`Failed to load progress for content ${content.id}:`, err)
                                    })
                            )
                        }
                    }
                    
                    await Promise.all(progressPromises)
                    setCompletedContents(completedSet)
                }
                reloadProgress()
            }
        }
    }, [enrollment?.documentId, sections.length, isAuthenticated, user?.id])

    // Auto-update completedContents when contentProgress changes
    useEffect(() => {
        if (sections.length > 0 && activeSectionIndex >= 0 && activeContentIndex >= 0) {
            const currentContent = sections[activeSectionIndex]?.contents[activeContentIndex]
            if (currentContent && contentProgress && contentProgress.tracking_status === "completed") {
                const contentIdStr = String(currentContent.id)
                setCompletedContents(prev => {
                    if (!prev.has(contentIdStr)) {
                        return new Set([...prev, contentIdStr])
                    }
                    return prev
                })
            }
        }
    }, [contentProgress, sections, activeSectionIndex, activeContentIndex])

    const loadCourseData = async () => {
        try {
            setIsLoading(true)
            
            // Load course
            const courseData = await getCourseCourse(courseId)
            if (!courseData) {
                toast.error("Course not found")
                router.push("/courses")
                return
            }
            setCourse(courseData)

            // Check enrollment or create if starting course
            if (isAuthenticated && user) {
                let userEnrollment = await checkUserEnrollment(user.id, courseId)
                
                if (!userEnrollment) {
                    // User is starting the course - enroll them
                    // Double-check to prevent race conditions
                    userEnrollment = await checkUserEnrollment(user.id, courseId)
                    if (!userEnrollment) {
                        try {
                            userEnrollment = await createCourseEnrollment({
                                user: user.id,
                                course_course: courseId,
                                enroll_status: 'active',
                                enrolled_via: courseData.Price > 0 ? 'purchase' : 'free',
                                started_at: new Date().toISOString(),
                                progress_percent: 0,
                            })
                            if (userEnrollment) {
                                toast.success("You've been enrolled in this course!")
                            }
                        } catch (error: any) {
                            // If error is about duplicate, try to fetch existing enrollment
                            if (error?.message?.includes('duplicate') || error?.response?.status === 400) {
                                userEnrollment = await checkUserEnrollment(user.id, courseId)
                                if (userEnrollment) {
                                    console.log("Found existing enrollment after duplicate error")
                                } else {
                                    console.error("Error creating enrollment:", error)
                                    toast.error("Failed to enroll in course")
                                }
                            } else {
                                console.error("Error creating enrollment:", error)
                                toast.error("Failed to enroll in course")
                            }
                        }
                    }
                }
                
                if (userEnrollment) {
                    setEnrollment(userEnrollment)
                }
            }

            // Load course materials and contents
            const materials = await getCourseMaterials(courseId)
            const sectionsData: CourseSection[] = []
            
            for (const material of materials) {
                const contents = await getCourseContentsForMaterial(material.id)
                sectionsData.push({ material, contents })
            }
            
            // CRITICAL: Load progress for all contents BEFORE setting sections
            // This ensures completedContents is populated IMMEDIATELY when page loads
            let completedSet = new Set<string>()
            if (isAuthenticated && user && enrollment) {
                // Load progress for all contents in parallel for better performance
                const progressPromises: Promise<void>[] = []
                
                for (const section of sectionsData) {
                    for (const content of section.contents) {
                        // Use enrollment documentId for more precise filtering
                        progressPromises.push(
                            getUserContentProgress(user.id, content.id, enrollment.documentId)
                                .then(progress => {
                                    if (progress && progress.tracking_status === "completed") {
                                        completedSet.add(String(content.id))
                                    }
                                })
                                .catch(err => {
                                    console.warn(`Failed to load progress for content ${content.id}:`, err)
                                })
                        )
                    }
                }
                
                // Wait for all progress to load before setting state
                await Promise.all(progressPromises)
                
                // Update enrollment progress if needed
                const totalContents = sectionsData.reduce((sum, s) => sum + s.contents.length, 0)
                const completedCount = completedSet.size
                const calculatedProgress = totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0
                
                if (enrollment.progress_percent !== calculatedProgress && enrollment.documentId) {
                    // Update enrollment progress in background
                    updateCourseEnrollment(enrollment.documentId, {
                        progress_percent: calculatedProgress
                    }).then((updated) => {
                        if (updated) {
                            setEnrollment(updated)
                        }
                    }).catch((error) => {
                        console.warn("Failed to update enrollment progress:", error)
                    })
                }
            }
            
            // Set sections AND completedContents together to ensure they're in sync
            setSections(sectionsData)
            setCompletedContents(completedSet)
            
            // Expand first section by default
            if (sectionsData.length > 0) {
                setExpandedSections([0])
            }
            
        } catch (error) {
            console.error("Error loading course data:", error)
            toast.error("Failed to load course")
        } finally {
            setIsLoading(false)
        }
    }

    const toggleSection = (index: number) => {
        setExpandedSections(prev => 
            prev.includes(index) 
                ? prev.filter(i => i !== index)
                : [...prev, index]
        )
    }

    const selectContent = async (sectionIndex: number, contentIndex: number) => {
        // Check if material is locked
        const section = sections[sectionIndex]
        if (section?.material?.is_locked) {
            toast.error("This material is locked and cannot be accessed")
            return
        }

        // Start tracking when user opens content
        const selectedContent = sections[sectionIndex]?.contents[contentIndex]
        if (!selectedContent) return

        // Check if content is already marked as completed in local state FIRST
        const contentIdStr = String(selectedContent.id)
        const isAlreadyCompleted = completedContents.has(contentIdStr)
        
        // Load existing progress for this content (before updating state)
        // This ensures progress is available immediately when content is displayed
        let progress: ContentProgressEntity | null = null
        if (isAuthenticated && user && enrollment) {
            try {
                progress = await getUserContentProgress(user.id, selectedContent.id, enrollment.documentId)
                
                // CRITICAL: If progress shows completed, ensure it's in completedContents set
                if (progress && progress.tracking_status === "completed") {
                    setCompletedContents(prev => {
                        if (!prev.has(contentIdStr)) {
                            return new Set([...prev, contentIdStr])
                        }
                        return prev
                    })
                }
            } catch (error) {
                console.warn("Failed to load content progress:", error)
            }
        }

        // CRITICAL CHECK: If content is completed (from any source), NEVER start tracking
        const isCompleted = isAlreadyCompleted || (progress && progress.tracking_status === "completed")
        
        // Check if this is a quiz or certificate content
        const isQuizOrCert = selectedContent.type?.toLowerCase().includes('quiz') || 
                           selectedContent.type?.toLowerCase().includes('certificate')
        
        // ALWAYS reset quiz state when switching content, especially for quizzes
        // This ensures each quiz gets a fresh state
        if (isQuizOrCert) {
            setQuizSubmitted(false)
            setQuizAnswers({})
            setQuizFeedback({})
            setXpEarned(0)
        }
        
        if (isCompleted) {
            // Update state but DO NOT start tracking
            setContentProgress(progress)
            setActiveSectionIndex(sectionIndex)
            setActiveContentIndex(contentIndex)
            setCurrentView('lesson')
            // Quiz state already reset above if it's a quiz/certificate
            
            // For completed content, set viewedSeconds to estimated time (or last_position if available)
            const estimatedSeconds = (selectedContent.estimated_minutes || 0) * 60
            const completedSeconds = progress?.last_position_seconds || estimatedSeconds || 0
            setViewedSeconds(completedSeconds)
            setViewingStartTime(Date.now() - (completedSeconds * 1000))
            // CRITICAL: Return early - DO NOT start tracking for completed content
            return
        }

        // Now update state with progress already loaded (content is NOT completed)
        setContentProgress(progress)
        
        // Update active content state
        setActiveSectionIndex(sectionIndex)
        setActiveContentIndex(contentIndex)
        setCurrentView('lesson')
        
        // Quiz state already reset above if it's a quiz/certificate
        // No need to reset again here since we already did it earlier
        
        if (selectedContent) {
            
            // Initialize viewedSeconds from progress if available, otherwise reset to 0
            // Only reset if tracking_status is NOT "completed"
            if (progress && progress.last_position_seconds && progress.tracking_status !== "completed") {
                setViewedSeconds(progress.last_position_seconds)
                setViewingStartTime(Date.now() - (progress.last_position_seconds * 1000))
            } else if (!progress || progress.tracking_status !== "completed") {
                // Reset viewing time when switching to another content (only if not completed)
                setViewedSeconds(0)
                setViewingStartTime(Date.now())
            }
            
            // Only start tracking if ALL conditions are met:
            // 1. Content is NOT completed (already checked above)
            // 2. can_track_progress is true
            // 3. estimated_minutes > 0
            // 4. Content is NOT Quiz or Certificate (these complete based on answers, not time)
            // 5. User is authenticated and enrolled
            // Note: isQuizOrCert is already declared above (line 437), reusing it here
            
            // CRITICAL: Triple-check completion status before starting tracking
            // Check completedContents set (synchronous check)
            const isCompletedInSet = completedContents.has(contentIdStr)
            // Check progress from backend (just loaded)
            const isCompletedInProgress = progress && progress.tracking_status === "completed"
            const finalCheckCompleted = isCompletedInSet || isCompletedInProgress
            
            // If completed, ensure it's in the set and NEVER start tracking
            if (finalCheckCompleted) {
                if (!isCompletedInSet && isCompletedInProgress) {
                    // Sync completedContents set with backend progress
                    setCompletedContents(prev => {
                        if (!prev.has(contentIdStr)) {
                            return new Set([...prev, contentIdStr])
                        }
                        return prev
                    })
                }
                // DO NOT start tracking - content is completed
                return
            }
            
            // CRITICAL: Do NOT start tracking for Quiz or Certificate content types
            // These should only be completed when user answers questions/submits, not based on time
            if (isQuizOrCert) {
                console.log(`[Tracking] Skipping auto-tracking for ${selectedContent.type} - tracking only on quiz/certificate completion`)
                // Reset viewing time for Quiz/Certificate (no time tracking)
                setViewedSeconds(0)
                setViewingStartTime(null)
                return // Exit early - no tracking for Quiz/Certificate
            }
            
            // Only start tracking if content is NOT completed and all conditions are met
            if (isAuthenticated && user && enrollment) {
                if (selectedContent.can_track_progress && 
                    (selectedContent.estimated_minutes || 0) > 0) {
                    // Start tracking in background (don't await to avoid blocking UI)
                    startContentTracking(selectedContent.id).catch(err => 
                        console.warn("Failed to start content tracking:", err)
                    )
                }
            } else if (!isAuthenticated) {
                // Not authenticated, reset time and only start tracking if conditions are met
                setViewedSeconds(0)
                setViewingStartTime(Date.now())
                if (selectedContent.can_track_progress && (selectedContent.estimated_minutes || 0) > 0) {
                    startContentTracking(selectedContent.id).catch(err => 
                        console.warn("Failed to start content tracking:", err)
                    )
                }
            }
        }
    }

    const markContentComplete = async (contentId: string) => {
        if (!isAuthenticated || !user || !enrollment) {
            toast.error("Please login to track progress")
            return
        }
        
        // Ensure contentId is stored as string for consistency
        const contentIdStr = String(contentId)
        
        // Check if already completed to prevent duplicate calls
        if (completedContents.has(contentIdStr)) {
            toast.info("This content is already marked as complete")
            return
        }
        
        try {
            // Update content progress in backend with course_enrollment relation
            await createOrUpdateContentProgress({
                user: user.id,
                course_content: contentId,
                course_enrollment: enrollment.documentId, // Link to enrollment
                tracking_status: "completed",
                watched_percent: 100,
            })
            
            // Update local state - ensure contentId is stored as string for consistency
            setCompletedContents(prev => {
                const newSet = new Set([...prev, contentIdStr])
                
                // Calculate and update enrollment progress
                const totalContents = sections.reduce((sum, section) => sum + section.contents.length, 0)
                const completedCount = newSet.size
                const newProgress = totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0
                
                // Update enrollment progress in backend
                if (enrollment.documentId && enrollment.progress_percent !== newProgress) {
                    updateCourseEnrollment(enrollment.documentId, {
                        progress_percent: newProgress
                    }).then((updated) => {
                        if (updated) {
                            setEnrollment(updated)
                        }
                    }).catch((error) => {
                        console.warn("Failed to update enrollment progress:", error)
                    })
                }
                
                return newSet
            })
            
            toast.success("Lesson completed! 🎉")
        } catch (error: any) {
            console.error("Error marking content complete:", error)
            toast.error("Failed to save progress. Please try again.")
        }
    }

    const getContentTypeIcon = (type: string | null | undefined) => {
        if (!type) return FileText
        const normalizedType = type.toLowerCase()
        if (normalizedType.includes('video')) return Video
        if (normalizedType.includes('audio')) return Music
        if (normalizedType.includes('document') || normalizedType.includes('pdf')) return FileText
        if (normalizedType.includes('image')) return ImageIcon
        if (normalizedType.includes('quiz')) return ClipboardList
        if (normalizedType.includes('certificate')) return Award
        if (normalizedType.includes('url') || normalizedType.includes('link')) return LinkIcon
        return FileText
    }

    const getContentTypeColor = (type: string | null | undefined) => {
        if (!type) return "text-blue-500"
        const normalizedType = type.toLowerCase()
        if (normalizedType.includes('video')) return "text-red-500"
        if (normalizedType.includes('audio')) return "text-purple-500"
        if (normalizedType.includes('document') || normalizedType.includes('pdf')) return "text-orange-500"
        if (normalizedType.includes('image')) return "text-green-500"
        if (normalizedType.includes('quiz')) return "text-yellow-500"
        if (normalizedType.includes('certificate')) return "text-amber-500"
        return "text-blue-500"
    }

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes}m`
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }

    const currentContent = sections[activeSectionIndex]?.contents[activeContentIndex]
    const isQuiz = currentContent?.type?.toLowerCase().includes('quiz')
    const isCompleted = currentContent && completedContents.has(String(currentContent.id))

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Course not found</p>
                    <Button onClick={() => router.push("/courses")}>Back to Courses</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen bg-background overflow-hidden flex flex-col">
            {/* Back Button - Top Left */}
            <div className="absolute top-4 left-4 z-50">
                <Button
                    variant="outline"
                    onClick={() => router.push(`/courses/${courseId}`)}
                    className="bg-background/90 backdrop-blur-sm border-2 hover:bg-background shadow-lg"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Course
                </Button>
            </div>
            
            {/* Study Interface */}
            <div className="flex h-full pt-0">
                {/* Left Sidebar - Course Navigation */}
                <motion.div
                    initial={{ x: sidebarOpen ? 0 : -320 }}
                    animate={{ x: sidebarOpen ? 0 : -320 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                        "fixed lg:relative z-40 h-full w-80 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 flex flex-col",
                        "shadow-2xl lg:shadow-none",
                        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    )}
                >
                    {/* Sidebar Header */}
                    <div className="p-6 border-b border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/courses/${courseId}`)}
                                className="text-slate-300 hover:text-white"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Course
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden text-slate-300 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        
                        <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">
                            {course.name}
                        </h2>
                        
                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Progress</span>
                                <span className="text-white font-semibold">{progressPercent}%</span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                        </div>
                    </div>

                    {/* Sidebar Tabs */}
                    <div className="flex border-b border-slate-800">
                        <button
                            onClick={() => setCurrentView('lesson')}
                            className={cn(
                                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                                currentView === 'lesson'
                                    ? "bg-slate-800 text-white border-b-2 border-primary"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            )}
                        >
                            Lessons
                        </button>
                        <button
                            onClick={() => setCurrentView('lesson')}
                            className={cn(
                                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                                "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            )}
                        >
                            Review
                        </button>
                    </div>

                    {/* Course Sections */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-4 space-y-2">
                            {sections.map((section, sectionIndex) => {
                                const isExpanded = expandedSections.includes(sectionIndex)
                                const sectionCompletedCount = section.contents.filter(c => 
                                    completedContents.has(String(c.id))
                                ).length
                                const isMaterialLocked = section.material.is_locked || false
                                
                                return (
                                    <div key={section.material.id} className="space-y-1">
                                        {/* Section Header */}
                                        <button
                                            onClick={() => !isMaterialLocked && toggleSection(sectionIndex)}
                                            disabled={isMaterialLocked}
                                            className={cn(
                                                "w-full flex items-center justify-between p-3 rounded-lg transition-colors group",
                                                isMaterialLocked 
                                                    ? "opacity-50 cursor-not-allowed" 
                                                    : "hover:bg-slate-800"
                                            )}
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <ChevronDown
                                                    className={cn(
                                                        "w-4 h-4 text-slate-400 transition-transform",
                                                        isExpanded ? "rotate-0" : "-rotate-90",
                                                        isMaterialLocked && "opacity-50"
                                                    )}
                                                />
                                                {isMaterialLocked && (
                                                    <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                )}
                                                <span className={cn(
                                                    "text-sm font-semibold truncate",
                                                    isMaterialLocked ? "text-slate-500" : "text-white"
                                                )}>
                                                    {section.material.name}
                                                </span>
                                            </div>
                                            <span className={cn(
                                                "text-xs ml-2",
                                                isMaterialLocked ? "text-slate-500" : "text-slate-400"
                                            )}>
                                                {sectionCompletedCount}/{section.contents.length}
                                            </span>
                                        </button>

                                        {/* Section Contents */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="ml-4 space-y-1 border-l-2 border-slate-800 pl-3"
                                                >
                                                    {section.contents.map((content, contentIndex) => {
                                                        const ContentIcon = getContentTypeIcon(content.type)
                                                        const iconColor = getContentTypeColor(content.type)
                                                        const isActive = activeSectionIndex === sectionIndex && 
                                                                        activeContentIndex === contentIndex
                                                        const isContentCompleted = completedContents.has(String(content.id))
                                                        const isContentDisabled = isMaterialLocked
                                                        
                                                        return (
                                                            <button
                                                                key={content.id}
                                                                onClick={() => !isContentDisabled && selectContent(sectionIndex, contentIndex)}
                                                                disabled={isContentDisabled}
                                                                className={cn(
                                                                    "w-full flex items-center gap-3 p-2 rounded-lg transition-all group",
                                                                    isContentDisabled
                                                                        ? "opacity-50 cursor-not-allowed text-slate-500"
                                                                        : isActive
                                                                        ? "bg-primary/20 text-white"
                                                                        : "hover:bg-slate-800/50 text-slate-300 hover:text-white"
                                                                )}
                                                            >
                                                                <ContentIcon className={cn(
                                                                    "w-4 h-4 flex-shrink-0", 
                                                                    isContentDisabled ? "text-slate-500" : iconColor
                                                                )} />
                                                                <span className="text-sm flex-1 text-left truncate">
                                                                    {content.name}
                                                                </span>
                                                                {isContentDisabled && (
                                                                    <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                                )}
                                                                {!isContentDisabled && isContentCompleted && (
                                                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
                    {/* Mobile Sidebar Toggle */}
                    {!sidebarOpen && (
                        <div className="lg:hidden fixed top-4 left-4 z-50">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSidebarOpen(true)}
                                className="bg-background/90 backdrop-blur-sm border-2 shadow-lg"
                            >
                                <Menu className="w-4 h-4 mr-2" />
                                Menu
                            </Button>
                        </div>
                    )}

                    {/* Content Display */}
                    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
                        {currentContent ? (
                            <div className="max-w-5xl mx-auto p-6 lg:p-12">
                                {/* Check if content is in locked material */}
                                {sections[activeSectionIndex]?.material?.is_locked ? (
                                    <div className="flex items-center justify-center h-full min-h-[400px]">
                                        <div className="text-center space-y-4">
                                            <Lock className="w-16 h-16 mx-auto text-muted-foreground" />
                                            <h2 className="text-2xl font-bold">Content Locked</h2>
                                            <p className="text-muted-foreground">
                                                This content is part of a locked material and cannot be accessed at this time.
                                            </p>
                                            <Button onClick={() => router.push(`/courses/${courseId}`)}>
                                                Back to Course
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <ContentViewRenderer
                                        content={currentContent}
                                        isCompleted={isCompleted}
                                        contentProgress={contentProgress}
                                        viewedSeconds={viewedSeconds}
                                        setViewedSeconds={setViewedSeconds}
                                        enrollment={enrollment}
                                        user={user}
                                        quizAnswers={quizAnswers}
                                        setQuizAnswers={setQuizAnswers}
                                        quizFeedback={quizFeedback}
                                        setQuizFeedback={setQuizFeedback}
                                        quizSubmitted={quizSubmitted}
                                        setQuizSubmitted={setQuizSubmitted}
                                        xpEarned={xpEarned}
                                        setXpEarned={setXpEarned}
                                        onComplete={() => markContentComplete(String(currentContent.id))}
                                        onNext={() => {
                                            // Navigate to next content
                                            if (activeContentIndex < sections[activeSectionIndex].contents.length - 1) {
                                                setActiveContentIndex(activeContentIndex + 1)
                                            } else if (activeSectionIndex < sections.length - 1) {
                                                setActiveSectionIndex(activeSectionIndex + 1)
                                                setActiveContentIndex(0)
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground text-lg">Select a lesson to begin</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// Content View Renderer - Dynamically selects the appropriate view based on content type
function ContentViewRenderer({
    content,
    isCompleted,
    contentProgress,
    viewedSeconds,
    setViewedSeconds,
    enrollment,
    user,
    quizAnswers,
    setQuizAnswers,
    quizFeedback,
    setQuizFeedback,
    quizSubmitted,
    setQuizSubmitted,
    xpEarned,
    setXpEarned,
    onComplete,
    onNext
}: {
    content: CourseContentEntity
    isCompleted: boolean
    contentProgress?: ContentProgressEntity | null
    viewedSeconds: number
    setViewedSeconds: React.Dispatch<React.SetStateAction<number>>
    enrollment?: CourseEnrollment | null
    user?: { id: string | number } | null
    quizAnswers: Record<string, string>
    setQuizAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>
    quizFeedback: Record<string, { correct: boolean; message: string }>
    setQuizFeedback: React.Dispatch<React.SetStateAction<Record<string, { correct: boolean; message: string }>>>
    quizSubmitted: boolean
    setQuizSubmitted: React.Dispatch<React.SetStateAction<boolean>>
    xpEarned: number
    setXpEarned: React.Dispatch<React.SetStateAction<number>>
    onComplete: () => void
    onNext: () => void
}) {
    const contentType = content.type?.toLowerCase() || ''
    
    // Comprehensive debug logging for content data
    useEffect(() => {
        console.log("=== ContentViewRenderer Debug ===")
        console.log("Content Type:", contentType)
        console.log("Content Name:", content.name)
        console.log("Content ID:", content.id)
        console.log("Content URL field:", content.url)
        console.log("Content Audio:", content.audio)
        console.log("Content Video:", content.video)
        console.log("Content Document:", content.document)
        console.log("Content Images:", content.images)
        console.log("Content Article:", content.article ? `Article present (${content.article.length} chars)` : "No article")
        console.log("Full Content Object:", content)
        console.log("================================")
    }, [content.id, contentType, content.name])
    
    // Render appropriate view based on content type
    if (contentType.includes('quiz')) {
        return (
            <QuizView
                content={content}
                isCompleted={isCompleted}
                contentProgress={contentProgress}
                enrollment={enrollment}
                user={user}
                quizAnswers={quizAnswers}
                setQuizAnswers={setQuizAnswers}
                quizFeedback={quizFeedback}
                setQuizFeedback={setQuizFeedback}
                quizSubmitted={quizSubmitted}
                setQuizSubmitted={setQuizSubmitted}
                xpEarned={xpEarned}
                setXpEarned={setXpEarned}
                onComplete={onComplete}
            />
        )
    }
    
    if (contentType.includes('certificate')) {
        return (
            <CertificateView
                content={content}
                isCompleted={isCompleted}
                contentProgress={contentProgress}
                enrollment={enrollment}
                user={user}
                quizAnswers={quizAnswers}
                setQuizAnswers={setQuizAnswers}
                quizFeedback={quizFeedback}
                setQuizFeedback={setQuizFeedback}
                quizSubmitted={quizSubmitted}
                setQuizSubmitted={setQuizSubmitted}
                xpEarned={xpEarned}
                setXpEarned={setXpEarned}
                onComplete={onComplete}
            />
        )
    }
    
    if (contentType.includes('video')) {
        return (
            <VideoView
                content={content}
                isCompleted={isCompleted}
                contentProgress={contentProgress}
                viewedSeconds={viewedSeconds}
                setViewedSeconds={setViewedSeconds}
                enrollment={enrollment}
                onComplete={onComplete}
                onNext={onNext}
            />
        )
    }
    
    if (contentType.includes('audio')) {
        return (
            <AudioView
                content={content}
                isCompleted={isCompleted}
                contentProgress={contentProgress}
                viewedSeconds={viewedSeconds}
                setViewedSeconds={setViewedSeconds}
                enrollment={enrollment}
                onComplete={onComplete}
                onNext={onNext}
            />
        )
    }
    
    if (contentType.includes('image')) {
        return (
            <ImageView
                content={content}
                isCompleted={isCompleted}
                contentProgress={contentProgress}
                viewedSeconds={viewedSeconds}
                setViewedSeconds={setViewedSeconds}
                enrollment={enrollment}
                onComplete={onComplete}
                onNext={onNext}
            />
        )
    }
    
    if (contentType.includes('article')) {
        return (
            <ArticleView
                content={content}
                isCompleted={isCompleted}
                contentProgress={contentProgress}
                viewedSeconds={viewedSeconds}
                setViewedSeconds={setViewedSeconds}
                enrollment={enrollment}
                onComplete={onComplete}
                onNext={onNext}
            />
        )
    }
    
    if (contentType.includes('url')) {
        return (
            <UrlView
                content={content}
                isCompleted={isCompleted}
                contentProgress={contentProgress}
                viewedSeconds={viewedSeconds}
                setViewedSeconds={setViewedSeconds}
                enrollment={enrollment}
                onComplete={onComplete}
                onNext={onNext}
            />
        )
    }
    
    if (contentType.includes('document')) {
        return (
            <DocumentView
                content={content}
                isCompleted={isCompleted}
                contentProgress={contentProgress}
                viewedSeconds={viewedSeconds}
                setViewedSeconds={setViewedSeconds}
                enrollment={enrollment}
                onComplete={onComplete}
                onNext={onNext}
            />
        )
    }
    
    // Default fallback to LessonView for unknown types
    return (
        <LessonView
            content={content}
            isCompleted={isCompleted}
            contentProgress={contentProgress}
            viewedSeconds={viewedSeconds}
            setViewedSeconds={setViewedSeconds}
            enrollment={enrollment}
            onComplete={onComplete}
            onNext={onNext}
        />
    )
}

// Lesson View Component (kept for backward compatibility and as fallback)
function LessonView({ 
    content, 
    isCompleted, 
    contentProgress,
    viewedSeconds,
    setViewedSeconds,
    enrollment,
    onComplete,
    onNext 
}: { 
    content: CourseContentEntity
    isCompleted: boolean
    contentProgress?: ContentProgressEntity | null
    viewedSeconds: number
    setViewedSeconds: React.Dispatch<React.SetStateAction<number>>
    enrollment?: CourseEnrollment | null
    onComplete: () => void
    onNext: () => void
}) {
    const ContentIcon = content.type?.toLowerCase().includes('video') ? Video :
                       content.type?.toLowerCase().includes('audio') ? Music :
                       content.type?.toLowerCase().includes('document') ? FileText :
                       content.type?.toLowerCase().includes('image') ? ImageIcon :
                       FileText

    // Check if content is actually completed (from backend progress or local state)
    const isActuallyCompleted = isCompleted || 
                               (contentProgress && contentProgress.tracking_status === "completed")
    
    // Calculate if estimated_minutes requirement is met
    const estimatedMinutes = content.estimated_minutes || 0
    const estimatedSeconds = estimatedMinutes * 60
    
    // Check if content is Quiz or Certificate (these have special completion logic - no time tracking)
    const isQuizOrCertificate = content.type?.toLowerCase().includes('quiz') || 
                                content.type?.toLowerCase().includes('certificate')
    
    // Allow marking complete based on logic:
    // 1. Already completed (don't allow if already completed)
    // 2. For Quiz/Certificate: Only allow completion when questions are answered (handled in QuizView/CertificateView)
    // 3. For other content:
    //    - If can_track_progress is FALSE: Allow immediate completion (don't require estimated_minutes)
    //    - If can_track_progress is TRUE: Require estimated_minutes to be met OR estimated_minutes is 0
    const canMarkComplete = !isActuallyCompleted && (
                           isQuizOrCertificate 
                               ? false // Quiz/Certificate completion is handled in their respective views
                               : !content.can_track_progress
                               ? true // If tracking disabled, allow immediate completion
                               : (estimatedMinutes === 0 || viewedSeconds >= estimatedSeconds) // If tracking enabled, require time
    )
    
    // Can proceed to next content if completed or can mark complete
    const canProceed = isActuallyCompleted || canMarkComplete

    // Update completedContents when contentProgress shows completed status
    useEffect(() => {
        if (contentProgress && contentProgress.tracking_status === "completed") {
            const contentIdStr = String(content.id)
            // This will trigger a re-render with updated isCompleted state
            // Note: We can't directly update completedContents here as it's in parent scope
            // The parent component should handle this in selectContent
        }
    }, [contentProgress, content.id])

    // Track viewing time ONLY if can_track_progress is true AND estimated_minutes > 0
    // IMPORTANT: Quiz and Certificate content types should NOT use time tracking
    // They should only be completed when user answers questions/submits
    useEffect(() => {
        // Don't track if:
        // 1. can_track_progress is false
        // 2. estimated_minutes is 0 (no tracking requirement)
        // 3. Content is already completed
        // 4. Content type is Quiz or Certificate (these should only complete when questions are answered)
        if (!content.can_track_progress || estimatedMinutes === 0 || isActuallyCompleted || isQuizOrCertificate) {
            return
        }

        const interval = setInterval(() => {
            setViewedSeconds((prev: number) => {
                const newSeconds = prev + 1
                
                // Auto-complete when viewed time reaches estimated time
                if (newSeconds >= estimatedSeconds && !isActuallyCompleted) {
                    // Mark as complete automatically
                    setTimeout(() => {
                        onComplete()
                    }, 0)
                    return estimatedSeconds // Cap at estimated time to prevent overflow
                }
                
                // Update progress in backend every 10 seconds
                if (newSeconds % 10 === 0 && enrollment) {
                    const userId = typeof (enrollment as any).user === 'object' 
                        ? (enrollment as any).user?.id 
                        : (enrollment as any).user
                    
                    if (userId) {
                        // Calculate watched_percent based on estimated_minutes if available
                        const watchedPercent = estimatedSeconds > 0 
                            ? Math.min(100, Math.round((newSeconds / estimatedSeconds) * 100)) 
                            : 0 // If no estimated_minutes, just track time without percentage
                        
                        createOrUpdateContentProgress({
                            user: userId,
                            course_content: content.id,
                            course_enrollment: enrollment.documentId,
                            tracking_status: "in_progress",
                            last_position_seconds: newSeconds,
                            watched_percent: watchedPercent,
                        }).catch(err => console.warn("Failed to update progress:", err))
                    }
                }
                return newSeconds
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [content.id, content.can_track_progress, content.type, estimatedMinutes, estimatedSeconds, isActuallyCompleted, enrollment, onComplete, isQuizOrCertificate])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col"
        >
            {/* Lesson Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white shadow-md">
                    <ContentIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h1 className="text-xl font-bold mb-1">{content.name}</h1>
                    <div className="flex items-center gap-2">
                        {content.type && (
                            <Badge variant="outline" className="text-xs">
                                {content.type}
                            </Badge>
                        )}
                        {content.estimated_minutes > 0 && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-xs">{content.estimated_minutes} min</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lesson Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Article content */}
                {content.type === "article" && content.article && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700 h-full">
                        <div 
                            className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: content.article }}
                        />
                    </div>
                )}

                {/* Video content */}
                {content.type === "video" && (content.video || content.url) && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden w-full">
                            {content.url ? (
                                /* @ts-ignore - ReactPlayer types are complex */
                                <ReactPlayer
                                    src={content.url}
                                    width="100%"
                                    height="100%"
                                    controls={true}
                                    playing={false}
                                    config={{
                                        youtube: {
                                            playerVars: {
                                                controls: 1,
                                                modestbranding: 1,
                                                rel: 0,
                                            },
                                        },
                                        vimeo: {
                                            playerOptions: {
                                                controls: true,
                                                responsive: true,
                                            },
                                        },
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center">
                                        <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                        <p className="text-muted-foreground">Video content not available</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* External URL content */}
                {content.type === "url" && content.url && (
                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden">
                            {/* @ts-ignore - ReactPlayer types are complex */}
                            <ReactPlayer
                                src={content.url}
                                width="100%"
                                height="100%"
                                controls={true}
                                playing={false}
                                config={{
                                    youtube: {
                                        playerVars: {
                                            controls: 1,
                                            modestbranding: 1,
                                            rel: 0,
                                        },
                                    },
                                    vimeo: {
                                        playerOptions: {
                                            controls: true,
                                            responsive: true,
                                        },
                                    },
                                }}
                            />
                        </div>
                        <div className="mt-3 text-center">
                            <a 
                                href={content.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-xs"
                            >
                                Open in new tab →
                            </a>
                        </div>
                    </div>
                )}

                {/* Document/PDF content */}
                {(content.type === "document" || content.type === "article") && content.document && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700 h-full flex items-center justify-center">
                        <div className="text-center">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-muted-foreground text-sm">Document content</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Timeline Design - Show when estimated_minutes > 0 (regardless of can_track_progress or completion status) */}
            {estimatedMinutes > 0 && (
                <div className="mt-3 space-y-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold">Progress Timeline</span>
                        </div>
                        <span className="text-sm font-medium">
                            {isActuallyCompleted 
                                ? `${estimatedMinutes}m / ${estimatedMinutes}m` 
                                : estimatedSeconds > 0
                                ? `${Math.floor(viewedSeconds / 60)}m ${viewedSeconds % 60}s / ${estimatedMinutes}m`
                                : `${Math.floor(viewedSeconds / 60)}m ${viewedSeconds % 60}s`}
                        </span>
                    </div>
                    <Progress 
                        value={isActuallyCompleted 
                            ? 100 
                            : (estimatedSeconds > 0 ? Math.min(100, (viewedSeconds / estimatedSeconds) * 100) : 0)} 
                        className="h-3" 
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Time Spent</span>
                        <span>
                            {isActuallyCompleted 
                                ? "100% Complete" 
                                : `${Math.round((viewedSeconds / estimatedSeconds) * 100)}% Complete`}
                        </span>
                    </div>
                    {!isActuallyCompleted && content.can_track_progress && viewedSeconds < estimatedSeconds && (
                        <p className="text-xs text-muted-foreground mt-2">
                            ⏱️ Watch for {estimatedMinutes} minutes to unlock "Mark as Complete"
                        </p>
                    )}
                    {isActuallyCompleted && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                            ✓ Content completed - tracking stopped
                        </p>
                    )}
                    {!content.can_track_progress && (
                        <p className="text-xs text-primary mt-2">
                            ℹ️ Time tracking is disabled for this content
                        </p>
                    )}
                </div>
            )}

            {/* Lesson Actions */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
                {isActuallyCompleted ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Lesson Completed</span>
                    </div>
                ) : (
                    <Button 
                        onClick={onComplete} 
                        size="lg" 
                        className="bg-primary hover:bg-primary/90"
                        disabled={!canMarkComplete}
                    >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Mark as Complete
                    </Button>
                )}
                
                {/* Only show Continue button if content is NOT completed */}
                {!isActuallyCompleted && (
                    <Button 
                        onClick={onNext} 
                        variant="outline" 
                        size="lg"
                        disabled={!canProceed}
                        className={cn(
                            !canProceed && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        Continue
                        <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                )}
            </div>
        </motion.div>
    )
}

// Quiz View Component
// Parse quiz data from content article field
function parseQuizData(content: CourseContentEntity) {
    const SPECIAL_CONFIG_PREFIX = "builder::quiz:"
    if (!content.article || !content.article.startsWith(SPECIAL_CONFIG_PREFIX)) {
        return null
    }
    
    try {
        const payload = content.article.replace(SPECIAL_CONFIG_PREFIX, "")
        const decoded = decodeURIComponent(payload)
        return JSON.parse(decoded)
    } catch (error) {
        console.error("Failed to parse quiz data:", error)
        return null
    }
}

// Helper function to extract media URL from Strapi media objects
function getMediaUrl(media: any): string | null {
    if (!media) {
        return null
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || ""
    
    // Helper to normalize URL (add base URL if relative)
    const normalizeUrl = (url: string): string => {
        if (!url) return ""
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url
        }
        // Remove leading slash if baseUrl already has one
        const cleanUrl = url.startsWith('/') ? url : `/${url}`
        const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
        return baseUrl ? `${cleanBase}${cleanUrl}` : url
    }
    
    // Handle different Strapi media structures
    // Structure 1: media.data.attributes.url (nested with data wrapper)
    if (media.data?.attributes?.url) {
        return normalizeUrl(media.data.attributes.url)
    }
    
    // Structure 2: media.attributes.url (nested without data wrapper)
    if (media.attributes?.url) {
        return normalizeUrl(media.attributes.url)
    }
    
    // Structure 3: media.data.url (data wrapper but no attributes)
    if (media.data?.url) {
        return normalizeUrl(media.data.url)
    }
    
    // Structure 4: media.url (flat structure)
    if (media.url) {
        return normalizeUrl(media.url)
    }
    
    // Structure 5: Try formats (thumbnail, small, medium, large)
    const formats = media.data?.attributes?.formats || media.attributes?.formats || media.formats
    if (formats) {
        const formatUrl = formats.medium?.url || formats.small?.url || formats.thumbnail?.url || formats.large?.url
        if (formatUrl) {
            return normalizeUrl(formatUrl)
        }
    }
    
    return null
}

// Base Content View Component - Handles tracking and progress for all content types
function BaseContentView({
    content,
    isCompleted,
    contentProgress,
    viewedSeconds,
    setViewedSeconds,
    enrollment,
    onComplete,
    onNext,
    children,
    icon: Icon = FileText
}: {
    content: CourseContentEntity
    isCompleted: boolean
    contentProgress?: ContentProgressEntity | null
    viewedSeconds: number
    setViewedSeconds: React.Dispatch<React.SetStateAction<number>>
    enrollment?: CourseEnrollment | null
    onComplete: () => void
    onNext: () => void
    children: React.ReactNode
    icon?: React.ComponentType<{ className?: string }>
}) {
    const isActuallyCompleted = isCompleted || 
                               (contentProgress && contentProgress.tracking_status === "completed")
    
    const estimatedMinutes = content.estimated_minutes || 0
    const estimatedSeconds = estimatedMinutes * 60
    
    const isQuizOrCertificate = content.type?.toLowerCase().includes('quiz') || 
                                content.type?.toLowerCase().includes('certificate')
    
    const canMarkComplete = !isActuallyCompleted && (
                           isQuizOrCertificate 
                               ? false
                               : !content.can_track_progress
                               ? true
                               : (estimatedMinutes === 0 || viewedSeconds >= estimatedSeconds)
    )
    
    const canProceed = isActuallyCompleted || canMarkComplete

    useEffect(() => {
        if (contentProgress && contentProgress.tracking_status === "completed") {
            const contentIdStr = String(content.id)
        }
    }, [contentProgress, content.id])

    useEffect(() => {
        if (!content.can_track_progress || estimatedMinutes === 0 || isActuallyCompleted || isQuizOrCertificate) {
            return
        }

        const interval = setInterval(() => {
            setViewedSeconds((prev: number) => {
                const newSeconds = prev + 1
                
                if (newSeconds >= estimatedSeconds && !isActuallyCompleted) {
                    setTimeout(() => {
                        onComplete()
                    }, 0)
                    return estimatedSeconds
                }
                
                if (newSeconds % 10 === 0 && enrollment) {
                    const userId = typeof (enrollment as any).user === 'object' 
                        ? (enrollment as any).user?.id 
                        : (enrollment as any).user
                    
                    if (userId) {
                        const watchedPercent = estimatedSeconds > 0 
                            ? Math.min(100, Math.round((newSeconds / estimatedSeconds) * 100)) 
                            : 0
                        
                        createOrUpdateContentProgress({
                            user: userId,
                            course_content: content.id,
                            course_enrollment: enrollment.documentId,
                            tracking_status: "in_progress",
                            last_position_seconds: newSeconds,
                            watched_percent: watchedPercent,
                        }).catch(err => console.warn("Failed to update progress:", err))
                    }
                }
                return newSeconds
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [content.id, content.can_track_progress, content.type, estimatedMinutes, estimatedSeconds, isActuallyCompleted, enrollment, onComplete, isQuizOrCertificate])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col"
        >
            {/* Content Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white shadow-md">
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h1 className="text-xl font-bold mb-1">{content.name}</h1>
                    <div className="flex items-center gap-2">
                        {content.type && (
                            <Badge variant="outline" className="text-xs">
                                {content.type}
                            </Badge>
                        )}
                        {content.estimated_minutes > 0 && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-xs">{content.estimated_minutes} min</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>

            {/* Progress Timeline */}
            {estimatedMinutes > 0 && (
                <div className="mt-3 space-y-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold">Progress Timeline</span>
                        </div>
                        <span className="text-sm font-medium">
                            {isActuallyCompleted 
                                ? `${estimatedMinutes}m / ${estimatedMinutes}m` 
                                : estimatedSeconds > 0
                                ? `${Math.floor(viewedSeconds / 60)}m ${viewedSeconds % 60}s / ${estimatedMinutes}m`
                                : `${Math.floor(viewedSeconds / 60)}m ${viewedSeconds % 60}s`}
                        </span>
                    </div>
                    <Progress 
                        value={isActuallyCompleted 
                            ? 100 
                            : (estimatedSeconds > 0 ? Math.min(100, (viewedSeconds / estimatedSeconds) * 100) : 0)} 
                        className="h-3" 
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Time Spent</span>
                        <span>
                            {isActuallyCompleted 
                                ? "100% Complete" 
                                : estimatedSeconds > 0
                                ? `${Math.round((viewedSeconds / estimatedSeconds) * 100)}% Complete`
                                : "0% Complete"}
                        </span>
                    </div>
                    {!isActuallyCompleted && content.can_track_progress && viewedSeconds < estimatedSeconds && (
                        <p className="text-xs text-muted-foreground mt-2">
                            ⏱️ View for {estimatedMinutes} minutes to unlock "Mark as Complete"
                        </p>
                    )}
                    {isActuallyCompleted && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                            ✓ Content completed - tracking stopped
                        </p>
                    )}
                    {!content.can_track_progress && (
                        <p className="text-xs text-primary mt-2">
                            ℹ️ Time tracking is disabled for this content
                        </p>
                    )}
                </div>
            )}

            {/* Content Actions */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
                {isActuallyCompleted ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Content Completed</span>
                    </div>
                ) : (
                    <Button 
                        onClick={onComplete} 
                        size="lg" 
                        className="bg-primary hover:bg-primary/90"
                        disabled={!canMarkComplete}
                    >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Mark as Complete
                    </Button>
                )}
                
                {!isActuallyCompleted && (
                    <Button 
                        onClick={onNext} 
                        variant="outline" 
                        size="lg"
                        disabled={!canProceed}
                        className={cn(
                            !canProceed && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        Continue
                        <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                )}
            </div>
        </motion.div>
    )
}

// Video View Component
function VideoView({
    content,
    isCompleted,
    contentProgress,
    viewedSeconds,
    setViewedSeconds,
    enrollment,
    onComplete,
    onNext
}: {
    content: CourseContentEntity
    isCompleted: boolean
    contentProgress?: ContentProgressEntity | null
    viewedSeconds: number
    setViewedSeconds: React.Dispatch<React.SetStateAction<number>>
    enrollment?: CourseEnrollment | null
    onComplete: () => void
    onNext: () => void
}) {
    // Prioritize content.url (Cloudinary URL) over media field
    const videoUrl = content.url || getMediaUrl(content.video)
    
    return (
        <BaseContentView
            content={content}
            isCompleted={isCompleted}
            contentProgress={contentProgress}
            viewedSeconds={viewedSeconds}
            setViewedSeconds={setViewedSeconds}
            enrollment={enrollment}
            onComplete={onComplete}
            onNext={onNext}
            icon={Video}
        >
            {videoUrl ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden w-full">
                        {videoUrl ? (
                            /* @ts-ignore - ReactPlayer types are complex */
                            <ReactPlayer
                                src={videoUrl}
                                width="100%"
                                height="100%"
                                controls={true}
                                playing={false}
                                config={{
                                    youtube: {
                                        playerVars: {
                                            controls: 1,
                                            modestbranding: 1,
                                            rel: 0,
                                        },
                                    },
                                    vimeo: {
                                        playerOptions: {
                                            controls: true,
                                            responsive: true,
                                        },
                                    },
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                    <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground">Video content not available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                    <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No video content available</p>
                </div>
            )}
        </BaseContentView>
    )
}

// Audio View Component
function AudioView({
    content,
    isCompleted,
    contentProgress,
    viewedSeconds,
    setViewedSeconds,
    enrollment,
    onComplete,
    onNext
}: {
    content: CourseContentEntity
    isCompleted: boolean
    contentProgress?: ContentProgressEntity | null
    viewedSeconds: number
    setViewedSeconds: React.Dispatch<React.SetStateAction<number>>
    enrollment?: CourseEnrollment | null
    onComplete: () => void
    onNext: () => void
}) {
    // Prioritize content.url (Cloudinary URL) over media field
    const audioUrl = content.url || getMediaUrl(content.audio)
    
    // Debug logging
    useEffect(() => {
        console.log("AudioView - Content data:", {
            type: content.type,
            name: content.name,
            audio: content.audio,
            url: content.url,
            audioUrl: audioUrl
        })
    }, [content.audio, content.url, audioUrl])
    
    return (
        <BaseContentView
            content={content}
            isCompleted={isCompleted}
            contentProgress={contentProgress}
            viewedSeconds={viewedSeconds}
            setViewedSeconds={setViewedSeconds}
            enrollment={enrollment}
            onComplete={onComplete}
            onNext={onNext}
            icon={Music}
        >
            {audioUrl ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl p-8 mb-6 flex items-center justify-center">
                            <Music className="w-24 h-24 text-white/80" />
                        </div>
                        <div className="space-y-4">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold mb-2">{content.name}</h3>
                                {content.estimated_minutes > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Duration: {content.estimated_minutes} minutes
                                    </p>
                                )}
                            </div>
                            <audio 
                                controls 
                                className="w-full"
                                src={audioUrl}
                            >
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                    <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No audio content available</p>
                </div>
            )}
        </BaseContentView>
    )
}

// Image View Component
function ImageView({
    content,
    isCompleted,
    contentProgress,
    viewedSeconds,
    setViewedSeconds,
    enrollment,
    onComplete,
    onNext
}: {
    content: CourseContentEntity
    isCompleted: boolean
    contentProgress?: ContentProgressEntity | null
    viewedSeconds: number
    setViewedSeconds: React.Dispatch<React.SetStateAction<number>>
    enrollment?: CourseEnrollment | null
    onComplete: () => void
    onNext: () => void
}) {
    // Get image URL from multiple possible sources
    // 1. Try content.url first (Cloudinary URL for uploaded files)
    // 2. Try images array (Strapi media field)
    // 3. Try single image object
    const getImageUrl = () => {
        // Priority 1: content.url (Cloudinary URL)
        if (content.url) {
            return content.url
        }
        
        // Priority 2: images array
        if (content.images) {
            if (Array.isArray(content.images) && content.images.length > 0) {
                const firstImage = content.images[0]
                const url = getMediaUrl(firstImage)
                if (url) return url
            } else if (!Array.isArray(content.images)) {
                // Single image object
                const url = getMediaUrl(content.images)
                if (url) return url
            }
        }
        
        return null
    }
    
    const imageUrl = getImageUrl()
    const imageCount = Array.isArray(content.images) ? content.images.length : (content.images ? 1 : 0)
    
    // Debug logging
    useEffect(() => {
        console.log("ImageView - Content data:", {
            type: content.type,
            name: content.name,
            contentId: content.id,
            url: content.url,
            images: content.images,
            imageCount: imageCount,
            imageUrl: imageUrl,
            isArray: Array.isArray(content.images),
            firstImage: Array.isArray(content.images) ? content.images[0] : content.images
        })
    }, [content.id, content.images, content.url, imageUrl, imageCount])
    
    return (
        <BaseContentView
            content={content}
            isCompleted={isCompleted}
            contentProgress={contentProgress}
            viewedSeconds={viewedSeconds}
            setViewedSeconds={setViewedSeconds}
            enrollment={enrollment}
            onComplete={onComplete}
            onNext={onNext}
            icon={ImageIcon}
        >
            {imageUrl ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <img 
                            src={imageUrl} 
                            alt={content.name || "Course content image"}
                            className="max-w-full max-h-[70vh] object-contain rounded-lg"
                            onError={(e) => {
                                console.error("Image failed to load:", imageUrl)
                                console.error("Error event:", e)
                            }}
                            onLoad={() => {
                                console.log("Image loaded successfully:", imageUrl)
                            }}
                        />
                    </div>
                    {imageCount > 1 && (
                        <div className="mt-4 text-center text-sm text-muted-foreground">
                            <p>Image 1 of {imageCount}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">No image content available</p>
                    <p className="text-xs text-muted-foreground">
                        URL: {content.url || "Not set"} | Images: {imageCount}
                    </p>
                </div>
            )}
        </BaseContentView>
    )
}

// Article View Component
function ArticleView({
    content,
    isCompleted,
    contentProgress,
    viewedSeconds,
    setViewedSeconds,
    enrollment,
    onComplete,
    onNext
}: {
    content: CourseContentEntity
    isCompleted: boolean
    contentProgress?: ContentProgressEntity | null
    viewedSeconds: number
    setViewedSeconds: React.Dispatch<React.SetStateAction<number>>
    enrollment?: CourseEnrollment | null
    onComplete: () => void
    onNext: () => void
}) {
    // Debug logging
    useEffect(() => {
        console.log("ArticleView - Content data:", {
            type: content.type,
            name: content.name,
            article: content.article ? "Article content present" : "No article content",
            articleLength: content.article?.length || 0
        })
    }, [content.article])
    
    // Normalize content to preserve spacing and formatting
    const normalizeContent = (html: string): string => {
        if (!html) return ""
        // Preserve multiple line breaks and spacing
        return html
            .replace(/\n\s*\n/g, '<br/><br/>')
            .replace(/(<br\s*\/?>)\s*(<br\s*\/?>)/gi, '<br/><br/>')
    }
    
    return (
        <BaseContentView
            content={content}
            isCompleted={isCompleted}
            contentProgress={contentProgress}
            viewedSeconds={viewedSeconds}
            setViewedSeconds={setViewedSeconds}
            enrollment={enrollment}
            onComplete={onComplete}
            onNext={onNext}
            icon={FileText}
        >
            {content.article ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-sm border border-slate-200 dark:border-slate-700 h-full overflow-auto">
                    <div 
                        className="article-content prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-base prose-headings:font-bold prose-p:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                        dangerouslySetInnerHTML={{ __html: normalizeContent(content.article) }}
                    />
                    <style jsx global>{`
                        .article-content {
                            line-height: 1.75 !important;
                            white-space: pre-wrap !important;
                            word-wrap: break-word !important;
                        }
                        .article-content p {
                            margin: 1.5em 0 !important;
                            line-height: 1.75 !important;
                            white-space: pre-wrap !important;
                        }
                        .article-content p:first-child {
                            margin-top: 0 !important;
                        }
                        .article-content p:last-child {
                            margin-bottom: 0 !important;
                        }
                        .article-content p + p {
                            margin-top: 1.5em !important;
                        }
                        .article-content br {
                            line-height: 1.5 !important;
                            display: block !important;
                        }
                        .article-content br + br {
                            margin-top: 0.75em !important;
                            display: block !important;
                            content: "" !important;
                        }
                        .article-content pre {
                            background: rgb(17, 24, 39) !important;
                            color: rgb(229, 231, 235) !important;
                            padding: 1rem !important;
                            border-radius: 0.5rem !important;
                            overflow-x: auto !important;
                            margin: 1rem 0 !important;
                            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
                            white-space: pre !important;
                        }
                        .article-content code {
                            background: rgb(243, 244, 246) !important;
                            color: rgb(59, 130, 246) !important;
                            padding: 0.125rem 0.375rem !important;
                            border-radius: 0.25rem !important;
                            font-size: 0.875em !important;
                            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
                        }
                        .article-content pre code {
                            background: transparent !important;
                            color: inherit !important;
                            padding: 0 !important;
                            border-radius: 0 !important;
                            font-size: inherit !important;
                        }
                        .dark .article-content code {
                            background: rgb(31, 41, 55) !important;
                            color: rgb(147, 197, 253) !important;
                        }
                        .dark .article-content pre {
                            background: rgb(17, 24, 39) !important;
                            color: rgb(229, 231, 235) !important;
                        }
                        .article-content h1,
                        .article-content h2,
                        .article-content h3,
                        .article-content h4,
                        .article-content h5,
                        .article-content h6 {
                            margin-top: 2em !important;
                            margin-bottom: 1em !important;
                            font-weight: 700 !important;
                            line-height: 1.2 !important;
                        }
                        .article-content h1:first-child,
                        .article-content h2:first-child,
                        .article-content h3:first-child,
                        .article-content h4:first-child,
                        .article-content h5:first-child,
                        .article-content h6:first-child {
                            margin-top: 0 !important;
                        }
                        .article-content ul,
                        .article-content ol {
                            margin: 1.5em 0 !important;
                            padding-left: 2em !important;
                        }
                        .article-content li {
                            margin: 0.5em 0 !important;
                            line-height: 1.75 !important;
                        }
                        .article-content blockquote {
                            margin: 1.5em 0 !important;
                            padding-left: 1.5em !important;
                            border-left: 4px solid rgb(148, 163, 184) !important;
                            font-style: italic !important;
                        }
                        .article-content img {
                            max-width: 100% !important;
                            height: auto !important;
                            border-radius: 0.5rem !important;
                            margin: 1.5em 0 !important;
                        }
                        .article-content table {
                            width: 100% !important;
                            border-collapse: collapse !important;
                            margin: 1.5em 0 !important;
                        }
                        .article-content table th,
                        .article-content table td {
                            border: 1px solid rgb(226, 232, 240) !important;
                            padding: 0.75em !important;
                        }
                        .dark .article-content table th,
                        .dark .article-content table td {
                            border-color: rgb(51, 65, 85) !important;
                        }
                    `}</style>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No article content available</p>
                </div>
            )}
        </BaseContentView>
    )
}

// URL View Component
function UrlView({
    content,
    isCompleted,
    contentProgress,
    viewedSeconds,
    setViewedSeconds,
    enrollment,
    onComplete,
    onNext
}: {
    content: CourseContentEntity
    isCompleted: boolean
    contentProgress?: ContentProgressEntity | null
    viewedSeconds: number
    setViewedSeconds: React.Dispatch<React.SetStateAction<number>>
    enrollment?: CourseEnrollment | null
    onComplete: () => void
    onNext: () => void
}) {
    return (
        <BaseContentView
            content={content}
            isCompleted={isCompleted}
            contentProgress={contentProgress}
            viewedSeconds={viewedSeconds}
            setViewedSeconds={setViewedSeconds}
            enrollment={enrollment}
            onComplete={onComplete}
            onNext={onNext}
            icon={LinkIcon}
        >
            {content.url ? (
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden">
                        {/* @ts-ignore - ReactPlayer types are complex */}
                        <ReactPlayer
                            src={content.url}
                            width="100%"
                            height="100%"
                            controls={true}
                            playing={false}
                            config={{
                                youtube: {
                                    playerVars: {
                                        controls: 1,
                                        modestbranding: 1,
                                        rel: 0,
                                    },
                                },
                                vimeo: {
                                    playerOptions: {
                                        controls: true,
                                        responsive: true,
                                    },
                                },
                            }}
                        />
                    </div>
                    <div className="mt-4 text-center">
                        <a 
                            href={content.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm font-medium inline-flex items-center gap-2"
                        >
                            <LinkIcon className="w-4 h-4" />
                            Open in new tab
                        </a>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                    <LinkIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No URL content available</p>
                </div>
            )}
        </BaseContentView>
    )
}

// Document View Component
function DocumentView({
    content,
    isCompleted,
    contentProgress,
    viewedSeconds,
    setViewedSeconds,
    enrollment,
    onComplete,
    onNext
}: {
    content: CourseContentEntity
    isCompleted: boolean
    contentProgress?: ContentProgressEntity | null
    viewedSeconds: number
    setViewedSeconds: React.Dispatch<React.SetStateAction<number>>
    enrollment?: CourseEnrollment | null
    onComplete: () => void
    onNext: () => void
}) {
    // Prioritize content.url (Cloudinary URL) over media field
    const documentUrl = content.url || getMediaUrl(content.document)
    const documentMime = content.document?.mime || 
                        content.document?.attributes?.mime || 
                        content.document?.data?.attributes?.mime ||
                        null
    
    // Debug logging
    useEffect(() => {
        console.log("DocumentView - Content data:", {
            type: content.type,
            name: content.name,
            document: content.document,
            url: content.url,
            documentUrl: documentUrl,
            documentMime: documentMime
        })
    }, [content.document, content.url, documentUrl, documentMime])
    
    return (
        <BaseContentView
            content={content}
            isCompleted={isCompleted}
            contentProgress={contentProgress}
            viewedSeconds={viewedSeconds}
            setViewedSeconds={setViewedSeconds}
            enrollment={enrollment}
            onComplete={onComplete}
            onNext={onNext}
            icon={FileText}
        >
            {documentUrl ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col">
                    {/* Document Viewer Section */}
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Header with download button */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6 text-primary" />
                                <div>
                                    <h3 className="text-lg font-semibold">{content.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {documentMime || "Document"}
                                    </p>
                                </div>
                            </div>
                            <a 
                                href={documentUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                            >
                                <FileText className="w-4 h-4" />
                                Download
                            </a>
                        </div>

                        {/* Document Viewer */}
                        <div className="flex-1 min-h-0 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900">
                            {documentMime?.includes('pdf') ? (
                                // PDF Viewer
                                <iframe
                                    src={`${documentUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                                    className="w-full h-full"
                                    title={content.name || "Document"}
                                    allow="fullscreen"
                                />
                            ) : documentMime?.startsWith('image/') ? (
                                // Image Viewer
                                <div className="w-full h-full flex items-center justify-center p-4">
                                    <img 
                                        src={documentUrl} 
                                        alt={content.name || "Document"}
                                        className="max-w-full max-h-full object-contain rounded-lg"
                                    />
                                </div>
                            ) : documentMime?.startsWith('text/') || documentMime?.includes('plain') ? (
                                // Text File Viewer
                                <div className="w-full h-full p-4 overflow-auto">
                                    <iframe
                                        src={documentUrl}
                                        className="w-full h-full border-0"
                                        title={content.name || "Document"}
                                    />
                                </div>
                            ) : documentMime?.includes('html') || documentMime?.includes('xml') ? (
                                // HTML/XML Viewer
                                <iframe
                                    src={documentUrl}
                                    className="w-full h-full border-0"
                                    title={content.name || "Document"}
                                    sandbox="allow-same-origin allow-scripts"
                                />
                            ) : (
                                // Generic Document Viewer (try iframe first, fallback to download)
                                <div className="w-full h-full flex flex-col items-center justify-center p-8">
                                    <FileText className="w-24 h-24 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground mb-4 text-center">
                                        This document type ({documentMime || 'unknown'}) cannot be previewed in the browser.
                                    </p>
                                    <div className="flex gap-3">
                                        <a 
                                            href={documentUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Open in New Tab
                                        </a>
                                        <a 
                                            href={documentUrl} 
                                            download
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Download
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No document content available</p>
                </div>
            )}
        </BaseContentView>
    )
}

// Quiz result storage interface
interface QuizResult {
    answers: Record<string, string>
    feedback: Record<string, { correct: boolean; message: string }>
    correctCount: number
    totalQuestions: number
    earnedPoints: number
    totalPoints: number
    scorePercent: number
    passed: boolean
    completedAt: string
    questionDetails: Array<{
        questionId: string
        questionText: string
        userAnswer: string
        correctAnswer: string
        isCorrect: boolean
        points: number
        earnedPoints: number
        timeSpent?: number
    }>
}

function QuizView({
    content,
    isCompleted,
    contentProgress,
    enrollment,
    user,
    quizAnswers,
    setQuizAnswers,
    quizFeedback,
    setQuizFeedback,
    quizSubmitted,
    setQuizSubmitted,
    xpEarned,
    setXpEarned,
    onComplete
}: {
    content: CourseContentEntity
    isCompleted: boolean
    contentProgress?: ContentProgressEntity | null
    enrollment?: CourseEnrollment | null
    user?: { id: string | number } | null
    quizAnswers: Record<string, string>
    setQuizAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>
    quizFeedback: Record<string, { correct: boolean; message: string }>
    setQuizFeedback: React.Dispatch<React.SetStateAction<Record<string, { correct: boolean; message: string }>>>
    quizSubmitted: boolean
    setQuizSubmitted: React.Dispatch<React.SetStateAction<boolean>>
    xpEarned: number
    setXpEarned: React.Dispatch<React.SetStateAction<number>>
    onComplete: () => void
}) {
    // ALL STATE HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
    const [savedResult, setSavedResult] = useState<QuizResult | null>(null)
    const [isLoadingResult, setIsLoadingResult] = useState(true)
    const [hasCompletedAttempt, setHasCompletedAttempt] = useState(false)
    const [quizAttemptHistory, setQuizAttemptHistory] = useState<QuizAttemptEntity[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [quizAttemptId, setQuizAttemptId] = useState<number | null>(null)
    const [quizStartTime, setQuizStartTime] = useState<number | null>(null)
    const [quizStarted, setQuizStarted] = useState(false)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [showResult, setShowResult] = useState(false)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [questionStartTime, setQuestionStartTime] = useState<number | null>(null)
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
    const [questionTimeSpent, setQuestionTimeSpent] = useState<Record<string, number>>({})

    // Parse quiz data from content
    const quizData = parseQuizData(content)
    const quizQuestions = quizData?.questions || [
        {
            id: "q1",
            prompt: "Sample question?",
            options: ["Option 1", "Option 2", "Option 3", "Option 4"],
            correctIndex: 0,
            points: 1,
            duration: 0 // 0 means no time limit
        }
    ]
    
    // Debug logging for quiz data
    useEffect(() => {
        console.log("QuizView - Content changed:", {
            contentId: content.id,
            contentName: content.name,
            hasQuizData: !!quizData,
            questionsCount: quizQuestions.length,
            quizQuestions: quizQuestions.map((q: any) => ({ id: q.id, prompt: q.prompt })),
            articleLength: content.article?.length || 0,
            articlePreview: content.article?.substring(0, 100) || "No article"
        })
    }, [content.id, quizData, quizQuestions.length])
    
    const totalQuestions = quizQuestions.length
    const currentQuestion = quizQuestions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100
    const questionDuration = (currentQuestion as any)?.duration || quizData?.timeLimit ? (quizData.timeLimit * 60 / totalQuestions) : 0 // seconds

    // Reset all quiz state when content.id changes (switching between different quizzes)
    useEffect(() => {
        // Reset all quiz-related state when switching to a different quiz content
        setQuizStarted(false)
        setCurrentQuestionIndex(0)
        setShowResult(false)
        setSelectedAnswer(null)
        setQuestionStartTime(null)
        setTimeRemaining(null)
        setQuestionTimeSpent({})
        setQuizAttemptId(null)
        setQuizStartTime(null)
        setHasCompletedAttempt(false)
        setSavedResult(null)
        setIsLoadingResult(true)
        setQuizAttemptHistory([])
        // Don't reset quizAnswers, quizFeedback, quizSubmitted, xpEarned here
        // as they are managed by the parent component and will be reset by selectContent
    }, [content.id])

    // Check if user has already completed this quiz
    useEffect(() => {
        const checkCompletedAttempt = async () => {
            if (!user?.id || !content.id) {
                setIsLoadingResult(false)
                return
            }

            try {
                const userId = typeof user.id === 'string' ? Number(user.id) : user.id
                if (isNaN(userId)) {
                    setIsLoadingResult(false)
                    return
                }

                // Check for completed quiz attempts
                const attempts = await getQuizAttempts({
                    userId: userId,
                    courseContentId: content.id,
                    attemptStatus: "graded"
                })

                if (attempts.length > 0) {
                    // User has already completed this quiz
                    setHasCompletedAttempt(true)
                    const latestAttempt = attempts[0] // Get the most recent attempt
                    
                    // Sort attempts by completed_at descending
                    const sortedAttempts = attempts.sort((a, b) => {
                        const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0
                        const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0
                        return dateB - dateA
                    })
                    setQuizAttemptHistory(sortedAttempts)
                    
                    // Try to load from localStorage
                const storageKey = `quiz_result_${content.id}`
                const saved = localStorage.getItem(storageKey)
                
                if (saved) {
                    const result = JSON.parse(saved) as QuizResult
                    setSavedResult(result)
                    setQuizAnswers(result.answers)
                    setQuizFeedback(result.feedback)
                    setQuizSubmitted(true)
                    setXpEarned(result.earnedPoints * 10)
                    } else if (latestAttempt.metadata) {
                        // Try to reconstruct from attempt metadata
                        const metadata = latestAttempt.metadata as any
                        if (metadata.answers && metadata.feedback) {
                            const result: QuizResult = {
                                answers: metadata.answers,
                                feedback: metadata.feedback,
                                correctCount: metadata.correctCount || 0,
                                totalQuestions: metadata.totalQuestions || 0,
                                earnedPoints: latestAttempt.score || 0,
                                totalPoints: latestAttempt.max_score || 100,
                                scorePercent: metadata.scorePercent || 0,
                                passed: metadata.passed || false,
                                completedAt: latestAttempt.completed_at || new Date().toISOString(),
                                questionDetails: metadata.questionDetails || []
                            }
                            setSavedResult(result)
                            setQuizAnswers(result.answers)
                            setQuizFeedback(result.feedback)
                            setQuizSubmitted(true)
                            setXpEarned(result.earnedPoints * 10)
                        }
                    }
                }
                setIsLoadingResult(false)
            } catch (error) {
                console.error("Failed to check completed attempt:", error)
                setIsLoadingResult(false)
            }
        }

        checkCompletedAttempt()
    }, [user?.id, content.id, isCompleted, setQuizAnswers, setQuizFeedback, setQuizSubmitted, setXpEarned])

    // Save quiz result when completed
    const saveQuizResult = (result: QuizResult) => {
        try {
            const storageKey = `quiz_result_${content.id}`
            localStorage.setItem(storageKey, JSON.stringify(result))
            setSavedResult(result)
        } catch (error) {
            console.error("Failed to save quiz result:", error)
        }
    }

    // If user has already completed this quiz, show result screen and prevent retaking
    useEffect(() => {
        if (hasCompletedAttempt && savedResult && !quizSubmitted) {
            // Don't allow retaking - show result screen
            setQuizSubmitted(true)
            setQuizStarted(false) // Prevent starting again
        }
    }, [hasCompletedAttempt, savedResult, quizSubmitted, setQuizSubmitted])

    // Timer effect for current question
    useEffect(() => {
        if (!quizStarted || quizSubmitted || !currentQuestion || questionDuration === 0) {
            setTimeRemaining(null)
            return
        }

        // Start timer when question is displayed
        if (questionStartTime === null) {
            const startTime = Date.now()
            setQuestionStartTime(startTime)
            setTimeRemaining(questionDuration)
        }

        const interval = setInterval(() => {
            if (questionStartTime) {
                const elapsed = Math.floor((Date.now() - questionStartTime) / 1000)
                const remaining = Math.max(0, questionDuration - elapsed)
                setTimeRemaining(remaining)

                // Auto-advance if time runs out
                if (remaining === 0) {
                    // Save time spent for this question
                    setQuestionTimeSpent(prev => ({
                        ...prev,
                        [currentQuestion.id]: questionDuration
                    }))
                    
                    // Clear the interval first to prevent multiple calls
                    clearInterval(interval)
                    
                    // Auto-advance to next question or submit
                    // Use setTimeout to ensure state updates are processed
                    setTimeout(() => {
                    if (currentQuestionIndex < totalQuestions - 1) {
                        handleNext()
                    } else {
                        handleSubmit()
                    }
                    }, 100)
                }
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [quizStarted, quizSubmitted, currentQuestionIndex, currentQuestion, questionDuration, questionStartTime])

    // Reset timer when question changes
    useEffect(() => {
        if (quizStarted && !quizSubmitted) {
            setQuestionStartTime(Date.now())
            setTimeRemaining(questionDuration > 0 ? questionDuration : null)
        }
    }, [currentQuestionIndex, quizStarted, quizSubmitted])

    const handleAnswerSelect = (optionIndex: number) => {
        if (quizSubmitted || !quizStarted) return
        const answer = currentQuestion.options[optionIndex]
        setSelectedAnswer(answer)
        setQuizAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: answer
        }))
    }

    const handleNext = () => {
        // Save time spent for current question
        if (questionStartTime && currentQuestion) {
            const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
            setQuestionTimeSpent(prev => ({
                ...prev,
                [currentQuestion.id]: Math.min(timeSpent, questionDuration || timeSpent)
            }))
        }

        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
            setSelectedAnswer(null)
            setQuestionStartTime(null) // Reset for next question
        } else {
            handleSubmit()
        }
    }

    const handleSubmit = async () => {
        // Save time for last question if not already saved
        if (questionStartTime && currentQuestion) {
            const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
            setQuestionTimeSpent(prev => ({
                ...prev,
                [currentQuestion.id]: Math.min(timeSpent, questionDuration || timeSpent)
            }))
        }

        const feedback: Record<string, { correct: boolean; message: string }> = {}
        let correctCount = 0
        let totalPoints = 0
        let earnedPoints = 0
        const questionDetails: QuizResult['questionDetails'] = []

        quizQuestions.forEach((q: { id: string; prompt: string; options: string[]; correctIndex: number; points: number }) => {
            const userAnswer = quizAnswers[q.id] || ""
            const correctAnswer = q.options[q.correctIndex]
            const isCorrect = userAnswer === correctAnswer
            const timeSpent = questionTimeSpent[q.id] || 0
            
            totalPoints += q.points
            if (isCorrect) {
                correctCount++
                earnedPoints += q.points
            }
            
            feedback[q.id] = {
                correct: isCorrect,
                message: isCorrect 
                    ? `Correct! +${q.points} point${q.points > 1 ? 's' : ''}` 
                    : `Incorrect. The correct answer is: ${correctAnswer}`
            }

            // Store detailed question result
            questionDetails.push({
                questionId: q.id,
                questionText: q.prompt,
                userAnswer: userAnswer || "Not answered",
                correctAnswer: correctAnswer,
                isCorrect,
                points: q.points,
                earnedPoints: isCorrect ? q.points : 0,
                timeSpent: timeSpent > 0 ? timeSpent : undefined
            })
        })

        setQuizFeedback(feedback)
        setQuizSubmitted(true)
        setShowResult(true)
        
        // Calculate XP based on points earned
        const xp = earnedPoints * 10
        setXpEarned(xp)
        
        // Calculate score
        const passingScore = quizData?.passingScore || 70
        const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
        const passed = scorePercent >= passingScore

        // Save quiz result with detailed information
        const result: QuizResult = {
            answers: { ...quizAnswers },
            feedback: { ...feedback },
            correctCount,
            totalQuestions: quizQuestions.length,
            earnedPoints,
            totalPoints,
            scorePercent,
            passed,
            completedAt: new Date().toISOString(),
            questionDetails
        }
        saveQuizResult(result)

        // Update content progress with attempt count
        if (enrollment && contentProgress) {
            try {
                await createOrUpdateContentProgress({
                    user: contentProgress.user?.id || 0,
                    course_content: content.id,
                    course_enrollment: enrollment.documentId,
                    tracking_status: "completed",
                    attempt_count: (contentProgress.attempt_count || 0) + 1,
                    watched_percent: 100
                })
            } catch (error) {
                console.warn("Failed to update content progress:", error)
            }
        }
        
        // Update quiz attempt in backend if it exists
        if (user?.id && quizAttemptId) {
            try {
                const userId = typeof user.id === 'string' ? Number(user.id) : user.id
                const durationSeconds = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : 0
                
                await updateQuizAttempt(quizAttemptId, {
                    attempt_status: "graded",
                    score: earnedPoints,
                    completed_at: new Date().toISOString(),
                    duration_seconds: durationSeconds,
                    metadata: {
                        ...result,
                        scorePercent,
                        passed,
                    }
                })
                console.log("Quiz attempt updated:", quizAttemptId)
                
                // Try to create quiz attempt answers if we have course_quiz IDs
                // For regular quizzes, we might not have course_quiz IDs, so we'll try to fetch them
                try {
                    const { getQuizSectionsByCourseContent } = await import("@/integrations/strapi/quizStructure")
                    const sections = await getQuizSectionsByCourseContent(content.id)
                    const allQuizzes = sections.flatMap(section => section.quizzes || [])
                    
                    // Create quiz attempt answers for each question
                    for (const q of quizQuestions) {
                        const question = q as any
                        // Try to find matching course_quiz by question text or ID
                        const matchingQuiz = allQuizzes.find((quiz: any) => 
                            quiz.question_text === question.prompt || 
                            quiz.title === question.prompt ||
                            question.courseQuizId === quiz.id
                        )
                        
                        if (!matchingQuiz) {
                            console.log(`No matching course_quiz found for question: ${question.prompt}`)
                            continue
                        }
                        
                        const userAnswer = quizAnswers[question.id] || ""
                        const userAnswerIndex = question.options?.indexOf(userAnswer) ?? -1
                        
                        // Find the matching line ID
                        let selectedLineId: number | null = null
                        if (userAnswerIndex >= 0 && matchingQuiz.lines && matchingQuiz.lines.length > userAnswerIndex) {
                            selectedLineId = matchingQuiz.lines[userAnswerIndex]?.id || null
                        }
                        
                        const isCorrect = userAnswer === question.options[question.correctIndex]
                        const pointsAwarded = isCorrect ? question.points : 0
                        
                        try {
                            await createQuizAttemptAnswer({
                                quiz_attempt: quizAttemptId,
                                course_quiz: matchingQuiz.id,
                                selected_line: selectedLineId,
                                is_correct: isCorrect,
                                points_awarded: pointsAwarded
                            })
                            console.log(`Quiz attempt answer created for question ${question.id}`)
                        } catch (answerError) {
                            console.error(`Failed to create quiz attempt answer for question ${question.id}:`, answerError)
                        }
                    }
                } catch (sectionsError) {
                    console.log("Could not fetch quiz sections for answer creation:", sectionsError)
                }
            } catch (error) {
                console.error("Failed to update quiz attempt:", error)
            }
        }
        
        // Load quiz attempt history after completion
        if (user?.id && content.id) {
            loadQuizHistory()
        }
        
        // Auto-complete if passing score is met
        if (passed) {
            setTimeout(() => {
                onComplete()
            }, 3000)
        }
    }

    // Load quiz attempt history - wrapped in useCallback to avoid dependency issues
    const loadQuizHistory = useCallback(async () => {
        if (!user?.id || !content.id) return
        
        setIsLoadingHistory(true)
        try {
            const userId = typeof user.id === 'string' ? Number(user.id) : user.id
            if (isNaN(userId)) {
                setIsLoadingHistory(false)
                return
            }

            // Get all quiz attempts for this content
            const attempts = await getQuizAttempts({
                userId: userId,
                courseContentId: content.id,
            })
            
            // Sort by completed_at descending (most recent first)
            const sortedAttempts = attempts.sort((a, b) => {
                const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0
                const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0
                return dateB - dateA
            })
            
            setQuizAttemptHistory(sortedAttempts)
        } catch (error) {
            console.error("Failed to load quiz history:", error)
        } finally {
            setIsLoadingHistory(false)
        }
    }, [user?.id, content.id])

    // Load history when component mounts or when user/content changes
    useEffect(() => {
        if (user?.id && content.id && (isCompleted || hasCompletedAttempt)) {
            loadQuizHistory()
        }
    }, [user?.id, content.id, isCompleted, hasCompletedAttempt, loadQuizHistory])

    // Show loading state while checking for saved results
    if (isLoadingResult) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="mx-auto w-12 h-12"
                    >
                        <ClipboardList className="w-12 h-12 text-primary" />
                    </motion.div>
                    <p className="text-muted-foreground">Loading quiz...</p>
                </div>
            </div>
        )
    }

    // If completed and has saved result, show result screen directly
    if ((isCompleted || hasCompletedAttempt) && savedResult && quizSubmitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto"
            >
                <div className={cn(
                    "relative rounded-3xl p-12 shadow-2xl overflow-hidden",
                    savedResult.passed 
                        ? "bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600"
                        : "bg-gradient-to-br from-orange-500 via-red-500 to-pink-600"
                )}>
                    {/* Animated background */}
                    <div className="absolute inset-0 overflow-hidden">
                        <motion.div
                            animate={{ 
                                rotate: [0, 360],
                                scale: [1, 1.3, 1]
                            }}
                            transition={{ 
                                duration: 10, 
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="absolute top-0 left-0 w-full h-full bg-white/10 rounded-full blur-3xl"
                        />
                    </div>

                    <div className="relative z-10 text-center space-y-8">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="mx-auto w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30"
                        >
                            {savedResult.passed ? (
                                <Crown className="w-16 h-16 text-yellow-300" />
                            ) : (
                                <Target className="w-16 h-16 text-white" />
                            )}
                        </motion.div>

                        <div className="space-y-4">
                            <h1 className="text-5xl font-bold text-white drop-shadow-lg">
                                {savedResult.passed ? "Congratulations!" : "Keep Learning!"}
                            </h1>
                            <p className="text-2xl text-white/90">
                                You scored {savedResult.scorePercent}%
                            </p>
                            <p className="text-sm text-white/80">
                                Completed on {new Date(savedResult.completedAt).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
                                <div className="flex items-center justify-center gap-2 text-white/80 mb-2">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="text-sm">Correct</span>
                                </div>
                                <p className="text-4xl font-bold text-white">{savedResult.correctCount}/{savedResult.totalQuestions}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
                                <div className="flex items-center justify-center gap-2 text-white/80 mb-2">
                                    <Trophy className="w-5 h-5" />
                                    <span className="text-sm">Points</span>
                                </div>
                                <p className="text-4xl font-bold text-white">{savedResult.earnedPoints}/{savedResult.totalPoints}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
                                <div className="flex items-center justify-center gap-2 text-white/80 mb-2">
                                    <Zap className="w-5 h-5" />
                                    <span className="text-sm">XP Earned</span>
                                </div>
                                <p className="text-4xl font-bold text-white">+{savedResult.earnedPoints * 10}</p>
                            </div>
                        </div>

                        {/* Show detailed results */}
                        <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-left">
                            <h3 className="text-white font-semibold mb-4">Detailed Results</h3>
                            <div className="space-y-3">
                                {savedResult.questionDetails.map((detail, index) => {
                                    return (
                                        <div
                                            key={detail.questionId}
                                            className={cn(
                                                "p-4 rounded-lg",
                                                detail.isCorrect ? "bg-green-500/20" : "bg-red-500/20"
                                            )}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold",
                                                    detail.isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
                                                )}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-white font-medium mb-1">{detail.questionText}</p>
                                                    <div className="space-y-1 text-sm">
                                                        <p className="text-white/80">
                                                            Your answer: <span className={cn("font-semibold", detail.isCorrect ? "text-green-200" : "text-red-200")}>
                                                                {detail.userAnswer}
                                                            </span>
                                                        </p>
                                                        {!detail.isCorrect && (
                                                            <p className="text-white/80">
                                                                Correct answer: <span className="font-semibold text-green-200">
                                                                    {detail.correctAnswer}
                                                                </span>
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <span className="text-white/70">
                                                                Points: <span className="font-semibold text-white">{detail.earnedPoints}/{detail.points}</span>
                                                            </span>
                                                            {detail.timeSpent && (
                                                                <span className="text-white/70 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    Time: <span className="font-semibold text-white">{detail.timeSpent}s</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {detail.isCorrect ? (
                                                    <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                                                ) : (
                                                    <X className="w-5 h-5 text-red-300 flex-shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        )
    }

    // Start Screen
    if (!quizStarted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-3xl mx-auto"
            >
                <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-3xl p-12 shadow-2xl overflow-hidden">
                    {/* Animated background elements */}
                    <div className="absolute inset-0 overflow-hidden">
                        <motion.div
                            animate={{ 
                                rotate: [0, 360],
                                scale: [1, 1.2, 1]
                            }}
                            transition={{ 
                                duration: 20, 
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
                        />
                        <motion.div
                            animate={{ 
                                rotate: [360, 0],
                                scale: [1, 1.3, 1]
                            }}
                            transition={{ 
                                duration: 15, 
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="absolute -bottom-20 -left-20 w-80 h-80 bg-yellow-400/20 rounded-full blur-3xl"
                        />
                    </div>
                    
                    <div className="relative z-10 text-center space-y-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="mx-auto w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30"
                        >
                            <ClipboardList className="w-12 h-12 text-white" />
                        </motion.div>
                        
                        <div className="space-y-4">
                            <h1 className="text-5xl font-bold text-white drop-shadow-lg">
                                {quizData?.title || content.name}
                            </h1>
                            {quizData?.description && (
                                <p className="text-xl text-white/90">{quizData.description}</p>
                            )}
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 space-y-4 border border-white/20">
                            {quizData?.instructions && (
                                <div className="text-left">
                                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                                        <Target className="w-5 h-5" />
                                        Instructions
                                    </h3>
                                    <p className="text-white/90 text-sm">{quizData.instructions}</p>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="bg-white/10 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-white/80 mb-1">
                                        <ClipboardList className="w-4 h-4" />
                                        <span className="text-sm">Questions</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{totalQuestions}</p>
                                </div>
                                <div className="bg-white/10 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-white/80 mb-1">
                                        <Trophy className="w-4 h-4" />
                                        <span className="text-sm">Passing Score</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{quizData?.passingScore || 70}%</p>
                                </div>
                                {quizData?.timeLimit > 0 && (
                                    <div className="bg-white/10 rounded-lg p-4 col-span-2">
                                        <div className="flex items-center gap-2 text-white/80 mb-1">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm">Time Limit</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white">{quizData.timeLimit} minutes</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {hasCompletedAttempt ? (
                                <div className="space-y-4">
                                    <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4">
                                        <p className="text-white text-sm font-medium">
                                            You have already completed this quiz. Retaking is not allowed.
                                        </p>
                                    </div>
                            <Button
                                        onClick={() => {
                                            setQuizSubmitted(true)
                                            setShowResult(true)
                                        }}
                                        size="lg"
                                        variant="outline"
                                        className="bg-white/10 text-white border-white/30 hover:bg-white/20 text-lg px-8 py-6 rounded-xl font-bold"
                                    >
                                        <Trophy className="w-5 h-5 mr-2" />
                                        View Results
                                    </Button>
                                </div>
                            ) : (
                            <Button
                                onClick={async () => {
                                    setQuizStarted(true)
                                    setQuizStartTime(Date.now())
                                    
                                    // Create quiz attempt in backend if user and content are available
                                    // Note: Regular quizzes may not have a certificate_program
                                    // We'll try to find one associated with the content, or skip if not found
                                    if (user?.id && content.id) {
                                        try {
                                            const userId = typeof user.id === 'string' ? Number(user.id) : user.id
                                            const totalScore = quizQuestions.reduce((sum: number, q: { points: number }) => sum + (q.points || 0), 0)
                                            
                                            // Try to find certificate program associated with this content
                                            try {
                                                const contentIdentifier = content.documentId || content.id
                                                const program = await getCertificateProgramByCourseContent(contentIdentifier)
                                                
                                                if (program?.id) {
                                                    const attempt = await createQuizAttempt({
                                                        user: userId,
                                                        certificate_program: program.id,
                                                        course_content: content.id,
                                                        attempt_status: "in_progress",
                                                        max_score: totalScore,
                                                        started_at: new Date().toISOString(),
                                                        metadata: {
                                                            content_name: content.name,
                                                            certificate_name: program.name,
                                                        }
                                                    })
                                                    
                                                    if (attempt) {
                                                        setQuizAttemptId(attempt.id)
                                                        console.log("Quiz attempt created:", attempt.id)
                                                    }
                                                }
                                            } catch (certError) {
                                                // No certificate program found for this content - that's okay for regular quizzes
                                                console.log("No certificate program found for this quiz, skipping quiz attempt creation")
                                            }
                                        } catch (error) {
                                            console.error("Failed to create quiz attempt:", error)
                                            // Continue even if backend call fails
                                        }
                                    }
                                }}
                                size="lg"
                                className="bg-white text-purple-700 hover:bg-white/90 text-lg px-8 py-6 rounded-xl font-bold shadow-xl"
                            >
                                <Rocket className="w-5 h-5 mr-2" />
                                Start Quiz
                            </Button>
                            )}
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        )
    }

    // Result Screen
    if (showResult && quizSubmitted) {
        const correctCount = Object.values(quizFeedback).filter(f => f.correct).length
        const totalPoints = quizQuestions.reduce((sum: number, q: { points: number }) => sum + q.points, 0)
        const earnedPoints = quizQuestions.reduce((sum: number, q: { id: string; options: string[]; correctIndex: number; points: number }) => {
            const userAnswer = quizAnswers[q.id]
            const isCorrect = userAnswer === q.options[q.correctIndex]
            return sum + (isCorrect ? q.points : 0)
        }, 0)
        const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
        const passingScore = quizData?.passingScore || 70
        const passed = scorePercent >= passingScore

        return (
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Current Attempt Result */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                        "relative rounded-3xl p-8 shadow-2xl overflow-hidden",
                    passed 
                        ? "bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600"
                        : "bg-gradient-to-br from-orange-500 via-red-500 to-pink-600"
                )}>
                    {/* Animated background */}
                    <div className="absolute inset-0 overflow-hidden">
                        <motion.div
                            animate={{ 
                                rotate: [0, 360],
                                scale: [1, 1.3, 1]
                            }}
                            transition={{ 
                                duration: 10, 
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="absolute top-0 left-0 w-full h-full bg-white/10 rounded-full blur-3xl"
                        />
                    </div>

                    <div className="relative z-10 text-center space-y-8">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="mx-auto w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30"
                        >
                            {passed ? (
                                <Crown className="w-16 h-16 text-yellow-300" />
                            ) : (
                                <Target className="w-16 h-16 text-white" />
                            )}
                        </motion.div>

                        <div className="space-y-4">
                            <h1 className="text-5xl font-bold text-white drop-shadow-lg">
                                {passed ? "Congratulations!" : "Keep Learning!"}
                            </h1>
                            <p className="text-2xl text-white/90">
                                You scored {scorePercent}%
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
                                <div className="flex items-center justify-center gap-2 text-white/80 mb-2">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="text-sm">Correct</span>
                                </div>
                                <p className="text-4xl font-bold text-white">{correctCount}/{totalQuestions}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
                                <div className="flex items-center justify-center gap-2 text-white/80 mb-2">
                                    <Trophy className="w-5 h-5" />
                                    <span className="text-sm">Points</span>
                                </div>
                                <p className="text-4xl font-bold text-white">{earnedPoints}/{totalPoints}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
                                <div className="flex items-center justify-center gap-2 text-white/80 mb-2">
                                    <Zap className="w-5 h-5" />
                                    <span className="text-sm">XP Earned</span>
                                </div>
                                <p className="text-4xl font-bold text-white">+{xpEarned}</p>
                            </div>
                        </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            >
                                <Button
                                    onClick={onComplete}
                                    size="lg"
                                variant="outline"
                                className="bg-white/10 text-white border-white/30 hover:bg-white/20 text-lg px-8 py-6 rounded-xl font-bold"
                                >
                                Continue
                                </Button>
                            </motion.div>
                    </div>
                </motion.div>

                {/* Quiz Attempt History */}
                {quizAttemptHistory.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <ClipboardList className="w-6 h-6" />
                                Quiz History
                            </h2>
                        </div>

                        <div className="space-y-3">
                            {quizAttemptHistory.map((attempt, index) => {
                                const attemptScore = attempt.score ?? 0
                                const attemptMaxScore = attempt.max_score || 100
                                const attemptScorePercent = attemptMaxScore > 0 
                                    ? Math.round((attemptScore / attemptMaxScore) * 100) 
                                    : 0
                                const attemptPassed = attemptScorePercent >= passingScore
                                
                                return (
                                    <motion.div
                                        key={attempt.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                        className="rounded-xl p-4 border-2 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Badge variant={attemptPassed ? "default" : "destructive"}>
                                                        {attemptPassed ? (
                                                            <>
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Passed
                                                            </>
                                                        ) : (
                                                            <>
                                                                <X className="w-3 h-3 mr-1" />
                                                                Failed
                                                            </>
                                                        )}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-muted-foreground text-xs mb-1">Score</p>
                                                        <p className="font-bold text-lg">
                                                            {attemptScorePercent}%
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {attemptScore}/{attemptMaxScore} points
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground text-xs mb-1">Completed</p>
                                                        <p className="font-semibold">
                                                            {attempt.completed_at 
                                                                ? new Date(attempt.completed_at).toLocaleDateString()
                                                                : "N/A"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {attempt.completed_at 
                                                                ? new Date(attempt.completed_at).toLocaleTimeString()
                                                                : ""}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground text-xs mb-1">Duration</p>
                                                        <p className="font-semibold">
                                                            {attempt.duration_seconds 
                                                                ? `${Math.floor(attempt.duration_seconds / 60)}m ${attempt.duration_seconds % 60}s`
                                                                : "N/A"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground text-xs mb-1">Status</p>
                                                        <p className="font-semibold capitalize">
                                                            {attempt.attempt_status?.replace('_', ' ')}
                                                        </p>
                                                    </div>
                                                </div>
                    </div>
                </div>
            </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </div>
        )
    }

    // Question Screen (One-by-one)
    const userAnswer = quizAnswers[currentQuestion.id]
    const isAnswered = !!userAnswer
    const correctAnswerIndex = currentQuestion.correctIndex
    const showFeedback = quizSubmitted && currentQuestionIndex < totalQuestions - 1

    return (
        <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="max-w-4xl mx-auto space-y-8"
        >
            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="font-semibold">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                    <div className="flex items-center gap-4">
                        {timeRemaining !== null && timeRemaining > 0 && (
                            <div className={cn(
                                "flex items-center gap-2 font-semibold",
                                timeRemaining <= 10 ? "text-red-500 animate-pulse" : "text-muted-foreground"
                            )}>
                                <Clock className="w-4 h-4" />
                                <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
                            </div>
                        )}
                        <span className="font-semibold">{Math.round(progress)}% Complete</span>
                    </div>
                </div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 rounded-full"
                    />
                </div>
            </div>

            {/* Question Card */}
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-10 shadow-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden"
            >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-pink-500/10 rounded-full blur-3xl -ml-32 -mb-32" />

                <div className="relative z-10 space-y-8">
                    {/* Question Header */}
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            {currentQuestionIndex + 1}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold mb-2">{currentQuestion.prompt}</h2>
                            {currentQuestion.points && (
                                <Badge className="bg-yellow-500 text-white">
                                    <Trophy className="w-3 h-3 mr-1" />
                                    {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Answer Options */}
                    <div className="grid gap-4">
                        {currentQuestion.options.map((option: string, index: number) => {
                            const isSelected = userAnswer === option
                            const isCorrect = index === correctAnswerIndex
                            const showCorrect = quizSubmitted && isCorrect
                            const showIncorrect = quizSubmitted && isSelected && !isCorrect

                            return (
                                <motion.button
                                    key={index}
                                    whileHover={!quizSubmitted ? { scale: 1.02 } : {}}
                                    whileTap={!quizSubmitted ? { scale: 0.98 } : {}}
                                    onClick={() => handleAnswerSelect(index)}
                                    disabled={quizSubmitted}
                                    className={cn(
                                        "relative p-6 rounded-2xl border-2 text-left transition-all",
                                        "font-medium text-lg",
                                        isSelected && !quizSubmitted
                                            ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white border-purple-600 shadow-lg"
                                            : showCorrect
                                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-600 shadow-lg"
                                            : showIncorrect
                                            ? "bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-600 shadow-lg"
                                            : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20",
                                        quizSubmitted && "cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg",
                                            isSelected || showCorrect
                                                ? "bg-white/20 text-white"
                                                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                        )}>
                                            {String.fromCharCode(65 + index)}
                                        </div>
                                        <span className="flex-1">{option}</span>
                                        {showCorrect && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="flex-shrink-0"
                                            >
                                                <CheckCircle className="w-6 h-6 text-white" />
                                            </motion.div>
                                        )}
                                        {showIncorrect && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="flex-shrink-0"
                                            >
                                                <X className="w-6 h-6 text-white" />
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.button>
                            )
                        })}
                    </div>

                    {/* Feedback */}
                    {quizSubmitted && quizFeedback[currentQuestion.id] && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "p-4 rounded-xl flex items-start gap-3",
                                quizFeedback[currentQuestion.id].correct
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                                    : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                            )}
                        >
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                                quizFeedback[currentQuestion.id].correct ? "bg-green-500" : "bg-red-500"
                            )}>
                                {quizFeedback[currentQuestion.id].correct ? (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                ) : (
                                    <X className="w-4 h-4 text-white" />
                                )}
                            </div>
                            <p className="font-medium">{quizFeedback[currentQuestion.id].message}</p>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Navigation */}
            <div className="flex items-center justify-end">
                <Button
                    onClick={handleNext}
                    disabled={!isAnswered}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
                >
                    {currentQuestionIndex < totalQuestions - 1 ? (
                        <>
                            Next Question
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                    ) : (
                        <>
                            Submit Quiz
                            <Trophy className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </motion.div>
    )
}

// Certificate View Component - Special implementation distinct from Quiz
function CertificateView({
    content,
    isCompleted,
    contentProgress,
    enrollment,
    user,
    quizAnswers,
    setQuizAnswers,
    quizFeedback,
    setQuizFeedback,
    quizSubmitted,
    setQuizSubmitted,
    xpEarned,
    setXpEarned,
    onComplete
}: {
    content: CourseContentEntity
    isCompleted: boolean
    contentProgress?: ContentProgressEntity | null
    enrollment?: CourseEnrollment | null
    user?: { id: string | number } | null
    quizAnswers: Record<string, string>
    setQuizAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>
    quizFeedback: Record<string, { correct: boolean; message: string }>
    setQuizFeedback: React.Dispatch<React.SetStateAction<Record<string, { correct: boolean; message: string }>>>
    quizSubmitted: boolean
    setQuizSubmitted: React.Dispatch<React.SetStateAction<boolean>>
    xpEarned: number
    setXpEarned: React.Dispatch<React.SetStateAction<number>>
    onComplete: () => void
}) {
    const [certificateStarted, setCertificateStarted] = useState(false)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [showResult, setShowResult] = useState(false)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [questionStartTime, setQuestionStartTime] = useState<number | null>(null)
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
    const [questionTimeSpent, setQuestionTimeSpent] = useState<Record<string, number>>({})
    const [certificateUnlocked, setCertificateUnlocked] = useState(false)
    const [showCertificate, setShowCertificate] = useState(isCompleted)
    const [savedResult, setSavedResult] = useState<QuizResult | null>(null)
    const [isLoadingResult, setIsLoadingResult] = useState(true)
    const [certificateProgram, setCertificateProgram] = useState<any>(null)
    const [certificateQuestions, setCertificateQuestions] = useState<any[]>([])
    const [quizAttemptId, setQuizAttemptId] = useState<number | null>(null)
    const [assessmentStartTime, setAssessmentStartTime] = useState<number | null>(null)
    const [hasCompletedAttempt, setHasCompletedAttempt] = useState(false)
    const [quizAttemptHistory, setQuizAttemptHistory] = useState<QuizAttemptEntity[]>([])
    const [certificateIssuances, setCertificateIssuances] = useState<any[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)

    // Reset certificate state when content changes
    useEffect(() => {
        // Reset all certificate-specific state when switching to a different certificate
        setCertificateStarted(false)
        setCurrentQuestionIndex(0)
        setShowResult(false)
        setSelectedAnswer(null)
        setQuestionStartTime(null)
        setTimeRemaining(null)
        setQuestionTimeSpent({})
        setCertificateUnlocked(false)
        setShowCertificate(isCompleted)
        setSavedResult(null)
        setIsLoadingResult(true)
        setCertificateProgram(null)
        setCertificateQuestions([])
        setQuizAttemptId(null)
        setAssessmentStartTime(null)
        setHasCompletedAttempt(false)
        setQuizAttemptHistory([])
        setCertificateIssuances([])
        setIsLoadingHistory(false)
    }, [content.id, isCompleted])

    // Convert Strapi quiz structure to expected format
    const convertQuizzesToQuestions = (quizzes: any[]) => {
        if (!quizzes || !Array.isArray(quizzes) || quizzes.length === 0) {
            console.warn("convertQuizzesToQuestions: No quizzes provided or empty array")
            return []
        }
        
        console.log("Converting quizzes to questions:", quizzes)
        
        return quizzes
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            .map((quiz, index) => {
                const lines = quiz.lines || []
                console.log(`Quiz ${index + 1} (ID: ${quiz.id}):`, {
                    title: quiz.title,
                    question_text: quiz.question_text,
                    linesCount: lines.length,
                    lines: lines
                })
                
                const correctIndex = lines.findIndex((line: any) => line.is_correct === true)
                const options = lines.map((line: any) => line.answer).filter(Boolean)
                
                if (options.length === 0) {
                    console.warn(`Quiz ${quiz.id} has no answer options`)
                }
                
                return {
                    id: `q${quiz.id || index}`,
                    courseQuizId: quiz.id, // Preserve original course_quiz ID
                    prompt: quiz.question_text || quiz.title || `Question ${index + 1}`,
                    options: options.length > 0 ? options : ["Option A", "Option B", "Option C", "Option D"],
                    optionLineIds: lines.map((line: any) => line.id), // Preserve course_quiz_line IDs
                    correctIndex: correctIndex >= 0 ? correctIndex : 0,
                    correctLineId: correctIndex >= 0 ? lines[correctIndex]?.id : null, // Preserve correct line ID
                    points: quiz.total_score || quiz.max_score || 1,
                    duration: quiz.duration || 0
                }
            })
    }

    // Fetch certificate program and convert quizzes
    useEffect(() => {
        const loadCertificateData = async () => {
            if (!content.id) {
                setIsLoadingResult(false)
                return
            }

            try {
                setIsLoadingResult(true)
                // First try to parse from article field (legacy format)
                const parsedData = parseQuizData(content)
                if (parsedData?.questions && parsedData.questions.length > 0) {
                    console.log("Loaded questions from article field:", parsedData.questions.length)
                    setCertificateQuestions(parsedData.questions)
                    setIsLoadingResult(false)
                    return
                }

                // If no questions in article, fetch from certificate program
                // Use documentId instead of numeric id
                const contentIdentifier = content.documentId || content.id
                console.log("Fetching certificate program for content ID:", content.id, "documentId:", content.documentId)
                const program = await getCertificateProgramByCourseContent(contentIdentifier)
                console.log("Certificate program fetched:", program)
                
                if (program) {
                    setCertificateProgram(program)
                    const quizzes = (program as any).course_quizs || []
                    console.log("Found quizzes in program:", quizzes.length)
                    
                    if (quizzes.length > 0) {
                        const questions = convertQuizzesToQuestions(quizzes)
                        console.log("Converted questions:", questions.length, questions)
                        setCertificateQuestions(questions)
                    } else {
                        console.warn("Certificate program found but no quizzes linked")
                        setCertificateQuestions([])
                    }
                } else {
                    console.warn("No certificate program found for content ID:", content.id)
                    setCertificateQuestions([])
                }
                setIsLoadingResult(false)
            } catch (error) {
                console.error("Failed to load certificate data:", error)
                setCertificateQuestions([])
                setIsLoadingResult(false)
            }
        }

        loadCertificateData()
    }, [content.id])

    const totalQuestions = certificateQuestions.length
    const currentQuestion = certificateQuestions[currentQuestionIndex] || null
    const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0
    const questionDuration = currentQuestion?.duration || (certificateProgram?.min_score_to_pass ? 0 : 0)
    const certificateData = certificateProgram ? {
        passingScore: certificateProgram.min_score_to_pass || 70,
        timeLimit: 0 // Calculate from individual question durations if needed
    } : parseQuizData(content)

    // Check if user has already completed this certificate assessment
    useEffect(() => {
        const checkCompletedAttempt = async () => {
            if (!user?.id || !content.id) {
                setIsLoadingResult(false)
                return
            }

            try {
                const userId = typeof user.id === 'string' ? Number(user.id) : user.id
                if (isNaN(userId)) {
                    setIsLoadingResult(false)
                    return
                }

                // Check for completed quiz attempts for this certificate
                const attempts = await getQuizAttempts({
                    userId: userId,
                    courseContentId: content.id,
                    attemptStatus: "graded"
                })

                if (attempts.length > 0) {
                    // User has already completed this certificate assessment
                    setHasCompletedAttempt(true)
                    const latestAttempt = attempts[0]
                    
                    // Try to load from localStorage
                const storageKey = `certificate_result_${content.id}`
                const saved = localStorage.getItem(storageKey)
                
                if (saved) {
                    const result = JSON.parse(saved) as QuizResult
                    setSavedResult(result)
                        if (result.passed) {
                        setCertificateUnlocked(true)
                        setShowCertificate(true)
                    }
                    setQuizAnswers(result.answers)
                    setQuizFeedback(result.feedback)
                    setQuizSubmitted(true)
                    setShowResult(true) // Automatically show result screen
                    setXpEarned(result.earnedPoints * 10)
                    } else if (latestAttempt.metadata) {
                        // Try to reconstruct from attempt metadata
                        const metadata = latestAttempt.metadata as any
                        if (metadata.answers && metadata.feedback) {
                            const result: QuizResult = {
                                answers: metadata.answers,
                                feedback: metadata.feedback,
                                correctCount: metadata.correctCount || 0,
                                totalQuestions: metadata.totalQuestions || 0,
                                earnedPoints: latestAttempt.score || 0,
                                totalPoints: latestAttempt.max_score || 100,
                                scorePercent: metadata.scorePercent || 0,
                                passed: metadata.passed || false,
                                completedAt: latestAttempt.completed_at || new Date().toISOString(),
                                questionDetails: metadata.questionDetails || []
                            }
                            setSavedResult(result)
                            if (result.passed) {
                                setCertificateUnlocked(true)
                                setShowCertificate(true)
                            }
                            setQuizAnswers(result.answers)
                            setQuizFeedback(result.feedback)
                            setQuizSubmitted(true)
                            setShowResult(true) // Automatically show result screen
                            setXpEarned(result.earnedPoints * 10)
                        } else {
                            // Even if we can't restore full state, show result screen
                            setQuizSubmitted(true)
                            setShowResult(true)
                        }
                    } else {
                        // Even if we can't restore full state, show result screen
                        setQuizSubmitted(true)
                        setShowResult(true)
                    }
                }
                setIsLoadingResult(false)
            } catch (error) {
                console.error("Failed to check completed attempt:", error)
                setIsLoadingResult(false)
            }
        }

        checkCompletedAttempt()
    }, [user?.id, content.id, isCompleted, setQuizAnswers, setQuizFeedback, setQuizSubmitted, setXpEarned])

    // Timer effect for current question
    useEffect(() => {
        if (!certificateStarted || quizSubmitted || !currentQuestion || questionDuration === 0 || totalQuestions === 0) {
            setTimeRemaining(null)
            return
        }

        if (questionStartTime === null) {
            const startTime = Date.now()
            setQuestionStartTime(startTime)
            setTimeRemaining(questionDuration)
        }

        const interval = setInterval(() => {
            if (questionStartTime && currentQuestion) {
                const elapsed = Math.floor((Date.now() - questionStartTime) / 1000)
                const remaining = Math.max(0, questionDuration - elapsed)
                setTimeRemaining(remaining)

                if (remaining === 0 && currentQuestion.id) {
                    setQuestionTimeSpent(prev => ({
                        ...prev,
                        [currentQuestion.id]: questionDuration
                    }))
                    
                    // Clear the interval first to prevent multiple calls
                    clearInterval(interval)
                    
                    // Auto-advance to next question or submit
                    // Use setTimeout to ensure state updates are processed
                    setTimeout(() => {
                    if (currentQuestionIndex < totalQuestions - 1) {
                        handleNext()
                    } else {
                        handleSubmit()
                    }
                    }, 100)
                }
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [certificateStarted, quizSubmitted, currentQuestionIndex, currentQuestion, questionDuration, questionStartTime, totalQuestions])

    useEffect(() => {
        if (certificateStarted && !quizSubmitted && currentQuestion) {
            setQuestionStartTime(Date.now())
            setTimeRemaining(questionDuration > 0 ? questionDuration : null)
        }
    }, [currentQuestionIndex, certificateStarted, quizSubmitted, currentQuestion, questionDuration])

    const handleAnswerSelect = (optionIndex: number) => {
        if (quizSubmitted || !certificateStarted || !currentQuestion) return
        const answer = currentQuestion.options[optionIndex]
        if (!answer) return
        setSelectedAnswer(answer)
        setQuizAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: answer
        }))
    }

    const handleNext = () => {
        if (questionStartTime && currentQuestion && currentQuestion.id) {
            const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
            setQuestionTimeSpent(prev => ({
                ...prev,
                [currentQuestion.id]: Math.min(timeSpent, questionDuration || timeSpent)
            }))
        }

        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
            setSelectedAnswer(null)
            setQuestionStartTime(null)
        } else {
            handleSubmit()
        }
    }

    const handleSubmit = async () => {
        if (questionStartTime && currentQuestion && currentQuestion.id) {
            const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
            setQuestionTimeSpent(prev => ({
                ...prev,
                [currentQuestion.id]: Math.min(timeSpent, questionDuration || timeSpent)
            }))
        }

        const feedback: Record<string, { correct: boolean; message: string }> = {}
        let correctCount = 0
        let totalPoints = 0
        let earnedPoints = 0
        const questionDetails: QuizResult['questionDetails'] = []

        certificateQuestions.forEach((q: { id: string; prompt: string; options: string[]; correctIndex: number; points: number }) => {
            const userAnswer = quizAnswers[q.id] || ""
            const correctAnswer = q.options[q.correctIndex]
            const isCorrect = userAnswer === correctAnswer
            const timeSpent = questionTimeSpent[q.id] || 0
            
            totalPoints += q.points
            if (isCorrect) {
                correctCount++
                earnedPoints += q.points
            }
            
            feedback[q.id] = {
                correct: isCorrect,
                message: isCorrect 
                    ? `Correct! +${q.points} point${q.points > 1 ? 's' : ''}` 
                    : `Incorrect. The correct answer is: ${correctAnswer}`
            }

            questionDetails.push({
                questionId: q.id,
                questionText: q.prompt,
                userAnswer: userAnswer || "Not answered",
                correctAnswer: correctAnswer,
                isCorrect,
                points: q.points,
                earnedPoints: isCorrect ? q.points : 0,
                timeSpent: timeSpent > 0 ? timeSpent : undefined
            })
        })

        setQuizFeedback(feedback)
        setQuizSubmitted(true)
        setShowResult(true)
        
        const xp = earnedPoints * 10
        setXpEarned(xp)
        
        const passingScore = certificateData?.passingScore || 70
        const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
        const passed = scorePercent >= passingScore

        const result: QuizResult = {
            answers: { ...quizAnswers },
            feedback: { ...feedback },
            correctCount,
            totalQuestions: certificateQuestions.length,
            earnedPoints,
            totalPoints,
            scorePercent,
            passed,
            completedAt: new Date().toISOString(),
            questionDetails
        }

        // Save certificate result
        try {
            const storageKey = `certificate_result_${content.id}`
            localStorage.setItem(storageKey, JSON.stringify(result))
            setSavedResult(result)
        } catch (error) {
            console.error("Failed to save certificate result:", error)
        }

        if (enrollment && contentProgress) {
            try {
                await createOrUpdateContentProgress({
                    user: contentProgress.user?.id || 0,
                    course_content: content.id,
                    course_enrollment: enrollment.documentId,
                    tracking_status: "completed",
                    attempt_count: (contentProgress.attempt_count || 0) + 1,
                    watched_percent: 100
                })
            } catch (error) {
                console.warn("Failed to update content progress:", error)
            }
        }

        // Backend operations: Update quiz attempt, add candidate, create issuance
        if (user?.id && certificateProgram?.id) {
            try {
                const userId = typeof user.id === 'string' ? Number(user.id) : user.id
                const durationSeconds = assessmentStartTime ? Math.floor((Date.now() - assessmentStartTime) / 1000) : 0

                // 1. Update quiz attempt with completion
                if (quizAttemptId) {
                    try {
                        await updateQuizAttempt(quizAttemptId, {
                            attempt_status: "graded",
                            score: earnedPoints,
                            completed_at: new Date().toISOString(),
                            duration_seconds: durationSeconds,
                            metadata: {
                                ...result,
                                scorePercent,
                                passed,
                            }
                        })
                        console.log("Quiz attempt updated:", quizAttemptId)
                        
                        // Create quiz attempt answers for each question
                        for (const q of certificateQuestions) {
                            const question = q as any
                            if (!question.courseQuizId) continue // Skip if no course_quiz ID
                            
                            const userAnswer = quizAnswers[question.id] || ""
                            const userAnswerIndex = question.options.indexOf(userAnswer)
                            const selectedLineId = userAnswerIndex >= 0 && question.optionLineIds 
                                ? question.optionLineIds[userAnswerIndex] 
                                : null
                            
                            const isCorrect = userAnswer === question.options[question.correctIndex]
                            const pointsAwarded = isCorrect ? question.points : 0
                            
                            try {
                                await createQuizAttemptAnswer({
                                    quiz_attempt: quizAttemptId,
                                    course_quiz: question.courseQuizId,
                                    selected_line: selectedLineId,
                                    is_correct: isCorrect,
                                    points_awarded: pointsAwarded
                                })
                                console.log(`Quiz attempt answer created for question ${question.id}`)
                            } catch (answerError) {
                                console.error(`Failed to create quiz attempt answer for question ${question.id}:`, answerError)
                            }
                        }
                    } catch (error) {
                        console.error("Failed to update quiz attempt:", error)
                    }
                }

                // 2. Add user to candidates in certificate program
                try {
                    await addCandidateToCertificateProgram(certificateProgram.id, userId)
                    console.log("User added to candidates")
                } catch (error) {
                    console.error("Failed to add candidate:", error)
                }

                // 3. Create certificate issuance if passed
                if (passed && quizAttemptId) {
                    try {
                        const validUntil = certificateProgram.valid_until 
                            ? new Date(certificateProgram.valid_until).toISOString() 
                            : undefined

                        const issuance = await createCertificateIssuance({
                            certificate_program: certificateProgram.id,
                            user: userId,
                            quiz_attempt: quizAttemptId,
                            issued_at: new Date().toISOString(),
                            valid_until: validUntil,
                            issuance_status: "active",
                            metadata: {
                                score: earnedPoints,
                                max_score: totalPoints,
                                score_percent: scorePercent,
                                passing_score: passingScore,
                                content_name: content.name,
                                certificate_name: certificateProgram.name,
                                completed_at: result.completedAt,
                            }
                        })

                        if (issuance) {
                            console.log("Certificate issuance created:", issuance.id)
                            
                            // Link certificate issuance back to quiz attempt
                            if (quizAttemptId) {
                                try {
                                    await updateQuizAttempt(quizAttemptId, {
                                        metadata: {
                                            ...result,
                                            scorePercent,
                                            passed,
                                            certificate_issuance_id: issuance.id,
                                        }
                                    })
                                } catch (error) {
                                    console.warn("Failed to link certificate issuance to quiz attempt:", error)
                                }
                            }
                        }
                    } catch (error) {
                        console.error("Failed to create certificate issuance:", error)
                    }
                }
            } catch (error) {
                console.error("Error in backend operations:", error)
            }
        }

        // Load quiz attempt history after completion
        if (user?.id && content.id) {
            loadQuizHistory()
        }

        if (passed) {
            setCertificateUnlocked(true)
            // Don't show certificate template - show result with history instead
            setShowCertificate(false)
            setTimeout(() => {
                onComplete()
            }, 2000)
        }
    }

    // Load quiz attempt history
    const loadQuizHistory = useCallback(async () => {
        if (!user?.id || !content.id) return
        
        setIsLoadingHistory(true)
        try {
            const userId = typeof user.id === 'string' ? Number(user.id) : user.id
            if (isNaN(userId)) {
                setIsLoadingHistory(false)
                return
            }

            // Get all quiz attempts for this content
            const attempts = await getQuizAttempts({
                userId: userId,
                courseContentId: content.id,
            })
            
            // Sort by completed_at descending (most recent first)
            const sortedAttempts = attempts.sort((a, b) => {
                const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0
                const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0
                return dateB - dateA
            })
            
            setQuizAttemptHistory(sortedAttempts)

            // Get certificate issuances if this is a certificate
            if (certificateProgram?.id) {
                const issuances = await getCertificateIssuances({
                    userId: userId,
                    certificateProgramId: certificateProgram.id,
                })
                setCertificateIssuances(issuances)
            }
        } catch (error) {
            console.error("Failed to load quiz history:", error)
        } finally {
            setIsLoadingHistory(false)
        }
    }, [user?.id, content.id, certificateProgram?.id])

    // Load history when component mounts or when user/content changes
    useEffect(() => {
        if (user?.id && content.id && (isCompleted || hasCompletedAttempt)) {
            loadQuizHistory()
        }
    }, [user?.id, content.id, isCompleted, hasCompletedAttempt, loadQuizHistory])

    // Show loading state
    if (isLoadingResult) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="mx-auto w-12 h-12"
                    >
                        <Award className="w-12 h-12 text-primary" />
                    </motion.div>
                    <p className="text-muted-foreground">Loading certificate assessment...</p>
                </div>
            </div>
        )
    }

    // Show message if no questions available (after loading is complete)
    if (totalQuestions === 0 && !isLoadingResult) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <Award className="w-16 h-16 mx-auto text-muted-foreground" />
                    <p className="text-xl font-semibold text-muted-foreground">
                        No questions available for this certificate assessment.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Please ensure the certificate program has quizzes linked in Strapi.
                    </p>
                </div>
            </div>
        )
    }

    // If completed but failed, show result screen
    if (isCompleted && savedResult && !savedResult.passed) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto"
            >
                <div className="relative rounded-3xl p-12 shadow-2xl overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-pink-600">
                    <div className="relative z-10 text-center space-y-8">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="mx-auto w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30"
                        >
                            <Target className="w-16 h-16 text-white" />
                        </motion.div>
                        <div className="space-y-4">
                            <h1 className="text-5xl font-bold text-white drop-shadow-lg">Certificate Not Unlocked</h1>
                            <p className="text-2xl text-white/90">You scored {savedResult.scorePercent}%</p>
                            <p className="text-lg text-white/80">Minimum {certificateData?.passingScore || 70}% required to unlock certificate</p>
                            {hasCompletedAttempt && (
                                <p className="text-sm text-white/70 italic">You have already completed this assessment. Retaking is not allowed.</p>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        )
    }

    // Certificate Start Screen - Special design for Certificate
    // Only show start screen if not started AND not showing result AND not already completed AND not loading
    if (!certificateStarted && !showResult && !hasCompletedAttempt && !isLoadingResult) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-3xl mx-auto"
            >
                <div className="relative bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 rounded-3xl p-12 shadow-2xl overflow-hidden">
                    {/* Animated background */}
                    <div className="absolute inset-0 overflow-hidden">
                        <motion.div
                            animate={{ 
                                rotate: [0, 360],
                                scale: [1, 1.2, 1]
                            }}
                            transition={{ 
                                duration: 20, 
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="absolute -top-20 -right-20 w-64 h-64 bg-white/20 rounded-full blur-3xl"
                        />
                        <motion.div
                            animate={{ 
                                rotate: [360, 0],
                                scale: [1, 1.3, 1]
                            }}
                            transition={{ 
                                duration: 15, 
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="absolute -bottom-20 -left-20 w-80 h-80 bg-yellow-300/30 rounded-full blur-3xl"
                        />
                    </div>

                    <div className="relative z-10 text-center space-y-8">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="mx-auto w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30"
                        >
                            <Award className="w-12 h-12 text-white" />
                        </motion.div>

                        <div className="space-y-4">
                            <h1 className="text-5xl font-bold text-white drop-shadow-lg">
                                Certificate Assessment
                            </h1>
                            <p className="text-2xl text-white/90">{content.name}</p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 space-y-4 border border-white/20">
                            <div className="flex items-center justify-center gap-2 text-white mb-4">
                                <Medal className="w-6 h-6" />
                                <span className="text-lg font-semibold">Earn Your Certificate</span>
                            </div>
                            <p className="text-white/90 mb-4">
                                Complete the assessment below to unlock your certificate of completion. Answer all questions correctly to earn your certificate.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="bg-white/10 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-white/80 mb-1">
                                        <ClipboardList className="w-4 h-4" />
                                        <span className="text-sm">Questions</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{totalQuestions}</p>
                                </div>
                                <div className="bg-white/10 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-white/80 mb-1">
                                        <Trophy className="w-4 h-4" />
                                        <span className="text-sm">Passing Score</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{certificateData?.passingScore || 70}%</p>
                                </div>
                                {certificateData?.timeLimit > 0 && (
                                    <div className="bg-white/10 rounded-lg p-4 col-span-2">
                                        <div className="flex items-center gap-2 text-white/80 mb-1">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm">Time Limit</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white">{certificateData.timeLimit} minutes</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {hasCompletedAttempt ? (
                                <div className="space-y-4">
                                    <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4">
                                        <p className="text-white text-sm font-medium">
                                            You have already completed this certificate assessment. Retaking is not allowed.
                                        </p>
                                    </div>
                            <Button
                                        onClick={() => {
                                            setQuizSubmitted(true)
                                            setShowResult(true)
                                        }}
                                        size="lg"
                                        variant="outline"
                                        className="bg-white/10 text-white border-white/30 hover:bg-white/20 text-lg px-8 py-6 rounded-xl font-bold"
                                    >
                                        <Trophy className="w-5 h-5 mr-2" />
                                        View Results
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    onClick={async () => {
                                        // Prevent starting if already completed
                                        if (hasCompletedAttempt) {
                                            setQuizSubmitted(true)
                                            setShowResult(true)
                                            return
                                        }
                                        
                                        // Reset all states when starting a new attempt
                                        setCertificateStarted(true)
                                        setQuizSubmitted(false)
                                        setShowResult(false)
                                        setCurrentQuestionIndex(0)
                                        setSelectedAnswer(null)
                                        setQuizAnswers({})
                                        setQuizFeedback({})
                                        setQuestionStartTime(null)
                                        setTimeRemaining(null)
                                        setQuestionTimeSpent({})
                                        setXpEarned(0)
                                        setAssessmentStartTime(Date.now())
                                        
                                        // Create quiz attempt in backend
                                        if (user?.id && certificateProgram?.id) {
                                            try {
                                                const userId = typeof user.id === 'string' ? Number(user.id) : user.id
                                                const totalScore = certificateQuestions.reduce((sum: number, q: { points: number }) => sum + (q.points || 0), 0)
                                                
                                                const attempt = await createQuizAttempt({
                                                    user: userId,
                                                    certificate_program: certificateProgram.id,
                                                    course_content: content.id,
                                                    attempt_status: "in_progress",
                                                    max_score: totalScore,
                                                    started_at: new Date().toISOString(),
                                                    metadata: {
                                                        content_name: content.name,
                                                        certificate_name: certificateProgram.name,
                                                    }
                                                })
                                                
                                                if (attempt) {
                                                    setQuizAttemptId(attempt.id)
                                                    console.log("Quiz attempt created:", attempt.id)
                                                }
                                            } catch (error) {
                                                console.error("Failed to create quiz attempt:", error)
                                                // Continue even if backend call fails
                                            }
                                        }
                                    }}
                                size="lg"
                                className="bg-white text-amber-700 hover:bg-white/90 text-lg px-8 py-6 rounded-xl font-bold shadow-xl"
                            >
                                <Rocket className="w-5 h-5 mr-2" />
                                Start Assessment
                            </Button>
                            )}
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        )
    }

    // Result Screen - Show quiz attempt history instead of certificate template
    if (showResult && quizSubmitted) {
        // Use savedResult if available, otherwise calculate from current state
        let correctCount: number
        let totalPoints: number
        let earnedPoints: number
        let scorePercent: number
        let passed: boolean
        
        if (savedResult) {
            // Use saved result data
            correctCount = savedResult.correctCount
            totalPoints = savedResult.totalPoints
            earnedPoints = savedResult.earnedPoints
            scorePercent = savedResult.scorePercent
            passed = savedResult.passed
        } else {
            // Calculate from current state
            correctCount = Object.values(quizFeedback).filter(f => f.correct).length
            totalPoints = certificateQuestions.reduce((sum: number, q: { points: number }) => sum + q.points, 0)
            earnedPoints = certificateQuestions.reduce((sum: number, q: { id: string; options: string[]; correctIndex: number; points: number }) => {
            const userAnswer = quizAnswers[q.id]
            const isCorrect = userAnswer === q.options[q.correctIndex]
            return sum + (isCorrect ? q.points : 0)
        }, 0)
            scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
            passed = scorePercent >= (certificateData?.passingScore || 70)
        }
        
        const passingScore = certificateData?.passingScore || 70

        // Get certificate issuance status for current attempt
        const currentIssuance = certificateIssuances.find(iss => 
            quizAttemptId && iss.quiz_attempt?.id === quizAttemptId
        )

        return (
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Current Attempt Result */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                        "relative rounded-3xl p-8 shadow-2xl overflow-hidden",
                    passed 
                        ? "bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600"
                        : "bg-gradient-to-br from-orange-500 via-red-500 to-pink-600"
                )}>
                    <div className="relative z-10 text-center space-y-6">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="mx-auto w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30"
                        >
                            {passed ? (
                                <Crown className="w-12 h-12 text-yellow-300" />
                            ) : (
                                <Target className="w-12 h-12 text-white" />
                            )}
                        </motion.div>

                        <div className="space-y-3">
                            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
                                {passed ? "Assessment Passed!" : "Assessment Not Passed"}
                            </h1>
                            <p className="text-xl text-white/90">
                                Score: {scorePercent}% ({earnedPoints}/{totalPoints} points)
                            </p>
                            {passed && currentIssuance && (
                                <div className="bg-white/20 rounded-lg p-3 mt-2">
                                    <p className="text-sm text-white/90">
                                        ✓ Certificate issued on {new Date(currentIssuance.issued_at).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-white/70 mt-1">
                                        Certificate will be sent by email (coming soon)
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30">
                                <div className="flex items-center justify-center gap-2 text-white/80 mb-1">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-xs">Correct</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{correctCount}/{totalQuestions}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30">
                                <div className="flex items-center justify-center gap-2 text-white/80 mb-1">
                                    <Trophy className="w-4 h-4" />
                                    <span className="text-xs">Points</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{earnedPoints}/{totalPoints}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30">
                                <div className="flex items-center justify-center gap-2 text-white/80 mb-1">
                                    <Zap className="w-4 h-4" />
                                    <span className="text-xs">XP</span>
                                </div>
                                <p className="text-2xl font-bold text-white">+{xpEarned}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Quiz Attempt History */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <ClipboardList className="w-6 h-6" />
                            Assessment History
                        </h2>
                        {isLoadingHistory && (
                            <div className="text-sm text-muted-foreground">Loading...</div>
                        )}
                    </div>

                    {quizAttemptHistory.length === 0 && !isLoadingHistory ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No previous attempts found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {quizAttemptHistory.map((attempt, index) => {
                                const attemptScore = attempt.score ?? 0
                                const attemptMaxScore = attempt.max_score || 100
                                const attemptScorePercent = attemptMaxScore > 0 
                                    ? Math.round((attemptScore / attemptMaxScore) * 100) 
                                    : 0
                                const attemptPassed = attemptScorePercent >= passingScore
                                
                                // Check if certificate was issued for this attempt
                                const attemptIssuance = certificateIssuances.find(iss => 
                                    iss.quiz_attempt?.id === attempt.id
                                )
                                
                                const isCurrentAttempt = attempt.id === quizAttemptId
                                
                                return (
                            <motion.div
                                        key={attempt.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                        className={cn(
                                            "rounded-xl p-4 border-2 transition-all",
                                            isCurrentAttempt
                                                ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-400 dark:border-blue-600"
                                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Badge variant={attemptPassed ? "default" : "destructive"}>
                                                        {attemptPassed ? (
                                                            <>
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Passed
                                                            </>
                                                        ) : (
                                                            <>
                                                                <X className="w-3 h-3 mr-1" />
                                                                Failed
                                                            </>
                                                        )}
                                                    </Badge>
                                                    {isCurrentAttempt && (
                                                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                                                            Current Attempt
                                                        </Badge>
                                                    )}
                                                    {attemptIssuance && (
                                                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                                                            <Award className="w-3 h-3 mr-1" />
                                                            Certificate Issued
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-muted-foreground text-xs mb-1">Score</p>
                                                        <p className="font-bold text-lg">
                                                            {attemptScorePercent}%
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {attemptScore}/{attemptMaxScore} points
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground text-xs mb-1">Completed</p>
                                                        <p className="font-semibold">
                                                            {attempt.completed_at 
                                                                ? new Date(attempt.completed_at).toLocaleDateString()
                                                                : "N/A"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {attempt.completed_at 
                                                                ? new Date(attempt.completed_at).toLocaleTimeString()
                                                                : ""}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground text-xs mb-1">Duration</p>
                                                        <p className="font-semibold">
                                                            {attempt.duration_seconds 
                                                                ? `${Math.floor(attempt.duration_seconds / 60)}m ${attempt.duration_seconds % 60}s`
                                                                : "N/A"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground text-xs mb-1">Status</p>
                                                        <p className="font-semibold capitalize">
                                                            {attempt.attempt_status?.replace('_', ' ')}
                                                        </p>
                                                    </div>
                                                </div>
                    </div>
                </div>
            </motion.div>
                                )
                            })}
                        </div>
                    )}
                </motion.div>
            </div>
        )
    }

    // Certificate Question Screen (One-by-one) - Special design
    // Safety check: ensure we have questions and current question exists
    if (!currentQuestion || totalQuestions === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <Award className="w-16 h-16 mx-auto text-muted-foreground" />
                    <p className="text-xl font-semibold text-muted-foreground">No questions available for this certificate assessment.</p>
                </div>
            </div>
        )
    }

    const userAnswer = quizAnswers[currentQuestion.id]
    const isAnswered = !!userAnswer
    const correctAnswerIndex = currentQuestion.correctIndex

    return (
        <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="max-w-4xl mx-auto space-y-8"
        >
            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="font-semibold">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                    <div className="flex items-center gap-4">
                        {timeRemaining !== null && timeRemaining > 0 && (
                            <div className={cn(
                                "flex items-center gap-2 font-semibold",
                                timeRemaining <= 10 ? "text-red-500 animate-pulse" : "text-muted-foreground"
                            )}>
                                <Clock className="w-4 h-4" />
                                <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
                            </div>
                        )}
                        <span className="font-semibold">{Math.round(progress)}% Complete</span>
                    </div>
                </div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-600 rounded-full"
                    />
                </div>
            </div>

            {/* Question Card - Certificate Style */}
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="relative bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 rounded-3xl p-10 shadow-2xl border-4 border-amber-400 overflow-hidden"
            >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-full blur-3xl -ml-32 -mb-32" />

                <div className="relative z-10 space-y-8">
                    {/* Question Header */}
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-amber-600">
                            {currentQuestionIndex + 1}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold mb-2 text-amber-900 dark:text-amber-100">{currentQuestion.prompt}</h2>
                            {currentQuestion.points && (
                                <Badge className="bg-amber-500 text-white border-amber-600">
                                    <Trophy className="w-3 h-3 mr-1" />
                                    {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Answer Options */}
                    <div className="grid gap-4">
                        {currentQuestion.options.map((option: string, index: number) => {
                            const isSelected = userAnswer === option
                            const isCorrect = index === correctAnswerIndex
                            const showCorrect = quizSubmitted && isCorrect
                            const showIncorrect = quizSubmitted && isSelected && !isCorrect

                            return (
                                <motion.button
                                    key={index}
                                    whileHover={!quizSubmitted ? { scale: 1.02 } : {}}
                                    whileTap={!quizSubmitted ? { scale: 0.98 } : {}}
                                    onClick={() => handleAnswerSelect(index)}
                                    disabled={quizSubmitted}
                                    className={cn(
                                        "relative p-6 rounded-2xl border-2 text-left transition-all",
                                        "font-medium text-lg",
                                        isSelected && !quizSubmitted
                                            ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-600 shadow-lg"
                                            : showCorrect
                                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-600 shadow-lg"
                                            : showIncorrect
                                            ? "bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-600 shadow-lg"
                                            : "bg-white dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/50",
                                        quizSubmitted && "cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg border-2",
                                            isSelected || showCorrect
                                                ? "bg-white/20 text-white border-white/30"
                                                : "bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                                        )}>
                                            {String.fromCharCode(65 + index)}
                                        </div>
                                        <span className="flex-1">{option}</span>
                                        {showCorrect && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="flex-shrink-0"
                                            >
                                                <CheckCircle className="w-6 h-6 text-white" />
                                            </motion.div>
                                        )}
                                        {showIncorrect && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="flex-shrink-0"
                                            >
                                                <X className="w-6 h-6 text-white" />
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.button>
                            )
                        })}
                    </div>

                    {/* Feedback */}
                    {quizSubmitted && quizFeedback[currentQuestion.id] && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "p-4 rounded-xl flex items-start gap-3",
                                quizFeedback[currentQuestion.id].correct
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                                    : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                            )}
                        >
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                                quizFeedback[currentQuestion.id].correct ? "bg-green-500" : "bg-red-500"
                            )}>
                                {quizFeedback[currentQuestion.id].correct ? (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                ) : (
                                    <X className="w-4 h-4 text-white" />
                                )}
                            </div>
                            <p className="font-medium">{quizFeedback[currentQuestion.id].message}</p>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Navigation */}
            <div className="flex items-center justify-end">
                <Button
                    onClick={handleNext}
                    disabled={!isAnswered}
                    size="lg"
                    className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white shadow-lg"
                >
                    {currentQuestionIndex < totalQuestions - 1 ? (
                        <>
                            Next Question
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                    ) : (
                        <>
                            Submit Assessment
                            <Award className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </motion.div>
    )
}
