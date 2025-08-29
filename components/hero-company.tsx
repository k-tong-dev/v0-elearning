"use client"
import { useState, useEffect } from "react"
import { Star, Award, TrendingUp, Users } from "lucide-react"

export function HeroCompany() {
    const [activeCompanyIndex, setActiveCompanyIndex] = useState(0)
    const [isVisible, setIsVisible] = useState(false)

    const companies = [
        {
            name: "Microsoft",
            logo: "/icons8-microsoft-500.png",
            metric: "50K+ Students",
            icon: Users,
            gradient: "from-blue-500 to-blue-600",
        },
        {
            name: "Google",
            logo: "/icons8-google-128.png",
            metric: "4.9★ Rating",
            icon: Star,
            gradient: "from-red-500 to-orange-500",
        },
        {
            name: "Apple",
            logo: "/icons8-apple-inc-512.png",
            metric: "Industry Leader",
            icon: Award,
            gradient: "from-gray-600 to-gray-700",
        },
        {
            name: "Amazon",
            logo: "/icons8-amazon-512.png",
            metric: "95% Growth",
            icon: TrendingUp,
            gradient: "from-orange-500 to-yellow-500",
        },
        {
            name: "Meta",
            logo: "/icons8-meta-240.png",
            metric: "Top Rated",
            icon: Award,
            gradient: "from-blue-600 to-purple-600",
        },
    ]

    useEffect(() => {
        setIsVisible(true)
        const interval = setInterval(() => {
            setActiveCompanyIndex((prev) => (prev + 1) % companies.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [companies.length])

    return (
        <section className="relative py-16 bg-gradient-to-br from-background via-muted/20 to-background overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0">
                <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/3 rounded-full blur-3xl" />
            </div>

            <div className="container mt-[100px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-12">
                    <div
                        className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold gradient-text mb-4 text-balance uppercase tracking-wide">
                            Trusted by Industry Leaders
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                            Join thousands of professionals from top companies who advance their careers with our platform
                        </p>
                    </div>
                </div>

                {/* Mobile marquee for screens < 640px */}
                <div className="block sm:hidden">
                    <div className="marquee-container bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 py-6">
                        <div className="marquee-scroll gap-8">
                            {[...companies, ...companies].map((company, index) => (
                                <div
                                    key={`${company.name}-${index}`}
                                    className="flex items-center gap-3 px-6 py-3 bg-background/80 rounded-xl border border-border/30 backdrop-blur-sm flex-shrink-0 hover:bg-accent/10 transition-colors"
                                >
                                    <div className="relative">
                                        <img
                                            src={company.logo || "/placeholder.svg"}
                                            alt={`${company.name} logo`}
                                            className="h-8 w-auto filter brightness-90 hover:brightness-110 transition-all"
                                        />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-foreground text-sm">{company.name}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <company.icon className="w-3 h-3" />
                                            {company.metric}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grid layout for larger screens */}
                <div className="hidden sm:block">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
                        {companies.map((company, index) => {
                            const IconComponent = company.icon
                            const isActive = index === activeCompanyIndex

                            return (
                                <div
                                    key={company.name}
                                    className={`company-card group relative p-6 rounded-2xl border transition-all duration-500 ${
                                        isActive
                                            ? "bg-card border-accent/50 shadow-lg shadow-accent/20"
                                            : "bg-card/50 border-border/30 hover:border-accent/30"
                                    }`}
                                >
                                    {/* Shimmer effect for active card */}
                                    {isActive && <div className="absolute inset-0 shimmer-bg rounded-2xl opacity-50" />}

                                    <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                                        <div
                                            className={`relative transition-all duration-500 ${
                                                isActive ? "scale-110" : "scale-100 group-hover:scale-105"
                                            }`}
                                        >
                                            <div
                                                className={`absolute inset-0 bg-gradient-to-r ${company.gradient} rounded-xl opacity-0 blur-xl transition-opacity duration-500 ${
                                                    isActive ? "opacity-30" : "group-hover:opacity-20"
                                                }`}
                                            />
                                            <div className="relative bg-background/80 backdrop-blur-sm rounded-xl p-3 border border-border/50">
                                                <img
                                                    src={company.logo || "/placeholder.svg"}
                                                    alt={`${company.name} logo`}
                                                    className="h-10 w-auto filter brightness-90 group-hover:brightness-110 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3
                                                className={`font-bold transition-colors duration-500 ${
                                                    isActive ? "text-accent" : "text-foreground group-hover:text-accent"
                                                }`}
                                            >
                                                {company.name}
                                            </h3>
                                            <div
                                                className={`flex items-center justify-center gap-1 text-sm transition-colors duration-500 ${
                                                    isActive ? "text-accent/80" : "text-muted-foreground group-hover:text-accent/80"
                                                }`}
                                            >
                                                <IconComponent className="w-4 h-4" />
                                                {company.metric}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Progress indicators */}
                    <div className="flex justify-center mt-8 gap-2">
                        {companies.map((_, index) => (
                            <div
                                key={index}
                                className={`h-2 rounded-full transition-all duration-500 ${
                                    index === activeCompanyIndex
                                        ? "w-8 bg-accent shadow-lg shadow-accent/50"
                                        : "w-2 bg-muted hover:bg-accent/50"
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Stats section */}
                <div
                    className={`mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 transition-all duration-1000 delay-500 ${
                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    }`}
                >
                    {[
                        { label: "Active Students", value: "250K+", icon: Users },
                        { label: "Course Rating", value: "4.9★", icon: Star },
                        { label: "Industry Partners", value: "500+", icon: Award },
                        { label: "Success Rate", value: "95%", icon: TrendingUp },
                    ].map((stat, index) => (
                        <div
                            key={stat.label}
                            className="text-center p-4 rounded-xl bg-card/30 backdrop-blur-sm border border-border/20"
                        >
                            <stat.icon className="w-6 h-6 mx-auto mb-2 text-accent" />
                            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
