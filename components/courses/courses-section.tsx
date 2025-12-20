"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@heroui/react"
import { CourseCard } from "@/components/courses/CourseCard"
import { ArrowRight } from "lucide-react"
import { getPublicCourseCourses } from "@/integrations/strapi/courseCourse"
import type { CourseCourse } from "@/integrations/strapi/courseCourse"
import { getCoursePreviewUrl } from "@/integrations/strapi/coursePreview"
import { getAvatarUrl } from "@/lib/getAvatarUrl"

export function CoursesSection() {
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true)
        const coursesData = await getPublicCourseCourses()
        // Filter only published courses and take first 4
        const publishedCourses = coursesData
          .filter(course => course.course_status === "published" && course.active !== false)
          .slice(0, 4)
          .map((course: CourseCourse) => {
            // Map to CourseCard format - use same approach as courses page
            const baseMediaUrl = process.env.NEXT_PUBLIC_STRAPI_URL || ""
            const resolveMediaUrl = (value?: string | null) => {
              if (!value) return "/placeholder.svg"
              if (value.startsWith("http")) return value
              return baseMediaUrl ? `${baseMediaUrl}${value}` : value
            }
            
            // Use preview_url which is already extracted by extractPreviewUrl in courseCourse.ts
            // This is the same approach used on the courses page
            const thumbnail = resolveMediaUrl(course.preview_url)
            
            // Get instructor with proper avatar extraction
            const instructor = course.instructors?.[0]
            const instructorName = instructor?.name || "Instructor"
            const instructorAvatar = instructor?.avatar ? getAvatarUrl(instructor.avatar) : null
            
            // Map instructors array with proper avatar URLs
            const instructorsList = (course.instructors || []).map((inst: any) => ({
              id: inst.id,
              documentId: inst.documentId,
              name: inst.name || "Instructor",
              avatar: inst.avatar,
              avatarUrl: getAvatarUrl(inst.avatar),
            }))
            
            // Calculate duration from duration_minutes
            const durationHours = Math.floor((course.duration_minutes || 0) / 60)
            const durationMinutes = (course.duration_minutes || 0) % 60
            const duration = durationHours > 0 
              ? `${durationHours} hour${durationHours > 1 ? 's' : ''}${durationMinutes > 0 ? ` ${durationMinutes} min` : ''}`
              : durationMinutes > 0 ? `${durationMinutes} min` : "N/A"
            
            // Format price
            const price = course.Price || 0
            const formattedPrice = price > 0 ? `$${price.toFixed(2)}` : "Free"
            
            return {
              id: course.id,
              documentId: course.documentId,
              title: course.name || "Untitled Course",
              description: course.description || "No description available",
              educator: instructorName,
              educatorId: instructor?.id?.toString() || "1",
              rating: course.average_rating || 0,
              students: course.enrollment_count || 0,
              duration: duration,
              price: formattedPrice,
              priceValue: price,
              originalPrice: course.discount_type === "percentage" && course.discount_percentage
                ? `$${(price / (1 - course.discount_percentage / 100)).toFixed(2)}`
                : formattedPrice,
              image: thumbnail,
              category: course.course_categories?.[0]?.name || "General",
              level: course.course_level?.name || "Beginner",
              tags: course.course_tages?.map((tag: any) => tag.name) || [],
              trending: false,
              bestseller: course.enrollment_count > 100,
              discount: course.discount_type === "percentage" && course.discount_percentage
                ? `${course.discount_percentage}% off`
                : undefined,
              instructors: instructorsList,
              course_preview: course.course_preview,
              preview_url: course.preview_url || null,
              preview_available: course.preview_available || false,
            }
          })
        
        setCourses(publishedCourses)
      } catch (error) {
        console.error("Failed to fetch courses:", error)
        setCourses([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [])
  
  const handleCourseClick = (courseId: string | number) => {
    console.log('Course card clicked - navigating to course detail:', courseId)
    router.push(`/courses/${courseId}`)
  }

  const handleEnrollClick = (courseId: string | number) => {
    console.log('Enroll button clicked - starting enrollment process:', courseId)
    // For now, we'll also navigate to the course detail page
    // In a real app, this might open a payment modal or enrollment flow
    router.push(`/courses/${courseId}`)
  }
  
  return (
    <section className="py-32 bg-white dark:bg-slate-950 relative">
      {/* Light/Dark Mode Background */}
      <div 
        className="absolute inset-0 dark:opacity-30 opacity-10"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(0, 0, 0, 0.03) 0%, transparent 60%),
            radial-gradient(circle at 80% 80%, rgba(0, 0, 0, 0.02) 0%, transparent 60%)
          `,
          backgroundSize: "100% 100%",
        }}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 uppercase tracking-wide text-slate-900 dark:text-white">
            Learn from the{" "}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent">best</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover our top-rated courses across various categories. From coding and design to business and wellness,
            our courses are crafted to deliver results.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-slate-200 dark:bg-slate-800 rounded-lg h-64"></div>
              </div>
            ))
          ) : courses.length > 0 ? (
            courses.map((course, index) => (
              <CourseCard
                key={course.id || course.documentId || index}
                course={course}
                index={index}
                onCourseClick={handleCourseClick}
                onEnrollClick={handleEnrollClick}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-600 dark:text-gray-400">No courses available at the moment.</p>
            </div>
          )}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button
            size="md"
            className="group text-md font-normal liquid-glass-button text-slate-900 dark:text-white border-slate-200 dark:border-blue-400/50 hover:border-slate-300 dark:hover:border-blue-400/50 hover:scale-105 px-8 py-4 rounded-full transition-all duration-300"
          >
            <Link href="/courses" className="flex items-center gap-2">
              See All Courses
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
