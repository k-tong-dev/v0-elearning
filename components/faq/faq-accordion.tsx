"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/utils/utils"

/**
 * FAQ Accordion Item Component
 * 
 * A single FAQ accordion item with smooth animations and accessibility features.
 * 
 * @param faq - The FAQ object with question, answer, and optional buttonText
 * @param isOpen - Whether this accordion is currently open
 * @param onToggle - Callback function when accordion is toggled
 * @param index - Index for ARIA attributes
 */
interface FAQAccordionItemProps {
  faq: {
    id: number
    question: string
    answer: string
    buttonText?: string | null
    order?: number
  }
  isOpen: boolean
  onToggle: () => void
  index: number
}

export function FAQAccordionItem({ faq, isOpen, onToggle, index }: FAQAccordionItemProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | "auto">("auto")

  // Calculate height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0)
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onToggle()
    }
  }

  return (
    <div
      className={cn(
        "group border border-gray-200 dark:border-gray-800 rounded-xl",
        "bg-white dark:bg-gray-900/50",
        "backdrop-blur-sm",
        "transition-all duration-300 ease-out",
        "hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5",
        isOpen && "border-primary shadow-xl ring-2 ring-primary/20"
      )}
    >
      {/* Question Header - Clickable */}
      <button
        type="button"
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${faq.id}`}
        id={`faq-question-${faq.id}`}
        className={cn(
          "w-full px-6 py-5 text-left",
          "flex items-center justify-between gap-4",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
          "transition-colors duration-200"
        )}
      >
        <h3
          className={cn(
            "text-base font-semibold text-gray-900 dark:text-gray-100",
            "flex-1 pr-4",
            "group-hover:text-primary transition-colors"
          )}
        >
          {faq.question}
        </h3>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full",
            "flex items-center justify-center",
            "bg-gray-100 dark:bg-gray-800",
            "group-hover:bg-primary/10 transition-colors",
            isOpen && "bg-primary/10"
          )}
        >
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-primary" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          )}
        </motion.div>
      </button>

      {/* Answer Content - Animated */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div
              ref={contentRef}
              id={`faq-answer-${faq.id}`}
              role="region"
              aria-labelledby={`faq-question-${faq.id}`}
              className="px-6 pb-5"
            >
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                {faq.answer}
              </p>
              
              {/* Optional Action Button */}
              {faq.buttonText && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2",
                      "text-sm font-medium text-primary",
                      "bg-primary/10 hover:bg-primary/20",
                      "rounded-lg transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-primary/50"
                    )}
                  >
                    {faq.buttonText}
                    <ChevronDown className="w-4 h-4 rotate-[-90deg]" aria-hidden="true" />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

