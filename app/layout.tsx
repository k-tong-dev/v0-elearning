import type React from "react"
import type {Metadata} from "next"
import {GeistSans} from "geist/font/sans"
import {GeistMono} from "geist/font/mono"
import {ThemeProvider} from "@/components/theme-provider"
import {AuthProvider} from "@/hooks/use-auth"
import "./globals.css"

import {ToastProvider} from "@heroui/toast";
import { Toaster } from "sonner"


export const metadata: Metadata = {
    title: "CamEducation",
    description: "Modern eLearning platform with cutting-edge courses and interactive learning experiences",
    generator: "Tong",
    icons:'../../public/ui-ux-design-concept.png',
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
    creator: 'Khon Tong',
    robots: {
        index: true,
        follow: true,
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
                <ToastProvider />
                <Toaster position="top-right" richColors closeButton />
                {children}
            </AuthProvider>
        </ThemeProvider>
        </body>
        </html>
    )
}
