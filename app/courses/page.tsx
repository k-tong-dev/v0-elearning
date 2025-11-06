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
import {CourseCard} from "@/components/courses/CourseCard"
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import {Footer} from "@/components/ui/footers/footer"
import {CourseLoading} from "@/components/courses/course-loading"
import { getCourseCategories, CourseCategory } from "@/integrations/strapi/courseCategory"
import { getCourseLevels, CourseLevel } from "@/integrations/strapi/courseLevel"

export default function CoursesPage() {
    const router = useRouter()
    const [isSearching, setIsSearching] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [selectedLevel, setSelectedLevel] = useState("all")
    const [selectedEducator, setSelectedEducator] = useState("all")
    const [showFavorites, setShowFavorites] = useState(false)
    const [sortBy, setSortBy] = useState("popular")
    const [showFilters, setShowFilters] = useState(false)
    const [favorites, setFavorites] = useState<number[]>([])
    const [categories, setCategories] = useState<CourseCategory[]>([])
    const [isLoadingCategories, setIsLoadingCategories] = useState(true)
    const [levels, setLevels] = useState<CourseLevel[]>([])
    const [isLoadingLevels, setIsLoadingLevels] = useState(true)

    // Infinite scroll states
    const initialCoursesToShow = 10
    const coursesToLoadIncrement = 10
    const [coursesToDisplayCount, setCoursesToDisplayCount] = useState(initialCoursesToShow)
    const [hasMore, setHasMore] = useState(true)
    const loadingRef = useRef(null)

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

    const courses = [
        {
            id: 1, title: "Complete React Development Course",
            description: "Master React from basics to advanced concepts with hands-on projects and real-world applications",
            image: "/react-development-course.png", price: "$89.99", originalPrice: "$129.99", rating: 4.8, students: 12543,
            duration: "42 hours", level: "Intermediate", category: "Web Development", educator: "John Smith", educatorId: "1",
            tags: ["React", "JavaScript", "Frontend"], trending: true, bestseller: false, discount: "31% off", lectures: 156, projects: 8,
        },
        {
            id: 2, title: "AI & Machine Learning Fundamentals",
            description: "Learn AI and ML concepts with Python and real-world applications in data science",
            image: "/ai-saas-development.png", price: "$99.99", originalPrice: "$149.99", rating: 4.9, students: 8765,
            duration: "38 hours", level: "Beginner", category: "Artificial Intelligence", educator: "Dr. Sarah Johnson", educatorId: "2",
            tags: ["Python", "AI", "Machine Learning"], trending: false, bestseller: true,
        },
        {
            id: 3, title: "Full-Stack Web Development",
            description: "Build complete web applications with modern technologies and deployment strategies",
            image: "/react-router-tutorial.png", price: "$119.99", originalPrice: "$179.99", rating: 4.7, students: 15432,
            duration: "56 hours", level: "Advanced", category: "Web Development", educator: "Mike Chen", educatorId: "3",
            tags: ["Full-Stack", "Node.js", "Database"], trending: true, bestseller: true,
        },
        {
            id: 4, title: "Mobile App Development with React Native",
            description: "Create cross-platform mobile apps for iOS and Android with React Native",
            image: "/e-commerce-react-app.png", price: "$94.99", originalPrice: "$139.99", rating: 4.6, students: 9876,
            duration: "45 hours", level: "Intermediate", category: "Mobile Development", educator: "Lisa Wang", educatorId: "6",
            tags: ["React Native", "Mobile", "Cross-platform"], trending: false, bestseller: false,
        },
        {
            id: 5, title: "Data Science with Python",
            description: "Comprehensive data science course covering statistics, visualization, and machine learning",
            image: "/data-science-python.png", price: "$109.99", originalPrice: "$159.99", rating: 4.8, students: 11234,
            duration: "48 hours", level: "Intermediate", category: "Data Science", educator: "Dr. Sarah Johnson", educatorId: "2",
            tags: ["Python", "Data Analysis", "Statistics"], trending: true, bestseller: false,
        },
        {
            id: 6, title: "UI/UX Design Masterclass",
            description: "Learn modern design principles, user research, and prototyping with industry tools",
            image: "/ui-ux-design-concept.png", price: "$79.99", originalPrice: "$119.99", rating: 4.7, students: 7890,
            duration: "35 hours", level: "Beginner", category: "Design", educator: "Emma Rodriguez", educatorId: "3",
            tags: ["UI/UX", "Figma", "Design Thinking"], trending: false, bestseller: true,
        },
        {
            id: 7, title: "Advanced TypeScript for Developers",
            description: "Deep dive into advanced TypeScript features and patterns for robust applications.",
            image: "https://images.unsplash.com/photo-1617042375876-a13e36732a04?w=800&h=400&fit=crop",
            price: "$99.99", originalPrice: "$149.99", rating: 4.9, students: 6500, duration: "30 hours", level: "Advanced",
            category: "Web Development", educator: "John Smith", educatorId: "1", tags: ["TypeScript", "Frontend", "Backend"],
            trending: true, bestseller: false,
        },
        {
            id: 8, title: "Cloud Computing with AWS",
            description: "Learn to deploy, manage, and scale applications on Amazon Web Services.",
            image: "https://images.unsplash.com/photo-1581092336000-3e2f2b2f2b2f?w=800&h=400&fit=crop",
            price: "$129.99", originalPrice: "$199.99", rating: 4.8, students: 7200, duration: "50 hours", level: "Intermediate",
            category: "Cloud Computing", educator: "Dr. Sarah Johnson", educatorId: "2", tags: ["AWS", "Cloud", "DevOps"],
            trending: false, bestseller: true,
        },
        {
            id: 9, title: "Cybersecurity Fundamentals",
            description: "An introduction to cybersecurity concepts, threats, and protective measures.",
            image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop",
            price: "$79.99", originalPrice: "$119.99", rating: 4.6, students: 9100, duration: "25 hours", level: "Beginner",
            category: "Cybersecurity", educator: "Mike Chen", educatorId: "3", tags: ["Security", "Networking", "Privacy"],
            trending: true, bestseller: false,
        },
        {
            id: 10, title: "Game Development with Unity",
            description: "Create 2D and 3D games using the Unity engine and C#.",
            image: "https://images.unsplash.com/photo-1542744095-291d1f67b221?w=800&h=400&fit=crop",
            price: "$109.99", originalPrice: "$169.99", rating: 4.7, students: 5800, duration: "40 hours", level: "Intermediate",
            category: "Game Development", educator: "Lisa Wang", educatorId: "6", tags: ["Unity", "C#", "Game Design"],
            trending: false, bestseller: false,
        },
        {
            id: 11, title: "Blockchain Development with Ethereum",
            description: "Learn to build decentralized applications (dApps) on the Ethereum blockchain.",
            image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&h=400&fit=crop",
            price: "$139.99", originalPrice: "$209.99", rating: 4.8, students: 4200, duration: "45 hours", level: "Advanced",
            category: "Blockchain", educator: "Emma Rodriguez", educatorId: "3", tags: ["Blockchain", "Ethereum", "Solidity"],
            trending: true, bestseller: true,
        },
        {
            id: 12, title: "Digital Marketing Fundamentals",
            description: "An essential guide to digital marketing strategies and tools.",
            image: "https://images.unsplash.com/photo-1557804506-669a67965da0?w=800&h=400&fit=crop",
            price: "$69.99", originalPrice: "$99.99", rating: 4.5, students: 10500, duration: "20 hours", level: "Beginner",
            category: "Business", educator: "David Park", educatorId: "5", tags: ["Marketing", "SEO", "Social Media"],
            trending: false, bestseller: false,
        },
        {
            id: 13, title: "Python for Data Analysis",
            description: "Master data manipulation and analysis using Python, Pandas, and NumPy.",
            image: "https://images.unsplash.com/photo-1526374965328-7f66d40afb53?w=800&h=400&fit=crop",
            price: "$84.99", originalPrice: "$124.99", rating: 4.7, students: 9800, duration: "32 hours", level: "Intermediate",
            category: "Data Science", educator: "Dr. Sarah Johnson", educatorId: "2", tags: ["Python", "Data Analysis", "Pandas"],
            trending: true, bestseller: false,
        },
        {
            id: 14, title: "Frontend Development with Vue.js",
            description: "Build modern and reactive user interfaces with Vue.js.",
            image: "https://images.unsplash.com/photo-1610563166150-b34df4f3dd69?w=800&h=400&fit=crop",
            price: "$89.99", originalPrice: "$139.99", rating: 4.6, students: 7100, duration: "35 hours", level: "Intermediate",
            category: "Web Development", educator: "John Smith", educatorId: "1", tags: ["Vue.js", "Frontend", "JavaScript"],
            trending: false, bestseller: true,
        },
        {
            id: 15, title: "Backend with Node.js and GraphQL",
            description: "Develop powerful and flexible APIs using Node.js, Express, and GraphQL.",
            image: "https://images.unsplash.com/photo-1599305445671-ac291c9a87d9?w=800&h=400&fit=crop",
            price: "$114.99", originalPrice: "$174.99", rating: 4.8, students: 6200, duration: "40 hours", level: "Advanced",
            category: "Web Development", educator: "Mike Chen", educatorId: "3", tags: ["Node.js", "GraphQL", "Backend"],
            trending: true, bestseller: false,
        },
        {
            id: 16, title: "Mobile UI/UX Design with Figma",
            description: "Design stunning mobile app interfaces from scratch using Figma.",
            image: "https://images.unsplash.com/photo-1616763355548-f4993bb4f0d4?w=800&h=400&fit=crop",
            price: "$74.99", originalPrice: "$109.99", rating: 4.7, students: 8300, duration: "28 hours", level: "Beginner",
            category: "Design", educator: "Emma Rodriguez", educatorId: "3", tags: ["Figma", "UI/UX", "Mobile Design"],
            trending: false, bestseller: true,
        },
        {
            id: 17, title: "Introduction to Quantum Computing",
            description: "Explore the fascinating world of quantum mechanics and quantum computing.",
            image: "https://images.unsplash.com/photo-1626786926530-2f2f2f2f2f2f?w=800&h=400&fit=crop",
            price: "$149.99", originalPrice: "$229.99", rating: 4.9, students: 3100, duration: "35 hours", level: "Advanced",
            category: "Science & Tech", educator: "Dr. Sarah Johnson", educatorId: "2", tags: ["Quantum", "Physics", "Computing"],
            trending: true, bestseller: false,
        },
        {
            id: 18, title: "Mastering SQL for Data Science",
            description: "Learn SQL from basic queries to advanced database management for data analysis.",
            image: "https://images.unsplash.com/photo-1542744095-291d1f67b221?w=800&h=400&fit=crop",
            price: "$79.99", originalPrice: "$119.99", rating: 4.6, students: 11800, duration: "25 hours", level: "Beginner",
            category: "Data Science", educator: "David Park", educatorId: "5", tags: ["SQL", "Databases", "Data Analysis"],
            trending: false, bestseller: false,
        },
        {
            id: 19, title: "DevOps Fundamentals with Docker & Kubernetes",
            description: "Understand and implement DevOps practices using Docker and Kubernetes.",
            image: "https://images.unsplash.com/photo-1605792657620-f6e2f2f2f2f2?w=800&h=400&fit=crop",
            price: "$129.99", originalPrice: "$189.99", rating: 4.8, students: 5500, duration: "48 hours", level: "Advanced",
            category: "DevOps", educator: "Lisa Wang", educatorId: "6", tags: ["DevOps", "Docker", "Kubernetes"],
            trending: true, bestseller: true,
        },
        {
            id: 20, title: "Introduction to Ethical Hacking",
            description: "Learn the basics of ethical hacking and penetration testing.",
            image: "https://images.unsplash.com/photo-1581092336000-3e2f2b2f2b2f?w=800&h=400&fit=crop",
            price: "$99.99", originalPrice: "$149.99", rating: 4.7, students: 8900, duration: "30 hours", level: "Intermediate",
            category: "Cybersecurity", educator: "Mike Chen", educatorId: "3", tags: ["Hacking", "Security", "Penetration Testing"],
            trending: false, bestseller: false,
        },
        {
            id: 21, title: "Machine Learning with TensorFlow",
            description: "Build and train machine learning models using Google's TensorFlow library.",
            image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop",
            price: "$119.99", originalPrice: "$179.99", rating: 4.9, students: 7300, duration: "40 hours", level: "Advanced",
            category: "Artificial Intelligence", educator: "Dr. Sarah Johnson", educatorId: "2", tags: ["Machine Learning", "TensorFlow", "AI"],
            trending: true, bestseller: true,
        },
        {
            id: 22, title: "Web Accessibility Masterclass",
            description: "Learn to build inclusive web experiences for all users.",
            image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=400&fit=crop",
            price: "$79.99", originalPrice: "$119.99", rating: 4.7, students: 4500, duration: "25 hours", level: "Intermediate",
            category: "Web Development", educator: "Emma Rodriguez", educatorId: "3", tags: ["Accessibility", "Frontend", "UX"],
            trending: false, bestseller: false,
        },
        {
            id: 23, title: "Introduction to Data Structures & Algorithms",
            description: "Fundamental concepts of data structures and algorithms for problem-solving.",
            image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=400&fit=crop",
            price: "$69.99", originalPrice: "$99.99", rating: 4.8, students: 13000, duration: "30 hours", level: "Beginner",
            category: "Computer Science", educator: "John Smith", educatorId: "1", tags: ["Algorithms", "Data Structures", "Programming"],
            trending: true, bestseller: true,
        },
        {
            id: 24, title: "Full-Stack with Django & React",
            description: "Build robust full-stack applications using Django REST Framework and React.",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop",
            price: "$129.99", originalPrice: "$189.99", rating: 4.7, students: 5900, duration: "55 hours", level: "Advanced",
            category: "Web Development", educator: "Mike Chen", educatorId: "3", tags: ["Django", "React", "Python", "Full-Stack"],
            trending: false, bestseller: false,
        },
    ]

    const levelOptions = ["all", ...levels.map((level) => level.name)]
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
                filtered.reverse();
                break;
        }

        return filtered
    }, [courses, searchQuery, selectedCategory, selectedLevel, selectedEducator, showFavorites, sortBy, favorites])

    // Courses to display based on infinite scroll
    const displayedCourses = useMemo(() => {
        return filteredCourses.slice(0, coursesToDisplayCount);
    }, [filteredCourses, coursesToDisplayCount]);

    // Effect to update hasMore when filteredCourses or coursesToDisplayCount changes
    useEffect(() => {
        setHasMore(coursesToDisplayCount < filteredCourses.length);
    }, [coursesToDisplayCount, filteredCourses.length]);

    // Intersection Observer for infinite scrolling
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isSearching) {
                    setCoursesToDisplayCount((prevCount) => prevCount + coursesToLoadIncrement);
                }
            },
            { threshold: 1.0 }
        );

        if (loadingRef.current) {
            observer.observe(loadingRef.current);
        }

        return () => {
            if (loadingRef.current) {
                observer.unobserve(loadingRef.current);
            }
        };
    }, [hasMore, isSearching, coursesToDisplayCount]);

    // Reset infinite scroll states when filters change
    useEffect(() => {
        setCoursesToDisplayCount(initialCoursesToShow);
        setHasMore(true);
    }, [searchQuery, selectedCategory, selectedLevel, selectedEducator, showFavorites, sortBy]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSearching(true)
        setCoursesToDisplayCount(initialCoursesToShow);
        setHasMore(true);
        console.log("[v0] Searching for courses:", searchQuery)
        setTimeout(() => setIsSearching(false), 1000)
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
        setCoursesToDisplayCount(initialCoursesToShow);
        setHasMore(true);
    }

    const handleCourseClick = (courseId: number) => {
        console.log('Course card clicked - navigating to course detail:', courseId)
        router.push(`/courses/${courseId}`)
    }

    const handleEnrollClick = (courseId: number) => {
        console.log('Enroll button clicked - starting enrollment process:', courseId)
        router.push(`/courses/${courseId}`)
    }

    // Dynamic category list from Strapi or fallback
    const categoryList = categories.length > 0 
        ? ["all", ...categories.map(cat => cat.name)]
        : ["all", "Web Development", "Artificial Intelligence", "Mobile Development", "Data Science", "Design", "Cloud Computing", "Cybersecurity", "Game Development", "Blockchain", "Business", "Science & Tech", "DevOps", "Computer Science"]

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

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28 relative z-10">
                {/* Category Filter - Compact Scrollable Pills */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {categoryList.map((category) => (
                            <button
                                key={category}
                                onClick={() => { setSelectedCategory(category); setCoursesToDisplayCount(initialCoursesToShow); }}
                                className={`px-4 py-2 rounded-full backdrop-blur-md border transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                                    selectedCategory === category
                                        ? "bg-gradient-to-r from-blue-500/90 to-purple-500/90 text-white border-blue-400 shadow-lg"
                                        : "bg-white/80 dark:bg-slate-900/10 text-slate-900 dark:text-white border-slate-200 dark:border-white/20 hover:border-blue-400/50"
                                }`}
                            >
                                {category === "all" ? "All" : category}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Search and Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8 space-y-6"
                >
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 dark:text-gray-400 w-5 h-5 z-10"/>
                            <Input
                                type="text"
                                placeholder="Search courses, topics, or instructors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={() => setCoursesToDisplayCount(initialCoursesToShow)}
                                className="liquid-glass-input focus-visible:ring-0 pl-12 py-5 text-base rounded-xl"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                disabled={isSearching}
                                className="py-5 px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white"
                            >
                                <Search className="w-5 h-5 mr-1"/>
                                {isSearching ? "Searching..." : "Search"}
                            </Button>
                            <Button
                                type="button"
                                variant="bordered"
                                className="liquid-glass-button py-5 px-6 border-2 rounded-xl hover:scale-105 transition-all duration-300"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="w-4 h-4 mr-2"/>
                                Filters
                                {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                            </Button>
                        </div>
                    </form>

                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="liquid-glass-card p-8 rounded-2xl space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                                        <Zap className="w-5 h-5 text-white"/>
                                    </div>
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        Smart Filters
                                    </h3>
                                </div>
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                    <X className="w-4 h-4 mr-2"/>
                                    Clear All
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                                        Sort By
                                    </label>
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="liquid-glass-card border-2 hover:border-blue-300 rounded-xl">
                                            <SelectValue/>
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

                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                                        Level
                                    </label>
                                    <Select value={selectedLevel} onValueChange={(value) => {setSelectedLevel(value); setCoursesToDisplayCount(initialCoursesToShow);}}>
                                        <SelectTrigger className="liquid-glass-card border-2 hover:border-blue-300 rounded-xl">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {levelOptions.map((level) => (
                                                <SelectItem key={level} value={level}>
                                                    {level === "all" ? "All Levels" : level}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500"></div>
                                        Educator
                                    </label>
                                    <Select value={selectedEducator} onValueChange={(value) => {setSelectedEducator(value); setCoursesToDisplayCount(initialCoursesToShow);}}>
                                        <SelectTrigger className="liquid-glass-card border-2 hover:border-blue-300 rounded-xl">
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
                                    <Button
                                        variant={showFavorites ? "solid" : "bordered"}
                                        onClick={() => {setShowFavorites(!showFavorites); setCoursesToDisplayCount(initialCoursesToShow);}}
                                        className={`flex items-center gap-2 ${showFavorites ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'} rounded-xl`}
                                    >
                                        <Heart className={`w-4 h-4 ${showFavorites ? 'fill-white' : 'text-red-500'}`} />
                                        Favorites
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Courses Grid with Liquid Glass Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {isSearching
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
                                />
                            </div>
                        ))}
                </div>

                {!isSearching && filteredCourses.length === 0 && (
                    <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-slate-600 dark:text-gray-400 mx-auto mb-4"/>
                        <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">No courses found</h3>
                        <p className="text-slate-600 dark:text-gray-300 mb-4">Try adjusting your search or filters</p>
                        <Button onClick={clearFilters} className="bg-gradient-to-r from-blue-500 to-purple-600">
                            Clear all filters
                        </Button>
                    </div>
                )}

                {/* Infinite scroll loading indicator */}
                {hasMore && filteredCourses.length > 0 && (
                    <div ref={loadingRef} className="text-center">
                        <CourseLoading/>
                        <motion.p 
                            className="text-slate-600 dark:text-gray-400 mt-4 text-sm font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            Loading more courses...
                        </motion.p>
                    </div>
                )}
            </div>

            <Footer/>
        </div>
    )
}
