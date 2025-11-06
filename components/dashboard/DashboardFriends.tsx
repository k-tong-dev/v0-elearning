"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AnimatedModal, AnimatedModalContent, AnimatedModalHeader, AnimatedModalTitle } from "@/components/ui/aceternity/AnimatedModal"
import { 
    getUserFriends, 
    getReceivedFriendRequests, 
    getSentFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    unfriendUser,
    searchUsers,
    checkFriendRequest,
    FriendRequest
} from "@/integrations/strapi/friend-request"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { QuantumAvatar } from "@/components/ui/quantum-avatar"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import { 
    UserPlus, 
    UserCheck, 
    UserMinus, 
    Search, 
    Users, 
    Clock, 
    CheckCircle, 
    XCircle, 
    Loader2, 
    ExternalLink,
    X,
    AlertCircle,
    Crown
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/utils/utils"

const FRIEND_LIMIT = 1000

export function DashboardFriends() {
    const { user } = useAuth()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("friends")
    const [friends, setFriends] = useState<any[]>([])
    const [pendingReceived, setPendingReceived] = useState<FriendRequest[]>([])
    const [pendingSent, setPendingSent] = useState<FriendRequest[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searching, setSearching] = useState(false)
    const [processingId, setProcessingId] = useState<string | number | null>(null)
    const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
    const [activeIndicator, setActiveIndicator] = useState<string | null>(null)

    useEffect(() => {
        if (user?.id) {
            loadAllData()
        }
    }, [user?.id])

    // Track active tab movement
    useEffect(() => {
        setActiveIndicator(activeTab)
    }, [activeTab])

    const loadAllData = async () => {
        if (!user?.id) return
        
        setLoading(true)
        try {
            const [friendsList, received, sent] = await Promise.all([
                getUserFriends(user.id),
                getReceivedFriendRequests(user.id),
                getSentFriendRequests(user.id)
            ])
            
            setFriends(friendsList)
            setPendingReceived(received.filter(r => r.request_status === 'pending'))
            setPendingSent(sent.filter(r => r.request_status === 'pending'))
        } catch (error) {
            console.error("Error loading friends data:", error)
            toast.error("Failed to load friends data")
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([])
            return
        }

        setSearching(true)
        try {
            const results = await searchUsers(query)
            // Filter out current user and existing friends
            const friendIds = friends.map(f => Number(f.id || f))
            const filtered = results.filter((u: any) => 
                u.id !== user?.id && !friendIds.includes(Number(u.id))
            )
            setSearchResults(filtered)
        } catch (error) {
            console.error("Error searching users:", error)
            toast.error("Failed to search users")
        } finally {
            setSearching(false)
        }
    }

    const handleAddFriend = async (userId: string | number) => {
        if (!user?.id) return

        // Check friend limit
        if (friends.length >= FRIEND_LIMIT) {
            toast.error(`Friend limit reached (${FRIEND_LIMIT}). Please upgrade your subscription to add more friends.`)
            router.push('/subscription')
            return
        }

        // Check if request already exists
        const existingRequest = await checkFriendRequest(user.id, userId)
        if (existingRequest) {
            toast.info("Friend request already sent")
            // Remove from search results if already requested
            setSearchResults(prev => prev.filter((u: any) => u.id !== userId))
            return
        }

        setProcessingId(userId)
        try {
            await sendFriendRequest(user.id, userId)
            toast.success("Friend request sent!")
            // Remove from search results (they've been invited) - but keep modal open and search query
            setSearchResults(prev => prev.filter((u: any) => u.id !== userId))
            // Refresh friends list in background (don't wait for it)
            loadAllData().catch(console.error)
            // Don't close modal, don't reset search query - keep everything as is
        } catch (error: any) {
            toast.error(error.message || "Failed to send friend request")
        } finally {
            setProcessingId(null)
        }
    }

    // Reset search only when modal is actually closed (not just when state changes)
    useEffect(() => {
        if (!isSearchDialogOpen) {
            // Use a small delay to ensure state is preserved during transitions
            const timer = setTimeout(() => {
                setSearchQuery("")
                setSearchResults([])
            }, 300) // Wait for animation to complete
            
            return () => clearTimeout(timer)
        }
    }, [isSearchDialogOpen])

    const handleAcceptRequest = async (request: FriendRequest) => {
        if (!user?.id) return

        // Check friend limit
        if (friends.length >= FRIEND_LIMIT) {
            toast.error(`Friend limit reached (${FRIEND_LIMIT}). Please upgrade your subscription to add more friends.`)
            router.push('/subscription')
            return
        }

        setProcessingId(request.id)
        try {
            const fromUserId = typeof request.from_user === 'object' 
                ? request.from_user.id || request.from_user 
                : request.from_user
            await acceptFriendRequest(request.id, fromUserId, user.id)
            toast.success("Friend request accepted!")
            loadAllData()
        } catch (error: any) {
            toast.error(error.message || "Failed to accept friend request")
        } finally {
            setProcessingId(null)
        }
    }

    const handleRejectRequest = async (requestId: number) => {
        setProcessingId(requestId)
        try {
            await rejectFriendRequest(requestId)
            toast.success("Friend request rejected")
            loadAllData()
        } catch (error: any) {
            toast.error(error.message || "Failed to reject friend request")
        } finally {
            setProcessingId(null)
        }
    }

    const handleUnfriend = async (friendId: string | number) => {
        if (!confirm("Are you sure you want to unfriend this user?")) return
        
        if (!user?.id) return
        
        setProcessingId(friendId)
        try {
            await unfriendUser(user.id, friendId)
            toast.success("Unfriended successfully")
            loadAllData()
        } catch (error: any) {
            toast.error(error.message || "Failed to unfriend user")
        } finally {
            setProcessingId(null)
        }
    }

    const friendCount = friends.length
    const isNearLimit = friendCount >= FRIEND_LIMIT * 0.9
    const canAddMore = friendCount < FRIEND_LIMIT

    return (
        <div className="space-y-6">
            {/* Header with Stats */}
            <Card className="liquid-glass-card p-6 border-border/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2 mb-2">
                            <Users className="w-6 h-6 text-primary" />
                            Friends
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{friendCount}</span>
                            <span>Friends</span>
                            <span>•</span>
                            <span className="font-semibold text-foreground">{pendingReceived.length}</span>
                            <span>Pending Requests</span>
                        </div>
                    </div>
                    {isNearLimit && (
                        <Badge 
                            variant="outline" 
                            className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 flex items-center gap-1"
                        >
                            <AlertCircle className="w-3 h-3" />
                            {FRIEND_LIMIT - friendCount} slots remaining
                        </Badge>
                    )}
                    {!canAddMore && (
                        <Button
                            onClick={() => router.push('/subscription')}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 flex items-center gap-2"
                        >
                            <Crown className="w-4 h-4" />
                            Upgrade Plan
                        </Button>
                    )}
                </div>
            </Card>

            {/* Search Button */}
            <div className="flex justify-end">
                <Button
                    onClick={() => setIsSearchDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 flex items-center gap-2"
                >
                    <Search className="w-4 h-4" />
                    Search & Add Friends
                </Button>
                
                <AnimatedModal 
                    open={isSearchDialogOpen} 
                    onOpenChange={setIsSearchDialogOpen}
                    className="sm:max-w-2xl bg-gradient-to-br from-background via-background to-accent/5 border-2 border-border/50 backdrop-blur-2xl shadow-2xl"
                >
                    <AnimatedModalContent className="bg-transparent">
                        <AnimatedModalHeader>
                            <AnimatedModalTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                                Search & Add Friends
                            </AnimatedModalTitle>
                        </AnimatedModalHeader>
                        <div className="space-y-4 mt-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users by username or email..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        handleSearch(e.target.value)
                                    }}
                                    className="pl-10 bg-background/50 border-border/50"
                                    autoFocus
                                />
                            </div>

                            {searching && (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            )}

                            <AnimatePresence>
                                {!searching && searchResults.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-2 max-h-[400px] overflow-y-auto"
                                    >
                                        {searchResults.map((user: any) => (
                                            <motion.div
                                                key={user.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center gap-4 p-3 bg-card/50 backdrop-blur-xl border border-border rounded-xl hover:bg-card/70 transition-colors"
                                            >
                                                <QuantumAvatar
                                                    src={getAvatarUrl(user.avatar)}
                                                    alt={user.username || user.email}
                                                    size="md"
                                                    variant="neon"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-foreground">
                                                        {user.username || user.email}
                                                    </p>
                                                    {user.bio && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {user.bio}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={async () => {
                                                            await handleAddFriend(user.id)
                                                            // Don't close modal, don't reset search - keep everything as is
                                                            // Just remove the user from results if request was successful
                                                            // The handleAddFriend already handles the removal via refresh
                                                        }}
                                                        disabled={processingId === user.id || !canAddMore}
                                                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                                                    >
                                                        {processingId === user.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <UserPlus className="w-4 h-4 mr-1" />
                                                                Add Friend
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => router.push(`/users/${user.id}`)}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!searching && searchQuery && searchResults.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p>No users found</p>
                                </div>
                            )}

                            {!searchQuery && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Search className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p>Start typing to search for users</p>
                                </div>
                            )}
                        </div>
                    </AnimatedModalContent>
                </AnimatedModal>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="relative">
                    <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 rounded-xl relative">
                        {activeIndicator && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                className="absolute inset-0 bg-background rounded-lg z-0 shadow-sm"
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                style={{
                                    width: `${100 / 3}%`,
                                    left: activeTab === "friends" ? "0%" : activeTab === "received" ? "33.333%" : "66.666%"
                                }}
                            />
                        )}
                        <TabsTrigger 
                            value="friends" 
                            className="data-[state=active]:bg-transparent relative z-10"
                            onClick={() => setActiveTab("friends")}
                        >
                            <Users className="w-4 h-4 mr-2" />
                            My Friends ({friendCount})
                        </TabsTrigger>
                        <TabsTrigger 
                            value="received" 
                            className="data-[state=active]:bg-transparent relative z-10"
                            onClick={() => setActiveTab("received")}
                        >
                            <Clock className="w-4 h-4 mr-2" />
                            Requests ({pendingReceived.length})
                        </TabsTrigger>
                        <TabsTrigger 
                            value="sent" 
                            className="data-[state=active]:bg-transparent relative z-10"
                            onClick={() => setActiveTab("sent")}
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Sent ({pendingSent.length})
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* My Friends Tab */}
                <TabsContent value="friends" className="mt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : friends.length === 0 ? (
                        <Card className="liquid-glass-card p-12 text-center">
                            <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-foreground mb-2">No friends yet</p>
                            <p className="text-sm text-muted-foreground mb-4">
                                Search for users and send friend requests to get started!
                            </p>
                            <Button
                                onClick={() => setActiveTab("received")}
                                variant="outline"
                                className="mt-4"
                            >
                                Check Friend Requests
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {friends.map((friend: any) => (
                                <motion.div
                                    key={friend.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4 hover:bg-card/70 transition-all"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <QuantumAvatar
                                            src={getAvatarUrl(friend.avatar)}
                                            alt={friend.username || friend.email}
                                            size="lg"
                                            variant="quantum"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-foreground truncate">
                                                {friend.username || friend.email}
                                            </p>
                                            {friend.bio && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                    {friend.bio}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => router.push(`/users/${friend.id}`)}
                                            className="flex-1"
                                        >
                                            <ExternalLink className="w-3 h-3 mr-1" />
                                            View Profile
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleUnfriend(friend.id)}
                                            disabled={processingId === friend.id}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            {processingId === friend.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <UserMinus className="w-3 h-3" />
                                            )}
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Received Requests Tab */}
                <TabsContent value="received" className="mt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : pendingReceived.length === 0 ? (
                        <Card className="liquid-glass-card p-12 text-center">
                            <Clock className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-foreground mb-2">No pending requests</p>
                            <p className="text-sm text-muted-foreground">
                                You don't have any pending friend requests at the moment.
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {pendingReceived.map((request) => {
                                const fromUser = request.from_user as any
                                if (!fromUser) return null
                                
                                return (
                                    <motion.div
                                        key={request.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4 flex items-center gap-4"
                                    >
                                        <QuantumAvatar
                                            src={getAvatarUrl(fromUser.avatar)}
                                            alt={fromUser.username || fromUser.email}
                                            size="lg"
                                            variant="neon"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-foreground">
                                                {fromUser.username || fromUser.email}
                                            </p>
                                            {request.message && (
                                                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                                    {request.message}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(request.requested_at!).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleAcceptRequest(request)}
                                                disabled={processingId === request.id || !canAddMore}
                                                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                                            >
                                                {processingId === request.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Accept
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRejectRequest(request.id)}
                                                disabled={processingId === request.id}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                {processingId === request.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <XCircle className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => router.push(`/users/${fromUser.id}`)}
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Sent Requests Tab */}
                <TabsContent value="sent" className="mt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : pendingSent.length === 0 ? (
                        <Card className="liquid-glass-card p-12 text-center">
                            <UserPlus className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-foreground mb-2">No sent requests</p>
                            <p className="text-sm text-muted-foreground">
                                You haven't sent any friend requests yet.
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {pendingSent.map((request) => {
                                const toUser = request.to_user as any
                                if (!toUser) return null
                                
                                return (
                                    <motion.div
                                        key={request.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4 flex items-center gap-4"
                                    >
                                        <QuantumAvatar
                                            src={getAvatarUrl(toUser.avatar)}
                                            alt={toUser.username || toUser.email}
                                            size="lg"
                                            variant="neon"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-foreground">
                                                {toUser.username || toUser.email}
                                            </p>
                                            {request.message && (
                                                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                                    {request.message}
                                                </p>
                                            )}
                                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 mt-2">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Pending
                                            </Badge>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => router.push(`/users/${toUser.id}`)}
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                View Profile
                                            </Button>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

