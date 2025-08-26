"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
      <div className="text-center space-y-8 px-4 max-w-2xl mx-auto">
        <div className="w-80 h-80 mx-auto">
          <DotLottieReact
            src="https://lottie.host/ae624a3a-021a-4e51-b64f-c3f0e6cbc81c/27dx4gDtKt.lottie"
            loop
            autoplay
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Oops! Page Not Found</h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white px-8 py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="px-8 py-3 rounded-lg transition-all duration-300 hover:bg-accent/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}
