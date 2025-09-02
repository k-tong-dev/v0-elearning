"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Send, X, Bot, User, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area" // Assuming you have a ScrollArea component

interface ChatMessage {
    id: string
    sender: "user" | "bot" | "support"
    senderName?: string; // New: Optional sender name
    text: string
    timestamp: string
}

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputMessage, setInputMessage] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [isSending, setIsSending] = useState(false); // New state for rate limiting
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const botResponses = [
        "Hello there! How can I assist you on your learning journey today?",
        "I'm here to help with any questions about our courses, platform features, or general inquiries.",
        "To give you the best answer, could you please elaborate a bit more on your question?",
        "If you need more in-depth assistance, I can connect you with our human support team. Would you like me to do that?",
        "I'm constantly learning and improving! What can I help you with right now?",
        "Welcome to CamEdu! What's on your mind?",
        "I'm ready to help you find information or troubleshoot issues. What's your query?",
        "Thinking about a course? I can provide details or help you navigate our catalog.",
        "Is there anything specific you're looking for, or just browsing for help?",
        "I'm designed to make your experience smoother. How can I be of service?",
        "Feel free to ask me anything about CamEdu. I'll do my best to provide a helpful response!",
    ]

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const handleSendMessage = async () => {
        if (inputMessage.trim() === "" || isSending) return // Prevent sending if input is empty or already sending

        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: "user",
            senderName: "You", // Set sender name for user
            text: inputMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }

        setMessages((prev) => [...prev, newMessage])
        setInputMessage("")
        setIsSending(true); // Disable sending

        // Simulate bot response
        setIsTyping(true)
        await new Promise((resolve) => setTimeout(resolve, 1500))
        const botResponse: ChatMessage = {
            id: Date.now().toString() + "-bot",
            sender: "bot",
            senderName: "CamEdu AI", // Set sender name for bot
            text: botResponses[Math.floor(Math.random() * botResponses.length)],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages((prev) => [...prev, botResponse])
        setIsTyping(false)

        // Re-enable sending after a short delay
        setTimeout(() => {
            setIsSending(false);
        }, 1000); // 1 second delay before allowing another message
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    return (
        <>
            {/* Floating Chat Button */}
            <div
                className="fixed bottom-6 right-6 z-[1000]"
            >
                <Button
                    size="lg" // Keep size="lg" for consistent padding, but override w/h
                    className="rounded-[2.5rem] w-14 h-14 shadow-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white hover:scale-110 transition-transform duration-300 flex items-center justify-center"
                    onClick={() => setIsOpen(true)}
                >
                    <Bot className="w-6 h-6" /> {/* Adjusted icon size */}
                </Button>
            </div>

            {/* Chat Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent
                    className="gap-0 fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-md h-[80vh] max-h-[600px] p-0 flex flex-col rounded-xl overflow-hidden shadow-2xl border border-border bg-background
                    data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-full
                    data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-full"
                >
                    <DialogHeader className="bg-card text-foreground p-4 flex flex-row items-center justify-between rounded-t-xl border-b border-border shadow-sm">
                        <div className="flex items-center gap-2">
                            {/* macOS-like window controls */}
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <Bot className="ml-4 w-6 h-6" />
                        <DialogTitle className="ml-4 text-lg font-semibold flex-1 text-left gap-3 ">
                            Bot Support
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden relative bg-background">
                        {/* Animated grid background */}
                        <div className="absolute inset-0 animated-grid-background opacity-10" />
                        {/* Subtle radial gradient overlay for depth */}
                        <div className="absolute inset-0 animate-gradient-radial opacity-10" />
                        {/* New Scanline Overlay */}
                        <div className="scanline-overlay" />

                        <ScrollArea className="h-full p-4 relative z-10">
                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                                    >
                                        {msg.senderName && (
                                            <span className={`text-xs font-semibold text-muted-foreground mb-1 ${msg.sender === "user" ? "mr-2" : "ml-2"}`}>
                        {msg.senderName}
                      </span>
                                        )}
                                        <div
                                            className={`flex items-start gap-2 max-w-[80%] p-3.5 rounded-2xl shadow-sm transition-all duration-200 ${ // Increased rounded, softer shadow
                                                msg.sender === "user"
                                                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground ml-auto" // Gradient for user, push to right
                                                    : "bg-muted/50 text-foreground mr-auto" // Softer background for bot, push to left
                                            }`}
                                        >
                                            {msg.sender !== "user" && (
                                                <Avatar className="w-7 h-7 shrink-0">
                                                    <AvatarFallback className="bg-accent text-accent-foreground">
                                                        <Bot className="w-4 h-4" />
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div>
                                                <p className="text-sm leading-relaxed">{msg.text}</p> {/* Added leading-relaxed */}
                                                <span className="text-xs text-muted-foreground/70 block mt-1">{msg.timestamp}</span> {/* More subtle timestamp */}
                                            </div>
                                            {msg.sender === "user" && (
                                                <Avatar className="w-7 h-7 shrink-0">
                                                    <AvatarFallback className="bg-primary-foreground text-primary">
                                                        <User className="w-4 h-4" />
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="flex items-center gap-2 max-w-[80%] p-3.5 rounded-2xl shadow-sm bg-muted/50 text-muted-foreground"> {/* Consistent rounded and shadow */}
                                            <Avatar className="w-7 h-7 shrink-0">
                                                <AvatarFallback className="bg-accent text-accent-foreground">
                                                    <Bot className="w-4 h-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="text-sm">Typing...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="p-4 border-t border-border bg-background flex items-center gap-2 rounded-b-xl shadow-inner">
                        <Textarea
                            placeholder="Type your message..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isSending} // Disable input while sending
                            className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-background border-input focus:border-primary focus:ring-0 dark:border-cyan-500 dark:focus:border-0"
                        />
                        <Button
                            size="icon"
                            className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                            onClick={handleSendMessage}
                            disabled={inputMessage.trim() === "" || isSending} // Disable button while sending
                        >
                            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}