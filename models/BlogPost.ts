import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "./User";
import { IBlogCategory } from "./BlogCategory";

export interface IBlogPost extends Document {
    title: string;
    excerpt: string;
    content: string; // Full content of the blog post
    coverImage: string;
    author: mongoose.Types.ObjectId | IUser; // Reference to User
    publishedAt: Date;
    readTime: number; // in minutes
    views: number;
    likes: number;
    commentsCount: number;
    tags: string[];
    category: mongoose.Types.ObjectId | IBlogCategory; // Reference to BlogCategory
    isFeatured?: boolean;
}

const BlogPostSchema: Schema = new Schema({
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    coverImage: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: { type: Date, default: Date.now },
    readTime: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    category: { type: Schema.Types.ObjectId, ref: "BlogCategory", required: true },
    isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.BlogPost || mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);