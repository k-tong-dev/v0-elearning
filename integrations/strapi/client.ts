import axios from 'axios';
import { getAccessToken as getCookieToken } from '@/lib/cookies';

const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

/**
 * Check if Strapi server is available
 * @returns Promise<boolean> - true if Strapi is reachable, false otherwise
 */
export async function isStrapiAvailable(): Promise<boolean> {
    try {
        const response = await axios.get(`${STRAPI_BASE_URL}/api`, {
            timeout: 3000, // 3 second timeout for health check
            validateStatus: (status) => status < 500, // Accept any status < 500 as "available"
        });
        return true;
    } catch (error) {
        return false;
    }
}

// Main Strapi client for authenticated requests
export const strapi = axios.create({
    baseURL: STRAPI_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

strapi.interceptors.request.use(
    async (config) => {
        const accessToken = getCookieToken();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const strapiPublic = axios.create({
    baseURL: STRAPI_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Add response interceptor to handle network errors gracefully
strapiPublic.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle network errors
        if (error.code === 'ECONNABORTED') {
            if (process.env.NODE_ENV === 'development') {
                console.warn('[Strapi Public] Request timeout');
            }
        } else if (error.message === 'Network Error' || !error.response) {
            if (process.env.NODE_ENV === 'development') {
                console.warn(
                    '[Strapi Public] Network error - Strapi may not be running.\n' +
                    `  → Check if Strapi is running at: ${STRAPI_BASE_URL}\n` +
                    '  → Start Strapi: cd eLearningAdmin && pnpm run develop'
                );
            }
        }
        return Promise.reject(error);
    }
);