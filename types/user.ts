// src/types/user.ts
export type UserRoleSlug =
    | "student"
    | "instructor"
    | "job_seeker"
    | "company"
    | "other"
    | "authenticated"
    | "public"
    | "creator"
    | "viewer"
    | "developer"
    | "designer"
    | "admin"
    | string

export interface Default {
    id: number;
    documentId: string;
    name: string;
    [key: string]: any;
}

export interface Charactor {
    id: number;
    documentId?: string;
    name: string;
    code: UserRoleSlug;
    name_kh?: string;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string | null;
    locale?: string;
}

export interface UserRole {
    id: number;
    documentId?: string;
    name: string;
    description?: string;
    type: string;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
}

export interface StrapiMediaFormat {
    ext: string;
    url: string;
    hash: string;
    mime: string;
    name: string;
    path: string | null;
    size: number;
    width: number;
    height: number;
    sizeInBytes: number;
}

export interface StrapiMedia {
    id: number;
    documentId?: string;
    name: string;
    alternativeText?: string;
    caption?: string;
    width?: number;
    height?: number;
    formats?: {
        large?: StrapiMediaFormat;
        small?: StrapiMediaFormat;
        medium?: StrapiMediaFormat;
        thumbnail?: StrapiMediaFormat;
    };
    hash?: string;
    ext?: string;
    mime?: string;
    size?: number;
    url: string;
    previewUrl?: string | null;
    provider?: string;
    provider_metadata?: string | null;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
}

export interface User {
    id: string;
    documentId?: string;
    username: string;
    name?: string;
    email: string;
    provider?: string;
    confirmed?: boolean;
    blocked?: boolean;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
    providerId?: string | null;
    followers: number;
    following: number;
    bio?: string;
    location?: string;
    website?: string;
    supabaseId?: string;
    subscription?: "locked" | "unlock";
    notice_new_enrollment?: boolean;
    notice_course_reviewer?: boolean;
    notice_payment?: boolean | null;
    notice_weekly_analysis?: boolean;
    facebook?: string;
    linkin?: string;
    twister?: string;
    instagram?: string;
    github?: string;
    role?: UserRole;
    character?: Charactor;
    badges?: Array<{
        id: number;
        documentId?: string;
        name: string;
        createdAt?: string;
        updatedAt?: string;
        publishedAt?: string | null;
    }>;
    avatar?: StrapiMedia | string | null;
    interested?: Array<{
        id: number;
        documentId?: string;
        name: string;
        createdAt?: string;
        updatedAt?: string;
        publishedAt?: string | null;
        locale?: string;
    }>;
    learning_goals?: Array<{
        id: number;
        documentId?: string;
        name: string;
        createdAt?: string;
        updatedAt?: string;
        publishedAt?: string | null;
        locale?: string;
    }>;
    prefer_to_learns?: Array<{
        id: number;
        documentId?: string;
        name: string;
        createdAt?: string;
        updatedAt?: string;
        publishedAt?: string | null;
        locale?: string;
    }>;
    report_problems?: Array<{
        id: number;
        documentId?: string;
        title: string;
        description: string;
        internal_noted?: string;
        state?: string;
        createdAt?: string;
        updatedAt?: string;
        publishedAt?: string | null;
    }>;
    skills?: Array<{
        id: number;
        documentId?: string;
        name: string;
        createdAt?: string;
        updatedAt?: string;
        publishedAt?: string | null;
        locale?: string;
    }>;
    subscriptions?: Array<{
        id: number;
        documentId?: string;
        createdAt?: string;
        updatedAt?: string;
        publishedAt?: string | null;
        name: string;
    }>;
    friend_limit?: number; // Friend limit for subscription feature
}