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
        "Hello! How can I assist you today?",
        "I'm here to help with any questions about our courses or platform.",
        "Could you please provide more details about your issue?",
        "Our support team will be happy to help you. Would you like me to connect you?",
        "I'm still learning, but I'll do my best to answer!",
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
                    size="lg"
                    className="rounded-[2.5rem] w-14 h-14 shadow-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white hover:scale-110 transition-transform duration-300 flex items-center justify-center"
                    onClick={() => setIsOpen(true)}
                >
                    <Bot className="w-6 h-6" /> {/* Adjusted icon size */}
                </Button>
            </div>

            {/* Chat Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent
                    className="gap-0 fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-md h-[80vh] max-h-[600px] p-0 flex flex-col rounded-xl overflow-hidden shadow-2xl border-2 border-primary/20 glass-enhanced
                    data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-full
                    data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-full"
                >
                    <DialogHeader className="bg-gradient-to-r from-cyan-600 to-emerald-600 text-white p-4 flex flex-row items-center justify-between rounded-t-xl shadow-lg">
                        <div className="flex items-center gap-3">
                            <Bot className="w-6 h-6" />
                            <DialogTitle className="text-xl font-bold">CamEdu AI Support</DialogTitle>
                        </div>
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
                                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`flex items-start gap-2 max-w-[80%] p-3.5 rounded-xl shadow-md ${
                                                msg.sender === "user"
                                                    ? "bg-primary text-primary-foreground rounded-br-md" // User message style
                                                    : "bg-accent/20 text-foreground rounded-bl-md" // Bot message style
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
                                                <p className="text-sm">{msg.text}</p>
                                                <span className="text-xs text-muted-foreground opacity-80 block mt-1">{msg.timestamp}</span>
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
                                        <div className="flex items-center gap-2 max-w-[80%] p-3.5 rounded-xl rounded-bl-md shadow-md bg-muted text-muted-foreground">
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
                            className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-background border-input focus:border-primary focus:ring-0"
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