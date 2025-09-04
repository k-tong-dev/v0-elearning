"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Send, X, Bot, User, Loader2, Sparkles, PlusCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { toast } from "sonner"
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remarkGfm for GitHub Flavored Markdown
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; // Import SyntaxHighlighter
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Import a style for highlighting

interface ChatMessage {
    id: string
    sender: "user" | "bot"
    content: string
    timestamp: string
    role: "user" | "assistant"
}

const SESSION_STORAGE_KEY = "camedu_chat_messages";

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputMessage, setInputMessage] = useState("") // Fixed: Correctly initialize useState
    const [isTyping, setIsTyping] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Load messages from session storage on component mount
    useEffect(() => {
        const storedMessages = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (storedMessages) {
            try {
                setMessages(JSON.parse(storedMessages));
            } catch (e) {
                console.error("Failed to parse stored messages:", e);
                sessionStorage.removeItem(SESSION_STORAGE_KEY); // Clear invalid data
            }
        }
    }, []);

    // Save messages to session storage whenever messages state changes
    useEffect(() => {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const handleSendMessage = async () => {
        if (inputMessage.trim() === "" || isSending) return

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: "user",
            content: inputMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            role: "user",
        }

        setMessages((prev) => [...prev, userMessage])
        setInputMessage("")
        setIsSending(true)
        setIsTyping(true)

        try {
            const apiMessages = messages.map(msg => ({ role: msg.role, content: msg.content }));
            apiMessages.push({ role: userMessage.role, content: userMessage.content });

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages: apiMessages }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get response from AI.');
            }

            const data = await response.json();
            const botResponse: ChatMessage = {
                id: Date.now().toString() + "-bot",
                sender: "bot",
                content: data.response,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                role: "assistant",
            }
            setMessages((prev) => [...prev, botResponse])
        } catch (error: any) {
            console.error('Chatbot error:', error);
            toast.error(error.message || "Failed to connect to the AI. Please try again.");
            const errorMessage: ChatMessage = {
                id: Date.now().toString() + "-error",
                sender: "bot",
                content: "Oops! I encountered an error. Please try again or contact support if the issue persists.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                role: "assistant",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsTyping(false)
            setIsSending(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleNewChat = () => {
        setMessages([]);
        setInputMessage("");
        setIsTyping(false);
        setIsSending(false);
        sessionStorage.removeItem(SESSION_STORAGE_KEY); // Clear session storage for new chat
        toast.info("Started a new chat session!");
    }

    return (
        <>
            {/* Floating Chat Button - Only render if chat is NOT open */}
            {!isOpen && (
                <div
                    className="fixed bottom-4 right-4 z-[1000] w-16 h-16 rounded-full cursor-pointer"
                    onClick={() => setIsOpen(true)}
                >
                    <DotLottieReact
                        src="https://lottie.host/83e91835-85ea-4739-93c9-230aefc094f0/UcS899GXoa.lottie"
                        loop
                        autoplay
                    />
                </div>
            )}

            {/* Chat Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent
                    className="gap-0 fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-md lg:max-w-xl h-[80vh] max-h-[600px] p-0 flex flex-col rounded-xl overflow-hidden shadow-2xl border border-border bg-background
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
                        <DialogTitle className="ml-4 text-lg font-semibold flex-1 text-left flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            CamEdu AI Chat
                        </DialogTitle>
                        <Button variant="ghost" size="icon" onClick={handleNewChat} className="hover:bg-accent/20 mr-6">
                            <PlusCircle className="w-5 h-5" />
                            <span className="sr-only">New Chat</span>
                        </Button>
                        {/* Removed the duplicate close button */}
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
                                {messages.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center text-muted-foreground py-8"
                                    >
                                        <div className="w-32 h-32 mx-auto mb-4"> {/* Container for lottie */}
                                            <DotLottieReact
                                                src="https://lottie.host/8e4dc7ea-d549-4c32-8d4e-d2d0c825a7d8/C5RAdvAFYS.lottie"
                                                loop
                                                autoplay
                                            />
                                        </div>
                                        <p className="text-lg font-semibold mb-2">How can I help you today?</p>
                                        <p className="text-sm">Ask me anything about CamEdu courses, learning, or tech!</p>
                                    </motion.div>
                                )}
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className={`flex items-start gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        {msg.sender === "bot" && (
                                            <Avatar className="w-8 h-8 shrink-0 border border-border">
                                                <AvatarFallback className="bg-muted/70 text-foreground">
                                                    <DotLottieReact
                                                        src="https://lottie.host/ca28f67e-40b3-4a93-a89b-43e22c768eca/3Bdr1kIW3G.lottie"
                                                        loop
                                                        autoplay
                                                    />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div
                                            className={`max-w-[75%] shadow-sm transition-all duration-200 prose dark:prose-invert text-sm leading-relaxed break-words overflow-hidden ${ // Added overflow-hidden and changed p-3 to p-4
                                                msg.sender === "user"
                                                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-none p-4" // Changed p-3 to p-4
                                                    : "bg-muted/70 text-foreground rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-none p-4" // Changed p-3 to p-4
                                            }`}
                                        >
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    code({ node, inline, className, children, ...props }) {
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        return !inline && match ? (
                                                            <SyntaxHighlighter
                                                                style={atomDark}
                                                                language={match[1]}
                                                                PreTag="div"
                                                                {...props}
                                                            >
                                                                {String(children).replace(/\n$/, '')}
                                                            </SyntaxHighlighter>
                                                        ) : (
                                                            <code className={className} {...props}>
                                                                {children}
                                                            </code>
                                                        );
                                                    },
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                            <span className="text-xs text-muted-foreground/70 block mt-1">
                                                {msg.timestamp}
                                            </span>
                                        </div>
                                        {msg.sender === "user" && (
                                            <Avatar className="w-8 h-8 shrink-0 border border-border">
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    <User className="w-4 h-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </motion.div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="flex items-center gap-3 max-w-[75%] p-3 rounded-xl shadow-sm bg-muted/70 text-muted-foreground rounded-bl-none">
                                            <Avatar className="w-8 h-8 shrink-0 border border-border">
                                                <DotLottieReact
                                                    src="https://lottie.host/2fcd5a23-b86e-4928-92e1-37823429859f/D07zrPadBJ.lottie"
                                                    loop
                                                    autoplay
                                                />
                                            </Avatar>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="text-sm">CamEdu AI is typing...</span>
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
                            disabled={isSending}
                            className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-background border-input focus:border-primary focus:ring-0 dark:border-cyan-500 dark:focus:border-0"
                        />
                        <Button
                            size="icon"
                            className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                            onClick={handleSendMessage}
                            disabled={inputMessage.trim() === "" || isSending}
                        >
                            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}