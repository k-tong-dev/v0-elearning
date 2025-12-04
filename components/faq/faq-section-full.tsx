"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { FAQCategory } from "./faq-category"
import { FAQAccordionItem } from "./faq-accordion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { 
  Loader2, 
  RefreshCw, 
  Mail, 
  HelpCircle,
  Home,
  User,
  BookOpen,
  CreditCard,
  Headphones,
  GraduationCap,
  Settings,
  Globe,
  ChevronDown
} from "lucide-react"
import { cn } from "@/utils/utils"

/**
 * FAQ Data Types
 */
type FAQAttributes = {
  question: string
  answer: string
  buttonText?: string | null
  order?: number
  group?: string
  category?: string
  isPublished?: boolean
  publishedAt?: string | null
}

type FAQ = {
  id: number
  attributes?: FAQAttributes
  // Strapi v5 might have attributes at root level
  question?: string
  answer?: string
  buttonText?: string | null
  order?: number
  group?: string
  category?: string
  isPublished?: boolean
  publishedAt?: string | null
}

type ProcessedFAQ = {
  id: number
  question: string
  answer: string
  buttonText?: string | null
  order: number
  group: string
  category?: string
}

/**
 * Normalize FAQ data from Strapi (handles both v4 and v5 formats)
 */
function normalizeFAQ(faq: FAQ): ProcessedFAQ | null {
  // Extract data based on Strapi version format
  const question = faq.question || faq.attributes?.question
  const answer = faq.answer || faq.attributes?.answer
  const id = faq.id

  // Validate required fields
  if (!question || !answer || !id) {
    return null
  }

  // Only include published FAQs
  const isPublished = faq.isPublished ?? faq.attributes?.isPublished ?? true
  const publishedAt = faq.publishedAt ?? faq.attributes?.publishedAt

  if (isPublished === false || !publishedAt) {
    return null
  }

  return {
    id,
    question,
    answer,
    buttonText: faq.buttonText || faq.attributes?.buttonText || null,
    order: faq.order || faq.attributes?.order || 999,
    group: faq.group || faq.attributes?.group || "General",
    category: faq.category || faq.attributes?.category,
  }
}

/**
 * Group configuration with display names and icons
 * Maps Strapi group values to display labels and Lucide icons
 */
const GROUP_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  home: { label: "General", icon: Home },
  platform: { label: "Platform", icon: Globe },
  "Platform": { label: "Platform", icon: Globe },
  "Account & Registration": { label: "Account & Registration", icon: User },
  "account & registration": { label: "Account & Registration", icon: User },
  account: { label: "Account", icon: User },
  "Courses & Enrollment": { label: "Courses & Enrollment", icon: BookOpen },
  "courses & enrollment": { label: "Courses & Enrollment", icon: BookOpen },
  courses: { label: "Courses", icon: BookOpen },
  payment: { label: "Payment", icon: CreditCard },
  payments: { label: "Payment", icon: CreditCard },
  support: { label: "Support", icon: Headphones },
  general: { label: "General", icon: HelpCircle },
}

const FAQ_API_ENDPOINT = "/api/faqs"

/**
 * Main FAQ Section Component (Full Version with Grouping)
 * 
 * Features:
 * - Fetches FAQs from Strapi API
 * - Groups FAQs by category
 * - Shows 3 FAQs per category initially
 * - "Show More" button to load 3 more
 * - Smooth accordion animations
 * - Full accessibility support
 * - Responsive design
 * - Error handling and loading states
 */
export function FAQSection() {
  const [faqs, setFaqs] = useState<ProcessedFAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Fetch FAQs from API
  const fetchFaqs = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(FAQ_API_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || `Request failed with status ${res.status}`)
      }

      const data = await res.json()

      if (data.error) {
        throw new Error(data.message || data.error)
      }

      // Normalize and filter FAQs
      const normalizedFaqs = (data?.data || [])
        .map(normalizeFAQ)
        .filter((faq: ProcessedFAQ | null): faq is ProcessedFAQ => faq !== null)

      setFaqs(normalizedFaqs)
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      console.error("Failed to load FAQs", err)
      setError(`Failed to load FAQs: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  // Group FAQs by group field
  const faqsByGroup = useMemo(() => {
    const grouped: Record<string, ProcessedFAQ[]> = {}

    faqs.forEach((faq) => {
      const group = faq.group || "general"
      if (!grouped[group]) {
        grouped[group] = []
      }
      grouped[group].push(faq)
    })

    // Sort FAQs within each group by order
    Object.keys(grouped).forEach((group) => {
      grouped[group].sort((a, b) => a.order - b.order)
    })

    return grouped
  }, [faqs])

  // Get available groups
  const availableGroups = useMemo(() => {
    return Object.keys(faqsByGroup).sort()
  }, [faqsByGroup])

  // Filter FAQs by selected group
  const filteredFaqs = useMemo(() => {
    if (!selectedGroup) {
      // If no group selected, return all FAQs sorted by order (for pagination)
      return faqs.sort((a, b) => a.order - b.order)
    }
    return faqsByGroup[selectedGroup] || []
  }, [selectedGroup, faqs, faqsByGroup])

  // Handle accordion toggle (single open mode)
  const handleToggle = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }, [])

  // Handle group selection
  const handleGroupSelect = useCallback((group: string | null) => {
    setSelectedGroup(group)
    setOpenIndex(null) // Close any open accordion when switching groups
  }, [])

  // Initialize
  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchFaqs(controller.signal)
    return () => controller.abort()
  }, [fetchFaqs])

  // Don't render until hydrated (SSR safety)
  if (!hydrated) return null

  // Loading State
  if (loading) {
    return (
      <section className="py-20 lg:py-32 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading FAQs...</p>
          </div>
        </div>
      </section>
    )
  }

  // Error State
  if (error) {
    return (
      <section className="py-20 lg:py-32 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-6">
              <HelpCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Unable to Load FAQs
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            </div>
            <Button onClick={() => fetchFaqs()} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </div>
      </section>
    )
  }

  // Empty State
  if (faqs.length === 0) {
    return (
      <section className="py-20 lg:py-32 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              No FAQs Available
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              FAQs will appear here once they are added to the system.
            </p>
            <Button variant="outline" asChild>
              <a href="mailto:support@next4learn.com" className="gap-2">
                <Mail className="w-4 h-4" />
                Contact Support
              </a>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  // Main Content
  return (
    <section
      className="py-20 lg:py-32 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
      aria-labelledby="faq-heading"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2
            id="faq-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4"
          >
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
            Find answers to common questions about our platform. Can't find what you're looking for?{" "}
            <a
              href="mailto:support@next4learn.com"
              className="text-primary hover:underline font-medium"
            >
              Contact our support team
            </a>
            .
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{faqs.length} Total Questions</span>
            <span>•</span>
            <span>{availableGroups.length} Groups</span>
          </div>
        </motion.div>

        {/* Group Filter Dropdown - Centered */}
        {availableGroups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-8 flex justify-center"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={selectedGroup === null ? "default" : "outline"}
                  size="lg"
                  className={cn(
                    "rounded-full px-8 py-3",
                    "transition-all duration-200",
                    "flex items-center gap-3",
                    "shadow-lg hover:shadow-xl",
                    "min-w-[220px]",
                    "border-2",
                    selectedGroup === null
                      ? "bg-primary text-white border-primary hover:bg-primary/90"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                >
                  {selectedGroup ? (
                    <>
                      {(() => {
                        const groupInfo = GROUP_CONFIG[selectedGroup.toLowerCase()] || {
                          label: selectedGroup,
                          icon: HelpCircle,
                        }
                        const IconComponent = groupInfo.icon
                        return (
                          <>
                            <IconComponent className="w-5 h-5" />
                            <span className="font-semibold">{groupInfo.label}</span>
                          </>
                        )
                      })()}
                    </>
                  ) : (
                    <>
                      <Home className="w-5 h-5" />
                      <span className="font-semibold">All Questions</span>
                    </>
                  )}
                  <ChevronDown className="w-4 h-4 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="center"
                className={cn(
                  "w-72 max-h-[450px] overflow-y-auto",
                  "rounded-xl shadow-2xl border-2",
                  "bg-white dark:bg-gray-900",
                  "border-gray-200 dark:border-gray-700",
                  "p-2"
                )}
              >
                <DropdownMenuItem
                  onClick={() => handleGroupSelect(null)}
                  className={cn(
                    "cursor-pointer py-3 px-4 rounded-lg",
                    "flex items-center gap-3",
                    "transition-colors duration-200",
                    "hover:bg-gray-50 dark:hover:bg-gray-800",
                    selectedGroup === null && "bg-primary/10 text-primary font-semibold border border-primary/20"
                  )}
                >
                  <Home className="w-5 h-5" />
                  <span className="flex-1 font-medium">All Questions</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    {faqs.length}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                {availableGroups.map((group) => {
                  const groupInfo = GROUP_CONFIG[group.toLowerCase()] || {
                    label: group,
                    icon: HelpCircle,
                  }
                  const IconComponent = groupInfo.icon
                  const isSelected = selectedGroup === group
                  const groupFaqs = faqsByGroup[group] || []

                  return (
                    <DropdownMenuItem
                      key={group}
                      onClick={() => handleGroupSelect(group)}
                      className={cn(
                        "cursor-pointer py-3 px-4 rounded-lg",
                        "flex items-center gap-3",
                        "transition-colors duration-200",
                        "hover:bg-gray-50 dark:hover:bg-gray-800",
                        isSelected && "bg-primary/10 text-primary font-semibold border border-primary/20"
                      )}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="flex-1 font-medium">{groupInfo.label}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                        {groupFaqs.length}
                      </span>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        )}

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto">
          {selectedGroup ? (
            // Show FAQs for selected group with pagination
            <FAQCategory
              key={selectedGroup}
              category={GROUP_CONFIG[selectedGroup.toLowerCase()]?.label || selectedGroup}
              faqs={filteredFaqs}
              openIndex={openIndex}
              onToggle={handleToggle}
              itemsPerPage={3}
              startIndex={0}
            />
          ) : (
            // Show only 3 FAQs sorted by order (no grouping)
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Frequently Asked Questions
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {Math.min(3, filteredFaqs.length)} of {filteredFaqs.length} questions
                </p>
              </div>
              
              {/* Show FAQs with pagination */}
              <FAQCategory
                category=""
                faqs={filteredFaqs}
                openIndex={openIndex}
                onToggle={handleToggle}
                itemsPerPage={3}
                startIndex={0}
                hideCategoryHeader={true}
              />
            </motion.div>
          )}
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-12 text-center"
        >
          <div className={cn(
            "inline-flex flex-col sm:flex-row items-center gap-4",
            "px-6 py-4 rounded-xl",
            "bg-white dark:bg-gray-800",
            "border border-gray-200 dark:border-gray-700",
            "shadow-sm"
          )}>
            <div className="text-left">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Still have questions?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Our support team is here to help
              </p>
            </div>
            <Button asChild className="gap-2">
              <a href="mailto:support@next4learn.com">
                <Mail className="w-4 h-4" />
                Contact Support
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

