"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FaPlus, FaTimes, FaArrowRight } from "react-icons/fa"

const faqs = [
  {
    question: "Can I enroll in multiple courses at once?",
    answer: "You can enroll in multiple courses simultaneously and access them at your convenience.",
    buttonText: "Enrollment Process for Different Courses",
    expanded: true,
  },
  {
    question: "What kind of support can I expect from instructors?",
    answer: "Our instructors offer email and live chat support during course hours.",
  },
  {
    question: "Are the courses self-paced or do they have specific start and end dates?",
    answer: "Most of our courses are self-paced, but some have defined schedules. Please check the course details.",
  },
  {
    question: "Are there any prerequisites for the courses?",
    answer: "Some advanced courses have prerequisites. You'll find them listed on the course description page.",
  },
  {
    question: "Can I download the course materials for offline access?",
    answer: "Yes, downloadable resources are provided for many courses, including PDFs and video lectures.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section data-aos="fade-up" data-aos-delay="300" className="py-20 lg:py-40 bg-background">
      <div className="container mx-auto px-4 lg:px-32">
        <div className="grid md:grid-cols-2 gap-10">
          {/* Left Column - Header */}
          <div className="text-left">
            <h2 className="text-3xl font-semibold mb-4 flex flex-col">
              Frequently
              <span>Asked Questions</span>
            </h2>
            <p className="text-muted-foreground mb-6 max-w-80">
              Still you have any questions? Contact our Team via
              <a href="mailto:support@camedu.com" className="text-primary ml-1">
                support@camedu.com
              </a>
            </p>
            <Button className="bg-muted text-foreground px-5 py-2 rounded-md text-sm font-normal hover:bg-muted/80">
              See All FAQ's
            </Button>
          </div>

          {/* Right Column - FAQ Items */}
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index
              return (
                <div
                  key={index}
                  className="bg-card p-4 border border-border rounded-lg shadow-sm transition-all hover:shadow-md"
                >
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  >
                    <h3 className="font-medium text-left pr-4">{faq.question}</h3>
                    <div className="text-muted-foreground p-3 rounded-md text-sm bg-orange-50 dark:bg-orange-950">
                      {isOpen ? <FaTimes /> : <FaPlus />}
                    </div>
                  </div>
                  {isOpen && (
                    <div className="mt-3 text-sm text-muted-foreground text-left">
                      <p className="py-5">{faq.answer}</p>
                      {faq.buttonText && (
                        <Button className="w-full p-4 mt-4 flex justify-between items-center bg-muted text-foreground text-sm hover:shadow-none font-normal mb-4">
                          {faq.buttonText}
                          <div className="w-9 h-9 bg-background rounded-full flex items-center justify-center">
                            <FaArrowRight />
                          </div>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
