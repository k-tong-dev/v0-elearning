"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Mail } from "lucide-react"
import Link from "next/link" // Import Link

export function CTASection() {
  return (
      <section className="relative py-32 bg-white dark:bg-slate-950 overflow-hidden">
        {/* Light/Dark Mode Background */}
        <div 
            className="absolute inset-0 dark:opacity-30 opacity-10"
            style={{
                backgroundImage: `
                    radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.03) 0%, transparent 60%)
                `,
            }}
        />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main CTA */}
            <div className="mb-20">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 text-slate-900 dark:text-white leading-tight">
                Learn anything, anytime,{" "}
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent">anywhere</span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                Kickstart and fast-track your career, or explore personal interests with our premium version. Unlock
                premium experience, community access, and more.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-6 rounded-full text-lg font-semibold transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/30 hover:scale-105"
                >
                  <Link href="/pricing" className="flex items-center">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                    variant="outline"
                    size="lg"
                    className="liquid-glass-button text-slate-900 dark:text-white border-slate-200 dark:border-white/20 hover:border-slate-300 dark:hover:border-blue-400/50 hover:text-blue-600 dark:hover:text-blue-400 px-10 py-6 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105"
                >
                  Learn more
                </Button>
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="liquid-glass-card rounded-3xl p-10 max-w-lg mx-auto">
              <div className="flex items-center justify-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 rounded-2xl flex items-center justify-center">
                  <Mail className="w-7 h-7 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Stay Updated</h3>
              <p className="text-slate-600 dark:text-gray-300 mb-8 text-base">
                Get latest news, articles, and resources, sent weekly to your inbox.
              </p>
              <div className="flex gap-3">
                <Input type="email" placeholder="Enter your email" className="liquid-glass-input flex-1 border-slate-200 dark:border-white/20 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-400" />
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
  )
}