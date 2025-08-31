import { ObjectId } from 'mongodb';

export interface Skill {
    _id?: ObjectId;
    id?: string; // String representation of _id for frontend
    name: string;
    category?: string; // e.g., "Programming Languages", "Frontend", "Backend"
    createdAt: Date;
    updatedAt: Date;
}

export interface BadgeDefinition {
    _id?: ObjectId;
    id?: string; // String representation of _id for frontend
    name: string;
    description: string;
    icon: string; // Emoji or URL to an icon
    color: string; // Tailwind CSS class for background color
    createdAt: Date;
    updatedAt: Date;
}