"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import { Footer } from "@/components/ui/footers/footer"
import { Button } from "@heroui/react"
import { useCart } from "@/contexts/CartContext"
import { ShoppingBag, Filter, Search, Grid, List, SortAsc } from "lucide-react"
import { getPublicCourseCourses } from "@/integrations/strapi/courseCourse"
import { getCourseCategories } from "@/integrations/strapi/courseCategory"
import { getCourseLevels } from "@/integrations/strapi/courseLevel"
import Image from "next/image"
import { toast } from "sonner"

export default function ShopPage() {
    const router = useRouter()
    const { addToCart, isInCart } = useCart()
    const [courses, setCourses] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [levels, setLevels] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [selectedLevel, setSelectedLevel] = useState<string>("all")
    const [sortBy, setSortBy] = useState<"newest" | "price_low" | "price_high" | "popular">("newest")

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true)
                const [coursesData, categoriesData, levelsData] = await Promise.all([
                    getPublicCourseCourses(),
                    getCourseCategories(),
                    getCourseLevels()
                ])
                
                // Only show paid courses in shop
                const paidCourses = coursesData.filter(c => c.is_paid && c.Price > 0)
                setCourses(paidCourses)
                setCategories(categoriesData)
                setLevels(levelsData)
            } catch (error) {
                console.error("Failed to load shop data:", error)
                toast.error("Failed to load courses")
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    const filteredCourses = useMemo(() => {
        let filtered = courses.filter(course => {
            const matchesSearch = !searchQuery || 
                course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.description?.toLowerCase().includes(searchQuery.toLowerCase())
            
            const matchesCategory = selectedCategory === "all" || 
                course.course_categories?.some((c: any) => c.name === selectedCategory)
            
            const matchesLevel = selectedLevel === "all" || 
                course.course_level?.name === selectedLevel
            
            return matchesSearch && matchesCategory && matchesLevel
        })

        // Sort
        switch (sortBy) {
            case "price_low":
                filtered.sort((a, b) => (a.Price || 0) - (b.Price || 0))
                break
            case "price_high":
                filtered.sort((a, b) => (b.Price || 0) - (a.Price || 0))
                break
            case "popular":
                filtered.sort((a, b) => (b.enrollment_count || 0) - (a.enrollment_count || 0))
                break
            case "newest":
            default:
                filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                break
        }

        return filtered
    }, [courses, searchQuery, selectedCategory, selectedLevel, sortBy])

    const handleAddToCart = (course: any) => {
        addToCart({
            id: course.id,
            title: course.name,
            description: course.description || "",
            image: course.preview_url || "/placeholder.svg",
            priceValue: course.Price || 0,
            price: `$${(course.Price || 0).toFixed(2)}`,
            educator: course.instructors?.[0]?.name || "Unknown"
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-purple-950/30 dark:to-pink-950/30">
            <HeaderUltra />
            
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500">
                            <ShoppingBag className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Course Shop
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                Browse and purchase premium courses
                            </p>
                        </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                        
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                        
                        <select
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">All Levels</option>
                            {levels.map(level => (
                                <option key={level.id} value={level.name}>{level.name}</option>
                            ))}
                        </select>
                        
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="newest">Newest</option>
                            <option value="price_low">Price: Low to High</option>
                            <option value="price_high">Price: High to Low</option>
                            <option value="popular">Most Popular</option>
                        </select>
                        
                        <div className="flex gap-2">
                            <Button
                                isIconOnly
                                variant={viewMode === "grid" ? "solid" : "light"}
                                color={viewMode === "grid" ? "primary" : "default"}
                                onPress={() => setViewMode("grid")}
                            >
                                <Grid className="w-5 h-5" />
                            </Button>
                            <Button
                                isIconOnly
                                variant={viewMode === "list" ? "solid" : "light"}
                                color={viewMode === "list" ? "primary" : "default"}
                                onPress={() => setViewMode("list")}
                            >
                                <List className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Results Count */}
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""}
                </p>

                {/* Courses Grid/List */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 animate-pulse">
                                <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-xl mb-4" />
                                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
                                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-slate-600 dark:text-slate-400">No courses found</p>
                    </div>
                ) : (
                    <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                        {filteredCourses.map((course, index) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${viewMode === "list" ? "flex gap-4 p-4" : "p-4"}`}
                                onClick={() => router.push(`/courses/${course.id}`)}
                            >
                                <div className={viewMode === "list" ? "w-48 h-32 relative flex-shrink-0" : "aspect-video relative mb-4"}>
                                    <Image
                                        src={course.preview_url || "/placeholder.svg"}
                                        alt={course.name}
                                        fill
                                        className="object-cover rounded-xl"
                                    />
                                </div>
                                
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-slate-900 dark:text-white">
                                        {course.name}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                                        {course.description}
                                    </p>
                                    
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                ${(course.Price || 0).toFixed(2)}
                                            </p>
                                            {course.instructors?.[0] && (
                                                <p className="text-xs text-slate-500">
                                                    by {course.instructors[0].name}
                                                </p>
                                            )}
                                        </div>
                                        
                                        <Button
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                            size="sm"
                                            isDisabled={isInCart(course.id)}
                                            onPress={(e) => {
                                                e.stopPropagation()
                                                handleAddToCart(course)
                                            }}
                                        >
                                            {isInCart(course.id) ? "In Cart" : "Add to Cart"}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
            
            <Footer />
        </div>
    )
}

