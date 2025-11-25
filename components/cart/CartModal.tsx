"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Chip } from "@heroui/react"
import { useCart } from "@/contexts/CartContext"
import { ShoppingCart, Trash2, CreditCard, CheckCircle, Maximize2, Minimize2, X, Heart, BookOpen, Star, Clock, GripVertical, Sparkles } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { getPublicCourseCourses } from "@/integrations/strapi/courseCourse"
import { cn } from "@/utils/utils"

interface CartModalProps {
    isOpen: boolean
    onClose: () => void
}

type TabType = "cart" | "favorites" | "recommended"

export function CartModal({ isOpen, onClose }: CartModalProps) {
    const router = useRouter()
    const { items, removeFromCart, clearCart, totalPrice, totalPriceFormatted, itemCount, addToCart, isInCart } = useCart()
    const { isAuthenticated } = useAuth()
    const [isProcessing, setIsProcessing] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [activeTab, setActiveTab] = useState<TabType>("cart")
    const [recommendedCourses, setRecommendedCourses] = useState<any[]>([])
    const [isLoadingRecommended, setIsLoadingRecommended] = useState(false)

    // Load recommended courses when modal opens
    useEffect(() => {
        if (isOpen && recommendedCourses.length === 0) {
            loadRecommendedCourses()
        }
    }, [isOpen])

    const loadRecommendedCourses = async () => {
        try {
            setIsLoadingRecommended(true)
            const courses = await getPublicCourseCourses()
            
            // Filter: only paid courses, not in cart, random 6
            const paidCourses = courses.filter(c => c.is_paid && c.Price > 0 && !items.some(item => item.courseId === c.id))
            const shuffled = paidCourses.sort(() => 0.5 - Math.random())
            setRecommendedCourses(shuffled.slice(0, 6))
        } catch (error) {
            console.error("Failed to load recommended courses:", error)
        } finally {
            setIsLoadingRecommended(false)
        }
    }

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            toast.error("Please sign in to checkout")
            onClose()
            router.push("/auth/start")
            return
        }

        setIsProcessing(true)
        
        // Simulate payment processing
        setTimeout(() => {
            toast.success("Payment successful! Enrolling in courses...")
            clearCart()
            setIsProcessing(false)
            onClose()
            router.push("/dashboard?tab=my-courses")
        }, 2000)
    }

    const handleAddRecommendedToCart = (course: any) => {
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

    const tabs = [
        { id: "cart" as TabType, label: "Cart", icon: ShoppingCart, count: itemCount },
        { id: "favorites" as TabType, label: "Favorites", icon: Heart, count: 0 },
        { id: "recommended" as TabType, label: "For You", icon: Sparkles, count: recommendedCourses.length },
    ]

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size={isFullscreen ? "full" : "5xl"}
            scrollBehavior="inside"
            backdrop="blur"
            classNames={{
                wrapper: "items-center justify-center",
                base: "bg-transparent shadow-none pointer-events-none",
            }}
            motionProps={{
                variants: {
                    enter: { opacity: 1, scale: 1 },
                    exit: { opacity: 0, scale: 0.95 },
                },
            }}
        >
            <ModalContent className="bg-transparent shadow-none pointer-events-none">
                {(onClose) => (
                    <motion.div
                        drag={!isFullscreen}
                        dragMomentum={false}
                        dragElastic={0.1}
                        dragConstraints={{ left: -200, right: 200, top: -100, bottom: 100 }}
                        className={cn(
                            "pointer-events-auto rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col",
                            isFullscreen ? "w-screen h-screen rounded-none" : "max-w-7xl w-full max-h-[90vh]"
                        )}
                    >
                        {/* Header with drag handle */}
                        <ModalHeader 
                            className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing select-none"
                        >
                            <div className="flex items-center gap-3">
                                {!isFullscreen && (
                                    <GripVertical className="w-5 h-5 text-slate-400" />
                                )}
                                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                                    <ShoppingCart className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Shopping Hub</h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                                        Manage your learning journey
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => setIsFullscreen(!isFullscreen)}
                                >
                                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </Button>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={onClose}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </ModalHeader>
                        
                        <ModalBody className="p-0">
                            <div className="flex h-full">
                                {/* Sidebar Navigation */}
                                <div className="w-64 border-r border-slate-200 dark:border-slate-700 p-4 space-y-2">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon
                                        const isActive = activeTab === tab.id
                                        return (
                                            <motion.button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all ${
                                                    isActive
                                                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                                                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                                }`}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon className="w-5 h-5" />
                                                    <span className="font-semibold">{tab.label}</span>
                                                </div>
                                                {tab.count > 0 && (
                                                    <Chip 
                                                        size="sm" 
                                                        className={isActive ? "bg-white/20" : "bg-blue-100 dark:bg-blue-900"}
                                                    >
                                                        {tab.count}
                                                    </Chip>
                                                )}
                                            </motion.button>
                                        )
                                    })}
                                    
                                    {/* Pro Tip Box */}
                                    <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                                        <div className="flex items-start gap-2">
                                            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-100 mb-1">
                                                    Pro Tip
                                                </h4>
                                                <p className="text-xs text-purple-700 dark:text-purple-300">
                                                    Save more when you buy multiple courses together!
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Content Area */}
                                <div className="flex-1 p-6 overflow-y-auto">
                                    <AnimatePresence mode="wait">
                                        {activeTab === "cart" && (
                                            <motion.div
                                                key="cart"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                {items.length === 0 ? (
                                                    <div className="text-center py-20">
                                                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                            <ShoppingCart className="w-12 h-12 text-slate-400 dark:text-slate-600" />
                                                        </div>
                                                        <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Your cart is empty</h3>
                                                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                                                            Add courses to start learning today!
                                                        </p>
                                                        <Button
                                                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                                                            onPress={() => {
                                                                onClose()
                                                                router.push("/courses")
                                                            }}
                                                        >
                                                            Browse Courses
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                        {/* Cart Items */}
                                                        <div className="lg:col-span-2 space-y-3">
                                                            <h3 className="text-lg font-bold mb-4">Cart Items ({itemCount})</h3>
                                                            <AnimatePresence mode="popLayout">
                                                                {items.map((item, index) => (
                                                                    <motion.div
                                                                        key={item.id}
                                                                        initial={{ opacity: 0, y: 20 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                                        transition={{ delay: index * 0.05 }}
                                                                        className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all"
                                                                    >
                                                                        <div className="flex gap-4">
                                                                            <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                                                                                <Image
                                                                                    src={item.image}
                                                                                    alt={item.title}
                                                                                    fill
                                                                                    className="object-cover"
                                                                                />
                                                                            </div>
                                                                            
                                                                            <div className="flex-1 min-w-0">
                                                                                <h4 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1 mb-1">
                                                                                    {item.title}
                                                                                </h4>
                                                                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                                                                                    {item.description}
                                                                                </p>
                                                                                <p className="text-xs text-slate-500 dark:text-slate-500">
                                                                                    by {item.instructor}
                                                                                </p>
                                                                            </div>
                                                                            
                                                                            <div className="flex flex-col items-end justify-between">
                                                                                <Button
                                                                                    isIconOnly
                                                                                    variant="light"
                                                                                    color="danger"
                                                                                    size="sm"
                                                                                    onPress={() => removeFromCart(item.courseId)}
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </Button>
                                                                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                                                    {item.priceFormatted}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                ))}
                                                            </AnimatePresence>
                                                            
                                                            <Button
                                                                variant="light"
                                                                color="danger"
                                                                startContent={<Trash2 className="w-4 h-4" />}
                                                                onPress={clearCart}
                                                                className="w-full mt-4"
                                                            >
                                                                Clear Cart
                                                            </Button>
                                                        </div>

                                                        {/* Order Summary */}
                                                        <div className="lg:col-span-1">
                                                            <div className="sticky top-0 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                                                    Order Summary
                                                                </h3>
                                                                
                                                                <div className="space-y-3 py-4 border-y border-slate-200 dark:border-slate-700">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                                                                        <span className="font-semibold">{totalPriceFormatted}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-slate-600 dark:text-slate-400">Tax</span>
                                                                        <span className="font-semibold">$0.00</span>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="flex justify-between text-xl font-bold text-slate-900 dark:text-white">
                                                                    <span>Total</span>
                                                                    <span className="text-blue-600 dark:text-blue-400">{totalPriceFormatted}</span>
                                                                </div>
                                                                
                                                                <Button
                                                                    className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold text-lg h-12"
                                                                    startContent={isProcessing ? null : <CreditCard className="w-5 h-5" />}
                                                                    onPress={handleCheckout}
                                                                    isLoading={isProcessing}
                                                                >
                                                                    {isProcessing ? "Processing..." : "Checkout Now"}
                                                                </Button>
                                                                
                                                                <div className="space-y-2 pt-4">
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                                        <span className="text-slate-700 dark:text-slate-300">30-day money-back guarantee</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                                        <span className="text-slate-700 dark:text-slate-300">Lifetime access to courses</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        {activeTab === "favorites" && (
                                            <motion.div
                                                key="favorites"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="text-center py-20"
                                            >
                                                <Heart className="w-16 h-16 text-rose-400 mx-auto mb-4" />
                                                <h3 className="text-2xl font-bold mb-2">Favorites Coming Soon!</h3>
                                                <p className="text-slate-600 dark:text-slate-400">
                                                    Save your favorite courses here for quick access
                                                </p>
                                            </motion.div>
                                        )}

                                        {activeTab === "recommended" && (
                                            <motion.div
                                                key="recommended"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div className="flex items-center justify-between mb-6">
                                                    <div>
                                                        <h3 className="text-2xl font-bold">Recommended For You</h3>
                                                        <p className="text-slate-600 dark:text-slate-400">Based on popular courses</p>
                                                    </div>
                                                </div>

                                                {isLoadingRecommended ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {Array.from({ length: 6 }).map((_, i) => (
                                                            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-xl h-64 animate-pulse" />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        {recommendedCourses.map((course, index) => (
                                                            <motion.div
                                                                key={course.id}
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: index * 0.1 }}
                                                                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                                                                onClick={() => {
                                                                    onClose()
                                                                    router.push(`/courses/${course.id}`)
                                                                }}
                                                            >
                                                                <div className="relative aspect-video overflow-hidden">
                                                                    <Image
                                                                        src={course.preview_url || "/placeholder.svg"}
                                                                        alt={course.name}
                                                                        fill
                                                                        className="object-cover group-hover:scale-105 transition-transform"
                                                                    />
                                                                    <div className="absolute top-3 right-3">
                                                                        <Chip 
                                                                            className="bg-blue-500 text-white font-bold"
                                                                            size="sm"
                                                                        >
                                                                            ${(course.Price || 0).toFixed(2)}
                                                                        </Chip>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="p-4">
                                                                    <h4 className="font-bold text-base mb-2 line-clamp-2 min-h-[48px]">
                                                                        {course.name}
                                                                    </h4>
                                                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                                                                        {course.description || "No description"}
                                                                    </p>
                                                                    
                                                                    <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
                                                                        <div className="flex items-center gap-1">
                                                                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                                            <span>4.5</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <Clock className="w-3.5 h-3.5" />
                                                                            <span>{course.duration_minutes || 120}min</span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <Button
                                                                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold"
                                                                        size="sm"
                                                                        startContent={<ShoppingCart className="w-4 h-4" />}
                                                                        isDisabled={isInCart(course.id)}
                                                                        onPress={(e) => {
                                                                            e.stopPropagation()
                                                                            handleAddRecommendedToCart(course)
                                                                        }}
                                                                    >
                                                                        {isInCart(course.id) ? "In Cart" : "Add to Cart"}
                                                                    </Button>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </ModalBody>
                    </motion.div>
                )}
            </ModalContent>
        </Modal>
    )
}

