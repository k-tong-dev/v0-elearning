// /Users/tong/Documents/@StudyMaterial/@FnalProject/Developments/website/v0-elearning/types/auth.ts
export type UserRole = 'student' | 'instructor' | 'company' | 'job_seeker' | 'other';

export interface UserPreferences {
    learningGoals?: string[]
    learningStyle?: string[]
    topicsOfInterest?: string[]
}

export interface UserSettings {
    theme?: 'light' | 'dark' | 'system'
    notifications?: {
        newEnrollments?: boolean
        courseReviews?: boolean
        paymentNotifications?: boolean
        weeklyAnalytics?: boolean
    }
    newsletter?: boolean
    skills?: string[]
}