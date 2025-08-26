"use client"

import type React from "react"

import { useState } from "react"
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, Star, Clock, Users, ChevronRight } from "lucide-react"
import { CourseSkeleton } from "@/components/course-skeleton"

export default function CoursesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Mock courses data
  const courses = [
    {
      id: 1,
      title: "Complete React Development Course",
      description: "Master React from basics to advanced concepts with hands-on projects",
      image: "/react-development-course.png",
      price: "$89.99",
      originalPrice: "$129.99",
      rating: 4.8,
      students: 12543,
      duration: "42 hours",
      level: "Intermediate",
      category: "Web Development",
    },
    {
      id: 2,
      title: "AI & Machine Learning Fundamentals",
      description: "Learn AI and ML concepts with Python and real-world applications",
      image: "/ai-saas-development.png",
      price: "$99.99",
      originalPrice: "$149.99",
      rating: 4.9,
      students: 8765,
      duration: "38 hours",
      level: "Beginner",
      category: "Artificial Intelligence",
    },
    {
      id: 3,
      title: "Full-Stack Web Development",
      description: "Build complete web applications with modern technologies",
      image: "/react-router-tutorial.png",
      price: "$119.99",
      originalPrice: "$179.99",
      rating: 4.7,
      students: 15432,
      duration: "56 hours",
      level: "Advanced",
      category: "Web Development",
    },
    {
      id: 4,
      title: "Mobile App Development with React Native",
      description: "Create cross-platform mobile apps for iOS and Android",
      image: "/e-commerce-react-app.png",
      price: "$94.99",
      originalPrice: "$139.99",
      rating: 4.6,
      students: 9876,
      duration: "45 hours",
      level: "Intermediate",
      category: "Mobile Development",
    },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    console.log("[v0] Searching for courses:", searchQuery)
    // Simulate search delay
    setTimeout(() => setIsLoading(false), 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Breadcrumbs size="lg" separator={<ChevronRight className="w-4 h-4" />} className="mb-4">
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem>All Courses</BreadcrumbItem>
          </Breadcrumbs>

          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            All Courses
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Discover our comprehensive collection of courses designed to help you master new skills and advance your
            career.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base border-2 focus:border-cyan-500"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 px-8 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
            >
              {isLoading ? "Searching..." : "Search"}
            </Button>
            <Button variant="outline" className="h-12 px-6 bg-transparent">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </form>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, index) => <CourseSkeleton key={index} />)
            : courses.map((course) => (
                <Card
                  key={course.id}
                  className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-cyan-200 dark:hover:border-cyan-800"
                >
                  <CardHeader className="p-0">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={course.image || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <Badge className="absolute top-3 left-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white">
                        {course.level}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <Badge variant="outline" className="text-xs">
                        {course.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mb-2 group-hover:text-cyan-600 transition-colors duration-200">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="text-sm mb-4">{course.description}</CardDescription>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{course.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.students.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-cyan-600">{course.price}</span>
                        <span className="text-sm text-muted-foreground line-through">{course.originalPrice}</span>
                      </div>
                      <Button className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white">
                        Enroll Now
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
        </div>
      </div>
    </div>
  )
}
