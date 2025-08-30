"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CreditCard,
  Lock,
  ArrowLeft,
  CheckCircle,
  Shield,
  Clock,
  Star,
  Crown,
  Rocket,
  BookOpen,
  Gift,
} from "lucide-react"
import { motion } from "framer-motion"

interface PaymentFormData {
  email: string
  cardNumber: string
  expiryDate: string
  cvv: string
  name: string
  country: string
  postalCode: string
}

interface PlanDetails {
  id: string
  name: string
  price: number
  billing: "monthly" | "yearly"
  features: string[]
  icon: React.ComponentType<{ className?: string }>
}

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStep, setPaymentStep] = useState<"payment" | "processing" | "success">("payment")
  
  const [formData, setFormData] = useState<PaymentFormData>({
    email: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    name: "",
    country: "",
    postalCode: ""
  })

  // Get plan details from URL params
  const planId = searchParams?.get("plan") || "basic"
  const billing = searchParams?.get("billing") || "monthly"
  const isYearly = billing === "yearly"

  const planDetails: { [key: string]: PlanDetails } = {
    free: {
      id: "free",
      name: "Free",
      price: 0,
      billing: billing as "monthly" | "yearly",
      features: ["Access to free courses", "Community forum", "Basic progress tracking"],
      icon: BookOpen
    },
    basic: {
      id: "basic",
      name: "Basic",
      price: isYearly ? 190 : 19,
      billing: billing as "monthly" | "yearly",
      features: ["All courses access", "Course certificates", "Email support", "Offline downloads"],
      icon: Star
    },
    pro: {
      id: "pro",
      name: "Pro",
      price: isYearly ? 390 : 39,
      billing: billing as "monthly" | "yearly",
      features: ["Everything in Basic", "1-on-1 mentoring", "Priority support", "Code reviews"],
      icon: Crown
    },
    enterprise: {
      id: "enterprise",
      name: "Enterprise",
      price: isYearly ? 990 : 99,
      billing: billing as "monthly" | "yearly",
      features: ["Everything in Pro", "Team management", "Custom branding", "24/7 support"],
      icon: Rocket
    }
  }

  const selectedPlan = planDetails[planId] || planDetails.basic
  const IconComponent = selectedPlan.icon

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
    setIsLoading(true)
    setPaymentStep("processing")

    try {
      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      console.log("Payment processed:", {
        plan: selectedPlan,
        formData,
        amount: selectedPlan.price
      })
      
      setPaymentStep("success")
    } catch (error) {
      console.error("Payment failed:", error)
      setPaymentStep("payment")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateSavings = () => {
    if (!isYearly || selectedPlan.price === 0) return 0
    const monthlyTotal = (selectedPlan.price / (isYearly ? 10 : 1)) * 12
    return Math.round(monthlyTotal - selectedPlan.price)
  }

  if (paymentStep === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <Header />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center"
          >
            <Card className="border-green-200">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                
                <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
                <p className="text-muted-foreground mb-6">
                  Welcome to {selectedPlan.name}! Your subscription is now active.
                </p>
                
                <div className="space-y-4">
                  <Button 
                    className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                    onClick={() => router.push('/dashboard')}
                  >
                    Go to Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/courses')}>
                    Browse Courses
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        <Footer />
      </div>
    )
  }

  if (paymentStep === "processing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <Header />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md mx-auto text-center"
          >
            <Card>
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                
                <h1 className="text-2xl font-bold mb-2">Processing Payment</h1>
                <p className="text-muted-foreground mb-6">
                  Please wait while we process your payment...
                </p>
                
                <div className="flex justify-center">
                  <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="flex items-center gap-2 hover:bg-accent/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Plans
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                Complete Your Purchase
              </h1>
              <p className="text-muted-foreground">
                Secure checkout powered by Stripe
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePayment} className="space-y-6">
                    {/* Email */}
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="john@example.com"
                        required
                      />
                    </div>

                    {/* Card Information */}
                    <div className="space-y-4">
                      <Label>Card Information</Label>
                      
                      <div>
                        <Input
                          value={formData.cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="1234 1234 1234 1234"
                          maxLength={19}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          value={formData.expiryDate}
                          onChange={handleExpiryChange}
                          placeholder="MM/YY"
                          maxLength={5}
                          required
                        />
                        <Input
                          value={formData.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                          placeholder="CVV"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>

                    {/* Cardholder Information */}
                    <div>
                      <Label htmlFor="name">Cardholder Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    {/* Billing Address */}
                    <div className="space-y-4">
                      <Label>Billing Address</Label>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="UK">United Kingdom</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                            <SelectItem value="KH">Cambodia</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Input
                          value={formData.postalCode}
                          onChange={(e) => handleInputChange('postalCode', e.target.value)}
                          placeholder="Postal Code"
                          required
                        />
                      </div>
                    </div>

                    {/* Security Notice */}
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <Shield className="w-5 h-5 text-green-600" />
                      <div className="text-sm">
                        <div className="font-medium text-green-800">Secure Payment</div>
                        <div className="text-green-600">Your payment information is encrypted and secure</div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-lg font-semibold"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        <>
                          <Lock className="w-5 h-5 mr-2" />
                          Complete Payment ${selectedPlan.price}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {/* Plan Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${
                      selectedPlan.id === 'free' ? 'bg-gray-500' :
                      selectedPlan.id === 'basic' ? 'bg-blue-500' :
                      selectedPlan.id === 'pro' ? 'bg-purple-500' : 'bg-emerald-500'
                    } flex items-center justify-center`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedPlan.name} Plan</h3>
                      <p className="text-sm text-muted-foreground">
                        {isYearly ? 'Annual' : 'Monthly'} Billing
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${selectedPlan.price}</span>
                    </div>
                    {isYearly && calculateSavings() > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Annual Discount</span>
                        <span>-${calculateSavings()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>$0.00</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${selectedPlan.price}</span>
                    </div>
                  </div>

                  {isYearly && calculateSavings() > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <Gift className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          You're saving ${calculateSavings()} with annual billing!
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Plan Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What's Included</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Security Features */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span>256-bit SSL encryption</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>30-day money-back guarantee</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="w-4 h-4 text-purple-500" />
                      <span>PCI DSS compliant</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

function PaymentFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading payment details...</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentFallback />}>
      <PaymentContent />
    </Suspense>
  )
}
