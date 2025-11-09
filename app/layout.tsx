import type React from "react"
import type {Metadata} from "next"
import {GeistSans} from "geist/font/sans"
import {GeistMono} from "geist/font/mono"
import {ThemeProvider} from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { AuthRedirector } from "@/components/AuthRedirector" // Import the new AuthRedirector
import { CookieConsent } from '@/components/CookieConsent';

import "./globals.css"
import "./fonts.css"
import "@/styles/glass.style.css"
import "@/styles/liquid-glass.css"
import "@/styles/ultra-liquid-toast.css"

import { UltraLiquidToaster } from "@/components/ui/ultra-liquid-toast"
import { ChatWidget } from "@/components/chat-widget"
import { ActivityTracker } from "@/components/ActivityTracker"


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
        <head>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        </head>
        <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
            <AuthProvider>
                <ActivityTracker />
                <UltraLiquidToaster />
                <AuthRedirector>
                    <CookieConsent/>
                    {children}
                    <ChatWidget />
                </AuthRedirector>
            </AuthProvider>
        </ThemeProvider>
        </body>
        </html>
    )
}