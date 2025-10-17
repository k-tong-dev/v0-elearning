"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@heroui/react"
import { Textarea } from "@/components/ui/textarea"
import { Send, User, Loader2, PlusCircle } from "lucide-react"
import { motion} from "framer-motion"
import { Avatar, AvatarFallback,} from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { toast } from "sonner"
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {Modal, ModalBody, ModalContent, ModalFooter, ModalTrigger} from "@/components/ui/aceternity/animated-modal";

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
    const [inputMessage, setInputMessage] = useState("")
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
                sessionStorage.removeItem(SESSION_STORAGE_KEY);
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

    const images = [
        "https://images.unsplash.com/photo-1517322048670-4fba75cbbb62?q=80&w=3000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1573790387438-4da905039392?q=80&w=3425&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1555400038-63f5ba517a47?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1554931670-4ebfabf6e7a9?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1546484475-7f7bd55792da?q=80&w=2581&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ];
    return (
        <>
            <Modal>
                <ModalTrigger>
                    <div
                        className="fixed bottom-4 right-4 z-[1000] w-16 h-16 rounded-full cursor-pointer"
                        onClick={() => setIsOpen(true)}
                    >
                        <DotLottieReact
                            src="https://lottie.host/83e91835-85ea-4739-93c9-230aefc094f0/UcS899GXoa.lottie"
                            loop
                            autoplay/>
                    </div>
                </ModalTrigger>

                <ModalBody>
                    <ModalContent className={"p-0 md:p-0"}>
                        <div className={
                            "bg-card text-foreground p-4 flex flex-row items-center justify-between " +
                            "rounded-t-xl border-b border-border shadow-sm" +
                            "w-full"
                            }

                        >
                            <div className="flex items-center gap-2">
                                {/* macOS-like window controls */}
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                            </div>
                            <div className="ml-4 text-lg font-semibold flex-1 text-left flex items-center gap-2">
                                Chat Bot
                            </div>
                        </div>


                        <div className="flex-1 overflow-scroll scrollbar-hide relative bg-background min-h-[20rem] max-h-[30rem] sm:max-h-[27rem]">
                            <div className="absolute inset-0 animated-grid-background opacity-10" />
                            <div className="absolute inset-0 animate-gradient-radial opacity-10" />
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
                                            className={`flex items-start gap-1 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
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
                                                className={`max-w-[300px] lg:max-w-[400px] shadow-sm transition-all duration-200 prose dark:prose-invert text-sm leading-relaxed break-words overflow-hidden ${ // Added overflow-hidden and changed p-3 to p-4
                                                    msg.sender === "user"
                                                        ? "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-white rounded-xl rounded-tr-none p-3" // Changed p-3 to p-4
                                                        : "bg-muted/70 text-foreground rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-none p-3" // Changed p-3 to p-4
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
                                                <span className="text-xs text-gray-400 block mt-1">
                                                    {msg.timestamp}
                                                </span>
                                            </div>
                                            {msg.sender === "user" && (
                                                <Avatar className="w-8 h-8 shrink-0 border border-border dark:border-cyan-500">
                                                    <AvatarFallback className="bg-none text-gray-400">
                                                        <User className="w-4 h-4" />
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                        </motion.div>
                                    ))}
                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="flex items-center gap-3 max-w-[75%] p-3 rounded-xl text-muted-foreground rounded-bl-none">
                                                <Avatar className="w-8 h-8 shrink-0 border border-border">
                                                    <DotLottieReact
                                                        src="https://lottie.host/2fcd5a23-b86e-4928-92e1-37823429859f/D07zrPadBJ.lottie"
                                                        loop
                                                        autoplay
                                                    />
                                                </Avatar>
                                                <span className="text-sm">CamEdu AI is typing...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>
                        </div>

                        <div className="relative p-4 border-t border-border bg-background flex flex-row items-end justify-end gap-2 rounded-b-xl shadow-inner">
                            <Textarea
                                placeholder="Type your message..."
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isSending}
                                className="text-nowrap min-h-[5rem] max-h-[20rem] scrollbar-hide resize-none bg-background border-gray-400 border-1 rounded-[1rem] focus:border-0 focus:ring-0 dark:border-gray-500 dark:focus:border-0 pr-3"
                            />
                            <Button
                                size="icon"
                                className="w-10 h-10 text-gray-200 bg-gray-400 dark:bg-gray-600 rounded-[0.8rem] absolute right-5 bottom-5"
                                onClick={handleSendMessage}
                                disabled={inputMessage.trim() === "" || isSending}
                            >
                                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </Button>
                        </div>
                    </ModalContent>
                    <ModalFooter className="gap-4">
                        <Button onClick={handleNewChat}
                                className="bg-black text-white dark:bg-white dark:text-black text-sm px-2 py-1 rounded-md border border-black w-28">
                            <PlusCircle className="w-5 h-5" />
                            <span>New Chat</span>
                        </Button>
                    </ModalFooter>
                </ModalBody>
            </Modal>

        </>
    )
}
