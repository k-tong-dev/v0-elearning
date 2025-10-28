"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { HeaderDark } from "@/components/ui/headers/HeaderDark"
import { Footer } from "@/components/ui/footers/footer"
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
} from "lucide-react"
import { motion } from "framer-motion"

interface Course {
  id: string
  title: string
  description: string
  type: "PDF" | "Video" | "Link" | "Interactive"
  status: "draft" | "published" | "archived"
  price: number
  enrollments: number
  rating: number
  thumbnailUrl: string
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  description: string
  type: "video" | "text" | "quiz"
  duration: number
  order: number
  isPublished: boolean
}

export default function CourseEditPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params?.id as string
  
  const [course, setCourse] = useState<Course>({
    id: courseId,
    title: "React Fundamentals for Beginners",
    description: "Learn the basics of React including components, props, and state management.",
    type: "Video",
    status: "published",
    price: 49.99,
    enrollments: 234,
    rating: 4.8,
    thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=200&fit=crop",
    lessons: [
      { id: "1", title: "Introduction to React", description: "Overview of React and its ecosystem", type: "video", duration: 15, order: 1, isPublished: true },
      { id: "2", title: "Components and JSX", description: "Understanding components and JSX syntax", type: "video", duration: 22, order: 2, isPublished: true },
      { id: "3", title: "Props and State", description: "Working with props and state management", type: "video", duration: 18, order: 3, isPublished: false },
    ]
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Mock save operation
      await new Promise(resolve => setTimeout(resolve, 1500))
      console.log("Course saved:", course)
    } catch (error) {
      console.error("Error saving course:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddLesson = () => {
    const newLesson: Lesson = {
      id: `lesson_${Date.now()}`,
      title: "New Lesson",
      description: "",
      type: "video",
      duration: 0,
      order: course.lessons.length + 1,
      isPublished: false
    }
    setCourse(prev => ({
      ...prev,
      lessons: [...prev.lessons, newLesson]
    }))
  }

  const updateLesson = (lessonId: string, updates: Partial<Lesson>) => {
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map(lesson => 
        lesson.id === lessonId ? { ...lesson, ...updates } : lesson
      )
    }))
  }

  const deleteLesson = (lessonId: string) => {
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.filter(lesson => lesson.id !== lessonId)
    }))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Video": return Video
      case "PDF": return FileText
      case "Link": return LinkIcon
      case "Interactive": return Target
      default: return FileText
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <HeaderDark />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* HeaderDark */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="flex items-center gap-2 hover:bg-accent/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                Edit Course
              </h1>
              <p className="text-muted-foreground">
                Modify your course content and settings
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button
              variant={activeTab === "general" ? "default" : "outline"}
              onClick={() => setActiveTab("general")}
            >
              General
            </Button>
            <Button
              variant={activeTab === "lessons" ? "default" : "outline"}
              onClick={() => setActiveTab("lessons")}
            >
              Lessons
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "outline"}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "general" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Course Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="title">Course Title</Label>
                      <Input
                        id="title"
                        value={course.title}
                        onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter course title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={course.description}
                        onChange={(e) => setCourse(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what students will learn..."
                        className="min-h-32"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Course Type</Label>
                        <Select value={course.type} onValueChange={(value) => setCourse(prev => ({ ...prev, type: value as any }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Video">
                              <div className="flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                Video Course
                              </div>
                            </SelectItem>
                            <SelectItem value="PDF">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                PDF Guide
                              </div>
                            </SelectItem>
                            <SelectItem value="Link">
                              <div className="flex items-center gap-2">
                                <LinkIcon className="w-4 h-4" />
                                External Link
                              </div>
                            </SelectItem>
                            <SelectItem value="Interactive">
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Interactive
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
                          value={course.price}
                          onChange={(e) => setCourse(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Course Thumbnail</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG up to 10MB
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "lessons" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Course Lessons</CardTitle>
                    <Button onClick={handleAddLesson} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Lesson
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {course.lessons.map((lesson, index) => (
                        <div key={lesson.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">#{lesson.order}</span>
                              <Input
                                value={lesson.title}
                                onChange={(e) => updateLesson(lesson.id, { title: e.target.value })}
                                className="font-medium"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                className="data-[state=unchecked]:bg-gray-400"
                                checked={lesson.isPublished}
                                onCheckedChange={(checked) => updateLesson(lesson.id, { isPublished: checked })}
                              />
                              <Button variant="ghost" size="sm">
                                <Move className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteLesson(lesson.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <Textarea
                            value={lesson.description}
                            onChange={(e) => updateLesson(lesson.id, { description: e.target.value })}
                            placeholder="Lesson description..."
                            className="mb-2"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Select 
                              value={lesson.type} 
                              onValueChange={(value) => updateLesson(lesson.id, { type: value as any })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="quiz">Quiz</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              value={lesson.duration}
                              onChange={(e) => updateLesson(lesson.id, { duration: parseInt(e.target.value) || 0 })}
                              placeholder="Duration (min)"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Publishing Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Course Status</Label>
                      <Select value={course.status} onValueChange={(value) => setCourse(prev => ({ ...prev, status: value as any }))}>
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
                      <Switch className="data-[state=unchecked]:bg-gray-400"/>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Allow reviews</Label>
                        <p className="text-sm text-muted-foreground">Allow students to leave reviews and ratings</p>
                      </div>
                      <Switch defaultChecked className="data-[state=unchecked]:bg-gray-400"/>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <img 
                      src={course.thumbnailUrl} 
                      alt={course.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="font-semibold line-clamp-2">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
                        {course.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={course.status === "published" ? "bg-green-500" : "bg-yellow-500"}>
                        {course.status}
                      </Badge>
                      <span className="font-bold">${course.price}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Enrollments</span>
                      <span className="font-medium">{course.enrollments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Rating</span>
                      <span className="font-medium">{course.rating} ⭐</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Lessons</span>
                      <span className="font-medium">{course.lessons.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Published</span>
                      <span className="font-medium">{course.lessons.filter(l => l.isPublished).length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Button 
                      onClick={handleSave} 
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </div>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    
                    <Button variant="outline" className="w-full" onClick={() => router.push(`/courses/${courseId}`)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Course
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
