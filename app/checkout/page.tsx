"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button, Card, CardBody, CardHeader, Input, Divider } from "@heroui/react"
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import { Footer } from "@/components/ui/footers/footer"
import {
  CreditCard,
  Lock,
  ArrowLeft,
  CheckCircle,
  Shield,
  Clock,
  AlertCircle,
} from "lucide-react"
import Image from "next/image"
import dynamic from "next/dynamic"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/contexts/CartContext"

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false })

interface CheckoutCourse {
  courseId: number
  cartItemId?: number
  title: string
  description: string
  image: string
  previewType?: "image" | "url" | "video"
  price: number
  instructor: string
}

interface PaymentFormData {
  email: string
  cardNumber: string
  expiryDate: string
  cvv: string
  name: string
  country: string
  postalCode: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { removeFromCart } = useCart()
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStep, setPaymentStep] = useState<"payment" | "processing" | "success">("payment")
  const [course, setCourse] = useState<CheckoutCourse | null>(null)
  
  const [formData, setFormData] = useState<PaymentFormData>({
    email: user?.email || "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    name: "",
    country: "",
    postalCode: ""
  })

  // Load course data from sessionStorage
  useEffect(() => {
    const checkoutData = sessionStorage.getItem('checkoutCourse')
    if (checkoutData) {
      try {
        const parsedData = JSON.parse(checkoutData)
        setCourse(parsedData)
      } catch (error) {
        console.error("Failed to parse checkout data:", error)
        toast.error("Invalid checkout data")
        router.push('/courses')
      }
    } else {
      toast.error("No course selected for checkout")
      router.push('/courses')
    }
  }, [router])

  // Update email when user loads
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email || "" }))
    }
  }, [user])

  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4)
    }
    return v
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    handleInputChange('cardNumber', formatted)
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value)
    handleInputChange('expiryDate', formatted)
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      toast.error("Please sign in to complete purchase")
      router.push("/auth/start")
      return
    }

    if (!course) {
      toast.error("No course selected")
      return
    }

    setIsLoading(true)
    setPaymentStep("processing")

    try {
      // Mock payment processing (replace with actual payment API)
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      console.log("Payment processed:", {
        course,
        formData,
        amount: course.price
      })
      
      // Remove from cart if it was from cart
      if (course.cartItemId && course.courseId) {
        removeFromCart(course.courseId)
      }
      
      // Clear checkout data
      sessionStorage.removeItem('checkoutCourse')
      
      setPaymentStep("success")
      toast.success("Enrollment successful!")
    } catch (error) {
      console.error("Payment failed:", error)
      toast.error("Payment failed. Please try again.")
      setPaymentStep("payment")
    } finally {
      setIsLoading(false)
    }
  }

  // Success Screen
  if (paymentStep === "success") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <HeaderUltra />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-green-200 dark:border-green-800">
              <CardBody className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                
                <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
                  Enrollment Successful!
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  You now have access to <strong>{course?.title}</strong>
                </p>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold"
                    size="lg"
                    onPress={() => router.push('/dashboard?tab=my-courses')}
                  >
                    Go to My Courses
                  </Button>
                  <Button 
                    variant="flat"
                    size="lg"
                    className="w-full"
                    onPress={() => router.push('/courses')}
                  >
                    Browse More Courses
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
        
        <Footer />
      </div>
    )
  }

  // Processing Screen
  if (paymentStep === "processing") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <HeaderUltra />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 max-w-2xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card>
              <CardBody className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <CreditCard className="w-10 h-10 text-white" />
                </div>
                
                <h1 className="text-2xl font-bold mb-2">Processing Payment</h1>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Please wait while we process your payment...
                </p>
                
                <div className="flex justify-center">
                  <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
        
        <Footer />
      </div>
    )
  }

  // Payment Form Screen
  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <HeaderUltra />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading checkout...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <HeaderUltra />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="light"
              isIconOnly
              onPress={() => router.back()}
              className="hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Complete Your Purchase
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Secure checkout - Your payment information is encrypted
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader className="flex gap-3 px-6 py-4">
                  <CreditCard className="w-6 h-6 text-blue-500" />
                  <div className="flex flex-col">
                    <p className="text-xl font-bold">Payment Information</p>
                    <p className="text-sm text-slate-500">All transactions are secure and encrypted</p>
                  </div>
                </CardHeader>
                <Divider />
                <CardBody className="p-6">
                  <form onSubmit={handlePayment} className="space-y-6">
                    {/* Email */}
                    <div>
                      <Input
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="john@example.com"
                        required
                        variant="bordered"
                      />
                    </div>

                    {/* Card Information */}
                    <div className="space-y-4">
                      <p className="text-sm font-semibold">Card Information</p>
                      
                      <Input
                        label="Card Number"
                        value={formData.cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="1234 1234 1234 1234"
                        maxLength={19}
                        required
                        variant="bordered"
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Expiry Date"
                          value={formData.expiryDate}
                          onChange={handleExpiryChange}
                          placeholder="MM/YY"
                          maxLength={5}
                          required
                          variant="bordered"
                        />
                        <Input
                          label="CVV"
                          value={formData.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                          placeholder="123"
                          maxLength={4}
                          required
                          variant="bordered"
                          type="password"
                        />
                      </div>
                    </div>

                    {/* Cardholder Information */}
                    <div>
                      <Input
                        label="Cardholder Name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="John Doe"
                        required
                        variant="bordered"
                      />
                    </div>

                    {/* Billing Address */}
                    <div className="space-y-4">
                      <p className="text-sm font-semibold">Billing Address</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Country"
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          placeholder="United States"
                          required
                          variant="bordered"
                        />
                        
                        <Input
                          label="Postal Code"
                          value={formData.postalCode}
                          onChange={(e) => handleInputChange('postalCode', e.target.value)}
                          placeholder="12345"
                          required
                          variant="bordered"
                        />
                      </div>
                    </div>

                    {/* Security Notice */}
                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-semibold text-green-800 dark:text-green-200">Secure Payment</div>
                        <div className="text-green-600 dark:text-green-400">Your payment information is encrypted and secure using 256-bit SSL</div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-14 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-lg font-bold"
                      size="lg"
                      startContent={!isLoading ? <Lock className="w-5 h-5" /> : null}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        `Complete Payment $${course.price.toFixed(2)}`
                      )}
                    </Button>
                  </form>
                </CardBody>
              </Card>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="sticky top-24 space-y-6"
            >
              {/* Course Summary */}
              <Card className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/20">
                <CardHeader>
                  <div className="flex flex-col w-full">
                    <p className="text-xl font-bold">Order Summary</p>
                  </div>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4 p-6">
                  {/* Course Preview */}
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800">
                    {course.previewType === "url" || course.previewType === "video" ? (
                      <ReactPlayer
                        url={course.image}
                        width="100%"
                        height="100%"
                        light={true}
                        playing={false}
                        controls={false}
                        className="react-player"
                      />
                    ) : (
                      <Image
                        src={course.image}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>

                  {/* Course Details */}
                  <div>
                    <h3 className="font-bold text-lg mb-1 line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                      {course.description}
                    </p>
                    <p className="text-xs text-slate-500">
                      Instructor: <span className="font-semibold">{course.instructor}</span>
                    </p>
                  </div>

                  <Divider />

                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Course Price</span>
                      <span className="font-semibold">${course.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Tax</span>
                      <span className="font-semibold">$0.00</span>
                    </div>
                    <Divider />
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-blue-600 dark:text-blue-400">${course.price.toFixed(2)}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Guarantees */}
              <Card>
                <CardBody className="p-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>30-day money-back guarantee</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <span>Lifetime access to course</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <span>Secure payment processing</span>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

