import axios from 'axios';
import {getAccessToken} from "@/integrations/strapi/utils";

const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

// Main Strapi client for authenticated requests
export const strapi = axios.create({
    baseURL: STRAPI_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

strapi.interceptors.request.use(
    async (config) => {
        const accessToken = getAccessToken();
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
});