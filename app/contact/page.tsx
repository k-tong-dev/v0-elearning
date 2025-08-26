"use client"

import type React from "react"

import { useState } from "react"
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Mail, Phone, MapPin, Clock, Send, MessageCircle, Users, Headphones, Globe } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000))

    console.log("[v0] Contact form submitted:", formData)
    setIsSubmitting(false)

    // Reset form
    setFormData({ name: "", email: "", subject: "", message: "" })

    // Show success message (in real app, use toast or notification)
    alert("Thank you for your message! We'll get back to you soon.")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Breadcrumbs */}
        <div className="mb-8" data-aos="fade-up">
          <Breadcrumbs size="lg" separator={<ChevronRight className="w-4 h-4" />} className="mb-4">
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem>Contact</BreadcrumbItem>
          </Breadcrumbs>
        </div>

        {/* Header Section */}
        <div className="text-center mb-12" data-aos="fade-up" data-aos-delay="100">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions about our courses? Need help with your learning journey? We're here to help you succeed.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card data-aos="fade-up" data-aos-delay="200" className="bg-white/50 backdrop-blur-sm border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <MessageCircle className="w-6 h-6 text-cyan-600" />
                  Send us a Message
                </CardTitle>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get back to you within 24 hours.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-semibold text-foreground/80">
                        Full Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="h-12 bg-white/50 border-2 focus:border-cyan-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-semibold text-foreground/80">
                        Email Address *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="h-12 bg-white/50 border-2 focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-semibold text-foreground/80">
                      Subject *
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      placeholder="What's this about?"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="h-12 bg-white/50 border-2 focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-semibold text-foreground/80">
                      Message *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us more about your inquiry..."
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="bg-white/50 border-2 focus:border-cyan-500 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Contact Details */}
            <Card data-aos="fade-up" data-aos-delay="300" className="bg-white/50 backdrop-blur-sm border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-cyan-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-cyan-600 mt-1" />
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-sm text-muted-foreground">support@camedu.com</p>
                    <p className="text-sm text-muted-foreground">info@camedu.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-cyan-600 mt-1" />
                  <div>
                    <p className="font-semibold">Phone</p>
                    <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                    <p className="text-sm text-muted-foreground">+1 (555) 987-6543</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-cyan-600 mt-1" />
                  <div>
                    <p className="font-semibold">Address</p>
                    <p className="text-sm text-muted-foreground">
                      123 Education Street
                      <br />
                      Learning City, LC 12345
                      <br />
                      United States
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-cyan-600 mt-1" />
                  <div>
                    <p className="font-semibold">Business Hours</p>
                    <p className="text-sm text-muted-foreground">
                      Monday - Friday: 9:00 AM - 6:00 PM
                      <br />
                      Saturday: 10:00 AM - 4:00 PM
                      <br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Options */}
            <Card data-aos="fade-up" data-aos-delay="400" className="bg-white/50 backdrop-blur-sm border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-cyan-600" />
                  Support Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-50 to-emerald-50 border border-cyan-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-cyan-600" />
                    <span className="font-semibold text-cyan-700">Student Support</span>
                    <Badge className="bg-green-100 text-green-700 text-xs">24/7</Badge>
                  </div>
                  <p className="text-sm text-cyan-600">Get help with courses, assignments, and technical issues.</p>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-orange-600" />
                    <span className="font-semibold text-orange-700">General Inquiries</span>
                    <Badge className="bg-orange-100 text-orange-700 text-xs">Business Hours</Badge>
                  </div>
                  <p className="text-sm text-orange-600">
                    Questions about partnerships, media, or general information.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-purple-700">Live Chat</span>
                    <Badge className="bg-purple-100 text-purple-700 text-xs">Online</Badge>
                  </div>
                  <p className="text-sm text-purple-600">Chat with our support team for immediate assistance.</p>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Link */}
            <Card
              data-aos="fade-up"
              data-aos-delay="500"
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white"
            >
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-lg mb-2">Need Quick Answers?</h3>
                <p className="text-cyan-100 mb-4 text-sm">
                  Check out our FAQ section for instant solutions to common questions.
                </p>
                <Button variant="secondary" className="bg-white text-cyan-600 hover:bg-gray-100">
                  Visit FAQ
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
