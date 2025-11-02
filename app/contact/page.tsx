"use client"

import type React from "react"
import { useState } from "react"
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/react"
// import { Button } from "@/components/ui/button"
import { Button } from "@heroui/react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    ChevronRight,
    Mail,
    Phone,
    MapPin,
    Clock,
    Send,
    MessageCircle,
    Users,
    Headphones,
    Globe,
    GraduationCap,
} from "lucide-react"
import { HeaderDark } from "@/components/ui/headers/HeaderDark"
import { Footer } from "@/components/ui/footers/footer"
import { submitContactRequest } from "@/integrations/strapi/utils"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"

export default function ContactPage() {
    const { user } = useAuth()
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

        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                subject: formData.subject,
                purpose: formData.message, // Map message to purpose field
                ...(user?.id && { user: parseInt(user.id) }), // Include user if logged in
            }
            
            console.log("[ContactPage] Submitting contact:", payload)
            await submitContactRequest(payload)

            toast.success("Message sent successfully! We'll get back to you soon.", {
                position: "top-center",
                duration: 3000,
            })

            // Reset form
            setFormData({ name: "", email: "", subject: "", message: "" })
        } catch (error: any) {
            console.error("[ContactPage] Failed to submit contact:", error)
            toast.error(error.message || "Failed to send message. Please try again.", {
                position: "top-center",
                duration: 3000,
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }))
    }

    return (
        <div className="min-h-screen bg-background">
            <HeaderDark />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Breadcrumbs */}
                <div className="mb-8" data-aos="fade-up">
                    <Breadcrumbs size="lg" separator={<ChevronRight className="w-4 h-4" />} className="mb-4">
                        <BreadcrumbItem href="/">Home</BreadcrumbItem>
                        <BreadcrumbItem>Contact</BreadcrumbItem>
                    </Breadcrumbs>
                </div>

                {/* Header Section */}
                <div className="text-center mb-16" data-aos="fade-up" data-aos-delay="100">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                        <GraduationCap className="w-4 h-4" />
                        Get Support
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                        We're Here to <span className="text-primary">Help You</span> Succeed
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        Have questions about our courses? Need help with your learning journey? Our dedicated support team is ready
                        to assist you every step of the way.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <Card data-aos="fade-up" data-aos-delay="200" className="border-2 shadow-lg">
                            <CardHeader className="pb-6">
                                <CardTitle className="flex items-center gap-3 text-2xl">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <MessageCircle className="w-6 h-6 text-primary" />
                                    </div>
                                    Send us a Message
                                </CardTitle>
                                <p className="text-muted-foreground text-lg">
                                    Fill out the form below and we'll get back to you within 24 hours.
                                </p>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="name" className="text-sm font-semibold text-foreground">
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
                                                className="h-12 bg-input border-2 focus:border-primary transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="email" className="text-sm font-semibold text-foreground">
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
                                                className="h-12 bg-input border-2 focus:border-primary transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="subject" className="text-sm font-semibold text-foreground">
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
                                            className="h-12 bg-input border-2 focus:border-primary transition-colors"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="message" className="text-sm font-semibold text-foreground">
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
                                            className="bg-input border-2 focus:border-primary resize-none transition-colors"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
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
                        <Card data-aos="fade-up" data-aos-delay="300" className="border-2 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <div className="p-2 bg-accent/10 rounded-lg">
                                        <Phone className="w-5 h-5 text-accent" />
                                    </div>
                                    Contact Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Mail className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Email</p>
                                        <p className="text-sm text-muted-foreground">support@camedu.com</p>
                                        <p className="text-sm text-muted-foreground">info@camedu.com</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-accent/10 rounded-lg">
                                        <Phone className="w-5 h-5 text-accent" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Phone</p>
                                        <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                                        <p className="text-sm text-muted-foreground">+1 (555) 987-6543</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <MapPin className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Address</p>
                                        <p className="text-sm text-muted-foreground">
                                            123 Education Street
                                            <br />
                                            Learning City, LC 12345
                                            <br />
                                            United States
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-accent/10 rounded-lg">
                                        <Clock className="w-5 h-5 text-accent" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Business Hours</p>
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
                        <Card data-aos="fade-up" data-aos-delay="400" className="border-2 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Headphones className="w-5 h-5 text-primary" />
                                    </div>
                                    Support Options
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="w-4 h-4 text-primary" />
                                        <span className="font-semibold text-primary">Student Support</span>
                                        <Badge className="bg-primary text-primary-foreground text-xs">24/7</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Get help with courses, assignments, and technical issues.
                                    </p>
                                </div>

                                <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Globe className="w-4 h-4 text-accent" />
                                        <span className="font-semibold text-accent">General Inquiries</span>
                                        <Badge className="bg-accent text-accent-foreground text-xs">Business Hours</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Questions about partnerships, media, or general information.
                                    </p>
                                </div>

                                <div className="p-4 rounded-lg bg-muted border border-border">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageCircle className="w-4 h-4 text-foreground" />
                                        <span className="font-semibold text-foreground">Live Chat</span>
                                        <Badge className="bg-secondary text-secondary-foreground text-xs">Online</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Chat with our support team for immediate assistance.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* FAQ Link */}
                        <Card
                            data-aos="fade-up"
                            data-aos-delay="500"
                            className="bg-primary text-primary-foreground border-primary shadow-lg"
                        >
                            <CardContent className="p-6 text-center">
                                <h3 className="font-bold text-lg mb-2">Need Quick Answers?</h3>
                                <p className="text-primary-foreground/80 mb-4 text-sm">
                                    Check out our FAQ section for instant solutions to common questions.
                                </p>
                                <Button
                                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-lg"
                                >
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
