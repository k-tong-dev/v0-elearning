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
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase">Testimonials</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
                      className="group h-full flex flex-col justify-between hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-sm relative overflow-hidden"
                  >
                    <CardContent className="p-6 flex flex-col h-full">
                      {/* Decorative background element */}
                      <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300" style={{ backgroundImage: `url(/image-79.png)`, backgroundSize: 'cover', backgroundPosition: 'center' }} />

                      {/* Quote Icon */}
                      <div className="mb-4 relative z-10">
                        <Quote className="w-8 h-8 text-primary/50 group-hover:text-primary transition-colors" />
                      </div>

                      {/* Rating */}
                      <div className="flex items-center mb-4 relative z-10">
                        {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                        ))}
                      </div>

                      {/* Content */}
                      <p className="text-foreground mb-6 leading-relaxed flex-grow relative z-10">{testimonial.content}</p>

                      {/* Author */}
                      <div className="flex items-center mt-auto relative z-10">
                        <Avatar className="w-12 h-12 mr-4 border-2 border-primary/30 group-hover:border-primary transition-colors">
                          <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {testimonial.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
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