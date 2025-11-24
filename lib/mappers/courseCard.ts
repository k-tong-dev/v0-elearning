import { CourseCourse } from "@/integrations/strapi/courseCourse"
import { CourseBadge } from "@/integrations/strapi/courseBadge"
import { Skill } from "@/integrations/strapi/skill"
import { CourseCardData, CoursePreviewMeta } from "@/types/courseCard"

type RelationEntry = {
    id?: number | string
    documentId?: string
    name?: string
    [key: string]: any
}

type MapperOptions = {
    skills?: Skill[]
    badges?: CourseBadge[]
}

const normalizeRelationArray = (relation?: any): RelationEntry[] => {
    if (!relation) return []
    if (Array.isArray(relation)) return relation
    if (Array.isArray(relation?.data)) return relation.data
    return []
}

const resolveDocumentId = (
    matchName: string | undefined,
    relation: RelationEntry | undefined,
    catalog: Array<{ name?: string; documentId?: string }>,
) => {
    const catalogMatch = matchName ? catalog.find(item => item.name === matchName) : undefined
    if (catalogMatch?.documentId) return catalogMatch.documentId
    return relation?.documentId ?? (typeof relation?.id !== "undefined" ? String(relation.id) : undefined)
}

const parsePriceValue = (price: number | string | undefined): number => {
    if (typeof price === "number") return price
    if (typeof price === "string") {
        const numeric = parseFloat(price.replace(/[^0-9.]/g, ""))
        return Number.isFinite(numeric) ? numeric : 0
    }
    return 0
}

const buildPreviewMeta = (course: any): CoursePreviewMeta | undefined => {
    const previewRelation = course?.course_preview?.data ?? course?.course_preview
    const previewUrl = previewRelation?.url ?? course?.preview_url ?? null
    if (!previewUrl) return undefined

    const type: CoursePreviewMeta["type"] =
        previewRelation?.types ??
        (previewUrl.match(/\.(mp4|mov|webm|ogg|m4v)$/i) ? "video" :
            previewUrl.match(/\.(png|jpe?g|gif|webp|svg)$/i) ? "image" : "url")

    return { type, url: previewUrl }
}

export const mapCourseToCard = (
    course: CourseCourse,
    options: MapperOptions = {},
): CourseCardData => {
    const { skills = [], badges = [] } = options

    const primaryInstructor = course.instructors && course.instructors.length > 0 ? course.instructors[0] : undefined
    const previewMeta = buildPreviewMeta(course)

    const materials = normalizeRelationArray((course as any).course_materials)
    const contents = normalizeRelationArray((course as any).course_contents)
    const lessonCount =
        (course as any).lessons ??
        (course as any).lectures ??
        materials.length ||
        contents.length ||
        0

    const ratingSource: number | undefined =
        (course as any).average_rating ??
        (course as any).rating ??
        (Array.isArray((course as any).ratings) && (course as any).ratings.length
            ? (course as any).ratings.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) /
              ((course as any).ratings.length || 1)
            : undefined)

    const rating = typeof ratingSource === "number" && !Number.isNaN(ratingSource) ? ratingSource : 4.5
    const ratingCount =
        (course as any).ratings_count ??
        (course as any).review_count ??
        (Array.isArray((course as any).ratings) ? (course as any).ratings.length : undefined)

    const priceValue = parsePriceValue(course.Price)

    const skillDocumentIds =
        normalizeRelationArray(course.relevant_skills).map(skill =>
            resolveDocumentId(skill.name, skill, skills),
        ).filter(Boolean) as string[]
    const badgeDocumentIds =
        normalizeRelationArray(course.course_badges).map(badge =>
            resolveDocumentId(badge.name, badge, badges),
        ).filter(Boolean) as string[]

    return {
        id: course.id,
        title: course.name,
        description: course.description || "No description available",
        image: course.preview_url || "/placeholder.svg",
        price: `$${priceValue.toFixed(2)}`,
        priceValue,
        originalPrice:
            course.discount_type === "percentage" && course.discount_percentage
                ? `$${(priceValue / (1 - (course.discount_percentage || 0) / 100)).toFixed(2)}`
                : undefined,
        rating,
        ratingCount,
        students:
            typeof course.enrollment_count === "number"
                ? course.enrollment_count
                : (course as any).students || course.purchase_count || 0,
        duration:
            course.duration_minutes > 0
                ? `${Math.floor(course.duration_minutes / 60)}h ${course.duration_minutes % 60}m`
                : "Self paced",
        lessonCount,
        level: course.course_level?.name || "Beginner",
        category: course.course_categories?.[0]?.name || "General",
        educator: primaryInstructor?.name || "Unknown Instructor",
        educatorId: primaryInstructor?.id?.toString() || "0",
        instructors: course.instructors?.map(inst => ({
            id: inst.id?.toString() ?? `${inst.name ?? "instructor"}-${inst.id ?? ""}`,
            name: inst.name,
            avatar: inst.avatar,
        })),
        tags: (course.course_tages || []).map(tag => tag.name).filter(Boolean) as string[],
        skills: (course.relevant_skills || []).map(skill => skill.name).filter(Boolean) as string[],
        skillDocumentIds,
        badgeDocumentIds,
        preview: previewMeta,
        previewAvailable: Boolean(previewMeta),
        is_paid: course.is_paid,
    }
}

