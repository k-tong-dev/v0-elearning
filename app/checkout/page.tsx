"use client"

import React, { useState, useEffect, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button, Card, CardBody, CardHeader, Divider } from "@heroui/react"
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
  Loader2,
  Play,
  Sparkles,
  Building2,
} from "lucide-react"
import Image from "next/image"
import dynamic from "next/dynamic"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/contexts/CartContext"
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { getCourseCourse } from "@/integrations/strapi/courseCourse"
import { getUserSubscriptionTax } from "@/integrations/strapi/subscription"

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false })

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface CheckoutCourse {
  courseId: number | string
  cartItemId?: number
  title: string
  description: string
  image: string
  previewType?: "image" | "url" | "video"
  price: number
  currency?: string
  instructor: string
}

// Payment Form Component using Stripe Elements
function PaymentForm({ course, onSuccess }: { course: CheckoutCourse; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setErrorMessage('Stripe is not loaded. Please refresh the page.')
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      // Submit the form to get payment details
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setErrorMessage(submitError.message || 'Payment submission failed')
        setIsProcessing(false)
        return
      }

      // Confirm payment with Stripe (clientSecret is already set in Elements)
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout?success=true&courseId=${course.courseId}`,
        },
        redirect: 'if_required',
      })

      if (confirmError) {
        setErrorMessage(confirmError.message || 'Payment failed')
        setIsProcessing(false)
      } else {
        // Payment succeeded
        toast.success("Payment successful! Processing your enrollment...")
        onSuccess()
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      setErrorMessage(error.message || 'Payment failed. Please try again.')
      toast.error(error.message || 'Payment failed. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
      <PaymentElement 
        options={{
          layout: 'tabs',
            paymentMethodOrder: ['card', 'ideal', 'bancontact'],
        }}
      />
      </div>
      
      {errorMessage && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-800 dark:text-red-200">{errorMessage}</span>
        </div>
      )}

      <Button 
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold shadow-lg transition-all duration-200"
        size="lg"
        startContent={!isProcessing ? <Lock className="w-5 h-5" /> : null}
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Payment...
          </div>
        ) : (
          `Pay ${course.currency?.toUpperCase() === 'USD' ? '$' : ''}${(course.totalAmount || course.price).toFixed(2)}${course.currency?.toUpperCase() !== 'USD' ? ` ${course.currency?.toUpperCase()}` : ''}`
        )}
      </Button>
    </form>
  )
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, user, isLoading: authLoading } = useAuth()
  const { removeFromCart } = useCart()
  const [isLoading, setIsLoading] = useState(true)
  const [paymentStep, setPaymentStep] = useState<"payment" | "processing" | "success">("payment")
  const [course, setCourse] = useState<CheckoutCourse | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [isABAPaymentProcessing, setIsABAPaymentProcessing] = useState(false)

  // Get course ID from URL or sessionStorage
  const courseIdFromUrl = searchParams?.get('course')
  const successParam = searchParams?.get('success')

  // Load course data
  useEffect(() => {
    const loadCourse = async () => {
      try {
        setIsLoading(true)

        // If returning from payment success, show success
        if (successParam === 'true' && courseIdFromUrl) {
          setPaymentStep("success")
          setIsLoading(false)
          return
        }

        // Get course ID from URL or sessionStorage
        let courseId: string | number | null = courseIdFromUrl

        if (!courseId) {
          const checkoutData = sessionStorage.getItem('checkoutCourse')
          if (checkoutData) {
            const parsedData = JSON.parse(checkoutData)
            courseId = parsedData.courseId
          }
        }

        if (!courseId) {
          toast.error("No course selected for checkout")
          router.push('/courses')
          return
        }

        // Fetch course details from Strapi
        const courseData = await getCourseCourse(courseId)
        if (!courseData) {
          toast.error("Course not found")
          router.push('/courses')
          return
        }

        // Check if course is paid
        if (!courseData.is_paid) {
          toast.info("This course is free. Redirecting to enrollment...")
          router.push(`/courses/${courseId}`)
          return
        }

        // Calculate price with discount
        const originalPrice = courseData.Price || 0
        let currentPrice = originalPrice

        if (courseData.discount_type === "percentage" && courseData.discount_percentage) {
          currentPrice = originalPrice * (1 - courseData.discount_percentage / 100)
        } else if (courseData.discount_type === "fix_price" && courseData.discount_fix_price) {
          currentPrice = courseData.discount_fix_price
        }

        // Normalize currency code - ensure it's a valid Stripe currency code
        let currencyCode = 'usd'; // Default fallback
        if (courseData.currency?.code) {
          const rawCode = courseData.currency.code.toLowerCase().trim();
          // Map common currency symbols to codes
          const currencyMap: Record<string, string> = {
            '$': 'usd',
            'us$': 'usd',
            '€': 'eur',
            '£': 'gbp',
            '¥': 'jpy',
            'c$': 'cad',
            'a$': 'aud',
          };
          
          // Check if it's a symbol that needs mapping
          if (currencyMap[rawCode]) {
            currencyCode = currencyMap[rawCode];
          } else if (/^[a-z]{3}$/.test(rawCode)) {
            // Valid 3-letter currency code
            currencyCode = rawCode;
          } else {
            // Invalid currency, use default
            console.warn(`Invalid currency code "${rawCode}", defaulting to "usd"`);
            currencyCode = 'usd';
          }
        }

        // Get user's subscription tax (platform commission)
        let taxPercentage = 0
        let taxAmount = 0
        let totalAmount = currentPrice
        
        if (isAuthenticated && user?.id) {
          try {
            taxPercentage = await getUserSubscriptionTax(user.id.toString())
            taxAmount = currentPrice * (taxPercentage / 100)
            totalAmount = currentPrice + taxAmount
          } catch (error) {
            console.error('Error fetching subscription tax:', error)
            // Use default if error
            taxPercentage = parseFloat(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT || '10')
            taxAmount = currentPrice * (taxPercentage / 100)
            totalAmount = currentPrice + taxAmount
          }
        }

        const checkoutCourse: CheckoutCourse = {
          courseId: courseData.documentId || courseData.id, // Prefer documentId as primary identifier
          title: courseData.name,
          description: courseData.description || '',
          image: courseData.preview_url || '',
          previewType: courseData.preview_available ? "url" : "image",
          price: currentPrice,
          taxPercentage: taxPercentage,
          taxAmount: taxAmount,
          totalAmount: totalAmount,
          currency: currencyCode,
          instructor: courseData.instructors?.[0]?.name || 'Unknown Instructor',
        }

        setCourse(checkoutCourse)

        // Create Stripe payment intent (for Stripe path)
        if (isAuthenticated && user?.id) {
          try {
            const response = await fetch('/api/stripe/create-payment-intent', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                courseId: courseData.documentId || courseData.id, // Prefer documentId
                amount: currentPrice, // Base course price (before tax)
                currency: checkoutCourse.currency,
              }),
            })

            if (!response.ok) {
              const errorData = await response.json()
              const errorMessage = errorData.error || 'Failed to create payment intent'
              const errorDetails = errorData.details ? `: ${errorData.details}` : ''
              console.error('Payment intent creation failed:', {
                status: response.status,
                error: errorMessage,
                details: errorDetails,
                fullError: errorData
              })
              throw new Error(errorMessage + errorDetails)
            }

            const data = await response.json()
            setClientSecret(data.clientSecret)
            setPaymentIntentId(data.paymentIntentId)
            
            // Update course with tax info from API (in case of any differences)
            if (data.taxPercentage !== undefined) {
              setCourse(prev => prev ? {
                ...prev,
                taxPercentage: data.taxPercentage,
                taxAmount: data.taxAmount,
                totalAmount: data.totalAmount,
              } : null)
            }
          } catch (error: any) {
            console.error('Error creating payment intent:', error)
            const errorMessage = error.message || 'Failed to initialize payment. Please try again.'
            toast.error(errorMessage)
            // Don't set loading to false here - let the user see the error and try again
          }
        }
      } catch (error: any) {
        console.error('Error loading course:', error)
        toast.error("Failed to load course details")
        router.push('/courses')
      } finally {
        setIsLoading(false)
      }
    }

    // Wait for auth to initialize, then check
    if (authLoading) {
      // Still loading auth state, wait
      return
    }
    
    if (isAuthenticated && user?.id) {
      loadCourse()
    } else if (isAuthenticated === false) {
      // User is definitely not authenticated
      toast.error("Please sign in to complete purchase")
      router.push("/auth/start")
    }
  }, [courseIdFromUrl, successParam, isAuthenticated, user, router, authLoading])

  // Handle ABA PayWay payment callback
  useEffect(() => {
    // Payment verification will be handled by the callback route
    // This effect can be used for any post-payment processing if needed
  }, [])

  const handlePaymentSuccess = async () => {
    // Remove course from cart (regardless of how it was added)
    if (course?.courseId) {
      try {
        // Convert courseId to number if it's a string
        const courseIdNum = typeof course.courseId === 'string' ? parseInt(course.courseId) : course.courseId
        if (!isNaN(courseIdNum)) {
          await removeFromCart(courseIdNum)
          toast.success("Course removed from cart")
        }
      } catch (error) {
        console.error("Error removing from cart:", error)
      }
    }
    
    // Clear checkout data
    sessionStorage.removeItem('checkoutCourse')
    
    setPaymentStep("success")
  }

  const handleABAPayment = async () => {
    if (!course) return
    setIsABAPaymentProcessing(true)
    try {
      const resp = await fetch('/api/aba-payway/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.courseId,
          amount: course.price,
          currency: course.currency?.toUpperCase() || 'USD',
        }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to create ABA PayWay payment')
      }

      // Redirect to ABA PayWay checkout
      // ABA PayWay will handle the payment and redirect back
      const checkoutUrl = `${data.abaConfig.apiUrl}?${new URLSearchParams({
        merchant_id: data.abaConfig.merchantId,
        tran_id: data.transactionId,
        amount: data.totalAmount.toString(),
        currency: data.paymentData.currency,
        hash: data.paymentData.hash,
        signature: data.paymentData.signature,
        return_url: `${window.location.origin}/checkout?course=${course.courseId}&success=true&transactionId=${data.transactionId}`,
        cancel_url: `${window.location.origin}/checkout?course=${course.courseId}&cancelled=true`,
      }).toString()}`

      window.location.href = checkoutUrl
    } catch (error: any) {
      console.error('ABA PayWay checkout error:', error)
      toast.error(error?.message || 'ABA PayWay checkout failed')
      setIsABAPaymentProcessing(false)
    }
  }

  // Stripe Elements options
  const options: StripeElementsOptions = useMemo(() => ({
    clientSecret: clientSecret || undefined,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#3b82f6',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
        colorTextSecondary: '#6b7280',
        colorTextPlaceholder: '#9ca3af',
      },
      rules: {
        '.Input': {
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        },
        '.Input:focus': {
          border: '1px solid #3b82f6',
          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
        },
        '.Tab': {
          borderRadius: '8px',
          padding: '12px 16px',
        },
        '.Tab--selected': {
          backgroundColor: '#3b82f6',
          color: '#ffffff',
        },
      },
    },
  }), [clientSecret])

  // Success Screen
  if (paymentStep === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <HeaderUltra />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Success Card with Enhanced Design */}
            <Card className="border-2 border-green-200 dark:border-green-800 shadow-2xl overflow-hidden">
              <CardBody className="p-0">
                {/* Success Header with Gradient */}
                <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <Sparkles className="w-full h-full text-white" />
                  </div>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="relative z-10"
                  >
                    <div className="w-28 h-28 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30">
                      <CheckCircle className="w-16 h-16 text-white" />
                    </div>
                    <motion.h1 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-4xl md:text-5xl font-bold text-white mb-2"
                    >
                      🎉 Payment Successful!
                    </motion.h1>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-lg text-white/90"
                    >
                      Welcome to your new course!
                    </motion.p>
                  </motion.div>
                </div>
                
                {/* Course Details Section */}
                <div className="p-8 md:p-12">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mb-8"
                  >
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
                      You now have <span className="font-bold text-green-600 dark:text-green-400">lifetime access</span> to
                    </p>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                      {course?.title}
                    </h2>
                    {course?.instructor && (
                      <p className="text-base text-slate-500 dark:text-slate-400">
                        by <span className="font-semibold">{course.instructor}</span>
                      </p>
                    )}
                  </motion.div>

                  {/* Course Preview Image */}
                  {course?.image && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 }}
                      className="relative w-full max-w-lg mx-auto aspect-video rounded-xl overflow-hidden mb-8 shadow-xl border-4 border-slate-200 dark:border-slate-700"
                    >
                      <Image
                        src={course.image || '/placeholder-course.jpg'}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 text-white">
                          <Play className="w-5 h-5" />
                          <span className="font-semibold">Ready to start learning</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-4"
                  >
                  <Button 
                      className="w-full h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    size="lg"
                      onPress={() => router.push(`/courses/${course?.courseId}/study`)}
                      startContent={<Play className="w-6 h-6" />}
                  >
                    Start Learning Now
                  </Button>
                    
                    <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="flat"
                    size="lg"
                        className="w-full h-12 border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    onPress={() => router.push('/dashboard?tab=my-courses')}
                      >
                        My Courses
                      </Button>
                      <Button 
                        variant="flat"
                        size="lg"
                        className="w-full h-12 border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        onPress={() => router.push('/courses')}
                      >
                        Browse More
                      </Button>
                    </div>
                  </motion.div>

                  {/* Benefits List */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 justify-center">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-slate-600 dark:text-slate-400">Lifetime Access</span>
                      </div>
                      <div className="flex items-center gap-2 justify-center">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-slate-600 dark:text-slate-400">30-Day Guarantee</span>
                      </div>
                      <div className="flex items-center gap-2 justify-center">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-slate-600 dark:text-slate-400">Certificate Included</span>
                      </div>
                    </div>
                  </motion.div>
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
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
        
        <Footer />
      </div>
    )
  }

  // Loading or no course
  if (authLoading || isLoading || !course) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <HeaderUltra />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                {authLoading ? 'Checking authentication...' : 'Loading checkout...'}
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Payment Form Screen
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
                Secure checkout powered by Stripe - Your payment information is encrypted
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
                  {clientSecret ? (
                    <Elements stripe={stripePromise} options={options}>
                      <PaymentForm course={course} onSuccess={handlePaymentSuccess} />
                    </Elements>
                  ) : (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">Initializing payment...</p>
                    </div>
                  )}


                  {/* ABA PayWay Payment Option */}
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Or pay with ABA Bank</p>
                    <Button
                      className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg font-semibold shadow-lg transition-all duration-200"
                      size="lg"
                      onPress={handleABAPayment}
                      isLoading={isABAPaymentProcessing}
                      startContent={!isABAPaymentProcessing ? <Building2 className="w-5 h-5" /> : null}
                    >
                      {isABAPaymentProcessing ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        "Pay with ABA Bank"
                      )}
                    </Button>
                  </div>

                  {/* Security Notice */}
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg mt-6">
                    <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-semibold text-green-800 dark:text-green-200">Secure Payment</div>
                      <div className="text-green-600 dark:text-green-400">Your payment information is encrypted and secure using 256-bit SSL. Powered by Stripe & ABA PayWay.</div>
                    </div>
                  </div>
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
                        src={course.image}
                        width="100%"
                        height="100%"
                        light={true}
                        playing={false}
                        controls={false}
                        className="react-player"
                      />
                    ) : (
                      <Image
                        src={course.image || '/placeholder-course.jpg'}
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
                      <span className="font-semibold">
                        {course.currency?.toUpperCase() === 'USD' ? '$' : ''}
                        {course.price.toFixed(2)}
                        {course.currency?.toUpperCase() !== 'USD' ? ` ${course.currency?.toUpperCase()}` : ''}
                      </span>
                    </div>
                    {course.taxPercentage && course.taxPercentage > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          Platform Fee ({course.taxPercentage.toFixed(1)}%)
                        </span>
                        <span className="font-semibold">
                          {course.currency?.toUpperCase() === 'USD' ? '$' : ''}
                          {course.taxAmount?.toFixed(2) || '0.00'}
                          {course.currency?.toUpperCase() !== 'USD' ? ` ${course.currency?.toUpperCase()}` : ''}
                        </span>
                    </div>
                    )}
                    <Divider />
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {course.currency?.toUpperCase() === 'USD' ? '$' : ''}
                        {(course.totalAmount || course.price).toFixed(2)}
                        {course.currency?.toUpperCase() !== 'USD' ? ` ${course.currency?.toUpperCase()}` : ''}
                      </span>
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

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
