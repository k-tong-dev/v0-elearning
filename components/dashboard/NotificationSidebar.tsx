"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Bell, UserPlus, Users, Clock, CheckCircle, XCircle, UserCheck, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { getPendingInvitationsCount, getInstructorInvitations, InstructorInvitation, getCollaboratingInstructors } from "@/integrations/strapi/instructor-invitation"
import { getInstructors, Instructor, getInstructor } from "@/integrations/strapi/instructor"
import { strapiPublic } from "@/integrations/strapi/client"
import { getPendingFriendRequests, getAllFriendRequests, acceptFriendRequest, rejectFriendRequest, FriendRequest } from "@/integrations/strapi/friend-request"
import { toast } from "sonner"
import { QuantumAvatar } from "@/components/ui/quantum-avatar"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import { useRouter } from "next/navigation"

interface NotificationSidebarProps {
    isOpen: boolean
    onClose: () => void
}

export function NotificationSidebar({ isOpen, onClose }: NotificationSidebarProps) {
    const { user } = useAuth()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<"instructor-invitations" | "friend-requests">("instructor-invitations")
    const [instructorInvitations, setInstructorInvitations] = useState<InstructorInvitation[]>([])
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
    const [loading, setLoading] = useState(false)
    const [instructorCache, setInstructorCache] = useState<Map<number | string, Instructor>>(new Map())

    useEffect(() => {
        if (isOpen && user?.id) {
            loadNotifications()
        }
    }, [isOpen, user?.id])

    const loadNotifications = async () => {
        if (!user?.id) return
        
        setLoading(true)
        try {
            // Get user's instructors first
            const userInstructors = await getInstructors(user.id)
            
            // Load instructor invitations for each instructor
            const allInvitations: InstructorInvitation[] = []
            const cache = new Map<number | string, Instructor>()
            
            for (const instructor of userInstructors) {
                try {
                    const invitations = await getInstructorInvitations(instructor.id)
                    // getInstructorInvitations returns an array of received invitations
                    if (Array.isArray(invitations)) {
                        const pending = invitations.filter(inv => inv.invitation_status === 'pending')
                        allInvitations.push(...pending)
                        
                        // Cache instructors for from_user IDs
                        for (const inv of pending) {
                            const fromUser = inv.from_user
                            if (fromUser) {
                                const userId = typeof fromUser === 'object' ? fromUser.id : fromUser
                                if (userId && !cache.has(userId)) {
                                    try {
                                        const response = await strapiPublic.get(`/api/instructors?filters[user][id][$eq]=${userId}&populate=*`)
                                        const instructors = response.data?.data || []
                                        if (instructors.length > 0) {
                                            cache.set(userId, instructors[0] as Instructor)
                                        }
                                    } catch (error) {
                                        console.error(`Error fetching instructor for user ${userId}:`, error)
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error loading invitations for instructor ${instructor.id}:`, error)
                }
            }
            setInstructorInvitations(allInvitations)
            setInstructorCache(cache)

            // Load friend requests
            const requests = await getPendingFriendRequests(user.id)
            setFriendRequests(requests)
        } catch (error) {
            console.error("Error loading notifications:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAcceptFriendRequest = async (request: FriendRequest) => {
        try {
            if (!user?.id || !request.from_user) return

            const fromUserId = typeof request.from_user === 'object' 
                ? (request.from_user.id || request.from_user)
                : request.from_user

            await acceptFriendRequest(request.id, fromUserId, user.id)
            toast.success("Friend request accepted!")
            
            // Reload notifications
            await loadNotifications()
        } catch (error: any) {
            toast.error(error.message || "Failed to accept friend request")
        }
    }

    const handleRejectFriendRequest = async (request: FriendRequest) => {
        try {
            await rejectFriendRequest(request.id)
            toast.success("Friend request rejected")
            
            // Reload notifications
            await loadNotifications()
        } catch (error: any) {
            toast.error(error.message || "Failed to reject friend request")
        }
    }

    const pendingInstructorCount = instructorInvitations.filter(inv => inv.invitation_status === 'pending').length
    const pendingFriendCount = friendRequests.filter(req => req.request_status === 'pending').length
    const totalPending = pendingInstructorCount + pendingFriendCount

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:z-50"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-screen w-full max-w-md bg-background border-l border-border shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                                    <Bell className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Notifications</h2>
                                    {totalPending > 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            {totalPending} pending
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Tabs */}
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
                            <div className="px-6 pt-4 border-b border-border">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="instructor-invitations" className="relative">
                                        Instructor Invitations
                                        {pendingInstructorCount > 0 && (
                                            <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                                                {pendingInstructorCount}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="friend-requests" className="relative">
                                        Friend Requests
                                        {pendingFriendCount > 0 && (
                                            <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                                                {pendingFriendCount}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto scrollbar-hide">
                                <TabsContent value="instructor-invitations" className="mt-0 space-y-4 p-6">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : instructorInvitations.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Mail className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                            <p className="text-muted-foreground">No pending instructor invitations</p>
                                        </div>
                                    ) : (
                                        instructorInvitations.map((invitation) => {
                                            // Get instructor from cache using from_user
                                            const fromUser = invitation.from_user
                                            const userId = fromUser ? (typeof fromUser === 'object' ? fromUser.id : fromUser) : null
                                            const fromInstructor = userId ? instructorCache.get(userId) : null
                                            
                                            return (
                                                <motion.div
                                                    key={invitation.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4 hover:border-primary/40 transition-all"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <QuantumAvatar
                                                            src={getAvatarUrl(fromInstructor?.avatar)}
                                                            alt={fromInstructor?.name || "Instructor"}
                                                            size="md"
                                                            variant="quantum"
                                                            verified={fromInstructor?.is_verified}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="font-semibold text-foreground">
                                                                    {fromInstructor?.name || "Unknown Instructor"}
                                                                </p>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {invitation.invitation_status}
                                                                </Badge>
                                                            </div>
                                                        {invitation.message && (
                                                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                                                {invitation.message}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Clock className="w-3 h-3" />
                                                            {invitation.invited_at 
                                                                ? new Date(invitation.invited_at).toLocaleDateString()
                                                                : "Recently"
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                            )
                                        })
                                    )}
                                </TabsContent>

                                <TabsContent value="friend-requests" className="mt-0 space-y-4 p-6">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : friendRequests.length === 0 ? (
                                        <div className="text-center py-12">
                                            <UserPlus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                            <p className="text-muted-foreground">No pending friend requests</p>
                                        </div>
                                    ) : (
                                        friendRequests.map((request) => {
                                            const fromUser = typeof request.from_user === 'object' 
                                                ? request.from_user 
                                                : null

                                            return (
                                                <motion.div
                                                    key={request.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4 hover:border-primary/40 transition-all"
                                                >
                                                    <div className="flex items-start gap-4 mb-4">
                                                        <QuantumAvatar
                                                            src={getAvatarUrl(fromUser?.avatar)}
                                                            alt={fromUser?.username || "User"}
                                                            size="md"
                                                            variant="quantum"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-foreground">
                                                                {fromUser?.username || "Unknown User"}
                                                            </p>
                                                            {request.message && (
                                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                                    {request.message}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                                                <Clock className="w-3 h-3" />
                                                                {request.requested_at 
                                                                    ? new Date(request.requested_at).toLocaleDateString()
                                                                    : "Recently"
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleAcceptFriendRequest(request)}
                                                            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                                                        >
                                                            <UserCheck className="w-4 h-4 mr-2" />
                                                            Accept
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleRejectFriendRequest(request)}
                                                            className="flex-1"
                                                        >
                                                            <XCircle className="w-4 h-4 mr-2" />
                                                            Reject
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            )
                                        })
                                    )}
                                </TabsContent>
                            </div>
                        </Tabs>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

