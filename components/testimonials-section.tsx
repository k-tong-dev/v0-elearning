"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Quote } from "lucide-react"
import { motion } from "framer-motion"
import { getCourseReviewers } from "@/integrations/strapi/courseReviewer"

interface Testimonial {
  id: number
  name: string
  role: string
  avatar?: string | null
  rating: number
  content: string
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setIsLoading(true)
        // Fetch all course reviews (testimonials)
        const reviews = await getCourseReviewers(undefined, false) // false = only published
        
        // Filter reviews with descriptions and map to testimonial format
        // Only show real testimonials from database, no fallbacks
        const formattedTestimonials = reviews
          .filter(review => review.description && review.description.trim().length > 0)
          .slice(0, 6) // Take up to 6 testimonials
          .map((review) => {
            const user = review.user
            const avatarData = user?.avatar?.data?.attributes || user?.avatar?.attributes || user?.avatar
            const avatarUrl = avatarData?.url || avatarData
            const fullAvatarUrl = avatarUrl 
              ? (avatarUrl.startsWith('http') 
                  ? avatarUrl 
                  : `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}${avatarUrl}`)
              : null

            // Get user role from their profile or use default
            const role = user?.bio ? "Student" : "Learner"

            return {
              id: review.id,
              name: user?.name || user?.username || "Anonymous",
              role: role,
              avatar: fullAvatarUrl,
              rating: review.rating_stars || 5,
              content: review.description || "",
            }
          })

        // Only set real testimonials from database, no fallbacks
        setTestimonials(formattedTestimonials)
      } catch (error) {
        console.error("Error fetching testimonials:", error)
        // On error, just show empty array - no fallback testimonials
        setTestimonials([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTestimonials()
  }, [])
  return (
      <section className="py-32 bg-white dark:bg-slate-950 relative">
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-slate-900 dark:text-white uppercase tracking-wide">
              Testimonials
            </h2>
            <p className="text-lg text-slate-600 dark:text-gray-300 max-w-2xl mx-auto">
              Hear from our learners as they share their journeys of transformation, success, and how our platform has
              made a difference in their lives.
            </p>
          </div>

          {/* Testimonials Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                  <motion.div
                      key={testimonial.id}
                      initial={{ opacity: 0, y: 50, scale: 0.9 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card
                        className="group h-full flex flex-col justify-between liquid-glass-card hover:border-blue-500/30 relative overflow-hidden"
                    >
                      <CardContent className="p-8 flex flex-col h-full">
                        {/* Quote Icon */}
                        <div className="mb-6 relative z-10">
                          <Quote className="w-10 h-10 text-blue-500/50 dark:text-blue-500/50 group-hover:text-blue-500 dark:group-hover:text-blue-500 transition-colors" />
                        </div>

                        {/* Rating */}
                        <div className="flex items-center mb-6 relative z-10">
                          {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                          ))}
                        </div>

                        {/* Content */}
                        <p className="text-slate-700 dark:text-white/90 mb-8 leading-relaxed flex-grow relative z-10 text-lg">{testimonial.content}</p>

                        {/* Author */}
                        <div className="flex items-center mt-auto relative z-10">
                          <Avatar className="w-14 h-14 mr-4 border-2 border-blue-500/30 dark:border-blue-500/30 group-hover:border-blue-500 dark:group-hover:border-blue-500 transition-colors">
                            <AvatarImage 
                              src={testimonial.avatar || "/placeholder.svg"} 
                              alt={testimonial.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.svg"
                              }}
                            />
                            <AvatarFallback className="bg-blue-500/10 dark:bg-blue-500/10 text-blue-500 dark:text-blue-500">
                              {testimonial.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</h4>
                            <p className="text-sm text-slate-600 dark:text-gray-400">{testimonial.role}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-gray-400">No testimonials available yet.</p>
            </div>
          )}
        </div>
      </section>
  )
}