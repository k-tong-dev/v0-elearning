"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { FaPlus, FaTimes, FaArrowRight } from "react-icons/fa"
import { User, BookOpen, Globe, Home, HelpCircle, ChevronDown } from "lucide-react"

type Faq = {
    id?: number
    attributes?: {
        question?: string
        answer?: string
        buttonText?: string | null
        order?: number
        group?: string
        category?: string
        isPublished?: boolean
        publishedAt?: string | null
    }
}

type PopulatedFaq = {
    id: number
    attributes: {
        question: string
        answer: string
        buttonText?: string | null
        order?: number
        group?: string
        category?: string
        isPublished?: boolean
        publishedAt?: string | null
    }
}

function isValidFaq(faq: Faq): faq is PopulatedFaq {
    return (
        typeof faq?.id === "number" &&
        typeof faq?.attributes?.question === "string" &&
        typeof faq.attributes?.answer === "string"
    )
}

const FAQ_API_ENDPOINT = "/api/faqs"

// Group configuration with display names and icons
const GROUP_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  home: { label: "General", icon: Home },
  platform: { label: "Platform", icon: Globe },
  "Platform": { label: "Platform", icon: Globe },
  "account & registration": { label: "Account & Registration", icon: User },
  "Account & Registration": { label: "Account & Registration", icon: User },
  account: { label: "Account", icon: User },
  "Courses & Enrollment": { label: "Courses & Enrollment", icon: BookOpen },
  "courses & enrollment": { label: "Courses & Enrollment", icon: BookOpen },
  courses: { label: "Courses", icon: BookOpen },
  payment: { label: "Payment", icon: HelpCircle },
  payments: { label: "Payment", icon: HelpCircle },
  support: { label: "Support", icon: HelpCircle },
  general: { label: "General", icon: HelpCircle },
}

export function FAQSectionSimple() {
    const [faqs, setFaqs] = useState<Faq[]>([])
    const [openIndex, setOpenIndex] = useState(0)
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [hydrated, setHydrated] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchFaqs = useCallback(async (signal?: AbortSignal) => {
        try {
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
            
            // Check if there's an error in the response
            if (data.error) {
                throw new Error(data.message || data.error)
            }
            
            setFaqs((data?.data as Faq[]) || [])
            setError(null)
        } catch (err) {
            if ((err as Error).name === "AbortError") return
            console.error("Failed to load FAQs", err)
            setError(`Failed to load FAQs: ${(err as Error).message}`)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        setHydrated(true)
    }, [])

    useEffect(() => {
        const controller = new AbortController()
        fetchFaqs(controller.signal)
        return () => controller.abort()
    }, [fetchFaqs])

    const safeFaqs = useMemo<PopulatedFaq[]>(() => faqs.filter(isValidFaq), [faqs])

    // Group FAQs by group field
    const faqsByGroup = useMemo(() => {
        const grouped: Record<string, PopulatedFaq[]> = {}
        safeFaqs.forEach((faq) => {
            const group = faq.attributes.group || "general"
            if (!grouped[group]) {
                grouped[group] = []
            }
            grouped[group].push(faq)
        })
        Object.keys(grouped).forEach((group) => {
            grouped[group].sort((a, b) => {
                const orderA = a.attributes.order ?? 999
                const orderB = b.attributes.order ?? 999
                return orderA - orderB
            })
        })
        return grouped
    }, [safeFaqs])

    // Get available groups
    const availableGroups = useMemo(() => {
        return Object.keys(faqsByGroup).sort()
    }, [faqsByGroup])

    // Filter FAQs by selected group
    const filteredFaqs = useMemo(() => {
        if (!selectedGroup) {
            return safeFaqs.sort((a, b) => {
                const orderA = a.attributes.order ?? 999
                const orderB = b.attributes.order ?? 999
                return orderA - orderB
            })
        }
        return faqsByGroup[selectedGroup] || []
    }, [selectedGroup, safeFaqs, faqsByGroup])

    // Calculate stats
    const totalQuestions = safeFaqs.length
    const uniqueGroups = availableGroups.length

    useEffect(() => {
        if (safeFaqs.length === 0) {
            setOpenIndex(-1)
        } else {
            setOpenIndex(0)
        }
    }, [safeFaqs])

    if (!hydrated) return null

    if (loading) {
        return (
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4 lg:px-32">
                    <div className="flex items-center justify-center py-12">
                        <p className="text-muted-foreground" suppressHydrationWarning>Loading FAQs...</p>
                    </div>
                </div>
            </section>
        )
    }

    if (error) {
        return (
            <section className="py-16 lg:py-24 bg-background">
                <div className="container mx-auto px-4 lg:px-32">
                    <div className="text-center py-12">
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <button 
                            className="mt-4 px-3 py-1.5 rounded-md bg-primary text-white dark:text-white hover:text-blue-500 dark:hover:text-blue-500 transition-all duration-300 ease-in-out hover:scale-105 active:scale-95 hover:shadow-lg relative overflow-hidden group text-sm"
                            onClick={() => {
                                setLoading(true)
                                fetchFaqs()
                            }}
                        >
                            <span className="relative z-10 transition-colors duration-300 text-white dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-500 text-sm">
                                Retry
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section data-aos="fade-up" data-aos-delay="300" className="py-16 lg:py-24 bg-background">
            <div className="container mx-auto px-4 lg:px-32">
                {/* Header Section with Group Button and Title */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
                    {/* Group Filter Button - Left */}
                    {availableGroups.length > 0 && (
                        <div className="relative">
                            <button
                                onClick={() => {
                                    const currentIndex = selectedGroup ? availableGroups.indexOf(selectedGroup) : -1
                                    const nextIndex = (currentIndex + 1) % (availableGroups.length + 1)
                                    if (nextIndex === 0) {
                                        setSelectedGroup(null)
                                    } else {
                                        setSelectedGroup(availableGroups[nextIndex - 1])
                                    }
                                    setOpenIndex(0)
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 font-medium text-sm transition-all duration-300 ease-in-out hover:scale-105 active:scale-95 hover:shadow-md relative overflow-hidden group min-w-[180px] justify-between"
                            >
                                <div className="flex items-center gap-2">
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
                                                        <IconComponent className="w-4 h-4 text-primary dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-500 transition-colors duration-300" />
                                                        <span className="text-sm text-primary dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-500 transition-colors duration-300">{groupInfo.label}</span>
                                                    </>
                                                )
                                            })()}
                                        </>
                                    ) : (
                                        <>
                                            <Home className="w-4 h-4 text-primary dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-500 transition-colors duration-300" />
                                            <span className="text-sm text-primary dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-500 transition-colors duration-300">All Questions</span>
                                        </>
                                    )}
                                </div>
                                <ChevronDown className="w-4 h-4 transition-all duration-300 group-hover:rotate-180 text-primary dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-500" />
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </button>
                        </div>
                    )}

                    {/* Title - Right */}
                    <div className="flex-1 md:text-left">
                        <h2 className="text-2xl lg:text-3xl font-bold flex flex-col md:flex-row md:items-center gap-2 text-foreground">
                            <span>Frequently</span>
                            <span className="text-primary">Asked Questions</span>
                        </h2>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
                    {/* Left Column - FAQ Items */}
                    <div className="space-y-4">
                        {filteredFaqs.length === 0 ? (
                            <p className="text-muted-foreground">No FAQs found.</p>
                        ) : (
                        // Sort FAQs by order if available, otherwise maintain original order
                        filteredFaqs
                            .slice(0, 3)
                            .map((faq, index) => {
                            const { question, answer, buttonText } = faq.attributes
                            const isOpen = openIndex === index
                            return (
                                <div
                                    key={faq.id}
                                    className="bg-card p-5 border border-border/50 rounded-xl transition-all duration-200 hover:border-border hover:shadow-sm"
                                >
                                    <div
                                        className="flex justify-between items-start gap-4 cursor-pointer group"
                                        onClick={() => setOpenIndex(isOpen ? -1 : index)}
                                    >
                                        <h3 className="font-medium text-foreground text-left flex-1 leading-relaxed group-hover:text-primary transition-colors">
                                            {question}
                                        </h3>
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                            isOpen 
                                                ? "bg-primary/10 text-primary" 
                                                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                        }`}>
                                            {isOpen ? <FaTimes size={12} /> : <FaPlus size={12} />}
                                        </div>
                                    </div>
                                    {isOpen && (
                                        <div className="mt-4 pt-4 border-t border-border/50">
                                            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                                {answer}
                                            </p>
                                            {buttonText && (
                                                <button 
                                                    className="w-full py-2 mt-2 flex justify-between items-center bg-muted text-xs font-normal rounded-md transition-all duration-300 ease-in-out hover:bg-muted/80 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] relative overflow-hidden group text-foreground dark:text-white hover:text-black dark:hover:text-blue-500"
                                                >
                                                    <span className="relative z-10 transition-colors duration-300 text-foreground dark:text-white group-hover:text-black dark:group-hover:text-blue-500 text-xs">
                                                        {buttonText}
                                                    </span>
                                                    <div className="w-6 h-6 bg-background rounded-full flex items-center justify-center relative z-10 transition-transform duration-300 group-hover:translate-x-1">
                                                        <FaArrowRight 
                                                            size={10} 
                                                            className="transition-all duration-300 group-hover:scale-110 text-foreground dark:text-white group-hover:text-black dark:group-hover:text-blue-500"
                                                        />
                                                    </div>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                        )}
                    </div>

                    {/* Right Column - Header */}
                    <div className="flex flex-col justify-start text-left">
                        <p className="text-muted-foreground mb-6 leading-relaxed max-w-sm">
                            Find answers to common questions about our platform. Can't find what you're looking for? Contact our support team.
                        </p>
                        <div className="flex items-center gap-3 text-sm font-medium text-foreground">
                            <span className="px-3 py-1.5 bg-muted rounded-lg">
                                {totalQuestions} Questions
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="px-3 py-1.5 bg-muted rounded-lg">
                                {uniqueGroups} Groups
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

