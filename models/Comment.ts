import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "./User";
import { IReply } from "./Reply";

export interface IComment extends Document {
    content: string;
    author: mongoose.Types.ObjectId | IUser; // Reference to User
    isLiked?: boolean;
    isDisliked?: boolean;
    likes?: number;
    dislikes?: number;
    replies?: mongoose.Types.ObjectId[] | IReply[]; // Array of Reply references
}

const CommentSchema: Schema = new Schema({
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isLiked: { type: Boolean, default: false },
    isDisliked: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    replies: [{ type: Schema.Types.ObjectId, ref: "Reply" }]
}, { timestamps: true });

export default mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);