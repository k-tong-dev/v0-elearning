import mongoose, { Schema, Document } from "mongoose";
import { IContent } from "./Content";

export interface ICourseCollection extends Document {
    title: string;
    description?: string;
    contents: mongoose.Types.ObjectId[] | IContent[];
}

const CourseCollectionSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    contents: [{ type: Schema.Types.ObjectId, ref: "Content" }],
}, { timestamps: true });

export default mongoose.models.CourseCollection || mongoose.model<ICourseCollection>("CourseCollection", CourseCollectionSchema);