import { strapi, strapiPublic } from './client';
import { storeAccessToken as storeCookieToken, getAccessToken as getCookieToken, removeAccessToken as removeCookieToken } from '@/lib/cookies';

const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const DEFAULT_MEDIA_ROOT = (process.env.NEXT_PUBLIC_STRAPI_MEDIA_ROOT || 'eLearning').trim().replace(/^\/+|\/+$/g, '') || 'eLearning';

type NormalizedFolder = {
    id: number;
    name?: string;
    path?: string;
    pathId?: number;
    parent?: any;
};

const normalizeFolderEntry = (entry: any): NormalizedFolder | null => {
    if (!entry) return null;
    if (Array.isArray(entry)) {
        return entry.length > 0 ? normalizeFolderEntry(entry[0]) : null;
    }
    if (entry.data) {
        return normalizeFolderEntry(entry.data);
    }
    if (!entry.id && !entry.documentId) {
        return null;
    }

    const rawId = entry.id ?? entry.documentId;
    const numericId = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;
    if (numericId === undefined || numericId === null || Number.isNaN(numericId)) {
        return null;
    }

    return {
        id: numericId,
        name: entry.attributes?.name ?? entry.name,
        path: entry.attributes?.path ?? entry.path,
        pathId: entry.attributes?.pathId ?? entry.pathId,
        parent: entry.attributes?.parent ?? entry.parent,
    };
};

// NOTE: We intentionally do NOT call any folder endpoints here because your Strapi
// instance does not expose them on the public API. Folder placement is controlled
// purely via the `folder` (numeric id) or `path` (string) fields on the upload FormData.

export async function checkStrapiUserExists(email: string): Promise<boolean> {
    try {
        if (!email) return false;

        const encodedEmail = encodeURIComponent(email.trim().toLowerCase());
        const response = await strapiPublic.get(`/api/users?filters[email][$eq]=${encodedEmail}`);
        const data = Array.isArray(response.data)
            ? response.data
            : Array.isArray(response.data?.data)
                ? response.data.data
                : [];

        return data.length > 0;
    } catch (error) {
        console.error("Error checking Strapi user existence:", error);
        return false;
    }
}

export async function registerAccount(userData: { username: string; email: string; password?: string }): Promise<{ jwt: string; user: any }> {
    try {
        const response = await strapiPublic.post('/api/auth/local/register', {
            username: userData.username,
            email: userData.email,
            password: userData.password,
        });
        console.log("[registerAccount] Response:", response.data); // Debug
        return response.data;
    } catch (error: any) {
        console.error("Strapi registration error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || "Failed to register user with Strapi.");
    }
}

export async function updateUser(userId: string, payload: any): Promise<any> {
    try {
        const accessToken = getCookieToken();
        console.log("[updateUser] Access Token:", accessToken);
        if (!accessToken) throw new Error("No access token available for update");

        const response = await strapi.put(
            `/api/users/${userId}`,
            payload,
        );

        console.log("[updateUser] Response:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("Strapi profile update error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || "Failed to update user profile in Strapi.");
    }
}

export async function getStrapiUserByEmail(email: string): Promise<any | null> {
    try {
        if (!email) return null;

        const encodedEmail = encodeURIComponent(email.trim().toLowerCase());
        const response = await strapiPublic.get(`/api/users?filters[email][$eq]=${encodedEmail}&populate=*`);
        const data = Array.isArray(response.data)
            ? response.data
            : Array.isArray(response.data?.data)
                ? response.data.data
                : [];

        if (data.length > 0) {
            return data[0];
        }
        return null;
    } catch (error) {
        console.error("Error fetching Strapi user by email:", error);
        return null;
    }
}

export async function strapiLogin(identifier: string, password: string) {
    try {
        const payload = { identifier, password };
        const response = await strapiPublic.post("/api/auth/local", payload);
        console.log("[strapiLogin] Response:", response.data);
        return response.data;
    } catch (error: any) {
        console.group("Strapi local login error");
        console.error("Status:", error?.response?.status);
        console.error("Status text:", error?.response?.statusText);
        console.error("Data:", error?.response?.data);
        console.error("Raw error:", error);
        console.groupEnd();
        throw new Error(error.response?.data?.error?.message || "Login request failed before reaching Strapi.");
    }
}

/**
 * Create a folder in Strapi media library
 * @param folderName - Name of the folder to create
 * @param parentId - Optional parent folder ID (for nested folders)
 * @returns Folder object with id and name
 */
// NOTE: `createStrapiFolder` used to call Strapi's folder API, but your instance
// does not expose that endpoint. If you later enable it, we can reintroduce this
// helper; for now all folder placement is handled via the `path` field on upload.
export async function createStrapiFolder(folderName: string, parentId?: number | string, tokenOverride?: string): Promise<any> {
    console.warn("[createStrapiFolder] Folder API not used in this project. Use `path` or `folder` on upload instead.");
    return null;
}

/**
 * Step 1: Upload file to Strapi media library
 * This uploads the file and returns the file object with ID
 * @param file - File to upload
 * @param folderPath - Optional folder path or preset key (e.g., 'userAvatar', 'userInstructor', or 'eLearning/userAvatar')
 */
export async function uploadStrapiFile(file: File, folderPath?: string | number): Promise<any> {
    try {
        const accessToken = getCookieToken();
        if (!accessToken) throw new Error("Missing access token for upload");

        if (!file || !(file instanceof File)) {
            throw new Error("Invalid file provided");
        }

        const formData = new FormData();
        formData.append('files', file);

        // Basic folder handling:
        // - if folderPath is a number, treat it as a Strapi media folder id
        // - if it's a string, treat it as a Strapi media path (e.g. "userAvatar")
        if (folderPath) {
            if (typeof folderPath === 'number') {
                formData.append('folder', folderPath.toString());
            } else if (typeof folderPath === 'string') {
                formData.append('path', folderPath);
            }
        }

        console.log("[uploadStrapiFile] Uploading file:", {
            name: file.name,
            size: file.size,
            type: file.type,
            folderPath: folderPath || 'root'
        });

        // Upload to media library (don't attach to any entity yet)
        // Use axios directly to avoid default Content-Type header from strapi client
        // The strapi client sets 'Content-Type: application/json' which breaks FormData uploads
        const axiosInstance = (await import('axios')).default;
        
        // Create a new axios instance for file uploads without default Content-Type
        const uploadClient = axiosInstance.create({
            baseURL: STRAPI_BASE_URL,
            // Don't set Content-Type - axios will set it automatically with boundary
        });
        
        console.log("[uploadStrapiFile] Sending upload request", {
            baseURL: STRAPI_BASE_URL,
            folderPath: folderPath || 'root',
        });

        const response = await uploadClient.post('/api/upload', formData, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                // Don't set Content-Type header - axios will set it automatically with boundary
            },
        });

        console.log("[uploadStrapiFile] Response:", response.data);
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            const uploadedFile = response.data[0];
            
            // Log Cloudinary info if available
            if (uploadedFile.provider === 'cloudinary' || uploadedFile.provider_metadata) {
                console.log("[uploadStrapiFile] Cloudinary provider detected:", {
                    provider: uploadedFile.provider,
                    provider_metadata: uploadedFile.provider_metadata,
                    url: uploadedFile.url,
                });
            }
            
            // Verify file was uploaded to Cloudinary (check if URL contains cloudinary.com)
            if (uploadedFile.url && uploadedFile.url.includes('cloudinary.com')) {
                console.log("[uploadStrapiFile] ✅ File successfully uploaded to Cloudinary:", uploadedFile.url);
            } else {
                console.warn("[uploadStrapiFile] ⚠️ File URL does not appear to be from Cloudinary:", uploadedFile.url);
            }
            
            // Return the file object with ID - this will be used in step 2
            return {
                id: uploadedFile.id,
                documentId: uploadedFile.documentId,
                ...uploadedFile
            };
        }
        throw new Error("No file returned from upload");
    } catch (error: any) {
        const errorMessage = error.response?.data?.error?.message 
            || error.response?.data?.message 
            || error.message 
            || "Failed to upload file to Strapi";
        console.error("Strapi file upload error:", {
            message: errorMessage,
            status: error.response?.status,
            data: error.response?.data,
            error: error.message
        });
        throw new Error(errorMessage);
    }
}

/**
 * Get file details from Strapi to extract Cloudinary public_id
 */
async function getStrapiFileDetails(fileId: number | string): Promise<any | null> {
    try {
        const accessToken = getCookieToken();
        if (!accessToken) return null;

        const axiosInstance = (await import('axios')).default;
        const fileIdentifier = fileId;
        
        const response = await axiosInstance.get(
            `${STRAPI_BASE_URL}/api/upload/files/${fileIdentifier}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        return response.data?.data || null;
    } catch (error: any) {
        console.warn("[getStrapiFileDetails] Failed to get file details:", error.message);
        return null;
    }
}

/**
 * Extract Cloudinary public_id from Strapi file object
 */
function extractCloudinaryPublicId(fileData: any): string | null {
    if (!fileData) return null;
    
    // Check provider_metadata for Cloudinary public_id
    // Structure: provider_metadata.public_id or formats.thumbnail.provider_metadata.public_id
    if (fileData.provider_metadata?.public_id) {
        return fileData.provider_metadata.public_id;
    }
    
    // Check formats (thumbnail, small, medium, large)
    const formats = fileData.formats || {};
    for (const formatKey of ['thumbnail', 'small', 'medium', 'large']) {
        const format = formats[formatKey];
        if (format?.provider_metadata?.public_id) {
            return format.provider_metadata.public_id;
        }
    }
    
    // Try to extract from URL if it's a Cloudinary URL
    const url = fileData.url || fileData.attributes?.url;
    if (url && url.includes('cloudinary.com')) {
        // Extract public_id from Cloudinary URL
        // Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
        const match = url.match(/\/upload\/[^\/]+\/(.+?)(?:\.[^.]+)?$/);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return null;
}

/**
 * Delete a file from Strapi media library and Cloudinary
 * This removes the file from both Strapi and Cloudinary to prevent unused files
 */
export async function deleteStrapiFile(fileId: number | string): Promise<boolean> {
    try {
        const accessToken = getCookieToken();
        if (!accessToken) {
            console.warn("Missing access token for file deletion, skipping...");
            return false;
        }

        if (!fileId) {
            console.warn("No file ID provided for deletion");
            return false;
        }

        const axiosInstance = (await import('axios')).default;
        
        // First, get file details to extract Cloudinary public_id
        const fileData = await getStrapiFileDetails(fileId);
        let cloudinaryPublicId: string | null = null;
        
        if (fileData) {
            cloudinaryPublicId = extractCloudinaryPublicId(fileData);
            console.log("[deleteStrapiFile] Extracted Cloudinary public_id:", cloudinaryPublicId);
        }
        
        // Delete from Strapi first
        const fileIdentifier = fileId;
        const response = await axiosInstance.delete(
            `${STRAPI_BASE_URL}/api/upload/files/${fileIdentifier}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log("[deleteStrapiFile] File deleted from Strapi:", fileIdentifier);
        
        // If Cloudinary public_id found, also delete from Cloudinary
        if (cloudinaryPublicId) {
            try {
                const { deleteFromCloudinary } = await import('@/integrations/cloudinary/upload');
                const deleted = await deleteFromCloudinary(cloudinaryPublicId);
                if (deleted) {
                    console.log("[deleteStrapiFile] File also deleted from Cloudinary:", cloudinaryPublicId);
                } else {
                    console.warn("[deleteStrapiFile] Failed to delete from Cloudinary:", cloudinaryPublicId);
                }
            } catch (cloudinaryError) {
                console.warn("[deleteStrapiFile] Error deleting from Cloudinary:", cloudinaryError);
                // Don't fail the whole operation if Cloudinary deletion fails
            }
        } else {
            console.log("[deleteStrapiFile] No Cloudinary public_id found, skipping Cloudinary deletion");
        }
        
        return true;
    } catch (error: any) {
        // Log error but don't throw - file deletion failure shouldn't break the flow
        console.warn("[deleteStrapiFile] Failed to delete file:", {
            fileId,
            error: error.response?.data?.error?.message || error.message,
            status: error.response?.status,
        });
        return false;
    }
}

/**
 * Step 2: Attach uploaded file to an entity field
 * This updates the entity with the file ID
 */
export async function attachFileToEntity(
    contentType: string,
    entityId: string | number,
    field: string,
    fileId: number
): Promise<any> {
    try {
        const accessToken = getCookieToken();
        if (!accessToken) throw new Error("Missing access token");

        // Update the entity with the file ID
        const response = await strapi.put(`/api/${contentType}/${entityId}`, {
            data: {
                [field]: fileId,
            }
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        return response.data;
    } catch (error: any) {
        const errorMessage = error.response?.data?.error?.message 
            || error.response?.data?.message 
            || error.message 
            || "Failed to attach file to entity";
        console.error("Error attaching file:", {
            message: errorMessage,
            status: error.response?.status,
            data: error.response?.data,
        });
        throw new Error(errorMessage);
    }
}

export async function reportIssue(issueData: { title: string; description: string; user?: number; userEmail?: string }): Promise<any> {
    try {
        const payload: any = {
            title: issueData.title,
            description: issueData.description,
            state: "draft", // Use "draft" as default state (valid values: draft, checking, done)
        };
        
        // Include user ID if provided
        if (issueData.user) {
            payload.user = issueData.user;
        }
        
        console.log("[reportIssue] Submitting report:", payload);
        const response = await strapi.post('/api/report-issues?populate=*', { data: payload });
        return response.data;
    } catch (error: any) {
        console.error("Error reporting issue to Strapi:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || "Failed to report issue.");
    }
}

export async function submitContactRequest(contactData: { name: string; email: string; subject: string; purpose: string; user?: number }): Promise<any> {
    try {
        const payload: any = {
            name: contactData.name,
            email: contactData.email,
            subject: contactData.subject,
            purpose: contactData.purpose,
        };
        
        // Include user ID if provided
        if (contactData.user) {
            payload.user = contactData.user;
        }
        
        console.log("[submitContactRequest] Full payload being sent:", payload);
        console.log("[submitContactRequest] Using endpoint: POST /api/contacts");
        
        const response = await strapi.post('/api/contacts?populate=*', { data: payload });
        console.log("[submitContactRequest] Success response:", response.status);
        return response.data;
    } catch (error: any) {
        console.error("Error submitting contact request to Strapi - Full error:", error.response || error);
        console.error("Error response data:", error.response?.data);
        console.error("Error response status:", error.response?.status);
        console.error("Error message:", error.message);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to submit contact request.");
    }
}

// Export cookie-based token management functions
export const storeAccessToken = storeCookieToken;
export const getAccessToken = getCookieToken;
export const removeAccessToken = removeCookieToken;