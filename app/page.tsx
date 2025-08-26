"use client"

import { useEffect } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { CoursesSection } from "@/components/courses-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { FAQSection } from "@/components/faq-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  useEffect(() => {
    // Initialize AOS (Animate On Scroll) libraryßßß
    const initAOS = async () => {
      const AOS = (await import("aos")).default
      await import("aos/dist/aos.css")

      AOS.init({
        duration: 1000,
        easing: "ease-out-cubic",
        once: true,
        offset: 100,
        delay: 0,
      })
    }

    initAOS()
  }, [])

  return (
    <main className="min-h-screen">
      <Header />
      <div data-aos="fade-up">
        <HeroSection />
      </div>
      <div data-aos="fade-up" data-aos-delay="100">
        <CoursesSection />
      </div>
      <div data-aos="fade-up" data-aos-delay="200">
        <TestimonialsSection />
      </div>
      <div data-aos="fade-up" data-aos-delay="300">
        <FAQSection />
      </div>
      <div data-aos="fade-up" data-aos-delay="400">
        <CTASection />
      </div>
      <div data-aos="fade-up" data-aos-delay="500">
        <Footer />
      </div>
    </main>
  )
}
