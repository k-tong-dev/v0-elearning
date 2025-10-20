"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header" // Keep Header/Footer for standalone page, but won't be rendered when used in-page
import { Footer } from "@/components/footer" // Keep Header/Footer for standalone page, but won't be rendered when used in-page
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
    ArrowLeft,
    Save,
    Upload,
    Video,
    FileText,
    Link as LinkIcon,
    Target,
    Eye,
    Trash2,
    Plus,
    Move,
    Edit3,
    BookOpen,
    DollarSign,
    Info,
    ListOrdered,
    CheckCircle,
    Loader2,
    Settings
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

interface Lesson {
    id: string
    title: string
    description: string
    type: "video" | "text" | "quiz"
    duration: number
    order: number
    isPublished: boolean
}

interface CreateCourseFormProps {
    onCancel: () => void;
    onSuccess: () => void;
}

export default function CreateCourseForm({ onCancel, onSuccess }: CreateCourseFormProps) {
    const router = useRouter()
    const [courseData, setCourseData] = useState({
        title: "",
        description: "",
        type: "video", // Default type
        price: 0,
        thumbnailFile: null as File | null,
        thumbnailPreview: "" as string | ArrayBuffer | null,
        lessons: [] as Lesson[],
        status: "draft" as "draft" | "published" | "archived",
        autoApproveEnrollments: true,
        allowReviews: true,
    })
    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<{ [key: string]: string }>({})

    const validateStep = () => {
        const newErrors: { [key: string]: string } = {}
        if (currentStep === 1) {
            if (!courseData.title.trim()) newErrors.title = "Course title is required."
            if (!courseData.description.trim()) newErrors.description = "Course description is required."
            if (courseData.price < 0) newErrors.price = "Price cannot be negative."
            if (!courseData.thumbnailFile && !courseData.thumbnailPreview) newErrors.thumbnail = "Course thumbnail is required."
        } else if (currentStep === 2) {
            if (courseData.lessons.length === 0) {
                newErrors.lessons = "At least one lesson is required."
            } else {
                courseData.lessons.forEach((lesson, index) => {
                    if (!lesson.title.trim()) newErrors[`lessonTitle${index}`] = `Lesson ${index + 1} title is required.`
                    if (lesson.duration <= 0) newErrors[`lessonDuration${index}`] = `Lesson ${index + 1} duration must be positive.`
                })
            }
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNextStep = () => {
        if (validateStep()) {
            setCurrentStep(prev => prev + 1)
        } else {
            toast.error("Please fix the errors before proceeding.", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
        }
    }

    const handlePrevStep = () => {
        setCurrentStep(prev => prev - 1)
    }

    const handleInputChange = (field: string, value: any) => {
        setCourseData(prev => ({ ...prev, [field]: value }))
        setErrors(prev => ({ ...prev, [field]: "" })) // Clear error on change
    }

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setCourseData(prev => ({ ...prev, thumbnailFile: file }))
            const reader = new FileReader()
            reader.onloadend = () => {
                setCourseData(prev => ({ ...prev, thumbnailPreview: reader.result }))
            }
            reader.readAsDataURL(file)
            setErrors(prev => ({ ...prev, thumbnail: "" }))
        }
    }

    const handleAddLesson = () => {
        const newLesson: Lesson = {
            id: `lesson_${Date.now()}`,
            title: "",
            description: "",
            type: "video",
            duration: 0,
            order: courseData.lessons.length + 1,
            isPublished: false
        }
        setCourseData(prev => ({
            ...prev,
            lessons: [...prev.lessons, newLesson]
        }))
    }

    const updateLesson = (lessonId: string, updates: Partial<Lesson>, index: number) => {
        setCourseData(prev => ({
            ...prev,
            lessons: prev.lessons.map(lesson =>
                lesson.id === lessonId ? { ...lesson, ...updates } : lesson
            )
        }))
        if (updates.title !== undefined) setErrors(prev => ({ ...prev, [`lessonTitle${index}`]: "" }))
        if (updates.duration !== undefined) setErrors(prev => ({ ...prev, [`lessonDuration${index}`]: "" }))
    }

    const deleteLesson = (lessonId: string) => {
        setCourseData(prev => ({
            ...prev,
            lessons: prev.lessons.filter(lesson => lesson.id !== lessonId).map((lesson, index) => ({ ...lesson, order: index + 1 }))
        }))
    }

    const handleSubmitCourse = async () => {
        if (!validateStep()) {
            toast.error("Please fix the errors before submitting the course.", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
            return
        }

        setIsSubmitting(true)
        try {
            // In a real app, you'd upload courseData.thumbnailFile to a storage service
            // and get a URL, then send that URL along with other course data to your API.
            // For this mock, we'll just simulate the process.

            await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call

            console.log("Course created:", courseData)
            toast.success("Course created successfully!", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
            onSuccess(); // Call onSuccess prop to signal completion
        } catch (error) {
            console.error("Error creating course:", error)
            toast.error("Failed to create course. Please try again.", {
                position: "top-center",
                action: {
                    label: "Close",
                    onClick: () => {},
                },
                closeButton: false,
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "video": return Video
            case "text": return FileText
            case "quiz": return Target
            default: return BookOpen
        }
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <h2 className="text-2xl font-bold text-center">Course Information</h2>
                        <p className="text-muted-foreground text-center">Provide basic details about your course.</p>

                        <div>
                            <Label htmlFor="title">Course Title</Label>
                            <Input
                                id="title"
                                value={courseData.title}
                                onChange={(e) => handleInputChange("title", e.target.value)}
                                placeholder="e.g., Master React with Hooks"
                                className={errors.title ? "border-red-500" : ""}
                            />
                            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={courseData.description}
                                onChange={(e) => handleInputChange("description", e.target.value)}
                                placeholder="Describe what students will learn and key takeaways..."
                                className={`min-h-32 ${errors.description ? "border-red-500" : ""}`}
                            />
                            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label>Course Type</Label>
                                <Select value={courseData.type} onValueChange={(value) => handleInputChange("type", value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="video">
                                            <div className="flex items-center gap-2">
                                                <Video className="w-4 h-4" />
                                                Video Course
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="text">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4" />
                                                Text-based Guide
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="quiz">
                                            <div className="flex items-center gap-2">
                                                <Target className="w-4 h-4" />
                                                Interactive Quiz
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="price">Price ($)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={courseData.price}
                                    onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                    className={errors.price ? "border-red-500" : ""}
                                />
                                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                            </div>
                        </div>

                        <div>
                            <Label>Course Thumbnail</Label>
                            <div className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-gray-400 transition-colors relative ${errors.thumbnail ? "border-red-500" : "border-gray-300"}`}>
                                {courseData.thumbnailPreview && (
                                    <img
                                        src={courseData.thumbnailPreview as string}
                                        alt="Thumbnail Preview"
                                        className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-50"
                                    />
                                )}
                                <input
                                    id="thumbnail-upload"
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept="image/*"
                                    onChange={handleThumbnailChange}
                                />
                                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground relative z-10" />
                                <p className="text-sm text-muted-foreground relative z-10">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground relative z-10">
                                    PNG, JPG up to 10MB
                                </p>
                            </div>
                            {errors.thumbnail && <p className="text-red-500 text-sm mt-1">{errors.thumbnail}</p>}
                        </div>
                    </motion.div>
                )
            case 2:
                return (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <h2 className="text-2xl font-bold text-center">Course Lessons</h2>
                        <p className="text-muted-foreground text-center">Organize your course content into lessons.</p>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <ListOrdered className="w-5 h-5" />
                                    Lessons ({courseData.lessons.length})
                                </CardTitle>
                                <Button onClick={handleAddLesson} size="sm">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Lesson
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {errors.lessons && <p className="text-red-500 text-sm mb-4">{errors.lessons}</p>}
                                <div className="space-y-4">
                                    {courseData.lessons.length === 0 && (
                                        <div className="text-center text-muted-foreground py-8">
                                            <Info className="w-12 h-12 mx-auto mb-4" />
                                            <p>No lessons added yet. Click "Add Lesson" to start!</p>
                                        </div>
                                    )}
                                    {courseData.lessons.map((lesson, index) => {
                                        const LessonIcon = getTypeIcon(lesson.type)
                                        return (
                                            <div key={lesson.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <span className="text-sm text-muted-foreground">#{lesson.order}</span>
                                                        <Input
                                                            value={lesson.title}
                                                            onChange={(e) => updateLesson(lesson.id, { title: e.target.value }, index)}
                                                            placeholder="Lesson title"
                                                            className={`font-medium ${errors[`lessonTitle${index}`] ? "border-red-500" : ""}`}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={lesson.isPublished}
                                                            onCheckedChange={(checked) => updateLesson(lesson.id, { isPublished: checked }, index)}
                                                        />
                                                        <Button variant="ghost" size="sm" className="p-2">
                                                            <Move className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="p-2 text-red-500 hover:bg-red-50" onClick={() => deleteLesson(lesson.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                {errors[`lessonTitle${index}`] && <p className="text-red-500 text-sm mt-1">{errors[`lessonTitle${index}`]}</p>}
                                                <Textarea
                                                    value={lesson.description}
                                                    onChange={(e) => updateLesson(lesson.id, { description: e.target.value }, index)}
                                                    placeholder="Lesson description..."
                                                    className="mb-2"
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Select
                                                        value={lesson.type}
                                                        onValueChange={(value) => updateLesson(lesson.id, { type: value as any }, index)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="video">
                                                                <div className="flex items-center gap-2">
                                                                    <Video className="w-4 h-4" />
                                                                    Video
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="text">
                                                                <div className="flex items-center gap-2">
                                                                    <FileText className="w-4 h-4" />
                                                                    Text
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="quiz">
                                                                <div className="flex items-center gap-2">
                                                                    <Target className="w-4 h-4" />
                                                                    Quiz
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        type="number"
                                                        value={lesson.duration}
                                                        onChange={(e) => updateLesson(lesson.id, { duration: parseInt(e.target.value) || 0 }, index)}
                                                        placeholder="Duration (min)"
                                                        className={errors[`lessonDuration${index}`] ? "border-red-500" : ""}
                                                    />
                                                </div>
                                                {errors[`lessonDuration${index}`] && <p className="text-red-500 text-sm mt-1">{errors[`lessonDuration${index}`]}</p>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )
            case 3:
                return (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <h2 className="text-2xl font-bold text-center">Final Settings & Review</h2>
                        <p className="text-muted-foreground text-center">Configure publishing options and review your course.</p>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="w-5 h-5" />
                                    Publishing Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Course Status</Label>
                                    <Select value={courseData.status} onValueChange={(value) => handleInputChange("status", value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Auto-approve enrollments</Label>
                                        <p className="text-sm text-muted-foreground">Automatically approve new student enrollments</p>
                                    </div>
                                    <Switch
                                        checked={courseData.autoApproveEnrollments}
                                        onCheckedChange={(checked) => handleInputChange("autoApproveEnrollments", checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Allow reviews</Label>
                                        <p className="text-sm text-muted-foreground">Allow students to leave reviews and ratings</p>
                                    </div>
                                    <Switch
                                        checked={courseData.allowReviews}
                                        onCheckedChange={(checked) => handleInputChange("allowReviews", checked)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Eye className="w-5 h-5" />
                                    Course Preview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {courseData.thumbnailPreview && (
                                        <img
                                            src={courseData.thumbnailPreview as string}
                                            alt={courseData.title}
                                            className="w-full h-40 object-cover rounded-lg"
                                        />
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-lg line-clamp-2">{courseData.title || "Untitled Course"}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
                                            {courseData.description || "No description provided."}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Badge className={courseData.status === "published" ? "bg-green-500" : "bg-yellow-500"}>
                                            {courseData.status}
                                        </Badge>
                                        <span className="font-bold">${courseData.price.toFixed(2)}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {courseData.lessons.length} lessons • {courseData.lessons.reduce((sum, l) => sum + l.duration, 0)} min total
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )
            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            {/* Header and Footer are commented out as this component will be rendered in-page */}
            {/* <Header /> */}

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
                <Card className="w-full max-w-4xl p-6 md:p-8 border-2 shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                            Create New Course
                        </CardTitle>
                        <p className="text-muted-foreground">Step {currentStep} of 3</p>
                        <div className="flex justify-center gap-2 mt-4">
                            {[1, 2, 3].map(s => (
                                <div
                                    key={s}
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        s <= currentStep ? 'bg-primary w-8' : 'bg-muted w-4'
                                    }`}
                                />
                            ))}
                        </div>
                    </CardHeader>

                    <CardContent className="pt-4">
                        <AnimatePresence mode="wait">
                            {renderStepContent()}
                        </AnimatePresence>

                        <div className="flex justify-between mt-8">
                            {currentStep === 1 && ( // Show cancel only on first step, or adjust as needed
                                <Button variant="outline" onClick={onCancel}>
                                    Cancel
                                </Button>
                            )}
                            {currentStep > 1 && (
                                <Button variant="outline" onClick={handlePrevStep}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Previous
                                </Button>
                            )}
                            {currentStep < 3 && (
                                <Button onClick={handleNextStep} className="ml-auto">
                                    Next
                                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                                </Button>
                            )}
                            {currentStep === 3 && (
                                <Button
                                    onClick={handleSubmitCourse}
                                    disabled={isSubmitting}
                                    className="ml-auto bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Submitting...
                                        </div>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Submit Course
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* <Footer /> */}
        </div>
    )
}