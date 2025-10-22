import mongoose, { Schema, Document } from "mongoose";
import { IContent } from "./Content";

export interface ILesson extends Document {
    title: string;
    description?: string;
    type: "video" | "text" | "quiz";
    duration?: number; // in minutes
    order: number;
    isPublished: boolean;
    content?: mongoose.Types.ObjectId | IContent; // Reference to Content
}

const LessonSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    type: {
        type: String,
        enum: ["video", "text", "quiz"],
        required: true
    },
    duration: { type: Number, default: 0 },
    order: { type: Number, required: true },
    isPublished: { type: Boolean, default: false },
    content: { type: Schema.Types.ObjectId, ref: "Content" }
});

export default mongoose.models.Lesson || mongoose.model<ILesson>("Lesson", LessonSchema);