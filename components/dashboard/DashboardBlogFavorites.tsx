"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Heart, Trash2, Clock, Eye, Calendar } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { getUserBlogFavorites, deleteBlogFavorite, BlogFavoriteEntry } from "@/integrations/strapi/blogFavorites"
import { getBlogPostById, BlogPost } from "@/integrations/strapi/blog"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function DashboardBlogFavorites() {
    const router = useRouter()
    const { isAuthenticated, user } = useAuth()
    const [favoriteBlogs, setFavoriteBlogs] = useState<Array<BlogFavoriteEntry & { blog?: BlogPost }>>([])
    const [isLoading, setIsLoading] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    useEffect(() => {
        if (isAuthenticated && user) {
            loadFavorites()
        }
    }, [isAuthenticated, user])

    const loadFavorites = async () => {
        if (!user?.id) return
        try {
            setIsLoading(true)
            const favorites = await getUserBlogFavorites(user.id)
            
            // Load blog details for each favorite
            const blogsPromises = favorites.map(async (favorite) => {
                if (!favorite.blogPostId) return { ...favorite, blog: undefined }
                
                try {
                    const blog = await getBlogPostById(favorite.blogPostId)
                    return { ...favorite, blog }
                } catch (error) {
                    console.warn(`Failed to fetch blog ${favorite.blogPostId}:`, error)
                    return { ...favorite, blog: undefined }
                }
            })
            
            const blogsWithFavorites = await Promise.all(blogsPromises)
            setFavoriteBlogs(blogsWithFavorites.filter(item => item.blog))
        } catch (error) {
            console.error("Failed to load blog favorites:", error)
            toast.error("Failed to load favorites")
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemoveFavorite = async (favoriteId: number, documentId?: string) => {
        if (deletingId === favoriteId) return
        
        setDeletingId(favoriteId)
        try {
            await deleteBlogFavorite(favoriteId, documentId)
            setFavoriteBlogs(prev => prev.filter(item => item.id !== favoriteId))
            toast.success("Removed from favorites")
        } catch (error) {
            console.error("Failed to remove favorite:", error)
            toast.error("Failed to remove from favorites")
        } finally {
            setDeletingId(null)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Saved Blogs
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Your favorite blog articles
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-rose-500 to-purple-500 text-white font-bold">
                        {favoriteBlogs.length} {favoriteBlogs.length === 1 ? "Blog" : "Blogs"}
                    </Badge>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-muted rounded-xl h-80 animate-pulse" />
                    ))}
                </div>
            ) : favoriteBlogs.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20 bg-card/50 rounded-2xl border border-border"
                >
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 dark:from-rose-900/20 dark:to-purple-900/20 flex items-center justify-center">
                        <Heart className="w-12 h-12 text-rose-500 dark:text-rose-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                        {isAuthenticated ? "No saved blogs yet" : "Sign in to save blogs"}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                        {isAuthenticated
                            ? "Start adding blogs to your favorites for easy access!"
                            : "Create an account to save your favorite blogs"}
                    </p>
                    {!isAuthenticated && (
                        <Button
                            className="bg-gradient-to-r from-rose-500 to-purple-500 text-white"
                            onClick={() => router.push("/auth/start")}
                        >
                            Sign In
                        </Button>
                    )}
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteBlogs.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card
                                className="h-full hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
                                onClick={() => {
                                    const blogId = item.blog?.documentId || item.blog?.slug || item.blog?.id
                                    if (blogId) router.push(`/blog/${blogId}`)
                                }}
                            >
                                <div className="relative">
                                    {item.blog?.coverImage && typeof item.blog.coverImage === 'string' && item.blog.coverImage.trim() !== '' ? (
                                        <img
                                            src={item.blog.coverImage}
                                            alt={item.blog.title}
                                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 group-hover:scale-110 transition-transform duration-500 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/50 via-transparent to-purple-600/50 animate-pulse" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-white/30 font-bold text-4xl select-none">
                                                    {item.blog?.title?.charAt(0).toUpperCase() || 'B'}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <CardContent className="p-4">
                                    <h4 className="font-bold text-base mb-2 line-clamp-2 min-h-[48px]">
                                        {item.blog?.title || "Blog unavailable"}
                                    </h4>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                        {item.blog?.excerpt || "No description"}
                                    </p>
                                    
                                    <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{item.blog?.readTime || 0} min read</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>{item.blog?.views || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                                            <span>{item.blog?.likes || 0}</span>
                                        </div>
                                    </div>

                                    {item.blog?.author && (
                                        <div className="flex items-center gap-2 mb-3">
                                            <Avatar className="w-6 h-6">
                                                <AvatarImage src={getAvatarUrl(item.blog.author.avatar) || "/images/Avatar.jpg"} />
                                                <AvatarFallback>
                                                    {item.blog.author.name?.split(" ").map(n => n[0]).join("") || "A"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="text-xs text-muted-foreground">
                                                {item.blog.author.name}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            className="flex-1"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const blogId = item.blog?.documentId || item.blog?.slug || item.blog?.id
                                                if (blogId) router.push(`/blog/${blogId}`)
                                            }}
                                        >
                                            Read More
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRemoveFavorite(item.id, item.documentId)}
                                            disabled={deletingId === item.id}
                                        >
                                            {deletingId === item.id ? (
                                                "..."
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
