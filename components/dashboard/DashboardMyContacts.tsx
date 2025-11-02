"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
    MessageCircle,
    Send,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Plus,
    Loader2,
} from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { format } from "date-fns"
import { submitContactRequest } from "@/integrations/strapi/utils"
import { getAccessToken } from "@/lib/cookies"

export function DashboardMyContacts() {
    const { user, refreshUser } = useAuth()
    const strapiURL = process.env.NEXT_PUBLIC_STRAPI_URL
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [subject, setSubject] = useState("")
    const [purpose, setPurpose] = useState("")
    const [loading, setLoading] = useState(false)
    const [contacts, setContacts] = useState<Array<{
        id: number
        documentId?: string
        name: string
        email: string
        subject: string
        purpose: string
        createdAt: string
    }>>([])

    // Fetch contact history on mount
    useEffect(() => {
        const fetchContacts = async () => {
            if (!user?.id) return
            
            try {
                const access_token = getAccessToken()
                const response = await fetch(`${strapiURL}/api/contacts?filters[user][id][$eq]=${user.id}&populate=*&sort=createdAt:desc`, {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                })
                
                if (response.ok) {
                    const data = await response.json()
                    setContacts(data.data || [])
                }
            } catch (error) {
                console.error("Failed to fetch contacts:", error)
            }
        }
        fetchContacts()
    }, [user?.id, strapiURL])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (!user?.id) {
            toast.error("You must be logged in to contact support.", {
                position: "top-center",
            })
            setLoading(false)
            return
        }

        try {
            const payload = {
                name: user.username || user.email || "",
                email: user.email || "",
                subject,
                purpose,
                user: parseInt(user.id),
            }
            
            console.log("[DashboardMyContacts] Submitting contact:", payload)
            await submitContactRequest(payload)

            toast.success("Message sent successfully! We'll get back to you soon.", {
                position: "top-center",
                duration: 3000,
            })

            setSubject("")
            setPurpose("")
            setIsDialogOpen(false)
            
            // Refresh to show new contact
            await refreshUser()
            
            // Refetch contacts
            const access_token = getAccessToken()
            const response = await fetch(`${strapiURL}/api/contacts?filters[user][id][$eq]=${user.id}&populate=*&sort=createdAt:desc`, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                setContacts(data.data || [])
            }
        } catch (error: any) {
            console.error("Failed to send contact request:", error)
            toast.error(error.message || "Failed to send message", {
                position: "top-center",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Contact Support
                    </h2>
                    <p className="text-muted-foreground mt-1">Get in touch with our support team</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg">
                            <Plus className="w-4 h-4 mr-2" />
                            New Message
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Send a Message</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject">
                                    Subject <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="What is your message about?"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="purpose">
                                    Message <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="purpose"
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    placeholder="Tell us how we can help... Describe your question or concern in detail."
                                    rows={6}
                                    required
                                    className="resize-none"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {purpose.length}/1000 characters
                                </p>
                            </div>
                            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </div>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Message
                                    </>
                                )}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </motion.div>

            {/* Quick Contact Options */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="liquid-glass-card">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Quick Contact</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-200/20">
                                <Mail className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium">Email</p>
                                    <p className="text-xs text-muted-foreground">support@camedu.com</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-200/20">
                                <Phone className="w-5 h-5 text-green-600" />
                                <div>
                                    <p className="text-sm font-medium">Phone</p>
                                    <p className="text-xs text-muted-foreground">+855 12 345 678</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-200/20">
                                <MapPin className="w-5 h-5 text-purple-600" />
                                <div>
                                    <p className="text-sm font-medium">Office</p>
                                    <p className="text-xs text-muted-foreground">Phnom Penh, Cambodia</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Contact History */}
            {contacts.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3 className="text-lg font-semibold mb-4">Recent Messages</h3>
                    <div className="grid gap-4">
                        {contacts.map((contact, index) => (
                            <Card key={contact.id} className="liquid-glass-card">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MessageCircle className="w-4 h-4 text-blue-500" />
                                                <h4 className="font-semibold">{contact.subject}</h4>
                                            </div>
                                            <div className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                                                {contact.purpose}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(contact.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    )
}

