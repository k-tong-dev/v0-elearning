import { strapiPublic, strapi } from "./client";
import { getAvatarUrl } from "@/lib/getAvatarUrl";

export type CourseContentType =
  | "video"
  | "audio"
  | "document"
  | "url"
  | "article"
  | "image"
  | "quiz"
  | "certificate";

export interface CourseMaterialEntity {
  id: number;
  documentId: string;
  name: string;
  description?: string;
  order_index: number;
  is_locked: boolean;
  active: boolean;
}

export type CopyrightCheckStatus = 
  | "pending" 
  | "checking" 
  | "passed" 
  | "failed" 
  | "warning" 
  | "manual_review";

export interface CopyrightViolation {
  type: string;
  source?: string;
  confidence?: number;
  message?: string;
}

export interface CopyrightWarning {
  type: string;
  message: string;
  severity?: "low" | "medium" | "high";
}

export interface CopyrightInformation {
  copyrighted: boolean; // TRUE = has copyright issues, FALSE = safe/original
  copy_right_status: CopyrightCheckStatus;
  copyright_check_result?: Record<string, unknown> | null;
  copyright_check_date?: string | null;
  copyright_check_provider?: string | null;
  copyright_violations?: CopyrightViolation[] | null;
  copyright_warnings?: CopyrightWarning[] | null;
  video_fingerprint?: string | null;
  copyright_check_metadata?: Record<string, unknown> | null;
}

export interface CourseContentEntity {
  id: number;
  documentId: string;
  name: string;
  type: CourseContentType;
  order_index: number;
  is_preview: boolean;
  estimated_minutes: number;
  duration_seconds: number;
  can_track_progress: boolean;
  url?: string | null; // Only for external URLs (YouTube, Vimeo, etc.)
  url_provider?: string | null;
  url_metadata?: Record<string, unknown> | null;
  url_checked_at?: string | null;
  article?: string | null; // Rich text content for article type
  instructor?: number | null;
  // Media fields - these contain the uploaded files
  video?: any | null; // StrapiMedia object
  document?: any | null; // StrapiMedia object
  audio?: any | null; // StrapiMedia object
  images?: any[] | null; // Array of StrapiMedia objects
  // NEW: Copyright information component
  copyright_information?: CopyrightInformation | null;
  // OLD: Individual fields (kept for backward compatibility during migration)
  copyright_check_status?: CopyrightCheckStatus | null;
  copyright_check_result?: Record<string, unknown> | null;
  copyright_check_date?: string | null;
  copyright_check_provider?: string | null;
  copyright_violations?: CopyrightViolation[] | null;
  copyright_warnings?: CopyrightWarning[] | null;
  video_fingerprint?: string | null;
  copyright_check_metadata?: Record<string, unknown> | null;
  // Certificates relation (for certificate content type)
  certificates?: any[] | any | null;
}

/**
 * Get the display URL for a course content item
 * Uses url field for all content types (Cloudinary URLs for uploaded files, external URLs for others)
 * For article type, returns article field content
 */
export function getContentDisplayUrl(content: CourseContentEntity): string | null {
  if (!content) return null;
  
  // For article type, return article field
  if (content.type === "article" && content.article) {
    return content.article;
  }
  
  // Use url field for all other content types
  // For uploaded files, this contains Cloudinary URL
  // For external URLs, this contains YouTube/Vimeo/etc. URL
  if (content.url) {
    return content.url;
  }
  
  return null;
}

export async function getCourseMaterials(
  courseId: number | string
): Promise<CourseMaterialEntity[]> {
  try {
    // Resolve documentId for course (Strapi v5 uses documentId for relations)
    const courseDocumentId = await resolveDocumentIdByNumericId("course-courses", courseId);
    
    // Use authenticated client to fetch both published and unpublished materials
    // Try authenticated first, fallback to public if needed
    let response;
    const filterParam = courseDocumentId 
      ? `filters[course_course][documentId][$eq]=${courseDocumentId}`
      : `filters[course_course][id][$eq]=${courseId}`;
    
    try {
      response = await strapi.get(
        `/api/course-materials?${filterParam}&sort=order_index:asc`
      );
    } catch (error) {
      // Fallback to public client if authenticated fails
      response = await strapiPublic.get(
        `/api/course-materials?${filterParam}&sort=order_index:asc`
      );
    }
    const items = response.data?.data ?? [];
    return items.map((item: any) => ({
      id: item.id,
      documentId: item.documentId,
      name: item.name,
      description: item.description,
      order_index: item.order_index ?? 0,
      is_locked: item.is_locked ?? false,
      active: item.active ?? true,
    }));
  } catch (error) {
    console.error("Error fetching course materials:", error);
    return [];
  }
}

// Helper to resolve documentId from numeric ID or string ID
async function resolveDocumentIdByNumericId(
  collection: string,
  idOrDocumentId: number | string,
): Promise<string | null> {
  // If it's already a documentId (non-numeric string), return it
  if (typeof idOrDocumentId === 'string' && !/^\d+$/.test(idOrDocumentId)) {
    return idOrDocumentId;
  }
  
  const numericId = typeof idOrDocumentId === 'string' ? Number(idOrDocumentId) : idOrDocumentId;
  const query = [`filters[id][$eq]=${numericId}`, "fields[0]=documentId"].join("&");
  const url = `/api/${collection}?${query}`;
  const clients = [strapi, strapiPublic];
  for (const client of clients) {
    try {
      const response = await client.get(url);
      const items = response.data?.data ?? [];
      if (items.length > 0) {
        return items[0].documentId;
      }
    } catch (error) {
      console.warn(`Failed to resolve documentId for ${collection}`, error);
    }
  }
  return null;
}

export async function createCourseMaterial(data: {
  course_course: number;
  name: string;
  description?: string;
  order_index?: number;
}): Promise<CourseMaterialEntity | null> {
  try {
    // Resolve documentId for the course to ensure Strapi Admin UI displays the relation
    const courseDocumentId = await resolveDocumentIdByNumericId("course-courses", data.course_course);
    if (!courseDocumentId) {
      console.error("Failed to resolve course documentId for material creation");
      return null;
    }

    const response = await strapi.post("/api/course-materials", {
      data: {
        name: data.name,
        description: data.description,
        order_index: data.order_index ?? 0,
        // Use connect with documentId for CREATE to ensure Strapi Admin UI displays the relation
        course_course: {
          connect: [{ documentId: courseDocumentId }],
        },
      },
    });

    const item = response.data?.data;
    return {
      id: item.id,
      documentId: item.documentId,
      name: item.name,
      description: item.description,
      order_index: item.order_index ?? 0,
      is_locked: item.is_locked ?? false,
      active: item.active ?? true,
    };
  } catch (error) {
    console.error("Error creating course material:", error);
    return null;
  }
}

export async function updateCourseMaterial(
  id: number | string,
  data: Partial<{
    name: string;
    description: string;
    order_index: number;
    is_locked: boolean;
    active: boolean;
    course_course?: number | string; // Allow course_course to be updated if needed
  }>
): Promise<CourseMaterialEntity | null> {
  try {
    // In Strapi v5, PUT/DELETE operations require documentId, not numeric id
    // If numeric id is provided, fetch documentId first
    let documentId: string;
    let existingMaterial: any = null;
    const isNumericId = typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id));
    
    if (isNumericId) {
      // Fetch the material to get documentId and existing data
      const numericId = typeof id === 'string' ? Number(id) : id;
      const fetchResponse = await strapiPublic.get(
        `/api/course-materials?filters[id][$eq]=${numericId}&populate=*`
      );
      const items = fetchResponse.data?.data ?? [];
      if (items.length === 0) {
        console.error("Course material not found with id:", numericId);
        return null;
      }
      existingMaterial = items[0];
      documentId = existingMaterial.documentId;
    } else {
      documentId = id as string;
      // Fetch existing material to preserve relations
      try {
        const fetchResponse = await strapiPublic.get(`/api/course-materials/${documentId}?populate=*`);
        existingMaterial = fetchResponse.data?.data;
      } catch (error) {
        console.warn("Could not fetch existing material:", error);
      }
    }

    // Prepare update data - only include fields that are being updated
    const updateData: any = {}
    
    // Only include fields that are actually being updated
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.order_index !== undefined) updateData.order_index = data.order_index
    if (data.is_locked !== undefined) updateData.is_locked = data.is_locked
    if (data.active !== undefined) updateData.active = data.active
    
    // Handle course_course relation - preserve if not being updated, use documentId if updating
    if (data.course_course !== undefined) {
      if (data.course_course) {
        const courseDocId = await resolveDocumentIdByNumericId("course-courses", data.course_course);
        if (courseDocId) {
          updateData.course_course = { connect: [{ documentId: courseDocId }] };
        } else {
          console.warn("Could not resolve course_course documentId, preserving existing relation");
          // Don't update if we can't resolve - preserve existing
        }
      } else {
        updateData.course_course = null;
      }
    } else {
      // course_course not in update data - preserve existing relation
      // Fetch existing material's course_course and preserve it
      if (existingMaterial && existingMaterial.course_course) {
        const existingCourseId = existingMaterial.course_course?.data?.id || existingMaterial.course_course?.id || existingMaterial.course_course
        if (existingCourseId) {
          const courseDocId = await resolveDocumentIdByNumericId("course-courses", existingCourseId)
          if (courseDocId) {
            updateData.course_course = { connect: [{ documentId: courseDocId }] }
            console.log("[Course Material Update] Preserving existing course_course relation")
          }
        }
      }
    }

    const response = await strapi.put(`/api/course-materials/${documentId}`, {
      data: updateData,
    });

    const item = response.data?.data;
    return {
      id: item.id,
      documentId: item.documentId,
      name: item.name,
      description: item.description,
      order_index: item.order_index ?? 0,
      is_locked: item.is_locked ?? false,
      active: item.active ?? true,
    };
  } catch (error) {
    console.error("Error updating course material:", error);
    return null;
  }
}

/**
 * Cascading delete function that deletes all child entities before deleting the material
 * Deletes in this order:
 * 1. Quiz Lines (for all quizzes in all sections)
 * 2. Quizzes (for all sections)
 * 3. Quiz Sections (for all quiz contents)
 * 4. Course Contents
 * 5. Course Material
 */
export async function deleteCourseMaterialWithCascade(
  id: number | string
): Promise<boolean> {
  try {
    // Get numeric ID for fetching contents
    const numericId = typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : typeof id === 'number' ? id : null;
    if (!numericId) {
      console.error("Invalid material ID:", id);
      return false;
    }

    // Get all contents for this material
    const contents = await getCourseContentsForMaterial(numericId);
    
    // Import quiz deletion functions (dynamic import to avoid circular dependency)
    const quizStructure = await import("./quizStructure");

    // Process each content - delete quiz-related entities for quiz contents
    for (const content of contents) {
      if (content.type === "quiz") {
        try {
          // Get all quiz sections for this content
          const quizSections = await quizStructure.getQuizSectionsByCourseContent(content.id);
          
          // Delete all quiz lines, quizzes, and sections
          for (const section of quizSections) {
            for (const quiz of section.quizzes || []) {
              // Delete all quiz lines for this quiz
              for (const line of quiz.lines || []) {
                await quizStructure.deleteCourseQuizLine(line.id);
              }
              // Delete the quiz
              await quizStructure.deleteCourseQuiz(quiz.id);
            }
            // Delete the quiz section
            await quizStructure.deleteQuizSection(section.id);
          }
        } catch (error) {
          console.error(`Error deleting quiz data for content ${content.id}:`, error);
          // Continue with other contents even if one fails
        }
      }
      
      // Delete the content itself
      try {
        await deleteCourseContentForMaterial(content.id);
      } catch (error) {
        console.error(`Error deleting content ${content.id}:`, error);
        // Continue with other contents even if one fails
      }
    }

    // Finally, delete the material itself
    return await deleteCourseMaterial(id);
  } catch (error) {
    console.error("Error in cascading delete for course material:", error);
    return false;
  }
}

export async function deleteCourseMaterial(
  id: number | string
): Promise<boolean> {
  try {
    // In Strapi v5, DELETE operations require documentId, not numeric id
    // If numeric id is provided, fetch documentId first
    let documentId: string;
    const isNumericId = typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id));
    
    if (isNumericId) {
      // Fetch the material to get documentId
      const numericId = typeof id === 'string' ? Number(id) : id;
      const fetchResponse = await strapiPublic.get(
        `/api/course-materials?filters[id][$eq]=${numericId}`
      );
      const items = fetchResponse.data?.data ?? [];
      if (items.length === 0) {
        console.error("Course material not found with id:", numericId);
        return false;
      }
      documentId = items[0].documentId;
    } else {
      documentId = id as string;
    }

    await strapi.delete(`/api/course-materials/${documentId}`);
    return true;
  } catch (error) {
    console.error("Error deleting course material:", error);
    return false;
  }
}

export async function getCourseContentsForMaterial(
  materialId: number | string
): Promise<CourseContentEntity[]> {
  try {
    // Use authenticated client to fetch both published and unpublished contents
    // Populate instructor only - media fields are no longer used (we use url field for all content)
    // Try authenticated first, fallback to public if needed
    let response;
    // Populate instructor and certificates relations
    // Certificates relation is needed for certificate content type
    const populateQuery = "populate[0]=instructor&populate[1]=certificates";
    try {
      response = await strapi.get(
        `/api/course-contents?filters[course_material][id][$eq]=${materialId}&sort=order_index:asc&${populateQuery}`
      );
    } catch (error) {
      // Fallback to public client if authenticated fails
      response = await strapiPublic.get(
        `/api/course-contents?filters[course_material][id][$eq]=${materialId}&sort=order_index:asc&${populateQuery}`
    );
    }
    const items = response.data?.data ?? [];
    return items.map((item: any) => {
      // Extract instructor ID - handle both direct ID and nested object
      let instructorId: number | null = null;
      if (item.instructor) {
        if (typeof item.instructor === 'number') {
          instructorId = item.instructor;
        } else if (item.instructor.id) {
          instructorId = typeof item.instructor.id === 'number' ? item.instructor.id : Number(item.instructor.id);
        } else if (item.instructor.data?.id) {
          instructorId = typeof item.instructor.data.id === 'number' ? item.instructor.data.id : Number(item.instructor.data.id);
        }
      }
      
      // Extract certificates relation - handle both array and single object
      let certificates: any = null;
      if (item.certificates) {
        if (Array.isArray(item.certificates)) {
          certificates = item.certificates.length > 0 ? item.certificates : null;
        } else if (item.certificates.data) {
          certificates = Array.isArray(item.certificates.data) ? item.certificates.data : [item.certificates.data];
        } else {
          certificates = [item.certificates];
        }
      }
      
      return {
      id: item.id,
      documentId: item.documentId,
      name: item.name,
      type: item.type,
      order_index: item.order_index ?? 0,
      is_preview: item.is_preview ?? false,
      estimated_minutes: item.estimated_minutes ?? 0,
      duration_seconds: item.duration_seconds ?? 0,
      can_track_progress: item.can_track_progress ?? false,
        url: item.url ?? null, // Only for external URLs
      url_provider: item.url_provider ?? null,
      url_metadata: item.url_metadata ?? null,
      url_checked_at: item.url_checked_at ?? null,
      article: item.article ?? null, // Rich text content for article type
        instructor: instructorId,
        // Media fields - include full media objects
        video: item.video?.data || item.video || null,
        document: item.document?.data || item.document || null,
        audio: item.audio?.data || item.audio || null,
        images: item.images?.data || item.images || null,
        // Copyright information component
        copyright_information: item.copyright_information ?? null,
        // Certificates relation (for certificate content type)
        certificates: certificates,
      };
    });
  } catch (error) {
    console.error("Error fetching course contents for material:", error);
    return [];
  }
}

export async function createCourseContentForMaterial(data: {
  course_material: number;
  name: string;
  type: CourseContentType;
  order_index?: number;
  is_preview?: boolean;
  estimated_minutes?: number;
  duration_seconds?: number;
  can_track_progress?: boolean;
  url?: string;
  url_provider?: string;
  url_metadata?: Record<string, unknown>;
  url_checked_at?: string;
  article?: string; // Rich text content for article type
  instructor?: number;
  // Media file ID for attaching to media fields (video, document, audio)
  mediaFileId?: number | string;
  // Copyright fields
  copyright_check_status?: CopyrightCheckStatus;
  copyright_check_result?: Record<string, unknown>;
  copyright_check_date?: string;
  copyright_check_provider?: string;
  copyright_violations?: CopyrightViolation[];
  copyright_warnings?: CopyrightWarning[];
  video_fingerprint?: string;
  copyright_check_metadata?: Record<string, unknown>;
}): Promise<CourseContentEntity | null> {
  try {
    // Resolve documentIds for relations to ensure Strapi Admin UI displays them
    const materialDocumentId = await resolveDocumentIdByNumericId("course-materials", data.course_material);
    if (!materialDocumentId) {
      console.error("Failed to resolve material documentId for content creation");
      return null;
    }

    let instructorConnect = undefined;
    if (data.instructor) {
      const instructorDocumentId = await resolveDocumentIdByNumericId("instructors", data.instructor);
      if (instructorDocumentId) {
        instructorConnect = { connect: [{ documentId: instructorDocumentId }] };
      }
    }

    // Determine which media field to use based on content type
    const mediaFieldMap: Record<string, string> = {
      video: "video",
      document: "document",
      audio: "audio",
      image: "images", // Note: schema uses "images" (plural) for image type
    };
    const mediaField = mediaFieldMap[data.type];
    
    // Prepare media field data if file ID is provided
    // In Strapi v5, media fields must use connect syntax
    const mediaFieldData: any = {};
    if (data.mediaFileId && mediaField) {
      // Ensure file ID is numeric (Strapi expects numeric ID for media connections)
      const fileId = typeof data.mediaFileId === 'number' ? data.mediaFileId : Number(data.mediaFileId);
      if (isNaN(fileId)) {
        console.error(`Invalid mediaFileId: ${data.mediaFileId} for field ${mediaField}`);
      } else {
        // Attach file to the appropriate media field using connect syntax
        // For images field (plural), connect with array
        if (mediaField === "images") {
          mediaFieldData[mediaField] = { connect: [{ id: fileId }] };
        } else {
          // Single file fields (video, document, audio) - use connect with single item
          mediaFieldData[mediaField] = { connect: [{ id: fileId }] };
        }
        console.log(`[createCourseContentForMaterial] Attaching file ID ${fileId} to ${mediaField} field`);
      }
    }

    const response = await strapi.post("/api/course-contents", {
      data: {
        name: data.name,
        // Use connect with documentId for CREATE to ensure Strapi Admin UI displays the relation
        course_material: {
          connect: [{ documentId: materialDocumentId }],
        },
        type: data.type,
        order_index: data.order_index ?? 0,
        is_preview: data.is_preview ?? false,
        estimated_minutes: data.estimated_minutes ?? 0,
        duration_seconds: data.duration_seconds ?? 0,
        can_track_progress: data.can_track_progress ?? false,
        url: data.url,
        url_provider: data.url_provider,
        url_metadata: data.url_metadata,
        url_checked_at: data.url_checked_at,
        article: data.article,
        instructor: instructorConnect,
        // Attach media file to appropriate field
        ...mediaFieldData,
        // Copyright information component
        copyright_information: {
          copyrighted: false, // Will be updated by copyright check
          copy_right_status: data.copyright_check_status ?? "pending",
          copyright_check_result: data.copyright_check_result ?? null,
          copyright_check_date: data.copyright_check_date ?? null,
          copyright_check_provider: data.copyright_check_provider ?? null,
          copyright_violations: data.copyright_violations ?? null,
          copyright_warnings: data.copyright_warnings ?? null,
          video_fingerprint: data.video_fingerprint ?? null,
          copyright_check_metadata: data.copyright_check_metadata ?? null,
        },
      },
    });

    const item = response.data?.data;
    // Extract instructor ID - handle both direct ID and nested object
    let instructorId: number | null = null;
    if (item.instructor) {
      if (typeof item.instructor === 'number') {
        instructorId = item.instructor;
      } else if (item.instructor.id) {
        instructorId = typeof item.instructor.id === 'number' ? item.instructor.id : Number(item.instructor.id);
      } else if (item.instructor.data?.id) {
        instructorId = typeof item.instructor.data.id === 'number' ? item.instructor.data.id : Number(item.instructor.data.id);
      }
    }
    
    return {
      id: item.id,
      documentId: item.documentId,
      name: item.name,
      type: item.type,
      order_index: item.order_index ?? 0,
      is_preview: item.is_preview ?? false,
      estimated_minutes: item.estimated_minutes ?? 0,
      duration_seconds: item.duration_seconds ?? 0,
      can_track_progress: item.can_track_progress ?? false,
      url: item.url ?? null,
      url_provider: item.url_provider ?? null,
      url_metadata: item.url_metadata ?? null,
      url_checked_at: item.url_checked_at ?? null,
      instructor: instructorId,
      // Copyright information component
      copyright_information: item.copyright_information ?? null,
    };
  } catch (error) {
    console.error("Error creating course content:", error);
    return null;
  }
}

export async function updateCourseContentForMaterial(
  id: number | string,
  data: Partial<{
    name: string;
    type: CourseContentType;
    order_index: number;
    is_preview: boolean;
    estimated_minutes: number;
    duration_seconds: number;
    can_track_progress: boolean;
    url: string;
    url_provider?: string;
    url_metadata?: Record<string, unknown>;
    url_checked_at?: string;
    article?: string; // Rich text content for article type
    instructor?: number;
    course_material?: number;
    // Media file ID for attaching to media fields (video, document, audio)
    mediaFileId?: number | string;
    // Copyright fields
    copyright_check_status?: CopyrightCheckStatus;
    copyright_check_result?: Record<string, unknown>;
    copyright_check_date?: string;
    copyright_check_provider?: string;
    copyright_violations?: CopyrightViolation[];
    copyright_warnings?: CopyrightWarning[];
    video_fingerprint?: string;
    copyright_check_metadata?: Record<string, unknown>;
  }>
): Promise<CourseContentEntity | null> {
  try {
    // In Strapi v5, PUT/DELETE operations require documentId, not numeric id
    // If numeric id is provided, fetch documentId first
    let documentId: string;
    const isNumericId = typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id));
    
    if (isNumericId) {
      // Fetch the content to get documentId - try both authenticated and public clients
      const numericId = typeof id === 'string' ? Number(id) : id;
      let items: any[] = [];
      
      // Try authenticated client first (for unpublished content)
      try {
        const fetchResponse = await strapi.get(
          `/api/course-contents?filters[id][$eq]=${numericId}&fields[0]=documentId`
        );
        items = fetchResponse.data?.data ?? [];
      } catch (error) {
        // If authenticated fails, try public
        try {
      const fetchResponse = await strapiPublic.get(
            `/api/course-contents?filters[id][$eq]=${numericId}&fields[0]=documentId`
      );
          items = fetchResponse.data?.data ?? [];
        } catch (publicError) {
          console.warn("Failed to fetch content with both clients:", publicError);
        }
      }
      
      if (items.length === 0) {
        console.warn("Course content not found with id:", numericId, "- it may not exist or be unpublished");
        return null;
      }
      documentId = items[0].documentId;
      if (!documentId) {
        console.error("Course content found but missing documentId:", numericId);
        return null;
      }
    } else {
      documentId = id as string;
    }

    // Determine which media field to use based on content type
    // First, get the current content to know its type
    let contentType = data.type;
    if (!contentType) {
      try {
        const currentContent = await strapi.get(`/api/course-contents/${documentId}?fields[0]=type`);
        contentType = currentContent.data?.data?.type;
      } catch (error) {
        console.warn("Could not fetch current content type:", error);
      }
    }
    
    const mediaFieldMap: Record<string, string> = {
      video: "video",
      document: "document",
      audio: "audio",
      image: "images", // Note: schema uses "images" (plural) for image type
    };
    const mediaField = contentType ? mediaFieldMap[contentType] : null;
    
    // Handle relations properly for Strapi v5 - use documentId for UPDATE operations
    // Only include fields that are actually being updated to preserve existing relations
    const updateData: any = {};
    
    // Copy only fields that are explicitly being updated
    const fieldsToUpdate = [
      'name', 'type', 'order_index', 'is_preview', 'estimated_minutes', 
      'duration_seconds', 'can_track_progress', 'url', 'url_provider', 
      'url_metadata', 'url_checked_at', 'article',
      'copyright_check_status', 'copyright_check_result', 'copyright_check_date',
      'copyright_check_provider', 'copyright_violations', 'copyright_warnings',
      'video_fingerprint', 'copyright_check_metadata'
    ];
    
    for (const field of fieldsToUpdate) {
      if (data[field as keyof typeof data] !== undefined) {
        updateData[field] = data[field as keyof typeof data];
      }
    }
    
    // Attach media file to appropriate field if file ID is provided
    // In Strapi v5, media fields must use connect syntax for updates
    if (data.mediaFileId && mediaField) {
      // Ensure file ID is numeric (Strapi expects numeric ID for media connections)
      const fileId = typeof data.mediaFileId === 'number' ? data.mediaFileId : Number(data.mediaFileId);
      if (isNaN(fileId)) {
        console.error(`[updateCourseContentForMaterial] Invalid mediaFileId: ${data.mediaFileId} for field ${mediaField}`);
      } else {
        // For images field (plural), connect with array
        if (mediaField === "images") {
          updateData[mediaField] = { connect: [{ id: fileId }] };
        } else {
          // Single file fields (video, document, audio) - use connect with single item
          updateData[mediaField] = { connect: [{ id: fileId }] };
        }
        console.log(`[updateCourseContentForMaterial] Attaching file ID ${fileId} to ${mediaField} field`);
      }
    }
    
    // Fetch existing content to preserve relations that aren't being updated
    let existingContent: any = null;
    try {
      const existingResponse = await strapiPublic.get(`/api/course-contents/${documentId}?populate=*`);
      existingContent = existingResponse.data?.data;
    } catch (error) {
      console.warn("Could not fetch existing content for relation preservation:", error);
    }
    
    // Handle course_material relation - preserve if not being updated, use documentId if updating
    if (data.course_material !== undefined) {
      if (data.course_material) {
        const materialDocId = await resolveDocumentIdByNumericId("course-materials", data.course_material);
        if (materialDocId) {
          updateData.course_material = { connect: [{ documentId: materialDocId }] };
        } else {
          console.warn("Could not resolve course_material documentId, preserving existing relation");
          // Don't update if we can't resolve - preserve existing
          if (existingContent && existingContent.course_material) {
            const existingMaterialId = existingContent.course_material?.data?.id || existingContent.course_material?.id || existingContent.course_material
            if (existingMaterialId) {
              const existingMaterialDocId = await resolveDocumentIdByNumericId("course-materials", existingMaterialId)
              if (existingMaterialDocId) {
                updateData.course_material = { connect: [{ documentId: existingMaterialDocId }] }
                console.log("[Course Content Update] Preserving existing course_material relation")
              }
            }
          }
        }
      } else {
        updateData.course_material = null;
      }
    } else {
      // course_material not in update data - preserve existing relation
      if (existingContent && existingContent.course_material) {
        const existingMaterialId = existingContent.course_material?.data?.id || existingContent.course_material?.id || existingContent.course_material
        if (existingMaterialId) {
          const existingMaterialDocId = await resolveDocumentIdByNumericId("course-materials", existingMaterialId)
          if (existingMaterialDocId) {
            updateData.course_material = { connect: [{ documentId: existingMaterialDocId }] }
            console.log("[Course Content Update] Preserving existing course_material relation")
          }
        }
      }
    }
    
    // Handle course_course relation if it exists on course content - preserve if not being updated
    // Note: course_course might not be a direct relation on course_content, but preserve if it exists
    if (existingContent && existingContent.course_course) {
      // Only preserve if not being updated
      if (data.course_course === undefined) {
        const existingCourseId = existingContent.course_course?.data?.id || existingContent.course_course?.id || existingContent.course_course
        if (existingCourseId) {
          const existingCourseDocId = await resolveDocumentIdByNumericId("course-courses", existingCourseId)
          if (existingCourseDocId) {
            updateData.course_course = { connect: [{ documentId: existingCourseDocId }] }
            console.log("[Course Content Update] Preserving existing course_course relation")
          }
        }
      }
    }
    if (data.instructor !== undefined) {
      if (data.instructor) {
        const instructorDocId = await resolveDocumentIdByNumericId("instructors", data.instructor);
        if (instructorDocId) {
          updateData.instructor = { connect: [{ documentId: instructorDocId }] };
        } else {
          updateData.instructor = null;
        }
      } else {
        updateData.instructor = null;
      }
    }
    // Copyright information component
    const hasCopyrightData = 
      data.copyright_check_status !== undefined ||
      data.copyright_check_result !== undefined ||
      data.copyright_check_date !== undefined ||
      data.copyright_check_provider !== undefined ||
      data.copyright_violations !== undefined ||
      data.copyright_warnings !== undefined ||
      data.video_fingerprint !== undefined ||
      data.copyright_check_metadata !== undefined;
    
    if (hasCopyrightData) {
      updateData.copyright_information = {};
      if (data.copyright_check_status !== undefined) {
        updateData.copyright_information.copy_right_status = data.copyright_check_status;
      }
      if (data.copyright_check_result !== undefined) {
        updateData.copyright_information.copyright_check_result = data.copyright_check_result;
      }
      if (data.copyright_check_date !== undefined) {
        updateData.copyright_information.copyright_check_date = data.copyright_check_date;
      }
      if (data.copyright_check_provider !== undefined) {
        updateData.copyright_information.copyright_check_provider = data.copyright_check_provider;
      }
      if (data.copyright_violations !== undefined) {
        updateData.copyright_information.copyright_violations = data.copyright_violations;
      }
      if (data.copyright_warnings !== undefined) {
        updateData.copyright_information.copyright_warnings = data.copyright_warnings;
      }
      if (data.video_fingerprint !== undefined) {
        updateData.copyright_information.video_fingerprint = data.video_fingerprint;
      }
      if (data.copyright_check_metadata !== undefined) {
        updateData.copyright_information.copyright_check_metadata = data.copyright_check_metadata;
      }
    }
    if (data.article !== undefined) {
      updateData.article = data.article;
    }

    const response = await strapi.put(`/api/course-contents/${documentId}`, {
      data: updateData,
    });

    const item = response.data?.data;
    // Extract instructor ID - handle both direct ID and nested object
    let instructorId: number | null = null;
    if (item.instructor) {
      if (typeof item.instructor === 'number') {
        instructorId = item.instructor;
      } else if (item.instructor.id) {
        instructorId = typeof item.instructor.id === 'number' ? item.instructor.id : Number(item.instructor.id);
      } else if (item.instructor.data?.id) {
        instructorId = typeof item.instructor.data.id === 'number' ? item.instructor.data.id : Number(item.instructor.data.id);
      }
    }
    
    return {
      id: item.id,
      documentId: item.documentId,
      name: item.name,
      type: item.type,
      order_index: item.order_index ?? 0,
      is_preview: item.is_preview ?? false,
      estimated_minutes: item.estimated_minutes ?? 0,
      duration_seconds: item.duration_seconds ?? 0,
      can_track_progress: item.can_track_progress ?? false,
      url: item.url ?? null,
      url_provider: item.url_provider ?? null,
      url_metadata: item.url_metadata ?? null,
      url_checked_at: item.url_checked_at ?? null,
      article: item.article ?? null,
      instructor: instructorId,
      // Copyright information component
      copyright_information: item.copyright_information ?? null,
    };
  } catch (error) {
    console.error("Error updating course content:", error);
    return null;
  }
}

export async function deleteCourseContentForMaterial(
  id: number | string
): Promise<boolean> {
  try {
    // In Strapi v5, DELETE operations require documentId, not numeric id
    // If numeric id is provided, fetch documentId first
    let documentId: string;
    const isNumericId = typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id));
    
    if (isNumericId) {
      // Fetch the content to get documentId
      const numericId = typeof id === 'string' ? Number(id) : id;
      const fetchResponse = await strapiPublic.get(
        `/api/course-contents?filters[id][$eq]=${numericId}`
      );
      const items = fetchResponse.data?.data ?? [];
      if (items.length === 0) {
        console.error("Course content not found with id:", numericId);
        return false;
      }
      documentId = items[0].documentId;
    } else {
      documentId = id as string;
    }

    await strapi.delete(`/api/course-contents/${documentId}`);
    return true;
  } catch (error) {
    console.error("Error deleting course content:", error);
    return false;
  }
}


