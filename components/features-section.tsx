"use client"

import { motion } from "framer-motion"
import { 
    BookOpen, 
    Users, 
    Award, 
    Clock, 
    Globe, 
    TrendingUp,
    CheckCircle2,
    Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

const features = [
    {
        icon: BookOpen,
        title: "Expert-Led Courses",
        description: "Learn from industry professionals with years of real-world experience and proven track records.",
        gradient: "from-blue-500 to-cyan-500",
    },
    {
        icon: Clock,
        title: "Learn at Your Pace",
        description: "Access courses anytime, anywhere. Study on your schedule with lifetime access to materials.",
        gradient: "from-purple-500 to-pink-500",
    },
    {
        icon: Award,
        title: "Certified Completion",
        description: "Earn recognized certificates upon course completion to showcase your new skills.",
        gradient: "from-orange-500 to-red-500",
    },
    {
        icon: Users,
        title: "Community Support",
        description: "Join a vibrant community of learners, share insights, and get help when you need it.",
        gradient: "from-green-500 to-emerald-500",
    },
    {
        icon: Globe,
        title: "Global Access",
        description: "Learn from anywhere in the world with our platform available in multiple languages.",
        gradient: "from-indigo-500 to-blue-500",
    },
    {
        icon: TrendingUp,
        title: "Career Growth",
        description: "Boost your career with skills that employers value and advance your professional journey.",
        gradient: "from-pink-500 to-rose-500",
    },
]

const benefits = [
    "Interactive learning materials",
    "Hands-on projects and exercises",
    "Regular content updates",
    "Mobile-friendly platform",
    "24/7 customer support",
    "Money-back guarantee",
]

export function FeaturesSection() {
    const router = useRouter()

    return (
        <section className="relative py-32 overflow-hidden bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
            {/* Background Decorations */}
            <div 
                className="absolute inset-0 opacity-30 dark:opacity-20"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 70%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)
                    `,
                    backgroundSize: "100% 100%",
                }}
            />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 mb-6">
                        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            Why Choose Us
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
                        Everything You Need to
                        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"> Succeed</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-gray-300 max-w-3xl mx-auto">
                        Discover what makes our learning platform the perfect choice for your educational journey.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="group relative"
                            >
                                <div className="relative h-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-transparent transition-all duration-300 hover:shadow-2xl">
                                    {/* Gradient Background on Hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
                                    
                                    {/* Icon */}
                                    <div className="relative mb-6">
                                        <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:via-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all duration-300">
                                        {feature.title}
                                    </h3>
                                    <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Benefits Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-8 md:p-12 border border-blue-100 dark:border-slate-800">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                                    Additional Benefits
                                </h3>
                                <p className="text-slate-600 dark:text-gray-300 mb-6">
                                    We go the extra mile to ensure your learning experience is exceptional.
                                </p>
                                <ul className="space-y-4">
                                    {benefits.map((benefit, index) => (
                                        <motion.li
                                            key={benefit}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                                            className="flex items-center gap-3"
                                        >
                                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            <span className="text-slate-700 dark:text-gray-300">{benefit}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl blur-2xl opacity-20" />
                                    <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl">
                                        <div className="text-center">
                                            <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                                98%
                                            </div>
                                            <div className="text-slate-600 dark:text-gray-400 mb-6">
                                                Student Satisfaction Rate
                                            </div>
                                            <Button
                                                onClick={() => router.push("/courses")}
                                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-full shadow-lg"
                                            >
                                                Start Learning Today
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

