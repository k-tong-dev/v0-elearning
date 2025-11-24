import { strapiPublic, strapi } from "./client";

export type CoursePreviewType = "image" | "url" | "video";

export interface CoursePreview {
  id: number;
  documentId: string;
  types: CoursePreviewType;
  url?: string | null;
  // For media we keep raw Strapi data; frontend decides how to render
  video?: any;
  image?: any;
}

/**
 * Extract the preview URL from CoursePreview based on its type
 * Handles nested structures from Strapi API response
 */
export function getCoursePreviewUrl(preview: CoursePreview | null | undefined): string | null {
  if (!preview) return null;
  
  if (preview.types === "url" && preview.url) {
    return preview.url;
  }
  
  if (preview.types === "image" && preview.image) {
    // Handle nested structure: image.data.attributes.url or image.url
    const imageData = preview.image?.data || preview.image;
    const url = imageData?.attributes?.url || imageData?.url;
    if (url) {
      return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_STRAPI_URL || ''}${url}`;
    }
  }
  
  if (preview.types === "video" && preview.video) {
    // Handle nested structure: video.data.attributes.url or video.url
    const videoData = preview.video?.data || preview.video;
    const url = videoData?.attributes?.url || videoData?.url;
    if (url) {
      return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_STRAPI_URL || ''}${url}`;
    }
  }
  
  return null;
}

export async function getCoursePreview(
  id: number | string
): Promise<CoursePreview | null> {
  try {
    // In Strapi v5, GET by numeric id requires filter query
    const isNumericId = typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id));
    
    let response;
    if (isNumericId) {
      // Use filter query for numeric id
      const numericId = typeof id === 'string' ? Number(id) : id;
      response = await strapiPublic.get(
        `/api/course-previews?filters[id][$eq]=${numericId}&populate=*`
      );
      const items = response.data?.data ?? [];
      if (items.length === 0) return null;
      const item = items[0];
      return {
        id: item.id,
        documentId: item.documentId,
        types: item.types,
        url: item.url ?? null,
        video: item.video,
        image: item.image,
      };
    } else {
      // Use documentId in path
      response = await strapiPublic.get(
        `/api/course-previews/${id}?populate=*`
      );
      const item = response.data?.data;
      if (!item) return null;
      return {
        id: item.id,
        documentId: item.documentId,
        types: item.types,
        url: item.url ?? null,
        video: item.video,
        image: item.image,
      };
    }
  } catch (error) {
    console.error("Error fetching course preview:", error);
    return null;
  }
}

export async function createCoursePreview(data: {
  types: CoursePreviewType;
  url?: string;
  image?: number | { id: number } | { documentId: string }; // File ID or file object
  video?: number | { id: number } | { documentId: string }; // File ID or file object
}): Promise<CoursePreview | null> {
  try {
    const payload: any = {
      types: data.types,
    };
    
    // Set url for "url" type
    if (data.types === "url" && data.url) {
      payload.url = data.url;
    }
    
    // Set image field for "image" type
    if (data.types === "image" && data.image) {
      // Handle both numeric ID and object with id/documentId
      if (typeof data.image === 'number') {
        payload.image = data.image;
      } else if ('id' in data.image && data.image.id) {
        payload.image = data.image.id;
      } else if ('documentId' in data.image && data.image.documentId) {
        payload.image = { connect: [{ documentId: data.image.documentId }] };
      }
    }
    
    // Set video field for "video" type
    if (data.types === "video" && data.video) {
      // Handle both numeric ID and object with id/documentId
      if (typeof data.video === 'number') {
        payload.video = data.video;
      } else if ('id' in data.video && data.video.id) {
        payload.video = data.video.id;
      } else if ('documentId' in data.video && data.video.documentId) {
        payload.video = { connect: [{ documentId: data.video.documentId }] };
      }
    }
    
    const response = await strapi.post("/api/course-previews", {
      data: payload,
    });
    const item = response.data?.data;
    return {
      id: item.id,
      documentId: item.documentId,
      types: item.types,
      url: item.url ?? null,
      video: item.video,
      image: item.image,
    };
  } catch (error) {
    console.error("Error creating course preview:", error);
    return null;
  }
}

export async function updateCoursePreview(
  id: number | string,
  data: Partial<{ 
    types: CoursePreviewType; 
    url?: string;
    image?: number | { id: number } | { documentId: string } | null;
    video?: number | { id: number } | { documentId: string } | null;
  }>
): Promise<CoursePreview | null> {
  try {
    // In Strapi v5, PUT/DELETE operations require documentId, not numeric id
    // If numeric id is provided, fetch the documentId first
    const isNumericId = typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id));
    
    let documentId: string;
    if (isNumericId) {
      // Fetch the preview to get documentId
      const preview = await getCoursePreview(id);
      if (!preview) {
        console.error("Course preview not found");
        return null;
      }
      documentId = preview.documentId;
    } else {
      documentId = id as string;
    }
    
    const payload: any = {};
    
    // Copy all non-media fields
    if (data.types !== undefined) payload.types = data.types;
    if (data.url !== undefined) payload.url = data.url;
    
    // Handle image field
    if (data.image !== undefined) {
      if (data.image === null) {
        payload.image = null;
      } else if (typeof data.image === 'number') {
        payload.image = data.image;
      } else if ('id' in data.image && data.image.id) {
        payload.image = data.image.id;
      } else if ('documentId' in data.image && data.image.documentId) {
        payload.image = { connect: [{ documentId: data.image.documentId }] };
      }
    }
    
    // Handle video field
    if (data.video !== undefined) {
      if (data.video === null) {
        payload.video = null;
      } else if (typeof data.video === 'number') {
        payload.video = data.video;
      } else if ('id' in data.video && data.video.id) {
        payload.video = data.video.id;
      } else if ('documentId' in data.video && data.video.documentId) {
        payload.video = { connect: [{ documentId: data.video.documentId }] };
      }
    }
    
    const response = await strapi.put(`/api/course-previews/${documentId}`, {
      data: payload,
    });
    const item = response.data?.data;
    return {
      id: item.id,
      documentId: item.documentId,
      types: item.types,
      url: item.url ?? null,
      video: item.video,
      image: item.image,
    };
  } catch (error) {
    console.error("Error updating course preview:", error);
    return null;
  }
}


