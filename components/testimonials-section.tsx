"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Quote } from "lucide-react"
import { motion } from "framer-motion" // Import motion for animations

const testimonials = [
  {
    id: 1,
    name: "Daniel Johnson",
    role: "Software Developer",
    avatar: "/professional-man.png",
    rating: 5,
    content:
        "I've been using CanEdu for nearly two years growing my skills and I've found it to be an excellent resource for learning new technologies and staying up to date with trends.",
  },
  {
    id: 2,
    name: "Richard Nelson",
    role: "Product Manager",
    avatar: "/professional-man-glasses.png",
    rating: 5,
    content:
        "The quality of courses on CanEdu is outstanding. The instructors are industry experts and the content is always up-to-date with the latest best practices.",
  },
  {
    id: 3,
    name: "Jessica Washington",
    role: "UX Designer",
    avatar: "/professional-woman-diverse.png",
    rating: 5,
    content:
        "CanEdu has transformed my career. The practical projects and real-world applications helped me land my dream job in tech. Highly recommended!",
  },
]

export function TestimonialsSection() {
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
                          <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
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
        </div>
      </section>
  )
}