import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';
import { Skill } from '@/types/db';

export class SkillService {
    private static async getCollection() {
        const client = await clientPromise;
        return client.db('cameducation').collection<Skill>('skills');
    }

    static async createSkill(name: string, category?: string): Promise<Skill> {
        const collection = await this.getCollection();
        const now = new Date();
        const newSkill: Skill = {
            name,
            category,
            createdAt: now,
            updatedAt: now,
        };
        const result = await collection.insertOne(newSkill);
        return {
            ...newSkill,
            _id: result.insertedId,
            id: result.insertedId.toString(),
        };
    }

    static async findAllSkills(): Promise<Skill[]> {
        const collection = await this.getCollection();
        const skills = await collection.find({}).sort({ name: 1 }).toArray();
        return skills.map(skill => ({
            ...skill,
            id: skill._id?.toString(),
        }));
    }

    static async findSkillByName(name: string): Promise<Skill | null> {
        const collection = await this.getCollection();
        const skill = await collection.findOne({ name });
        if (skill) {
            return {
                ...skill,
                id: skill._id?.toString(),
            };
        }
        return null;
    }

    // Add other CRUD operations if needed, e.g., update, delete
}