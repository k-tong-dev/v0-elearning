"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import { Footer } from "@/components/ui/footers/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Globe,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import { motion } from "framer-motion"
import { getSubscriptionPlans, Subscription, getAllUserSubscriptions, UserSubscription } from "@/integrations/strapi/subscription"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"

// Add shimmer animation
const shimmerStyle = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`

export default function PricingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [plans, setPlans] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<Subscription | null>(null)
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([])

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await getSubscriptionPlans()
        // Group by group_plan and sort by sequence within each group
        const grouped = data.reduce((acc, plan) => {
          const group = plan.group_plan || 'base'
          if (!acc[group]) {
            acc[group] = []
          }
          acc[group].push(plan)
          return acc
        }, {} as Record<string, Subscription[]>)
        
        // Sort each group by sequence
        Object.keys(grouped).forEach(group => {
          grouped[group].sort((a, b) => (a.sequnce || 0) - (b.sequnce || 0))
        })
        
        // Flatten back to array for now, but we'll use grouped structure in render
        setPlans(data.sort((a, b) => {
          // First sort by group, then by sequence
          const groupA = a.group_plan || 'base'
          const groupB = b.group_plan || 'base'
          if (groupA !== groupB) {
            return groupA.localeCompare(groupB)
          }
          return (a.sequnce || 0) - (b.sequnce || 0)
        }))
      } catch (error) {
        console.error("Error fetching plans:", error)
        toast.error("Failed to load pricing plans")
      } finally {
        setLoading(false)
      }
    }

    const fetchUserSubscriptions = async () => {
      if (!user?.id) {
        setUserSubscriptions([])
        return
      }
      try {
        const subscriptions = await getAllUserSubscriptions(user.id)
        setUserSubscriptions(subscriptions)
      } catch (error) {
        console.error("Error fetching user subscriptions:", error)
      }
    }

    fetchPlans()
    fetchUserSubscriptions()
  }, [user?.id])

  const getPlanIcon = (type: string | null | undefined) => {
    if (!type) return BookOpen
    switch (type.toLowerCase()) {
      case 'free':
        return BookOpen
      case 'basic':
        return Star
      case 'pro':
        return Crown
      case 'enterprise':
      case 'enterpris':
        return Rocket
      default:
        return BookOpen
    }
  }

  const getPlanColor = (type: string | null | undefined) => {
    if (!type) return 'from-gray-400 to-gray-600'
    switch (type.toLowerCase()) {
      case 'free':
        return 'from-gray-400 to-gray-600'
      case 'basic':
        return 'from-blue-400 to-blue-600'
      case 'pro':
        return 'from-purple-400 via-pink-400 to-purple-600'
      case 'enterprise':
      case 'enterpris':
        return 'from-indigo-400 to-purple-600'
      default:
        return 'from-gray-400 to-gray-600'
    }
  }

  const handleSelectPlan = (plan: Subscription) => {
    // Free plan is default and not clickable - handled in UI
    if (plan.price === 0 || plan.type?.toLowerCase() === 'free') {
      return // Do nothing for free plan
    }
    
    setSelectedPlan(plan)
    const params = new URLSearchParams({
      plan: plan.id.toString()
    })
    router.push(`/payment?${params.toString()}`)
  }
  
  const isFreePlan = (plan: Subscription) => {
    return plan.price === 0 || plan.type?.toLowerCase() === 'free'
  }

  const isPlanSubscribed = (plan: Subscription): boolean => {
    if (!user?.id || userSubscriptions.length === 0) return false
    return userSubscriptions.some(sub => {
      const subscriptionPlan = typeof sub.subscription === 'object' 
        ? sub.subscription as Subscription
        : null
      if (!subscriptionPlan) return false
      // Check by both id and documentId to handle different scenarios
      return (
        subscriptionPlan.id === plan.id || 
        subscriptionPlan.documentId === plan.documentId ||
        (subscriptionPlan.id && plan.id && subscriptionPlan.id.toString() === plan.id.toString()) ||
        (subscriptionPlan.documentId && plan.documentId && subscriptionPlan.documentId === plan.documentId)
      )
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      <HeaderUltra />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24 relative z-10">
        {/* Grouped Pricing Cards - One Group = One Section */}
        {(() => {
          // Group plans by group_plan
          const groupedPlans = plans.reduce((acc, plan) => {
            const group = plan.group_plan || 'base'
            if (!acc[group]) {
              acc[group] = []
            }
            acc[group].push(plan)
            return acc
          }, {} as Record<string, Subscription[]>)
          
          // Sort each group by sequence
          Object.keys(groupedPlans).forEach(group => {
            groupedPlans[group].sort((a, b) => (a.sequnce || 0) - (b.sequnce || 0))
          })
          
          const groupNames: Record<string, string> = {
            'base': 'Base Plans',
            'friend_extend': 'Friend Extension Plans'
          }
          
          return Object.keys(groupedPlans).map((groupKey, groupIndex) => {
            const groupPlans = groupedPlans[groupKey]
            const groupName = groupNames[groupKey] || groupKey
            
            return (
              <motion.div
                key={groupKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + groupIndex * 0.2 }}
                className="mb-20 mt-20"
              >
                {/* Group Header */}
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent uppercase">
                    {groupName}
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto tracking-widest uppercase">
                    Choose the perfect plan for your needs
                  </p>
                </div>
                
                {/* Pricing Cards Grid - Centered */}
                <div className="flex justify-center items-center">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-auto gap-8 w-full max-w-6xl">
                  {groupPlans.map((plan, index) => {
                      const price = plan.price
                      const benefits = plan.subscription_benefits || []
                      const isPopular = plan.is_popular
                      const isFree = isFreePlan(plan)
                      
                      return (
                        <motion.div
                          key={plan.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                          className="group relative"
                        >
                          {/* Popular Plan Badge - Ultra Creative Design */}
                          {isPopular && (
                            <motion.div
                              className="absolute -top-3 -right-3 z-30"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ 
                                type: "spring", 
                                stiffness: 200, 
                                damping: 15,
                                delay: 0.3 
                              }}
                            >
                              <div className="relative">
                                {/* Animated glow effect - using CSS animation to avoid WAAPI issues */}
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full blur-xl opacity-75 animate-pulse" />
                                
                                {/* Main badge container with gradient border */}
                                <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-2xl p-1.5 shadow-2xl">
                                  <div className="bg-white dark:bg-slate-900 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                                    {/* Animated sparkle icon - simplified animation */}
                                    <motion.div
                                      animate={{
                                        rotate: 360,
                                      }}
                                      transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "linear",
                                      }}
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-transparent bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text fill-purple-500" />
                                    </motion.div>
                                    
                                    {/* Badge text */}
                                    <span className="text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent whitespace-nowrap">
                                      Popular
                                    </span>
                                    
                                    {/* Decorative dot - using CSS animation */}
                                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
                                  </div>
                                  
                                  {/* Ribbon tail effect */}
                                  <div className="absolute -bottom-1 right-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-purple-600"></div>
                                </div>
                                
                                {/* Additional shine effect - removed to avoid WAAPI error */}
                              </div>
                            </motion.div>
                          )}
                          
                          {/* Free Plan Badge */}
                          {isFree && (
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20">
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 text-xs font-semibold shadow-lg">
                                Default Plan
                              </Badge>
                            </div>
                          )}
                          
                          <Card 
                            className={`h-full transition-all duration-300 relative overflow-hidden rounded-2xl border-2 ${
                              isPopular
                                ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 border-purple-400/50 shadow-2xl hover:shadow-3xl text-white'
                                : isFree
                                ? 'bg-white dark:bg-slate-900 border-2 border-dashed border-gray-300 dark:border-slate-700/50 opacity-90 text-gray-900 dark:text-foreground'
                                : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700/50 hover:border-purple-400 dark:hover:border-blue-500/50 hover:shadow-xl text-gray-900 dark:text-foreground'
                            } ${isFree ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            <CardContent className="p-8">
                              {/* Plan Name */}
                              <div className="mb-6">
                                <h3 className={`text-2xl font-bold mb-2 ${
                                  isPopular 
                                    ? 'text-gray-600 dark:text-white' 
                                    : isFree 
                                    ? 'text-gray-800 dark:text-muted-foreground' 
                                    : 'text-gray-900 dark:text-foreground'
                                }`}>
                                  {plan.name}
                                </h3>
                                <p className={`text-sm ${
                                  isPopular 
                                    ? 'text-gray-600 dark:text-white/80' 
                                    : isFree 
                                    ? 'text-gray-700 dark:text-muted-foreground/70' 
                                    : 'text-gray-700 dark:text-muted-foreground'
                                }`}>
                                  {isFree ? 'Already Active' : 'Unlock Feature'}
                                </p>
                              </div>
                              
                              {/* Price */}
                              <div className="mb-8">
                                <div className="flex items-baseline gap-2">
                                  <span className={`text-5xl font-bold ${
                                    isPopular 
                                      ? 'text-gray-600 dark:text-white' 
                                      : isFree 
                                      ? 'text-gray-800 dark:text-muted-foreground' 
                                      : 'text-gray-900 dark:text-foreground'
                                  }`}>
                                    {isFree ? `$${price.toFixed(2)}` : `$${price.toFixed(2)}`}
                                  </span>
                                  {!isFree && (
                                    <span className={`text-lg ${
                                      isPopular 
                                        ? 'text-gray-600 dark:text-white/80' 
                                        : 'text-gray-600 dark:text-muted-foreground'
                                    }`}>
                                      / Unlimited
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Features List */}
                              {benefits.length > 0 && (
                                <ul className="space-y-3 mb-8 min-h-[200px]">
                                  {benefits.map((benefit: any, i: number) => (
                                    <li key={benefit.id || i} className="flex items-start gap-3">
                                      {!benefit.locked ? (
                                        <CheckCircle className={`w-5 h-5 mt-0.5 shrink-0 ${
                                          isPopular 
                                            ? 'text-pink-500 dark:text-pink-400' 
                                            : isFree 
                                            ? 'text-orange-500 dark:text-orange-400' 
                                            : 'text-green-500 dark:text-green-400'
                                        }`} />
                                      ) : (
                                        <X className={`w-5 h-5 mt-0.5 shrink-0 ${
                                          isPopular 
                                            ? 'text-white/50 dark:text-white/50' 
                                            : 'text-gray-400 dark:text-gray-400'
                                        }`} />
                                      )}
                                      <span className={`text-sm font-medium ${
                                        benefit.locked 
                                          ? (isPopular 
                                              ? 'text-white/50 dark:text-white/50 line-through' 
                                              : 'text-gray-400 dark:text-muted-foreground line-through')
                                          : (isPopular 
                                              ? 'text-gray-600 dark:text-white' 
                                              : isFree 
                                              ? 'text-gray-800 dark:text-muted-foreground' 
                                              : 'text-gray-900 dark:text-foreground')
                                      }`}>
                                        {benefit.name}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              
                              {/* CTA Button */}
                              {!isFree ? (
                                isPlanSubscribed(plan) ? (
                                  <div className="w-full h-12 flex items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md">
                                    <span className="text-sm font-semibold flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4" />
                                      In Use
                                    </span>
                                  </div>
                                ) : (
                                  <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Button 
                                      className={`w-full h-12 text-base font-semibold rounded-xl transition-all duration-300 ${
                                        isPopular
                                          ? 'bg-white text-purple-600 hover:bg-white/90 hover:shadow-lg'
                                          : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg'
                                      }`}
                                      onClick={() => handleSelectPlan(plan)}
                                    >
                                      Choose
                                    </Button>
                                  </motion.div>
                                )
                              ) : (
                                <div className="w-full h-12 flex items-center justify-center rounded-xl bg-muted/50 border-2 border-dashed border-border/50">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    Current Plan
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )
          })
        })()}

        {/* Trust Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Trusted by thousands of learners
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {[
              { icon: Shield, text: "SSL Secured", color: "from-green-500 to-emerald-500" },
              { icon: CreditCard, text: "PCI Compliant", color: "from-blue-500 to-indigo-500" },
              { icon: Clock, text: "24/7 Support", color: "from-purple-500 to-pink-500" },
              { icon: Award, text: "Money Back Guarantee", color: "from-orange-500 to-red-500" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                whileHover={{ scale: 1.1, y: -5 }}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/50 dark:bg-slate-800/50 backdrop-blur-xl border border-border/50 dark:border-slate-700/50 hover:border-primary/50 dark:hover:border-blue-500/50 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-foreground">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1.5 text-sm font-semibold mb-4">
              <MessageCircle className="w-3 h-3 mr-2" />
              Questions?
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                question: "Can I change my plan anytime?",
                answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, PayPal, and bank transfers. All transactions are secured with SSL encryption."
              },
              {
                question: "Do you offer refunds?",
                answer: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact us within 30 days for a full refund."
              },
              {
                question: "Can I cancel my subscription?",
                answer: "Absolutely! You can cancel your subscription at any time from your account settings. No questions asked."
              },
              {
                question: "What happens to my data if I cancel?",
                answer: "Your data remains accessible for 90 days after cancellation. After that, it will be permanently deleted unless you reactivate."
              },
              {
                question: "Are there discounts for students?",
                answer: "Yes! Students with a valid .edu email address receive a 20% discount on all plans. Contact support to verify your student status."
              },
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + idx * 0.1 }}
                className="p-6 rounded-2xl bg-card/80 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-border/50 dark:border-slate-700/50 hover:border-primary/50 dark:hover:border-blue-500/50 transition-all duration-300 group"
              >
                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {faq.question}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-center mb-20"
        >
          <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 backdrop-blur-xl border-2 border-primary/50 dark:border-blue-500/50 p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.3, type: "spring" }}
                className="inline-block mb-6"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto shadow-2xl">
                  <Rocket className="w-10 h-10 text-white" />
                </div>
              </motion.div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Ready to Transform Your Learning?
              </h2>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of learners who are already transforming their skills with our platform.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => router.push("/auth/signup")}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white px-8 py-6 text-lg font-semibold shadow-2xl"
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => router.push("/contact")}
                    variant="outline"
                    size="lg"
                    className="border-2 border-primary/50 dark:border-blue-500/50 px-8 py-6 text-lg font-semibold hover:bg-primary/10 dark:hover:bg-blue-500/10"
                  >
                    Contact Sales
                  </Button>
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <Footer />
      
      {/* Shimmer Animation Style */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
