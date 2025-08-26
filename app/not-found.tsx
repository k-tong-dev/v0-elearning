"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft, Search, BookOpen, Users, Award } from "lucide-react"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-orange-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="text-center space-y-8 px-4 max-w-4xl mx-auto relative z-10">
        <div className="relative">
          <div className="w-80 h-80 mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-full blur-2xl animate-pulse"></div>
            <DotLottieReact
              src="https://lottie.host/ae624a3a-021a-4e51-b64f-c3f0e6cbc81c/27dx4gDtKt.lottie"
              loop
              autoplay
              className="relative z-10"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-8xl md:text-9xl font-black bg-gradient-to-r from-cyan-600 via-emerald-600 to-orange-500 bg-clip-text text-transparent animate-gradient-x">
              404
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-emerald-500 mx-auto rounded-full"></div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Oops! This Page Got Lost in Cyberspace
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Don't worry! Even the best explorers sometimes take a wrong turn. Let's get you back on track to your
            learning journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
          <Link href="/courses" className="group">
            <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-50 to-emerald-50 dark:from-cyan-950/30 dark:to-emerald-950/30 border border-cyan-200/50 dark:border-cyan-800/50 hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105">
              <BookOpen className="w-8 h-8 text-cyan-600 mb-3 mx-auto" />
              <h3 className="font-semibold text-foreground mb-2">Browse Courses</h3>
              <p className="text-sm text-muted-foreground">Explore our learning catalog</p>
            </div>
          </Link>

          <Link href="/" className="group">
            <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-orange-50 dark:from-emerald-950/30 dark:to-orange-950/30 border border-emerald-200/50 dark:border-emerald-800/50 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105">
              <Users className="w-8 h-8 text-emerald-600 mb-3 mx-auto" />
              <h3 className="font-semibold text-foreground mb-2">Join Community</h3>
              <p className="text-sm text-muted-foreground">Connect with learners</p>
            </div>
          </Link>

          <div className="p-6 rounded-xl bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30 border border-orange-200/50 dark:border-orange-800/50 hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 cursor-pointer">
            <Award className="w-8 h-8 text-orange-600 mb-3 mx-auto" />
            <h3 className="font-semibold text-foreground mb-2">Get Certified</h3>
            <p className="text-sm text-muted-foreground">Earn valuable credentials</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/25 hover:scale-105"
          >
            <Link href="/">
              <Home className="w-5 h-5 mr-3" />
              Back to Home
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
            className="px-10 py-4 rounded-xl text-lg font-semibold border-2 hover:bg-accent/20 transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 mr-3" />
            Go Back
          </Button>
        </div>

        <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border/50 max-w-md mx-auto">
          <p className="text-sm text-muted-foreground mb-3">Looking for something specific?</p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-emerald-500">
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
