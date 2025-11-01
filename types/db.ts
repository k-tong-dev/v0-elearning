import { ObjectId } from 'mongodb';

export interface Skill {
    _id?: ObjectId;
    id?: string;
    name: string;
    category?: string; // e.g., "Programming Languages", "Frontend", "Backend"
    createdAt: Date;
    updatedAt: Date;
}

export interface BadgeDefinition {
    _id?: ObjectId;
    id?: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    createdAt?: Date;
    updatedAt?: Date;
}