"use client"

import React, { useState, useEffect, useMemo } from "react"
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
} from "lucide-react"
import Image from "next/image"
import dynamic from "next/dynamic"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/contexts/CartContext"
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { getCourseCourse } from "@/integrations/strapi/courseCourse"

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
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      // Confirm payment with Stripe
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setErrorMessage(submitError.message || 'Payment submission failed')
        setIsProcessing(false)
        return
      }

      // Create payment intent on backend
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.courseId,
          amount: course.price,
          currency: course.currency || 'usd',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create payment intent')
      }

      const { clientSecret } = await response.json()

      // Confirm payment
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
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
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement 
        options={{
          layout: 'tabs',
        }}
      />
      
      {errorMessage && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-800 dark:text-red-200">{errorMessage}</span>
        </div>
      )}

      <Button 
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-14 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-lg font-bold"
        size="lg"
        startContent={!isProcessing ? <Lock className="w-5 h-5" /> : null}
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Payment...
          </div>
        ) : (
          `Pay $${course.price.toFixed(2)}`
        )}
      </Button>
    </form>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, user } = useAuth()
  const { removeFromCart } = useCart()
  const [isLoading, setIsLoading] = useState(true)
  const [paymentStep, setPaymentStep] = useState<"payment" | "processing" | "success">("payment")
  const [course, setCourse] = useState<CheckoutCourse | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [isPayPalProcessing, setIsPayPalProcessing] = useState(false)
  const [hasCapturedPayPal, setHasCapturedPayPal] = useState(false)

  // Get course ID from URL or sessionStorage
  const courseIdFromUrl = searchParams?.get('course')
  const successParam = searchParams?.get('success')
  const paypalOrderIdFromUrl = searchParams?.get('paypal_order_id')
  const paypalCancelled = searchParams?.get('cancelled')

  // Load course data
  useEffect(() => {
    const loadCourse = async () => {
      try {
        setIsLoading(true)

        // If returning from Stripe success (without PayPal order), show success
        if (successParam === 'true' && !paypalOrderIdFromUrl && courseIdFromUrl) {
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

        const checkoutCourse: CheckoutCourse = {
          courseId: courseData.id,
          title: courseData.name,
          description: courseData.description || '',
          image: courseData.preview_url || '',
          previewType: courseData.preview_available ? "url" : "image",
          price: currentPrice,
          currency: courseData.currency?.code?.toLowerCase() || 'usd',
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
                courseId: courseData.id,
                amount: currentPrice,
                currency: checkoutCourse.currency,
              }),
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || 'Failed to create payment intent')
            }

            const data = await response.json()
            setClientSecret(data.clientSecret)
            setPaymentIntentId(data.paymentIntentId)
          } catch (error: any) {
            console.error('Error creating payment intent:', error)
            toast.error(error.message || 'Failed to initialize payment. Please try again.')
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

    if (isAuthenticated) {
      loadCourse()
    } else {
      toast.error("Please sign in to complete purchase")
      router.push("/auth/start")
    }
  }, [courseIdFromUrl, successParam, isAuthenticated, user, router])

  // Handle PayPal return capture
  useEffect(() => {
    const capturePayPalIfNeeded = async () => {
      if (!course || !paypalOrderIdFromUrl || successParam !== 'true' || hasCapturedPayPal) return
      try {
        setPaymentStep("processing")
        setIsPayPalProcessing(true)
        const resp = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: paypalOrderIdFromUrl }),
        })
        const data = await resp.json()
        if (!resp.ok) {
          throw new Error(data.error || 'Failed to capture PayPal order')
        }
        setHasCapturedPayPal(true)
        handlePaymentSuccess()
      } catch (error: any) {
        console.error('PayPal capture error:', error)
        toast.error(error?.message || 'PayPal capture failed')
        setPaymentStep("payment")
      } finally {
        setIsPayPalProcessing(false)
      }
    }
    capturePayPalIfNeeded()
  }, [course, paypalOrderIdFromUrl, successParam, hasCapturedPayPal])

  const handlePaymentSuccess = () => {
    // Remove from cart if it was from cart
    if (course?.cartItemId && course?.courseId) {
      removeFromCart(course.courseId)
    }
    
    // Clear checkout data
    sessionStorage.removeItem('checkoutCourse')
    
    setPaymentStep("success")
  }

  const handlePayPalCheckout = async () => {
    if (!course) return
    setIsPayPalProcessing(true)
    try {
      const resp = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.courseId,
          currency: course.currency?.toUpperCase() || 'USD',
        }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to start PayPal checkout')
      }
      if (!data.approvalUrl) {
        throw new Error('Missing PayPal approval URL')
      }
      window.location.href = data.approvalUrl
    } catch (error: any) {
      console.error('PayPal checkout error:', error)
      toast.error(error?.message || 'PayPal checkout failed')
    } finally {
      setIsPayPalProcessing(false)
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
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  }), [clientSecret])

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
                  Payment Successful!
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  You now have access to <strong>{course?.title}</strong>
                </p>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold"
                    size="lg"
                    onPress={() => router.push(`/courses/${course?.courseId}/learn`)}
                  >
                    Start Learning Now
                  </Button>
                  <Button 
                    variant="flat"
                    size="lg"
                    className="w-full"
                    onPress={() => router.push('/dashboard?tab=my-courses')}
                  >
                    Go to My Courses
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
  if (isLoading || !course) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <HeaderUltra />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Loading checkout...</p>
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
                Secure checkout powered by Stripe & PayPal - Your payment information is encrypted
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

                  {/* PayPal fallback */}
                  <Divider className="my-6" />
                  <div className="space-y-3">
                    <p className="text-sm text-center text-muted-foreground">Or pay with PayPal (best for Cambodia/unsupported Stripe regions)</p>
                    <Button
                      onPress={handlePayPalCheckout}
                      disabled={isPayPalProcessing || paymentStep === "processing"}
                      className="w-full bg-[#003087] text-white font-semibold h-12 hover:bg-[#00246d]"
                    >
                      {isPayPalProcessing ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Redirecting to PayPal...
                        </div>
                      ) : (
                        "Pay with PayPal"
                      )}
                    </Button>
                  </div>

                  {/* Security Notice */}
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg mt-6">
                    <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-semibold text-green-800 dark:text-green-200">Secure Payment</div>
                      <div className="text-green-600 dark:text-green-400">Your payment information is encrypted and secure using 256-bit SSL. Powered by Stripe.</div>
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
