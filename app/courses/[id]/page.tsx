"use client"

import React, { useState, useEffect } from "react"
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
} from "lucide-react"
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import { Footer } from "@/components/ui/footers/footer"
import { Button } from "@heroui/react"
import Link from "next/link"
import { CourseRatingForm } from "@/components/courses/CourseRatingForm"
import dynamic from "next/dynamic"
import { CoursePreviewModal } from "@/components/courses/CoursePreviewModal"
import { getCourseCourse } from "@/integrations/strapi/courseCourse"
import { getCourseMaterials, getCourseContentsForMaterial } from "@/integrations/strapi/courseMaterial"
import { checkUserEnrollment, createCourseEnrollment } from "@/integrations/strapi/courseEnrollment"
import { getPurchaseTransactions } from "@/integrations/strapi/purchaseTransaction"
import { getUserWishlists, createUserWishlist, deleteUserWishlist } from "@/integrations/strapi/userWishlist"
import { getUserCourseReview, createCourseReview, getCourseReviewers, calculateCourseRating } from "@/integrations/strapi/courseReviewer"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/contexts/CartContext"
import { toast } from "sonner"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import { enrichInstructorsWithAvatars } from "@/lib/helpers/instructorAvatarHelper"
import { CourseMaterialEntity, CourseContentEntity } from "@/integrations/strapi/courseMaterial"
import { cn } from "@/utils/utils"

const CourseActionsDropdown = dynamic(() => import("@/components/courses/CourseActionsDropdown").then(mod => mod.CourseActionsDropdown), { ssr: false });

interface CourseSection {
    material: CourseMaterialEntity;
    contents: CourseContentEntity[];
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

            // Deduplicate instructors by documentId BEFORE enriching (documentId is more reliable than id)
            let uniqueInstructors: any[] = []
            if (courseData.instructors && courseData.instructors.length > 0) {
                const instructorsMap = new Map<string, any>()
                courseData.instructors.forEach((instructor: any) => {
                    // Prioritize documentId, fallback to id only if documentId is not available
                    const documentId = instructor.documentId || (instructor.id ? String(instructor.id) : null)
                    // Only add instructor if we have a valid identifier and haven't seen it before
                    if (documentId && documentId !== '' && !instructorsMap.has(documentId)) {
                        instructorsMap.set(documentId, instructor)
                    }
                })
                uniqueInstructors = Array.from(instructorsMap.values())
            }

            // Enrich unique instructors with avatar URLs
            if (uniqueInstructors.length > 0) {
                try {
                    const enriched = await enrichInstructorsWithAvatars(uniqueInstructors)
                    // Ensure documentId is preserved in enriched instructors
                    const enrichedWithDocumentId = enriched.map((inst: any) => {
                        const original = uniqueInstructors.find((orig: any) => 
                            orig.id === inst.id || orig.documentId === inst.documentId
                        )
                        return {
                            ...inst,
                            documentId: inst.documentId || original?.documentId || null
                        }
                    })
                    setEnrichedInstructors(enrichedWithDocumentId)
                } catch (error) {
                    console.error("Error enriching instructors:", error)
                    // Fallback to deduplicated original instructors
                    setEnrichedInstructors(uniqueInstructors)
                }
            } else {
                setEnrichedInstructors([])
            }

            // Load course materials and contents
            const materials = await getCourseMaterials(courseData.id)
            const sectionsData: CourseSection[] = []
            
            for (const material of materials) {
                const contents = await getCourseContentsForMaterial(material.id)
                sectionsData.push({ material, contents })
            }

            // Sort by order_index
            sectionsData.sort((a, b) => a.material.order_index - b.material.order_index)
            setSections(sectionsData)

            // Load course rating and reviews
            const ratingData = await calculateCourseRating(courseData.id)
            setCourseRating(ratingData)
            
            const allReviews = await getCourseReviewers(courseData.id)
            setReviews(allReviews)

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
            router.push(`/courses/${courseId}/learn`)
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
            await createCourseEnrollment({
                user: user.id,
                course_course: course.id,
                enrolled_via: course.is_paid ? 'purchase' : 'free',
            })
            toast.success("Successfully enrolled in course!")
            router.push(`/courses/${courseId}/learn`)
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
            await createCourseReview({
                user: user.id,
                course_course: course.id,
                rating_stars: rating,
                description: comment,
            })
        setUserRating(rating)
        setUserComment(comment)
        setHasUserRated(true)
            
            // Reload rating data and reviews
            const ratingData = await calculateCourseRating(course.id)
            setCourseRating(ratingData)
            const allReviews = await getCourseReviewers(course.id)
            setReviews(allReviews)
            
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
                                    {courseRating.totalReviews > 0 && (
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
                                            <span className="text-muted-foreground">({courseRating.totalReviews})</span>
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

                                {/* Course Preview Image/Video */}
                                {course.preview_url && (
                                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 group">
                                        <div className="aspect-video relative">
                                            <img
                                                src={course.preview_url}
                                                alt={course.name}
                                                className="w-full h-full object-cover"
                                            />
                                            {course.preview_available && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        size="lg"
                                                        className="bg-white/95 text-black hover:bg-white shadow-xl"
                                                        onClick={() => setIsPreviewOpen(true)}
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
                                            {userEnrollment ? (
                                                <Button
                                                    size="lg"
                                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg h-14 text-lg font-semibold"
                                                    onClick={() => router.push(`/courses/${courseId}/learn`)}
                                                >
                                                    <Play className="w-6 h-6 mr-2" />
                                                    Continue Learning
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
                                                                    variant="outline"
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
                                                            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg h-14 text-lg font-semibold"
                                                            onClick={handleEnroll}
                                                            disabled={isEnrolling}
                                                        >
                                                            {isEnrolling ? (
                                                                <>
                                                                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                                                                    Enrolling...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="w-6 h-6 mr-2" />
                                                                    Enroll Now
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
                                                variant="outline"
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
                                                <Globe className="w-5 h-5 mx-auto mb-1 text-primary" />
                                                <div className="text-xs text-muted-foreground">Language</div>
                                                <div className="font-semibold">English</div>
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
                                Curriculum
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
                                Reviews ({courseRating.totalReviews})
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

                                {/* What You'll Learn */}
                                <Card className="liquid-glass-card border-2 shadow-xl">
                                    <CardHeader>
                                        <CardTitle className="text-2xl flex items-center gap-2">
                                            <Trophy className="w-6 h-6 text-primary" />
                                            What You'll Learn
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                "Master the fundamentals and advanced concepts",
                                                "Build real-world projects and applications",
                                                "Get lifetime access to course materials",
                                                "Receive a certificate of completion",
                                                "Learn from industry experts",
                                                "Access to community support"
                                            ].map((item, index) => (
                                                <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

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

                        {/* Curriculum Tab */}
                        <TabsContent value="curriculum" className="mt-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {sections.length > 0 ? (
                                    <div className="space-y-6">
                                        {/* Header Stats */}
                                        <div className="flex flex-wrap items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 border-2 border-border/50">
                                                <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
                                                    <BookOpen className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                    <h2 className="text-2xl font-bold">Course Curriculum</h2>
                                                        <p className="text-sm text-muted-foreground">
                                                        {sections.length} sections • {totalLectures} lectures • {formatDuration(totalDuration)} total
                                                        </p>
                                                    </div>
                                                </div>
                                        </div>

                                        {/* Sections */}
                                        <div className="space-y-3">
                                            <AnimatePresence>
                                                {sections.map((section, index) => {
                                                    const isExpanded = expandedSections.includes(index)
                                                    const sectionDuration = section.contents.reduce((sum, c) => sum + (c.estimated_minutes || 0), 0)
                                                    const ContentIcon = getContentTypeIcon(section.contents[0]?.type)
                                                    
                                                    return (
                                                        <motion.div
                                                            key={section.material.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            className="group"
                                                        >
                                                            <div className="liquid-glass-card border-2 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/50">
                                                                <button
                                                                    onClick={() => toggleSection(index)}
                                                                    className="w-full p-6 text-left hover:bg-muted/20 transition-all duration-200 flex items-center justify-between"
                                                                >
                                                                    <div className="flex items-center gap-5 flex-1">
                                                                        {/* Section Number Badge */}
                                                                        <div className="relative">
                                                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                                                {index + 1}
                                                                            </div>
                                                                            {isExpanded && (
                                                                                <motion.div
                                                                                    initial={{ scale: 0 }}
                                                                                    animate={{ scale: 1 }}
                                                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center"
                                                                                >
                                                                                    <CheckCircle className="w-3 h-3 text-white" />
                                                                                </motion.div>
                                                                            )}
                                                                        </div>
                                                                        
                                                                        {/* Section Info */}
                                                                        <div className="flex-1 min-w-0">
                                                                            <h3 className="font-bold text-lg mb-1.5 group-hover:text-primary transition-colors">
                                                                                {section.material.name}
                                                                            </h3>
                                                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <ContentIcon className="w-4 h-4" />
                                                                                    <span>{section.contents.length} {section.contents.length === 1 ? 'lecture' : 'lectures'}</span>
                                                                                </div>
                                                                                {sectionDuration > 0 && (
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <Clock className="w-4 h-4" />
                                                                                        <span>{formatDuration(sectionDuration)}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Chevron Icon */}
                                                                    <motion.div
                                                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="ml-4 flex-shrink-0"
                                                                    >
                                                                        <ChevronDown className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                                                    </motion.div>
                                            </button>
                                                                
                                                                {/* Expanded Content */}
                                                                <AnimatePresence>
                                                                    {isExpanded && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: "auto", opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            transition={{ duration: 0.3 }}
                                                                            className="overflow-hidden"
                                                                        >
                                                                            <div className="border-t border-border/50 bg-gradient-to-b from-muted/10 to-transparent p-5 space-y-2">
                                                                                {section.contents.map((content, contentIndex) => {
                                                                                    const ContentTypeIcon = getContentTypeIcon(content.type)
                                                                                    const iconColor = getContentTypeColor(content.type)
                                                                                    
                                                                                    return (
                                                                                        <motion.div
                                                                                            key={content.id}
                                                                                            initial={{ opacity: 0, x: -10 }}
                                                                                            animate={{ opacity: 1, x: 0 }}
                                                                                            transition={{ delay: contentIndex * 0.05 }}
                                                                                            className="group/item p-4 rounded-xl border-2 border-border/50 hover:border-primary/50 bg-background/50 hover:bg-background transition-all duration-200 flex items-center gap-4 cursor-pointer hover:shadow-md"
                                                                                        >
                                                                                            {/* Content Icon */}
                                                                                            <div className={cn(
                                                                                                "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shadow-md group-hover/item:scale-110 transition-transform duration-200",
                                                                                                iconColor
                                                                                            )}>
                                                                                                <ContentTypeIcon className="w-6 h-6" />
                                                            </div>
                                                                                            
                                                                                            {/* Content Info */}
                                                                                            <div className="flex-1 min-w-0">
                                                                                                <p className="font-semibold text-base mb-1 group-hover/item:text-primary transition-colors">
                                                                                                    {content.name}
                                                                                                </p>
                                                                                                {content.type && (
                                                                                                    <Badge 
                                                                                                        variant="outline" 
                                                                                                        className="text-xs font-medium border-primary/30 text-primary bg-primary/5"
                                                                                                    >
                                                                                                        {content.type}
                                                                                                    </Badge>
                                                                                                )}
                                                            </div>
                                                                                            
                                                                                            {/* Duration */}
                                                                                            {content.estimated_minutes > 0 && (
                                                                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium px-3 py-1.5 rounded-lg bg-muted/50">
                                                                                                    <Clock className="w-4 h-4" />
                                                                                                    <span>{formatDuration(content.estimated_minutes)}</span>
                                                        </div>
                                                                                            )}
                                                                                        </motion.div>
                                                                                    )
                                                                                })}
                                                </div>
                                                                        </motion.div>
                                            )}
                                                                </AnimatePresence>
                                        </div>
                                                        </motion.div>
                                                    )
                                                })}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                ) : (
                                    <Card className="liquid-glass-card border-2 shadow-xl">
                                        <CardContent className="p-12 text-center">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", duration: 0.5 }}
                                            >
                                                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                                <p className="text-muted-foreground text-lg">No curriculum available yet</p>
                                            </motion.div>
                                </CardContent>
                            </Card>
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
                        <TabsContent value="reviews" className="mt-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Rating Summary */}
                                {courseRating.totalReviews > 0 && (
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
                                                    <p className="text-muted-foreground">{courseRating.totalReviews} {courseRating.totalReviews === 1 ? 'review' : 'reviews'}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    {[5, 4, 3, 2, 1].map((rating) => {
                                                        const count = courseRating.ratingDistribution[rating] || 0
                                                        const percentage = courseRating.totalReviews > 0 ? (count / courseRating.totalReviews) * 100 : 0
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
                                )}

                        {/* User Rating Form */}
                                {userEnrollment && !hasUserRated && (
                                    <Card className="liquid-glass-card border-2 shadow-xl">
                                        <CardHeader>
                                            <CardTitle>Rate This Course</CardTitle>
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

                                {/* Reviews List */}
                                {reviews.length > 0 ? (
                                    <div className="space-y-4">
                                        {reviews.map((review) => (
                                            <Card key={review.id} className="liquid-glass-card border-2 shadow-lg">
                                                <CardContent className="p-6">
                                                    <div className="flex items-start gap-4">
                                                        <Avatar className="w-12 h-12">
                                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                                                {typeof review.user === 'object' ? (review.user as any).name?.[0] || 'U' : 'U'}
                                                            </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="font-semibold">
                                                                    {typeof review.user === 'object' ? (review.user as any).name || 'Anonymous' : 'Anonymous'}
                                                                </span>
                                                        <div className="flex">
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
                                                        </div>
                                                    </div>
                                                            {review.description && (
                                                                <p className="text-muted-foreground">{review.description}</p>
                                                            )}
                                                </div>
                                            </div>
                                                </CardContent>
                                            </Card>
                                    ))}
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

                        {/* Stats Tab */}
                        <TabsContent value="stats" className="mt-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <Card className="liquid-glass-card border-2 shadow-xl">
                                        <CardContent className="p-6 text-center">
                                            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                                            <div className="text-3xl font-bold mb-1">{enrollmentCount}</div>
                                            <div className="text-sm text-muted-foreground">Total Enrollments</div>
                                        </CardContent>
                                    </Card>
                                    <Card className="liquid-glass-card border-2 shadow-xl">
                                        <CardContent className="p-6 text-center">
                                            <BookOpen className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                                            <div className="text-3xl font-bold mb-1">{totalLectures}</div>
                                            <div className="text-sm text-muted-foreground">Total Lectures</div>
                                        </CardContent>
                                    </Card>
                                    <Card className="liquid-glass-card border-2 shadow-xl">
                                        <CardContent className="p-6 text-center">
                                            <Clock className="w-12 h-12 mx-auto mb-4 text-green-500" />
                                            <div className="text-3xl font-bold mb-1">{formatDuration(totalDuration)}</div>
                                            <div className="text-sm text-muted-foreground">Total Duration</div>
                                        </CardContent>
                                    </Card>
                                    <Card className="liquid-glass-card border-2 shadow-xl">
                                        <CardContent className="p-6 text-center">
                                            <Star className="w-12 h-12 mx-auto mb-4 text-yellow-500 fill-yellow-500" />
                                            <div className="text-3xl font-bold mb-1">{courseRating.averageRating.toFixed(1)}</div>
                                            <div className="text-sm text-muted-foreground">Average Rating</div>
                                </CardContent>
                            </Card>
                                </div>
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
                                                previewUrl={previewUrl}
                                                fileType={"video"}
                    isCourseRestricted={course.is_paid || !course.is_paid}
                                                onUrlChange={handleUrlChange}
                                            />
            )}
        </div>
    )
}
