"use client"

import type React from "react"
import {useState, useMemo} from "react"
import {useRouter} from "next/navigation"
import {Breadcrumbs, BreadcrumbItem} from "@nextui-org/react"
import {motion} from "framer-motion"
// import { Button } from "@/components/ui/button"
import {Button} from "@heroui/react"
import {Input} from "@/components/ui/input"
import {Badge} from "@/components/ui/badge"
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Checkbox} from "@/components/ui/checkbox"
import {
    Search,
    Filter,
    Star,
    Clock,
    Users,
    ChevronRight,
    Heart,
    BookOpen,
    Award,
    TrendingUp,
    X,
    Sparkles,
    Zap,
} from "lucide-react"
import {CourseSkeleton} from "@/components/course-skeleton"
import {Header} from "@/components/header"
import {Footer} from "@/components/footer"

export default function CoursesPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [selectedLevel, setSelectedLevel] = useState("all")
    const [selectedEducator, setSelectedEducator] = useState("all")
    const [showFavorites, setShowFavorites] = useState(false)
    const [sortBy, setSortBy] = useState("popular")
    const [showFilters, setShowFilters] = useState(false)
    const [favorites, setFavorites] = useState<number[]>([])

    const courses = [
        {
            id: 1,
            title: "Complete React Development Course",
            description: "Master React from basics to advanced concepts with hands-on projects and real-world applications",
            image: "/react-development-course.png",
            price: "$89.99",
            originalPrice: "$129.99",
            rating: 4.8,
            students: 12543,
            duration: "42 hours",
            level: "Intermediate",
            category: "Web Development",
            educator: "John Smith",
            tags: ["React", "JavaScript", "Frontend"],
            trending: true,
            bestseller: false,
            discount: "31% off",
            lectures: 156,
            projects: 8,
        },
        {
            id: 2,
            title: "AI & Machine Learning Fundamentals",
            description: "Learn AI and ML concepts with Python and real-world applications in data science",
            image: "/ai-saas-development.png",
            price: "$99.99",
            originalPrice: "$149.99",
            rating: 4.9,
            students: 8765,
            duration: "38 hours",
            level: "Beginner",
            category: "Artificial Intelligence",
            educator: "Dr. Sarah Johnson",
            tags: ["Python", "AI", "Machine Learning"],
            trending: false,
            bestseller: true,
        },
        {
            id: 3,
            title: "Full-Stack Web Development",
            description: "Build complete web applications with modern technologies and deployment strategies",
            image: "/react-router-tutorial.png",
            price: "$119.99",
            originalPrice: "$179.99",
            rating: 4.7,
            students: 15432,
            duration: "56 hours",
            level: "Advanced",
            category: "Web Development",
            educator: "Mike Chen",
            tags: ["Full-Stack", "Node.js", "Database"],
            trending: true,
            bestseller: true,
        },
        {
            id: 4,
            title: "Mobile App Development with React Native",
            description: "Create cross-platform mobile apps for iOS and Android with React Native",
            image: "/e-commerce-react-app.png",
            price: "$94.99",
            originalPrice: "$139.99",
            rating: 4.6,
            students: 9876,
            duration: "45 hours",
            level: "Intermediate",
            category: "Mobile Development",
            educator: "Lisa Wang",
            tags: ["React Native", "Mobile", "Cross-platform"],
            trending: false,
            bestseller: false,
        },
        {
            id: 5,
            title: "Data Science with Python",
            description: "Comprehensive data science course covering statistics, visualization, and machine learning",
            image: "/data-science-python.png",
            price: "$109.99",
            originalPrice: "$159.99",
            rating: 4.8,
            students: 11234,
            duration: "48 hours",
            level: "Intermediate",
            category: "Data Science",
            educator: "Dr. Sarah Johnson",
            tags: ["Python", "Data Analysis", "Statistics"],
            trending: true,
            bestseller: false,
        },
        {
            id: 6,
            title: "UI/UX Design Masterclass",
            description: "Learn modern design principles, user research, and prototyping with industry tools",
            image: "/ui-ux-design-concept.png",
            price: "$79.99",
            originalPrice: "$119.99",
            rating: 4.7,
            students: 7890,
            duration: "35 hours",
            level: "Beginner",
            category: "Design",
            educator: "Emma Rodriguez",
            tags: ["UI/UX", "Figma", "Design Thinking"],
            trending: false,
            bestseller: true,
        },
    ]

    const categories = [
        "all",
        "Web Development",
        "Artificial Intelligence",
        "Mobile Development",
        "Data Science",
        "Design",
    ]
    const levels = ["all", "Beginner", "Intermediate", "Advanced"]
    const educators = ["all", ...Array.from(new Set(courses.map((course) => course.educator)))]

    const filteredCourses = useMemo(() => {
        const filtered = courses.filter((course) => {
            const matchesSearch =
                course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            const matchesCategory = selectedCategory === "all" || course.category === selectedCategory
            const matchesLevel = selectedLevel === "all" || course.level === selectedLevel
            const matchesEducator = selectedEducator === "all" || course.educator === selectedEducator
            const matchesFavorites = !showFavorites || favorites.includes(course.id)

            return matchesSearch && matchesCategory && matchesLevel && matchesEducator && matchesFavorites
        })

        switch (sortBy) {
            case "popular":
                filtered.sort((a, b) => b.students - a.students)
                break
            case "rating":
                filtered.sort((a, b) => b.rating - a.rating)
                break
            case "price-low":
                filtered.sort(
                    (a, b) => Number.parseFloat(a.price.replace("$", "")) - Number.parseFloat(b.price.replace("$", "")),
                )
                break
            case "price-high":
                filtered.sort(
                    (a, b) => Number.parseFloat(b.price.replace("$", "")) - Number.parseFloat(a.price.replace("$", "")),
                )
                break
            case "newest":
                // Keep original order for newest
                break
        }

        return filtered
    }, [courses, searchQuery, selectedCategory, selectedLevel, selectedEducator, showFavorites, sortBy, favorites])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        console.log("[v0] Searching for courses:", searchQuery)
        setTimeout(() => setIsLoading(false), 1000)
    }

    const toggleFavorite = (courseId: number) => {
        setFavorites((prev) => (prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]))
    }

    const clearFilters = () => {
        setSelectedCategory("all")
        setSelectedLevel("all")
        setSelectedEducator("all")
        setShowFavorites(false)
        setSearchQuery("")
    }

    const handleCourseClick = (courseId: number) => {
        router.push(`/courses/${courseId}`)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            <Header/>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Breadcrumbs size="lg" separator={<ChevronRight className="w-4 h-4"/>} className="mb-4">
                        <BreadcrumbItem href="/">Home</BreadcrumbItem>
                        <BreadcrumbItem>All Courses</BreadcrumbItem>
                    </Breadcrumbs>

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                                All Courses
                            </h1>
                            <p className="text-lg text-muted-foreground">
                                Discover {filteredCourses.length} courses designed to help you master new skills
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger
                                    className="w-48 bg-white/50 backdrop-blur-sm border-2 hover:border-cyan-300 transition-colors dark:border-cyan-300">
                                    <SelectValue placeholder="Sort by"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="popular">Most Popular</SelectItem>
                                    <SelectItem value="rating">Highest Rated</SelectItem>
                                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                                    <SelectItem value="newest">Newest</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8 space-y-6"
                >
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5"/>
                            <Input
                                type="text"
                                placeholder="Search courses, topics, or instructors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 py-5 text-base border-2 border-cyan-500 bg-white/50 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="py-5 px-8 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                            <Search className="w-5 h-5 mr-1"/>
                            {isLoading ? "Searching..." : "Search"}
                        </Button>
                        <Button
                            type="button"
                            className="py-5 px-6 bg-white/50 backdrop-blur-sm border-1 hover:border-cyan-300 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 dark:border-cyan-300 dark:hover:text-white dark:bg-transparent"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="w-4 h-4 mr-2"/>
                            Filters
                            <Sparkles className="w-4 h-4 ml-2"/>
                        </Button>
                    </form>

                    {showFilters && (
                        <div
                            className="p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/20 shadow-2xl space-y-6 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500">
                                        <Zap className="w-5 h-5 text-white"/>
                                    </div>
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                                        Smart Filters
                                    </h3>
                                </div>
                                <Button variant="ghost" size="sm" onClick={clearFilters}
                                        className="hover:bg-white/20 rounded-lg">
                                    <X className="w-4 h-4 mr-2"/>
                                    Clear All
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"></div>
                                        Category
                                    </label>
                                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                        <SelectTrigger
                                            className="bg-white/50 backdrop-blur-sm border-2 hover:border-cyan-300 rounded-lg">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category} value={category}>
                                                    {category === "all" ? "All Categories" : category}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                                        Level
                                    </label>
                                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                                        <SelectTrigger
                                            className="bg-white/50 backdrop-blur-sm border-2 hover:border-cyan-300 rounded-lg">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {levels.map((level) => (
                                                <SelectItem key={level} value={level}>
                                                    {level === "all" ? "All Levels" : level}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500"></div>
                                        Educator
                                    </label>
                                    <Select value={selectedEducator} onValueChange={setSelectedEducator}>
                                        <SelectTrigger
                                            className="bg-white/50 backdrop-blur-sm border-2 hover:border-cyan-300 rounded-lg">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {educators.map((educator) => (
                                                <SelectItem key={educator} value={educator}>
                                                    {educator === "all" ? "All Educators" : educator}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center space-x-3 pt-8">
                                    <Checkbox
                                        id="favorites"
                                        checked={showFavorites}
                                        onCheckedChange={setShowFavorites}
                                        className="border-2 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500 data-[state=checked]:to-emerald-500"
                                    />
                                    <label
                                        htmlFor="favorites"
                                        className="text-sm font-semibold text-foreground/80 flex items-center gap-2"
                                    >
                                        <Heart className="w-4 h-4 text-red-500"/>
                                        Favorites
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
                    {isLoading
                        ? Array.from({length: 8}).map((_, index) => <CourseSkeleton key={index}/>)
                        : filteredCourses.map((course, index) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0.1 * (index % 4), duration: 0.3 }}
                            >
                            <Card
                                className="group py-0 hover:shadow-2xl transition-all duration-500 hover:scale-101 border-2 hover:border-cyan-200 dark:hover:border-cyan-800 relative overflow-hidden bg-white/50 dark:bg-transparent backdrop-blur-sm cursor-pointer h-full"
                                onClick={() => handleCourseClick(course.id)}
                            >
                                {(course.trending || course.bestseller) && (
                                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                                        {course.trending && (
                                            <Badge
                                                className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                                                <TrendingUp className="w-3 h-3 mr-1"/>
                                                Trending
                                            </Badge>
                                        )}
                                        {course.bestseller && (
                                            <Badge
                                                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                                                <Award className="w-3 h-3 mr-1"/>
                                                Bestseller
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                <CardHeader className="p-0">
                                    <div className="relative overflow-hidden rounded-t-lg">
                                        <img
                                            src={course.image || "/placeholder.svg"}
                                            alt={course.title}
                                            className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div
                                            className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-4 left-4 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow-lg"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleFavorite(course.id)
                                            }}
                                        >
                                            <Heart
                                                className={`w-4 h-4 transition-colors ${favorites.includes(course.id) ? "fill-red-500 text-red-500" : ""}`}
                                            />
                                        </Button>

                                        <div className="absolute bottom-4 left-4 flex gap-2">
                                            <Badge
                                                className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold px-3 py-1 rounded-full">
                                                {course.level}
                                            </Badge>
                                            {course.discount && (
                                                <Badge
                                                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold px-3 py-1 rounded-full">
                                                    {course.discount}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-6">
                                    <div className="mb-4 flex items-center justify-between">
                                        <Badge variant="outline"
                                               className="text-xs font-medium border-cyan-200 text-cyan-700">
                                            {course.category}
                                        </Badge>
                                        <span
                                            className="text-xs text-muted-foreground font-medium">by {course.educator}</span>
                                    </div>

                                    <CardTitle
                                        className="text-lg mb-3 group-hover:text-cyan-600 transition-colors duration-200 line-clamp-2 font-bold">
                                        {course.title}
                                    </CardTitle>

                                    <CardDescription
                                        className="text-sm mb-4 line-clamp-2 text-muted-foreground leading-relaxed">
                                        {course.description}
                                    </CardDescription>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {course.tags.slice(0, 3).map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="secondary"
                                                className="text-xs bg-gradient-to-r from-cyan-50 to-emerald-50 text-cyan-700 border-cyan-200"
                                            >
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 text-sm text-muted-foreground mb-4">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400"/>
                                            <span className="font-medium">{course.rating}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4"/>
                                            <span className="font-medium">{course.students.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4"/>
                                            <span className="font-medium">{course.duration}</span>
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="p-6 pb-10 pt-0">
                                    <div className="flex flex-col gap-4 items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <span className="text-3xl font-bold text-cyan-600">{course.price}</span>
                                            <span
                                                className="text-sm text-muted-foreground line-through">{course.originalPrice}</span>
                                        </div>
                                        {/*<Button*/}
                                        {/*    className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25 rounded-lg font-semibold"*/}
                                        {/*    onClick={(e) => e.stopPropagation()}*/}
                                        {/*>*/}
                                        {/*    <BookOpen className="w-4 h-4 mr-2"/>*/}
                                        {/*    Enroll Now*/}
                                        {/*</Button>*/}
                                    </div>
                                </CardFooter>
                            </Card>
                            </motion.div>
                        ))}
                </div>

                {!isLoading && filteredCourses.length === 0 && (
                    <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4"/>
                        <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                        <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
                        <Button onClick={clearFilters}>
                            Clear all filters
                        </Button>
                    </div>
                )}
            </div>

            <Footer/>
        </div>
    )
}
