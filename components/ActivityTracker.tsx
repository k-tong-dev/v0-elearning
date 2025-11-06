"use client"

import { useActivityTracker } from "@/hooks/use-activity-tracker"

/**
 * Component wrapper for activity tracking
 * This component doesn't render anything, it just tracks user activity
 */
export function ActivityTracker() {
    useActivityTracker()
    return null
}

