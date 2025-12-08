"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Crown, Users, UserPlus, Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Subscription } from "@/integrations/strapi/subscription"
import { createFreePlanSubscriptions } from "@/integrations/strapi/subscription"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"

interface FreePlanAgreementPopupProps {
    isOpen: boolean
    plans: Subscription[]
    onClose: () => void
    onSuccess: () => void
}

export function FreePlanAgreementPopup({
    isOpen,
    plans,
    onClose,
    onSuccess,
}: FreePlanAgreementPopupProps) {
    const { user, refreshUser } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [hasConfirmed, setHasConfirmed] = useState(false)

    // ABSOLUTE PREVENTION: Prevent closing modal via escape key, overlay click, or ANY other method
    useEffect(() => {
        if (isOpen) {
            // Prevent Escape key
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === "Escape" || e.keyCode === 27) {
                    e.preventDefault()
                    e.stopPropagation()
                    // ABSOLUTELY DO NOTHING - modal CANNOT be closed via escape
                    return false
                }
            }
            
            // Prevent clicks outside modal
            const handleClickOutside = (e: MouseEvent | TouchEvent) => {
                const target = e.target as HTMLElement
                // Only allow clicks inside the modal itself
                const modal = document.querySelector('[role="dialog"]') as HTMLElement
                if (modal && !modal.contains(target)) {
                    e.preventDefault()
                    e.stopPropagation()
                    // ABSOLUTELY DO NOTHING - modal CANNOT be closed by clicking outside
                    return false
                }
            }
            
            // Add event listeners with capture phase to catch everything
            document.addEventListener("keydown", handleEscape, true) // Use capture phase
            document.addEventListener("click", handleClickOutside, true) // Use capture phase
            document.addEventListener("touchstart", handleClickOutside, true) // Use capture phase
            document.addEventListener("mousedown", handleClickOutside, true) // Use capture phase
            
            // Prevent body scroll when modal is open
            const originalOverflow = document.body.style.overflow
            document.body.style.overflow = "hidden"
            document.body.style.position = "fixed"
            document.body.style.width = "100%"
            
            return () => {
                document.removeEventListener("keydown", handleEscape, true)
                document.removeEventListener("click", handleClickOutside, true)
                document.removeEventListener("touchstart", handleClickOutside, true)
                document.removeEventListener("mousedown", handleClickOutside, true)
                document.body.style.overflow = originalOverflow
                document.body.style.position = ""
                document.body.style.width = ""
            }
        }
    }, [isOpen])

    if (!isOpen || plans.length === 0) return null

    const handleConfirm = async () => {
        if (!user?.id) {
            toast.error("User not found")
            return
        }

        setIsSubmitting(true)
        try {
            // Use numeric ID for relations (Strapi requires numeric IDs for relations)
            const planIds = plans.map(p => p.id)
            const result = await createFreePlanSubscriptions(user.id, planIds)

            if (result.success) {
                toast.success(result.message || "Free plans activated successfully!", {
                    position: "top-center",
                })
                setHasConfirmed(true)
                await refreshUser()
                setTimeout(() => {
                    onSuccess()
                    onClose()
                }, 1500)
            } else {
                toast.error(result.message || "Failed to activate free plans", {
                    position: "top-center",
                })
            }
        } catch (error) {
            console.error("Error confirming free plans:", error)
            toast.error("An error occurred. Please try again.", {
                position: "top-center",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const getPlanIcon = (groupPlan?: string) => {
        if (groupPlan === "friend_extend") {
            return <UserPlus className="w-5 h-5" />
        }
        return <Users className="w-5 h-5" />
    }

    const getPlanDescription = (plan: Subscription) => {
        if (plan.group_plan === "friend_extend") {
            return `Add up to ${plan.amount_friend_allowed || 0} friends`
        } else if (plan.group_plan === "base") {
            const parts = []
            if (plan.amount_instructor) {
                parts.push(`${plan.amount_instructor} instructor(s)`)
            }
            if (plan.amount_instructor_group_allowed) {
                parts.push(`${plan.amount_instructor_group_allowed} instructor group(s)`)
            }
            return parts.join(" • ") || "Base instructor features"
        }
        return plan.description || "Free plan benefits"
    }

    const getPlanBenefits = (plan: Subscription) => {
        const benefits: string[] = []

        if (plan.group_plan === "friend_extend" && plan.amount_friend_allowed) {
            benefits.push(`Adds +${plan.amount_friend_allowed} friend slots to your allowance`)
        }

        if (plan.group_plan === "base") {
            if (plan.amount_instructor) {
                benefits.push(`Adds +${plan.amount_instructor} instructor seats`)
            }
            if (plan.amount_instructor_group_allowed) {
                benefits.push(`Adds +${plan.amount_instructor_group_allowed} instructor group slots`)
            }
        }

        if (plan.subscription_benefits?.length) {
            plan.subscription_benefits.forEach((benefit) => {
                if (benefit?.name) {
                    benefits.push(benefit.name)
                }
            })
        }

        return benefits
    }

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    {/* Backdrop - ABSOLUTELY NON-CLOSEABLE: Only check button can close */}
                    <div
                        className="fixed inset-0 bg-gradient-to-br from-black/50 via-black/60 to-black/70 backdrop-blur-xl z-[9998]"
                        style={{ 
                            pointerEvents: "none", // CRITICAL: Prevents ALL interactions - modal CANNOT be closed by clicking overlay
                            userSelect: "none",
                            touchAction: "none", // Prevent touch events on mobile
                            WebkitTouchCallout: "none", // Prevent iOS callout
                            WebkitUserSelect: "none" // Prevent iOS selection
                        }}
                        onClick={(e) => {
                            // ABSOLUTE PROTECTION: Prevent any click events from closing the modal
                            e.preventDefault()
                            e.stopPropagation()
                            return false
                        }}
                        onMouseDown={(e) => {
                            // Prevent any mouse events from closing the modal
                            e.preventDefault()
                            e.stopPropagation()
                            return false
                        }}
                        onTouchStart={(e) => {
                            // Prevent touch events from closing the modal
                            e.preventDefault()
                            e.stopPropagation()
                            return false
                        }}
                        onPointerDown={(e) => {
                            // Prevent all pointer events
                            e.preventDefault()
                            e.stopPropagation()
                            return false
                        }}
                        aria-hidden="true"
                        role="presentation"
                    />

                    {/* Modal - Ultra Advanced Design */}
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ 
                                type: "spring", 
                                stiffness: 400, 
                                damping: 35,
                                mass: 0.8
                            }}
                            className="pointer-events-auto w-full max-w-3xl relative max-h-[90vh] overflow-hidden"
                            onClick={(e) => {
                                // Prevent clicks on the modal itself from bubbling up
                                e.stopPropagation()
                            }}
                            onKeyDown={(e) => {
                                // Prevent escape key from closing
                                if (e.key === "Escape") {
                                    e.preventDefault()
                                    e.stopPropagation()
                                }
                            }}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Free Plan Agreement - Use confirm button to proceed"
                        >
                            {/* Ultra-advanced gradient overlay */}
                            <div 
                                className="absolute inset-0 opacity-20 pointer-events-none rounded-3xl"
                                style={{
                                    background: "radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)"
                                }}
                            />
                            
                            <Card 
                                className="liquid-modal border-0 shadow-2xl relative overflow-hidden flex flex-col h-full"
                                style={{
                                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.12) 100%)",
                                    backdropFilter: "blur(40px) saturate(180%)",
                                    WebkitBackdropFilter: "blur(40px) saturate(180%)",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(255, 255, 255, 0.1)"
                                }}
                            >
                                <CardHeader className="pb-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <motion.div 
                                            className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-rose-500/30 shadow-lg relative overflow-hidden"
                                            style={{
                                                backdropFilter: "blur(20px) saturate(180%)",
                                                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                                                boxShadow: "0 8px 24px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                                            }}
                                            whileHover={{ scale: 1.05, rotate: 5 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                                            <Crown className="w-7 h-7 text-purple-400 dark:text-purple-300 relative z-10" strokeWidth={2} />
                                        </motion.div>
                                        <div className="flex-1">
                                            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent drop-shadow-sm">
                                                Free Plan Agreement
                                            </CardTitle>
                                            <CardDescription className="mt-2 text-base text-muted-foreground">
                                                    Activate your free subscription plans
                                                </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6 relative z-10 overflow-y-auto pr-2 max-h-[calc(90vh-220px)]">
                                    {/* Plans List - Ultra Advanced Design */}
                                    <div className="space-y-4">
                                        <motion.p 
                                            className="text-base font-semibold text-foreground"
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            The following free plans will be activated:
                                        </motion.p>
                                        {plans.map((plan, idx) => {
                                            const benefits = getPlanBenefits(plan)
                                            return (
                                            <motion.div
                                                key={plan.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.2 + idx * 0.1, type: "spring", stiffness: 300 }}
                                                className="flex items-start gap-4 p-5 rounded-2xl liquid-glass-card border border-white/20 relative overflow-hidden group"
                                                whileHover={{ scale: 1.02 }}
                                            >
                                                {/* Hover gradient effect */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                
                                                <motion.div 
                                                    className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-rose-500/20 text-primary relative z-10 shadow-lg"
                                                    style={{
                                                        backdropFilter: "blur(20px) saturate(180%)",
                                                        WebkitBackdropFilter: "blur(20px) saturate(180%)"
                                                    }}
                                                    whileHover={{ rotate: 5, scale: 1.1 }}
                                                >
                                                    {getPlanIcon(plan.group_plan)}
                                                </motion.div>
                                                <div className="flex-1 min-w-0 relative z-10">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-bold text-lg text-foreground drop-shadow-sm">
                                                            {plan.name}
                                                        </h4>
                                                        <Badge 
                                                            variant="outline" 
                                                            className="text-xs liquid-glass-card border-white/30"
                                                            style={{
                                                                backdropFilter: "blur(10px) saturate(180%)",
                                                                WebkitBackdropFilter: "blur(10px) saturate(180%)"
                                                            }}
                                                        >
                                                            {plan.group_plan === "friend_extend"
                                                                ? "Friend Extend"
                                                                : "Base Plan"}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        {getPlanDescription(plan)}
                                                    </p>
                                                    {benefits.length > 0 && (
                                                        <div className="mt-3 space-y-2">
                                                            <motion.div
                                                                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10 px-3 py-1 text-xs font-semibold text-foreground/80"
                                                                initial={{ opacity: 0, y: 6 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: 0.25 + idx * 0.08 }}
                                                            >
                                                                <Sparkles className="w-3.5 h-3.5" />
                                                                Plan Benefits
                                                            </motion.div>
                                                            <ul className="space-y-2">
                                                                {benefits.map((benefit, benefitIdx) => (
                                                                    <motion.li
                                                                        key={`${plan.id}-benefit-${benefitIdx}`}
                                                                        className="flex items-start gap-2 text-sm text-foreground/80"
                                                                        initial={{ opacity: 0, x: -8 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ delay: 0.3 + idx * 0.08 + benefitIdx * 0.05, type: "spring", stiffness: 300 }}
                                                                    >
                                                                        <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15 border border-emerald-400/40">
                                                                            <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={3} />
                                                                        </div>
                                                                        <span className="leading-snug text-sm text-muted-foreground">
                                                                            {benefit}
                                                                        </span>
                                                                    </motion.li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: 0.3 + idx * 0.1, type: "spring", stiffness: 500 }}
                                                >
                                                    <CheckCircle2 className="w-6 h-6 text-emerald-400 dark:text-emerald-300 flex-shrink-0 drop-shadow-sm" strokeWidth={2.5} />
                                                </motion.div>
                                            </motion.div>
                                        )})}
                                    </div>

                                    {/* Agreement Text - Ultra Advanced */}
                                    <motion.div 
                                        className="p-5 rounded-2xl liquid-glass-card border border-white/20 relative overflow-hidden"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        style={{
                                            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)",
                                            backdropFilter: "blur(20px) saturate(180%)",
                                            WebkitBackdropFilter: "blur(20px) saturate(180%)"
                                        }}
                                    >
                                        <p className="text-sm text-foreground leading-relaxed font-medium">
                                            By confirming, you agree to activate the free subscription plans listed above.
                                            These plans will be added to your account and will update your account limits
                                            accordingly. Free plans do not auto-renew and can be cancelled at any time.
                                        </p>
                                    </motion.div>

                                    {/* Action Button - ONLY CHECK/CONFIRM - NO CANCEL */}
                                    {!hasConfirmed && (
                                        <motion.div 
                                            className="flex justify-center pt-4"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            <motion.div
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full"
                                            >
                                            <Button
                                                onClick={handleConfirm}
                                                disabled={isSubmitting}
                                                    className="w-full rounded-xl py-6 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 text-white shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 relative overflow-hidden group text-lg font-semibold"
                                                    style={{
                                                        boxShadow: "0 12px 32px rgba(139, 92, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                                                    }}
                                            >
                                                    {/* Shimmer effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                    
                                                {isSubmitting ? (
                                                    <>
                                                            <motion.span 
                                                                className="animate-spin mr-3 text-2xl"
                                                                animate={{ rotate: 360 }}
                                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                            >
                                                                ⏳
                                                            </motion.span>
                                                            <span className="relative z-10">Activating...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                            <Check className="w-5 h-5 mr-3 relative z-10 group-hover:scale-110 transition-transform duration-300" strokeWidth={3} />
                                                            <span className="relative z-10">Confirm & Activate</span>
                                                    </>
                                                )}
                                            </Button>
                                            </motion.div>
                                        </motion.div>
                                    )}

                                    {hasConfirmed && (
                                        <motion.div 
                                            className="flex items-center justify-center gap-3 p-5 rounded-2xl liquid-glass-card border border-emerald-500/30 relative overflow-hidden"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ type: "spring", stiffness: 400 }}
                                            style={{
                                                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)",
                                                backdropFilter: "blur(20px) saturate(180%)",
                                                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                                                boxShadow: "0 8px 24px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                                            }}
                                        >
                                            <motion.div
                                                animate={{ 
                                                    scale: [1, 1.2, 1],
                                                    rotate: [0, 10, -10, 0]
                                                }}
                                                transition={{ 
                                                    duration: 0.6,
                                                    repeat: Infinity,
                                                    repeatDelay: 1
                                                }}
                                            >
                                                <CheckCircle2 className="w-6 h-6 text-emerald-400 dark:text-emerald-300" strokeWidth={2.5} />
                                            </motion.div>
                                            <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                                                Plans activated successfully! Closing...
                                            </p>
                                        </motion.div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}

