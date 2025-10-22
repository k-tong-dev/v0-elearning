import mongoose, { Schema, Document } from "mongoose";

export interface IContent extends Document {
    type: "video" | "youtube" | "quiz" | "document" | "image" | "audio" | "link";
    title?: string;
    url?: string;
    extra?: Record<string, any>;
}

const ContentSchema: Schema = new Schema({
    type: {
        type: String,
        enum: ["video", "youtube", "quiz", "document", "image", "audio", "link"],
        required: true
    },
    title: { type: String },
    url: { type: String },
    extra: { type: Schema.Types.Mixed }
});

export default mongoose.models.Content || mongoose.model<IContent>("Content", ContentSchema);