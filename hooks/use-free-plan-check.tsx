"use client"

import { useState, useEffect } from "react"
import { getMissingFreePlans } from "@/integrations/strapi/subscription"
import { Subscription } from "@/integrations/strapi/subscription"

interface UseFreePlanCheckOptions {
    userId?: string | number | null
    delay?: number // Delay in milliseconds before checking
    enabled?: boolean // Whether to enable the check
}

export function useFreePlanCheck({
    userId,
    delay = 5000,
    enabled = true,
}: UseFreePlanCheckOptions) {
    const [missingPlans, setMissingPlans] = useState<Subscription[]>([])
    const [isChecking, setIsChecking] = useState(false)
    const [hasChecked, setHasChecked] = useState(false)

    useEffect(() => {
        if (!enabled || !userId || hasChecked) return

        const timer = setTimeout(async () => {
            setIsChecking(true)
            try {
                const plans = await getMissingFreePlans(userId)
                setMissingPlans(plans)
                setHasChecked(true)
            } catch (error) {
                console.error("Error checking free plans:", error)
            } finally {
                setIsChecking(false)
            }
        }, delay)

        return () => clearTimeout(timer)
    }, [userId, delay, enabled, hasChecked])

    const reset = () => {
        setHasChecked(false)
        setMissingPlans([])
    }

    return {
        missingPlans,
        isChecking,
        hasChecked,
        hasMissingPlans: missingPlans.length > 0,
        reset,
    }
}

