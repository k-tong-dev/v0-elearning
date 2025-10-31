import { strapi, strapiPublic } from './client';
import { storeAccessToken as storeCookieToken, getAccessToken as getCookieToken, removeAccessToken as removeCookieToken } from '@/lib/cookies';

export async function checkStrapiUserExists(email: string): Promise<boolean> {
    try {
        const response = await strapiPublic.get(`/api/users?filters[email][$eq]=${email}`);
        return response.data && response.data.length > 0;
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
        const response = await strapiPublic.get(`/api/users?filters[email][$eq]=${email}&populate=*`);
        if (response.data && response.data.length > 0) {
            return response.data[0];
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

export async function uploadStrapiFile(file: File, ref?: string, refId?: string, field?: string): Promise<any> {
    try {
        const accessToken = getCookieToken();
        if (!accessToken) throw new Error("Missing access token for upload");

        const formData = new FormData();
        formData.append('files', file);
        if (ref) formData.append('ref', ref);
        if (refId) formData.append('refId', refId);
        if (field) formData.append('field', field);

        const response = await strapi.post('/api/upload', formData, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        console.log("[uploadStrapiFile] Response:", response.data);
        return response.data[0];
    } catch (error: any) {
        console.error("Strapi file upload error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || "Failed to upload file to Strapi.");
    }
}

export async function reportIssue(issueData: { title: string; description: string; userEmail?: string }): Promise<any> {
    try {
        const response = await strapi.post('/api/report-problems', { data: issueData });
        return response.data;
    } catch (error: any) {
        console.error("Error reporting issue to Strapi:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || "Failed to report issue.");
    }
}

// Export cookie-based token management functions
export const storeAccessToken = storeCookieToken;
export const getAccessToken = getCookieToken;
export const removeAccessToken = removeCookieToken;