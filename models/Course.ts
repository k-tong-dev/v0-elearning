import mongoose, { Schema, Document } from "mongoose";
import { ILesson } from "./Lesson";
import { IUser } from "./User";

export interface ICourse extends Document {
    title: string;
    description: string;
    thumbnailUrl: string;
    price: number;
    originalPrice?: number;
    rating?: number;
    students?: number;
    duration?: string;
    level?: "Beginner" | "Intermediate" | "Advanced";
    category: string;
    educator: mongoose.Types.ObjectId | IUser; // Reference to User
    tags?: string[];
    trending?: boolean;
    bestseller?: boolean;
    discount?: string;
    lectures?: number;
    projects?: number;
    status: "draft" | "published" | "archived";
    type: "PDF" | "Video" | "Link" | "Interactive" | "Quiz";
    previewUrl?: string;
    autoApproveEnrollments?: boolean;
    allowReviews?: boolean;
    lessons?: mongoose.Types.ObjectId[] | ILesson[]; // References to Lesson
}

const CourseSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    rating: { type: Number, default: 0 },
    students: { type: Number, default: 0 },
    duration: { type: String },
    level: { type: String, enum: ["Beginner", "Intermediate", "Advanced"] },
    category: { type: String, required: true },
    educator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: String }],
    trending: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false },
    discount: { type: String },
    lectures: { type: Number, default: 0 },
    projects: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ["draft", "published", "archived"],
        default: "draft"
    },
    type: {
        type: String,
        enum: ["PDF", "Video", "Link", "Interactive", "Quiz"],
        default: "Video"
    },
    previewUrl: { type: String },
    autoApproveEnrollments: { type: Boolean, default: true },
    allowReviews: { type: Boolean, default: true },
    lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }]
}, { timestamps: true });

export default mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);