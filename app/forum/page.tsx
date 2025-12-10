"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import { Footer } from "@/components/ui/footers/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  MessageCircle,
  Search,
  Plus,
  Users,
  Clock,
  Pin,
  TrendingUp,
  Eye,
  ThumbsUp,
  Reply,
  Filter,
  Star,
  Loader2
} from "lucide-react"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button as HeroButton,
  Input as HeroInput,
  Textarea as HeroTextarea,
  Select,
  SelectItem,
} from "@heroui/react"
import { Switch } from "@/components/ui/switch"
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem as ShadcnSelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getForumPosts, createForumPost, getForumCategories, getForumStats, type ForumPost as StrapiForumPost, type ForumCategory } from "@/integrations/strapi/forum"
import { strapiPublic } from "@/integrations/strapi/client"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { ArticleEditor } from "@/components/dashboard/course-form/ArticleEditor"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import { ForumCreateForm } from "@/components/forum/ForumCreateForm"
import { ModernForumPostCard } from "@/components/forum/ModernForumPostCard"
import { ForumPostCreator } from "@/components/forum/ForumPostCreator"
import { ModernForumSidebar } from "@/components/forum/ModernForumSidebar"

// Helper function to strip HTML tags and get plain text
function stripHtml(html: string): string {
    if (!html) return "";
    // Create a temporary DOM element to parse HTML
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

interface ForumPost {
  id: number | string
  documentId?: string // Add documentId for stable routing
  title: string
  content: string
  author: {
    id?: number
    name: string
    avatar?: string
    role?: string
    username?: string
  }
  category: string
  replies: number
  views: number
  likes: number
  dislikes?: number
  isPinned: boolean
  isAnswered: boolean
  createdAt: string
  lastActivity: string
  tags: string[]
  status?: string
}

export default function ForumPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [selectedStatus, setSelectedStatus] = useState("all")
    const [sortBy, setSortBy] = useState<"recent" | "popular" | "views" | "replies">("recent")
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [forumPosts, setForumPosts] = useState<ForumPost[]>([])
    const [categories, setCategories] = useState<ForumCategory[]>([])
    const [forumStats, setForumStats] = useState({
        totalPosts: 0,
        publishedPosts: 0,
        pinnedPosts: 0,
    })
    const [newPost, setNewPost] = useState({
        name: "", // subject/title
        description: "", // description with text editor
        content: "", // content with text editor
        category: "", // category select
        tags: "",
        status: "published" as "draft" | "published" | "archived" | "closed",
        isAnswered: false
    })
    const [availableTags, setAvailableTags] = useState<Array<{id: number; name: string; code?: string}>>([])

    const handleCreateSuccess = async () => {
        setShowCreateForm(false);
        // Refresh the forum posts list
        setIsLoading(true);
        try {
            const statusFilter = selectedStatus !== "all" && selectedStatus !== "published" 
                ? selectedStatus 
                : selectedStatus === "published" 
                    ? "published"
                    : undefined;
            
            const postsResponse = await getForumPosts({
                category: selectedCategory !== "all" ? selectedCategory : undefined,
                status: statusFilter,
                search: searchQuery || undefined,
                sortBy,
                page: 1,
                pageSize: 6,
            });
            
            // Extract posts from paginated response - handle both old and new format
            let posts: StrapiForumPost[] = [];
            if (postsResponse && typeof postsResponse === 'object' && 'data' in postsResponse) {
                // New format: { data: [...], pagination: {...} }
                posts = Array.isArray(postsResponse.data) ? postsResponse.data : [];
            } else if (Array.isArray(postsResponse)) {
                // Old format: direct array (backward compatibility)
                posts = postsResponse;
            } else {
                console.error('Unexpected posts response format:', postsResponse);
                posts = [];
            }
            
            let finalPosts: StrapiForumPost[] = Array.isArray(posts) ? posts : [];
            if (selectedStatus === "published") {
                finalPosts = finalPosts.filter((p: StrapiForumPost) => p.publishedAt !== null && p.publishedAt !== undefined);
            }
            
            // Ensure finalPosts is an array before mapping
            if (!Array.isArray(finalPosts)) {
                console.error('finalPosts is not an array:', finalPosts, typeof finalPosts);
                finalPosts = [];
            }
            
            const transformedPosts: ForumPost[] = finalPosts.map((post: StrapiForumPost) => ({
                id: post.id,
                title: post.name || post.title || "",
                content: post.content || "",
                author: {
                    id: post.author?.id,
                    name: post.author?.name || post.author?.username || "Anonymous",
                    avatar: getAvatarUrl(post.author?.avatar) || "/images/Avatar.jpg",
                    role: "Student",
                    username: post.author?.username,
                },
                category: post.category || "general",
                replies: post.repliesCount || 0,
                views: post.views || 0,
                likes: post.likes || post.liked || 0,
                dislikes: post.dislikes || post.dislike || 0,
                isPinned: post.isPinned || false,
                isAnswered: post.isAnswered || false,
                createdAt: post.createdAt 
                    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
                    : "Recently",
                lastActivity: post.lastActivity 
                    ? formatDistanceToNow(new Date(post.lastActivity), { addSuffix: true })
                    : "Recently",
                tags: post.tags?.map(t => t.name) || post.forum_tags?.map(t => t.name) || [],
                status: post.status || "published",
            }));
            
            setForumPosts(transformedPosts);
            
            // Refresh stats after creating a post
            const stats = await getForumStats();
            setForumStats(stats);
        } catch (error) {
            console.error("Error refreshing forum posts:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch forum posts and categories
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                // Only pass status filter if it's not 'all' and not 'published' (published uses publishedAt)
                const statusFilter = selectedStatus !== "all" && selectedStatus !== "published" 
                    ? selectedStatus 
                    : selectedStatus === "published" 
                        ? "published" // Will use publishedAt filter
                        : undefined
                
                const [postsResponse, cats, stats] = await Promise.all([
                    getForumPosts({
                        category: selectedCategory !== "all" ? selectedCategory : undefined,
                        status: statusFilter,
                        search: searchQuery || undefined,
                        sortBy,
                        page: 1,
                        pageSize: 6,
                    }),
                    getForumCategories(),
                    getForumStats()
                ])
                
                // Update forum stats
                setForumStats(stats)
                
                // Extract posts from paginated response - handle both old and new format
                let posts: StrapiForumPost[] = [];
                
                // Check if response is in new paginated format
                if (postsResponse && typeof postsResponse === 'object' && 'data' in postsResponse) {
                    // New format: { data: [...], pagination: {...} }
                    posts = Array.isArray(postsResponse.data) ? postsResponse.data : [];
                } else if (Array.isArray(postsResponse)) {
                    // Old format: direct array (backward compatibility)
                    posts = postsResponse;
                } else {
                    console.error('Unexpected posts response format:', postsResponse);
                    posts = [];
                }
                
                // If status filter was 'published' and we got all posts, filter in memory
                let finalPosts: StrapiForumPost[] = Array.isArray(posts) ? posts : [];
                if (selectedStatus === "published") {
                    finalPosts = finalPosts.filter((p: StrapiForumPost) => p.publishedAt !== null && p.publishedAt !== undefined);
                }
                
                // Ensure finalPosts is an array before mapping
                if (!Array.isArray(finalPosts)) {
                    console.error('finalPosts is not an array:', finalPosts, typeof finalPosts);
                    finalPosts = [];
                }
                
                // Transform Strapi posts to UI format
                // CRITICAL: Include documentId for stable routing (never changes)
                const transformedPosts: ForumPost[] = finalPosts.map((post: StrapiForumPost) => ({
                    id: post.id,
                    documentId: post.documentId || post.id.toString(), // Use documentId for routing
                    title: post.name || post.title || "",
                    content: post.content || "",
            author: {
                        id: post.author?.id,
                        name: post.author?.name || post.author?.username || "Anonymous",
                        avatar: getAvatarUrl(post.author?.avatar) || "/images/Avatar.jpg",
                        role: "Student", // You may want to get this from user profile
                        username: post.author?.username,
                    },
                    category: post.category || "general",
                    replies: post.repliesCount || 0,
                    views: post.views || 0,
                    likes: post.likes || post.liked || 0,
                    isPinned: post.isPinned || false,
                    isAnswered: post.isAnswered || false,
                    createdAt: post.createdAt 
                        ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
                        : "Recently",
                    lastActivity: post.lastActivity 
                        ? formatDistanceToNow(new Date(post.lastActivity), { addSuffix: true })
                        : "Recently",
                    tags: post.tags?.map(t => t.name) || post.forum_tags?.map(t => t.name) || [],
                    status: post.status || "published",
                }))
                
                setForumPosts(transformedPosts)
                setCategories(cats)
            } catch (error: any) {
                console.error("Error fetching forum data:", error)
                const errorMessage = error.message || "Failed to load forum posts"
                
                // Don't show error toast if it's just empty results
                if (!errorMessage.includes('Invalid key') && !errorMessage.includes('400')) {
                    toast.error(errorMessage + ". Please try again later.")
                } else {
                    // If there's a schema issue, just show a warning
                    console.warn("Schema may be missing some fields. Posts may not load correctly.")
                }
            } finally {
                setIsLoading(false)
            }
        }

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchData()
        }, searchQuery ? 500 : 0)

        return () => clearTimeout(timeoutId)
    }, [selectedCategory, selectedStatus, sortBy, searchQuery])

    const filteredPosts = forumPosts.filter(post => {
        const matchesSearch = !searchQuery || 
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))

        const matchesCategory = selectedCategory === "all" || post.category === selectedCategory

        // Status filter - handle gracefully if status field doesn't exist
        let matchesStatus = true
        if (selectedStatus !== "all") {
            if (post.status) {
                matchesStatus = post.status === selectedStatus
            } else {
                // If status field doesn't exist, treat all as published
                matchesStatus = selectedStatus === "published"
            }
        }

        return matchesSearch && matchesCategory && matchesStatus
    })

    const sortedPosts = [...filteredPosts].sort((a, b) => {
        switch (sortBy) {
            case "popular":
                return (b.likes + b.replies) - (a.likes + a.replies)
            case "views":
                return b.views - a.views
            case "replies":
                return b.replies - a.replies
            default: // recent
                return new Date(b.lastActivity || b.createdAt).getTime() - new Date(a.lastActivity || a.createdAt).getTime()
        }
    })

    const pinnedPosts = sortedPosts.filter(post => post.isPinned)
    const regularPosts = sortedPosts.filter(post => !post.isPinned)

    const handlePostClick = (postId: number | string, documentId?: string) => {
        // CRITICAL: Use documentId if available, otherwise fallback to numeric ID
        // documentId never changes, so it prevents "forum not found" errors
        const targetId = documentId || String(postId);
        console.log('[ForumPage] Navigating to post - documentId:', documentId, 'numericId:', postId);
        router.push(`/forum/${targetId}`)
    }

    const handleAuthorClick = (authorId?: number | string) => {
        if (authorId) {
        router.push(`/users/${authorId}`)
        }
    }

    // Show create form if toggled
    if (showCreateForm) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
                <HeaderUltra />
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                    <ForumCreateForm
                        categories={categories}
                        onCancel={() => setShowCreateForm(false)}
                        onSuccess={handleCreateSuccess}
                    />
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <HeaderUltra/>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24">
                {/* Modern Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-3">
                        <ModernForumSidebar
                            categories={categories}
                            selectedCategory={selectedCategory}
                            onCategoryChange={setSelectedCategory}
                            onCreatePost={() => setShowCreateForm(true)}
                            totalPosts={forumStats.totalPosts}
                            publishedPosts={forumStats.publishedPosts}
                            pinnedPosts={forumStats.pinnedPosts}
                        />
                    </div>

                    {/* Main Feed */}
                    <div className="lg:col-span-9 space-y-4">
                        {/* Post Creator */}
                        <ForumPostCreator onCreatePost={() => setShowCreateForm(true)} />

                        {/* Search and Sort */}
                        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search discussions..."
                                            className="pl-10"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pinned Posts */}
                        {pinnedPosts.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                    <Pin className="w-5 h-5 text-blue-500" />
                                    Pinned Discussions
                                </h2>
                                {pinnedPosts.map(post => (
                                    <ModernForumPostCard
                                        key={post.id}
                                        post={post}
                                        onPostClick={handlePostClick}
                                        onAuthorClick={handleAuthorClick}
                                        onLike={() => {}}
                                        onComment={() => handlePostClick(post.documentId || post.id, post.documentId)}
                                        onShare={() => {}}
                                    />
                                ))}
                                <Separator className="my-6" />
                            </div>
                        )}

                        {/* Regular Posts */}
                        <div className="space-y-4">
                            {regularPosts.length > 0 ? (
                                regularPosts.map(post => (
                                    <ModernForumPostCard
                                        key={post.id}
                                        post={post}
                                        onPostClick={handlePostClick}
                                        onAuthorClick={handleAuthorClick}
                                        onLike={() => {}}
                                        onComment={() => handlePostClick(post.documentId || post.id, post.documentId)}
                                        onShare={() => {}}
                                    />
                                ))
                            ) : (
                                <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
                                    <CardContent className="p-12 text-center">
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-spin" />
                                                <h3 className="text-lg font-semibold mb-2">Loading discussions...</h3>
                                            </>
                                        ) : (
                                            <>
                                                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                                <h3 className="text-lg font-semibold mb-2">No discussions found</h3>
                                                <p className="text-muted-foreground mb-4">
                                                    {searchQuery ? "Try adjusting your search terms" : "Be the first to start a discussion!"}
                                                </p>
                                                <Button onClick={() => setShowCreateForm(true)}>
                                                    Start Discussion
                                                </Button>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer/>
        </div>
    )
}
