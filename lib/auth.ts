import clientPromise from './mongodb'
import { ObjectId } from 'mongodb'

export interface User {
  _id?: ObjectId
  id?: string
  email: string
  name: string
  avatar?: string
  provider: 'google' | 'email'
  providerId?: string
  password?: string // Only for email auth
  isVerified?: boolean
  createdAt: Date
  updatedAt: Date
  preferences?: {
    theme?: 'light' | 'dark' | 'system'
    notifications?: boolean
    newsletter?: boolean
  }
  profile?: {
    bio?: string
    website?: string
    social?: {
      twitter?: string
      linkedin?: string
      github?: string
    }
  }
  subscription?: {
    plan: 'free' | 'basic' | 'pro' | 'enterprise'
    status: 'active' | 'inactive' | 'cancelled'
    currentPeriodEnd?: Date
    stripeCustomerId?: string
    stripeSubscriptionId?: string
  }
}

export class UserService {
  private static async getDatabase() {
    const client = await clientPromise
    return client.db('cameducation')
  }

  static async createUser(userData: Partial<User>): Promise<User> {
    const db = await this.getDatabase()
    const users = db.collection<User>('users')

    const now = new Date()
    const user: User = {
      ...userData,
      email: userData.email!,
      name: userData.name!,
      provider: userData.provider || 'email',
      isVerified: userData.provider === 'google' ? true : false,
      createdAt: now,
      updatedAt: now,
      preferences: {
        theme: 'system',
        notifications: true,
        newsletter: false,
        ...userData.preferences
      },
      subscription: {
        plan: 'free',
        status: 'active',
        ...userData.subscription
      }
    } as User

    // Check if user already exists
    const existingUser = await users.findOne({ email: user.email })
    if (existingUser) {
      throw new Error('User already exists with this email')
    }

    const result = await users.insertOne(user)
    return {
      ...user,
      _id: result.insertedId,
      id: result.insertedId.toString()
    }
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    const db = await this.getDatabase()
    const users = db.collection<User>('users')
    
    const user = await users.findOne({ email })
    if (user) {
      return {
        ...user,
        id: user._id?.toString()
      }
    }
    return null
  }

  static async findUserById(id: string): Promise<User | null> {
    const db = await this.getDatabase()
    const users = db.collection<User>('users')
    
    try {
      const user = await users.findOne({ _id: new ObjectId(id) })
      if (user) {
        return {
          ...user,
          id: user._id?.toString()
        }
      }
    } catch (error) {
      console.error('Error finding user by ID:', error)
    }
    return null
  }

  static async updateUser(id: string, updateData: Partial<User>): Promise<User | null> {
    const db = await this.getDatabase()
    const users = db.collection<User>('users')

    try {
      const result = await users.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { 
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      )

      if (result.value) {
        return {
          ...result.value,
          id: result.value._id?.toString()
        }
      }
    } catch (error) {
      console.error('Error updating user:', error)
    }
    return null
  }

  static async deleteUser(id: string): Promise<boolean> {
    const db = await this.getDatabase()
    const users = db.collection<User>('users')

    try {
      const result = await users.deleteOne({ _id: new ObjectId(id) })
      return result.deletedCount > 0
    } catch (error) {
      console.error('Error deleting user:', error)
      return false
    }
  }

  static async createGoogleUser(profile: any): Promise<User> {
    return this.createUser({
      email: profile.email,
      name: profile.name,
      avatar: profile.picture,
      provider: 'google',
      providerId: profile.sub,
      isVerified: true
    })
  }

  static async findOrCreateGoogleUser(profile: any): Promise<User> {
    let user = await this.findUserByEmail(profile.email)
    
    if (!user) {
      user = await this.createGoogleUser(profile)
    } else if (user.provider !== 'google') {
      // Update existing user to include Google provider
      user = await this.updateUser(user.id!, {
        provider: 'google',
        providerId: profile.sub,
        avatar: user.avatar || profile.picture,
        isVerified: true
      })
    }
    
    return user!
  }
}

// Utility functions for password handling (if using email/password auth)
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt')
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const bcrypt = await import('bcrypt')
  return bcrypt.compare(password, hashedPassword)
}
