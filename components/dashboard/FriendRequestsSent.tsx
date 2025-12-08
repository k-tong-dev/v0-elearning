"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSentFriendRequests, cancelFriendRequest, FriendRequest } from "@/integrations/strapi/friend-request"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { QuantumAvatar } from "@/components/ui/quantum-avatar"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import { UserPlus, X, Clock, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

export function FriendRequestsSent() {
    const { user } = useAuth()
    const router = useRouter()
    const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [cancellingId, setCancellingId] = useState<number | null>(null)

    useEffect(() => {
        if (user?.id) {
            loadSentRequests()
        }
    }, [user?.id])

    const loadSentRequests = async () => {
        if (!user?.id) return

        setLoading(true)
        try {
            const requests = await getSentFriendRequests(user.id)
            // Filter to show only pending requests
            setSentRequests(requests.filter(req => req.friend_status === 'pending'))
        } catch (error) {
            console.error("Error loading sent friend requests:", error)
            toast.error("Failed to load friend requests")
        } finally {
            setLoading(false)
        }
    }

    const handleCancelRequest = async (requestId: number) => {
        if (!confirm("Are you sure you want to cancel this friend request?")) return

        setCancellingId(requestId)
        try {
            await cancelFriendRequest(requestId)
            toast.success("Friend request cancelled")
            loadSentRequests() // Reload the list
        } catch (error: any) {
            toast.error(error.message || "Failed to cancel friend request")
        } finally {
            setCancellingId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (sentRequests.length === 0) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <UserPlus className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-lg font-semibold text-foreground mb-2">No Pending Friend Requests</p>
                    <p className="text-sm text-muted-foreground">You haven't sent any friend requests yet.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-foreground">Sent Friend Requests</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        You have {sentRequests.length} pending friend request{sentRequests.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            <div className="grid gap-4">
                {sentRequests.map((request) => {
                    const toUser = request.to_user as any
                    if (!toUser) return null

                    return (
                        <motion.div
                            key={request.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4"
                        >
                            <div className="flex items-center gap-4">
                                <QuantumAvatar
                                    src={getAvatarUrl(toUser.avatar)}
                                    alt={toUser.username || toUser.email}
                                    size="md"
                                    variant="neon"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-foreground truncate">
                                        {toUser.username || toUser.email}
                                    </p>
                                    {toUser.email && toUser.username && (
                                        <p className="text-xs text-muted-foreground truncate">{toUser.email}</p>
                                    )}
                                    {request.message && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {request.message}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Pending
                                        </Badge>
                                        {request.requested_at && (
                                            <span className="text-xs text-muted-foreground">
                                                Sent {new Date(request.requested_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCancelRequest(request.id)}
                                        disabled={cancellingId === request.id}
                                        className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                                    >
                                        {cancellingId === request.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <X className="w-4 h-4 mr-1" />
                                                Cancel
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.push(`/users/${toUser.id}`)}
                                        className="flex items-center gap-2"
                                    >
                                        View Profile
                                        <ExternalLink className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

