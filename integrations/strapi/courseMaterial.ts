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
  // Copyright checking fields
  copyright_check_status?: CopyrightCheckStatus | null;
  copyright_check_result?: Record<string, unknown> | null;
  copyright_check_date?: string | null;
  copyright_check_provider?: string | null;
  copyright_violations?: CopyrightViolation[] | null;
  copyright_warnings?: CopyrightWarning[] | null;
  video_fingerprint?: string | null;
  copyright_check_metadata?: Record<string, unknown> | null;
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
    // Use authenticated client to fetch both published and unpublished materials
    // Try authenticated first, fallback to public if needed
    let response;
    try {
      response = await strapi.get(
        `/api/course-materials?filters[course_course][id][$eq]=${courseId}&sort=order_index:asc`
      );
    } catch (error) {
      // Fallback to public client if authenticated fails
      response = await strapiPublic.get(
      `/api/course-materials?filters[course_course][id][$eq]=${courseId}&sort=order_index:asc`
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

// Helper to resolve documentId from numeric ID
async function resolveDocumentIdByNumericId(
  collection: string,
  numericId: number,
): Promise<string | null> {
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
  }>
): Promise<CourseMaterialEntity | null> {
  try {
    // In Strapi v5, PUT/DELETE operations require documentId, not numeric id
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
        return null;
      }
      documentId = items[0].documentId;
    } else {
      documentId = id as string;
    }

    const response = await strapi.put(`/api/course-materials/${documentId}`, {
      data,
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
    // Only populate instructor - media fields (video, document, audio, images) are not populated
    // as we now use the url field for all content types
    const populateQuery = "populate[instructor][fields][0]=id";
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
        // Copyright fields
        copyright_check_status: item.copyright_check_status ?? null,
        copyright_check_result: item.copyright_check_result ?? null,
        copyright_check_date: item.copyright_check_date ?? null,
        copyright_check_provider: item.copyright_check_provider ?? null,
        copyright_violations: item.copyright_violations ?? null,
        copyright_warnings: item.copyright_warnings ?? null,
        video_fingerprint: item.video_fingerprint ?? null,
        copyright_check_metadata: item.copyright_check_metadata ?? null,
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
        // Copyright fields
        copyright_check_status: data.copyright_check_status ?? null,
        copyright_check_result: data.copyright_check_result ?? null,
        copyright_check_date: data.copyright_check_date ?? null,
        copyright_check_provider: data.copyright_check_provider ?? null,
        copyright_violations: data.copyright_violations ?? null,
        copyright_warnings: data.copyright_warnings ?? null,
        video_fingerprint: data.video_fingerprint ?? null,
        copyright_check_metadata: data.copyright_check_metadata ?? null,
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
      // Copyright fields
      copyright_check_status: item.copyright_check_status ?? null,
      copyright_check_result: item.copyright_check_result ?? null,
      copyright_check_date: item.copyright_check_date ?? null,
      copyright_check_provider: item.copyright_check_provider ?? null,
      copyright_violations: item.copyright_violations ?? null,
      copyright_warnings: item.copyright_warnings ?? null,
      video_fingerprint: item.video_fingerprint ?? null,
      copyright_check_metadata: item.copyright_check_metadata ?? null,
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
    const updateData: any = { ...data };
    
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
    
    if (data.course_material !== undefined) {
      const materialDocId = await resolveDocumentIdByNumericId("course-materials", data.course_material);
      if (materialDocId) {
        updateData.course_material = { connect: [{ documentId: materialDocId }] };
      } else {
        updateData.course_material = null;
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
    // Copyright fields
    if (data.copyright_check_status !== undefined) {
      updateData.copyright_check_status = data.copyright_check_status;
    }
    if (data.copyright_check_result !== undefined) {
      updateData.copyright_check_result = data.copyright_check_result;
    }
    if (data.copyright_check_date !== undefined) {
      updateData.copyright_check_date = data.copyright_check_date;
    }
    if (data.copyright_check_provider !== undefined) {
      updateData.copyright_check_provider = data.copyright_check_provider;
    }
    if (data.copyright_violations !== undefined) {
      updateData.copyright_violations = data.copyright_violations;
    }
    if (data.copyright_warnings !== undefined) {
      updateData.copyright_warnings = data.copyright_warnings;
    }
    if (data.video_fingerprint !== undefined) {
      updateData.video_fingerprint = data.video_fingerprint;
    }
    if (data.copyright_check_metadata !== undefined) {
      updateData.copyright_check_metadata = data.copyright_check_metadata;
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
      // Copyright fields
      copyright_check_status: item.copyright_check_status ?? null,
      copyright_check_result: item.copyright_check_result ?? null,
      copyright_check_date: item.copyright_check_date ?? null,
      copyright_check_provider: item.copyright_check_provider ?? null,
      copyright_violations: item.copyright_violations ?? null,
      copyright_warnings: item.copyright_warnings ?? null,
      video_fingerprint: item.video_fingerprint ?? null,
      copyright_check_metadata: item.copyright_check_metadata ?? null,
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


