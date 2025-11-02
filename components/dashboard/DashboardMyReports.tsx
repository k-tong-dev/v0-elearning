"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ReportIssueForm } from "@/components/report/ReportIssueForm"
import {
    Bug,
    CheckCircle,
    Clock,
    MessageSquare,
    Plus,
    AlertCircle,
    Calendar,
    FileText,
} from "lucide-react"
import { motion } from "framer-motion"
import { User } from "@/types/user"
import { format } from "date-fns"
import { useAuth } from "@/hooks/use-auth"
import { getAccessToken } from "@/lib/cookies"

interface DashboardMyReportsProps {
    currentUser: User
}

interface ReportProblem {
    id: number
    documentId?: string
    title: string
    description: string
    internal_noted?: string
    state?: string
    createdAt?: string
    updatedAt?: string
    publishedAt?: string | null
}

const stateConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: "Pending", color: "bg-yellow-500", icon: Clock },
    in_progress: { label: "In Progress", color: "bg-blue-500", icon: MessageSquare },
    done: { label: "Resolved", color: "bg-green-500", icon: CheckCircle },
    cancelled: { label: "Cancelled", color: "bg-gray-500", icon: AlertCircle },
}

export function DashboardMyReports({ currentUser }: DashboardMyReportsProps) {
    const { user, refreshUser } = useAuth()
    const strapiURL = process.env.NEXT_PUBLIC_STRAPI_URL
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [reports, setReports] = useState<ReportProblem[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch reports from API
    useEffect(() => {
        const fetchReports = async () => {
            if (!user?.id) {
                setLoading(false)
                return
            }
            
            try {
                const access_token = getAccessToken()
                const response = await fetch(`${strapiURL}/api/report-issues?filters[user][id][$eq]=${user.id}&populate=*&sort=createdAt:desc`, {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                })
                
                if (response.ok) {
                    const data = await response.json()
                    setReports(data.data || [])
                } else {
                    // Fallback to user data
                    setReports(currentUser.report_problems || [])
                }
            } catch (error) {
                console.error("Failed to fetch reports:", error)
                // Fallback to user data
                setReports(currentUser.report_problems || [])
            } finally {
                setLoading(false)
            }
        }
        fetchReports()
    }, [user?.id, strapiURL, currentUser.report_problems])

    const getStateConfig = (state?: string) => {
        return stateConfig[state || "pending"] || stateConfig.pending
    }

    const handleSuccess = async () => {
        setIsDialogOpen(false)
        await refreshUser()
        
        // Refetch reports
        if (user?.id) {
            try {
                const access_token = getAccessToken()
                const response = await fetch(`${strapiURL}/api/report-issues?filters[user][id][$eq]=${user.id}&populate=*&sort=createdAt:desc`, {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                })
                
                if (response.ok) {
                    const data = await response.json()
                    setReports(data.data || [])
                }
            } catch (error) {
                console.error("Failed to refetch reports:", error)
            }
        }
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-br from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
                        My Reports
                    </h2>
                    <p className="text-muted-foreground mt-1">View and track your reported issues</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg">
                            <Plus className="w-4 h-4 mr-2" />
                            New Report
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Report an Issue</DialogTitle>
                        </DialogHeader>
                        <ReportIssueForm onSuccess={handleSuccess} />
                    </DialogContent>
                </Dialog>
            </motion.div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading reports...</p>
                </div>
            ) : reports.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                >
                    <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-red-500/10 to-orange-500/10 flex items-center justify-center mb-4">
                        <Bug className="w-12 h-12 text-red-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Reports Yet</h3>
                    <p className="text-muted-foreground mb-6">You haven't submitted any reports yet</p>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Report an Issue
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Report an Issue</DialogTitle>
                            </DialogHeader>
                            <ReportIssueForm onSuccess={handleSuccess} />
                        </DialogContent>
                    </Dialog>
                </motion.div>
            ) : (
                <div className="grid gap-4">
                    {reports.map((report, index) => {
                        const stateInfo = getStateConfig(report.state)
                        const StateIcon = stateInfo.icon

                        return (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="liquid-glass-card border-l-4 border-l-red-500/30">
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <CardTitle className="text-lg">{report.title}</CardTitle>
                                                    <Badge
                                                        variant="outline"
                                                        className={`${stateInfo.color}/20 text-foreground border-current/20`}
                                                    >
                                                        <StateIcon className="w-3 h-3 mr-1" />
                                                        {stateInfo.label}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    {report.createdAt && (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {format(new Date(report.createdAt), "MMM dd, yyyy")}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-start gap-3">
                                            <FileText className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.description}</p>
                                        </div>
                                        {report.internal_noted && (
                                            <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">Admin Response</p>
                                                        <p className="text-xs text-blue-800 dark:text-blue-400">{report.internal_noted}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

