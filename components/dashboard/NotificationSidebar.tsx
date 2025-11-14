"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Bell, UserPlus, Users, Users2, Clock, CheckCircle, XCircle, UserCheck, Mail, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { getInstructorInvitations, InstructorInvitation } from "@/integrations/strapi/instructor-invitation"
import { getInstructors, Instructor } from "@/integrations/strapi/instructor"
import { strapiPublic } from "@/integrations/strapi/client"
import { getPendingFriendRequests, acceptFriendRequest, rejectFriendRequest, FriendRequest } from "@/integrations/strapi/friend-request"
import { toast } from "sonner"
import { QuantumAvatar } from "@/components/ui/quantum-avatar"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import {
    getGroupInvitationsForUser,
    acceptGroupInvitation,
    rejectGroupInvitation,
    GroupInvitation,
} from "@/integrations/strapi/group-invitation"
import { getUsersByIdentifiers } from "@/integrations/strapi/user"

const extractNumericId = (value: any): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && /^\d+$/.test(value)) return Number(value)
    return undefined
}

interface NotificationSidebarProps {
    isOpen: boolean
    onClose: () => void
}

export function NotificationSidebar({ isOpen, onClose }: NotificationSidebarProps) {
    const { user } = useAuth()
    const [instructorInvitations, setInstructorInvitations] = useState<InstructorInvitation[]>([])
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
    const [groupInvitations, setGroupInvitations] = useState<GroupInvitation[]>([])
    const [loading, setLoading] = useState(false)
    const [instructorCache, setInstructorCache] = useState<Map<number | string, Instructor>>(new Map())
    const [groupProcessingId, setGroupProcessingId] = useState<string | number | null>(null)

    useEffect(() => {
        if (isOpen && user?.id) {
            loadNotifications()
        }
    }, [isOpen, user?.id])

    const normalizeUserRelation = useCallback((relation: any) => {
        if (!relation) return relation
        if (relation.data) return relation.data
        if (relation.attributes) {
            return {
                id: relation.id ?? relation.attributes?.id,
                documentId: relation.attributes?.documentId ?? relation.attributes?.document_id,
                ...relation.attributes,
            }
        }
        return relation
    }, [])

    const hydrateGroupInvitationUsers = useCallback(
        async (invitations: GroupInvitation[]): Promise<GroupInvitation[]> => {
            if (!invitations || invitations.length === 0) return invitations

            const targets: Array<{ id?: number | string | null; documentId?: string | null }> = []
            const pushTarget = (entity: any) => {
                const normalized = normalizeUserRelation(entity)
                if (!normalized) return
                const numericId =
                    typeof normalized?.id === "number"
                        ? normalized.id
                        : typeof normalized?.id === "string" && /^\d+$/.test(normalized.id)
                        ? Number(normalized.id)
                        : undefined
                const documentId =
                    normalized?.documentId ?? normalized?.document_id ?? (typeof normalized === "string" ? normalized : undefined)
                if (numericId === undefined && !documentId) return
                targets.push({ id: numericId ?? null, documentId: documentId ?? null })
            }

            invitations.forEach((invitation) => {
                pushTarget(invitation.from_user)
                pushTarget(invitation.to_user)
            })

            if (targets.length === 0) return invitations

            try {
                const profiles = await getUsersByIdentifiers(targets)
                const byId = new Map<number, any>()
                const byDoc = new Map<string, any>()
                profiles.forEach((profile) => {
                    const numericId =
                        typeof profile?.id === "number"
                            ? profile.id
                            : typeof profile?.id === "string" && /^\d+$/.test(profile.id)
                            ? Number(profile.id)
                            : undefined
                    if (numericId !== undefined) {
                        byId.set(numericId, profile)
                    }
                    if (profile?.documentId) {
                        byDoc.set(String(profile.documentId), profile)
                    }
                })

                const mergeProfile = (entity: any) => {
                    const normalized = normalizeUserRelation(entity)
                    if (!normalized) return entity
                    const numericId =
                        typeof normalized?.id === "number"
                            ? normalized.id
                            : typeof normalized?.id === "string" && /^\d+$/.test(normalized.id)
                            ? Number(normalized.id)
                            : undefined
                    const documentId = normalized?.documentId ?? normalized?.document_id
                    const profile =
                        (numericId !== undefined ? byId.get(numericId) : undefined) ||
                        (documentId ? byDoc.get(String(documentId)) : undefined)
                    if (!profile) return normalized
                    return {
                        ...normalized,
                        ...profile,
                        avatar: profile.avatar ?? normalized.avatar,
                    }
                }

                return invitations.map((invitation) => ({
                    ...invitation,
                    from_user: mergeProfile(invitation.from_user),
                    to_user: mergeProfile(invitation.to_user),
                }))
            } catch (error) {
                console.warn("Failed to hydrate group invitation users:", error)
                return invitations
            }
        },
        [normalizeUserRelation]
    )

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

            // Load group invitations
            const pendingGroupInvites = await getGroupInvitationsForUser(user.id)
            const filteredGroupInvites = pendingGroupInvites.filter((invite) => invite.request_status === "pending")
            const hydratedGroupInvites = await hydrateGroupInvitationUsers(filteredGroupInvites)
            hydratedGroupInvites.sort((a, b) => {
                const aDate = new Date(a.invited_at ?? a.createdAt ?? 0).getTime()
                const bDate = new Date(b.invited_at ?? b.createdAt ?? 0).getTime()
                return bDate - aDate
            })
            setGroupInvitations(hydratedGroupInvites)
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

            await acceptFriendRequest(request.documentId || request.id, fromUserId, user.id)
            toast.success("Friend request accepted!")
            
            // Reload notifications
            await loadNotifications()
        } catch (error: any) {
            toast.error(error.message || "Failed to accept friend request")
        }
    }

    const handleRejectFriendRequest = async (request: FriendRequest) => {
        try {
            await rejectFriendRequest(request.documentId || request.id)
            toast.success("Friend request rejected")
            
            // Reload notifications
            await loadNotifications()
        } catch (error: any) {
            toast.error(error.message || "Failed to reject friend request")
        }
    }

    const pendingInstructorCount = instructorInvitations.filter(inv => inv.invitation_status === 'pending').length
    const pendingFriendCount = friendRequests.filter(req => req.friend_status === 'pending').length
    const pendingGroupCount = groupInvitations.filter((invite) => invite.request_status === "pending").length
    const totalPending = pendingInstructorCount + pendingFriendCount + pendingGroupCount

    const handleAcceptGroupInvitation = async (invitation: GroupInvitation) => {
        const invitationKey = invitation.documentId ?? invitation.id
        if (!invitationKey) return
        const groupEntity = invitation.user_group_group?.data ?? invitation.user_group_group ?? null
        const groupDocumentId =
            typeof groupEntity === "object" ? groupEntity.documentId || groupEntity.document_id : undefined
        const groupNumericId =
            typeof groupEntity === "object" ? groupEntity.id ?? extractNumericId(groupEntity) : extractNumericId(groupEntity)
        setGroupProcessingId(`accept-${invitationKey}`)
        try {
            await acceptGroupInvitation(String(invitationKey))
            toast.success("Group invitation accepted")
            setGroupInvitations((prev) =>
                prev.filter((item) => (item.documentId ?? item.id) !== invitationKey)
            )
            if (typeof window !== "undefined") {
                window.dispatchEvent(
                    new CustomEvent("dashboard:user-group-accepted", {
                        detail: {
                            groupDocumentId: groupDocumentId ?? null,
                            groupNumericId:
                                typeof groupNumericId === "number" && Number.isFinite(groupNumericId)
                                    ? Number(groupNumericId)
                                    : null,
                        },
                    })
                )
            }
            await loadNotifications()
        } catch (error: any) {
            toast.error(error?.message || "Failed to accept invitation")
        } finally {
            setGroupProcessingId(null)
        }
    }

    const handleRejectGroupInvitation = async (invitation: GroupInvitation) => {
        const invitationKey = invitation.documentId ?? invitation.id
        if (!invitationKey) return
        setGroupProcessingId(`reject-${invitationKey}`)
        try {
            await rejectGroupInvitation(String(invitationKey))
            toast.success("Invitation declined")
            await loadNotifications()
        } catch (error: any) {
            toast.error(error?.message || "Failed to decline invitation")
        } finally {
            setGroupProcessingId(null)
        }
    }

    const combinedNotifications = useMemo(() => {
        const items: Array<{
            key: string
            type: "instructor" | "friend" | "group"
            timestamp: number
            data: InstructorInvitation | FriendRequest | GroupInvitation
        }> = []

        instructorInvitations.forEach((invitation) => {
            const time = new Date(invitation.invited_at ?? invitation.createdAt ?? Date.now()).getTime()
            items.push({
                key: `instructor-${invitation.id}`,
                type: "instructor",
                timestamp: time,
                data: invitation,
            })
        })

        friendRequests.forEach((request) => {
            const time = new Date(request.requested_at ?? request.createdAt ?? Date.now()).getTime()
            items.push({
                key: `friend-${request.id}`,
                type: "friend",
                timestamp: time,
                data: request,
            })
        })

        groupInvitations.forEach((invitation) => {
            const time = new Date(invitation.invited_at ?? invitation.createdAt ?? Date.now()).getTime()
            items.push({
                key: `group-${invitation.documentId ?? invitation.id}`,
                type: "group",
                timestamp: time,
                data: invitation,
            })
        })

        return items.sort((a, b) => b.timestamp - a.timestamp)
    }, [friendRequests, groupInvitations, instructorInvitations])

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
                                    {totalPending > 0 ? (
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-primary text-white border-primary/20 shadow-sm">
                                                {totalPending > 99 ? "99+" : totalPending} new
                                            </Badge>
                                            <p className="text-xs text-muted-foreground">
                                                {totalPending === 1 ? "Awaiting your response" : "Awaiting your responses"}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            You're all caught up
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

                            <div className="flex-1 overflow-y-auto scrollbar-hide">
                                    {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                </div>
                            ) : combinedNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-center text-muted-foreground">
                                    <Bell className="w-10 h-10 text-muted-foreground/40" />
                                    <div>
                                        <p className="font-semibold text-foreground">You're all caught up!</p>
                                        <p className="text-sm text-muted-foreground">
                                            Invitations and requests will appear here.
                                        </p>
                                        </div>
                                        </div>
                                    ) : (
                                <div className="space-y-3 p-6">
                                    {combinedNotifications.map((item) => {
                                        if (item.type === "instructor") {
                                            const invitation = item.data as InstructorInvitation
                                            const fromUser = invitation.from_user
                                            const userId = fromUser ? (typeof fromUser === "object" ? fromUser.id : fromUser) : null
                                            const fromInstructor = userId ? instructorCache.get(userId) : null
                                            return (
                                                <motion.div
                                                    key={item.key}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4 hover:border-primary/40 transition-all"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="relative">
                                                        <QuantumAvatar
                                                            src={getAvatarUrl(fromInstructor?.avatar)}
                                                            alt={fromInstructor?.name || "Instructor"}
                                                            size="md"
                                                            variant="quantum"
                                                            verified={fromInstructor?.is_verified}
                                                        />
                                                            <span className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white shadow">
                                                                <Users2 className="w-3 h-3" />
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold text-foreground">
                                                                    {fromInstructor?.name || "Unknown Instructor"}
                                                                </p>
                                                                <Badge variant="outline" className="text-xs">
                                                                    Instructor invite
                                                                </Badge>
                                                            </div>
                                                        {invitation.message && (
                                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                                {invitation.message}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Clock className="w-3 h-3" />
                                                                {item.timestamp ? new Date(item.timestamp).toLocaleString() : "Recently"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                            )
                                        }

                                        if (item.type === "friend") {
                                            const request = item.data as FriendRequest
                                            const fromUser = typeof request.from_user === "object" ? request.from_user : null
                                            return (
                                                <motion.div
                                                    key={item.key}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4 hover:border-primary/40 transition-all"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="relative">
                                                        <QuantumAvatar
                                                            src={getAvatarUrl(fromUser?.avatar)}
                                                            alt={fromUser?.username || "User"}
                                                            size="md"
                                                            variant="quantum"
                                                        />
                                                            <span className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white shadow">
                                                                <UserPlus className="w-3 h-3" />
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-foreground">
                                                                    {fromUser?.username || fromUser?.email || "Unknown user"}
                                                            </p>
                                                                <Badge variant="outline" className="text-xs">
                                                                    Friend request
                                                                </Badge>
                                                            </div>
                                                            {request.message && (
                                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                                    {request.message}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <Clock className="w-3 h-3" />
                                                                {item.timestamp ? new Date(item.timestamp).toLocaleString() : "Recently"}
                                                            </div>
                                                            <div className="flex gap-2 pt-2">
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
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )
                                        }

                                        const invitation = item.data as GroupInvitation
                                        const inviter = normalizeUserRelation(invitation.from_user)
                                        const groupRecord =
                                            invitation.user_group_group?.data ?? invitation.user_group_group ?? {}
                                        const groupAttributes = groupRecord?.attributes ?? groupRecord ?? {}
                                        const groupName = groupAttributes?.name ?? "Untitled group"
                                        const isPrivate = Boolean(
                                            groupAttributes?.private ??
                                                groupAttributes?.is_private ??
                                                groupAttributes?.isPrivate
                                        )
                                        const invitationKey = invitation.documentId ?? invitation.id
                                        const processingAccept = groupProcessingId === `accept-${invitationKey}`
                                        const processingDecline = groupProcessingId === `reject-${invitationKey}`

                                        return (
                                            <motion.div
                                                key={item.key}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4 hover:border-primary/40 transition-all"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="relative">
                                                        <QuantumAvatar
                                                            src={getAvatarUrl(inviter?.avatar)}
                                                            alt={inviter?.username || inviter?.email || "Inviter"}
                                                            size="md"
                                                            variant="quantum"
                                                        />
                                                        <span className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-semibold text-white shadow">
                                                            <Users className="w-3 h-3" />
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-2">
                                                        <div>
                                                            <p className="font-semibold text-foreground">
                                                                {inviter?.username || inviter?.email || "Someone"} invited you
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Group • <span className="font-medium text-foreground">{groupName}</span>
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    isPrivate
                                                                        ? "bg-primary/10 text-primary border-primary/20"
                                                                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                                }
                                                            >
                                                                {isPrivate ? "Private group" : "Public group"}
                                                            </Badge>
                                                            {invitation.invited_at && (
                                                                <Badge variant="outline" className="border-border/60 text-xs">
                                                                    Invited {new Date(invitation.invited_at).toLocaleString()}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2 pt-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleAcceptGroupInvitation(invitation)}
                                                                disabled={processingAccept || processingDecline}
                                                                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                                                            >
                                                                {processingAccept ? (
                                                                    <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                                        Accept invite
                                                                    </>
                                                                )}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleRejectGroupInvitation(invitation)}
                                                                disabled={processingAccept || processingDecline}
                                                                className="flex-1"
                                                            >
                                                                {processingDecline ? (
                                                                    <div className="w-4 h-4 border-2 border-muted-foreground/60 border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <XCircle className="w-4 h-4 mr-2" />
                                                                        Decline
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            )}
                            </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

