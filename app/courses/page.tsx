"use client"

import type React from "react"
import {useState, useMemo, useEffect, useRef} from "react"
import {useRouter} from "next/navigation"
import {motion} from "framer-motion"
import {Button} from "@heroui/react"
import {Input} from "@/components/ui/input"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {
    Search,
    Filter,
    Star,
    Clock,
    Users,
    ChevronRight,
    Heart,
    BookOpen,
    X,
    Zap,
    ChevronDown,
    ChevronUp,
} from "lucide-react"
import {CourseSkeleton} from "@/components/courses/course-skeleton"
import {CourseLoading} from "@/components/courses/course-loading"
import {CourseCard} from "@/components/courses/CourseCard"
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import {Footer} from "@/components/ui/footers/footer"
import { toast } from "sonner"
import { getCourseCategories, CourseCategory } from "@/integrations/strapi/courseCategory"
import { getCourseLevels, CourseLevel } from "@/integrations/strapi/courseLevel"
import { getSkills, Skill } from "@/integrations/strapi/skill"
import { getCourseBadges, CourseBadge } from "@/integrations/strapi/courseBadge"
import { getPublicCourseCourses, CourseCourse } from "@/integrations/strapi/courseCourse"
import { getInstructors, Instructor } from "@/integrations/strapi/instructor"
import { getCourseTages, CourseTage } from "@/integrations/strapi/courseTage"
import { DraggableFilterModal } from "@/components/courses/DraggableFilterModal"
import { SlideableFilters } from "@/components/courses/SlideableFilters"
import { useAuth } from "@/hooks/use-auth"
import {
    createUserWishlist,
    deleteUserWishlist,
    getUserWishlists,
    mapWishlistToCourseIds,
    UserWishlistEntry,
} from "@/integrations/strapi/userWishlist"
import { UserWishlistModal } from "@/components/courses/UserWishlistModal"

export default function CoursesPage() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const [isSearching, setIsSearching] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategories, setSelectedCategories] = useState<string[]>(["all"])
    const [selectedLevels, setSelectedLevels] = useState<string[]>(["all"])
    const [selectedEducator, setSelectedEducator] = useState("all")
    const [showFavorites, setShowFavorites] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [favorites, setFavorites] = useState<number[]>([])
    const [categories, setCategories] = useState<CourseCategory[]>([])
    const [isLoadingCategories, setIsLoadingCategories] = useState(true)
    const [levels, setLevels] = useState<CourseLevel[]>([])
    const [isLoadingLevels, setIsLoadingLevels] = useState(true)
    const [skills, setSkills] = useState<Skill[]>([])
    const [badges, setBadges] = useState<CourseBadge[]>([])
    const [courseTages, setCourseTages] = useState<CourseTage[]>([])
    const [selectedSkills, setSelectedSkills] = useState<string[]>([])
    const [selectedBadges, setSelectedBadges] = useState<string[]>([])
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [showPaidOnly, setShowPaidOnly] = useState(false)
    const defaultPriceRange: [number, number] = [0, 5000]
    const [priceRange, setPriceRange] = useState<[number, number]>(defaultPriceRange)
    const [instructors, setInstructors] = useState<Instructor[]>([])
    const [coursesData, setCoursesData] = useState<CourseCourse[]>([])
    const [isLoadingCourses, setIsLoadingCourses] = useState(true)
    const initialCoursesToShow = 6
    const coursesToLoadIncrement = 6
    const [coursesToDisplayCount, setCoursesToDisplayCount] = useState(initialCoursesToShow)
    const [hasMore, setHasMore] = useState(true)
    const loadingRef = useRef<HTMLDivElement | null>(null)
    const [wishlistEntries, setWishlistEntries] = useState<UserWishlistEntry[]>([])
    const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false)
    const [isWishlistLoading, setIsWishlistLoading] = useState(false)
    const [isWishlistSyncing, setIsWishlistSyncing] = useState(false)

    // Fetch categories from Strapi
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const cats = await getCourseCategories()
                setCategories(cats)
            } catch (error) {
                console.error("Failed to fetch categories:", error)
            } finally {
                setIsLoadingCategories(false)
            }
        }
        fetchCategories()
    }, [])

    // Fetch course levels from Strapi
    useEffect(() => {
        const fetchLevels = async () => {
            try {
                const levelsData = await getCourseLevels()
                setLevels(levelsData)
            } catch (error) {
                console.error("Failed to fetch course levels:", error)
            } finally {
                setIsLoadingLevels(false)
            }
        }
        fetchLevels()
    }, [])

    // Fetch skills from Strapi
    useEffect(() => {
        const fetchSkills = async () => {
            try {
                const skillsData = await getSkills()
                setSkills(skillsData)
            } catch (error) {
                console.error("Failed to fetch skills:", error)
            }
        }
        fetchSkills()
    }, [])

    // Fetch badges from Strapi
    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const badgesData = await getCourseBadges()
                setBadges(badgesData)
            } catch (error) {
                console.error("Failed to fetch badges:", error)
            }
        }
        fetchBadges()
    }, [])

    // Fetch course tags from Strapi
    useEffect(() => {
        const fetchCourseTages = async () => {
            try {
                const tagsData = await getCourseTages()
                setCourseTages(tagsData)
            } catch (error) {
                console.error("Failed to fetch course tags:", error)
            }
        }
        fetchCourseTages()
    }, [])

    // Fetch instructors from Strapi
    useEffect(() => {
        const fetchInstructors = async () => {
            try {
                const instructorsData = await getInstructors()
                setInstructors(instructorsData)
            } catch (error) {
                console.error("Failed to fetch instructors:", error)
            }
        }
        fetchInstructors()
    }, [])

    // Fetch courses from Strapi
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setIsLoadingCourses(true)
                const coursesData = await getPublicCourseCourses()
                console.log(">>>>>>>>>>>>>>>>>> Get Courses:", JSON.stringify(coursesData))
                // Filter only published courses
                const publishedCourses = coursesData.filter(
                    course => course.course_status === "published" && course.active !== false
                )
                setCoursesData(publishedCourses)
            } catch (error) {
                console.error("Failed to fetch courses:", error)
            } finally {
                setIsLoadingCourses(false)
            }
        }
        fetchCourses()
    }, [])

    // Fetch wishlist for authenticated user
    useEffect(() => {
        if (!user?.id) {
            setWishlistEntries([])
            setFavorites([])
            return
        }

        let isMounted = true
        const loadWishlist = async () => {
            try {
                setIsWishlistLoading(true)
                const entries = await getUserWishlists(user.id)
                if (!isMounted) return
                setWishlistEntries(entries)
                setFavorites(mapWishlistToCourseIds(entries))
            } catch (error) {
                console.error("Failed to fetch user wishlist:", error)
            } finally {
                if (isMounted) {
                    setIsWishlistLoading(false)
                }
            }
        }

        loadWishlist()

        return () => {
            isMounted = false
        }
    }, [user?.id])

    // Transform CourseCourse to CourseCard format
    const courses = useMemo(() => {
        const baseMediaUrl = process.env.NEXT_PUBLIC_STRAPI_URL || ""
        const resolveMediaUrl = (value?: string | null) => {
            if (!value) return "/placeholder.svg"
            if (value.startsWith("http")) return value
            return baseMediaUrl ? `${baseMediaUrl}${value}` : value
        }

        return coursesData.map((course) => {
            const categoryName = course.course_categories?.[0]?.name || "Uncategorized"
            const levelName = course.course_level?.name || "Beginner"
            const primaryInstructor = course.instructors?.[0]
            const instructorName = primaryInstructor?.name || "Unknown Instructor"
            const instructorAvatar = primaryInstructor?.avatar || null
            const tags = course.course_tages?.map(tag => tag.name) || []
            const courseSkills = course.relevant_skills?.map(skill => skill.name) || []
            const courseBadges = course.course_badges?.map(badge => badge.name) || []
            // Also get skill documentIds and badge documentIds for filtering
            const skillDocumentIds = course.relevant_skills?.map(skill => {
                // Find matching skill by name to get documentId
                const matchingSkill = skills.find(s => s.name === skill.name)
                return matchingSkill?.documentId || skill.id.toString()
            }) || []
            const badgeDocumentIds = course.course_badges?.map(badge => {
                // Find matching badge by name to get documentId
                const matchingBadge = badges.find(b => b.name === badge.name)
                return matchingBadge?.documentId || badge.id.toString()
            }) || []
            
            const durationHours = Math.floor(course.duration_minutes / 60)
            const durationMinutes = course.duration_minutes % 60
            const duration = durationHours > 0 
                ? `${durationHours} hour${durationHours > 1 ? 's' : ''}${durationMinutes > 0 ? ` ${durationMinutes} min` : ''}`
                : `${durationMinutes} min`
            
            // Calculate price with currency
            const price = course.Price || 0
            const currencyCode = course.currency?.code || "USD"
            const formattedPrice = `$${price.toFixed(2)}`
            
            // Get thumbnail from course preview - use preview_url which is already extracted by extractPreviewUrl
            // The preview_url field already contains the correct URL based on preview type (image/video/url)
            const thumbnail = resolveMediaUrl(course.preview_url)
            const instructorsList = (course.instructors || []).map((inst, idx) => ({
                id: inst.id?.toString() ?? inst.id ?? `${course.id}-${idx}`,
                name: inst.name || "Instructor",
                avatar: inst.avatar,
            }))
            const companyData = (course as any)?.company
            const companyName = companyData?.name || null
            const companyLogoUrl = companyData?.logoUrl || null
            
            // Get course preview data - preview_url is already extracted by extractPreviewUrl in courseCourse.ts
            // It handles image.url, video.url, or url field based on types
            const previewUrl = course.preview_url
            const previewAvailable = course.preview_available || false
            
            return {
                id: course.id,
                title: course.name,
                description: course.description || "No description available",
                image: thumbnail,
                price: formattedPrice,
                priceValue: price,
                originalPrice: course.discount_type === "percentage" && course.discount_percentage
                    ? `$${(price / (1 - course.discount_percentage / 100)).toFixed(2)}`
                    : formattedPrice,
                rating: 4.5, // Default rating, can be fetched from reviews if available
                students: course.enrollment_count || course.purchase_count || 0,
                duration: duration,
                level: levelName,
                category: categoryName,
                educator: instructorName,
                educatorId: primaryInstructor?.id?.toString() || "0",
                instructorId: primaryInstructor?.id?.toString() || "0",
                instructorAvatar: instructorAvatar,
                tags: tags,
                skills: courseSkills,
                skillDocumentIds: skillDocumentIds,
                badges: courseBadges,
                badgeDocumentIds: badgeDocumentIds,
                company: companyName,
                companyAvatar: companyLogoUrl,
                instructors: instructorsList,
                is_paid: course.is_paid || false,
                trending: course.purchase_count > 100,
                bestseller: course.purchase_count > 500,
                discount: course.discount_type === "percentage" && course.discount_percentage
                    ? `${course.discount_percentage}% off`
                    : undefined,
                lectures: 0, // Will be calculated from course materials
                projects: 0,
                preview_available: course.preview_available || false,
                preview_url: course.preview_url || null,
            }
        })
    }, [coursesData, skills, badges])

    // Use courses from database, fallback to empty array if loading
    const finalCourses = courses.length > 0 ? courses : []

    const levelOptions = useMemo(() => {
        if (levels.length > 0) {
            return [
                { id: "all", name: "All Levels" },
                ...levels.map((level) => ({
                    id: level.name,
                    name: level.name,
                })),
            ]
        }
        const fallbackLevels = ["Beginner", "Intermediate", "Advanced", "Expert"]
        return [
            { id: "all", name: "All Levels" },
            ...fallbackLevels.map((name) => ({ id: name, name })),
        ]
    }, [levels])
    const educators = ["all", ...Array.from(new Set(finalCourses.map((course) => course.educator)))]

    // Extract unique skills from courses (used to prioritize skills that have courses)
    const allCourseSkills = useMemo(() => {
        const skillSet = new Set<string>()
        finalCourses.forEach(course => {
            if (course.skillDocumentIds) {
                course.skillDocumentIds.forEach(skillId => skillSet.add(skillId))
            }
        })
        return Array.from(skillSet)
    }, [finalCourses])

    // Extract unique badges from courses (for filter display)
    const allCourseBadges = useMemo(() => {
        const badgeSet = new Set<string>()
        finalCourses.forEach(course => {
            if (course.badgeDocumentIds) {
                course.badgeDocumentIds.forEach(badgeId => badgeSet.add(badgeId))
            }
        })
        return Array.from(badgeSet)
    }, [finalCourses])

    const filteredCourses = useMemo(() => {
        const filtered = finalCourses.filter((course) => {
            const matchesSearch =
                course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (course.skills && course.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase())))
            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes("all") || selectedCategories.includes(course.category)
            const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes("all") || selectedLevels.includes(course.level)
            const matchesEducator = selectedEducator === "all" || course.educator === selectedEducator
            const matchesFavorites = !showFavorites || favorites.includes(course.id)
            // Filter by skills - check if course has any of the selected skills
            const matchesSkills = selectedSkills.length === 0 || 
                (course.skillDocumentIds && course.skillDocumentIds.some(skillId => selectedSkills.includes(skillId))) ||
                (course.skills && course.skills.some(skillName => {
                    // Find skill by name and check if its documentId is in selectedSkills
                    const matchingSkill = skills.find(s => s.name === skillName)
                    return matchingSkill && selectedSkills.includes(matchingSkill.documentId)
                }))
            // Filter by badges - check if course has any of the selected badges
            const matchesBadges = selectedBadges.length === 0 || 
                (course.badgeDocumentIds && course.badgeDocumentIds.some(badgeId => selectedBadges.includes(badgeId))) ||
                (course.badges && course.badges.some(badgeName => {
                    // Find badge by name and check if its documentId is in selectedBadges
                    const matchingBadge = badges.find(b => b.name === badgeName)
                    return matchingBadge && selectedBadges.includes(matchingBadge.documentId)
                }))
            // Filter by tags
            const matchesTags = selectedTags.length === 0 || course.tags.some(tag => selectedTags.includes(tag))
            const coursePriceValue = typeof course.priceValue === "number"
                ? course.priceValue
                : Number.parseFloat(course.price.replace("$", "")) || 0
            const matchesPriceRange = coursePriceValue >= priceRange[0] && coursePriceValue <= priceRange[1]
            const matchesPaidSwitch = !showPaidOnly || course.is_paid
            // Filter by instructor - check all instructors in the course
            const matchesInstructor = selectedEducator === "all" || 
                course.instructorId === selectedEducator ||
                course.educator === selectedEducator ||
                (course.instructors && Array.isArray(course.instructors) && course.instructors.some((inst: any) => {
                    if (!inst) return false
                    const instIdValue: any = inst.id
                    const instId = instIdValue !== undefined && instIdValue !== null
                        ? (typeof instIdValue === 'number' ? instIdValue.toString() : String(instIdValue))
                        : ""
                    const instName = inst.name || ""
                    return instId === selectedEducator || instName === selectedEducator
                }))

            return matchesSearch && matchesCategory && matchesLevel && matchesInstructor && matchesFavorites && matchesSkills && matchesBadges && matchesTags && matchesPriceRange && matchesPaidSwitch
        })

        return filtered
    }, [finalCourses, searchQuery, selectedCategories, selectedLevels, selectedEducator, showFavorites, favorites, selectedSkills, selectedBadges, selectedTags, showPaidOnly, priceRange, skills, badges])

    const displayedCourses = useMemo(() => {
        return filteredCourses.slice(0, coursesToDisplayCount)
    }, [filteredCourses, coursesToDisplayCount])

    const wishlistWithCourse = useMemo(() => {
        return wishlistEntries.map(entry => ({
            ...entry,
            course: finalCourses.find(course => course.id === entry.courseId),
        }))
    }, [wishlistEntries, finalCourses])

    useEffect(() => {
        setHasMore(coursesToDisplayCount < filteredCourses.length)
    }, [coursesToDisplayCount, filteredCourses.length])

    useEffect(() => {
        if (!loadingRef.current) return
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isSearching) {
                    setCoursesToDisplayCount(prev => prev + coursesToLoadIncrement)
                }
            },
            { threshold: 1 },
        )

        const currentRef = loadingRef.current
        observer.observe(currentRef)
        return () => {
            observer.unobserve(currentRef)
        }
    }, [hasMore, isSearching])

    useEffect(() => {
        setCoursesToDisplayCount(initialCoursesToShow)
        setHasMore(true)
    }, [searchQuery, selectedCategories, selectedLevels, selectedEducator, showFavorites, selectedSkills, selectedBadges, selectedTags, showPaidOnly, priceRange])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSearching(true)
        resetPagination()
        console.log("[v0] Searching for courses:", searchQuery)
        setTimeout(() => setIsSearching(false), 1000)
    }

    const toggleFavorite = async (courseId: number) => {
        if (!user?.id) {
            setFavorites((prev) => (prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]))
            return
        }

        const existing = wishlistEntries.find(entry => entry.courseId === courseId)

        try {
            setIsWishlistSyncing(true)
            if (existing) {
                await deleteUserWishlist(existing.id)
                setWishlistEntries(prev => prev.filter(entry => entry.id !== existing.id))
                setFavorites(prev => prev.filter(id => id !== courseId))
                toast.success("Removed from wishlist")
            } else {
                const created = await createUserWishlist(user.id, courseId)
                if (created) {
                    setWishlistEntries(prev => [...prev, created])
                    setFavorites(prev => [...prev, courseId])
                    toast.success("Saved to wishlist")
                }
            }
        } catch (error: any) {
            console.error("Failed to update wishlist:", error)
            toast.error(error?.message || "Unable to update wishlist")
        } finally {
            setIsWishlistSyncing(false)
        }
    }

    const resetPagination = () => {
        setCoursesToDisplayCount(initialCoursesToShow)
        setHasMore(true)
    }

    const handleLevelsChange = (value: string[]) => {
        setSelectedLevels(value)
        resetPagination()
    }

    const handleCategoriesChange = (value: string[]) => {
        setSelectedCategories(value)
        resetPagination()
    }

    const handleBadgesChange = (value: string[]) => {
        setSelectedBadges(value)
        resetPagination()
    }

    const handleTagsChange = (value: string[]) => {
        setSelectedTags(value)
        resetPagination()
    }

    const handleInstructorChange = (value: string) => {
        setSelectedEducator(value)
        resetPagination()
    }

    const handleFavoritesChange = (value: boolean) => {
        setShowFavorites(value)
        resetPagination()
    }

    const handlePriceRangeChange = (value: number[]) => {
        if (value.length === 0) return
        if (value.length === 1) {
            const clamped = Math.min(Math.max(value[0], defaultPriceRange[0]), defaultPriceRange[1])
            setPriceRange([defaultPriceRange[0], clamped] as [number, number])
        } else {
            const [first, second] = value
            const sorted: [number, number] = [Math.min(first, second), Math.max(first, second)]
            setPriceRange(sorted)
        }
        resetPagination()
    }

    const handlePaidToggle = (value: boolean) => {
        setShowPaidOnly(value)
        resetPagination()
    }

    const clearFilters = () => {
        setSelectedCategories(["all"])
        setSelectedLevels(["all"])
        setSelectedEducator("all")
        setShowFavorites(false)
        setSearchQuery("")
        setSelectedSkills([])
        setSelectedBadges([])
        setSelectedTags([])
        setShowPaidOnly(false)
        setPriceRange([...defaultPriceRange] as [number, number])
        resetPagination()
    }

    const toggleWithAll = (current: string[], value: string) => {
        if (value === "all") {
            return ["all"]
        }
        const withoutAll = current.filter(item => item !== "all")
        const next = withoutAll.includes(value)
            ? withoutAll.filter(item => item !== value)
            : [...withoutAll, value]
        return next.length === 0 ? ["all"] : next
    }

    const handleFilterItemClick = (id: string, type: "skill" | "category" | "badge") => {
        if (type === "category") {
            setSelectedCategories(prev => toggleWithAll(prev, id))
        } else if (type === "skill") {
            if (id === "all-skills") {
                setSelectedSkills([])
            } else {
                setSelectedSkills(prev => 
                    prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
                )
            }
        } else if (type === "badge") {
            setSelectedBadges(prev => 
                prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
            )
        }
        resetPagination()
    }

    const handleCourseClick = (courseId: number) => {
        console.log('Course card clicked - navigating to course detail:', courseId)
        router.push(`/courses/${courseId}`)
    }

    const handleEnrollClick = (courseId: number) => {
        console.log('Enroll button clicked - starting enrollment process:', courseId)
        router.push(`/courses/${courseId}`)
    }

    const categoryOptions = useMemo(() => {
        if (categories.length > 0) {
            return [
                { id: "all", name: "All Categories" },
                ...categories.map(cat => ({
                    id: cat.name,
                    name: cat.name,
                })),
            ]
        }
        const fallbackCategories = [
            "Web Development",
            "Artificial Intelligence",
            "Mobile Development",
            "Data Science",
            "Design",
            "Cloud Computing",
            "Cybersecurity",
            "Game Development",
            "Blockchain",
            "Business",
            "Science & Tech",
            "DevOps",
            "Computer Science",
        ]
        return [
            { id: "all", name: "All Categories" },
            ...fallbackCategories.map((name) => ({ id: name, name })),
        ]
    }, [categories])

    // Get all tags from Strapi API (for filter modal)
    const allTags = useMemo(() => {
        return courseTages.map(tag => tag.name).sort()
    }, [courseTages])

    const normalizedSkillOptions = useMemo(() => {
        const seen = new Set<string>()
        const items: Array<{ id: string; name: string }> = []
        skills.forEach(skill => {
            const id = skill.documentId || (skill.id ? skill.id.toString() : "")
            if (!id || seen.has(id)) return
            seen.add(id)
            items.push({
                id,
                name: skill.name || "Untitled Skill",
            })
        })
        items.sort((a, b) => a.name.localeCompare(b.name))
        return items
    }, [skills])

    const prioritizedSkillOptions = useMemo(() => {
        if (normalizedSkillOptions.length === 0) return []
        const activeSkillSet = new Set(allCourseSkills)
        return [...normalizedSkillOptions].sort((a, b) => {
            const aActive = activeSkillSet.has(a.id) ? 0 : 1
            const bActive = activeSkillSet.has(b.id) ? 0 : 1
            if (aActive !== bActive) return aActive - bActive
            return a.name.localeCompare(b.name)
        })
    }, [normalizedSkillOptions, allCourseSkills])

    // Prepare filter items for slideable filters - ONLY SKILLS
    const skillFilterItems = [
        { id: "all-skills", name: "All Skills", type: "skill" as const },
        ...prioritizedSkillOptions.map((skill) => ({
            id: skill.id,
            name: skill.name,
            type: "skill" as const,
        })),
    ]

    // Prepare badge options for filter modal (always show fetched badges)
    const badgeFilterOptions = useMemo(() => {
        if (!badges || badges.length === 0) return []
        return badges.map((badge) => ({
            id: badge.documentId || badge.id.toString(),
            name: badge.name || "Untitled Badge",
        }))
    }, [badges])

    // Prepare instructor options for filter modal
    const instructorFilterOptions = useMemo(() => {
        if (!instructors || instructors.length === 0) return []
        const instructorMap = new Map<string | number, Instructor>()
        instructors.forEach(inst => {
            if (!inst) return
            const key = inst.id ?? inst.documentId
            if (key !== undefined && key !== null && !instructorMap.has(key)) {
                instructorMap.set(key, inst)
            }
        })
        return Array.from(instructorMap.values()).map(inst => ({
            id: inst.id ?? inst.documentId,
            name: inst.name,
            avatar: inst.avatar
        }))
    }, [instructors])

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 relative">
            {/* Light/Dark Mode Background */}
            <div 
                className="absolute inset-0 dark:opacity-30 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 20% 50%, rgba(0, 0, 0, 0.03) 0%, transparent 60%),
                        radial-gradient(circle at 80% 80%, rgba(0, 0, 0, 0.02) 0%, transparent 60%)
                    `,
                    backgroundSize: "100% 100%",
                }}
            />

            <HeaderUltra/>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24 relative z-10">
                {/* Slideable Filters - ONLY SKILLS */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                >
                    {skillFilterItems.length > 0 && (
                        <div className="w-full overflow-hidden">
                            <SlideableFilters
                                items={skillFilterItems}
                                selectedItems={selectedSkills.length > 0 ? selectedSkills : ["all-skills"]}
                                onItemClick={(id) => handleFilterItemClick(id, "skill")}
                                maxItems={999}
                            />
                    </div>
                    )}
                </motion.div>

                {/* Search and Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                >
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 justify-end">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-600 dark:text-gray-400 w-3.5 h-3.5 z-10"/>
                            <Input
                                type="text"
                                placeholder="Search courses, topics, or instructors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="liquid-glass-input focus-visible:ring-0 pl-9 py-2 h-9 text-xs !rounded-sm w-[20rem] focus:w-[30rem] transition-all duration-300 origin-right"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                disabled={isSearching}
                                className="py-2 px-4 h-9 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white text-xs"
                            >
                                <Search className="w-3.5 h-3.5 mr-1"/>
                                {isSearching ? "Searching..." : "Search"}
                            </Button>
                            <Button
                                type="button"
                                variant="bordered"
                                className="liquid-glass-button py-2 px-3 h-9 border-2 !rounded-sm hover:scale-105 transition-all duration-300 text-xs"
                                onClick={() => setShowFilters(true)}
                            >
                                <Filter className="w-3.5 h-3.5 mr-1"/>
                                Filters
                            </Button>
                        </div>
                    </form>
                </motion.div>

                {/* Draggable Filter Modal */}
                <DraggableFilterModal
                    isOpen={showFilters}
                    onClose={() => setShowFilters(false)}
                    selectedLevels={selectedLevels}
                    onLevelsChange={handleLevelsChange}
                    selectedCategories={selectedCategories}
                    onCategoriesChange={handleCategoriesChange}
                    selectedBadges={selectedBadges}
                    onBadgesChange={handleBadgesChange}
                    selectedTags={selectedTags}
                    onTagsChange={handleTagsChange}
                    priceRange={priceRange}
                    onPriceRangeChange={handlePriceRangeChange}
                    priceLimit={defaultPriceRange[1]}
                    showPaidOnly={showPaidOnly}
                    onPaidToggle={handlePaidToggle}
                    selectedInstructor={selectedEducator}
                    setSelectedInstructor={handleInstructorChange}
                    showFavorites={showFavorites}
                    setShowFavorites={handleFavoritesChange}
                    levelOptions={levelOptions}
                    categoryOptions={categoryOptions}
                    badgeOptions={badgeFilterOptions}
                    tagOptions={allTags}
                    instructorOptions={instructorFilterOptions}
                    onClearFilters={clearFilters}
                />

                {/* Courses Grid with Liquid Glass Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 min-h-[70vh]">
                    {isLoadingCourses || isSearching
                        ? Array.from({length: initialCoursesToShow}).map((_, index) => <CourseSkeleton key={index}/>)
                        : displayedCourses.map((course, index) => (
                            <div
                                key={course.id}
                                className="animate-fadeInUp"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <CourseCard
                                    course={course}
                                    onEnrollClick={handleEnrollClick}
                                    onCourseClick={handleCourseClick}
                                    onToggleFavorite={toggleFavorite}
                                    onOpenWishlist={() => setIsWishlistModalOpen(true)}
                                    isFavorite={favorites.includes(course.id)}
                                />
                            </div>
                        ))}
                </div>

                {hasMore && displayedCourses.length > 0 && (
                    <div ref={loadingRef} className="text-center">
                        <CourseLoading/>
                        <motion.p 
                            className="text-slate-600 dark:text-gray-400 mt-3 text-xs font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            Loading more courses...
                        </motion.p>
                    </div>
                )}

                {!isLoadingCourses && !isSearching && filteredCourses.length === 0 && (
                    <div className="text-center h-[70vh]">
                        <BookOpen className="w-12 h-12 text-slate-600 dark:text-gray-400 mx-auto mb-3"/>
                        <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">No courses found</h3>
                        <p className="text-sm text-slate-600 dark:text-gray-300 mb-4">Try adjusting your search or filters</p>
                        <Button onClick={clearFilters} className="text-white bg-gradient-to-r from-blue-500 to-purple-600 text-sm h-9 px-4 rounded-sm">
                            Clear all filters
                        </Button>
                    </div>
                )}

                <UserWishlistModal
                    isOpen={isWishlistModalOpen}
                    onClose={() => setIsWishlistModalOpen(false)}
                    wishlists={wishlistWithCourse}
                    onRemove={toggleFavorite}
                    onNavigate={handleCourseClick}
                    isLoading={isWishlistLoading}
                    isSyncing={isWishlistSyncing}
                    isAuthenticated={isAuthenticated}
                />
            </div>

            <Footer/>
        </div>
    )
}
