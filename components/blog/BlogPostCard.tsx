"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, Eye, Heart, TrendingUp, Award, Tag } from "lucide-react";
import { BlogPost, BlogCategory } from "@/types/blog";
import { getAvatarUrl } from "@/lib/getAvatarUrl";
import { useAuth } from "@/hooks/use-auth";
import { isBlogFavorite, createBlogFavorite, deleteBlogFavorite, getUserBlogFavorites } from "@/integrations/strapi/blogFavorites";
import { toast } from "sonner";

interface BlogPostCardProps {
    post: BlogPost;
    categories: BlogCategory[];
    formatDate: (dateString: string) => string;
    isFeatured?: boolean;
    delay?: number;
}

export function BlogPostCard({ post, categories, formatDate, isFeatured = false, delay = 0 }: BlogPostCardProps) {
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const category = categories.find(c => c.id === post.category) || post.categoryData;
    const [isFavorited, setIsFavorited] = useState(false);
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

    // Check if blog is favorited
    useEffect(() => {
        if (currentUser?.id && post.id) {
            isBlogFavorite(currentUser.id, post.id).then(setIsFavorited).catch(() => {});
        }
    }, [currentUser?.id, post.id]);

    const handlePostClick = () => {
        // Use documentId first (prevents duplicates), then slug, then id
        const postId = post.documentId || post.slug || post.id;
        router.push(`/blog/${postId}`);
    };

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent navigation when clicking heart
        
        if (!currentUser?.id || !post.id || isTogglingFavorite) {
            if (!currentUser) {
                toast.error("Please log in to favorite blogs");
            }
            return;
        }

        setIsTogglingFavorite(true);
        try {
            if (isFavorited) {
                const favorites = await getUserBlogFavorites(currentUser.id);
                const favoriteEntry = favorites.find(fav => fav.blogPostId === Number(post.id));
                
                if (favoriteEntry) {
                    await deleteBlogFavorite(favoriteEntry.id, favoriteEntry.documentId);
                    setIsFavorited(false);
                    toast.success("Removed from favorites");
                }
            } else {
                await createBlogFavorite(currentUser.id, post.id);
                setIsFavorited(true);
                toast.success("Added to favorites");
            }
        } catch (error: any) {
            console.error("Error toggling favorite:", error);
            toast.error(error.message || "Failed to update favorite status");
        } finally {
            setIsTogglingFavorite(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.3 }}
            className="group"
        >
            <Card
                className="h-full hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer overflow-hidden"
                onClick={handlePostClick}
            >
                <div className="relative">
                    {post.coverImage && typeof post.coverImage === 'string' && post.coverImage.trim() !== '' ? (
                    <img
                            src={post.coverImage}
                        alt={post.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 group-hover:scale-110 transition-transform duration-500 relative overflow-hidden">
                            {/* Animated gradient overlay for depth */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/50 via-transparent to-purple-600/50 animate-pulse" />
                            {/* Decorative pattern */}
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                                <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-300/20 rounded-full blur-3xl" />
                            </div>
                            {/* Title overlay for visual interest */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-white/30 font-bold text-4xl md:text-5xl select-none">
                                    {post.title.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="absolute top-4 left-4">
                        {isFeatured && (
                            <Badge className="bg-yellow-500 text-black font-semibold">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                            </Badge>
                        )}
                    </div>
                    {post.coverImage && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    )}
                </div>

                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                {post.title}
                            </h3>
                            <p className="text-muted-foreground text-sm line-clamp-3">
                                {post.excerpt}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={getAvatarUrl(post.author.avatar) || "/images/Avatar.jpg"} />
                                <AvatarFallback>
                                    {post.author.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="text-sm font-medium">{post.author.name}</div>
                                <div className="text-xs text-muted-foreground">{formatDate(post.publishedAt)}</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {post.readTime} min read
                                </span>
                                <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {post.views}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleFavoriteClick}
                                    disabled={isTogglingFavorite}
                                    className={`flex items-center gap-1 hover:opacity-70 transition-opacity ${
                                        isFavorited ? 'text-red-500' : 'text-muted-foreground'
                                    } ${isTogglingFavorite ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                                >
                                    <Heart className={`w-3 h-3 ${isFavorited ? 'fill-red-500' : ''}`} />
                                    {post.likes}
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {post.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                    #{tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}