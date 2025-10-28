"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThumbsUp, MessageCircle, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { UserRole } from "@/types/user" // Import UserRole

interface UserRecentPostsProps {
    posts: Array<{
        id: string
        title: string
        excerpt: string
        createdAt: string
        likes: number
        replies: number
        category: string
    }>
    userRole: UserRole // Pass the user's charactor code
}

export function UserRecentPosts({ posts, userRole }: UserRecentPostsProps) {
    const router = useRouter()

    return (
        <div className="space-y-4 mt-6">
            {posts.map((post, index) => (
                <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Card className="glass-enhanced hover:scale-[1.01] hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2 flex-1">
                                        <h3 className="font-semibold text-lg hover:text-primary cursor-pointer transition-colors">
                                            {post.title}
                                        </h3>
                                        <p className="text-muted-foreground text-sm line-clamp-2">
                                            {post.excerpt}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="bg-blue-50/20 text-blue-700 dark:text-blue-300">{post.category}</Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                        {post.likes}
                    </span>
                                        <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                                            {post.replies}
                    </span>
                                        <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                                            {post.createdAt}
                    </span>
                                    </div>

                                    <Button variant="ghost" size="sm" onClick={() => router.push(`/forum/${post.id}`)}>
                                        View Discussion →
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    )
}