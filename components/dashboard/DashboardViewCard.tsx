"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button, Chip } from "@heroui/react"
import { useCart } from "@/contexts/CartContext"
import { ShoppingCart, Trash2, CreditCard, CheckCircle, Star, Clock, BookOpen } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { cn } from "@/utils/utils"

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false })

export function DashboardViewCard() {
    const router = useRouter()
    const { items, removeFromCart, clearCart, isInCart } = useCart()
    const { isAuthenticated } = useAuth()
    const [isProcessing, setIsProcessing] = useState(false)
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null)

    console.log("========================: ", JSON.stringify(items))
    // Auto-select first item when cart loads
    React.useEffect(() => {
        if (items.length > 0 && !selectedItemId) {
            setSelectedItemId(items[0].id)
        } else if (items.length === 0) {
            setSelectedItemId(null)
        }
    }, [items, selectedItemId])

    // Calculate order summary for selected item only
    const selectedItem = useMemo(() => {
        return items.find(item => item.id === selectedItemId) || null
    }, [items, selectedItemId])

    const selectedTotalPrice = selectedItem ? selectedItem.price : 0
    const selectedTotalFormatted = selectedItem ? `$${selectedItem.price.toFixed(2)}` : "$0.00"

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            toast.error("Please sign in to checkout")
            router.push("/auth/start")
            return
        }

        if (!selectedItem) {
            toast.error("Please select a course to checkout")
            return
        }

        setIsProcessing(true)
        
        try {
            // Navigate to checkout page with selected course data
            const checkoutData = {
                courseId: selectedItem.courseId,
                cartItemId: selectedItem.strapiCartItemId,
                title: selectedItem.title,
                description: selectedItem.description,
                image: selectedItem.image,
                previewType: selectedItem.previewType,
                price: selectedItem.price,
                instructor: selectedItem.instructor,
            }
            
            // Store in sessionStorage for checkout page to access
            sessionStorage.setItem('checkoutCourse', JSON.stringify(checkoutData))
            
            router.push('/checkout')
        } catch (error) {
            console.error("Failed to initiate checkout:", error)
            toast.error("Failed to proceed to checkout")
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Shopping Cart
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Review and manage your cart items
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Chip 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold"
                        size="lg"
                    >
                        {items.length} {items.length === 1 ? "Item" : "Items"}
                    </Chip>
                </div>
            </div>

            {items.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20 bg-card/50 rounded-2xl border border-border"
                >
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
                        <ShoppingCart className="w-12 h-12 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Your cart is empty</h3>
                    <p className="text-muted-foreground mb-6">
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-3">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Cart Items ({items.length})</h3>
                            <Button
                                variant="light"
                                color="danger"
                                startContent={<Trash2 className="w-4 h-4" />}
                                onPress={clearCart}
                                size="sm"
                            >
                                Clear All
                            </Button>
                        </div>
                        
                        <AnimatePresence mode="popLayout">
                            {items.map((item, index) => {
                                const isSelected = selectedItemId === item.id
                                // Use strapiCartItemId (most reliable) or fallback to courseDocumentId + courseId combination
                                const uniqueKey = item.strapiCartItemId || 
                                                 (item.courseDocumentId ? `doc-${item.courseDocumentId}` : `course-${item.courseId}-${index}`)
                                return (
                                    <motion.div
                                        key={uniqueKey}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => setSelectedItemId(item.id)}
                                        className={cn(
                                            "bg-card rounded-xl p-4 border-2 hover:shadow-lg transition-all cursor-pointer",
                                            isSelected 
                                                ? "border-blue-500 shadow-lg ring-2 ring-blue-500/20" 
                                                : "border-border"
                                        )}
                                    >
                                        <div className="flex gap-4">
                                            {/* Selection Radio Button */}
                                            <div className="flex items-center">
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                    isSelected 
                                                        ? "border-blue-500 bg-blue-500" 
                                                        : "border-border"
                                                )}>
                                                    {isSelected && (
                                                        <div className="w-2 h-2 rounded-full bg-white" />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                                                {item.previewType === "url" || item.previewType === "video" ? (
                                                    <ReactPlayer
                                                        src={item.image}
                                                        width="100%"
                                                        height="100%"
                                                        light={true}
                                                        playing={false}
                                                        controls={false}
                                                        className="react-player"
                                                    />
                                                ) : (
                                                    <Image
                                                        src={item.image}
                                                        alt={item.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-base line-clamp-1 mb-1">
                                                    {item.title}
                                                </h4>
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                    {item.description}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    by {item.instructor}
                                                </p>
                                            </div>
                                            
                                            <div className="flex flex-col items-end justify-between">
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        isIconOnly
                                                        variant="light"
                                                        color="danger"
                                                        size="sm"
                                                        onPress={() => removeFromCart(item.courseId)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                    {item.priceFormatted}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900/20 rounded-2xl border border-border p-6 space-y-4">
                            <h3 className="text-xl font-bold">
                                Order Summary
                            </h3>

                            {selectedItem ? (
                                <>
                                    {/* Selected Course Info */}
                                    <div className="bg-card rounded-lg p-3 space-y-2">
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">
                                            Selected Course
                                        </p>
                                        <div className="flex gap-3">
                                            <div className="relative w-16 h-12 flex-shrink-0 rounded overflow-hidden">
                                                {selectedItem.previewType === "url" || selectedItem.previewType === "video" ? (
                                                    <ReactPlayer
                                                        src={selectedItem.image}
                                                        width="100%"
                                                        height="100%"
                                                        light={true}
                                                        playing={false}
                                                        controls={false}
                                                        className="react-player"
                                                    />
                                                ) : (
                                                    <Image
                                                        src={selectedItem.image}
                                                        alt={selectedItem.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm line-clamp-2">
                                                    {selectedItem.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    by {selectedItem.instructor}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                            
                                    <div className="space-y-3 py-4 border-y border-border">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span className="font-semibold">{selectedTotalFormatted}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tax</span>
                                            <span className="font-semibold">$0.00</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between text-xl font-bold">
                                        <span>Total</span>
                                        <span className="text-blue-600 dark:text-blue-400">{selectedTotalFormatted}</span>
                                    </div>
                                    
                                    <Button
                                        className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-normal text-lg h-12"
                                        startContent={isProcessing ? null : <CreditCard className="w-5 h-5" />}
                                        onPress={handleCheckout}
                                        isLoading={isProcessing}
                                    >
                                        {isProcessing ? "Processing..." : "Checkout Now"}
                                    </Button>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">
                                        Select a course to checkout
                                    </p>
                                </div>
                            )}
                            
                            <div className="space-y-2 pt-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    <span className="text-muted-foreground">30-day money-back guarantee</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    <span className="text-muted-foreground">Lifetime access to courses</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

