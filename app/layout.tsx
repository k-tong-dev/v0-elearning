import type React from "react"
import type {Metadata} from "next"
import {GeistSans} from "geist/font/sans"
import {GeistMono} from "geist/font/mono"
import {ThemeProvider} from "@/components/theme-provider"
import {AuthProvider} from "@/hooks/use-auth"

import "./globals.css"
import "./fonts.css"

import { Toaster } from "sonner"
import { ChatWidget } from "@/components/chat-widget"


export const metadata: Metadata = {
    title: "CamEducation",
    description: "Modern eLearning platform with cutting-edge courses and interactive learning experiences",
    generator: "Tong",
    appleWebApp: true,
    publisher: "CamEducation",
    appLinks: {},
    applicationName: "CamEducation",
    classification: 'My Classification',
    abstract: 'CamEducation',
    authors: {
        name: "CMU Team Project Final Year 2025",
        url: "https://khontong.vercel.app",
    },
    category: 'eLearning',
    creator: 'KHON TONG',
    robots: {
        index: true,
        follow: true,
    },
    icons: {
        icon: "/camedu-logo.png",
        shortcut: "/camedu-logo.png",
        apple: "/camedu-logo.png",
    },
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
            <AuthProvider>
                <Toaster position="top-right" richColors closeButton />
                {children}
                <ChatWidget />
            </AuthProvider>
        </ThemeProvider>
        </body>
        </html>
    )
}