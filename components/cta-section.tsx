"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Mail } from "lucide-react"
import Link from "next/link" // Import Link

export function CTASection() {
  return (
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main CTA */}
            <div className="mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Learn anything, anytime,{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">anywhere</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Kickstart and fast-track your career, or explore personal interests with our premium version. Unlock
                premium experience, community access, and more.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 hover:scale-105"
                >
                  <Link href="/pricing" className="flex items-center"> {/* Link to pricing page */}
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 bg-transparent"
                >
                  Learn more
                </Button>
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="glass rounded-2xl p-8 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Stay Updated</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Get latest news, articles, and resources, sent weekly to your inbox.
              </p>
              <div className="flex gap-2">
                <Input type="email" placeholder="Enter your email" className="flex-1 bg-background/50 border-border/50" />
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/25">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
  )
}