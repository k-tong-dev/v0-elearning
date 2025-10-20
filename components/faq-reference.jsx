"use client"

import { useState } from "react"
import { FaPlus, FaTimes, FaArrowRight } from "react-icons/fa"
import {Button} from "@heroui/react";


const faqs = [
  {
    question: "Can I enroll in multiple courses at once?",
    answer: "Absolutely! You can enroll in multiple courses simultaneously and access them at your convenience.",
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
    answer: "Some advanced courses have prerequisites. You’ll find them listed on the course description page.",
  },
  {
    question: "Can I download the course materials for offline access?",
    answer: "Yes, downloadable resources are provided for many courses, including PDFs and video lectures.",
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div
      data-aos="fade-up"
      data-aos-delay="300"
      className="w-screen px-4 py-20 lg:px-32 lg:py-40 grid md:grid-cols-2 gap-10 bg-white mb-20"
    >
      <div className={"text-left"}>
        <h2 className="text-3xl font-semibold mb-4 flex flex-col text-gray-400">
          Frequently
          <span>Asked Questions</span>
        </h2>
        <p className="text-gray-600 mb-6 max-w-80">
          Still you have any questions? Contact our Team via
          <a href="mailto:support@skillbridge.com" className="text-indigo-600 ml-1">
            support@skillbridge.com
          </a>
        </p>
        <Button className="text-white bg-gray-400 px-5 py-2 rounded-md text-sm font-normal">See All FAQ’s</Button>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div key={index} className="bg-white p-4 border border-gray-100 rounded-lg shadow-sm transition-all">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
              >
                <h3 className="font-medium text-left">{faq.question}</h3>
                <div className="text-gray-500 p-3 rounded-md text-sm bg-orange-50">
                  {isOpen ? <FaTimes /> : <FaPlus />}
                </div>
              </div>
              {isOpen && (
                <div className="mt-3 text-sm text-gray-600 text-left">
                  <p className={"py-5"}>{faq.answer}</p>
                  {faq.buttonText && (
                    <Button className="w-full p-4 mt-4 flex justify-between items-center bg-gray-200 text-gray-900 text-sm hover:shadow-none hover:bg-orange-400 font-normal mb-4">
                      {faq.buttonText}
                      <div className={"w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center"}>
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
  )
}
