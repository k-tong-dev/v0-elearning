"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthModal } from "@/components/auth-modal"
import { Menu, X, BookOpen, User, Search, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isExploreOpen, setIsExploreOpen] = useState(false)
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: "signin" as "signin" | "signup" })

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSignIn = () => {
    setAuthModal({ isOpen: true, mode: "signin" })
  }

  const handleSignUp = () => {
    setAuthModal({ isOpen: true, mode: "signup" })
  }

  const handleCloseAuth = () => {
    setAuthModal({ isOpen: false, mode: "signin" })
  }

  const handleToggleAuthMode = () => {
    setAuthModal((prev) => ({
      ...prev,
      mode: prev.mode === "signin" ? "signup" : "signin",
    }))
  }

  const handleSearch = () => {
    console.log("[v0] Search button clicked from header")
    // Add search modal or redirect to search page
  }

  const exploreItems = [
    { title: "Forum", description: "Join discussions with fellow learners", href: "/forum" },
    { title: "About Us", description: "Learn about our mission and team", href: "/about" },
    { title: "Blog", description: "Read our latest articles and insights", href: "/blog" },
    { title: "Services", description: "Explore our educational services", href: "/services" },
    { title: "Support", description: "Get help when you need it", href: "/support" },
    { title: "Contact", description: "Reach out to our team", href: "/contact" },
  ]

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-background/80 backdrop-blur-md border-b border-border" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:animate-glow transition-all duration-300">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                CamEdu
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-foreground hover:text-primary transition-colors duration-200">
                Home
              </Link>
              <Link href="/courses" className="text-foreground hover:text-primary transition-colors duration-200">
                Courses
              </Link>
              <DropdownMenu open={isExploreOpen} onOpenChange={setIsExploreOpen}>
                <DropdownMenuTrigger className="flex items-center gap-1 text-foreground hover:text-primary transition-colors duration-200">
                  Explore
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${isExploreOpen ? "rotate-180" : ""}`}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {exploreItems.map((item) => (
                      <DropdownMenuItem key={item.title} asChild>
                        <Link href={item.href} className="flex flex-col items-start p-3 rounded-lg hover:bg-accent/20">
                          <span className="font-medium text-sm">{item.title}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href="/pricing" className="text-foreground hover:text-primary transition-colors duration-200">
                Partner & Price
              </Link>
              <Link href="/contact" className="text-foreground hover:text-primary transition-colors duration-200">
                Contact
              </Link>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="hover:bg-accent/20" onClick={handleSearch}>
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" className="hover:bg-accent/20" onClick={handleSignIn}>
                <User className="w-4 h-4 mr-2" />
                Login
              </Button>
              <Button
                onClick={handleSignUp}
                className="relative bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-6 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-orange-400/25 overflow-hidden group"
              >
                <span className="relative z-10">Sign Up!</span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="hover:bg-accent/20"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border animate-slide-in-up">
              <nav className="flex flex-col space-y-4 p-4">
                <Link href="/" className="text-foreground hover:text-primary transition-colors duration-200 py-2">
                  Home
                </Link>
                <Link
                  href="/courses"
                  className="text-foreground hover:text-primary transition-colors duration-200 py-2"
                >
                  Courses
                </Link>
                <div className="space-y-2">
                  <span className="text-foreground font-medium py-2">Explore</span>
                  <div className="pl-4 space-y-2">
                    {exploreItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors duration-200 py-1"
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>
                <Link
                  href="/pricing"
                  className="text-foreground hover:text-primary transition-colors duration-200 py-2"
                >
                  Partner & Price
                </Link>
                <Link
                  href="/contact"
                  className="text-foreground hover:text-primary transition-colors duration-200 py-2"
                >
                  Contact
                </Link>
                <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                  <Button variant="ghost" className="justify-start hover:bg-accent/20" onClick={handleSignIn}>
                    <User className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                  <Button
                    onClick={handleSignUp}
                    className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white"
                  >
                    Sign Up!
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* AuthModal component */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={handleCloseAuth}
        mode={authModal.mode}
        onToggleMode={handleToggleAuthMode}
      />
    </>
  )
}
