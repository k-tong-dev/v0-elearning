"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    id: 1,
    name: "Daniel Johnson",
    role: "Software Developer",
    avatar: "/professional-man.png",
    rating: 5,
    content:
      "I've been using EduVerse for nearly two years growing my skills and I've found it to be an excellent resource for learning new technologies and staying up to date with trends.",
  },
  {
    id: 2,
    name: "Richard Nelson",
    role: "Product Manager",
    avatar: "/professional-man-glasses.png",
    rating: 5,
    content:
      "The quality of courses on EduVerse is outstanding. The instructors are industry experts and the content is always up-to-date with the latest best practices.",
  },
  {
    id: 3,
    name: "Jessica Washington",
    role: "UX Designer",
    avatar: "/professional-woman-diverse.png",
    rating: 5,
    content:
      "EduVerse has transformed my career. The practical projects and real-world applications helped me land my dream job in tech. Highly recommended!",
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
            <Card
              key={testimonial.id}
              className="group card-3d hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-sm animate-slide-in-up"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <CardContent className="p-6">
                {/* Quote Icon */}
                <div className="mb-4">
                  <Quote className="w-8 h-8 text-primary/30" />
                </div>

                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-foreground mb-6 leading-relaxed">{testimonial.content}</p>

                {/* Author */}
                <div className="flex items-center">
                  <Avatar className="w-12 h-12 mr-4">
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
          ))}
        </div>
      </div>
    </section>
  )
}
