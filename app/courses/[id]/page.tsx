"use client"

import React, {useState} from "react"
import {useParams, useRouter} from "next/navigation"
import {Breadcrumbs, BreadcrumbItem} from "@nextui-org/react"
import {Badge} from "@/components/ui/badge"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Separator} from "@/components/ui/separator"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {
    Star,
    Clock,
    Users,
    ChevronRight,
    Play,
    CheckCircle,
    BookOpen,
    Download,
    Globe,
    Smartphone,
    Trophy,
    Heart,
    Share2,
    ChevronDown,
    ChevronUp,
} from "lucide-react"
import {Header} from "@/components/header"
import {Footer} from "@/components/footer"
import DropDown from "@/components/ui/dropdown";
import {addToast, Button} from "@heroui/react";
import MyToast from "@/components/ui/toast-provider";


export default function CourseDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [expandedSections, setExpandedSections] = useState<number[]>([0])
    const [isFavorite, setIsFavorite] = useState(false)

    // Mock course data - in real app, fetch based on params.id
    const course = {
        id: 1,
        title: "Build Text to Image SaaS App in React JS",
        description:
            "Master MERN Stack by building a Full Stack AI Text to Image SaaS App using React js, MongoDB, Node js, Express js and Stripe Payment",
        image: "/react-development-course.png",
        price: "$10.99",
        originalPrice: "$19.99",
        discount: "50% off",
        rating: 4.5,
        reviews: 122,
        students: 21,
        duration: "27h 25m",
        lectures: 54,
        level: "Intermediate",
        category: "Web Development",
        educator: {
            name: "Richard James",
            avatar: "/placeholder.svg",
            title: "Full Stack Developer",
            courses: 12,
            students: 15000,
        },
        lastUpdated: "5 days left at this price!",
        features: [
            "Lifetime access with free updates",
            "Step-by-step, hands-on project guidance",
            "Downloadable resources and source code",
            "Quizzes to test your knowledge",
            "Certificate of completion",
            "Quizzes to test your knowledge",
        ],
        courseStructure: [
            {
                title: "Project Introduction",
                lectures: 3,
                duration: "45 m",
                lessons: [
                    {title: "App Overview - Build Text-to-Image SaaS", duration: "10 mins", completed: false},
                    {title: "Tech Stack - React, Node.js, MongoDB", duration: "15 mins", completed: false},
                    {
                        title: "Core Features - Authentication, payment, deployment",
                        duration: "20 mins",
                        completed: false
                    },
                ],
            },
            {
                title: "Project Setup and configuration",
                lectures: 4,
                duration: "65 m",
                lessons: [
                    {title: "Environment Setup - Install Node.js, VS Code", duration: "10 mins", completed: false},
                    {title: "Repository Setup - Clone project repository", duration: "10 mins", completed: false},
                    {title: "Install Dependencies - Set up npm packages", duration: "15 mins", completed: false},
                    {
                        title: "Initial Configuration - Set up basic files and folders",
                        duration: "15 mins",
                        completed: false
                    },
                ],
            },
            {
                title: "Tailwind Setup",
                lectures: 4,
                duration: "65 m",
                lessons: [
                    {title: "Tailwind CSS Installation", duration: "15 mins", completed: false},
                    {title: "Configuration and Setup", duration: "20 mins", completed: false},
                    {title: "Custom Styles and Components", duration: "15 mins", completed: false},
                    {title: "Responsive Design Patterns", duration: "15 mins", completed: false},
                ],
            },
            {
                title: "Frontend Project",
                lectures: 6,
                duration: "85 m",
                lessons: [
                    {title: "React Component Architecture", duration: "20 mins", completed: false},
                    {title: "State Management Setup", duration: "15 mins", completed: false},
                    {title: "API Integration", duration: "20 mins", completed: false},
                    {title: "User Interface Components", duration: "15 mins", completed: false},
                    {title: "Form Handling and Validation", duration: "10 mins", completed: false},
                    {title: "Error Handling and Loading States", duration: "5 mins", completed: false},
                ],
            },
            {
                title: "Backend Project",
                lectures: 6,
                duration: "85 m",
                lessons: [
                    {title: "Node.js Server Setup", duration: "15 mins", completed: false},
                    {title: "Express.js Configuration", duration: "15 mins", completed: false},
                    {title: "MongoDB Database Integration", duration: "20 mins", completed: false},
                    {title: "API Routes and Controllers", duration: "15 mins", completed: false},
                    {title: "Authentication Middleware", duration: "10 mins", completed: false},
                    {title: "Error Handling and Logging", duration: "10 mins", completed: false},
                ],
            },
            {
                title: "Payment Integration",
                lectures: 4,
                duration: "65 m",
                lessons: [
                    {title: "Stripe Setup and Configuration", duration: "20 mins", completed: false},
                    {title: "Payment Processing Logic", duration: "20 mins", completed: false},
                    {title: "Webhook Implementation", duration: "15 mins", completed: false},
                    {title: "Payment Success and Error Handling", duration: "10 mins", completed: false},
                ],
            },
            {
                title: "Project Deployment",
                lectures: 4,
                duration: "65 m",
                lessons: [
                    {title: "Production Build Optimization", duration: "15 mins", completed: false},
                    {title: "Environment Variables Setup", duration: "10 mins", completed: false},
                    {title: "Deployment to Vercel/Netlify", duration: "20 mins", completed: false},
                    {title: "Domain Configuration and SSL", duration: "20 mins", completed: false},
                ],
            },
        ],
        description_full:
            "This is the most comprehensive and in-depth JavaScript course with 50 JavaScript projects. JavaScript is currently the most popular programming language in the world. If you are an aspiring web developer, or full stack developer, JavaScript is a must to learn. It also helps you to get high-paying jobs in over the world.",
        comments: [
            {
                id: 1,
                user: "Good lesson!",
                rating: 5,
                comment: "This course is the best course that I ever seen before!",
                date: "2 days ago",
            },
            {
                id: 2,
                user: "This course is the best course that I ever seen before!",
                rating: 5,
                comment: "",
                date: "3 days ago",
            },
            {
                id: 3,
                user: "Good lesson!",
                rating: 4,
                comment: "",
                date: "5 days ago",
            },
        ],
    }

    const toggleSection = (index: number) => {
        setExpandedSections((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
    }


    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            <Header/>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Breadcrumbs */}
                <div className="mb-8" data-aos="fade-up">
                    <Breadcrumbs size="lg" separator={<ChevronRight className="w-4 h-4"/>} className="mb-4">
                        <BreadcrumbItem href="/">Home</BreadcrumbItem>
                        <BreadcrumbItem href="/courses">Courses</BreadcrumbItem>
                        <BreadcrumbItem>{course.title}</BreadcrumbItem>
                    </Breadcrumbs>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Course Header */}
                        <div data-aos="fade-up" data-aos-delay="100">
                            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                                {course.title}
                            </h1>

                            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{course.description}</p>

                            <div className="flex flex-wrap items-center gap-4 mb-6">
                                <div className="flex items-center gap-1">
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-5 h-5 ${i < Math.floor(course.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="font-semibold">{course.rating}</span>
                                    <span className="text-muted-foreground">({course.reviews} ratings)</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Users className="w-4 h-4"/>
                                    <span>{course.students} students</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={course.educator.avatar || "/placeholder.svg"}/>
                                        <AvatarFallback>
                                            {course.educator.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">Course by {course.educator.name}</p>
                                        <p className="text-sm text-muted-foreground">{course.educator.title}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Course Structure */}
                        <Card data-aos="fade-up" data-aos-delay="200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5"/>
                                    Course Structure
                                </CardTitle>
                                <p className="text-muted-foreground">
                                    {course.courseStructure.length} sections • {course.lectures} lectures
                                    • {course.duration} total
                                    duration
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {course.courseStructure.map((section, index) => (
                                    <div key={index} className="border rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => toggleSection(index)}
                                            className="w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 flex items-center justify-center text-white text-sm font-semibold">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold">{section.title}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {section.lectures} lectures • {section.duration}
                                                    </p>
                                                </div>
                                            </div>
                                            {expandedSections.includes(index) ? (
                                                <ChevronUp className="w-5 h-5"/>
                                            ) : (
                                                <ChevronDown className="w-5 h-5"/>
                                            )}
                                        </button>

                                        {expandedSections.includes(index) && (
                                            <div className="border-t bg-muted/20">
                                                {section.lessons.map((lesson, lessonIndex) => (
                                                    <div key={lessonIndex}
                                                         className="p-4 border-b last:border-b-0 flex items-center gap-3">
                                                        <div
                                                            className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                                                            {lesson.completed ? (
                                                                <CheckCircle className="w-4 h-4 text-green-500"/>
                                                            ) : (
                                                                <Play className="w-3 h-3 text-muted-foreground"/>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-medium">{lesson.title}</p>
                                                        </div>
                                                        <span
                                                            className="text-sm text-muted-foreground">{lesson.duration}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Course Description */}
                        <Card data-aos="fade-up" data-aos-delay="300">
                            <CardHeader>
                                <CardTitle>Course Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-relaxed">{course.description_full}</p>
                            </CardContent>
                        </Card>

                        {/* Comments Section */}
                        <Card data-aos="fade-up" data-aos-delay="400">
                            <CardHeader>
                                <CardTitle>Comments</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {course.comments.map((comment) => (
                                    <div key={comment.id} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="w-8 h-8">
                                                <AvatarFallback className="text-xs">
                                                    {comment.user
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm">{comment.user}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-3 h-3 ${i < comment.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span
                                                        className="text-xs text-muted-foreground">{comment.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {comment.comment &&
                                            <p className="text-sm text-muted-foreground ml-10">{comment.comment}</p>}
                                        <Separator className="ml-10"/>
                                    </div>
                                ))}

                                <div className="text-center pt-4">
                                    <Button>Read More</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Course Preview Card */}
                        <Card className="sticky top-24" data-aos="fade-up" data-aos-delay="500">
                            <CardHeader className="p-0">
                                <div className="relative">
                                    <img
                                        src={course.image || "/placeholder.svg"}
                                        alt={course.title}
                                        className="w-full h-48 object-cover rounded-t-lg"
                                    />
                                    <div
                                        className="absolute inset-0 bg-black/20 rounded-t-lg flex items-center justify-center">
                                        <Button size="lg" className="bg-white/90 text-black hover:bg-white">
                                            <Play className="w-5 h-5 mr-2"/>
                                            Preview
                                        </Button>
                                    </div>
                                    {course.discount && (
                                        <Badge
                                            className="absolute top-4 right-4 bg-red-500 text-white">{course.discount}</Badge>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="p-6 space-y-6">
                                <div className="text-center">
                                    <p className="text-red-500 text-sm font-medium mb-2">{course.lastUpdated}</p>
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        <span className="text-3xl font-bold text-cyan-600">{course.price}</span>
                                        <span
                                            className="text-lg text-muted-foreground line-through">{course.originalPrice}</span>
                                    </div>

                                    <Button
                                        size="lg"
                                        className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white mb-3 duration-300 hover:scale-105"
                                    >
                                        Enroll Now
                                    </Button>

                                    <div className="mt-3 flex gap-3 justify-center items-center content-container">
                                        <Button
                                            size="sm"
                                            className=" bg-transparent duration-300 hover:scale-105"
                                            onClick={() => setIsFavorite(!isFavorite)}
                                        >
                                            <Heart size={25}
                                                className={`mr-1 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}/>
                                            {isFavorite ? "Saved" : "Save"}
                                        </Button>
                                        <DropDown/>
                                    </div>
                                </div>

                                <Separator/>

                                <div>
                                    <h3 className="font-semibold mb-3">What's in the course?</h3>
                                    <div className="space-y-3">
                                        {course.features.map((feature, index) => (
                                            <div key={index} className="flex items-start gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"/>
                                                <span className="text-sm text-muted-foreground">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator/>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground"/>
                                        <span>{course.duration}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-muted-foreground"/>
                                        <span>{course.lectures} lectures</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-muted-foreground"/>
                                        <span>English</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-muted-foreground"/>
                                        <span>Mobile friendly</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Download className="w-4 h-4 text-muted-foreground"/>
                                        <span>Downloadable</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-muted-foreground"/>
                                        <span>Certificate</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Footer/>
        </div>
    )
}
