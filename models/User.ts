import mongoose, { Schema, Document } from "mongoose";
import { UserRole } from "../types/auth";

// Define sub-schemas for embedded documents
const NotificationSettingsSchema: Schema = new Schema({
    newEnrollments: { type: Boolean, default: true },
    courseReviews: { type: Boolean, default: true },
    paymentNotifications: { type: Boolean, default: true },
    weeklyAnalytics: { type: Boolean, default: true }
}, { _id: false });

const UserSettingsSchema: Schema = new Schema({
    notifications: { type: NotificationSettingsSchema, default: {} },
    skills: [{ type: String }]
}, { _id: false });

const UserPreferencesSchema: Schema = new Schema({
    learningGoals: [{ type: String }],
    learningStyle: [{ type: String }],
    topicsOfInterest: [{ type: String }]
}, { _id: false });

export interface IUser extends Document {
    name: string;
    email: string;
    username?: string;
    avatar?: string;
    coverImage?: string;
    role: UserRole;
    bio?: string;
    location?: string;
    website?: string;
    joinDate?: Date;
    lastActive?: Date;
    isOnline?: boolean;
    stats?: {
        followers?: number;
        following?: number;
        posts?: number;
        replies?: number;
        likes?: number;
        views?: number;
        reputation?: number;
        coursesCreated?: number;
        coursesEnrolled?: number;
    };
    socialLinks?: {
        twitter?: string;
        github?: string;
        linkedin?: string;
    };
    settings?: {
        notifications?: {
            newEnrollments?: boolean;
            courseReviews?: boolean;
            paymentNotifications?: boolean;
            weeklyAnalytics?: boolean;
        };
        skills?: string[];
    };
    badgeIds?: mongoose.Types.ObjectId[]; // References BadgeDefinition
    verified?: boolean;
    level?: number;
    preferences?: {
        learningGoals?: string[];
        learningStyle?: string[];
        topicsOfInterest?: string[];
    };
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    coverImage: { type: String },
    role: {
        type: String,
        enum: ["student", "instructor", "admin", "expert", "mentor", "company", "job_seeker", "other"],
        default: "student"
    },
    bio: { type: String },
    location: { type: String },
    website: { type: String },
    joinDate: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    stats: {
        followers: { type: Number, default: 0 },
        following: { type: Number, default: 0 },
        posts: { type: Number, default: 0 },
        replies: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        reputation: { type: Number, default: 0 },
        coursesCreated: { type: Number, default: 0 },
        coursesEnrolled: { type: Number, default: 0 }
    },
    socialLinks: {
        twitter: { type: String },
        github: { type: String },
        linkedin: { type: String }
    },
    settings: { type: UserSettingsSchema, default: {} },
    badgeIds: [{ type: Schema.Types.ObjectId, ref: "BadgeDefinition" }],
    verified: { type: Boolean, default: false },
    level: { type: Number, default: 0 },
    preferences: { type: UserPreferencesSchema, default: {} }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);