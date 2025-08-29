"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Calendar,
  Clock,
  Star,
  Users,
  Code,
  BookOpen,
  MessageCircle,
  Video,
  CheckCircle,
  ArrowRight,
  Filter,
  Search,
  DollarSign,
  Award,
  Zap,
  Target,
  Globe,
  Laptop,
  Briefcase,
  GraduationCap
} from "lucide-react"
import { motion } from "framer-motion"

interface Service {
  id: string
  title: string
  description: string
  longDescription: string
  category: string
  price: {
    amount: number
    currency: string
    period: string
  }
  duration: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  features: string[]
  provider: {
    id: string
    name: string
    avatar: string
    role: string
    rating: number
    completedSessions: number
    expertise: string[]
  }
  tags: string[]
  availability: string[]
  deliverables: string[]
  popular: boolean
}

interface ServiceCategory {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  serviceCount: number
}

export default function ServicesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [priceRange, setPriceRange] = useState("all")
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [bookingStep, setBookingStep] = useState(1)
  const [bookingData, setBookingData] = useState({
    date: "",
    time: "",
    requirements: "",
    name: "",
    email: ""
  })

  const categories: ServiceCategory[] = [
    {
      id: "mentoring",
      name: "1-on-1 Mentoring",
      description: "Personalized guidance from industry experts",
      icon: Users,
      color: "bg-blue-500",
      serviceCount: 12
    },
    {
      id: "code-review",
      name: "Code Review",
      description: "Professional code analysis and feedback",
      icon: Code,
      color: "bg-green-500",
      serviceCount: 8
    },
    {
      id: "project-help",
      name: "Project Assistance",
      description: "Get help with your coding projects",
      icon: Laptop,
      color: "bg-purple-500",
      serviceCount: 15
    },
    {
      id: "career-coaching",
      name: "Career Coaching",
      description: "Career guidance and interview preparation",
      icon: Briefcase,
      color: "bg-orange-500",
      serviceCount: 6
    },
    {
      id: "workshops",
      name: "Workshops",
      description: "Interactive group learning sessions",
      icon: GraduationCap,
      color: "bg-cyan-500",
      serviceCount: 10
    }
  ]

  const services: Service[] = [
    {
      id: "1",
      title: "React Development Mentoring",
      description: "One-on-one mentoring session to advance your React skills",
      longDescription: "Get personalized guidance from a React expert with 5+ years of experience. We'll cover everything from basic concepts to advanced patterns, hooks, state management, and best practices.",
      category: "mentoring",
      price: { amount: 75, currency: "USD", period: "per hour" },
      duration: "60 minutes",
      difficulty: "Intermediate",
      features: [
        "1-on-1 video call",
        "Personalized learning plan",
        "Code review included",
        "Follow-up resources",
        "Slack support for 1 week"
      ],
      provider: {
        id: "mentor-1",
        name: "Emma Rodriguez",
        avatar: "/images/Avatar.jpg",
        role: "Senior React Developer",
        rating: 4.9,
        completedSessions: 234,
        expertise: ["React", "TypeScript", "Next.js", "Redux"]
      },
      tags: ["React", "JavaScript", "Frontend", "Mentoring"],
      availability: ["Mon-Fri 9AM-6PM EST", "Weekend slots available"],
      deliverables: ["Session recording", "Personalized roadmap", "Code examples"],
      popular: true
    },
    {
      id: "2",
      title: "Full-Stack Code Review",
      description: "Comprehensive review of your full-stack application",
      longDescription: "Get a thorough review of your application's architecture, code quality, security, and performance. Includes detailed feedback and recommendations for improvement.",
      category: "code-review",
      price: { amount: 150, currency: "USD", period: "per project" },
      duration: "2-3 days",
      difficulty: "Advanced",
      features: [
        "Complete codebase analysis",
        "Security audit",
        "Performance optimization tips",
        "Architecture review",
        "Detailed written report"
      ],
      provider: {
        id: "mentor-2",
        name: "Mike Chen",
        avatar: "/images/Avatar.jpg",
        role: "Full-Stack Architect",
        rating: 4.8,
        completedSessions: 156,
        expertise: ["Node.js", "Python", "AWS", "Docker", "MongoDB"]
      },
      tags: ["Code Review", "Full-Stack", "Architecture", "Security"],
      availability: ["Mon-Fri", "48-72 hour turnaround"],
      deliverables: ["Detailed report", "Refactored code examples", "Best practices guide"],
      popular: false
    },
    {
      id: "3",
      title: "Portfolio Project Development",
      description: "Build an impressive portfolio project with expert guidance",
      longDescription: "Work with a mentor to create a standout portfolio project that showcases your skills. Perfect for job seekers looking to demonstrate their abilities to potential employers.",
      category: "project-help",
      price: { amount: 200, currency: "USD", period: "per project" },
      duration: "2-4 weeks",
      difficulty: "Beginner",
      features: [
        "Project planning session",
        "Weekly check-ins",
        "Code review at each milestone",
        "Deployment assistance",
        "Job application guidance"
      ],
      provider: {
        id: "mentor-3",
        name: "Lisa Wang",
        avatar: "/images/Avatar.jpg",
        role: "Tech Entrepreneur",
        rating: 5.0,
        completedSessions: 89,
        expertise: ["Startups", "Product Management", "Mobile Development"]
      },
      tags: ["Portfolio", "Project", "Career", "Mentoring"],
      availability: ["Flexible schedule", "Weekly meetings"],
      deliverables: ["Complete portfolio project", "README documentation", "Deployment guide"],
      popular: true
    },
    {
      id: "4",
      title: "Tech Interview Preparation",
      description: "Mock interviews and coding challenge practice",
      longDescription: "Prepare for technical interviews with mock sessions, coding challenges, and behavioral question practice. Get feedback on your performance and areas for improvement.",
      category: "career-coaching",
      price: { amount: 100, currency: "USD", period: "per session" },
      duration: "90 minutes",
      difficulty: "Intermediate",
      features: [
        "Mock technical interview",
        "Coding challenge practice",
        "Behavioral questions",
        "Performance feedback",
        "Interview strategy tips"
      ],
      provider: {
        id: "mentor-4",
        name: "David Park",
        avatar: "/images/Avatar.jpg",
        role: "Senior Hiring Manager",
        rating: 4.7,
        completedSessions: 178,
        expertise: ["Technical Interviews", "System Design", "Leadership"]
      },
      tags: ["Interview", "Career", "Coding Challenges", "Practice"],
      availability: ["Mon-Fri evenings", "Weekend mornings"],
      deliverables: ["Interview feedback", "Improvement plan", "Practice problems"],
      popular: false
    },
    {
      id: "5",
      title: "React Testing Workshop",
      description: "Learn testing best practices in a hands-on group session",
      longDescription: "Join other developers in learning how to write effective tests for React applications. Cover unit testing, integration testing, and end-to-end testing strategies.",
      category: "workshops",
      price: { amount: 45, currency: "USD", period: "per person" },
      duration: "3 hours",
      difficulty: "Intermediate",
      features: [
        "Live coding session",
        "Interactive exercises",
        "Q&A with expert",
        "Workshop materials",
        "Recording access"
      ],
      provider: {
        id: "mentor-5",
        name: "Alex Thompson",
        avatar: "/images/Avatar.jpg",
        role: "Testing Specialist",
        rating: 4.6,
        completedSessions: 67,
        expertise: ["Testing", "Jest", "Cypress", "Quality Assurance"]
      },
      tags: ["Workshop", "Testing", "React", "Group Learning"],
      availability: ["Saturdays 2PM EST", "Monthly sessions"],
      deliverables: ["Workshop recording", "Code samples", "Testing checklist"],
      popular: true
    }
  ]

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory
    
    const matchesPrice = priceRange === "all" || 
      (priceRange === "under-50" && service.price.amount < 50) ||
      (priceRange === "50-100" && service.price.amount >= 50 && service.price.amount <= 100) ||
      (priceRange === "over-100" && service.price.amount > 100)

    return matchesSearch && matchesCategory && matchesPrice
  })

  const popularServices = filteredServices.filter(service => service.popular)
  const regularServices = filteredServices.filter(service => !service.popular)

  const handleBookService = (service: Service) => {
    setSelectedService(service)
    setBookingStep(1)
  }

  const handleBookingSubmit = () => {
    // In real app, this would process the booking
    console.log("Booking submitted:", { service: selectedService, booking: bookingData })
    setSelectedService(null)
    setBookingStep(1)
    setBookingData({ date: "", time: "", requirements: "", name: "", email: "" })
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
    ))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
            Expert Services
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get personalized help from industry experts to accelerate your learning and advance your career
          </p>
        </motion.div>

        {/* Service Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Service Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {categories.map((category, index) => {
              const IconComponent = category.icon
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="group"
                >
                  <Card 
                    className={`text-center hover:shadow-lg transition-all hover:scale-105 cursor-pointer ${
                      selectedCategory === category.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{category.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                      <Badge variant="secondary">{category.serviceCount} services</Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <SelectValue placeholder="All Categories" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <SelectValue placeholder="All Prices" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="under-50">Under $50</SelectItem>
                    <SelectItem value="50-100">$50 - $100</SelectItem>
                    <SelectItem value="over-100">Over $100</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("all")
                    setPriceRange("all")
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-8">
          {/* Popular Services */}
          {popularServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500" />
                Popular Services
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {popularServices.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="group"
                  >
                    <Card className="h-full hover:shadow-xl transition-all hover:scale-[1.02] relative overflow-hidden">
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-yellow-500 text-black font-semibold">
                          <Zap className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      </div>

                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={service.provider.avatar} />
                              <AvatarFallback>
                                {service.provider.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                {service.title}
                              </h3>
                              <p className="text-muted-foreground mb-2">{service.description}</p>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">{service.provider.name}</span>
                                <Badge variant="outline">{service.provider.role}</Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  {getRatingStars(service.provider.rating)}
                                  <span className="ml-1">{service.provider.rating}</span>
                                </div>
                                <span className="text-muted-foreground">
                                  {service.provider.completedSessions} sessions
                                </span>
                              </div>
                            </div>
                          </div>

                          <Separator />

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-2xl font-bold text-primary">
                                ${service.price.amount}
                                <span className="text-sm font-normal text-muted-foreground ml-1">
                                  {service.price.period}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Duration: {service.duration}
                              </div>
                            </div>
                            
                            <div>
                              <Badge 
                                variant="outline"
                                className={`mb-2 ${
                                  service.difficulty === 'Beginner' ? 'border-green-500 text-green-700' :
                                  service.difficulty === 'Intermediate' ? 'border-yellow-500 text-yellow-700' :
                                  'border-red-500 text-red-700'
                                }`}
                              >
                                {service.difficulty}
                              </Badge>
                              <div className="text-sm text-muted-foreground">
                                Category: {categories.find(c => c.id === service.category)?.name}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-4">
                            {service.tags.slice(0, 4).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="space-y-2 mb-4">
                            <h4 className="font-semibold text-sm">What's included:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {service.features.slice(0, 3).map((feature, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              className="flex-1 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                              onClick={() => handleBookService(service)}
                            >
                              Book Now
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                            <Button variant="outline">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* All Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">All Services</h2>
              <div className="text-sm text-muted-foreground">
                Showing {filteredServices.length} services
              </div>
            </div>
            
            <div className="space-y-6">
              {regularServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="group"
                >
                  <Card className="hover:shadow-lg transition-all hover:scale-[1.01]">
                    <CardContent className="p-6">
                      <div className="md:flex gap-6">
                        <div className="md:w-2/3 space-y-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={service.provider.avatar} />
                              <AvatarFallback>
                                {service.provider.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                {service.title}
                              </h3>
                              <p className="text-muted-foreground mb-3">{service.description}</p>
                              
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-medium">{service.provider.name}</span>
                                <Badge variant="outline">{service.provider.role}</Badge>
                                <div className="flex items-center gap-1">
                                  {getRatingStars(service.provider.rating)}
                                  <span className="ml-1">{service.provider.rating}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {service.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="md:w-1/3 space-y-4 mt-4 md:mt-0">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              ${service.price.amount}
                              <span className="text-sm font-normal text-muted-foreground ml-1">
                                {service.price.period}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {service.duration} • {service.difficulty}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Button 
                              className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                              onClick={() => handleBookService(service)}
                            >
                              Book Service
                            </Button>
                            <Button variant="outline" className="w-full">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* No Results */}
          {filteredServices.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No services found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                  setPriceRange("all")
                }}
              >
                Clear All Filters
              </Button>
            </motion.div>
          )}
        </div>

        {/* Booking Dialog */}
        <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Book Service: {selectedService?.title}</DialogTitle>
            </DialogHeader>
            
            {selectedService && (
              <div className="space-y-6">
                {bookingStep === 1 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-accent/50 rounded-lg">
                      <h4 className="font-semibold mb-2">Service Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Provider:</span>
                          <span className="ml-2 font-medium">{selectedService.provider.name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="ml-2">{selectedService.duration}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Price:</span>
                          <span className="ml-2 font-bold text-primary">
                            ${selectedService.price.amount} {selectedService.price.period}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Category:</span>
                          <span className="ml-2">{categories.find(c => c.id === selectedService.category)?.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Preferred Date</label>
                        <Input 
                          type="date" 
                          value={bookingData.date}
                          onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Preferred Time</label>
                        <Select value={bookingData.time} onValueChange={(value) => setBookingData(prev => ({ ...prev, time: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="09:00">9:00 AM</SelectItem>
                            <SelectItem value="10:00">10:00 AM</SelectItem>
                            <SelectItem value="11:00">11:00 AM</SelectItem>
                            <SelectItem value="14:00">2:00 PM</SelectItem>
                            <SelectItem value="15:00">3:00 PM</SelectItem>
                            <SelectItem value="16:00">4:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Requirements/Goals</label>
                      <Textarea 
                        placeholder="Tell us about your goals and what you'd like to focus on..."
                        value={bookingData.requirements}
                        onChange={(e) => setBookingData(prev => ({ ...prev, requirements: e.target.value }))}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setSelectedService(null)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setBookingStep(2)}>
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {bookingStep === 2 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Contact Information</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Full Name</label>
                        <Input 
                          value={bookingData.name}
                          onChange={(e) => setBookingData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input 
                          type="email"
                          value={bookingData.email}
                          onChange={(e) => setBookingData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <h5 className="font-semibold text-green-800 mb-2">Booking Summary</h5>
                      <div className="text-sm text-green-700 space-y-1">
                        <div>Service: {selectedService.title}</div>
                        <div>Date: {bookingData.date}</div>
                        <div>Time: {bookingData.time}</div>
                        <div>Total: ${selectedService.price.amount}</div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setBookingStep(1)}>
                        Back
                      </Button>
                      <Button 
                        onClick={handleBookingSubmit}
                        disabled={!bookingData.name || !bookingData.email}
                        className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                      >
                        Confirm Booking
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Footer />
    </div>
  )
}
