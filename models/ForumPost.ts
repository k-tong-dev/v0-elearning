import mongoose, {Schema, Document} from "mongoose";
import {IUser} from "./User";
import {IComment} from "./Comment";

export interface IForumPost extends Document {
    title: string;
    content: string;
    author: mongoose.Types.ObjectId | IUser; // Reference to User
    category: string;
    tags?: string[];
    isPinned?: boolean;
    isAnswered?: boolean;
    isLiked?: boolean;
    isDisliked?: boolean;
    isBookmarked?: boolean;
    likes?: number;
    dislikes?: number;
    views?: number;
    repliesCount?: number;
    comments?: mongoose.Types.ObjectId[] | IComment[]; // Array of Comment references
    lastActivity?: Date;
}

const ForumPostSchema: Schema = new Schema({
    title: {type: String, required: true},
    content: {type: String, required: true},
    author: {type: Schema.Types.ObjectId, ref: "User", required: true},
    category: {type: String, required: true},
    tags: [{type: String}],
    isPinned: {type: Boolean, default: false},
    isAnswered: {type: Boolean, default: false},
    isLiked: {type: Boolean, default: false},
    isDisliked: {type: Boolean, default: false},
    isBookmarked: {type: Boolean, default: false},
    likes: {type: Number, default: 0},
    dislikes: {type: Number, default: 0},
    views: {type: Number, default: 0},
    repliesCount: {type: Number, default: 0},
    comments: [{type: Schema.Types.ObjectId, ref: "Comment"}],
    lastActivity: {type: Date, default: Date.now}
}, {timestamps: true});

export default mongoose.models.ForumPost || mongoose.model<IForumPost>("ForumPost", ForumPostSchema);