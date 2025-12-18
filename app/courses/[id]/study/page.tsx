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
} from "lucide-react"
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import { Footer } from "@/components/ui/footers/footer"
import { getCourseCourse } from "@/integrations/strapi/courseCourse"
import { getCourseMaterials, getCourseContentsForMaterial, CourseMaterialEntity, CourseContentEntity } from "@/integrations/strapi/courseMaterial"
import { checkUserEnrollment, createCourseEnrollment, updateCourseEnrollment, CourseEnrollment } from "@/integrations/strapi/courseEnrollment"
import { getUserContentProgress, createOrUpdateContentProgress, ContentProgressEntity } from "@/integrations/strapi/contentProgress"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { cn } from "@/utils/utils"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import dynamic from "next/dynamic"

// Dynamically import ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false })

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
        
        if (isCompleted) {
            // Update state but DO NOT start tracking
            setContentProgress(progress)
            setActiveSectionIndex(sectionIndex)
            setActiveContentIndex(contentIndex)
            setCurrentView('lesson')
            setQuizSubmitted(false)
            setQuizAnswers({})
            setQuizFeedback({})
            
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
        setQuizSubmitted(false)
        setQuizAnswers({})
        setQuizFeedback({})
        
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
            const isQuizOrCert = selectedContent.type?.toLowerCase().includes('quiz') || 
                               selectedContent.type?.toLowerCase().includes('certificate')
            
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
            
            // Only start tracking if content is NOT completed and all conditions are met
            if (isAuthenticated && user && enrollment) {
                if (selectedContent.can_track_progress && 
                    (selectedContent.estimated_minutes || 0) > 0 && 
                    !isQuizOrCert) {
                    // Start tracking in background (don't await to avoid blocking UI)
                    startContentTracking(selectedContent.id).catch(err => 
                        console.warn("Failed to start content tracking:", err)
                    )
                }
            } else if (!isAuthenticated) {
                // Not authenticated, reset time and only start tracking if conditions are met
                setViewedSeconds(0)
                setViewingStartTime(Date.now())
                if (selectedContent.can_track_progress && (selectedContent.estimated_minutes || 0) > 0 && !isQuizOrCert) {
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
        <div className="min-h-screen bg-background">
            <HeaderUltra />
            
            {/* Study Interface */}
            <div className="flex h-[calc(100vh-64px)] pt-16">
                {/* Left Sidebar - Course Navigation */}
                <motion.div
                    initial={{ x: sidebarOpen ? 0 : -320 }}
                    animate={{ x: sidebarOpen ? 0 : -320 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                        "fixed lg:relative z-40 h-full w-80 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 flex flex-col",
                        "shadow-2xl lg:shadow-none"
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
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Mobile Sidebar Toggle */}
                    {!sidebarOpen && (
                        <div className="lg:hidden fixed top-20 left-4 z-30">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSidebarOpen(true)}
                                className="bg-background/80 backdrop-blur-sm"
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
                                ) : isQuiz ? (
                                    <QuizView
                                        content={currentContent}
                                        quizAnswers={quizAnswers}
                                        setQuizAnswers={setQuizAnswers}
                                        quizFeedback={quizFeedback}
                                        setQuizFeedback={setQuizFeedback}
                                        quizSubmitted={quizSubmitted}
                                        setQuizSubmitted={setQuizSubmitted}
                                        xpEarned={xpEarned}
                                        setXpEarned={setXpEarned}
                                        onComplete={() => markContentComplete(String(currentContent.id))}
                                    />
                                ) : (
                                    <LessonView
                                        content={currentContent}
                                        isCompleted={isCompleted}
                                        contentProgress={contentProgress}
                                        viewedSeconds={viewedSeconds}
                                        setViewedSeconds={setViewedSeconds}
                                        enrollment={enrollment}
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

            <Footer />
        </div>
    )
}

// Lesson View Component
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
            className="space-y-6"
        >
            {/* Lesson Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white shadow-lg">
                        <ContentIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-2">{content.name}</h1>
                        {content.type && (
                            <Badge variant="outline" className="text-xs">
                                {content.type}
                            </Badge>
                        )}
                    </div>
                </div>

                {content.estimated_minutes > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{content.estimated_minutes} minutes</span>
                    </div>
                )}
            </div>

            <Separator />

            {/* Lesson Content */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
                {/* Article content */}
                {content.type === "article" && content.article && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                        <div 
                            className="text-lg leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: content.article }}
                        />
                    </div>
                )}

                {/* Video content */}
                {content.type === "video" && (content.video || content.url) && (
                    <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                        <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden">
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
                    <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
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
                                className="text-primary hover:underline text-sm"
                            >
                                Open in new tab →
                            </a>
                        </div>
                    </div>
                )}

                {/* Document/PDF content */}
                {(content.type === "document" || content.type === "article") && content.document && (
                    <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-center">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">Document content</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Timeline Design - Show when estimated_minutes > 0 (regardless of can_track_progress or completion status) */}
            {estimatedMinutes > 0 && (
                <div className="mt-6 space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
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
            <div className="flex items-center justify-between pt-6 border-t">
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
function QuizView({
    content,
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
    // Mock quiz questions - in real implementation, this would come from content data
    const quizQuestions = [
        {
            id: "q1",
            question: "Do you think this is a good question?",
            options: ["Yes", "No"],
            correctAnswer: "Yes",
            feedback: "Correct! Great job!"
        },
        {
            id: "q2",
            question: "Did you understand the lesson?",
            options: ["Yes", "No", "Maybe"],
            correctAnswer: "Yes",
            feedback: "Correct! Congratulations!"
        }
    ]

    const handleAnswerChange = (questionId: string, answer: string) => {
        setQuizAnswers((prev: Record<string, string>) => {
            const updated: Record<string, string> = { ...prev }
            updated[questionId] = answer
            return updated
        })
    }

    const handleSubmit = () => {
        const feedback: Record<string, { correct: boolean; message: string }> = {}
        let correctCount = 0

        quizQuestions.forEach(q => {
            const userAnswer = quizAnswers[q.id]
            const isCorrect = userAnswer === q.correctAnswer
            if (isCorrect) correctCount++
            
            feedback[q.id] = {
                correct: isCorrect,
                message: isCorrect ? q.feedback : "Incorrect. Please review the lesson."
            }
        })

        setQuizFeedback(feedback)
        setQuizSubmitted(true)
        
        // Calculate XP (10 points per correct answer)
        const xp = correctCount * 10
        setXpEarned(xp)
        
        if (correctCount === quizQuestions.length) {
            setTimeout(() => {
                onComplete()
            }, 2000)
        }
    }

    const allAnswered = quizQuestions.every(q => quizAnswers[q.id])
    const correctCount = Object.values(quizFeedback).filter(f => f.correct).length
    const totalQuestions = quizQuestions.length

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Quiz Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white shadow-lg">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-2">{content.name}</h1>
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                            Quiz
                        </Badge>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Quiz Questions */}
            <div className="space-y-8">
                {quizQuestions.map((question, index) => {
                    const userAnswer = quizAnswers[question.id]
                    const feedback = quizFeedback[question.id]
                    const isCorrect = feedback?.correct

                    return (
                        <div
                            key={question.id}
                            className={cn(
                                "bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border-2 transition-all",
                                feedback
                                    ? isCorrect
                                        ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
                                        : "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"
                                    : "border-slate-200 dark:border-slate-700"
                            )}
                        >
                            <h3 className="text-xl font-semibold mb-6">
                                {index + 1}. {question.question}
                            </h3>

                            <RadioGroup
                                value={userAnswer}
                                onValueChange={(value: string) => {
                                    handleAnswerChange(question.id, value)
                                }}
                                disabled={quizSubmitted}
                                className="space-y-3"
                            >
                                {question.options.map((option) => (
                                    <div
                                        key={option}
                                        className={cn(
                                            "flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer",
                                            userAnswer === option
                                                ? feedback
                                                    ? isCorrect
                                                        ? "border-green-500 bg-green-100 dark:bg-green-900/30"
                                                        : "border-red-500 bg-red-100 dark:bg-red-900/30"
                                                    : "border-primary bg-primary/10"
                                                : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
                                        )}
                                        onClick={() => !quizSubmitted && handleAnswerChange(question.id, option)}
                                    >
                                        <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                                        <Label
                                            htmlFor={`${question.id}-${option}`}
                                            className="flex-1 cursor-pointer font-medium"
                                        >
                                            {option}
                                        </Label>
                                        {quizSubmitted && userAnswer === option && (
                                            <div className="ml-auto">
                                                {isCorrect ? (
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                ) : (
                                                    <X className="w-5 h-5 text-red-500" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </RadioGroup>

                            {/* Feedback */}
                            {feedback && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "mt-4 p-4 rounded-lg flex items-start gap-3",
                                        isCorrect
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                                            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                                    )}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                                        isCorrect ? "bg-green-500" : "bg-red-500"
                                    )}>
                                        {isCorrect ? (
                                            <CheckCircle className="w-3 h-3 text-white" />
                                        ) : (
                                            <X className="w-3 h-3 text-white" />
                                        )}
                                    </div>
                                    <p className="text-sm font-medium">{feedback.message}</p>
                                </motion.div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Quiz Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
                {quizSubmitted ? (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <Trophy className="w-5 h-5" />
                            <span className="font-semibold">
                                {correctCount} / {totalQuestions} Correct
                            </span>
                        </div>
                        {xpEarned > 0 && (
                            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                                <Zap className="w-5 h-5" />
                                <span className="font-semibold">+{xpEarned} XP</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div></div>
                )}

                {!quizSubmitted ? (
                    <Button
                        onClick={handleSubmit}
                        disabled={!allAnswered}
                        size="lg"
                        className="bg-primary hover:bg-primary/90"
                    >
                        Submit Quiz
                    </Button>
                ) : correctCount === totalQuestions ? (
                    <Button
                        onClick={onComplete}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Complete Quiz
                    </Button>
                ) : (
                    <Button
                        onClick={() => {
                            setQuizSubmitted(false)
                            setQuizAnswers({})
                            setQuizFeedback({})
                        }}
                        variant="outline"
                        size="lg"
                    >
                        Try Again
                    </Button>
                )}
            </div>
        </motion.div>
    )
}
