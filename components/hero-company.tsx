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
        <section className="relative py-32 bg-white dark:bg-slate-950 overflow-hidden">
            {/* Light/Dark Mode Background */}
            <div 
                className="absolute inset-0 dark:opacity-30 opacity-10"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 30% 50%, rgba(0, 0, 0, 0.03) 0%, transparent 50%),
                        radial-gradient(circle at 70% 80%, rgba(0, 0, 0, 0.02) 0%, transparent 50%)
                    `,
                    backgroundSize: "100% 100%",
                }}
            />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-12">
                    <div
                        className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                    >
                        <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-slate-900 dark:text-white uppercase tracking-wide">
                            Trusted by Industry Leaders
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-gray-300 max-w-2xl mx-auto text-pretty">
                            Join thousands of professionals from top companies who advance their careers with our platform
                        </p>
                    </div>
                </div>

                {/* Mobile marquee for screens < 640px */}
                <div className="block sm:hidden">
                    <div className="marquee-container bg-white/80 dark:liquid-glass-card backdrop-blur-xl rounded-2xl py-6 border border-slate-200 dark:border-white/20">
                        <div className="marquee-scroll gap-8">
                            {[...companies, ...companies].map((company, index) => (
                                <div
                                    key={`${company.name}-${index}`}
                                    className="flex items-center gap-3 px-6 py-3 liquid-glass-surface rounded-xl flex-shrink-0 hover:bg-white/5 transition-colors"
                                >
                                    <div className="relative">
                                        <img
                                            src={company.logo || "/placeholder.svg"}
                                            alt={`${company.name} logo`}
                                            className="h-8 w-auto filter brightness-90 hover:brightness-110 transition-all"
                                        />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-slate-900 dark:text-white text-sm">{company.name}</div>
                                        <div className="text-xs text-slate-600 dark:text-gray-400 flex items-center gap-1">
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
                                    className={`company-card group relative p-6 rounded-3xl liquid-glass-card transition-all duration-500 ${
                                        isActive
                                            ? "border-blue-500/50 shadow-lg shadow-blue-500/20 scale-105"
                                            : "border-white/10 hover:border-white/30"
                                    }`}
                                >
                                    {/* Shimmer effect for active card */}
                                    {isActive && <div className="absolute inset-0 liquid-shimmer rounded-3xl opacity-50" />}

                                    <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                                        <div
                                            className={`relative transition-all duration-500 ${
                                                isActive ? "scale-110" : "scale-100 group-hover:scale-105"
                                            }`}
                                        >
                                            <div
                                                className={`absolute inset-0 bg-gradient-to-r ${company.gradient} rounded-xl opacity-0 blur-xl transition-opacity duration-500 ${
                                                    isActive ? "opacity-40" : "group-hover:opacity-20"
                                                }`}
                                            />
                                            <div className="relative liquid-glass-surface rounded-xl p-3">
                                                <img
                                                    src={company.logo || "/placeholder.svg"}
                                                    alt={`${company.name} logo`}
                                                    className="h-12 w-auto filter brightness-90 group-hover:brightness-110 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3
                                                className={`font-bold transition-colors duration-500 ${
                                                    isActive ? "text-blue-500 dark:text-blue-500" : "text-slate-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-500"
                                                }`}
                                            >
                                                {company.name}
                                            </h3>
                                            <div
                                                className={`flex items-center justify-center gap-1 text-sm transition-colors duration-500 ${
                                                    isActive ? "text-blue-500 dark:text-blue-500" : "text-slate-600 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-500"
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
                                        ? "w-8 bg-blue-500 shadow-lg shadow-blue-500/50"
                                        : "w-2 bg-white/20 hover:bg-blue-500/50"
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
                            className="text-center p-6 liquid-glass-card"
                        >
                            <stat.icon className="w-8 h-8 mx-auto mb-3 text-blue-500 dark:text-blue-500" />
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                            <div className="text-sm text-slate-600 dark:text-gray-400 mt-2">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
