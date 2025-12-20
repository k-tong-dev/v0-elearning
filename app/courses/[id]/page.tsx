"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
    Star,
    Clock,
    Users,
    ChevronRight,
    Play,
    CheckCircle,
    BookOpen,
    Globe,
    Trophy,
    Heart,
    Share2,
    ChevronDown,
    ChevronUp,
    ShoppingCart,
    Lock,
    AlertCircle,
    Loader2,
    Sparkles,
    Award,
    GraduationCap,
    MessageSquare,
    BarChart3,
    TrendingUp,
    Tag,
    FileText,
    Video,
    Music,
    ImageIcon,
    File,
    Link as LinkIcon,
    CircleCheck,
    Image,
    ChevronLeft,
} from "lucide-react"
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import { Footer } from "@/components/ui/footers/footer"
import { Button } from "@heroui/react"
import { Button as UIButton } from "@/components/ui/button"
import Link from "next/link"
import { CourseRatingForm } from "@/components/courses/CourseRatingForm"
import dynamic from "next/dynamic"
import { CoursePreviewModal } from "@/components/courses/CoursePreviewModal"
import { getCoursePreviewUrl } from "@/integrations/strapi/coursePreview"
import { getCourseCourse } from "@/integrations/strapi/courseCourse"
import { getCourseMaterials, getCourseContentsForMaterial } from "@/integrations/strapi/courseMaterial"
import { checkUserEnrollment, createCourseEnrollment, getCourseEnrollments, CourseEnrollment } from "@/integrations/strapi/courseEnrollment"
import { getPurchaseTransactions } from "@/integrations/strapi/purchaseTransaction"
import { getUserWishlists, createUserWishlist, deleteUserWishlist } from "@/integrations/strapi/userWishlist"
import { getUserCourseReview, createCourseReview, getCourseReviewers, calculateCourseRating } from "@/integrations/strapi/courseReviewer"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/contexts/CartContext"
import { toast } from "sonner"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import { enrichInstructorsWithAvatars } from "@/lib/helpers/instructorAvatarHelper"
import { ForumUserAvatar } from "@/components/ui/enhanced-avatar"
import { CourseMaterialEntity, CourseContentEntity } from "@/integrations/strapi/courseMaterial"
import { cn } from "@/utils/utils"
import useEmblaCarousel from 'embla-carousel-react'

const CourseActionsDropdown = dynamic(() => import("@/components/courses/CourseActionsDropdown").then(mod => mod.CourseActionsDropdown), { ssr: false });

interface CourseSection {
    material: CourseMaterialEntity;
    contents: CourseContentEntity[];
}

// Contents Carousel Component - Slideable like Reviews
function ContentsCarousel({ sections }: { sections: CourseSection[] }) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ 
        align: 'start',
        slidesToScroll: 1,
        containScroll: 'trimSnaps',
        dragFree: true,
    })
    const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
    const [nextBtnDisabled, setNextBtnDisabled] = useState(true)

    const onSelect = useCallback((emblaApi: any) => {
        setPrevBtnDisabled(!emblaApi.canScrollPrev())
        setNextBtnDisabled(!emblaApi.canScrollNext())
    }, [])

    useEffect(() => {
        if (!emblaApi) return

        onSelect(emblaApi)
        emblaApi.on('reInit', onSelect)
        emblaApi.on('select', onSelect)
    }, [emblaApi, onSelect])

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev()
    }, [emblaApi])

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext()
    }, [emblaApi])

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes}m`
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }

    const getContentTypeIcon = (type: string | null | undefined) => {
        if (!type) return Play
        const normalizedType = type.toLowerCase()
        if (normalizedType.includes('video')) return Video
        if (normalizedType.includes('audio')) return Music
        if (normalizedType.includes('document') || normalizedType.includes('pdf')) return FileText
        if (normalizedType.includes('image')) return Image
        if (normalizedType.includes('article')) return BookOpen
        if (normalizedType.includes('certificate')) return Award
        if (normalizedType.includes('url') || normalizedType.includes('link')) return LinkIcon
        return File
    }

    const getContentTypeColor = (type: string | null | undefined) => {
        if (!type) return "from-blue-500 to-blue-600"
        const normalizedType = type.toLowerCase()
        if (normalizedType.includes('video')) return "from-red-500 to-red-600"
        if (normalizedType.includes('audio')) return "from-purple-500 to-purple-600"
        if (normalizedType.includes('document') || normalizedType.includes('pdf')) return "from-orange-500 to-orange-600"
        if (normalizedType.includes('image')) return "from-green-500 to-green-600"
        if (normalizedType.includes('article')) return "from-indigo-500 to-indigo-600"
        if (normalizedType.includes('certificate')) return "from-yellow-500 to-yellow-600"
        if (normalizedType.includes('url') || normalizedType.includes('link')) return "from-cyan-500 to-cyan-600"
        return "from-blue-500 to-blue-600"
    }

    // Flatten all sections into a single array of contents with section info
    const allContents = sections.flatMap((section, sectionIndex) => 
        section.contents.map(content => ({
            ...content,
            sectionName: section.material.name,
            sectionIndex: sectionIndex + 1,
            sectionDuration: section.contents.reduce((sum, c) => sum + (c.estimated_minutes || 0), 0)
        }))
    )

    return (
        <div className="relative">
            {/* Navigation Buttons */}
            {allContents.length > 1 && (
                <>
                    <UIButton
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border-2 shadow-lg rounded-full w-10 h-10 p-0",
                            prevBtnDisabled && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={scrollPrev}
                        disabled={prevBtnDisabled}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </UIButton>
                    <UIButton
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border-2 shadow-lg rounded-full w-10 h-10 p-0",
                            nextBtnDisabled && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={scrollNext}
                        disabled={nextBtnDisabled}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </UIButton>
                </>
            )}

            <div className="overflow-hidden px-12 py-12" ref={emblaRef}>
                <div className="flex gap-4">
                    {allContents.map((content, index) => {
                        const ContentTypeIcon = getContentTypeIcon(content.type)
                        const iconColor = getContentTypeColor(content.type)
                        
                        return (
                            <div 
                                key={content.id || `content-${index}`}
                                className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_35%] min-w-0"
                            >
                                <div className="liquid-glass-card border-2 shadow-lg h-full rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-primary/50">
                                    <div className="p-6">
                                        <div className="flex flex-col gap-4">
                                            {/* Section Badge */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                                                    Section {content.sectionIndex}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {content.sectionName}
                                                </span>
                                            </div>

                                            {/* Content Icon */}
                                            <div className={cn(
                                                "w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg mx-auto",
                                                iconColor
                                            )}>
                                                <ContentTypeIcon className="w-8 h-8" />
                                            </div>

                                            {/* Content Info */}
                                            <div className="text-center space-y-2">
                                                <h3 className="font-bold text-lg mb-2 line-clamp-2">
                                                    {content.name}
                                                </h3>
                                                
                                                {content.type && (
                                                    <Badge 
                                                        variant="outline" 
                                                        className="text-xs font-medium border-primary/30 text-primary bg-primary/5"
                                                    >
                                                        {content.type}
                                                    </Badge>
                                                )}

                                                {/* Duration */}
                                                {content.estimated_minutes > 0 && (
                                                    <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground font-medium pt-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{formatDuration(content.estimated_minutes)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default function CourseDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const { addToCart, isInCart, isInCartByDocumentId, isLoading: isCartLoading, items: cartItems } = useCart()
    const courseId = params?.id as string

    const [course, setCourse] = useState<any>(null)
    const [sections, setSections] = useState<CourseSection[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedSections, setExpandedSections] = useState<number[]>([0])
    const [activeTab, setActiveTab] = useState("overview")
    const [enrichedInstructors, setEnrichedInstructors] = useState<any[]>([])
    const [isFavorite, setIsFavorite] = useState(false)
    const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
    const [wishlistEntry, setWishlistEntry] = useState<any>(null)
    const [userRating, setUserRating] = useState<number | null>(null)
    const [userComment, setUserComment] = useState<string>("")
    const [hasUserRated, setHasUserRated] = useState(false)
    const [isRatingLoading, setIsRatingLoading] = useState(false)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [previewUrl, setPreviewUrl] = useState("")
    const [isEnrolling, setIsEnrolling] = useState(false)
    const [userEnrollment, setUserEnrollment] = useState<any>(null)
    const [hasPurchase, setHasPurchase] = useState(false)
    const [canEnroll, setCanEnroll] = useState(false)
    const [isAddingToCart, setIsAddingToCart] = useState(false)
    const [courseRating, setCourseRating] = useState<{ averageRating: number; totalReviews: number; ratingDistribution: { [key: number]: number } }>({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    })
    const [reviews, setReviews] = useState<any[]>([])
    const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([])
    const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false)

    useEffect(() => {
        if (courseId) {
            loadCourseData()
        }
    }, [courseId, user, isAuthenticated])

    const loadCourseData = async () => {
        try {
            setIsLoading(true)
            const courseData = await getCourseCourse(courseId)
            if (!courseData) {
                toast.error("Course not found")
                router.push("/courses")
                return
            }

            setCourse(courseData)
            setPreviewUrl(courseData.preview_url || "")

            // Debug logging for free courses
            if (!courseData.is_paid) {
                console.log("[Course Detail] Free course instructors data:", {
                    courseId: courseData.id,
                    instructors: courseData.instructors,
                    instructorsLength: courseData.instructors?.length || 0,
                    owner: (courseData as any).owner
                })
            }

            // Deduplicate instructors by documentId BEFORE enriching (documentId is more reliable than id)
            let uniqueInstructors: any[] = []
            // Check for instructors - be more lenient for free courses
            const instructorsArray = courseData.instructors || []
            const hasInstructors = Array.isArray(instructorsArray) && instructorsArray.length > 0
            if (hasInstructors) {
                const instructorsMap = new Map<string, any>()
                instructorsArray.forEach((instructor: any, index: number) => {
                    // Skip null/undefined instructors
                    if (!instructor) return
                    
                    // For free courses, be more lenient - accept instructors even with minimal data
                    // Prioritize documentId, fallback to id only if documentId is not available
                    const documentId = instructor.documentId || (instructor.id ? String(instructor.id) : null)
                    
                    // Use documentId if available, otherwise use id, or generate a unique key
                    // For free courses, always create a key even if both are missing
                    const key = documentId || (instructor.id ? String(instructor.id) : `instructor-${courseData.id}-${index}`)
                    
                    // Only add instructor if we haven't seen this key before
                    // Allow instructors even if they don't have names (we'll add fallback name later)
                    // For free courses, be more lenient and include instructors even with minimal data
                    if (key && !instructorsMap.has(key)) {
                        instructorsMap.set(key, {
                            id: instructor.id || 0,
                            documentId: instructor.documentId || null,
                            name: instructor.name || "Unknown Instructor",
                            avatar: instructor.avatar || null,
                        })
                    }
                })
                uniqueInstructors = Array.from(instructorsMap.values())
            }

            // Fallback: If no instructors found, try to get instructor from owner or show default
            if (uniqueInstructors.length === 0) {
                try {
                    // Try to get instructor from course owner
                    if ((courseData as any).owner) {
                        const ownerId = typeof (courseData as any).owner === 'object' 
                            ? (courseData as any).owner.id 
                            : (courseData as any).owner
                        
                        if (ownerId) {
                            // Try to find instructor by user ID
                            const { getInstructors } = await import('@/integrations/strapi/instructor')
                            const ownerInstructors = await getInstructors(String(ownerId))
                            if (ownerInstructors && ownerInstructors.length > 0) {
                                uniqueInstructors = ownerInstructors.map(inst => ({
                                    id: inst.id,
                                    documentId: inst.documentId,
                                    name: inst.name,
                                    avatar: inst.avatar,
                                }))
                            }
                        }
                    }
                } catch (error) {
                    console.warn("Could not fetch instructor from owner:", error)
                }

                // Final fallback: Show a default instructor if still no instructors found
                if (uniqueInstructors.length === 0) {
                    // Get first instructor from instructors array if it exists (even if empty name)
                    const instructorsArray = courseData.instructors || []
                    const firstInstructor = instructorsArray[0]
                    if (firstInstructor) {
                        uniqueInstructors = [{
                            id: firstInstructor.id || 0,
                            documentId: firstInstructor.documentId || null,
                            name: firstInstructor.name || "Unknown Instructor",
                            avatar: firstInstructor.avatar || null,
                        }]
                    } else {
                        // Last resort: create a placeholder instructor
                        uniqueInstructors = [{
                            id: 0,
                            documentId: null,
                            name: "Unknown Instructor",
                            avatar: null,
                        }]
                    }
                }
            }

            // Load course materials and contents to collect instructors from course contents
            // This must happen BEFORE enriching instructors so they're included in the count
            const materials = await getCourseMaterials(courseData.id)
            const instructorsFromContents = new Map<string, any>() // Track instructors from course contents
            
            for (const material of materials) {
                const contents = await getCourseContentsForMaterial(material.id)
                
                // Collect instructors from course contents
                for (const content of contents) {
                    if (content.instructor) {
                        try {
                            // Fetch instructor by ID
                            const { getInstructor } = await import('@/integrations/strapi/instructor')
                            const instructor = await getInstructor(content.instructor, false)
                            
                            if (instructor) {
                                // Use documentId as key for deduplication
                                const key = instructor.documentId || String(instructor.id)
                                if (!instructorsFromContents.has(key)) {
                                    instructorsFromContents.set(key, {
                                        id: instructor.id,
                                        documentId: instructor.documentId,
                                        name: instructor.name || "Unknown Instructor",
                                        avatar: instructor.avatar,
                                    })
                                }
                            }
                        } catch (error) {
                            console.warn(`Could not fetch instructor ${content.instructor} from course content:`, error)
                        }
                    }
                }
            }

            // Merge instructors from course contents with course-level instructors BEFORE enrichment
            if (instructorsFromContents.size > 0) {
                const instructorsFromContentsArray = Array.from(instructorsFromContents.values())
                
                // Add to uniqueInstructors if not already present
                const existingKeys = new Set(
                    uniqueInstructors.map(inst => inst.documentId || String(inst.id))
                )
                
                instructorsFromContentsArray.forEach(inst => {
                    const key = inst.documentId || String(inst.id)
                    if (!existingKeys.has(key)) {
                        uniqueInstructors.push(inst)
                        existingKeys.add(key)
                    }
                })
                
                if (process.env.NODE_ENV !== "production") {
                    console.log(`[Course Detail] Found ${instructorsFromContents.size} instructor(s) from course contents, total instructors: ${uniqueInstructors.length}`)
                }
            }

            // Deduplicate uniqueInstructors by documentId before enriching to prevent duplicates
            const deduplicatedInstructorsMap = new Map<string, any>()
            uniqueInstructors.forEach((inst: any) => {
                const key = inst.documentId || String(inst.id || Math.random())
                if (!deduplicatedInstructorsMap.has(key)) {
                    deduplicatedInstructorsMap.set(key, inst)
                }
            })
            const deduplicatedInstructors = Array.from(deduplicatedInstructorsMap.values())
            
            // Enrich unique instructors with avatar URLs (now includes instructors from course contents)
            if (deduplicatedInstructors.length > 0) {
                try {
                    const enriched = await enrichInstructorsWithAvatars(deduplicatedInstructors)
                    // Ensure documentId is preserved in enriched instructors and deduplicate again
                    const enrichedMap = new Map<string, any>()
                    enriched.forEach((inst: any) => {
                        const key = inst.documentId || String(inst.id || Math.random())
                        if (!enrichedMap.has(key)) {
                            const original = deduplicatedInstructors.find((orig: any) => 
                                orig.id === inst.id || orig.documentId === inst.documentId
                            )
                            enrichedMap.set(key, {
                                ...inst,
                                documentId: inst.documentId || original?.documentId || null,
                                name: inst.name || original?.name || "Unknown Instructor"
                            })
                        }
                    })
                    setEnrichedInstructors(Array.from(enrichedMap.values()))
                } catch (error) {
                    console.error("Error enriching instructors:", error)
                    // Fallback to deduplicated original instructors (ensure they have names)
                    const instructorsWithNames = deduplicatedInstructors.map(inst => ({
                        ...inst,
                        name: inst.name || "Unknown Instructor"
                    }))
                    setEnrichedInstructors(instructorsWithNames)
                }
            } else {
                // This should not happen now, but keep as safety net
                setEnrichedInstructors([{
                    id: 0,
                    documentId: null,
                    name: "Unknown Instructor",
                    avatar: null,
                }])
            }

            // Build sections data (materials and contents) for display
            // Note: Instructors from course contents were already collected above
            const sectionsData: CourseSection[] = []
            for (const material of materials) {
                const contents = await getCourseContentsForMaterial(material.id)
                sectionsData.push({ material, contents })
            }

            // Sort by order_index
            sectionsData.sort((a, b) => a.material.order_index - b.material.order_index)
            setSections(sectionsData)

            // Load course rating and reviews
            // Use rating_counts from course data (auto-computed in Strapi) for star-based ratings (1-5)
            const ratingData = await calculateCourseRating(courseData.id)
            // rating_counts represents the total number of ratings with stars (1-5), calculated in Strapi
            const ratingCounts = courseData.rating_counts || 0
            setCourseRating({
                ...ratingData,
                totalReviews: ratingCounts, // Use rating_counts for star-based rating count (total ratings with stars)
            })
            
            const allReviews = await getCourseReviewers(courseData.id)
            setReviews(allReviews)
            
            // Load enrollments for this course
            try {
                const courseEnrollments = await getCourseEnrollments(undefined, courseData.id)
                setEnrollments(courseEnrollments)
            } catch (error) {
                console.warn("Failed to load enrollments:", error)
            }

            // Check user enrollment and purchase if authenticated
            if (isAuthenticated && user?.id) {
                // Check wishlist (favorite)
                const wishlists = await getUserWishlists(user.id)
                const wishlistItem = wishlists.find(w => w.courseId === courseData.id)
                setIsFavorite(!!wishlistItem)
                setWishlistEntry(wishlistItem || null)

                // Check user rating
                const userReview = await getUserCourseReview(user.id, courseData.id)
                if (userReview) {
                    setUserRating(userReview.rating_stars)
                    setUserComment(userReview.description || "")
                    setHasUserRated(true)
                }

                // Check enrollment
                const enrollment = await checkUserEnrollment(user.id, courseData.id)
                setUserEnrollment(enrollment)

                if (courseData.is_paid) {
                    const purchases = await getPurchaseTransactions(user.id.toString())
                    const coursePurchase = purchases.find(
                        (p) => p.course_course && String(p.course_course) === String(courseData.id) && p.state === 'completed'
                    )
                    setHasPurchase(!!coursePurchase)
                    setCanEnroll(!!coursePurchase)
                } else {
                    // Free course - check enrollment limit
                    const enrollmentLimit = courseData.enrollment_limit || 0
                    const enrollmentCount = courseData.enrollment_count || 0
                    if (enrollmentLimit > 0 && enrollmentCount >= enrollmentLimit) {
                        setCanEnroll(false)
                    } else {
                        setCanEnroll(true)
                    }
                }
            }
        } catch (error: any) {
            console.error("Error loading course:", error)
            toast.error("Failed to load course details")
        } finally {
            setIsLoading(false)
        }
    }

    const toggleSection = (index: number) => {
        setExpandedSections((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
    }

    const handleFavoriteToggle = async () => {
        if (!isAuthenticated || !user?.id) {
            toast.error("Please login to add to favorites")
            router.push("/auth/login")
            return
        }

        if (!course) return

        try {
            setIsFavoriteLoading(true)
            if (isFavorite && wishlistEntry) {
                await deleteUserWishlist(wishlistEntry.id)
                setIsFavorite(false)
                setWishlistEntry(null)
                toast.success("Removed from favorites")
            } else {
                const newEntry = await createUserWishlist(user.id, course.id)
                setIsFavorite(true)
                setWishlistEntry(newEntry)
                toast.success("Added to favorites")
            }
        } catch (error: any) {
            console.error("Error toggling favorite:", error)
            toast.error(error?.message || "Failed to update favorites")
        } finally {
            setIsFavoriteLoading(false)
        }
    }

    const handleEnroll = async () => {
        if (!isAuthenticated || !user?.id) {
            toast.error("Please login to enroll in this course")
            router.push("/auth/login")
            return
        }

        if (!course) return

        // Check enrollment limit for free courses
        if (!course.is_paid) {
            const enrollmentLimit = course.enrollment_limit || 0
            const enrollmentCount = course.enrollment_count || 0
            if (enrollmentLimit > 0 && enrollmentCount >= enrollmentLimit) {
                toast.error("This course has reached its enrollment limit")
                return
            }
        }

        // Check if user already enrolled
        if (userEnrollment) {
            toast.info("You are already enrolled in this course")
            router.push(`/courses/${courseId}/study`)
            return
        }

        // For paid courses, check purchase
        if (course.is_paid && !hasPurchase) {
            toast.error("Please purchase this course first")
            router.push(`/checkout?course=${courseId}`)
            return
        }

        try {
            setIsEnrolling(true)
            // Double-check enrollment doesn't exist before creating
            const existingEnrollment = await checkUserEnrollment(user.id, courseId)
            if (existingEnrollment) {
                toast.info("You are already enrolled in this course")
                router.push(`/courses/${courseId}/study`)
                return
            }
            
            await createCourseEnrollment({
                user: user.id,
                course_course: courseId, // Use courseId (documentId) instead of course.id
                enrolled_via: course.is_paid ? 'purchase' : 'free',
            })
            
            // Update enrollment count immediately for dynamic display (optimistic update)
            setCourse((prevCourse: any) => {
                if (!prevCourse) return prevCourse
                return {
                    ...prevCourse,
                    enrollment_count: (prevCourse.enrollment_count || 0) + 1
                }
            })
            
            // Update user enrollment status immediately
            const enrollment = await checkUserEnrollment(user.id, course.id)
            setUserEnrollment(enrollment)
            
            // Refresh course data in background to get accurate enrollment count from server
            // This ensures the count is accurate even if multiple users enroll simultaneously
            getCourseCourse(courseId).then((updatedCourse) => {
                if (updatedCourse) {
                    setCourse(updatedCourse)
                }
            }).catch((error) => {
                console.warn("Failed to refresh course data after enrollment:", error)
                // Don't show error to user, optimistic update is already applied
            })
            
            toast.success("Successfully enrolled in course!")
            // Navigate to study page to start learning
            router.push(`/courses/${courseId}/study`)
        } catch (error: any) {
            console.error("Error enrolling:", error)
            toast.error(error?.message || "Failed to enroll in course")
        } finally {
            setIsEnrolling(false)
        }
    }

    const handleRatingSubmit = async (rating: number, comment: string) => {
        if (!isAuthenticated || !user?.id) {
            toast.error("Please login to rate this course")
            router.push("/auth/login")
            return
        }

        if (hasUserRated) {
            toast.error("You have already rated this course")
            return
        }

        if (!course) return

        try {
        setIsRatingLoading(true)
            
            // Use user.id (which should be numeric) - createCourseReview will resolve documentId
            const reviewResult = await createCourseReview({
                user: user.id,
                course_course: course.id,
                rating_stars: rating,
                description: comment,
            })
            
            if (!reviewResult) {
                throw new Error("Failed to create review. Please try again.")
            }
            
        setUserRating(rating)
        setUserComment(comment)
        setHasUserRated(true)
            
            // Reload rating data and reviews with a small delay to ensure Strapi has processed the new review
            // This ensures the new review appears in the list immediately
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // Fetch updated reviews and rating data - use Promise.all for parallel fetching
            // Also refresh course data to get updated rating_counts
            const [ratingData, allReviews, userReview, updatedCourseData] = await Promise.all([
                calculateCourseRating(course.id),
                getCourseReviewers(course.id),
                getUserCourseReview(user.id, course.id).catch(() => null), // Don't fail if this errors
                getCourseCourse(course.id).catch(() => null) // Get updated course data with rating_counts
            ])
            
            // Use rating_counts from updated course data (auto-computed in Strapi)
            // rating_counts represents the total number of ratings with stars (1-5), calculated in Strapi
            const ratingCounts = updatedCourseData?.rating_counts || course.rating_counts || ratingData.totalReviews
            setCourseRating({
                ...ratingData,
                totalReviews: ratingCounts, // Use rating_counts for star-based rating count (total ratings with stars)
            })
            setReviews(allReviews)
            
            // Update course data if we got it
            if (updatedCourseData) {
                setCourse(updatedCourseData)
            }
            
            // Update user's review status if we got it
            if (userReview) {
                setUserRating(userReview.rating_stars)
                setUserComment(userReview.description || "")
                setHasUserRated(true)
            }
            
            toast.success("Thank you for your rating!")
        } catch (error: any) {
            console.error("Error submitting rating:", error)
            toast.error(error?.message || "Failed to submit rating")
        } finally {
        setIsRatingLoading(false)
    }
    }

    const handleUrlChange = (url: string) => {
        setPreviewUrl(url)
    }

    const handleAddToCart = async () => {
        if (!isAuthenticated || !user?.id) {
            toast.error("Please login to add courses to cart")
            router.push("/auth/login")
            return
        }

        if (!course) return

        // Check if course is already purchased
        try {
            const { checkUserPurchasedCourse } = await import('@/integrations/strapi/purchaseTransaction')
            const courseId = course.documentId || course.id
            const isPurchased = await checkUserPurchasedCourse(user.id.toString(), courseId)
            
            if (isPurchased) {
                toast.error("You have already purchased this course! Check your enrolled courses.")
                router.push(`/courses/${courseId}/study`)
                return
            }
        } catch (error) {
            console.error("Error checking if course is purchased:", error)
            // Continue with cart check if purchase check fails
        }

        // Check if already in cart - use documentId for reliable comparison
        const courseInCart = course.documentId 
            ? isInCartByDocumentId(course.documentId)
            : isInCart(course.id)
        
        if (courseInCart) {
            toast.info("This course is already in your cart")
            return
        }

        try {
            setIsAddingToCart(true)
            await addToCart({
                id: course.id,
                title: course.name,
                description: course.description || "",
                image: course.preview_url || "",
                priceValue: priceInfo.current,
                price: `${course.currency?.code || "$"}${priceInfo.current.toFixed(2)}`,
                educator: course.instructors?.[0]?.name || "Unknown Instructor",
            })
        } catch (error: any) {
            console.error("Error adding to cart:", error)
            toast.error(error?.message || "Failed to add to cart")
        } finally {
            setIsAddingToCart(false)
        }
    }

    const calculateTotalDuration = () => {
        let totalMinutes = 0
        sections.forEach((section) => {
            section.contents.forEach((content) => {
                totalMinutes += content.estimated_minutes || 0
            })
        })
        return totalMinutes
    }

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes}m`
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }

    const getContentTypeIcon = (type: string | null | undefined) => {
        if (!type) return Play
        const normalizedType = type.toLowerCase()
        if (normalizedType.includes('video')) return Video
        if (normalizedType.includes('audio')) return Music
        if (normalizedType.includes('document') || normalizedType.includes('pdf')) return FileText
        if (normalizedType.includes('image')) return Image
        if (normalizedType.includes('article')) return BookOpen
        if (normalizedType.includes('certificate')) return Award
        if (normalizedType.includes('url') || normalizedType.includes('link')) return LinkIcon
        return File
    }

    const getContentTypeColor = (type: string | null | undefined) => {
        if (!type) return "from-blue-500 to-blue-600"
        const normalizedType = type.toLowerCase()
        if (normalizedType.includes('video')) return "from-red-500 to-red-600"
        if (normalizedType.includes('audio')) return "from-purple-500 to-purple-600"
        if (normalizedType.includes('document') || normalizedType.includes('pdf')) return "from-orange-500 to-orange-600"
        if (normalizedType.includes('image')) return "from-green-500 to-green-600"
        if (normalizedType.includes('article')) return "from-indigo-500 to-indigo-600"
        if (normalizedType.includes('certificate')) return "from-yellow-500 to-yellow-600"
        if (normalizedType.includes('url') || normalizedType.includes('link')) return "from-cyan-500 to-cyan-600"
        return "from-gray-500 to-gray-600"
    }

    const calculatePrice = () => {
        if (!course) return { current: 0, original: 0, discount: null }
        
        const originalPrice = course.Price || 0
        let currentPrice = originalPrice
        let discount = null

        if (course.discount_type === "percentage" && course.discount_percentage) {
            currentPrice = originalPrice * (1 - course.discount_percentage / 100)
            discount = `${course.discount_percentage}% off`
        } else if (course.discount_type === "fix_price" && course.discount_fix_price) {
            currentPrice = course.discount_fix_price
            discount = `$${(originalPrice - currentPrice).toFixed(2)} off`
        }

        return { current: currentPrice, original: originalPrice, discount }
    }

    if (isLoading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            <HeaderUltra />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
                <HeaderUltra />
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Course not found</h1>
                        <Button onClick={() => router.push("/courses")}>Back to Courses</Button>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    const priceInfo = calculatePrice()
    const totalDuration = calculateTotalDuration()
    const totalLectures = sections.reduce((sum, section) => sum + section.contents.length, 0)
    const enrollmentLimit = course.enrollment_limit || 0
    const enrollmentCount = course.enrollment_count || 0
    const isEnrollmentFull = enrollmentLimit > 0 && enrollmentCount >= enrollmentLimit
    const showEnrollButton = !userEnrollment && (course.is_paid ? hasPurchase : canEnroll && !isEnrollmentFull)
    // Deduplicate instructors by documentId to prevent showing duplicates (documentId is more reliable than id)
    const allInstructors = enrichedInstructors.length > 0 ? enrichedInstructors : (course.instructors || [])
    const instructorsMap = new Map<string, any>()
    allInstructors.forEach((instructor: any) => {
        // Prioritize documentId, fallback to id only if documentId is not available
        const documentId = instructor.documentId || (instructor.id ? String(instructor.id) : null)
        // Only add instructor if we have a valid identifier and haven't seen it before
        if (documentId && documentId !== '' && !instructorsMap.has(documentId)) {
            instructorsMap.set(documentId, instructor)
        }
    })
    const instructors = Array.from(instructorsMap.values())
    const courseInCart = course.documentId 
        ? isInCartByDocumentId(course.documentId)
        : isInCart(course.id)

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            <HeaderUltra />
            
            {/* Hero Section - Full Width */}
            <div className="relative w-full overflow-hidden bg-gradient-to-br from-background via-background to-accent/5">
                {/* Subtle Background Pattern */}
                <div 
                    className="absolute inset-0 opacity-30 dark:opacity-20"
                    style={{
                        backgroundImage: `
                            radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 60%),
                            radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.05) 0%, transparent 60%),
                            radial-gradient(circle at 50% 30%, rgba(236, 72, 153, 0.05) 0%, transparent 50%)
                        `,
                    }}
                />
                
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <Breadcrumbs size="lg" separator={<ChevronRight className="w-4 h-4" />}>
                        <BreadcrumbItem href="/">Home</BreadcrumbItem>
                        <BreadcrumbItem href="/courses">Courses</BreadcrumbItem>
                            <BreadcrumbItem>{course.name}</BreadcrumbItem>
                    </Breadcrumbs>
                </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left: Course Preview & Info */}
                        <div className="lg:col-span-8 space-y-6">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-4"
                            >
                                {/* Course Title & Badges */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight mb-4">
                                            {course.name}
                            </h1>
                                        {course.course_badges && course.course_badges.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {course.course_badges.map((badge: any) => (
                                                    <Badge key={badge.id} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                                                        <Award className="w-3 h-3 mr-1" />
                                                        {badge.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Course Stats Row */}
                                <div className="flex flex-wrap items-center gap-6 text-sm">
                                    {(courseRating.totalReviews > 0 || (course.rating_counts && course.rating_counts > 0) || reviews.length > 0) && (
                                        <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                                    <Star 
                                                        key={i} 
                                                        className={cn(
                                                            "w-4 h-4",
                                                            i < Math.floor(courseRating.averageRating) 
                                                                ? "fill-yellow-400 text-yellow-400" 
                                                                : "text-gray-300"
                                                        )} 
                                                    />
                                        ))}
                                    </div>
                                            <span className="font-semibold">{courseRating.averageRating.toFixed(1)}</span>
                                            {/* Use rating_counts for star-based rating display (total ratings with stars) */}
                                            <span className="text-muted-foreground">
                                                ({(() => {
                                                    const strapiCount = course.rating_counts ?? 0;
                                                    const stateCount = courseRating.totalReviews ?? 0;
                                                    const count = strapiCount || stateCount || reviews.length;
                                                    return count;
                                                })()} {(() => {
                                                    const strapiCount = course.rating_counts ?? 0;
                                                    const stateCount = courseRating.totalReviews ?? 0;
                                                    const count = strapiCount || stateCount || reviews.length;
                                                    return count === 1 ? 'rating' : 'ratings';
                                                })()})
                                            </span>
                                </div>
                                    )}
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="w-4 h-4" />
                                        <span>{enrollmentCount} enrolled</span>
                                </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        <span>{formatDuration(totalDuration)}</span>
                            </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <BookOpen className="w-4 h-4" />
                                        <span>{totalLectures} lectures</span>
                                    </div>
                                    {course.course_level && (
                                        <Badge variant="outline">{course.course_level.name}</Badge>
                                    )}
                                </div>

                                {/* Course Preview Image/Video - Dynamic Preview */}
                                {(course.preview_url || (course.course_preview && getCoursePreviewUrl(course.course_preview))) && (
                                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 group">
                                        <div className="aspect-video relative">
                                            {/* Use dynamic preview URL from course_preview or fallback to preview_url */}
                                            <img
                                                src={course.course_preview && getCoursePreviewUrl(course.course_preview) 
                                                    ? getCoursePreviewUrl(course.course_preview) || course.preview_url || "/placeholder.svg"
                                                    : course.preview_url || "/placeholder.svg"}
                                                alt={course.name}
                                                className="w-full h-full object-cover"
                                            />
                                            {course.preview_available && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        size="lg"
                                                        className="bg-white/95 text-black hover:bg-white shadow-xl"
                                                        onClick={() => {
                                                            const dynamicPreviewUrl = course.course_preview 
                                                                ? getCoursePreviewUrl(course.course_preview) 
                                                                : course.preview_url
                                                            if (dynamicPreviewUrl) {
                                                                setPreviewUrl(dynamicPreviewUrl)
                                                                setIsPreviewOpen(true)
                                                            }
                                                        }}
                                                    >
                                                        <Play className="w-5 h-5 mr-2" />
                                                        Preview Course
                                                    </Button>
                                                </div>
                                            )}
                            </div>
                                        {priceInfo.discount && (
                                            <Badge className="absolute top-4 right-4 bg-red-500 text-white shadow-lg text-sm px-3 py-1">
                                                {priceInfo.discount}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Right: Pricing & Action Card */}
                        <div className="lg:col-span-4">
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }} 
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="sticky top-24"
                            >
                                <Card className="liquid-glass-card border-2 shadow-2xl overflow-hidden">
                                    <CardContent className="p-6 space-y-6">
                                        {/* Pricing */}
                                        <div className="text-center">
                                            {course.is_paid ? (
                                                <div>
                                                    <div className="flex items-center justify-center gap-2 mb-2">
                                                        <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                            {course.currency?.code || "$"}{priceInfo.current.toFixed(2)}
                                                        </span>
                                                        {priceInfo.original > priceInfo.current && (
                                                            <span className="text-2xl text-muted-foreground line-through">
                                                                {course.currency?.code || "$"}{priceInfo.original.toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <span className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Free</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="space-y-3">
                                            {(userEnrollment || (course.is_paid && hasPurchase)) ? (
                                                <Button
                                                    size="lg"
                                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg h-14 text-lg font-semibold"
                                                    onClick={() => router.push(`/courses/${courseId}/study`)}
                                                >
                                                    <Play className="w-6 h-6 mr-2" />
                                                    Start Learning
                                                </Button>
                                            ) : (
                                                <>
                                                    {course.is_paid && !hasPurchase ? (
                                                        <>
                                                            <Button
                                                                size="lg"
                                                                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg h-14 text-lg font-semibold"
                                                                onClick={() => router.push(`/checkout?course=${courseId}`)}
                                                            >
                                                                <ShoppingCart className="w-6 h-6 mr-2" />
                                                                Buy Now
                                                            </Button>
                                                            {!courseInCart && (
                                                                <Button
                                                                    size="lg"
                                                                    variant="ghost"
                                                                    className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white shadow-lg h-12 text-base font-semibold"
                                                                    onClick={handleAddToCart}
                                                                    disabled={isAddingToCart || isCartLoading}
                                                                >
                                                                    {isAddingToCart ? (
                                                                        <>
                                                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                                            Adding...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <ShoppingCart className="w-5 h-5 mr-2" />
                                                                            Add to Cart
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            )}
                                                            {courseInCart && (
                                                                <div className="w-full p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg text-center">
                                                                    <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200">
                                                                        <CheckCircle className="w-5 h-5" />
                                                                        <span className="font-semibold">Already in Cart</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : showEnrollButton ? (
                                                        <Button
                                                            size="lg"
                                                            className={cn(
                                                                "w-full text-white shadow-lg h-14 text-lg font-semibold",
                                                                course.is_paid 
                                                                    ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                                                                    : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                                            )}
                                                            onClick={handleEnroll}
                                                            disabled={isEnrolling}
                                                        >
                                                            {isEnrolling ? (
                                                                <>
                                                                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                                                                    {course.is_paid ? "Enrolling..." : "Starting..."}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {course.is_paid ? (
                                                                        <>
                                                                            <CheckCircle className="w-6 h-6 mr-2" />
                                                                            Enroll Now
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Play className="w-6 h-6 mr-2" />
                                                                            Start Course
                                                                        </>
                                                                    )}
                                                                </>
                                                            )}
                                                        </Button>
                                                    ) : isEnrollmentFull ? (
                                                        <div className="w-full p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg">
                                                            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 mb-2">
                                                                <AlertCircle className="w-5 h-5" />
                                                                <span className="font-semibold">Enrollment Full</span>
                                                            </div>
                                                            <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                                                Limit: {enrollmentLimit} students
                                                            </p>
                                    </div>
                                                    ) : (
                                                        <Button
                                                            size="lg"
                                                            className="w-full bg-muted text-muted-foreground h-14"
                                                            disabled
                                                        >
                                                            <Lock className="w-6 h-6 mr-2" />
                                                            Purchase Required
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                </div>

                                        {/* Favorite & Share */}
                                        <div className="flex gap-3">
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    "flex-1 h-11 transition-all",
                                                    isFavorite 
                                                        ? 'bg-pink-600 text-white hover:bg-pink-700 border-pink-600' 
                                                        : 'hover:bg-accent/20'
                                                )}
                                                onClick={handleFavoriteToggle}
                                                disabled={isFavoriteLoading || !isAuthenticated}
                                            >
                                                {isFavoriteLoading ? (
                                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                ) : (
                                                    <Heart className={cn("w-4 h-4 mr-1", isFavorite && "fill-white")} />
                                                )}
                                                {isFavorite ? "Favorited" : "Favorite"}
                                            </Button>
                                            <CourseActionsDropdown courseId={course.id.toString()} courseTitle={course.name} />
                            </div>

                                        {/* Quick Stats */}
                                        <Separator />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                                <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                                                <div className="text-xs text-muted-foreground">Duration</div>
                                                <div className="font-semibold">{formatDuration(totalDuration)}</div>
                                            </div>
                                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                                <BookOpen className="w-5 h-5 mx-auto mb-1 text-primary" />
                                                <div className="text-xs text-muted-foreground">Lectures</div>
                                                <div className="font-semibold">{totalLectures}</div>
                                            </div>
                                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                                <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                                                <div className="text-xs text-muted-foreground">Students</div>
                                                <div className="font-semibold">{enrollmentCount}</div>
                                            </div>
                                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                                <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                                                <div className="text-xs text-muted-foreground">Lecturers</div>
                                                <div className="font-semibold">{instructors.length}</div>
                                            </div>
                                            <div className="text-center p-3 rounded-lg bg-muted/50">
                                                <Globe className="w-5 h-5 mx-auto mb-1 text-primary" />
                                                <div className="text-xs text-muted-foreground">Language</div>
                                                <div className="font-semibold">Not set</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - Tabbed Interface */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5 h-auto p-1.5 bg-muted/50 rounded-xl shadow-inner mb-8">
                            <TabsTrigger
                                value="overview"
                                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg rounded-lg transition-all duration-200 font-semibold py-3"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Overview
                            </TabsTrigger>
                            <TabsTrigger
                                value="curriculum"
                                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg rounded-lg transition-all duration-200 font-semibold py-3"
                            >
                                <BookOpen className="w-4 h-4 mr-2" />
                                Contents
                            </TabsTrigger>
                            <TabsTrigger
                                value="instructors"
                                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg rounded-lg transition-all duration-200 font-semibold py-3"
                            >
                                <GraduationCap className="w-4 h-4 mr-2" />
                                Instructors
                            </TabsTrigger>
                            <TabsTrigger
                                value="reviews"
                                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg rounded-lg transition-all duration-200 font-semibold py-3"
                            >
                                <Star className="w-4 h-4 mr-2" />
                                Reviews ({(() => {
                                    const strapiCount = course.rating_counts ?? 0;
                                    const stateCount = courseRating.totalReviews ?? 0;
                                    const count = strapiCount || stateCount || reviews.length;
                                    return count;
                                })()} {(() => {
                                    const strapiCount = course.rating_counts ?? 0;
                                    const stateCount = courseRating.totalReviews ?? 0;
                                    const count = strapiCount || stateCount || reviews.length;
                                    return count === 1 ? 'rating' : 'ratings';
                                })()})
                            </TabsTrigger>
                            <TabsTrigger
                                value="enrollments"
                                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg rounded-lg transition-all duration-200 font-semibold py-3"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Enrollments ({course.enrollment_count || 0}{course.enrollment_limit ? ` / ${course.enrollment_limit}` : ''})
                            </TabsTrigger>
                            <TabsTrigger
                                value="stats"
                                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg rounded-lg transition-all duration-200 font-semibold py-3"
                            >
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Stats
                            </TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="mt-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Course Description */}
                                {course.description && (
                                    <Card className="liquid-glass-card border-2 shadow-xl">
                                        <CardHeader>
                                            <CardTitle className="text-2xl flex items-center gap-2">
                                                <Sparkles className="w-6 h-6 text-primary" />
                                                About This Course
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div 
                                                className="text-muted-foreground leading-relaxed prose prose-lg max-w-none"
                                                dangerouslySetInnerHTML={{ __html: course.description }}
                                            />
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Course Categories & Tags */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {course.course_categories && course.course_categories.length > 0 && (
                                        <Card className="liquid-glass-card border-2 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                                    <Tag className="w-5 h-5 text-primary" />
                                                    Categories
                                    </CardTitle>
                                </CardHeader>
                                            <CardContent>
                                                <div className="flex flex-wrap gap-2">
                                                    {course.course_categories.map((cat: any) => (
                                                        <Badge key={cat.id} variant="secondary" className="text-sm px-3 py-1">
                                                            {cat.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                    {course.course_tages && course.course_tages.length > 0 && (
                                        <Card className="liquid-glass-card border-2 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                                    <Tag className="w-5 h-5 text-primary" />
                                                    Tags
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex flex-wrap gap-2">
                                                    {course.course_tages.map((tag: any) => (
                                                        <Badge key={tag.id} variant="outline" className="text-sm px-3 py-1">
                                                            {tag.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </motion.div>
                        </TabsContent>

                        {/* Contents Tab */}
                        <TabsContent value="curriculum" className="mt-6 pb-16 md:pb-24 lg:pb-32">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {sections.length > 0 ? (
                                    <div className="relative">
                                        <ContentsCarousel sections={sections} />
                                    </div>
                                ) : (
                                    <div className="liquid-glass-card border-2 shadow-xl rounded-2xl p-12 text-center">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", duration: 0.5 }}
                                        >
                                            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                            <p className="text-muted-foreground text-lg">No contents available yet</p>
                                        </motion.div>
                                    </div>
                                )}
                            </motion.div>
                        </TabsContent>

                        {/* Instructors Tab */}
                        <TabsContent value="instructors" className="mt-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {instructors.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {instructors.map((instructor: any) => {
                                            // Use enriched avatarUrl if available, otherwise fallback to getAvatarUrl
                                            const avatarUrl = instructor.avatarUrl || getAvatarUrl(instructor.avatar)
                                            // Use documentId for key since it's more reliable than id
                                            const key = instructor.documentId || String(instructor.id || Math.random())
                                            return (
                                                <Card key={key} className="liquid-glass-card border-2 shadow-xl hover:shadow-2xl transition-all">
                                                    <CardContent className="p-6">
                                                        <div className="flex flex-col items-center text-center space-y-4">
                                                            <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                                                                <AvatarImage src={avatarUrl || undefined} />
                                                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl font-bold">
                                                                    {instructor.name?.[0]?.toUpperCase() || "I"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <h3 className="text-xl font-bold mb-1">{instructor.name}</h3>
                                                                <p className="text-sm text-muted-foreground">Course Instructor</p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <Card className="liquid-glass-card border-2 shadow-xl">
                                        <CardContent className="p-12 text-center">
                                            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                            <p className="text-muted-foreground">No instructors listed</p>
                                        </CardContent>
                                    </Card>
                                )}
                        </motion.div>
                        </TabsContent>

                        {/* Reviews Tab */}
                        <TabsContent value="reviews" className="mt-6 pb-16 md:pb-24 lg:pb-32">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <Card className="liquid-glass-card border-2 shadow-xl">
                                    <CardHeader>
                                        <CardTitle className="text-2xl flex items-center gap-2">
                                            <Star className="w-6 h-6 text-primary fill-primary" />
                                            Course Ratings
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="text-center">
                                                <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                    {courseRating.averageRating.toFixed(1)}
                                                </div>
                                                <div className="flex items-center justify-center gap-1 mb-2">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={cn(
                                                                "w-6 h-6",
                                                                i < Math.floor(courseRating.averageRating)
                                                                    ? "fill-yellow-400 text-yellow-400"
                                                                    : "text-gray-300"
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                                {/* Use rating_counts for star-based rating count (total ratings with stars 1-5) */}
                                                <p className="text-muted-foreground">
                                                    {(() => {
                                                        const strapiCount = course.rating_counts ?? 0;
                                                        const stateCount = courseRating.totalReviews ?? 0;
                                                        const count = strapiCount || stateCount || reviews.length;
                                                        return count;
                                                    })()} {(() => {
                                                        const strapiCount = course.rating_counts ?? 0;
                                                        const stateCount = courseRating.totalReviews ?? 0;
                                                        const count = strapiCount || stateCount || reviews.length;
                                                        return count === 1 ? 'rating' : 'ratings';
                                                    })()}
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                {[5, 4, 3, 2, 1].map((rating) => {
                                                    const count = courseRating.ratingDistribution[rating] || 0
                                                    // Use rating_counts for star-based rating calculations (total number of ratings with stars 1-5)
                                                    // This is the total count of all ratings (1-5 stars) from Strapi
                                                    const totalRatingCounts = course.rating_counts ?? courseRating.totalReviews
                                                    const percentage = totalRatingCounts > 0 ? (count / totalRatingCounts) * 100 : 0
                                                    return (
                                                        <div key={rating} className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1 w-16">
                                                                <span className="text-sm font-semibold">{rating}</span>
                                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                            </div>
                                                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* User Rating Form - Allow enrolled users to rate */}
                                {isAuthenticated && user && (userEnrollment || hasPurchase) && !hasUserRated && (
                                    <Card className="liquid-glass-card border-2 shadow-xl">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Star className="w-5 h-5 text-yellow-500" />
                                                Rate This Course
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <CourseRatingForm
                                                courseId={course.id.toString()}
                                                initialRating={userRating}
                                                initialComment={userComment}
                                                hasRated={hasUserRated}
                                                onSubmit={handleRatingSubmit}
                                                isLoading={isRatingLoading}
                                            />
                                        </CardContent>
                                    </Card>
                                    )}

                                    {/* Slideable Reviews Carousel - Like App Store Ratings */}
                                    {reviews.length > 0 ? (
                                        <div className="relative">
                                            <ReviewsCarousel
                                                reviews={reviews}
                                                currentUser={user}
                                                isAuthenticated={isAuthenticated}
                                            />
                                        </div>
                                    ) : (
                                        <Card className="liquid-glass-card border-2 shadow-xl">
                                            <CardContent className="p-12 text-center">
                                                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                                <p className="text-muted-foreground mb-2">No reviews yet</p>
                                                <p className="text-sm text-muted-foreground">Be the first to review this course!</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </motion.div>
                            </TabsContent>

                            {/* Enrollments Tab */}
                            <TabsContent value="enrollments" className="mt-6 pb-16 md:pb-24 lg:pb-32">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <Card className="liquid-glass-card border-2 shadow-xl">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Users className="w-5 h-5 text-primary" />
                                                Course Enrollments
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {/* Enrollment Limit Info */}
                                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Users className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Enrollment Limit</p>
                                                        <p className="text-2xl font-bold">
                                                            {course.enrollment_count || 0}
                                                            {course.enrollment_limit ? ` / ${course.enrollment_limit}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                {course.enrollment_limit && (
                                                    <div className="text-right">
                                                        <p className="text-sm text-muted-foreground">Status</p>
                                                        <Badge 
                                                            variant={course.enrollment_count >= course.enrollment_limit ? "destructive" : "default"}
                                                            className="mt-1"
                                                        >
                                                            {course.enrollment_count >= course.enrollment_limit ? "Full" : "Available"}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Enrolled Users List */}
                                            {isLoadingEnrollments ? (
                                                <div className="flex items-center justify-center py-12">
                                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                                </div>
                                            ) : enrollments.length > 0 ? (
                                                <div className="space-y-3">
                                                    <h3 className="text-lg font-semibold">Enrolled Students ({enrollments.length})</h3>
                                                    <div className="grid gap-3">
                                                        {enrollments.map((enrollment: any) => {
                                                            const userInfo = enrollment.userDetails || null
                                                            return (
                                                                <Card key={enrollment.id} className="border border-slate-200 dark:border-slate-700">
                                                                    <CardContent className="p-4">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-3">
                                                                                {userInfo ? (
                                                                                    <Avatar className="w-10 h-10">
                                                                                        <AvatarImage src={getAvatarUrl(userInfo.avatar)} />
                                                                                        <AvatarFallback>
                                                                                            {userInfo.full_name?.split(" ").map((n: string) => n[0]).join("") || userInfo.username?.[0] || "U"}
                                                                                        </AvatarFallback>
                                                                                    </Avatar>
                                                                                ) : (
                                                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                                        <Users className="w-5 h-5 text-primary" />
                                                                                    </div>
                                                                                )}
                                                                                <div>
                                                                                    <p className="font-medium">
                                                                                        {userInfo?.full_name || userInfo?.username || `User ${enrollment.user}`}
                                                                                    </p>
                                                                                    <div className="flex items-center gap-4 mt-1">
                                                                                        <Badge variant="outline" className="text-xs">
                                                                                            {enrollment.enroll_status}
                                                                                        </Badge>
                                                                                        <span className="text-xs text-muted-foreground">
                                                                                            Progress: {enrollment.progress_percent}%
                                                                                        </span>
                                                                                        {enrollment.started_at && (
                                                                                            <span className="text-xs text-muted-foreground">
                                                                                                Started: {new Date(enrollment.started_at).toLocaleDateString()}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    {enrollment.enrolled_via}
                                                                                </Badge>
                                                                            </div>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-12">
                                                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                                    <p className="text-muted-foreground mb-2">No enrollments yet</p>
                                                    <p className="text-sm text-muted-foreground">Students will appear here once they enroll in this course.</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </TabsContent>
                    </Tabs>
                </motion.div>
            </div>

            <Footer />
            
            {course.preview_available && (
                <CoursePreviewModal
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    courseId={course.id.toString()}
                    courseTitle={course.name}
                    previewUrl={previewUrl || (course.course_preview ? getCoursePreviewUrl(course.course_preview) : course.preview_url) || ""}
                    fileType={course.course_preview?.types || "video"}
                    isCourseRestricted={course.is_paid || !course.is_paid}
                    onUrlChange={handleUrlChange}
                />
            )}
        </div>
    )
}

// Reviews Carousel Component - Slideable like App Store
function ReviewsCarousel({ 
    reviews, 
    currentUser, 
    isAuthenticated 
}: { 
    reviews: any[]
    currentUser: any
    isAuthenticated: boolean
}) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ 
        align: 'start',
        slidesToScroll: 1,
        containScroll: 'trimSnaps',
        dragFree: true,
    })
    const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
    const [nextBtnDisabled, setNextBtnDisabled] = useState(true)

    const onSelect = useCallback((emblaApi: any) => {
        setPrevBtnDisabled(!emblaApi.canScrollPrev())
        setNextBtnDisabled(!emblaApi.canScrollNext())
    }, [])

    useEffect(() => {
        if (!emblaApi) return

        onSelect(emblaApi)
        emblaApi.on('reInit', onSelect)
        emblaApi.on('select', onSelect)
    }, [emblaApi, onSelect])

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev()
    }, [emblaApi])

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext()
    }, [emblaApi])

    return (
        <div className="relative">
            {/* Navigation Buttons */}
            {reviews.length > 1 && (
                <>
                    <UIButton
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border-2 shadow-lg rounded-full w-10 h-10 p-0",
                            prevBtnDisabled && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={scrollPrev}
                        disabled={prevBtnDisabled}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </UIButton>
                    <UIButton
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border-2 shadow-lg rounded-full w-10 h-10 p-0",
                            nextBtnDisabled && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={scrollNext}
                        disabled={nextBtnDisabled}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </UIButton>
                </>
            )}

            <div className="overflow-hidden px-12 py-12" ref={emblaRef}>
                <div className="flex gap-4">
                    {reviews.map((review) => {
                        const userInfo = typeof review.user === 'object' && review.user !== null
                            ? review.user as any
                            : { name: 'Anonymous', username: 'Anonymous', avatar: null }
                        
                        const userName = userInfo.name || userInfo.username || 'Anonymous'
                        const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
                        const reviewDate = review.createdAt 
                            ? new Date(review.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                            })
                            : null
                        
                        // Check if this is the current user's review
                        const isCurrentUserReview = isAuthenticated && currentUser && 
                            (userInfo.id === Number(currentUser.id) || userInfo.id === currentUser.id || 
                             userInfo.documentId === currentUser.documentId)
                        
                        // Check if review is published (has publishedAt) or draft
                        const isPublished = review.isPublished !== false && !!review.publishedAt
                        
                        return (
                            <div 
                                key={review.id || review.documentId || `review-${Math.random()}`}
                                className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_35%] min-w-0"
                            >
                                <Card 
                                    className={cn(
                                        "liquid-glass-card border-2 shadow-lg h-full",
                                        isCurrentUserReview && "border-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-900/10",
                                        !isPublished && "opacity-75 border-orange-500/30"
                                    )}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex flex-col gap-4">
                                            {/* User Info and Rating */}
                                            <div className="flex items-start gap-3">
                                                <ForumUserAvatar 
                                                    user={userInfo}
                                                    size="lg"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className="font-semibold text-base truncate">
                                                            {userName}
                                                        </span>
                                                        {isCurrentUserReview && (
                                                            <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700">
                                                                Your Review
                                                            </Badge>
                                                        )}
                                                        {!isPublished && (
                                                            <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700">
                                                                Draft
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 mb-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star 
                                                                key={i} 
                                                                className={cn(
                                                                    "w-4 h-4",
                                                                    i < review.rating_stars 
                                                                        ? "fill-yellow-400 text-yellow-400" 
                                                                        : "text-gray-300"
                                                                )} 
                                                            />
                                                        ))}
                                                        <span className="ml-1 text-sm font-semibold text-muted-foreground">
                                                            {review.rating_stars}.0
                                                        </span>
                                                    </div>
                                                    {reviewDate && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {reviewDate}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Review Description */}
                                            {review.description && (
                                                <p className="text-muted-foreground leading-relaxed line-clamp-4">
                                                    {review.description}
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
