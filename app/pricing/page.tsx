"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CheckCircle,
  X,
  Star,
  Zap,
  Crown,
  Rocket,
  Shield,
  Users,
  BookOpen,
  Video,
  MessageCircle,
  Download,
  Award,
  Infinity,
  Clock,
  CreditCard,
  Gift,
  TrendingUp,
  Target,
  Globe
} from "lucide-react"
import { motion } from "framer-motion"

interface PricingPlan {
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  popular: boolean
  recommended: boolean
  icon: React.ComponentType<{ className?: string }>
  color: string
  features: {
    name: string
    included: boolean
    limit?: string
  }[]
  credits: {
    courses: number | "unlimited"
    storage: string
    support: string
    forums: boolean
    certificates: boolean
  }
  buttonText: string
  buttonStyle: string
}

interface Feature {
  category: string
  items: {
    name: string
    free: boolean | string
    basic: boolean | string
    pro: boolean | string
    enterprise: boolean | string
  }[]
}

export default function PricingPage() {
  const router = useRouter()
  const [isYearly, setIsYearly] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null)

  const plans: PricingPlan[] = [
    {
      id: "free",
      name: "Free",
      description: "Perfect for getting started with learning",
      monthlyPrice: 0,
      yearlyPrice: 0,
      popular: false,
      recommended: false,
      icon: BookOpen,
      color: "bg-gray-500",
      features: [
        { name: "Access to free courses", included: true },
        { name: "Community forum access", included: true },
        { name: "Basic progress tracking", included: true },
        { name: "Course certificates", included: false },
        { name: "Premium support", included: false },
        { name: "Offline downloads", included: false }
      ],
      credits: {
        courses: 3,
        storage: "1 GB",
        support: "Community",
        forums: true,
        certificates: false
      },
      buttonText: "Get Started",
      buttonStyle: "variant-outline"
    },
    {
      id: "basic",
      name: "Basic",
      description: "Ideal for individual learners and hobbyists",
      monthlyPrice: 19,
      yearlyPrice: 190,
      popular: true,
      recommended: false,
      icon: Star,
      color: "bg-blue-500",
      features: [
        { name: "Access to all courses", included: true },
        { name: "Community forum access", included: true },
        { name: "Advanced progress tracking", included: true },
        { name: "Course certificates", included: true },
        { name: "Email support", included: true },
        { name: "Offline downloads", included: true, limit: "10 per month" },
        { name: "1-on-1 mentoring", included: false },
        { name: "Priority support", included: false }
      ],
      credits: {
        courses: 50,
        storage: "10 GB",
        support: "Email",
        forums: true,
        certificates: true
      },
      buttonText: "Choose Basic",
      buttonStyle: "variant-outline"
    },
    {
      id: "pro",
      name: "Pro",
      description: "Best for serious learners and professionals",
      monthlyPrice: 39,
      yearlyPrice: 390,
      popular: false,
      recommended: true,
      icon: Crown,
      color: "bg-purple-500",
      features: [
        { name: "Everything in Basic", included: true },
        { name: "Unlimited course access", included: true },
        { name: "Priority support", included: true },
        { name: "1-on-1 mentoring sessions", included: true, limit: "2 per month" },
        { name: "Code review service", included: true, limit: "1 per month" },
        { name: "Career guidance", included: true },
        { name: "Project portfolio review", included: true },
        { name: "Early access to new content", included: true }
      ],
      credits: {
        courses: "unlimited",
        storage: "50 GB",
        support: "Priority",
        forums: true,
        certificates: true
      },
      buttonText: "Choose Pro",
      buttonStyle: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Perfect for teams and organizations",
      monthlyPrice: 99,
      yearlyPrice: 990,
      popular: false,
      recommended: false,
      icon: Rocket,
      color: "bg-emerald-500",
      features: [
        { name: "Everything in Pro", included: true },
        { name: "Team management dashboard", included: true },
        { name: "Bulk user management", included: true },
        { name: "Custom branding", included: true },
        { name: "Advanced analytics", included: true },
        { name: "Dedicated account manager", included: true },
        { name: "Custom integrations", included: true },
        { name: "SLA guarantee", included: true },
        { name: "Unlimited mentoring", included: true },
        { name: "White-label solution", included: true }
      ],
      credits: {
        courses: "unlimited",
        storage: "Unlimited",
        support: "24/7 Dedicated",
        forums: true,
        certificates: true
      },
      buttonText: "Contact Sales",
      buttonStyle: "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
    }
  ]

  const features: Feature[] = [
    {
      category: "Core Features",
      items: [
        { name: "Course Access", free: "3 courses", basic: "50 courses", pro: "Unlimited", enterprise: "Unlimited" },
        { name: "Video Quality", free: "720p", basic: "1080p", pro: "4K", enterprise: "4K" },
        { name: "Download for Offline", free: false, basic: "10/month", pro: "Unlimited", enterprise: "Unlimited" },
        { name: "Course Certificates", free: false, basic: true, pro: true, enterprise: true },
        { name: "Progress Tracking", free: "Basic", basic: "Advanced", pro: "Advanced", enterprise: "Advanced" }
      ]
    },
    {
      category: "Support & Community",
      items: [
        { name: "Community Forums", free: true, basic: true, pro: true, enterprise: true },
        { name: "Email Support", free: false, basic: true, pro: true, enterprise: true },
        { name: "Priority Support", free: false, basic: false, pro: true, enterprise: true },
        { name: "1-on-1 Mentoring", free: false, basic: false, pro: "2/month", enterprise: "Unlimited" },
        { name: "Code Review", free: false, basic: false, pro: "1/month", enterprise: "Unlimited" }
      ]
    },
    {
      category: "Advanced Features",
      items: [
        { name: "API Access", free: false, basic: false, pro: "Limited", enterprise: "Full" },
        { name: "Custom Integrations", free: false, basic: false, pro: false, enterprise: true },
        { name: "Analytics Dashboard", free: false, basic: "Basic", pro: "Advanced", enterprise: "Enterprise" },
        { name: "Team Management", free: false, basic: false, pro: false, enterprise: true },
        { name: "White Label", free: false, basic: false, pro: false, enterprise: true }
      ]
    }
  ]

  const getPrice = (plan: PricingPlan) => {
    return isYearly ? plan.yearlyPrice : plan.monthlyPrice
  }

  const getSavings = (plan: PricingPlan) => {
    if (plan.yearlyPrice === 0) return 0
    const monthlyCost = plan.monthlyPrice * 12
    return monthlyCost - plan.yearlyPrice
  }

  const handleSelectPlan = (plan: PricingPlan) => {
    if (plan.id === 'free') {
      // Handle free plan signup
      console.log("Free plan selected")
      setSelectedPlan(plan)
    } else {
      // Redirect to payment page with plan details
      const params = new URLSearchParams({
        plan: plan.id,
        billing: isYearly ? 'yearly' : 'monthly'
      })
      router.push(`/payment?${params.toString()}`)
    }
  }

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <X className="w-5 h-5 text-gray-300" />
      )
    }
    return <span className="text-sm">{value}</span>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Unlock your potential with our flexible pricing plans designed for learners at every stage
          </p>
          
          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${!isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=unchecked]:bg-gray-300 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500 data-[state=checked]:to-emerald-500"
            />
            <span className={`text-sm ${isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
              Annual
            </span>
            {isYearly && (
              <Badge className="bg-green-500 text-white ml-2">
                <Gift className="w-3 h-3 mr-1" />
                Save up to 20%
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {plans.map((plan, index) => {
            const IconComponent = plan.icon
            const price = getPrice(plan)
            const savings = getSavings(plan)
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="group relative"
              >
                <Card 
                  className={`h-full transition-all hover:shadow-xl hover:scale-105 relative overflow-hidden ${
                    plan.recommended ? 'ring-2 ring-primary shadow-lg' : ''
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-blue-500 text-white">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}

                  {/* Recommended Badge */}
                  {plan.recommended && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1">
                        <Crown className="w-3 h-3 mr-1" />
                        Recommended
                      </Badge>
                    </div>
                  )}

                  {plan.recommended && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className={`w-12 h-12 rounded-full ${plan.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {plan.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Pricing */}
                    <div className="text-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold">
                          ${price}
                        </span>
                        {price > 0 && (
                          <span className="text-muted-foreground">
                            /{isYearly ? 'year' : 'month'}
                          </span>
                        )}
                      </div>
                      
                      {isYearly && savings > 0 && (
                        <div className="text-sm text-green-600 mt-1">
                          Save ${savings}/year
                        </div>
                      )}
                      
                      {!isYearly && plan.monthlyPrice > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ${plan.yearlyPrice}/year when billed annually
                        </div>
                      )}
                    </div>

                    {/* Credits Summary */}
                    <div className="bg-accent/50 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-sm">What's included:</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Courses:</span>
                          <div className="font-medium">
                            {typeof plan.credits.courses === 'number' ? plan.credits.courses : 'Unlimited'}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Storage:</span>
                          <div className="font-medium">{plan.credits.storage}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Support:</span>
                          <div className="font-medium">{plan.credits.support}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Forums:</span>
                          <div className="font-medium">
                            {plan.credits.forums ? '✓' : '✗'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Key Features */}
                    <div className="space-y-2">
                      {plan.features.slice(0, 4).map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          {feature.included ? (
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-gray-300 shrink-0" />
                          )}
                          <span className={feature.included ? '' : 'text-muted-foreground'}>
                            {feature.name}
                            {feature.limit && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({feature.limit})
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                      {plan.features.length > 4 && (
                        <div className="text-xs text-muted-foreground">
                          +{plan.features.length - 4} more features
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Button 
                      className={`w-full ${
                        plan.buttonStyle.includes('gradient') 
                          ? plan.buttonStyle 
                          : ''
                      }`}
                      variant={plan.buttonStyle.includes('outline') ? 'outline' : 'default'}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Feature Comparison Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-8">
            Compare All Features
          </h2>
          
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-accent/50">
                    <th className="text-left p-4 font-semibold">Features</th>
                    <th className="text-center p-4 font-semibold">Free</th>
                    <th className="text-center p-4 font-semibold">Basic</th>
                    <th className="text-center p-4 font-semibold">Pro</th>
                    <th className="text-center p-4 font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((category, categoryIndex) => (
                    <React.Fragment key={category.category}>
                      <tr className="bg-accent/25">
                        <td colSpan={5} className="p-4 font-semibold text-sm uppercase tracking-wide">
                          {category.category}
                        </td>
                      </tr>
                      {category.items.map((item, itemIndex) => (
                        <tr key={itemIndex} className="border-b hover:bg-accent/20 transition-colors">
                          <td className="p-4 font-medium">{item.name}</td>
                          <td className="p-4 text-center">{renderFeatureValue(item.free)}</td>
                          <td className="p-4 text-center">{renderFeatureValue(item.basic)}</td>
                          <td className="p-4 text-center">{renderFeatureValue(item.pro)}</td>
                          <td className="p-4 text-center">{renderFeatureValue(item.enterprise)}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* FAQ Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                question: "Can I change my plan anytime?",
                answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely."
              },
              {
                question: "Is there a free trial?",
                answer: "Yes! Our Basic plan comes with a 14-day free trial. No credit card required to start."
              },
              {
                question: "Do you offer refunds?",
                answer: "We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, we'll provide a full refund."
              },
              {
                question: "Can I cancel anytime?",
                answer: "Absolutely! You can cancel your subscription anytime from your account settings. You'll retain access until the end of your billing period."
              }
            ].map((faq, index) => (
              <Card key={index} className="p-6">
                <h4 className="font-semibold mb-2">{faq.question}</h4>
                <p className="text-muted-foreground">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <h3 className="text-xl font-semibold mb-6">Trusted by thousands of learners</h3>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm">SSL Secured</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <span className="text-sm">PCI Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm">24/7 Support</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span className="text-sm">Money Back Guarantee</span>
            </div>
          </div>
        </motion.div>

        {/* Payment Dialog */}
        <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Your Purchase</DialogTitle>
            </DialogHeader>
            
            {selectedPlan && (
              <div className="space-y-6">
                <div className="p-4 bg-accent/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Plan Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Plan:</span>
                      <span className="font-medium">{selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Billing:</span>
                      <span>{isYearly ? 'Annual' : 'Monthly'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-bold text-primary">
                        ${getPrice(selectedPlan)}{getPrice(selectedPlan) > 0 ? `/${isYearly ? 'year' : 'month'}` : ''}
                      </span>
                    </div>
                    {isYearly && getSavings(selectedPlan) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>You Save:</span>
                        <span className="font-medium">${getSavings(selectedPlan)}/year</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  {selectedPlan.id === 'free' ? (
                    <Button className="w-full">
                      Get Started for Free
                    </Button>
                  ) : (
                    <>
                      <Button 
                        className="w-full mb-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                        onClick={() => {
                          const params = new URLSearchParams({
                            plan: selectedPlan.id,
                            billing: isYearly ? 'yearly' : 'monthly'
                          })
                          router.push(`/payment?${params.toString()}`)
                          setSelectedPlan(null)
                        }}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Continue to Payment
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Secure checkout powered by Stripe
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Footer />
    </div>
  )
}
