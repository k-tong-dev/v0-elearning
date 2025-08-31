import clientPromise from './mongodb'
import { ObjectId } from 'mongodb'
import { UserRole, UserPreferences, UserSettings } from '@/types/auth' // Import from new types file
import { BadgeDefinition } from '@/types/db' // Import BadgeDefinition

export interface User {
    _id?: ObjectId
    id?: string
    email: string
    name: string
    avatar?: string
    provider: 'google' | 'email'
    providerId?: string
    password?: string // Only for email auth
    isVerified?: boolean
    role?: UserRole // New field
    preferences?: UserPreferences // New field for onboarding choices
    settings?: UserSettings // New field for user-configurable settings
    badgeIds?: string[] // Add this field
    createdAt: Date
    updatedAt: Date
    profile?: { // Existing profile fields
        bio?: string
        location?: string
        website?: string
        social?: {
            twitter?: string
            linkedin?: string
            github?: string
        }
    }
    subscription?: {
        plan: 'free' | 'basic' | 'pro' | 'enterprise'
        status: 'active' | 'inactive' | 'cancelled'
        currentPeriodEnd?: Date
        stripeCustomerId?: string
        stripeSubscriptionId?: string
    }
}

export class UserService {
    private static async getDatabase() {
        const client = await clientPromise
        return client.db('cameducation')
    }

    static async createUser(userData: Partial<User>): Promise<User> {
        const db = await this.getDatabase()
        const users = db.collection<User>('users')

        const now = new Date()
        const user: User = {
            ...userData,
            email: userData.email!,
            name: userData.name!,
            provider: userData.provider || 'email',
            isVerified: userData.provider === 'google' ? true : false,
            role: userData.role || 'student', // Default role
            preferences: userData.preferences || { learningGoals: [], learningStyle: [], topicsOfInterest: [] }, // Default preferences
            settings: userData.settings || { // Default settings
                theme: 'system',
                notifications: {
                    newEnrollments: true,
                    courseReviews: true,
                    paymentNotifications: true,
                    weeklyAnalytics: true,
                },
                newsletter: false,
                skills: []
            },
            badgeIds: userData.badgeIds || [], // Initialize badgeIds
            createdAt: now,
            updatedAt: now,
            profile: { // Initialize profile
                bio: '',
                location: '',
                website: '',
                social: {
                    twitter: '',
                    github: '',
                    linkedin: '',
                },
                ...userData.profile
            },
            subscription: {
                plan: 'free',
                status: 'active',
                ...userData.subscription
            }
        } as User

        // Check if user already exists
        const existingUser = await users.findOne({ email: user.email })
        if (existingUser) {
            throw new Error('User already exists with this email')
        }

        const result = await users.insertOne(user)
        return {
            ...user,
            _id: result.insertedId,
            id: result.insertedId.toString()
        }
    }

    static async findUserByEmail(email: string): Promise<User | null> {
        const db = await this.getDatabase()
        const users = db.collection<User>('users')

        const user = await users.findOne({ email })
        if (user) {
            return {
                ...user,
                id: user._id?.toString()
            }
        }
        return null
    }

    static async findUserById(id: string): Promise<User | null> {
        const db = await this.getDatabase()
        const users = db.collection<User>('users')

        try {
            const user = await users.findOne({ _id: new ObjectId(id) })
            if (user) {
                return {
                    ...user,
                    id: user._id?.toString()
                }
            }
        } catch (error) {
            console.error('[UserService] Error finding user by ID:', error)
        }
        return null
    }

    static async updateUser(id: string, updateData: Partial<User>): Promise<User | null> {
        const db = await this.getDatabase()
        const users = db.collection<User>('users')

        console.log(`[UserService] Attempting to update user ID: ${id}`);
        console.log(`[UserService] Update data:`, updateData);

        if (Object.keys(updateData).length === 0) {
            console.log(`[UserService] No update data provided for user ID: ${id}. Skipping update.`);
            return this.findUserById(id);
        }

        try {
            let objectId;
            try {
                objectId = new ObjectId(id);
                console.log(`[UserService] Converted ID to ObjectId: ${objectId}`);
            } catch (idError) {
                console.error(`[UserService] Error converting ID "${id}" to ObjectId:`, idError);
                return null; // Invalid ID format
            }

            const result = await users.findOneAndUpdate(
                { _id: objectId },
                {
                    $set: {
                        ...updateData,
                        updatedAt: new Date()
                    }
                },
                { returnDocument: 'after' }
            )

            console.log(`[UserService] findOneAndUpdate result:`, result);

            if (result.value) {
                console.log(`[UserService] User found and updated:`, result.value);
                return {
                    ...result.value,
                    id: result.value._id?.toString()
                }
            } else {
                console.log(`[UserService] User with ID ${id} not found for update.`);
            }
        } catch (error) {
            console.error(`[UserService] Database error during update for ID ${id}:`, error);
        }
        return null
    }

    static async createGoogleUser(profile: any, role?: UserRole, preferences?: UserPreferences): Promise<User> {
        return this.createUser({
            email: profile.email,
            name: profile.name,
            avatar: profile.picture,
            provider: 'google',
            providerId: profile.sub,
            isVerified: true,
            role: role, // Pass role if provided
            preferences: preferences // Pass preferences if provided
        })
    }

    static async findOrCreateGoogleUser(profile: any): Promise<{ user: User | null, isNewUser: boolean }> {
        let user = await this.findUserByEmail(profile.email)
        let isNewUser = false;

        const updateFields: Partial<User> = {
            avatar: profile.picture, // Always update avatar from Google profile
            isVerified: true, // Always set to true for Google users
        };

        if (!user) {
            // User does not exist, create a new one with default role and preferences
            user = await this.createUser({
                email: profile.email,
                name: profile.name,
                provider: 'google',
                providerId: profile.sub,
                ...updateFields,
                role: 'student', // Default role for new Google users
                preferences: { learningGoals: [], learningStyle: [], topicsOfInterest: [] }, // Default preferences
            })
            isNewUser = true;
        } else if (user.provider !== 'google') {
            // Existing email user, update to Google provider
            user = await this.updateUser(user.id!, {
                provider: 'google',
                providerId: profile.sub,
                ...updateFields,
            })
        } else {
            // Existing Google user, update only if there are meaningful changes
            const fieldsToUpdateForExistingGoogleUser: Partial<User> = {};
            if (updateFields.avatar && user.avatar !== updateFields.avatar) {
                fieldsToUpdateForExistingGoogleUser.avatar = updateFields.avatar;
            }
            if (updateFields.isVerified !== undefined && user.isVerified !== updateFields.isVerified) {
                fieldsToUpdateForExistingGoogleUser.isVerified = updateFields.isVerified;
            }

            if (Object.keys(fieldsToUpdateForExistingGoogleUser).length > 0) {
                user = await this.updateUser(user.id!, fieldsToUpdateForExistingGoogleUser)
            }
        }

        return { user, isNewUser };
    }
}

// Utility functions for password handling (if using email/password auth)
export async function hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt')
    return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const bcrypt = await import('bcrypt')
    return bcrypt.compare(password, hashedPassword)
}