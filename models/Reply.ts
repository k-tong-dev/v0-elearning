import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "./User";

export interface IReply extends Document {
    content: string;
    author: mongoose.Types.ObjectId | IUser; // Reference to User
    isLiked?: boolean;
    likes?: number;
}

const ReplySchema: Schema = new Schema({
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isLiked: { type: Boolean, default: false },
    likes: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.Reply || mongoose.model<IReply>("Reply", ReplySchema);