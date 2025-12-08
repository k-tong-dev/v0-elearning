/**
 * Cloudinary upload utility
 * Uploads files to Cloudinary and returns the public URL
 */

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  resource_type: string;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  resource_type?: "image" | "video" | "raw" | "auto";
  public_id?: string;
}

/**
 * Upload file to Cloudinary
 * Note: This should be called from a server-side API route for security
 * For client-side, use the API route: /api/upload/cloudinary
 */
export async function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "default");
  
  if (options.folder) {
    formData.append("folder", options.folder);
  }
  
  if (options.resource_type) {
    formData.append("resource_type", options.resource_type);
  }
  
  if (options.public_id) {
    formData.append("public_id", options.public_id);
  }

  try {
    const response = await fetch("/api/upload/cloudinary", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      // Try to parse as JSON, but handle HTML error pages
      let errorMessage = "Failed to upload to Cloudinary";
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } else {
          // If it's HTML (error page), get the status text
          errorMessage = `${response.status} ${response.statusText}`;
        }
      } catch (parseError) {
        errorMessage = `${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response");
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    throw new Error(error.message || "Failed to upload to Cloudinary");
  }
}

/**
 * Delete file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const response = await fetch("/api/upload/cloudinary", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ public_id: publicId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete from Cloudinary");
    }

    return true;
  } catch (error: any) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
}

