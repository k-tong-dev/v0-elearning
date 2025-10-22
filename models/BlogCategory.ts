import mongoose, { Schema, Document } from "mongoose";

export interface IBlogCategory extends Document {
    name: string;
    color?: string; // Tailwind CSS class or hex code
    postCount?: number;
}

const BlogCategorySchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    color: { type: String },
    postCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.BlogCategory || mongoose.model<IBlogCategory>("BlogCategory", BlogCategorySchema);