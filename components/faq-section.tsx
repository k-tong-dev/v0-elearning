"use client"

import { useState } from "react"
import {Button} from "@heroui/react"
import { motion } from "framer-motion"
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
        <section data-aos="fade-up" data-aos-delay="300" className="py-32 lg:py-40 bg-white dark:bg-slate-950 relative">
            {/* Light/Dark Mode Background */}
            <div 
                className="absolute inset-0 dark:opacity-30 opacity-10"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 20% 50%, rgba(0, 0, 0, 0.03) 0%, transparent 60%),
                        radial-gradient(circle at 80% 80%, rgba(0, 0, 0, 0.02) 0%, transparent 60%)
                    `,
                    backgroundSize: "100% 100%",
                }}
            />
            <div className="container mx-auto px-4 lg:px-32 relative z-10">
                <div className="grid md:grid-cols-2 gap-12">
                    {/* Left Column - Header */}
                    <div className="text-left">
                        <h2 className="text-4xl sm:text-5xl font-bold mb-6 flex flex-col text-slate-900 dark:text-white uppercase tracking-wide">
                            Frequently
                            <span className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent">Asked Questions</span>
                        </h2>
                        <p className="text-slate-600 dark:text-gray-300 mb-8 max-w-80 text-lg">
                            Still you have any questions? Contact our Team via
                            <a href="mailto:support@camedu.com" className="text-blue-500 dark:text-blue-400 ml-1 hover:underline">
                                support@camedu.com
                            </a>
                        </p>
                        <Button className="liquid-glass-button text-slate-900 dark:text-white border-slate-200 dark:border-blue-400/50 hover:border-slate-300 dark:hover:border-blue-400/50 px-6 py-3 rounded-full text-sm font-normal">
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
                                    className="liquid-glass-card p-6 rounded-2xl shadow-sm transition-all hover:border-blue-400/30"
                                >
                                    <div
                                        className="flex justify-between items-center cursor-pointer"
                                        onClick={() => setOpenIndex(isOpen ? -1 : index)}
                                    >
                                        <h3 className="font-medium text-left pr-4 text-slate-900 dark:text-white text-lg">{faq.question}</h3>
                                        <div className="text-slate-900 dark:text-white p-3 rounded-full text-sm bg-blue-100 dark:bg-blue-400/20 hover:bg-blue-200 dark:hover:bg-blue-400/30 transition-colors">
                                            {isOpen ? <FaTimes /> : <FaPlus />}
                                        </div>
                                    </div>
                                    {isOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="mt-4 text-slate-600 dark:text-gray-300 text-left"
                                        >
                                            <p className="py-4 text-base leading-relaxed">{faq.answer}</p>
                                            {faq.buttonText && (
                                                <Button className="w-full py-6 mt-4 flex justify-between items-center liquid-glass-button text-slate-900 dark:text-white border-slate-200 dark:border-blue-400/50 hover:border-slate-300 dark:hover:border-blue-400/50 text-sm font-normal mb-4 rounded-3xl">
                                                    {faq.buttonText}
                                                    <div className="w-9 h-9 bg-blue-400/20 hover:bg-blue-400/30 rounded-full flex items-center justify-center transition-colors">
                                                        <FaArrowRight className="text-blue-400" />
                                                    </div>
                                                </Button>
                                            )}
                                        </motion.div>
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