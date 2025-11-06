"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { User, Lock, Users, Sliders, Target, BookOpen, Award } from "lucide-react"
import { toast } from "sonner"
import {
    registerAccount,
    updateUser,
    getStrapiUserByEmail,
    storeAccessToken,
    strapiLogin,
    uploadStrapiFile,
} from "@/integrations/strapi/utils"
import Link from "next/link"
import { PageLoading } from "@/components/page-loading"
import { AvatarStep } from "@/components/auth/signup-steps/AvatarStep"
import { CredentialsStep } from "@/components/auth/signup-steps/CredentialsStep"
import { CharacterStep } from "@/components/auth/signup-steps/CharacterStep"
import { LearningGoalsStep } from "@/components/auth/signup-steps/LearningGoalsStep"
import { PreferToLearnsStep } from "@/components/auth/signup-steps/PreferToLearnsStep"
import { InterestedStep } from "@/components/auth/signup-steps/InterestedStep"
import { BadgesStep } from "@/components/auth/signup-steps/BadgesStep"
import type { Default } from "@/types/user"
import { useStrapi } from "@/hooks/use-strapi"
import { useAuth } from "@/hooks/use-auth"
import { BackgroundBeamsWithCollision } from "@/components/ui/backgrounds/background-beams-with-collision"
import { ErrorModal } from "@/components/ui/ErrorModal"

interface SignupFormData {
    email: string
    supabaseUserId: string
    username: string
    password: string
    confirmPassword: string
    avatarFile: File | null
    avatarPreview: string | null
    avatarUrl?: string
    character: Default | null
    learning_goals: Default[] | null
    prefer_to_learns: Default[] | null
    interested: Default[] | null
    badges: Default[] | null
}

const totalSteps = 7
const stepLabels = ["Credentials", "Avatar", "Character", "Learning Goals", "Learning Style", "Interests", "Badges"]
const stepDescriptions = [
    "Set up your account details",
    "Choose your profile picture",
    "Select your primary role",
    "Choose your learning goals",
    "Select your preferred learning styles",
    "Pick topics you're interested in",
    "Select your badges",
]
const stepIcons = [Lock, User, Users, Target, BookOpen, Sliders, Award]

export default function MultiStepSignupPage() {
    const router = useRouter()
    const { user: authUser, refreshUser, userContext, isLoading: authLoading } = useAuth()
    const [currentStep, setCurrentStep] = useState(1)
    const [formData, setFormData] = useState<SignupFormData>({
        email: "",
        supabaseUserId: "",
        username: "",
        password: "",
        confirmPassword: "",
        avatarFile: null,
        avatarPreview: null,
        avatarUrl: undefined,
        character: null,
        learning_goals: [],
        prefer_to_learns: [],
        interested: [],
        badges: [],
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [strapiUserId, setStrapiUserId] = useState<string | null>(null)
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
    const [modalErrorDetails, setModalErrorDetails] = useState({ title: "", message: "" })

    const strapiOptionsNoToast = useMemo(() => ({ showToast: false }), [])

    const {
        data: charactorsData,
        loading: loadingCharactors,
        error: charactorsError,
        fetchData: fetchCharactors,
    } = useStrapi<{ data: Default[] }>(strapiOptionsNoToast)
    const {
        data: goalsData,
        loading: loadingGoals,
        error: goalsError,
        fetchData: fetchGoals,
    } = useStrapi<{ data: Default[] }>(strapiOptionsNoToast)
    const {
        data: stylesData,
        loading: loadingStyles,
        error: stylesError,
        fetchData: fetchStyles,
    } = useStrapi<{ data: Default[] }>(strapiOptionsNoToast)
    const {
        data: topicsData,
        loading: loadingTopics,
        error: topicsError,
        fetchData: fetchTopics,
    } = useStrapi<{ data: Default[] }>(strapiOptionsNoToast)
    const {
        data: badgesData,
        loading: loadingBadges,
        error: badgesError,
        fetchData: fetchBadges,
    } = useStrapi<{ data: Default[] }>(strapiOptionsNoToast)

    useEffect(() => {
        if (!authLoading && authUser?.supabaseId && authUser.email) {
            if (authUser.id && currentStep < totalSteps) {
                console.log("[Signup] User has Strapi ID but signup incomplete, staying on page...")
            } else if (authUser.id === null) {
                setFormData((prev) => ({
                    ...prev,
                    email: authUser.email!,
                    supabaseUserId: authUser.supabaseId!,
                }))
                fetchCharactors("/api/charactors", true)
                fetchGoals("/api/learning-goals", true)
                fetchStyles("/api/prefer-to-learns", true)
                fetchTopics("/api/interesteds", true)
                fetchBadges("/api/badges", true)
            }
        } else if (!authLoading && (!authUser?.supabaseId || !authUser.email)) {
            setModalErrorDetails({
                title: "Registration Error",
                message: "User ID or email is missing. Please start your registration by entering your email.",
            })
            setIsErrorModalOpen(true)
        }
    }, [authUser, authLoading, fetchCharactors, fetchGoals, fetchStyles, fetchTopics, fetchBadges, currentStep])

    const handleStepDataUpdate = (stepData: Partial<SignupFormData>) => {
        setFormData((prev) => ({ ...prev, ...stepData }))
    }

    const handleMultiSelectUpdate = (field: keyof SignupFormData, item: Default) => {
        setFormData((prev) => {
            const currentItems = (prev[field] as Default[]) || []
            const exists = currentItems.some((i) => i.id === item.id)
            const newItems = exists ? currentItems.filter((i) => i.id !== item.id) : [...currentItems, item]
            return { ...prev, [field]: newItems }
        })
    }

    const handleNextStep = async () => {
        setError("")
        setLoading(true)
        setIsErrorModalOpen(false)

        try {
            if (currentStep === 1) {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error("Passwords do not match.")
                }
                if (!formData.username || !formData.password) {
                    throw new Error("Username and password are required.")
                }

                const { jwt, user: strapiUser } = await registerAccount({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                })
                setStrapiUserId(strapiUser.id.toString())
                storeAccessToken(jwt)
                userContext(strapiUser)

                toast.success("Account created successfully!", {
                    description: "Now, let's personalize your profile.",
                    position: "top-center",
                    duration: 2000,
                })
                setCurrentStep(currentStep + 1)
            } else if (currentStep === 2) {
                if (!strapiUserId) throw new Error("Strapi User ID is missing.")
                try {
                    const updatePayload: any = {
                        supabaseId: formData.supabaseUserId,
                    }
                    if (formData.avatarFile) {
                        const uploadedFile = await uploadStrapiFile(
                            formData.avatarFile,
                            'plugin::users-permissions.user',
                            strapiUserId,
                            'avatar'
                        );
                        updatePayload.avatar = uploadedFile.id
                    }
                    await updateUser(strapiUserId, updatePayload)

                } catch (err: any) {
                    if (err.message.includes("Invalid credentials")) {
                        console.log("[handleNextStep] Invalid credentials, attempting to refresh token...")
                        const { jwt } = await strapiLogin(formData.email, formData.password)
                        storeAccessToken(jwt)
                        const updatePayload: any = {
                            supabaseId: formData.supabaseUserId,
                        }
                        if (formData.avatarFile) {
                            const uploadedFile = await uploadStrapiFile(
                                formData.avatarFile,
                                'plugin::users-permissions.user',
                                strapiUserId,
                                'avatar'
                            );
                            updatePayload.avatar = uploadedFile.id
                        }
                        await updateUser(strapiUserId, updatePayload)

                    } else {
                        throw err
                    }
                }

                const updatedStrapiProfile = await getStrapiUserByEmail(formData.email)
                if (updatedStrapiProfile) {
                    userContext(updatedStrapiProfile)
                } else {
                    throw new Error("Failed to fetch updated Strapi user profile.")
                }
                toast.success("Avatar saved!", { position: "top-center", duration: 1500 })
                setCurrentStep(currentStep + 1)
            } else if (currentStep === 3) {
                // Character step
                if (!strapiUserId) throw new Error("Strapi User ID is missing.")
                if (!formData.character) throw new Error("Please select a character.")

                await updateUser(strapiUserId, {
                    character: formData.character.id,
                })
                const updatedStrapiProfile = await getStrapiUserByEmail(formData.email)
                if (updatedStrapiProfile) {
                    userContext(updatedStrapiProfile)
                }
                toast.success("Character saved!", { position: "top-center", duration: 1500 })
                setCurrentStep(currentStep + 1)
            } else if (currentStep === 4) {
                // Learning Goals step
                if (!strapiUserId) throw new Error("Strapi User ID is missing.")
                await updateUser(strapiUserId, {
                    learning_goals: formData.learning_goals?.map((g) => g.id) || [],
                })
                const updatedStrapiProfile = await getStrapiUserByEmail(formData.email)
                if (updatedStrapiProfile) {
                    userContext(updatedStrapiProfile)
                }
                toast.success("Learning goals saved!", { position: "top-center", duration: 1500 })
                setCurrentStep(currentStep + 1)
            } else if (currentStep === 5) {
                // Prefer to Learns step
                if (!strapiUserId) throw new Error("Strapi User ID is missing.")
                await updateUser(strapiUserId, {
                    prefer_to_learns: formData.prefer_to_learns?.map((p) => p.id) || [],
                })
                const updatedStrapiProfile = await getStrapiUserByEmail(formData.email)
                if (updatedStrapiProfile) {
                    userContext(updatedStrapiProfile)
                }
                toast.success("Learning styles saved!", { position: "top-center", duration: 1500 })
                setCurrentStep(currentStep + 1)
            } else if (currentStep === 6) {
                // Interests step
                if (!strapiUserId) throw new Error("Strapi User ID is missing.")
                await updateUser(strapiUserId, {
                    interested: formData.interested?.map((i) => i.id) || [],
                })
                const updatedStrapiProfile = await getStrapiUserByEmail(formData.email)
                if (updatedStrapiProfile) {
                    userContext(updatedStrapiProfile)
                }
                toast.success("Interests saved!", { position: "top-center", duration: 1500 })
                setCurrentStep(currentStep + 1)
            } else if (currentStep === 7) {
                // Badges step
                if (!strapiUserId) throw new Error("Strapi User ID is missing.")
                await updateUser(strapiUserId, {
                    badges: formData.badges?.map((b) => b.id) || [],
                })
                const updatedStrapiProfile = await getStrapiUserByEmail(formData.email)
                if (updatedStrapiProfile) {
                    userContext(updatedStrapiProfile)
                }
                toast.success("Profile setup complete! Welcome!", {
                    position: "top-center",
                    duration: 2000,
                })
                router.push("/")
            }
        } catch (err: any) {
            console.error("Signup/Onboarding error:", err)
            const errorMessage = err.message || "An unexpected error occurred. Please try again."
            setError(errorMessage)
            setModalErrorDetails({
                title: "Signup Error",
                message: errorMessage,
            })
            setIsErrorModalOpen(true)
        } finally {
            setLoading(false)
        }
    }

    const handleBackStep = () => {
        setError("")
        setIsErrorModalOpen(false)
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <CredentialsStep
                        email={formData.email}
                        username={formData.username}
                        password={formData.password}
                        confirmPassword={formData.confirmPassword}
                        onUpdate={handleStepDataUpdate}
                        onNext={handleNextStep}
                        isLoading={loading}
                        externalError={error}
                    />
                )
            case 2:
                return (
                    <AvatarStep
                        email={formData.email}
                        avatarFile={formData.avatarFile}
                        avatarPreview={formData.avatarPreview}
                        onUpdate={handleStepDataUpdate}
                        onNext={handleNextStep}
                        onBack={handleBackStep}
                        isLoading={loading}
                        externalError={error}
                    />
                )
            case 3:
                return (
                    <CharacterStep
                        selectedCharactor={formData.character}
                        onUpdate={(character) => handleStepDataUpdate({ character })}
                        onNext={handleNextStep}
                        onBack={handleBackStep}
                        isLoading={loading}
                        charactorOptions={charactorsData?.data || []}
                        loadingCharactors={loadingCharactors}
                        charactorsError={charactorsError}
                    />
                )
            case 4:
                return (
                    <LearningGoalsStep
                        selectedGoals={formData.learning_goals}
                        onUpdate={(goal) => handleMultiSelectUpdate("learning_goals", goal)}
                        onNext={handleNextStep}
                        onBack={handleBackStep}
                        isLoading={loading}
                        goalOptions={goalsData?.data || []}
                        loadingGoals={loadingGoals}
                        goalsError={goalsError}
                    />
                )
            case 5:
                return (
                    <PreferToLearnsStep
                        selectedStyles={formData.prefer_to_learns}
                        onUpdate={(style) => handleMultiSelectUpdate("prefer_to_learns", style)}
                        onNext={handleNextStep}
                        onBack={handleBackStep}
                        isLoading={loading}
                        styleOptions={stylesData?.data || []}
                        loadingStyles={loadingStyles}
                        stylesError={stylesError}
                    />
                )
            case 6:
                return (
                    <InterestedStep
                        selectedInterests={formData.interested}
                        onUpdate={(interest) => handleMultiSelectUpdate("interested", interest)}
                        onNext={handleNextStep}
                        onBack={handleBackStep}
                        isLoading={loading}
                        interestOptions={topicsData?.data || []}
                        loadingInterests={loadingTopics}
                        interestsError={topicsError}
                    />
                )
            case 7:
                return (
                    <BadgesStep
                        selectedBadges={formData.badges}
                        onUpdate={(badge) => handleMultiSelectUpdate("badges", badge)}
                        onNext={handleNextStep}
                        onBack={handleBackStep}
                        isLoading={loading}
                        badgeOptions={badgesData?.data || []}
                        loadingBadges={loadingBadges}
                        badgesError={badgesError}
                    />
                )
            default:
                return null
        }
    }

    if (authLoading || (!authUser?.email && !isErrorModalOpen)) {
        return <PageLoading message="Initializing signup..." />
    }

    return (
        <BackgroundBeamsWithCollision className="min-h-screen via-background overflow-hidden scrollbar-hide items-start">
                <div className="h-screen min-w-[500px] sm:min-w-screen flex items-start justify-center p-4 py-12 relative
                  bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#dbeafe]
                  overflow-y-auto scrollbar-hide
                  dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"

                >
                    <motion.div
                        className="absolute top-[8%] left-[3%] w-[280px] h-[280px] rounded-[60%_40%_30%_70%/40%_60%_50%_50%]
                     bg-gradient-to-br from-[#20B2AA]/5 to-[#17a89a]/5 blur-3xl pointer-events-none"
                        animate={{
                            borderRadius: [
                                "60% 40% 30% 70% / 40% 60% 50% 50%",
                                "30% 60% 70% 40% / 50% 40% 60% 50%",
                                "50% 50% 50% 50% / 60% 40% 60% 40%",
                                "60% 40% 30% 70% / 40% 60% 50% 50%",
                            ],
                            x: [0, 40, -30, 0],
                            y: [0, -35, 45, 0],
                            scale: [1, 1.15, 0.9, 1],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                        }}
                    />

                    <motion.div
                        className="absolute bottom-[12%] right-[5%] w-[250px] h-[250px] rounded-[40%_60%_60%_40%/60%_30%_70%_40%]
                     bg-gradient-to-br from-[#9B7EBD]/15 to-[#8B6EAD]/15 blur-3xl pointer-events-none"
                        animate={{
                            borderRadius: [
                                "40% 60% 60% 40% / 60% 30% 70% 40%",
                                "60% 40% 40% 60% / 30% 70% 40% 60%",
                                "50% 50% 60% 40% / 50% 50% 60% 40%",
                                "40% 60% 60% 40% / 60% 30% 70% 40%",
                            ],
                            x: [0, -35, 50, 0],
                            y: [0, 45, -30, 0],
                            scale: [1, 0.85, 1.1, 1],
                        }}
                        transition={{
                            duration: 18,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                        }}
                    />

                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-12 h-12 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md
                       border border-white/20 dark:border-white/10 pointer-events-none"
                            style={{
                                left: `${10 + i * 11}%`,
                                top: `${15 + (i % 4) * 20}%`,
                            }}
                            animate={{
                                y: [0, -25, 0],
                                x: [0, 12, 0],
                                scale: [1, 1.08, 1],
                            }}
                            transition={{
                                duration: 3.5 + i * 0.4,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "easeInOut",
                                delay: i * 0.25,
                            }}
                        />
                    ))}

                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 25,
                            duration: 0.6,
                        }}
                        className="w-full max-w-3xl relative z-10"
                    >
                        <div className="mb-8 space-y-6">
                            <div className="text-center space-y-3">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, y: -15, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 20,
                                    }}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                           bg-white/40 dark:bg-white/10 backdrop-blur-xl
                           border border-white/60 dark:border-white/20
                           shadow-lg shadow-[#20B2AA]/10"
                                >
                <span className="text-sm font-semibold bg-gradient-to-r from-[#20B2AA] to-[#17a89a] bg-clip-text text-transparent">
                  Step {currentStep} of {totalSteps}
                </span>
                                </motion.div>
                                <motion.h1
                                    key={`title-${currentStep}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 250,
                                        damping: 25,
                                        delay: 0.05,
                                    }}
                                    className="text-3xl md:text-4xl font-bold text-foreground"
                                >
                                    {stepLabels[currentStep - 1]}
                                </motion.h1>
                                <motion.p
                                    key={`desc-${currentStep}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-muted-foreground text-base"
                                >
                                    {stepDescriptions[currentStep - 1]}
                                </motion.p>
                            </div>

                            <div className="relative">
                                <div
                                    className="h-3 bg-white/30 dark:bg-white/10 backdrop-blur-md rounded-full overflow-hidden
                              border border-white/40 dark:border-white/20 shadow-inner"
                                >
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-[#20B2AA] via-[#17a89a] to-[#20B2AA]
                             rounded-full shadow-lg shadow-[#20B2AA]/30 relative overflow-hidden"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 100,
                                            damping: 20,
                                        }}
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                            animate={{
                                                x: ["-100%", "200%"],
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Number.POSITIVE_INFINITY,
                                                ease: "easeInOut",
                                            }}
                                        />
                                    </motion.div>
                                </div>
                                <div className="absolute inset-0 flex justify-between items-center px-1">
                                    {Array.from({ length: totalSteps }).map((_, index) => {
                                        const Icon = stepIcons[index]
                                        const isCompleted = index + 1 < currentStep
                                        const isCurrent = index + 1 === currentStep

                                        return (
                                            <motion.div
                                                key={index}
                                                initial={{ scale: 0.8 }}
                                                animate={{
                                                    scale: isCurrent ? 1.25 : 1,
                                                }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 400,
                                                    damping: 15,
                                                }}
                                                className="relative group"
                                            >
                                                <div
                                                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300
                                    backdrop-blur-xl border shadow-lg ${
                                                        isCompleted
                                                            ? "bg-[#20B2AA] text-white border-[#20B2AA]/40 shadow-[#20B2AA]/40"
                                                            : isCurrent
                                                                ? "bg-gradient-to-br from-[#20B2AA] to-[#17a89a] text-white border-white/40 ring-4 ring-[#20B2AA]/20 shadow-[#20B2AA]/50"
                                                                : "bg-white/40 dark:bg-white/10 text-muted-foreground border-white/40 dark:border-white/20"
                                                    }`}
                                                >
                                                    {isCompleted ? (
                                                        <motion.svg
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{
                                                                type: "spring",
                                                                stiffness: 500,
                                                                damping: 15,
                                                            }}
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={3}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </motion.svg>
                                                    ) : (
                                                        <Icon className="w-4 h-4" />
                                                    )}
                                                </div>

                                                <div
                                                    className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100
                                      transition-opacity pointer-events-none z-50"
                                                >
                                                    <motion.div
                                                        initial={{ y: 5, opacity: 0 }}
                                                        whileHover={{ y: 0, opacity: 1 }}
                                                        className="bg-white/60 dark:bg-slate-900/10 backdrop-blur-xl text-foreground
                                     text-xs rounded-2xl py-2.5 px-4 shadow-xl
                                     border border-white/60 dark:border-white/20 whitespace-nowrap"
                                                    >
                                                        {stepLabels[index]}
                                                    </motion.div>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 30, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -30, scale: 0.95 }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 25,
                            }}
                            className="liquid-glass-card p-6 md:p-8"
                        >
                            <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
                        </motion.div>

                        {currentStep > 1 && currentStep <= totalSteps && (
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 20,
                                    delay: 0.2,
                                }}
                                className="text-center text-sm text-muted-foreground mt-6"
                            >
                                Already have an account?{" "}
                                <Link href="/auth/start" className="text-[#20B2AA] hover:underline font-semibold transition-colors">
                                    Sign In
                                </Link>
                            </motion.p>
                        )}
                    </motion.div>

                    <ErrorModal
                        isOpen={isErrorModalOpen}
                        onClose={() => {
                            setIsErrorModalOpen(false)
                            if (!authUser?.email) {
                                router.replace("/auth/email-auth")
                            }
                        }}
                        title={modalErrorDetails.title}
                        message={modalErrorDetails.message}
                        reportIssueTitle={modalErrorDetails.title}
                        reportIssueDescription={modalErrorDetails.message}
                    />
                </div>
            </BackgroundBeamsWithCollision>
    )
}
