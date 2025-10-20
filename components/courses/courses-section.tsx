"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@heroui/react"
import { CourseCard } from "@/components/courses/CourseCard"
import { ArrowRight } from "lucide-react"

const courses = [
  {
    id: 1,
    title: "Build Text to Image SaaS App in React JS",
    description: "Master React from basics to advanced concepts with hands-on projects and real-world applications",
    educator: "John Smith",
    educatorId: "1",
    rating: 4.8,
    students: 2847,
    duration: "12 hours",
    price: "$89",
    originalPrice: "$129",
    image: "/react-development-course.png",
    category: "Development",
    level: "Intermediate",
    tags: ["React", "JavaScript", "SaaS"],
    trending: true,
    bestseller: false,
    discount: "31% off",
  },
  {
    id: 2,
    title: "AI Powered SaaS App in React JS",
    description: "Learn AI and ML concepts with Python and real-world applications in data science",
    educator: "Sarah Johnson",
    educatorId: "2",
    rating: 4.9,
    students: 1923,
    duration: "15 hours",
    price: "$99",
    originalPrice: "$149",
    image: "/ai-saas-development.png",
    category: "AI/ML",
    level: "Advanced",
    tags: ["AI", "Machine Learning", "React"],
    trending: false,
    bestseller: true,
    discount: "33% off",
  },
  {
    id: 3,
    title: "React Router Complete Course in One Video",
    description: "Build complete web applications with modern technologies and deployment strategies",
    educator: "Mike Chen",
    educatorId: "3",
    rating: 4.7,
    students: 3456,
    duration: "8 hours",
    price: "$69",
    originalPrice: "$99",
    image: "/react-router-tutorial.png",
    category: "Development",
    level: "Beginner",
    tags: ["React", "Router", "Frontend"],
    trending: true,
    bestseller: false,
    discount: "30% off",
  },
  {
    id: 4,
    title: "Build Full Stack E-Commerce App in React JS",
    description: "Create cross-platform mobile apps for iOS and Android with React Native",
    educator: "Emily Davis",
    educatorId: "4",
    rating: 4.9,
    students: 1567,
    duration: "20 hours",
    price: "$119",
    originalPrice: "$179",
    image: "/e-commerce-react-app.png",
    category: "Full Stack",
    level: "Advanced",
    tags: ["React", "E-commerce", "Full-Stack"],
    trending: false,
    bestseller: true,
    discount: "33% off",
  },
]

export function CoursesSection() {
  const router = useRouter()
  
  const handleCourseClick = (courseId: number) => {
    console.log('Course card clicked - navigating to course detail:', courseId)
    router.push(`/courses/${courseId}`)
  }

  const handleEnrollClick = (courseId: number) => {
    console.log('Enroll button clicked - starting enrollment process:', courseId)
    // For now, we'll also navigate to the course detail page
    // In a real app, this might open a payment modal or enrollment flow
    router.push(`/courses/${courseId}`)
  }
  
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 uppercase font-saira text-gray-500">
            Learn from the{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">best</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our top-rated courses across various categories. From coding and design to business and wellness,
            our courses are crafted to deliver results.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {courses.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              index={index}
              onCourseClick={handleCourseClick}
              onEnrollClick={handleEnrollClick}
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button
            size="md"
            className="group text-md font-normal font-saira text-gray-500
            hover:shadow-xl hover:scale-105
            px-8 py-4 rounded-xl transition-all duration-300
            bg-gray-400/10"
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
