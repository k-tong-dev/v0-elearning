"use client"

import React, { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Search,
  HelpCircle,
  MessageSquare,
  BookOpen,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MessageCircle,
  Users,
  Shield,
  Settings,
  CreditCard,
  Video,
  FileText,
  Send,
  ChevronRight,
  Star,
  ThumbsUp,
  Filter
} from "lucide-react"
import { motion } from "framer-motion"

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  helpful: number
  tags: string[]
  popular: boolean
}

interface SupportCategory {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  articleCount: number
}

interface Ticket {
  id: string
  subject: string
  status: "open" | "in-progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  category: string
  createdAt: string
  lastUpdate: string
}

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketData, setTicketData] = useState({
    subject: "",
    category: "",
    priority: "",
    description: "",
    email: "",
    name: ""
  })

  const categories: SupportCategory[] = [
    {
      id: "general",
      name: "General Questions",
      description: "Common questions about our platform",
      icon: HelpCircle,
      color: "bg-blue-500",
      articleCount: 15
    },
    {
      id: "account",
      name: "Account & Billing",
      description: "Account management and payment issues",
      icon: CreditCard,
      color: "bg-green-500",
      articleCount: 12
    },
    {
      id: "technical",
      name: "Technical Support",
      description: "Platform bugs and technical issues",
      icon: Settings,
      color: "bg-red-500",
      articleCount: 8
    },
    {
      id: "courses",
      name: "Courses & Content",
      description: "Course access and content questions",
      icon: BookOpen,
      color: "bg-purple-500",
      articleCount: 20
    },
    {
      id: "community",
      name: "Community",
      description: "Forum and community guidelines",
      icon: Users,
      color: "bg-orange-500",
      articleCount: 6
    },
    {
      id: "privacy",
      name: "Privacy & Security",
      description: "Data protection and security",
      icon: Shield,
      color: "bg-cyan-500",
      articleCount: 9
    }
  ]

  const faqs: FAQ[] = [
    {
      id: "1",
      question: "How do I reset my password?",
      answer: "To reset your password, click on the 'Forgot Password' link on the login page. Enter your email address and we'll send you instructions to create a new password. Make sure to check your spam folder if you don't see the email within a few minutes.",
      category: "account",
      helpful: 245,
      tags: ["password", "login", "account"],
      popular: true
    },
    {
      id: "2",
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time from your account settings. Go to Billing > Subscription and click 'Cancel Subscription'. You'll retain access until the end of your current billing period.",
      category: "account",
      helpful: 189,
      tags: ["subscription", "cancel", "billing"],
      popular: true
    },
    {
      id: "3",
      question: "How do I access my purchased courses?",
      answer: "Once you've purchased a course, it will appear in your 'My Courses' section in your dashboard. You can access it anytime by logging into your account and navigating to the courses tab.",
      category: "courses",
      helpful: 156,
      tags: ["courses", "access", "purchase"],
      popular: true
    },
    {
      id: "4",
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. All payments are processed securely through our encrypted payment system.",
      category: "account",
      helpful: 134,
      tags: ["payment", "billing", "methods"],
      popular: false
    },
    {
      id: "5",
      question: "Is there a mobile app available?",
      answer: "Yes, we have mobile apps for both iOS and Android. You can download them from the App Store or Google Play Store. The mobile app allows you to access courses, participate in forums, and track your progress on the go.",
      category: "technical",
      helpful: 98,
      tags: ["mobile", "app", "download"],
      popular: false
    },
    {
      id: "6",
      question: "How do I report inappropriate content in the forum?",
      answer: "If you encounter inappropriate content, click the 'Report' button next to the post or comment. Our moderation team will review the report within 24 hours and take appropriate action.",
      category: "community",
      helpful: 67,
      tags: ["report", "forum", "moderation"],
      popular: false
    },
    {
      id: "7",
      question: "Can I get a refund for a course?",
      answer: "We offer a 30-day money-back guarantee for all courses. If you're not satisfied within 30 days of purchase, contact our support team for a full refund. After 30 days, refunds are evaluated on a case-by-case basis.",
      category: "account",
      helpful: 178,
      tags: ["refund", "money-back", "guarantee"],
      popular: true
    },
    {
      id: "8",
      question: "How do I download course materials?",
      answer: "Course materials can be downloaded from the course page. Look for the download icon next to each resource. Note that some materials may be streaming-only for copyright reasons.",
      category: "courses",
      helpful: 145,
      tags: ["download", "materials", "resources"],
      popular: false
    }
  ]

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const popularFAQs = filteredFAQs.filter(faq => faq.popular)
  const regularFAQs = filteredFAQs.filter(faq => !faq.popular)

  const handleTicketSubmit = () => {
    console.log("Ticket submitted:", ticketData)
    setShowTicketForm(false)
    setTicketData({
      subject: "",
      category: "",
      priority: "",
      description: "",
      email: "",
      name: ""
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-500"
      case "in-progress": return "bg-yellow-500"
      case "resolved": return "bg-green-500"
      case "closed": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "text-green-600"
      case "medium": return "text-yellow-600"
      case "high": return "text-orange-600"
      case "urgent": return "text-red-600"
      default: return "text-gray-600"
    }
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
            Help & Support
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions or get personalized support from our team
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Browse Knowledge Base</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Search through our comprehensive help articles
                </p>
                <Button variant="outline" className="w-full">
                  Explore Articles
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Live Chat Support</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get instant help from our support team
                </p>
                <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                  Start Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Submit Ticket</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a support ticket for complex issues
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowTicketForm(true)}
                >
                  Create Ticket
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Support Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Support Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    className={`hover:shadow-lg transition-all hover:scale-105 cursor-pointer ${
                      selectedCategory === category.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {category.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">{category.articleCount} articles</Badge>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search help articles..."
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
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Popular FAQs */}
            {popularFAQs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500" />
                  Popular Questions
                </h2>
                
                <Accordion type="single" collapsible className="space-y-4">
                  {popularFAQs.map((faq, index) => (
                    <motion.div
                      key={faq.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <AccordionItem value={faq.id} className="border rounded-lg px-6 bg-card">
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-start gap-3 text-left">
                            <Star className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                            <div>
                              <h3 className="font-medium">{faq.question}</h3>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <Badge variant="outline">
                                  {categories.find(c => c.id === faq.category)?.name}
                                </Badge>
                                <span className="flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3" />
                                  {faq.helpful} helpful
                                </span>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4 text-muted-foreground">
                          <Separator className="mb-4" />
                          <p className="leading-relaxed">{faq.answer}</p>
                          <div className="flex items-center gap-2 mt-4">
                            <span className="text-xs text-muted-foreground">Was this helpful?</span>
                            <Button variant="ghost" size="sm" className="h-6">
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              Yes
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6">
                              No
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </Accordion>
              </motion.div>
            )}

            {/* All FAQs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {selectedCategory === "all" ? "All Questions" : categories.find(c => c.id === selectedCategory)?.name + " Questions"}
                </h2>
                <div className="text-sm text-muted-foreground">
                  {filteredFAQs.length} articles found
                </div>
              </div>
              
              <Accordion type="single" collapsible className="space-y-4">
                {regularFAQs.map((faq, index) => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <AccordionItem value={faq.id} className="border rounded-lg px-6 bg-card">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-start gap-3 text-left">
                          <HelpCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <h3 className="font-medium">{faq.question}</h3>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <Badge variant="outline">
                                {categories.find(c => c.id === faq.category)?.name}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="w-3 h-3" />
                                {faq.helpful} helpful
                              </span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 text-muted-foreground">
                        <Separator className="mb-4" />
                        <p className="leading-relaxed">{faq.answer}</p>
                        <div className="flex items-center gap-2 mt-4">
                          <span className="text-xs text-muted-foreground">Was this helpful?</span>
                          <Button variant="ghost" size="sm" className="h-6">
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            Yes
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6">
                            No
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>

              {filteredFAQs.length === 0 && (
                <div className="text-center py-16">
                  <HelpCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search terms or browse different categories
                  </p>
                  <Button onClick={() => setShowTicketForm(true)}>
                    Can't find what you're looking for? Create a ticket
                  </Button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Options */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Need More Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Live Chat
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Support
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowTicketForm(true)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Submit Ticket
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Response Times */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Response Times
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Live Chat</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      &lt; 5 min
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Email</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      &lt; 24 hours
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Support Ticket</span>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      &lt; 48 hours
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Video Tutorials */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Video Tutorials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3">
                    <div className="p-3 bg-accent/50 rounded-lg hover:bg-accent/70 cursor-pointer transition-colors">
                      <h4 className="text-sm font-medium">Getting Started</h4>
                      <p className="text-xs text-muted-foreground">5 min tutorial</p>
                    </div>
                    <div className="p-3 bg-accent/50 rounded-lg hover:bg-accent/70 cursor-pointer transition-colors">
                      <h4 className="text-sm font-medium">Course Navigation</h4>
                      <p className="text-xs text-muted-foreground">3 min tutorial</p>
                    </div>
                    <div className="p-3 bg-accent/50 rounded-lg hover:bg-accent/70 cursor-pointer transition-colors">
                      <h4 className="text-sm font-medium">Account Settings</h4>
                      <p className="text-xs text-muted-foreground">4 min tutorial</p>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full text-xs">
                    View All Tutorials
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Ticket Form Dialog */}
        <Dialog open={showTicketForm} onOpenChange={setShowTicketForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Support Ticket</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input 
                    value={ticketData.name}
                    onChange={(e) => setTicketData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input 
                    type="email"
                    value={ticketData.email}
                    onChange={(e) => setTicketData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input 
                  value={ticketData.subject}
                  onChange={(e) => setTicketData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief description of your issue"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={ticketData.category} onValueChange={(value) => setTicketData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={ticketData.priority} onValueChange={(value) => setTicketData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  placeholder="Please provide detailed information about your issue..."
                  className="min-h-32"
                  value={ticketData.description}
                  onChange={(e) => setTicketData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-800 mb-2">💡 Tips for better support</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Include steps to reproduce the issue</li>
                  <li>• Mention your browser and operating system</li>
                  <li>• Attach screenshots if relevant</li>
                  <li>• Be as specific as possible</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTicketForm(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleTicketSubmit}
                  disabled={!ticketData.subject || !ticketData.description || !ticketData.email}
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Ticket
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Footer />
    </div>
  )
}
