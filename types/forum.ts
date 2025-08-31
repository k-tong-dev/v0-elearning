export interface User {
    id: string
    name: string
    avatar?: string
    role: string
    joinDate: string
    postCount: number
    reputation: number
    isOnline: boolean
}

export interface Reply {
    id: string
    content: string
    author: User
    createdAt: string
    likes: number
    isLiked: boolean
}

export interface Comment {
    id: string
    content: string
    author: User
    createdAt: string
    likes: number
    dislikes: number
    replies: Reply[]
    isLiked: boolean
    isDisliked: boolean
}

export interface ForumPost {
    id: string
    title: string
    content: string
    author: User
    category: string
    replies: number
    views: number
    likes: number
    dislikes: number
    isPinned: boolean
    isAnswered: boolean
    createdAt: string
    lastActivity: string
    tags: string[]
    isLiked: boolean
    isDisliked: boolean
    isBookmarked: boolean
    comments: Comment[]
}