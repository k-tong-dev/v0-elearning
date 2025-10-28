// import clientPromise from './mongodb';
// import { ObjectId } from 'mongodb';
// import { BadgeDefinition } from '@/types/db';
//
// export class BadgeService {
//     private static async getCollection() {
//         const client = await clientPromise;
//         return client.db('cameducation').collection<BadgeDefinition>('badges');
//     }
//
//     static async createBadge(name: string, description: string, icon: string, color: string): Promise<BadgeDefinition> {
//         const collection = await this.getCollection();
//         const now = new Date();
//         const newBadge: BadgeDefinition = {
//             name,
//             description,
//             icon,
//             color,
//             createdAt: now,
//             updatedAt: now,
//         };
//         const result = await collection.insertOne(newBadge);
//         return {
//             ...newBadge,
//             _id: result.insertedId,
//             id: result.insertedId.toString(),
//         };
//     }
//
//     static async findAllBadges(): Promise<BadgeDefinition[]> {
//         const collection = await this.getCollection();
//         const badges = await collection.find({}).sort({ name: 1 }).toArray();
//         return badges.map(badge => ({
//             ...badge,
//             id: badge._id?.toString(),
//         }));
//     }
//
//     static async findBadgeById(id: string): Promise<BadgeDefinition | null> {
//         const collection = await this.getCollection();
//         try {
//             const badge = await collection.findOne({ _id: new ObjectId(id) });
//             if (badge) {
//                 return {
//                     ...badge,
//                     id: badge._id?.toString(),
//                 };
//             }
//         } catch (error) {
//             console.error('[BadgeService] Error finding badge by ID:', error);
//         }
//         return null;
//     }
//
//     static async findBadgeByName(name: string): Promise<BadgeDefinition | null> {
//         const collection = await this.getCollection();
//         const badge = await collection.findOne({ name });
//         if (badge) {
//             return {
//                 ...badge,
//                 id: badge._id?.toString(),
//             };
//         }
//         return null;
//     }
// }