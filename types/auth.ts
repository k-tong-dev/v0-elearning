export type UserRole = 'student' | 'instructor' | 'company' | 'job_seeker' | 'other';

export interface UserPreferences {
    learningGoals?: string[]
    learningStyle?: string[]
    topicsOfInterest?: string[]
}