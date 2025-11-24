"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
    Plus, BookOpen, Video, Loader2, Edit, Eye, Search, 
    Filter, X, ChevronDown, Tag, Award, Layers, Target
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getDashboardCourseCourses, CourseCourse } from "@/integrations/strapi/courseCourse"
import { useAuth } from "@/hooks/use-auth"
import { getAccessToken } from "@/lib/cookies"
import ReactPlayer from "react-player"
import { CoursePreview, getCoursePreview, getCoursePreviewUrl } from "@/integrations/strapi/coursePreview"
import { getCourseCategories, CourseCategory } from "@/integrations/strapi/courseCategory"
import { getBadges, Badge as BadgeType } from "@/integrations/strapi/badge"
import { getSkills, Skill } from "@/integrations/strapi/skill"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"

interface CourseWithPreview extends CourseCourse {
    course_preview?: CoursePreview | null;
}

interface DashboardMyCoursesProps {
    myCourses?: CourseCourse[]
    onCreateCourse: () => void
    onEditCourse?: (courseId: number | string) => void
    showCreateButton: boolean
}

export function DashboardMyCourses({ myCourses: propCourses, onCreateCourse, onEditCourse, showCreateButton }: DashboardMyCoursesProps) {
    const router = useRouter()
    const { user } = useAuth()
    const [courses, setCourses] = useState<CourseWithPreview[]>(propCourses || [])
    const [filteredCourses, setFilteredCourses] = useState<CourseWithPreview[]>([])
    const [loading, setLoading] = useState(!propCourses)
    const strapiURL = process.env.NEXT_PUBLIC_STRAPI_URL

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategories, setSelectedCategories] = useState<number[]>([])
    const [selectedTags, setSelectedTags] = useState<number[]>([])
    const [selectedBadges, setSelectedBadges] = useState<number[]>([])
    const [selectedSkills, setSelectedSkills] = useState<number[]>([])
    const [showFilters, setShowFilters] = useState(false)

    // Filter options
    const [categories, setCategories] = useState<CourseCategory[]>([])
    const [tags, setTags] = useState<any[]>([])
    const [badges, setBadges] = useState<BadgeType[]>([])
    const [skills, setSkills] = useState<Skill[]>([])

    // Fetch filter options
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const [cats, bgs, sks] = await Promise.all([
                    getCourseCategories(),
                    getBadges(),
                    getSkills(),
                ])
                setCategories(cats)
                setBadges(bgs)
                setSkills(sks)

                // Fetch course tags
                try {
                    const access_token = getAccessToken()
                    const tagsResponse = await fetch(
                        `${strapiURL}/api/course-tages?populate=*`,
                        {
                            headers: {
                                Authorization: `Bearer ${access_token}`,
                            },
                        }
                    )
                    if (tagsResponse.ok) {
                        const tagsData = await tagsResponse.json()
                        setTags((tagsData.data || []).map((item: any) => ({
                            id: item.id,
                            name: item.name,
                        })))
                    }
                } catch (e) {
                    console.error("Failed to fetch tags:", e)
                }
            } catch (error) {
                console.error("Failed to fetch filter options:", error)
            }
        }
        fetchFilterOptions()
    }, [strapiURL])

    // Fetch courses dynamically if not provided
    useEffect(() => {
        const fetchCourses = async () => {
            if (propCourses) {
                setCourses(propCourses)
                setFilteredCourses(propCourses)
                return
            }

            if (!user?.id) {
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                const access_token = getAccessToken()
                
                // Fetch courses created by the current user with preview data
                // Use proper Strapi v5 populate syntax - use populate=* for all relations
                const response = await fetch(
                    `${strapiURL}/api/course-courses?filters[owner][id][$eq]=${user.id}&populate=*&sort=createdAt:desc`,
                    {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                        },
                    }
                )

                if (response.ok) {
                    const data = await response.json()
                    console.log("Fetched courses data:", data);
                    const coursesData = data.data || [];
                    console.log("Number of courses found:", coursesData.length);
                    
                    if (coursesData.length === 0) {
                        console.log("No courses found, trying fallback...");
                        // Try fallback to get all courses for dashboard
                        const allCourses = await getDashboardCourseCourses(user.id)
                        const coursesWithPreviews = await Promise.all(allCourses.map(async (course) => {
                            const courseWithPreview: CourseWithPreview = { ...course };
                            if (course.course_preview?.id) {
                                try {
                                    const preview = await getCoursePreview(course.course_preview.id);
                                    courseWithPreview.course_preview = preview;
                                } catch (e) {
                                    console.error("Failed to fetch preview for course", course.id, e);
                                }
                            }
                            return courseWithPreview;
                        }));
                        setCourses(coursesWithPreviews)
                        setLoading(false)
                        return;
                    }
                    
                    const fetchedCourses = await Promise.all(coursesData.map(async (item: any) => {
                        const course: CourseWithPreview = {
                            id: item.id,
                            documentId: item.documentId,
                            name: item.name,
                            description: item.description,
                            Price: item.Price || 0,
                            is_paid: item.is_paid || false,
                            course_status: item.course_status || "draft",
                            active: item.active ?? true,
                            enrollment_count: item.enrollment_count || 0,
                            preview_available: item.preview_available || false,
                            preview_url: item.preview_url,
                            discount_type: item.discount_type || null,
                            discount_percentage: item.discount_percentage || 0,
                            discount_fix_price: item.discount_fix_price || 0,
                            duration_minutes: item.duration_minutes || 0,
                            purchase_count: item.purchase_count || 0,
                            revenue_generated: item.revenue_generated || 0,
                            course_categories: item.course_categories?.data || item.course_categories || [],
                            course_tages: item.course_tages?.data || item.course_tages || [],
                            course_badges: item.course_badges?.data || item.course_badges || [],
                            relevant_skills: item.relevant_skills?.data || item.relevant_skills || [],
                            createdAt: item.createdAt,
                            updatedAt: item.updatedAt,
                        };
                        
                        // Use course_preview from populated data if available
                        // Handle both Strapi v5 data structures: { data: {...} } or direct object
                        const previewData = item.course_preview?.data || item.course_preview;
                        console.log("Course", item.id, "preview data:", previewData);
                        if (previewData && previewData.id) {
                            course.course_preview = {
                                id: previewData.id,
                                documentId: previewData.documentId,
                                types: previewData.types,
                                url: previewData.url,
                                video: previewData.video,
                                image: previewData.image,
                            };
                            console.log("Set course preview for", item.id, ":", course.course_preview);
                        } else if (item.course_preview?.id) {
                            // Fallback: fetch preview separately if not populated
                            try {
                                const preview = await getCoursePreview(item.course_preview.id);
                                course.course_preview = preview;
                                console.log("Fetched preview separately for", item.id, ":", preview);
                            } catch (e) {
                                console.error("Failed to fetch preview for course", item.id, e);
                            }
                        } else {
                            console.log("No preview found for course", item.id);
                        }
                        
                        return course;
                    }));
                    console.log("Successfully processed", fetchedCourses.length, "courses");
                    setCourses(fetchedCourses)
                    // Initialize filtered courses
                    setFilteredCourses(fetchedCourses)
                } else {
                    const errorText = await response.text();
                    console.error("API response not OK:", response.status, errorText);
                    // Try fallback to get all courses for dashboard
                    try {
                        const allCourses = await getDashboardCourseCourses(user.id)
                        console.log("Fallback: Found", allCourses.length, "courses");
                        const coursesWithPreviews = await Promise.all(allCourses.map(async (course) => {
                            const courseWithPreview: CourseWithPreview = { ...course };
                            if (course.course_preview?.id) {
                                try {
                                    const preview = await getCoursePreview(course.course_preview.id);
                                    courseWithPreview.course_preview = preview;
                                } catch (e) {
                                    console.error("Failed to fetch preview for course", course.id, e);
                                }
                            }
                            return courseWithPreview;
                        }));
                        setCourses(coursesWithPreviews)
                        setFilteredCourses(coursesWithPreviews)
                    } catch (fallbackError) {
                        console.error("Fallback also failed:", fallbackError);
                        setCourses([])
                        setFilteredCourses([])
                    }
                }
            } catch (error) {
                console.error("Failed to fetch courses:", error)
                try {
                    const allCourses = await getDashboardCourseCourses(user?.id)
                    const coursesWithPreviews = await Promise.all(allCourses.map(async (course) => {
                        const courseWithPreview: CourseWithPreview = { ...course };
                        if (course.course_preview?.id) {
                            try {
                                const preview = await getCoursePreview(course.course_preview.id);
                                courseWithPreview.course_preview = preview;
                            } catch (e) {
                                console.error("Failed to fetch preview for course", course.id, e);
                            }
                        }
                        return courseWithPreview;
                        }));
                        setCourses(coursesWithPreviews)
                        setFilteredCourses(coursesWithPreviews)
                    } catch (e) {
                        console.error("Failed to fetch all courses:", e)
                        setCourses([])
                        setFilteredCourses([])
                    }
            } finally {
                setLoading(false)
            }
        }

        fetchCourses()
    }, [user?.id, propCourses, strapiURL])

    // Filter courses based on search and filters
    useEffect(() => {
        let filtered = [...courses]

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(course => 
                course.name?.toLowerCase().includes(query) ||
                course.description?.toLowerCase().includes(query)
            )
        }

        // Category filter
        if (selectedCategories.length > 0) {
            filtered = filtered.filter(course => {
                const courseCategoryIds = (course.course_categories || []).map((c: any) => c.id || c)
                return selectedCategories.some(catId => courseCategoryIds.includes(catId))
            })
        }

        // Tag filter
        if (selectedTags.length > 0) {
            filtered = filtered.filter(course => {
                const courseTagIds = (course.course_tages || []).map((t: any) => t.id || t)
                return selectedTags.some(tagId => courseTagIds.includes(tagId))
            })
        }

        // Badge filter
        if (selectedBadges.length > 0) {
            filtered = filtered.filter(course => {
                const courseBadgeIds = (course.course_badges || []).map((b: any) => b.id || b)
                return selectedBadges.some(badgeId => courseBadgeIds.includes(badgeId))
            })
        }

        // Skill filter
        if (selectedSkills.length > 0) {
            filtered = filtered.filter(course => {
                const courseSkillIds = (course.relevant_skills || []).map((s: any) => s.id || s)
                return selectedSkills.some(skillId => courseSkillIds.includes(skillId))
            })
        }

        setFilteredCourses(filtered)
    }, [courses, searchQuery, selectedCategories, selectedTags, selectedBadges, selectedSkills])

    const getStatusColor = (status: string) => {
        switch (status) {
            case "published": return "bg-green-500"
            case "draft": return "bg-yellow-500"
            case "cancel": return "bg-red-500"
            default: return "bg-gray-500"
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "published": return "Published"
            case "draft": return "Draft"
            case "cancel": return "Canceled"
            default: return status
        }
    }

    const handleEdit = (course: CourseCourse) => {
        if (onEditCourse) {
            onEditCourse(course.id)
        } else {
            router.push(`/dashboard?tab=my-courses&edit=${course.id}`)
        }
    }

    const handleView = (course: CourseCourse) => {
        router.push(`/courses/${course.id}`)
    }

    const clearFilters = () => {
        setSearchQuery("")
        setSelectedCategories([])
        setSelectedTags([])
        setSelectedBadges([])
        setSelectedSkills([])
    }

    const hasActiveFilters = searchQuery || 
        selectedCategories.length > 0 || 
        selectedTags.length > 0 || 
        selectedBadges.length > 0 || 
        selectedSkills.length > 0

    // Component to render course preview
    const CoursePreviewDisplay = ({ course }: { course: CourseWithPreview }) => {
        const playerRef = useRef<any>(null); // ReactPlayer ref type
        const [hasError, setHasError] = useState(false);
        const [isPlaying, setIsPlaying] = useState(false);
        const [isMounted, setIsMounted] = useState(false);
        const preview = course.course_preview;
        // Use getCoursePreviewUrl helper to extract URL from nested structure
        const previewUrl = getCoursePreviewUrl(preview) || course.preview_url;
        const previewType = preview?.types;
        
        // Debug logging
        // useEffect(() => {
        //     console.log("CoursePreviewDisplay for course", course.id, {
        //         preview,
        //         previewUrl,
        //         previewType,
        //         hasPreview: !!preview,
        //         hasUrl: !!previewUrl
        //     });
        // }, [course.id, preview, previewUrl, previewType]);

        // Handle mount and cleanup
        useEffect(() => {
            let isActive = true;
            setIsMounted(true);
            
            // Start playing after component is fully mounted
            const timer = setTimeout(() => {
                if (isActive) {
                    setIsPlaying(true);
                }
            }, 500);

            return () => {
                isActive = false;
                clearTimeout(timer);
                setIsMounted(false);
                setIsPlaying(false);
                
                // Cleanup player - prevent AbortError
                if (playerRef.current) {
                    try {
                        // Stop playing before unmount
                        const player = playerRef.current as any;
                        // Set playing to false first
                        if (player.setPlaying) {
                            player.setPlaying(false);
                        }
                        
                        if (player.getInternalPlayer) {
                            const internalPlayer = player.getInternalPlayer();
                            if (internalPlayer) {
                                // Pause first
                                if (typeof internalPlayer.pause === 'function') {
                                    try {
                                        internalPlayer.pause();
                                    } catch (e) {
                                        // Ignore pause errors
                                    }
                                }
                                // Then stop if available
                                if (typeof internalPlayer.stop === 'function') {
                                    try {
                                        internalPlayer.stop();
                                    } catch (e) {
                                        // Ignore stop errors
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                }
            };
        }, []);

        // If no preview available, show placeholder
        if (!preview && !previewUrl) {
            return (
                <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-purple-100 via-purple-50 to-blue-50 flex items-center justify-center">
                    <BookOpen className="w-20 h-20 text-purple-300" />
                </div>
            );
        }

        // Image preview
        if (previewType === "image") {
            // Use getCoursePreviewUrl helper to extract URL from nested structure
            const imageUrl = getCoursePreviewUrl(preview) || previewUrl;
            
            if (imageUrl) {
                return (
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                        <img
                            src={imageUrl}
                            alt={course.name || "Course preview"}
                            className="w-full h-full object-cover"
                            onError={() => setHasError(true)}
                        />
                        {hasError && (
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-blue-50 flex items-center justify-center">
                                <BookOpen className="w-20 h-20 text-purple-300" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
                    </div>
                );
            }
        }

        // Video or URL preview with ReactPlayer
        // Always try to display if previewUrl exists and type is url or video
        // Check if we have a URL preview (either from preview object or direct preview_url)
        const hasUrlPreview = previewUrl && (previewType === "video" || previewType === "url" || !previewType);
        
        if (hasUrlPreview) {
            // Determine if URL is a video (for 30s limit) vs image (no limit)
            const isVideoUrl = previewUrl.includes('youtube.com') || 
                              previewUrl.includes('youtu.be') || 
                              previewUrl.includes('vimeo.com') ||
                              previewUrl.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i);
            
            // Check if it's an image URL (no 30s limit needed)
            const isImageUrl = previewUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) ||
                              previewType === "image";
            
            // Only apply 30s limit for videos, not images
            // For URL type, check if it's actually a video URL
            const shouldLimitTo30s = (isVideoUrl || previewType === "video") && !isImageUrl && previewType !== "image";

            // For URL type or any URL that looks like video, use ReactPlayer
            // For images, use img tag instead
            if (isImageUrl && previewType === "image") {
                // Image URL - use img tag
                return (
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                        <img
                            src={previewUrl}
                            alt={course.name || "Course preview"}
                            className="w-full h-full object-cover"
                            onError={() => setHasError(true)}
                        />
                        {hasError && (
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-blue-50 flex items-center justify-center">
                                <BookOpen className="w-20 h-20 text-purple-300" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
                    </div>
                );
            } else if (isVideoUrl || previewType === "video" || (previewType === "url" && !isImageUrl)) {
                // console.log("Rendering ReactPlayer for course", course.id, "with URL:", previewUrl, "type:", previewType);
                return (
                    <div className="relative aspect-[16/9] w-full bg-black overflow-hidden group">
                        {isMounted && (
                            <ReactPlayer
                                ref={playerRef}
                                src={previewUrl} // Note: ReactPlayer v3.0+ uses 'src' prop instead of 'url'
                                playing={isPlaying && isMounted}
                                loop={true}
                                muted={true}
                                controls={false}
                                width="100%"
                                height="100%"
                                style={{ position: 'absolute', top: 0, left: 0 }}
                                config={{
                                    youtube: {
                                        playerVars: {
                                            autoplay: 0, // Don't use autoplay to prevent AbortError
                                            controls: 0,
                                            loop: 1,
                                            start: 0,
                                            end: shouldLimitTo30s ? 30 : undefined, // Only limit to 30s for videos
                                            modestbranding: 1,
                                            rel: 0,
                                            playsinline: 1,
                                        },
                                    },
                                    vimeo: {
                                        playerOptions: {
                                            autoplay: false, // Don't use autoplay to prevent AbortError
                                            loop: true,
                                            muted: true,
                                            controls: false,
                                            responsive: true,
                                        },
                                    },
                                } as any}
                                onProgress={(state: any) => {
                                    if (!isMounted) return;
                                    // Only apply 30s limit for videos, not images
                                    if (shouldLimitTo30s && state?.playedSeconds >= 30 && playerRef.current) {
                                        playerRef.current.seekTo(0, 'seconds');
                                    }
                                }}
                                onError={(error) => {
                                    console.error("ReactPlayer error:", error);
                                    setHasError(true);
                                    setIsPlaying(false);
                                }}
                                onReady={() => {
                                    if (!isMounted) return;
                                    setHasError(false);
                                    // Only start playing if component is still mounted
                                    setTimeout(() => {
                                        if (isMounted) {
                                            setIsPlaying(true);
                                        }
                                    }, 100);
                                }}
                            />
                        )}
                        {hasError && (
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-blue-50 flex items-center justify-center">
                                <Video className="w-20 h-20 text-purple-300" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
                    </div>
                );
            }
        }

        // Fallback to placeholder
        return (
            <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-purple-100 via-purple-50 to-blue-50 flex items-center justify-center">
                <BookOpen className="w-20 h-20 text-purple-300" />
            </div>
        );
    };

    // Filter Popover Component
    const FilterPopover = ({ 
        label, 
        icon: Icon, 
        options, 
        selected, 
        onSelectionChange 
    }: { 
        label: string
        icon: any
        options: Array<{ id: number; name: string }>
        selected: number[]
        onSelectionChange: (ids: number[]) => void
    }) => {
        const [open, setOpen] = useState(false)

        const toggleOption = (id: number) => {
            if (selected.includes(id)) {
                onSelectionChange(selected.filter(s => s !== id))
            } else {
                onSelectionChange([...selected, id])
            }
        }

        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={`h-9 ${selected.length > 0 ? 'bg-primary/10 border-primary' : ''}`}
                    >
                        <Icon className="w-4 h-4 mr-2" />
                        {label}
                        {selected.length > 0 && (
                            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                                {selected.length}
                            </Badge>
                        )}
                        <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                    <Command>
                        <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
                        <CommandList>
                            <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.id}
                                        onSelect={() => toggleOption(option.id)}
                                        className="flex items-center space-x-2 cursor-pointer"
                                    >
                                        <Checkbox
                                            checked={selected.includes(option.id)}
                                            onCheckedChange={() => toggleOption(option.id)}
                                        />
                                        <span>{option.name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        )
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold">My Courses</h2>
                </div>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">My Courses</h2>
                {showCreateButton && (
                    <Button
                        onClick={onCreateCourse}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Course
                    </Button>
                )}
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <FilterPopover
                            label="Categories"
                            icon={Layers}
                            options={categories}
                            selected={selectedCategories}
                            onSelectionChange={setSelectedCategories}
                        />
                        <FilterPopover
                            label="Tags"
                            icon={Tag}
                            options={tags}
                            selected={selectedTags}
                            onSelectionChange={setSelectedTags}
                        />
                        <FilterPopover
                            label="Badges"
                            icon={Award}
                            options={badges}
                            selected={selectedBadges}
                            onSelectionChange={setSelectedBadges}
                        />
                        <FilterPopover
                            label="Skills"
                            icon={Target}
                            options={skills}
                            selected={selectedSkills}
                            onSelectionChange={setSelectedSkills}
                        />
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="h-9"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {hasActiveFilters && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Showing {filteredCourses.length} of {courses.length} courses</span>
                    </div>
                )}
            </div>

            {/* Course Grid */}
            {filteredCourses.length === 0 ? (
                <div className="text-center py-16 border border-dashed rounded-xl bg-muted/20">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">
                        {hasActiveFilters ? "No courses match your filters" : "No courses yet"}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                        {hasActiveFilters 
                            ? "Try adjusting your search or filters" 
                            : "Create your first course to get started."}
                    </p>
                    {showCreateButton && !hasActiveFilters && (
                        <Button onClick={onCreateCourse} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Course
                        </Button>
                    )}
                </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredCourses.map((course, index) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: 0.05 * index }}
                            >
                                <Card className="group relative overflow-visible border border-slate-200 dark:border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 dark:from-white/10 dark:via-white/5 dark:to-white/[0.03] backdrop-blur-2xl shadow-lg dark:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] hover:shadow-xl dark:hover:shadow-[0_16px_48px_0_rgba(255,255,255,0.2)] hover:border-blue-400 dark:hover:border-white/40 transition-all duration-700 hover:-translate-y-2 rounded-2xl h-full flex flex-col p-0">
                                    {/* Multiple layered glass effects */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl" />
                                    <div className="absolute inset-0 bg-gradient-to-tl from-pink-400/10 via-transparent to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl" />
                                    
                                    {/* Preview Header */}
                                    <div className="relative overflow-hidden rounded-t-2xl">
                                        <div className="aspect-[16/9] relative">
                                            <CoursePreviewDisplay course={course} />
                                            {/* Multi-layer gradient overlays */}
                                            {/*<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />*/}
                                            {/*<div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />*/}
                                            
                                            {/* Badges container */}
                                            <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2 z-10">
                                                <Badge className={`${getStatusColor(course.course_status || "draft")} text-white text-xs font-medium px-2 py-0.5 backdrop-blur-xl border border-white/40 shadow-lg`}>
                                                    {getStatusLabel(course.course_status || "draft")}
                                                </Badge>
                                                {course.preview_available && (
                                                    <Badge variant="outline" className="bg-gradient-to-r from-white/25 to-white/15 backdrop-blur-xl border border-white/40 text-white text-xs shadow-lg">
                                                        <Eye className="w-3 h-3 mr-1" />
                                                        Preview
                                        </Badge>
                                                )}
                                            </div>
                                    </div>
                                    </div>

                                    {/* Course Content */}
                                    <CardContent className="p-6 space-y-4 flex-1 flex flex-col relative z-10">
                                        {/* Title with gradient hover */}
                                        <h3 className="text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 font-semibold text-lg">
                                            {course.name || "Untitled Course"}
                                        </h3>
                                        
                                        <p className="text-slate-600 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-300 text-sm line-clamp-2 flex-1">
                                            {course.description || "No description provided."}
                                        </p>

                                        {/* Course Meta Tags */}
                                        {((course.course_categories && course.course_categories.length > 0) || (course.course_tages && course.course_tages.length > 0)) && (
                                            <div className="flex flex-wrap gap-2">
                                                {course.course_categories?.slice(0, 2).map((cat: any) => (
                                                    <Badge key={cat.id || cat} className="bg-gradient-to-r from-white/25 to-white/15 backdrop-blur-xl border border-white/40 text-white text-xs shadow-lg">
                                                        {cat.name || cat}
                                                    </Badge>
                                                ))}
                                                {course.course_tages?.slice(0, 1).map((tag: any) => (
                                                    <Badge key={tag.id || tag} className="bg-gradient-to-r from-blue-500/30 to-purple-500/30 backdrop-blur-xl border border-blue-400/40 text-white text-xs shadow-lg">
                                                        {tag.name || tag}
                                                    </Badge>
                                                ))}
                                        </div>
                                        )}

                                        {/* Price with Discount - Dynamic Calculation */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {(() => {
                                                    const hasDiscount = course.discount_type && course.Price > 0;
                                                    let finalPrice = course.Price || 0;
                                                    let discountAmount = 0;
                                                    let discountLabel = "";
                                                    
                                                    if (hasDiscount) {
                                                        const discountPercentage = course.discount_percentage || (course as any).discount_percentage || 0;
                                                        if (course.discount_type === "percentage" && discountPercentage) {
                                                            discountAmount = course.Price * (discountPercentage / 100);
                                                            finalPrice = course.Price - discountAmount;
                                                            discountLabel = `-${discountPercentage}%`;
                                                        } else if (course.discount_type === "fix_price" && course.discount_fix_price) {
                                                            discountAmount = course.discount_fix_price;
                                                            finalPrice = course.Price - discountAmount;
                                                            discountLabel = `-$${course.discount_fix_price.toFixed(2)}`;
                                                        }
                                                        finalPrice = Math.max(0, finalPrice);
                                                    }
                                                    
                                                    return hasDiscount ? (
                                                        <>
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-lg font-bold text-slate-900 dark:text-white">
                                                                    ${finalPrice.toFixed(2)}
                                                                </span>
                                                                <span className="text-sm text-slate-400 dark:text-white/50 line-through">
                                                                    ${course.Price.toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-2 py-0.5 shadow-sm">
                                                                {discountLabel || "Sale"}
                                                            </Badge>
                                                        </>
                                                    ) : (
                                                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                                                            {course.Price > 0 ? `$${course.Price.toFixed(2)}` : "Free"}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl p-3 group-hover:bg-slate-100 dark:group-hover:bg-white/10 group-hover:border-blue-400 dark:group-hover:border-white/20 transition-all duration-300">
                                                    <div className="text-xs text-slate-500 dark:text-white/50 mb-1">Enrollments</div>
                                                    <div className="font-semibold text-slate-900 dark:text-white">{course.enrollment_count || 0}</div>
                                                </div>
                                                {course.duration_minutes > 0 && (
                                                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl p-3 group-hover:bg-slate-100 dark:group-hover:bg-white/10 group-hover:border-blue-400 dark:group-hover:border-white/20 transition-all duration-300">
                                                        <div className="text-xs text-slate-500 dark:text-white/50 mb-1">Duration</div>
                                                        <div className="font-semibold text-slate-900 dark:text-white">
                                                            {course.duration_minutes < 60 
                                                                ? `${course.duration_minutes}m`
                                                                : `${Math.floor(course.duration_minutes / 60)}h ${course.duration_minutes % 60}m`}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-2 mt-auto">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 border-slate-200 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300"
                                                onClick={() => handleEdit(course)}
                                            >
                                                <Edit className="w-4 h-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 border-slate-200 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300"
                                                onClick={() => handleView(course)}
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                View
                                            </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                        ))}
                    </AnimatePresence>
            </div>
            )}
        </div>
    )
}
