"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import { Footer } from "@/components/ui/footers/footer"
import { Button } from "@heroui/react"
import { useCart } from "@/contexts/CartContext"
import { ShoppingCart, Trash2, ArrowLeft, CreditCard, CheckCircle, X } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"

export default function CartPage() {
    const router = useRouter()
    const { items, removeFromCart, clearCart, totalPrice, totalPriceFormatted, itemCount } = useCart()
    const { isAuthenticated } = useAuth()
    const [isProcessing, setIsProcessing] = useState(false)

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            toast.error("Please sign in to checkout")
            router.push("/auth/start")
            return
        }

        setIsProcessing(true)
        
        // Simulate payment processing
        setTimeout(() => {
            toast.success("Payment successful! Enrolling in courses...")
            clearCart()
            setIsProcessing(false)
            router.push("/dashboard?tab=my-courses")
        }, 2000)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/30">
            <HeaderUltra />
            
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Button
                        variant="light"
                        startContent={<ArrowLeft className="w-4 h-4" />}
                        className="mb-4"
                        onPress={() => router.back()}
                    >
                        Back
                    </Button>
                    
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500">
                            <ShoppingCart className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Shopping Cart
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                {itemCount} {itemCount === 1 ? "course" : "courses"} in your cart
                            </p>
                        </div>
                    </div>
                </motion.div>

                {items.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-20"
                    >
                        <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <ShoppingCart className="w-16 h-16 text-slate-400 dark:text-slate-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Your cart is empty</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Add courses to start learning today!
                        </p>
                        <Button
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                            onPress={() => router.push("/courses")}
                        >
                            Browse Courses
                        </Button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            <AnimatePresence mode="popLayout">
                                {items.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-lg transition-shadow"
                                    >
                                        <div className="flex gap-4">
                                            <div className="relative w-32 h-20 flex-shrink-0 rounded-xl overflow-hidden">
                                                <Image
                                                    src={item.image}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-lg text-slate-900 dark:text-white line-clamp-1">
                                                    {item.title}
                                                </h3>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                                    {item.description}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
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
                                className="w-full"
                            >
                                Clear Cart
                            </Button>
                        </div>

                        {/* Order Summary */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-1"
                        >
                            <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Order Summary
                                </h2>
                                
                                <div className="space-y-3 py-4 border-y border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>Subtotal</span>
                                        <span>{totalPriceFormatted}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>Tax</span>
                                        <span>$0.00</span>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between text-xl font-bold text-slate-900 dark:text-white">
                                    <span>Total</span>
                                    <span className="text-blue-600 dark:text-blue-400">{totalPriceFormatted}</span>
                                </div>
                                
                                <Button
                                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold h-12"
                                    startContent={isProcessing ? null : <CreditCard className="w-5 h-5" />}
                                    onPress={handleCheckout}
                                    isLoading={isProcessing}
                                >
                                    {isProcessing ? "Processing..." : "Checkout"}
                                </Button>
                                
                                <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>30-day money-back guarantee</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>Lifetime access to courses</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
            
            <Footer />
        </div>
    )
}

