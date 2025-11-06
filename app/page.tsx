"use client"

import { useEffect } from "react"
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import { HeroSectionModern } from "@/components/hero-section-modern"
import { FreeLessonsSection } from "@/components/free-lessons-section"
import { CoursesSection } from "@/components/courses/courses-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { FAQSection } from "@/components/faq-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/ui/footers/footer"
import {HeroCompany} from "@/components/hero-company";
import "aos/dist/aos.css"

export default function HomePage() {
    useEffect(() => {
        const initAOS = async () => {
            const AOS = (await import("aos")).default
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
            <div>
                <HeaderUltra />
            </div>
            <div data-aos="fade-up">
                <HeroSectionModern />
            </div>
            <div data-aos="fade-up">
                <FreeLessonsSection />
            </div>
            <div data-aos="fade-up">
                <HeroCompany />
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