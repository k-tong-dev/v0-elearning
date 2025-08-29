"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Clock, Play, ArrowRight } from "lucide-react"

const courses = [
  {
    id: 1,
    title: "Build Text to Image SaaS App in React JS",
    instructor: "John Smith",
    rating: 4.8,
    students: 2847,
    duration: "12 hours",
    price: 89,
    originalPrice: 129,
    image: "/react-development-course.png",
    category: "Development",
    level: "Intermediate",
  },
  {
    id: 2,
    title: "AI Powered SaaS App in React JS",
    instructor: "Sarah Johnson",
    rating: 4.9,
    students: 1923,
    duration: "15 hours",
    price: 99,
    originalPrice: 149,
    image: "/ai-saas-development.png",
    category: "AI/ML",
    level: "Advanced",
  },
  {
    id: 3,
    title: "React Router Complete Course in One Video",
    instructor: "Mike Chen",
    rating: 4.7,
    students: 3456,
    duration: "8 hours",
    price: 69,
    originalPrice: 99,
    image: "/react-router-tutorial.png",
    category: "Development",
    level: "Beginner",
  },
  {
    id: 4,
    title: "Build Full Stack E-Commerce App in React JS",
    instructor: "Emily Davis",
    rating: 4.9,
    students: 1567,
    duration: "20 hours",
    price: 119,
    originalPrice: 179,
    image: "/e-commerce-react-app.png",
    category: "Full Stack",
    level: "Advanced",
  },
]

export function CoursesSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 uppercase">
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
            <Card
              key={course.id}
              className="group card-3d hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm animate-slide-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={course.image || "/placeholder.svg"}
                    alt={course.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
                      {course.category}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                      {course.level}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <Button
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                    >
                      <Play className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-200">
                  {course.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">by {course.instructor}</p>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="font-medium">{course.rating}</span>
                    <span className="ml-1">({course.students.toLocaleString()})</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{course.duration}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-primary">${course.price}</span>
                    <span className="text-sm text-muted-foreground line-through">${course.originalPrice}</span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
                  >
                    Enroll Now
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button
            asChild
            size="lg"
            className="group bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white px-8 py-4 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/25 hover:scale-105 text-lg font-semibold"
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
