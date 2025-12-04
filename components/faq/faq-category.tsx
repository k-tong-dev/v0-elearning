"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { FAQAccordionItem } from "./faq-accordion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/utils/utils"

/**
 * FAQ Category Component
 * 
 * Displays FAQs grouped by category with pagination (show 5 initially, load 5 more).
 * 
 * @param category - Category name (e.g., "Platform", "Account")
 * @param faqs - Array of FAQs for this category
 * @param openIndex - Currently open FAQ index (for single-open mode)
 * @param onToggle - Callback when FAQ is toggled
 * @param itemsPerPage - Number of FAQs to show initially (default: 5)
 */
interface FAQCategoryProps {
  category: string
  faqs: Array<{
    id: number
    question: string
    answer: string
    buttonText?: string | null
    order?: number
  }>
  openIndex: number | null
  onToggle: (index: number) => void
  itemsPerPage?: number
  startIndex?: number
  hideCategoryHeader?: boolean
}

const ITEMS_PER_PAGE = 3

export function FAQCategory({
  category,
  faqs,
  openIndex,
  onToggle,
  itemsPerPage = ITEMS_PER_PAGE,
  startIndex = 0,
  hideCategoryHeader = false,
}: FAQCategoryProps) {
  const [visibleCount, setVisibleCount] = useState(itemsPerPage)

  // Sort FAQs by order
  const sortedFaqs = useMemo(() => {
    return [...faqs].sort((a, b) => (a.order || 999) - (b.order || 999))
  }, [faqs])

  const visibleFaqs = sortedFaqs.slice(0, visibleCount)
  const hasMore = visibleCount < sortedFaqs.length
  const showLess = visibleCount > itemsPerPage
  const canShowBoth = sortedFaqs.length > itemsPerPage

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(prev + itemsPerPage, sortedFaqs.length))
  }

  const handleShowLess = () => {
    setVisibleCount(itemsPerPage)
  }

  if (sortedFaqs.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      {/* Category Header - Only show if not hidden */}
      {!hideCategoryHeader && category && (
        <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {category}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {sortedFaqs.length} {sortedFaqs.length === 1 ? "question" : "questions"} in this group
          </p>
        </div>
      )}

      {/* FAQ Items */}
      <div className="space-y-3">
        {visibleFaqs.map((faq, index) => {
          const localIndex = sortedFaqs.findIndex((f) => f.id === faq.id)
          const globalIndex = startIndex + localIndex
          return (
            <FAQAccordionItem
              key={faq.id}
              faq={faq}
              isOpen={openIndex === globalIndex}
              onToggle={() => onToggle(globalIndex)}
              index={globalIndex}
            />
          )
        })}
      </div>

      {/* Show More/Less Buttons */}
      {canShowBoth && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          {hasMore && (
            <button
              onClick={handleShowMore}
              className={cn(
                "group min-w-[110px]",
                "border-2 border-primary/30 bg-primary/5",
                "hover:border-primary hover:bg-primary/10",
                "text-primary dark:text-white hover:text-black dark:hover:text-blue-500 font-medium text-sm",
                "transition-all duration-300 ease-in-out",
                "shadow-sm hover:shadow-md hover:scale-105 active:scale-95",
                "px-4 py-2 rounded-md flex items-center justify-center",
                "relative overflow-hidden"
              )}
            >
              <span className="relative z-10 transition-colors duration-300 text-primary dark:text-white group-hover:text-black dark:group-hover:text-blue-500 text-sm">
                Show More
              </span>
              <ChevronDown className="ml-1.5 w-3.5 h-3.5 transition-transform group-hover:translate-y-1 relative z-10 text-primary dark:text-white group-hover:text-black dark:group-hover:text-blue-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          )}
          {showLess && (
            <button
              onClick={handleShowLess}
              className={cn(
                "group min-w-[110px]",
                "text-gray-600 dark:text-white",
                "hover:text-black dark:hover:text-blue-500",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "transition-all duration-300 ease-in-out",
                "px-4 py-2 rounded-md flex items-center justify-center",
                "hover:scale-105 active:scale-95 hover:shadow-md",
                "relative overflow-hidden text-sm"
              )}
            >
              <span className="relative z-10 transition-colors duration-300 text-gray-600 dark:text-white group-hover:text-black dark:group-hover:text-blue-500 text-sm">
                Show Less
              </span>
              <ChevronDown className="ml-1.5 w-3.5 h-3.5 rotate-180 transition-transform group-hover:-translate-y-1 relative z-10 text-gray-600 dark:text-white group-hover:text-black dark:group-hover:text-blue-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

