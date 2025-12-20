"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { getPurchaseTransactions, PurchaseTransaction } from "@/integrations/strapi/purchaseTransaction"
import { getCourseCourse } from "@/integrations/strapi/courseCourse"
import { Card, CardBody, CardHeader } from "@heroui/react"
import { motion } from "framer-motion"
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Download,
  ExternalLink,
  Loader2
} from "lucide-react"
import Image from "next/image"
import { Button } from "@heroui/react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

interface PurchaseWithCourse extends PurchaseTransaction {
  course?: {
    id: number | string
    name: string
    preview_url?: string
    instructors?: Array<{ name: string }>
  }
}

export function DashboardOrderHistory() {
  const { user } = useAuth()
  const router = useRouter()
  const [purchases, setPurchases] = useState<PurchaseWithCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadPurchases()
    }
  }, [user?.id])

  const loadPurchases = async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const transactions = await getPurchaseTransactions(user.id.toString())
      
      // Fetch course details for each transaction
      const purchasesWithCourses = await Promise.all(
        transactions.map(async (transaction) => {
          if (transaction.course_course) {
            try {
              const course = await getCourseCourse(transaction.course_course)
              return {
                ...transaction,
                course: course ? {
                  id: course.id,
                  name: course.name,
                  preview_url: course.preview_url,
                  instructors: course.instructors,
                } : undefined
              }
            } catch (error) {
              console.error(`Error loading course ${transaction.course_course}:`, error)
              return transaction
            }
          }
          return transaction
        })
      )
      
      // Sort by purchase date (newest first)
      purchasesWithCourses.sort((a, b) => {
        const dateA = new Date(a.purchased_at || a.createdAt || 0).getTime()
        const dateB = new Date(b.purchased_at || b.createdAt || 0).getTime()
        return dateB - dateA
      })
      
      setPurchases(purchasesWithCourses)
    } catch (error: any) {
      console.error("Error loading purchases:", error)
      setError(error.message || "Failed to load purchase history")
    } finally {
      setIsLoading(false)
    }
  }

  const getStateIcon = (state: PurchaseTransaction['state']) => {
    switch (state) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'refunded':
        return <RefreshCw className="w-5 h-5 text-orange-500" />
      case 'pending':
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStateBadge = (state: PurchaseTransaction['state']) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold"
    switch (state) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`
      case 'refunded':
        return `${baseClasses} bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400`
      case 'pending':
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400`
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return format(new Date(dateString), "MMM dd, yyyy 'at' h:mm a")
    } catch {
      return dateString
    }
  }

  const formatCurrency = (amount: number, currencyCode?: string) => {
    const code = currencyCode?.toUpperCase() || "USD"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Order History</h2>
            <p className="text-muted-foreground mt-1">View all your course purchases</p>
          </div>
        </div>
        
        <Card>
          <CardBody className="p-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading your orders...</p>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Order History</h2>
            <p className="text-muted-foreground mt-1">View all your course purchases</p>
          </div>
        </div>
        
        <Card>
          <CardBody className="p-8">
            <div className="text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={loadPurchases} variant="flat">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Order History</h2>
          <p className="text-muted-foreground mt-1">
            {purchases.length === 0 
              ? "No purchases yet" 
              : `${purchases.length} ${purchases.length === 1 ? 'order' : 'orders'} found`}
          </p>
        </div>
        <Button
          variant="flat"
          onClick={loadPurchases}
          startContent={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      {/* Orders List */}
      {purchases.length === 0 ? (
        <Card>
          <CardBody className="p-12">
            <div className="text-center">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
              <p className="text-muted-foreground mb-6">
                When you purchase a course, it will appear here
              </p>
              <Button
                onClick={() => router.push("/courses")}
                className="bg-primary text-primary-foreground"
              >
                Browse Courses
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase, index) => (
            <motion.div
              key={purchase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardBody className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Course Image */}
                    {purchase.course?.preview_url && (
                      <div className="relative w-full md:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-800">
                        <Image
                          src={purchase.course.preview_url}
                          alt={purchase.course.name || "Course"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Order Details */}
                    <div className="flex-1 space-y-4">
                      {/* Header Row */}
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStateIcon(purchase.state)}
                            <span className={getStateBadge(purchase.state)}>
                              {purchase.state.charAt(0).toUpperCase() + purchase.state.slice(1)}
                            </span>
                          </div>
                          
                          {purchase.course ? (
                            <h3 className="text-xl font-bold mb-1">
                              {purchase.course.name}
                            </h3>
                          ) : (
                            <h3 className="text-xl font-bold mb-1 text-muted-foreground">
                              Course (ID: {purchase.course_course || "N/A"})
                            </h3>
                          )}
                          
                          {purchase.course?.instructors?.[0] && (
                            <p className="text-sm text-muted-foreground">
                              by {purchase.course.instructors[0].name}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {formatCurrency(purchase.amount_paid, purchase.currency?.code)}
                          </div>
                          {purchase.currency && (
                            <p className="text-xs text-muted-foreground">
                              {purchase.currency.name}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Transaction Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Order ID</p>
                          <p className="text-sm font-mono">
                            {purchase.stripe_payment_intent_id || `#${purchase.id}`}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Purchase Date</p>
                          <p className="text-sm">{formatDate(purchase.purchased_at || purchase.createdAt)}</p>
                        </div>

                        {purchase.refunded_at && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Refunded Date</p>
                            <p className="text-sm">{formatDate(purchase.refunded_at)}</p>
                          </div>
                        )}

                        {purchase.stripe_charge_id && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Charge ID</p>
                            <p className="text-sm font-mono text-xs">
                              {purchase.stripe_charge_id}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {purchase.course && purchase.state === 'completed' && (
                        <div className="flex gap-3 pt-2">
                          <Button
                            size="sm"
                            onClick={() => router.push(`/courses/${purchase.course?.id}/study`)}
                            startContent={<ExternalLink className="w-4 h-4" />}
                          >
                            Start Learning
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            onClick={() => router.push(`/courses/${purchase.course?.id}`)}
                          >
                            View Course
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

