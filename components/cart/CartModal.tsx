"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react"
import { useCart } from "@/contexts/CartContext"
import { ShoppingCart, Trash2, CreditCard, CheckCircle, Maximize2, Minimize2, X } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"

interface CartModalProps {
    isOpen: boolean
    onClose: () => void
}

export function CartModal({ isOpen, onClose }: CartModalProps) {
    const router = useRouter()
    const { items, removeFromCart, clearCart, totalPrice, totalPriceFormatted, itemCount } = useCart()
    const { isAuthenticated } = useAuth()
    const [isProcessing, setIsProcessing] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)

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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size={isFullscreen ? "full" : "5xl"}
            scrollBehavior="inside"
            classNames={{
                base: isFullscreen ? "m-0 rounded-none" : "max-h-[90vh]",
                wrapper: "overflow-hidden",
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
                                    <ShoppingCart className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Shopping Cart</h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                                        {itemCount} {itemCount === 1 ? "course" : "courses"}
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
                        
                        <ModalBody className="p-6">
                            {items.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <ShoppingCart className="w-12 h-12 text-slate-400 dark:text-slate-600" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Your cart is empty</h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-4">
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
                                        <AnimatePresence mode="popLayout">
                                            {items.map((item, index) => (
                                                <motion.div
                                                    key={item.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                >
                                                    <div className="flex gap-3">
                                                        <div className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                                                            <Image
                                                                src={item.image}
                                                                alt={item.title}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                                                                {item.title}
                                                            </h4>
                                                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                                                                {item.description}
                                                            </p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
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
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
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
                                            size="sm"
                                        >
                                            Clear Cart
                                        </Button>
                                    </div>

                                    {/* Order Summary */}
                                    <div className="lg:col-span-1">
                                        <div className="sticky top-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                Order Summary
                                            </h3>
                                            
                                            <div className="space-y-2 py-3 border-y border-slate-200 dark:border-slate-700">
                                                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                                    <span>Subtotal</span>
                                                    <span>{totalPriceFormatted}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                                    <span>Tax</span>
                                                    <span>$0.00</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white">
                                                <span>Total</span>
                                                <span className="text-blue-600 dark:text-blue-400">{totalPriceFormatted}</span>
                                            </div>
                                            
                                            <Button
                                                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold"
                                                startContent={isProcessing ? null : <CreditCard className="w-4 h-4" />}
                                                onPress={handleCheckout}
                                                isLoading={isProcessing}
                                            >
                                                {isProcessing ? "Processing..." : "Checkout"}
                                            </Button>
                                            
                                            <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                                    <span>30-day money-back guarantee</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                                    <span>Lifetime access to courses</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}

