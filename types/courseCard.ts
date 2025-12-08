export type CoursePreviewType = "image" | "video" | "url"

export interface CourseInstructorInfo {
    id: string
    name?: string
    avatar?: any
}

export interface CoursePreviewMeta {
    type: CoursePreviewType
    url: string
}

export interface CourseCardData {
    id: number
    title: string
    description: string
    image: string
    price: string
    priceValue?: number
    originalPrice?: string
    rating: number
    ratingCount?: number
    students: number
    duration: string
    lessonCount: number
    level: string
    category: string
    educator: string
    educatorId: string
    instructors?: CourseInstructorInfo[]
    tags: string[]
    skills?: string[]
    skillDocumentIds?: string[]
    badgeDocumentIds?: string[]
    preview?: CoursePreviewMeta
    previewAvailable?: boolean
    is_paid?: boolean
}

