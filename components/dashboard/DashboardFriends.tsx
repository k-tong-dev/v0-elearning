"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
    getUserFriendsPaginated,
    getFriendRequestsPaginated,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    unfriendUser,
    getUsersWithFriendshipContext,
    FriendRequest
} from "@/integrations/strapi/friend-request"
import {
    getUserGroupsForUserPaginated,
    updateGroupName,
    createUserGroup,
    addUsersToGroup,
    removeUserFromGroup,
    deleteUserGroup,
    leaveUserGroup,
    updateUserGroupPrivacy,
    getUserGroup,
    InstructorGroup,
} from "@/integrations/strapi/instructor-group"
import { getUsersByIdentifiers, StrapiUserProfile } from "@/integrations/strapi/user"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { QuantumAvatar } from "@/components/ui/quantum-avatar"
import { EnhancedAvatar } from "@/components/ui/enhanced-avatar"
import defaultAvatar from "@/public/avatars/robotic.png"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import { 
    UserPlus, 
    UserMinus, 
    Search, 
    Users, 
    Clock, 
    CheckCircle, 
    XCircle, 
    Loader2, 
    ExternalLink,
    AlertCircle,
    Crown,
    Sparkles,
    X,
    PlusCircle,
    MoreVertical,
    Trash2,
    LogOut,
    Shield,
    Lock,
    Users2,
    Edit3, ArrowLeft,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/utils/utils"
import { InviteFriendsToGroupModal } from "./InviteFriendsToGroupModal"
import {
    sendGroupInvitation,
    checkExistingGroupInvitation,
    userHasCapacityForMoreGroups,
    getGroupInvitationsForUser,
    getGroupInvitationsSentByUser,
    acceptGroupInvitation,
    rejectGroupInvitation,
    GroupInvitation,
} from "@/integrations/strapi/group-invitation"

const DEFAULT_FRIEND_LIMIT = 1000;
const PAGE_SIZE = 10;
const DEFAULT_USER_GROUP_LIMIT = 5;
const DEFAULT_USER_GROUP_MEMBER_LIMIT = 25;

type ListState<T> = {
    items: T[]
    page: number
    hasMore: boolean
    loading: boolean
    initialLoading: boolean
    total: number
    currentQuery: string
}

type InviteCandidate = {
    id: number
    name: string
    email?: string
    bio?: string
    avatar?: string | null
    documentId?: string | null
    groupLimit?: number | null
}

type ParticipantEntry = {
    key: string
    id?: number
    name: string
    role: "Owner" | "Member"
    email?: string
    bio?: string
    avatar?: string
    initials: string
    profileId?: number | string
    canRemove: boolean
    onRemove: () => void
    disableRemoval: boolean
}

const extractNumericId = (value: any): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
    return undefined;
}

const extractDocumentId = (value: any): string | undefined => {
    if (!value) return undefined;
    if (typeof value === "string" && !/^\d+$/.test(value)) return value;
    if (typeof value === "object") {
        if (typeof value.documentId === "string") return value.documentId;
        if (typeof value.document_id === "string") return value.document_id;
        if (typeof value.attributes?.documentId === "string") return value.attributes.documentId;
    }
    return undefined;
}

const getInitials = (value?: string | null) => {
    if (!value) return "U"
    const words = value
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    return words || value.slice(0, 2).toUpperCase()
}

const buildProfileKey = (id?: number | null, documentId?: string | null) => {
    if (id !== undefined && id !== null) return `id:${id}`
    if (documentId) return `doc:${documentId}`
    return null
}

const buildProfileLookup = (profiles: StrapiUserProfile[]) => {
    const byId: Record<number, StrapiUserProfile> = {}
    const byDoc: Record<string, StrapiUserProfile> = {}

    profiles.forEach((profile) => {
        if (profile.id !== undefined && profile.id !== null) {
            byId[Number(profile.id)] = profile
        }
        if (profile.documentId) {
            byDoc[String(profile.documentId)] = profile
        }
    })

    return { byId, byDoc }
}

type CandidateStatus = "available" | "friend" | "incoming" | "outgoing" | "self";

const STATUS_META: Record<CandidateStatus, { label: string; badgeClass: string; description?: string }> = {
    available: {
        label: "New connection",
        badgeClass: "bg-primary/10 text-primary border-primary/20",
        description: "Invite this learner to join your circle.",
    },
    friend: {
        label: "Friends",
        badgeClass: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
        description: "Already connected with you.",
    },
    incoming: {
        label: "Respond waiting",
        badgeClass: "bg-amber-500/15 text-amber-500 border-amber-500/20",
        description: "They've sent you a request. Check the Requests tab.",
    },
    outgoing: {
        label: "Pending",
        badgeClass: "bg-blue-500/15 text-blue-500 border-blue-500/20",
        description: "Awaiting their response.",
    },
    self: {
        label: "That's you",
        badgeClass: "bg-muted text-muted-foreground border-transparent",
        description: "This is your profile.",
    },
}

function createInitialState<T>(): ListState<T> {
    return {
        items: [],
        page: 1,
        hasMore: true,
        loading: false,
        initialLoading: false,
        total: 0,
        currentQuery: "",
    }
}

function createSearchState(): ListState<any> {
    return {
        items: [],
        page: 1,
        hasMore: true,
        loading: false,
        initialLoading: true,
        total: 0,
        currentQuery: "",
    }
}

const parsePositiveInteger = (value: unknown, fallback: number): number => {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.floor(value)
    if (typeof value === "string" && /^\d+$/.test(value)) {
        const parsed = Number(value)
        if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed)
    }
    return fallback
}

export function DashboardFriends() {
    const { user } = useAuth()
    const router = useRouter()
    const friendLimit = user?.friend_limit && user.friend_limit > 0 ? user.friend_limit : DEFAULT_FRIEND_LIMIT
    const [activeTab, setActiveTab] = useState("friends")
    const [friendsState, setFriendsState] = useState<ListState<any>>(createInitialState())
    const [receivedState, setReceivedState] = useState<ListState<FriendRequest>>(createInitialState())
    const [sentState, setSentState] = useState<ListState<FriendRequest>>(createInitialState())
    const [userGroupsState, setUserGroupsState] = useState<ListState<InstructorGroup>>(createInitialState())
    const [searchDraft, setSearchDraft] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState("")
    const [searchState, setSearchState] = useState<ListState<any>>(createSearchState)
    const [recentSearches, setRecentSearches] = useState<string[]>([])
    const [processingId, setProcessingId] = useState<string | number | null>(null)
    const [isSearchViewOpen, setIsSearchViewOpen] = useState(false)
    const [activeIndicator, setActiveIndicator] = useState<string | null>(null)
    const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false)
    const [newGroupName, setNewGroupName] = useState("")
    const [newGroupPrivate, setNewGroupPrivate] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState<InstructorGroup | null>(null)
    const [groupViewMode, setGroupViewMode] = useState<"list" | "detail">("list")
    const [groupProcessingId, setGroupProcessingId] = useState<string | number | null>(null)
    const [groupActionLoading, setGroupActionLoading] = useState(false)
    const [isCreatingGroup, setIsCreatingGroup] = useState(false)
    const [isRenameGroupDialogOpen, setIsRenameGroupDialogOpen] = useState(false)
    const [renameGroupTarget, setRenameGroupTarget] = useState<InstructorGroup | null>(null)
    const [renameGroupValue, setRenameGroupValue] = useState("")
    const [isRenamingGroup, setIsRenamingGroup] = useState(false)
    const [isInviteFriendsModalOpen, setIsInviteFriendsModalOpen] = useState(false)
    const [memberProfiles, setMemberProfiles] = useState<Record<string, StrapiUserProfile>>({})
    const [groupProfileMap, setGroupProfileMap] = useState<{ byId: Record<number, StrapiUserProfile>; byDoc: Record<string, StrapiUserProfile> }>({ byId: {}, byDoc: {} })
    const [friendProfileMap, setFriendProfileMap] = useState<{ byId: Record<number, StrapiUserProfile>; byDoc: Record<string, StrapiUserProfile> }>({ byId: {}, byDoc: {} })
    const [groupReceivedInvitesState, setGroupReceivedInvitesState] = useState<ListState<GroupInvitation>>(createInitialState())
    const [groupSentInvitesState, setGroupSentInvitesState] = useState<ListState<GroupInvitation>>(createInitialState())
    const [groupInvitationProcessingId, setGroupInvitationProcessingId] = useState<string | number | null>(null)
    const [candidateCapacity, setCandidateCapacity] = useState<Record<number, { loading?: boolean; total?: number }>>({})

    const friendsEndRef = useRef<HTMLDivElement | null>(null)
    const receivedEndRef = useRef<HTMLDivElement | null>(null)
    const sentEndRef = useRef<HTMLDivElement | null>(null)
    const groupsEndRef = useRef<HTMLDivElement | null>(null)
    const searchEndRef = useRef<HTMLDivElement | null>(null)
    const friendProfilesKeyRef = useRef<string>("")
    const groupProfilesKeyRef = useRef<string>("")
    const activeSearchRef = useRef("")
    const pendingProfileFetchRef = useRef(false)

    const currentUserNumericId = React.useMemo(() => extractNumericId(user?.id), [user?.id])
    const currentUserDocId = React.useMemo(() => extractDocumentId(user), [user])

    const userGroupMemberLimit = React.useMemo(() => {
        return parsePositiveInteger((user as any)?.user_group_member_limit, DEFAULT_USER_GROUP_MEMBER_LIMIT)
    }, [user])

    const resetRenameDialog = useCallback(() => {
        setRenameGroupTarget(null)
        setRenameGroupValue("")
        setIsRenamingGroup(false)
        setIsRenameGroupDialogOpen(false)
    }, [])

    const resetStates = useCallback(() => {
        setFriendsState(createInitialState())
        setReceivedState(createInitialState())
        setSentState(createInitialState())
        setUserGroupsState(createInitialState())
        setGroupReceivedInvitesState(createInitialState())
        setGroupSentInvitesState(createInitialState())
        setGroupInvitationProcessingId(null)
        setSelectedGroup(null)
        setGroupViewMode("list")
        setIsInviteFriendsModalOpen(false)
        setCandidateCapacity({})
        resetRenameDialog()
    }, [resetRenameDialog])

    const resetGroupForm = useCallback(() => {
        setNewGroupName("")
        setNewGroupPrivate(false)
    }, [])

    const refreshSelectedGroup = useCallback(async (groupId?: string | number) => {
        if (groupId === undefined || groupId === null) return

        let resolvedIdentifier: string | number | undefined = groupId
        const numericCandidate = extractNumericId(groupId)

        if (numericCandidate !== undefined) {
            resolvedIdentifier = numericCandidate
        } else if (typeof groupId === "string") {
            const matchingGroup = userGroupsState.items.find((group) => {
                const docId = (group as any)?.documentId || (group as any)?.document_id
                return docId && docId === groupId
            })
            const matchingNumeric = extractNumericId(matchingGroup?.id ?? (matchingGroup as any)?.id)
            if (matchingNumeric !== undefined) {
                resolvedIdentifier = matchingNumeric
            }
        }

        if (resolvedIdentifier === undefined || resolvedIdentifier === null) return

        try {
            const latest = await getUserGroup(resolvedIdentifier)
            if (latest) {
                const normalizeRecord = (record: any) => record?.data?.attributes ?? record?.attributes ?? record
                const identifiers: Array<{ id?: number | string | null; documentId?: string | null }> = []

                const collectIdentifiers = (entity: any) => {
                    const normalized = normalizeRecord(entity)
                    const id = extractNumericId(normalized?.id ?? entity?.id ?? entity)
                    const documentId = extractDocumentId(normalized) ?? extractDocumentId(entity)
                    const hasAvatar = !!getAvatarUrl(normalized?.avatar)
                    if (!hasAvatar && (id !== undefined || documentId)) {
                        identifiers.push({ id, documentId })
                    }
                }

                if (latest.owner) {
                    collectIdentifiers(latest.owner)
                }
                if (Array.isArray(latest.users)) {
                    latest.users.forEach(collectIdentifiers)
                }

                let profileMap = new Map<string, any>()
                if (identifiers.length > 0) {
                    try {
                        const profiles = await getUsersByIdentifiers(identifiers)
                        profiles.forEach((profile) => {
                            if (profile.id !== undefined && profile.id !== null) {
                                profileMap.set(`id:${profile.id}`, profile)
                            }
                            if (profile.documentId) {
                                profileMap.set(`doc:${profile.documentId}`, profile)
                            }
                        })
                    } catch (profileError) {
                        console.warn("Failed to hydrate user avatars:", profileError)
                    }
                }

                const mergeProfile = (entity: any) => {
                    if (!entity) return entity
                    const normalized = normalizeRecord(entity)
                    const id = extractNumericId(normalized?.id ?? entity?.id ?? entity)
                    const documentId = extractDocumentId(normalized) ?? extractDocumentId(entity)
                    const profile = (id !== undefined ? profileMap.get(`id:${id}`) : undefined) ||
                        (documentId ? profileMap.get(`doc:${documentId}`) : undefined)
                    if (!profile) return normalized ?? entity
                    return {
                        ...normalized,
                        ...profile,
                        avatar: profile.avatar ?? normalized?.avatar,
                    }
                }

                if (latest.owner) {
                    latest.owner = mergeProfile(latest.owner)
                }
                if (Array.isArray(latest.users)) {
                    latest.users = latest.users.map((member: any) => mergeProfile(member))
                }

                setSelectedGroup(latest)
                const latestDocumentId = (latest as any)?.documentId ?? (latest as any)?.document_id
                const latestNumericId = extractNumericId((latest as any)?.id ?? latest)
                setUserGroupsState((prev) => ({
                    ...prev,
                    items: prev.items.map((item) => {
                        const itemDoc = (item as any)?.documentId ?? (item as any)?.document_id
                        const itemNumeric = extractNumericId((item as any)?.id ?? item)
                        const docMatch = latestDocumentId && itemDoc && String(itemDoc) === String(latestDocumentId)
                        const idMatch =
                            latestNumericId !== undefined &&
                            itemNumeric !== undefined &&
                            Number(itemNumeric) === Number(latestNumericId)
                        return docMatch || idMatch ? { ...item, ...latest } : item
                    }),
                }))
            }
        } catch (error: any) {
            console.error("Error refreshing group:", error?.response?.data || error.message || error)
        }
    }, [userGroupsState.items])

    const fetchFriends = useCallback(
        async (page = 1) => {
        if (!user?.id) return
            setFriendsState(prev => ({
                ...prev,
                loading: true,
                initialLoading: page === 1 && prev.items.length === 0,
            }))
            try {
                const result = await getUserFriendsPaginated(user.id, page, PAGE_SIZE)
                setFriendsState(prev => {
                    const existingIds = new Set(prev.items.map((item: any) => item.id))
                    const newItems = result.data.filter((item: any) => !existingIds.has(item.id))
                    const items = page === 1 ? result.data : [...prev.items, ...newItems]
                    return {
                        items,
                        page: result.hasMore ? result.pagination.page + 1 : result.pagination.page,
                        hasMore: result.hasMore,
                        loading: false,
                        initialLoading: false,
                        total: result.pagination.total,
                        currentQuery: prev.currentQuery,
                    }
                })
            } catch (error) {
                console.error("Error loading friends:", error)
                setFriendsState(prev => ({
                    ...prev,
                    loading: false,
                    initialLoading: false,
                }))
            }
        },
        [user?.id]
    )

    const fetchReceived = useCallback(
        async (page = 1) => {
            if (!user?.id) return
            setReceivedState(prev => ({
                ...prev,
                loading: true,
                initialLoading: page === 1 && prev.items.length === 0,
            }))
            try {
                const result = await getFriendRequestsPaginated(user.id, "received", {
                    page,
                    pageSize: PAGE_SIZE,
                    status: "pending",
                })
                setReceivedState(prev => {
                    const existingIds = new Set(prev.items.map(item => item.id))
                    const newItems = result.data.filter(item => !existingIds.has(item.id))
                    const items = page === 1 ? result.data : [...prev.items, ...newItems]
                    return {
                        items,
                        page: result.hasMore ? result.pagination.page + 1 : result.pagination.page,
                        hasMore: result.hasMore,
                        loading: false,
                        initialLoading: false,
                        total: result.pagination.total,
                        currentQuery: prev.currentQuery,
                    }
                })
            } catch (error) {
                console.error("Error loading received friend requests:", error)
                setReceivedState(prev => ({
                    ...prev,
                    loading: false,
                    initialLoading: false,
                }))
            }
        },
        [user?.id]
    )

    const fetchSent = useCallback(
        async (page = 1) => {
            if (!user?.id) return
            setSentState(prev => ({
                ...prev,
                loading: true,
                initialLoading: page === 1 && prev.items.length === 0,
            }))
            try {
                const result = await getFriendRequestsPaginated(user.id, "sent", {
                    page,
                    pageSize: PAGE_SIZE,
                    status: "pending",
                })
                setSentState(prev => {
                    const existingIds = new Set(prev.items.map(item => item.id))
                    const newItems = result.data.filter(item => !existingIds.has(item.id))
                    const items = page === 1 ? result.data : [...prev.items, ...newItems]
                    return {
                        items,
                        page: result.hasMore ? result.pagination.page + 1 : result.pagination.page,
                        hasMore: result.hasMore,
                        loading: false,
                        initialLoading: false,
                        total: result.pagination.total,
                        currentQuery: prev.currentQuery,
                    }
                })
        } catch (error) {
                console.error("Error loading sent friend requests:", error)
                setSentState(prev => ({
                    ...prev,
                    loading: false,
                    initialLoading: false,
                }))
            }
        },
        [user?.id]
    )

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

    const hydrateInvitationUsers = useCallback(
        async (invitations: GroupInvitation[]): Promise<GroupInvitation[]> => {
            if (!invitations || invitations.length === 0) return invitations

            const targets: Array<{ id?: number | string | null; documentId?: string | null }> = []
            const pushTarget = (id?: number | string | null, documentId?: string | null) => {
                if (id === undefined && !documentId) return
                targets.push({ id: id ?? null, documentId: documentId ?? null })
            }

            invitations.forEach((invitation) => {
                const fromUser = normalizeUserRelation(invitation.from_user)
                const toUser = normalizeUserRelation(invitation.to_user)
                pushTarget(fromUser?.id, fromUser?.documentId ?? fromUser?.document_id ?? null)
                pushTarget(toUser?.id, toUser?.documentId ?? toUser?.document_id ?? null)
            })

            if (targets.length === 0) return invitations

            try {
                const profiles = await getUsersByIdentifiers(targets)
                if (!profiles || profiles.length === 0) return invitations

                const profileById = new Map<number, any>()
                const profileByDoc = new Map<string, any>()

                profiles.forEach((profile) => {
                    const numericId = extractNumericId(profile?.id ?? profile)
                    if (numericId !== undefined) {
                        profileById.set(Number(numericId), profile)
                    }
                    if (profile?.documentId) {
                        profileByDoc.set(String(profile.documentId), profile)
                    }
                })

                const mergeProfile = (entity: any) => {
                    const normalized = normalizeUserRelation(entity)
                    if (!normalized) return entity
                    const numericId = extractNumericId(normalized?.id ?? normalized)
                    const docId = normalized?.documentId ?? normalized?.document_id
                    const profile =
                        (numericId !== undefined ? profileById.get(Number(numericId)) : undefined) ||
                        (docId ? profileByDoc.get(String(docId)) : undefined)
                    if (!profile) return normalized
                    return {
                        ...normalized,
                        ...profile,
                        avatar: profile.avatar ?? normalized.avatar,
                    }
                }

                return invitations.map((invitation) => {
                    return {
                        ...invitation,
                        from_user: mergeProfile(invitation.from_user),
                        to_user: mergeProfile(invitation.to_user),
                    }
                })
            } catch (error) {
                console.warn("Failed to hydrate invitation users:", error)
                return invitations
            }
        },
        [normalizeUserRelation]
    )

    const fetchGroupReceivedInvites = useCallback(async () => {
        if (!user?.id) return
        setGroupReceivedInvitesState((prev) => ({
            ...prev,
            loading: true,
            initialLoading: prev.items.length === 0,
        }))
        try {
            const invitations = await getGroupInvitationsForUser(user.id)
            const hydrated = await hydrateInvitationUsers(invitations)
            const sorted = [...hydrated].sort((a, b) => {
                const aDate = new Date(a.invited_at ?? a.createdAt ?? 0).getTime()
                const bDate = new Date(b.invited_at ?? b.createdAt ?? 0).getTime()
                return bDate - aDate
            })
            setGroupReceivedInvitesState({
                items: sorted,
                page: 1,
                hasMore: false,
                loading: false,
                initialLoading: false,
                total: sorted.length,
                currentQuery: "",
            })
        } catch (error) {
            console.error("Error loading group invitations (received):", error)
            setGroupReceivedInvitesState((prev) => ({
                ...prev,
                loading: false,
                initialLoading: false,
            }))
        }
    }, [user?.id, hydrateInvitationUsers])

    const fetchGroupSentInvites = useCallback(async () => {
        if (!user?.id) return
        setGroupSentInvitesState((prev) => ({
            ...prev,
            loading: true,
            initialLoading: prev.items.length === 0,
        }))
        try {
            const invitations = await getGroupInvitationsSentByUser(user.id)
            const hydrated = await hydrateInvitationUsers(invitations)
            const sorted = [...hydrated].sort((a, b) => {
                const aDate = new Date(a.invited_at ?? a.createdAt ?? 0).getTime()
                const bDate = new Date(b.invited_at ?? b.createdAt ?? 0).getTime()
                return bDate - aDate
            })
            setGroupSentInvitesState({
                items: sorted,
                page: 1,
                hasMore: false,
                loading: false,
                initialLoading: false,
                total: sorted.length,
                currentQuery: "",
            })
        } catch (error) {
            console.error("Error loading group invitations (sent):", error)
            setGroupSentInvitesState((prev) => ({
                ...prev,
                loading: false,
                initialLoading: false,
            }))
        }
    }, [user?.id, hydrateInvitationUsers])

    const friendSets = React.useMemo(() => {
        const numeric = new Set<number>()
        const doc = new Set<string>()
        friendsState.items.forEach((friend: any) => {
            const numericId = extractNumericId(friend?.id ?? friend)
            if (numericId !== undefined) numeric.add(numericId)
            const docId = extractDocumentId(friend)
            if (docId) doc.add(docId)
        })
        return { numeric, doc }
    }, [friendsState.items])

    const pendingOutgoingSets = React.useMemo(() => {
        const numeric = new Set<number>()
        const doc = new Set<string>()
        sentState.items.forEach((request) => {
            const target = request.to_user as any
            const numericId = extractNumericId(target?.id ?? target)
            if (numericId !== undefined) numeric.add(numericId)
            const docId = extractDocumentId(target)
            if (docId) doc.add(docId)
        })
        groupSentInvitesState.items.forEach((invite) => {
            const targetRaw = normalizeUserRelation(invite.to_user)
            const numericId = extractNumericId(targetRaw?.id ?? targetRaw)
            if (numericId !== undefined) numeric.add(numericId)
            const docId = extractDocumentId(targetRaw)
            if (docId) doc.add(docId)
        })
        return { numeric, doc }
    }, [sentState.items, groupSentInvitesState.items, normalizeUserRelation])

    const pendingIncomingSets = React.useMemo(() => {
        const numeric = new Set<number>()
        const doc = new Set<string>()
        receivedState.items.forEach((request) => {
            const source = request.from_user as any
            const numericId = extractNumericId(source?.id ?? source)
            if (numericId !== undefined) numeric.add(numericId)
            const docId = extractDocumentId(source)
            if (docId) doc.add(docId)
        })
        groupReceivedInvitesState.items.forEach((invite) => {
            const sourceRaw = normalizeUserRelation(invite.from_user)
            const numericId = extractNumericId(sourceRaw?.id ?? sourceRaw)
            if (numericId !== undefined) numeric.add(numericId)
            const docId = extractDocumentId(sourceRaw)
            if (docId) doc.add(docId)
        })
        return { numeric, doc }
    }, [receivedState.items, groupReceivedInvitesState.items, normalizeUserRelation])

    const pendingGroupInviteIds = React.useMemo(() => {
        const ids = new Set<number>()
        groupSentInvitesState.items.forEach((invite) => {
            const targetRaw = normalizeUserRelation(invite.to_user)
            const numericId = extractNumericId(targetRaw?.id ?? targetRaw)
            if (numericId !== undefined) ids.add(numericId)
        })
        return ids
    }, [groupSentInvitesState.items, normalizeUserRelation])

    const fetchUserGroups = useCallback(
        async (page = 1) => {
            if (!user?.id) return
            setUserGroupsState(prev => ({
                ...prev,
                loading: true,
                initialLoading: page === 1 && prev.items.length === 0,
            }))

            try {
                const result = await getUserGroupsForUserPaginated(
                    user.id,
                    page,
                    PAGE_SIZE,
                    (user as any)?.documentId || (user as any)?.document_id || undefined
                )
                setUserGroupsState(prev => {
                    const existingIds = new Set(prev.items.map((group) => group.id))
                    const newItems = result.data.filter((group) => !existingIds.has(group.id))
                    const items = page === 1 ? result.data : [...prev.items, ...newItems]
                    return {
                        items,
                        page: result.hasMore ? result.pagination.page + 1 : result.pagination.page,
                        hasMore: result.hasMore,
                        loading: false,
                        initialLoading: false,
                        total: result.pagination.total,
                        currentQuery: prev.currentQuery,
                    }
                })
            } catch (error) {
                console.error("Error loading user groups:", error)
                setUserGroupsState(prev => ({
                    ...prev,
                    loading: false,
                    initialLoading: false,
                }))
            }
        },
        [user?.id, (user as any)?.documentId, (user as any)?.document_id]
    )

    const handleOpenGroup = useCallback(
        async (group: InstructorGroup, mode: "view" | "add" = "view") => {
            if (!group) return
            console.log("[DashboardFriends] handleOpenGroup invoked", {
                mode,
                groupId: (group as any)?.id,
                groupDocumentId: (group as any)?.documentId ?? (group as any)?.document_id,
            })
            const identifier = (group as any)?.documentId ?? (group as any)?.document_id ?? (group as any)?.id
            resetRenameDialog()
            setSelectedGroup(group)
            setGroupViewMode("detail")
            if (!identifier) {
                if (mode === "add") {
                    console.log("[DashboardFriends] No identifier available, opening invite modal immediately")
                    setIsInviteFriendsModalOpen(true)
                }
                return
            }

            let shouldOpenModal = mode === "add"
            if (mode === "add") {
                const owner = group.owner as any
                const ownerNumericId = extractNumericId(owner?.id ?? owner)
                const ownerDocumentId = extractDocumentId(owner)
                const isOwner =
                    (currentUserNumericId !== undefined && ownerNumericId !== undefined && ownerNumericId === currentUserNumericId) ||
                    (currentUserDocId && ownerDocumentId && ownerDocumentId === currentUserDocId)

                if (isOwner) {
                    const memberIds = new Set<number>()
                    if (ownerNumericId !== undefined) {
                        memberIds.add(ownerNumericId)
                    }
                    if (Array.isArray(group.users)) {
                        for (const member of group.users as any[]) {
                            const id = extractNumericId(member?.id ?? member)
                            if (id !== undefined) {
                                memberIds.add(id)
                            }
                        }
                    }
                    if (memberIds.size >= userGroupMemberLimit) {
                        toast.error("You've reached the member limit for this group")
                        shouldOpenModal = false
                    }
                }
            }
            
            if (shouldOpenModal) {
                console.log("[DashboardFriends] Opening invite modal for group", { identifier })
                setIsInviteFriendsModalOpen(true)
            }

            setGroupActionLoading(true)
            try {
                await refreshSelectedGroup(identifier)
            } catch (error) {
                console.error("[DashboardFriends] Failed to refresh group before opening", error)
            } finally {
                setGroupActionLoading(false)
                if (shouldOpenModal) {
                    console.log("[DashboardFriends] Ensuring invite modal remains open", { identifier })
                    setIsInviteFriendsModalOpen(true)
                }
            }
        },
        [currentUserDocId, currentUserNumericId, refreshSelectedGroup, resetRenameDialog, userGroupMemberLimit]
    )

    const handleCreateGroup = async () => {
        if (!user?.id) {
            toast.error("You need to be logged in to create a group.")
            return
        }

        const trimmedName = newGroupName.trim()
        if (!trimmedName) {
            toast.error("Please provide a group name.")
            return
        }

        setIsCreatingGroup(true)
        try {
            await createUserGroup(trimmedName, user.id, { private: newGroupPrivate })
            toast.success("Group created!")
            setIsCreateGroupDialogOpen(false)
            resetGroupForm()
            fetchUserGroups(1)
        } catch (error: any) {
            toast.error(error?.message || "Failed to create group")
        } finally {
            setIsCreatingGroup(false)
        }
    }

    const handleInviteMemberToGroup = async (group: InstructorGroup | null, memberId: string | number) => {
        if (!group) return
        const groupNumericId = extractNumericId((group as any)?.id ?? group)
        const groupDocumentId = (group as any)?.documentId
        const identifier = groupNumericId ?? groupDocumentId
        const processingKey = groupDocumentId ?? groupNumericId
        if (identifier === undefined || identifier === null || processingKey === undefined || processingKey === null) return

        const memberNumericId = extractNumericId(memberId)
        if (memberNumericId === undefined) {
            toast.error("Unable to resolve member identifier")
            return
        }

        const owner = group.owner as any
        const ownerNumericId = extractNumericId(owner?.id ?? owner)
        const ownerDocumentId = extractDocumentId(owner)
        const isOwner =
            (currentUserNumericId !== undefined && ownerNumericId !== undefined && ownerNumericId === currentUserNumericId) ||
            (currentUserDocId && ownerDocumentId && ownerDocumentId === currentUserDocId)

            const memberIds = new Set<number>()
            if (ownerNumericId !== undefined) {
                memberIds.add(ownerNumericId)
            }
            if (Array.isArray(group.users)) {
                for (const existing of group.users as any[]) {
                const existingRecord = existing?.data?.attributes ?? existing?.attributes ?? existing
                const existingId = extractNumericId(existingRecord?.id ?? existing?.id ?? existing)
                    if (existingId !== undefined) {
                        memberIds.add(existingId)
                    }
                }
            }

        if (memberIds.has(memberNumericId)) {
            toast.error("This member is already in the group")
            return
        }

        const memberLimitReachedForGroup = memberIds.size >= userGroupMemberLimit
        if (memberLimitReachedForGroup) {
                toast.error("You've reached the member limit for this group")
                return
        }

        const friendRecord = friendsState.items.find((friend: any) => {
            const friendData = friend?.data?.attributes ?? friend?.attributes ?? friend
            const friendId = extractNumericId(friendData?.id ?? friend?.id ?? friend)
            return friendId !== undefined && friendId === memberNumericId
        })
        const friendData = friendRecord?.data?.attributes ?? friendRecord?.attributes ?? friendRecord
        const friendDocId = extractDocumentId(friendData) ?? extractDocumentId(friendRecord)
        const candidateProfile =
            friendProfileMap.byId[memberNumericId] || (friendDocId ? friendProfileMap.byDoc[friendDocId] : undefined)

        const candidateDocumentId = candidateProfile?.documentId ?? friendDocId ?? null
        const candidateLimit = candidateProfile?.user_group_limit
        if (candidateLimit !== undefined && candidateLimit !== null && candidateLimit > 0) {
            try {
                const capacity = await userHasCapacityForMoreGroups(memberNumericId, candidateDocumentId)
                if (capacity.total >= candidateLimit) {
                    toast.error("This member has reached their group limit")
                    return
                }
            } catch (error) {
                console.warn("Unable to verify member capacity:", error)
            }
        }

        const inviterId = currentUserNumericId ?? user?.id ?? ""
        const existingInvitation = await checkExistingGroupInvitation(inviterId, memberNumericId, identifier)
        if (existingInvitation) {
            toast.error(
                existingInvitation.request_status === "pending"
                    ? "You already have a pending invitation for this member"
                    : "This member is already part of the group"
            )
            return
        }

        setGroupProcessingId(`add-${processingKey}-${memberNumericId}`)
        try {
            let invitation = await sendGroupInvitation(inviterId, memberNumericId, identifier)
            const hydrated = await hydrateInvitationUsers([invitation])
            if (Array.isArray(hydrated) && hydrated[0]) {
                invitation = hydrated[0]
            }
            toast.success("Invitation sent")
            setGroupSentInvitesState((prev) => {
                const existing = prev.items.filter((item) => {
                    const key = item.documentId ?? item.id
                    const newKey = invitation.documentId ?? invitation.id
                    return key !== newKey
                })
                const items = [invitation, ...existing]
                return {
                    ...prev,
                    items,
                    total: items.length,
                    loading: false,
                    initialLoading: false,
                }
            })
            setIsInviteFriendsModalOpen(false)
            await refreshSelectedGroup(identifier)
            fetchGroupSentInvites()
        } catch (error: any) {
            toast.error(error?.message || "Failed to send invitation")
        } finally {
            setGroupProcessingId(null)
        }
    }

    const handleRemoveMemberFromGroup = async (group: InstructorGroup | null, memberId: string | number) => {
        if (!group) return
        const groupDocumentId = (group as any)?.documentId ?? (group as any)?.document_id
        const groupNumericId = extractNumericId((group as any)?.id ?? group)
        const identifier = groupDocumentId ?? groupNumericId
        const processingKey = groupDocumentId ?? groupNumericId
        if (identifier === undefined || identifier === null || processingKey === undefined || processingKey === null) return
 
        const memberNumericId = extractNumericId(memberId)
        const targetMemberId = memberNumericId ?? memberId
 
        const matchesGroup = (candidate: any): boolean => {
            if (!candidate) return false
            const candidateDoc = (candidate as any)?.documentId ?? (candidate as any)?.document_id
            const candidateNumeric = extractNumericId((candidate as any)?.id ?? candidate)
            const docMatch = groupDocumentId && candidateDoc && String(candidateDoc) === String(groupDocumentId)
            const idMatch =
                groupNumericId !== undefined &&
                candidateNumeric !== undefined &&
                Number(candidateNumeric) === Number(groupNumericId)
            return Boolean(docMatch || idMatch)
        }
 
        const filterUsers = (users: any[]): any[] => {
            return users.filter((existing: any) => {
                const existingRecord = existing?.data?.attributes ?? existing?.attributes ?? existing
                const existingId = extractNumericId(existingRecord?.id ?? existing?.id ?? existing)
                return existingId !== memberNumericId
            })
        }
 
        const previousGroupItems = userGroupsState.items
        const previousSelectedGroup = selectedGroup
        let filteredSnapshot: any[] | null = null
 
        setGroupProcessingId(`remove-${processingKey}-${targetMemberId}`)
        try {
            await removeUserFromGroup(identifier, targetMemberId)
            toast.success("Member removed")

            setSelectedGroup((prev) => {
                if (!prev) return prev
                if (!matchesGroup(prev)) return prev
                const existingUsers = Array.isArray(prev.users) ? prev.users : []
                const filtered = filterUsers(existingUsers)
                filteredSnapshot = filtered
                return { ...prev, users: filtered }
            })

            setUserGroupsState((prev) => ({
                ...prev,
                items: prev.items.map((item) => {
                    if (!matchesGroup(item)) return item
                    const existingUsers = Array.isArray((item as any)?.users) ? (item as any).users : []
                    const filtered = filterUsers(existingUsers)
                    return { ...item, users: filtered }
                }),
            }))

            if (memberNumericId !== undefined) {
                setGroupProfileMap((prev) => {
                    const nextById = { ...prev.byId }
                    const nextByDoc = { ...prev.byDoc }
                    const profile = nextById[memberNumericId]
                    if (profile?.documentId) {
                        delete nextByDoc[String(profile.documentId)]
                    }
                    delete nextById[memberNumericId]
                    return { byId: nextById, byDoc: nextByDoc }
                })
            }

            await refreshSelectedGroup(identifier)
            if (filteredSnapshot) {
                setUserGroupsState((prev) => ({
                    ...prev,
                    items: prev.items.map((item) => (matchesGroup(item) ? { ...item, users: filteredSnapshot! } : item)),
                }))
            }
        } catch (error: any) {
            if (previousSelectedGroup) {
                setSelectedGroup(previousSelectedGroup)
            }
            setUserGroupsState((prev) => ({
                ...prev,
                items: [...previousGroupItems],
            }))
            toast.error(error?.message || "Failed to remove member")
        } finally {
            setGroupProcessingId(null)
        }
    }

    const handleLeaveGroup = async (group: InstructorGroup | null) => {
        if (!group || !currentUserNumericId) return
        const groupNumericId = extractNumericId((group as any)?.id ?? group)
        const groupDocumentId = (group as any)?.documentId
        const identifier = groupNumericId ?? groupDocumentId
        const processingKey = groupDocumentId ?? groupNumericId
        if (identifier === undefined || identifier === null || processingKey === undefined || processingKey === null) return

        setGroupProcessingId(`leave-${processingKey}`)
        try {
            await leaveUserGroup(identifier, currentUserNumericId)
            toast.success("You left the group")
            setGroupViewMode("list")
            setSelectedGroup(null)
            setIsInviteFriendsModalOpen(false)
            resetRenameDialog()
            fetchUserGroups(1)
        } catch (error: any) {
            toast.error(error?.message || "Failed to leave group")
        } finally {
            setGroupProcessingId(null)
        }
    }

    const handleDeleteGroup = async (group: InstructorGroup | null) => {
        if (!group) return
        const groupNumericId = extractNumericId((group as any)?.id ?? group)
        const groupDocumentId = (group as any)?.documentId
        const identifier = groupNumericId ?? groupDocumentId
        const processingKey = groupDocumentId ?? groupNumericId
        if (identifier === undefined || identifier === null || processingKey === undefined || processingKey === null) return

        setGroupProcessingId(`delete-${processingKey}`)
        try {
            await deleteUserGroup(identifier)
            toast.success("Group deleted")
            fetchUserGroups(1)
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete group")
        } finally {
            setGroupProcessingId(null)
        }
    }

    const handleToggleGroupPrivacy = async (group: InstructorGroup | null, nextValue: boolean) => {
        if (!group) return
        const groupDocumentId = (group as any)?.documentId ?? (group as any)?.document_id
        const groupNumericId = extractNumericId((group as any)?.id ?? group)
        const identifier = groupDocumentId ?? groupNumericId
        const processingKey = groupDocumentId ?? groupNumericId
        if (identifier === undefined || identifier === null || processingKey === undefined || processingKey === null) return

        const matchesGroup = (candidate: any): boolean => {
            if (!candidate) return false
            const candidateDoc = (candidate as any)?.documentId ?? (candidate as any)?.document_id
            const candidateNumeric = extractNumericId((candidate as any)?.id ?? candidate)
            const docMatch = groupDocumentId && candidateDoc && String(candidateDoc) === String(groupDocumentId)
            const idMatch =
                groupNumericId !== undefined &&
                candidateNumeric !== undefined &&
                Number(candidateNumeric) === Number(groupNumericId)
            return Boolean(docMatch || idMatch)
        }

        const previousSelectedGroup = selectedGroup
        const previousGroupItems = userGroupsState.items

        setSelectedGroup((prev) => {
            if (!prev || !matchesGroup(prev)) return prev
            return {
                ...prev,
                isPrivate: nextValue,
                private: nextValue,
                privete: undefined,
            }
        })

        setUserGroupsState((prev) => ({
            ...prev,
            items: prev.items.map((item) =>
                matchesGroup(item)
                    ? {
                          ...item,
                          isPrivate: nextValue,
                          private: nextValue,
                          privete: undefined,
                      }
                    : item
            ),
        }))

        setGroupProcessingId(`privacy-${processingKey}`)
        try {
            const updated = await updateUserGroupPrivacy(identifier, nextValue)
            toast.success(`Group is now ${nextValue ? "private" : "public"}`)

            const refreshKey = (updated as any)?.documentId ?? (updated as any)?.id ?? identifier
            await refreshSelectedGroup(refreshKey)

            if (updated) {
                setUserGroupsState((prev) => ({
                    ...prev,
                    items: prev.items.map((item) =>
                        matchesGroup(item)
                            ? {
                                  ...item,
                                  ...updated,
                                  isPrivate: Boolean((updated as any)?.isPrivate ?? (updated as any)?.private ?? nextValue),
                                  private: Boolean((updated as any)?.private ?? nextValue),
                                  privete: undefined,
                              }
                            : item
                    ),
                }))
            }
        } catch (error: any) {
            if (previousSelectedGroup) {
                setSelectedGroup(previousSelectedGroup)
            }
            setUserGroupsState((prev) => ({
                ...prev,
                items: [...previousGroupItems],
            }))
            toast.error(error?.message || "Failed to update privacy")
        } finally {
            setGroupProcessingId(null)
        }
    }

    const handleRenameGroup = (group: InstructorGroup | null) => {
        if (!group) return
        setRenameGroupTarget(group)
        setRenameGroupValue(group.name || "")
        setIsRenameGroupDialogOpen(true)
    }

    const submitRenameGroup = async () => {
        if (!renameGroupTarget) return
        const trimmed = renameGroupValue.trim()
        if (!trimmed) {
            toast.error("Please enter a group name")
            return
        }

        setIsRenamingGroup(true)
        try {
            await updateGroupName(renameGroupTarget.documentId || renameGroupTarget.id, trimmed, "group")
            toast.success("Group renamed")
            await fetchUserGroups(1)
            if (selectedGroup && (selectedGroup.documentId || selectedGroup.id) === (renameGroupTarget.documentId || renameGroupTarget.id)) {
                await refreshSelectedGroup(renameGroupTarget.documentId || renameGroupTarget.id)
            }
            resetRenameDialog()
        } catch (error: any) {
            toast.error(error?.message || "Failed to rename group")
        } finally {
            setIsRenamingGroup(false)
        }
    }

    const getCandidateKey = useCallback((candidate: any) => {
        const docId = extractDocumentId(candidate)
        if (docId) return `doc:${docId}`
        const numericId = extractNumericId(candidate?.id ?? candidate)
        if (numericId !== undefined) return `id:${numericId}`
        if (typeof candidate.email === "string") return `email:${candidate.email}`
        return `candidate:${Math.random().toString(36).slice(2)}`
    }, [])

    const getCandidateStatus = useCallback(
        (candidate: any): CandidateStatus => {
            if (candidate?.friendshipStatus) {
                return candidate.friendshipStatus as CandidateStatus
            }

            const candidateNumericId = extractNumericId(candidate?.id ?? candidate)
            const candidateDocId = extractDocumentId(candidate)

            if (
                (candidateNumericId !== undefined && currentUserNumericId !== undefined && candidateNumericId === currentUserNumericId) ||
                (candidateDocId && currentUserDocId && candidateDocId === currentUserDocId)
            ) {
                return "self"
            }

            return "available"
        },
        [currentUserDocId, currentUserNumericId]
    )

    const fetchSearchResults = useCallback(
        async (query = "", page = 1, append = false) => {
            console.debug("[FriendSearch] fetchSearchResults invoked", { query, page, append, userId: user?.id })
            const normalizedQuery = query.trim()

            setSearchState(prev => ({
                ...prev,
                loading: true,
                initialLoading: !append && (prev.items.length === 0 || prev.currentQuery !== normalizedQuery),
            }))

            try {
                const result = await getUsersWithFriendshipContext(user?.id ?? "", normalizedQuery, page, PAGE_SIZE)
                console.debug("[FriendSearch] API result", {
                    total: result.pagination.total,
                    returned: result.data.length,
                    hasMore: result.hasMore,
                    nextPage: result.nextPage,
                })
                activeSearchRef.current = normalizedQuery

                setSearchState(prev => {
                    const isSameQuery = append && prev.currentQuery === normalizedQuery
                    const baseItems = isSameQuery ? prev.items : []
                    const seenKeys = new Set(baseItems.map((candidate: any) => getCandidateKey(candidate)))

                    const newItems = result.data.filter((candidate: any) => {
                        const key = getCandidateKey(candidate)
                        if (seenKeys.has(key)) return false
                        seenKeys.add(key)
                        return true
                    })

                    const items = isSameQuery ? [...baseItems, ...newItems] : newItems

                    return {
                        items,
                        page: result.nextPage ?? (result.hasMore ? result.pagination.page + 1 : result.pagination.page),
                        hasMore: result.hasMore,
                        loading: false,
                        initialLoading: false,
                        total: result.pagination.total,
                        currentQuery: normalizedQuery,
                    }
                })
        } catch (error) {
            console.error("Error searching users:", error)
                setSearchState(prev => ({
                    ...prev,
                    loading: false,
                    initialLoading: false,
                }))
            }
        },
        [getCandidateKey, user?.id]
    )

    const refreshAll = useCallback(() => {
        if (!user?.id) return
        resetStates()
        fetchFriends(1)
        fetchReceived(1)
        fetchSent(1)
        fetchUserGroups(1)
        fetchGroupReceivedInvites()
        fetchGroupSentInvites()
    }, [user?.id, resetStates, fetchFriends, fetchReceived, fetchSent, fetchUserGroups, fetchGroupReceivedInvites, fetchGroupSentInvites])

    useEffect(() => {
        if (!user?.id) {
            resetStates()
            return
        }
        refreshAll()
    }, [user?.id, refreshAll, resetStates])

    useEffect(() => {
        if (!isSearchViewOpen) return
        setSearchDraft("")
        setSearchState(createSearchState())
        setDebouncedQuery("")
        activeSearchRef.current = ""
        console.debug("[FriendSearch] Search view opened, loading initial users")
        fetchSearchResults("", 1, false)
    }, [isSearchViewOpen, fetchSearchResults])

    useEffect(() => {
        if (!isSearchViewOpen) return
        const handler = setTimeout(() => {
            setDebouncedQuery(searchDraft.trim())
        }, 350)

        return () => clearTimeout(handler)
    }, [searchDraft, isSearchViewOpen])

    useEffect(() => {
        if (!isSearchViewOpen) return
        fetchSearchResults(debouncedQuery, 1, false)
    }, [debouncedQuery, isSearchViewOpen, fetchSearchResults])

    useEffect(() => {
        if (!isSearchViewOpen) return
        if (!debouncedQuery) return

        setRecentSearches(prev => {
            const next = [debouncedQuery, ...prev.filter(item => item !== debouncedQuery)]
            return next.slice(0, 6)
        })
    }, [debouncedQuery, isSearchViewOpen])

    // Track active tab movement
    useEffect(() => {
        setActiveIndicator(activeTab)
    }, [activeTab])

    useEffect(() => {
        if (activeTab !== "friends") return
        if (!friendsState.hasMore) return
        const observer = new IntersectionObserver(entries => {
            const entry = entries[0]
            if (entry?.isIntersecting && !friendsState.loading && friendsState.hasMore) {
                fetchFriends(friendsState.page)
            }
        }, { rootMargin: "200px" })
        const node = friendsEndRef.current
        if (node) observer.observe(node)
        return () => observer.disconnect()
    }, [activeTab, friendsState.hasMore, friendsState.loading, friendsState.page, fetchFriends])

    useEffect(() => {
        if (activeTab !== "received") return
        if (!receivedState.hasMore) return
        const observer = new IntersectionObserver(entries => {
            const entry = entries[0]
            if (entry?.isIntersecting && !receivedState.loading && receivedState.hasMore) {
                fetchReceived(receivedState.page)
            }
        }, { rootMargin: "200px" })
        const node = receivedEndRef.current
        if (node) observer.observe(node)
        return () => observer.disconnect()
    }, [activeTab, receivedState.hasMore, receivedState.loading, receivedState.page, fetchReceived])

    useEffect(() => {
        if (activeTab !== "sent") return
        if (!sentState.hasMore) return
        const observer = new IntersectionObserver(entries => {
            const entry = entries[0]
            if (entry?.isIntersecting && !sentState.loading && sentState.hasMore) {
                fetchSent(sentState.page)
            }
        }, { rootMargin: "200px" })
        const node = sentEndRef.current
        if (node) observer.observe(node)
        return () => observer.disconnect()
    }, [activeTab, sentState.hasMore, sentState.loading, sentState.page, fetchSent])

    useEffect(() => {
        if (!isSearchViewOpen) return
        if (!searchState.currentQuery || !searchState.hasMore) return
        const observer = new IntersectionObserver(entries => {
            const entry = entries[0]
            if (entry?.isIntersecting && !searchState.loading) {
                fetchSearchResults(searchState.currentQuery, searchState.page, true)
            }
        }, { rootMargin: "200px" })

        const node = searchEndRef.current
        if (node) observer.observe(node)
        return () => observer.disconnect()
    }, [isSearchViewOpen, searchState.currentQuery, searchState.hasMore, searchState.loading, searchState.page, fetchSearchResults])

    useEffect(() => {
        if (activeTab !== "groups") return
        if (!userGroupsState.hasMore) return
        const observer = new IntersectionObserver(entries => {
            const entry = entries[0]
            if (entry?.isIntersecting && !userGroupsState.loading && userGroupsState.hasMore) {
                fetchUserGroups(userGroupsState.page)
            }
        }, { rootMargin: "200px" })

        const node = groupsEndRef.current
        if (node) observer.observe(node)
        return () => observer.disconnect()
    }, [activeTab, userGroupsState.hasMore, userGroupsState.loading, userGroupsState.page, fetchUserGroups])

    const handleAddFriend = async (candidate: any) => {
        if (!user?.id) return

        const status = getCandidateStatus(candidate)
        const candidateKey = getCandidateKey(candidate)
        const candidateIdentifier = candidate?.documentId || candidate?.document_id || candidate?.id

        if (!candidateIdentifier) {
            toast.error("Unable to determine user identifier")
            return
        }

        if (status === "self") {
            toast.info("That's you!")
            return
        }

        if (status === "friend") {
            toast.info("You're already friends")
            return
        }

        if (status === "incoming") {
            toast.info("You already have a pending request from this user")
            setActiveTab("received")
            return
        }

        if (status === "outgoing") {
            toast.info("Friend request already sent")
            return
        }

        if (!canAddMore) {
            toast.error(`Friend limit reached (${friendLimit}). Please upgrade your subscription to add more friends.`)
            router.push('/pricing')
            return
        }

        setProcessingId(`candidate-${candidateKey}`)
        try {
            await sendFriendRequest(user.id, candidateIdentifier)
            toast.success("Friend request sent!")
            fetchSearchResults(activeSearchRef.current, 1, false)
            refreshAll()
        } catch (error: any) {
            toast.error(error.message || "Failed to send friend request")
        } finally {
            setProcessingId(null)
        }
    }

    const handleCancelRequest = async (requestId?: string | number) => {
        if (!requestId) return
        try {
            setProcessingId(requestId)
            await cancelFriendRequest(requestId)
            toast.success("Request cancelled")
            fetchSearchResults(activeSearchRef.current, 1, false)
            refreshAll()
        } catch (error: any) {
            toast.error(error.message || "Failed to cancel request")
        } finally {
            setProcessingId(null)
        }
    }

    // Reset search only when modal is actually closed (not just when state changes)
    useEffect(() => {
        if (!isSearchViewOpen) {
            // Use a small delay to ensure state is preserved during transitions
            const timer = setTimeout(() => {
                setSearchDraft("")
                setDebouncedQuery("")
                activeSearchRef.current = ""
                setSearchState(createSearchState())
            }, 300) // Wait for animation to complete
            
            return () => clearTimeout(timer)
        }
    }, [isSearchViewOpen])

    useEffect(() => {
        if (groupViewMode !== "detail") {
            setIsInviteFriendsModalOpen(false)
        }
    }, [groupViewMode])

    const handleAcceptRequest = async (request: FriendRequest) => {
        if (!user?.id) return

        // Check friend limit
        if (friendsState.total >= friendLimit) {
            toast.error(`Friend limit reached (${friendLimit}). Please upgrade your subscription to add more friends.`)
            router.push('/pricing')
            return
        }

        const requestIdentifier = request.documentId || request.id
        setProcessingId(requestIdentifier)
        try {
            const fromUserId = typeof request.from_user === 'object' 
                ? request.from_user.id || request.from_user 
                : request.from_user
            await acceptFriendRequest(requestIdentifier, fromUserId, user.id)
            toast.success("Friend request accepted!")
            refreshAll()
        } catch (error: any) {
            toast.error(error.message || "Failed to accept friend request")
        } finally {
            setProcessingId(null)
        }
    }

    const syncAcceptedGroup = useCallback(
        async (groupDocumentId?: string | null, groupNumericId?: number | null) => {
            if (!groupDocumentId && (groupNumericId === undefined || groupNumericId === null)) return
            const identifier = groupDocumentId ?? groupNumericId
            if (identifier === undefined || identifier === null) return

            try {
                const latestGroup = await getUserGroup(identifier)
                if (!latestGroup) return

                const matchesGroup = (candidate: any): boolean => {
                    if (!candidate) return false
                    const candidateDoc = (candidate as any)?.documentId ?? (candidate as any)?.document_id
                    const candidateNumeric = extractNumericId((candidate as any)?.id ?? candidate)
                    const docMatch =
                        groupDocumentId && candidateDoc && String(candidateDoc) === String(groupDocumentId)
                    const idMatch =
                        groupNumericId !== undefined &&
                        groupNumericId !== null &&
                        candidateNumeric !== undefined &&
                        Number(candidateNumeric) === Number(groupNumericId)
                    return Boolean(docMatch || idMatch)
                }

                setUserGroupsState((prev) => {
                    const exists = prev.items.some((item) => matchesGroup(item))
                    const items = exists
                        ? prev.items.map((item) => (matchesGroup(item) ? { ...item, ...latestGroup } : item))
                        : [latestGroup, ...prev.items]
                    return {
                        ...prev,
                        items,
                        total: exists ? prev.total : prev.total + 1,
                    }
                })
            } catch (error) {
                console.warn("Failed to hydrate accepted group:", error)
            }
        },
        [setUserGroupsState]
    )

    const handleAcceptGroupInvite = async (invitation: GroupInvitation) => {
        const invitationKey = invitation.documentId ?? invitation.id
        if (!invitationKey) return
        setGroupInvitationProcessingId(`accept-${invitationKey}`)
        try {
            await acceptGroupInvitation(String(invitationKey))
            toast.success("Joined group")
            setGroupReceivedInvitesState((prev) => {
                const items = prev.items.filter((item) => (item.documentId ?? item.id) !== invitationKey)
                return {
                    ...prev,
                    items,
                    total: Math.max(0, items.length),
                }
            })
            const groupEntity = (invitation as any)?.user_group_group?.data ?? (invitation as any)?.user_group_group ?? null
            const groupDocumentId = extractDocumentId(groupEntity)
            const groupNumericId = extractNumericId(groupEntity?.id ?? groupEntity)

            await syncAcceptedGroup(groupDocumentId ?? null, groupNumericId ?? null)

            await Promise.allSettled([fetchGroupReceivedInvites(), fetchUserGroups(1)])
        } catch (error: any) {
            toast.error(error?.message || "Failed to accept group invitation")
        } finally {
            setGroupInvitationProcessingId(null)
        }
    }

    const handleRejectGroupInvite = async (invitation: GroupInvitation) => {
        const invitationKey = invitation.documentId ?? invitation.id
        if (!invitationKey) return
        setGroupInvitationProcessingId(`reject-${invitationKey}`)
        try {
            await rejectGroupInvitation(String(invitationKey))
            toast.success("Invitation declined")
            setGroupReceivedInvitesState((prev) => {
                const items = prev.items.filter((item) => (item.documentId ?? item.id) !== invitationKey)
                return {
                    ...prev,
                    items,
                    total: Math.max(0, items.length),
                }
            })
            await fetchGroupReceivedInvites()
        } catch (error: any) {
            toast.error(error?.message || "Failed to decline invitation")
        } finally {
            setGroupInvitationProcessingId(null)
        }
    }

    useEffect(() => {
        if (typeof window === "undefined") return
        const handler = (event: Event) => {
            const custom = event as CustomEvent<{ groupDocumentId?: string | null; groupNumericId?: number | null }>
            const detail = custom.detail || {}
            if (detail.groupDocumentId || detail.groupNumericId !== undefined) {
                syncAcceptedGroup(detail.groupDocumentId ?? null, detail.groupNumericId ?? null)
            }
            fetchGroupReceivedInvites()
            fetchUserGroups(1)
        }

        window.addEventListener("dashboard:user-group-accepted", handler as EventListener)
        return () => window.removeEventListener("dashboard:user-group-accepted", handler as EventListener)
    }, [fetchGroupReceivedInvites, fetchUserGroups, syncAcceptedGroup])

    const handleRejectRequest = async (request: FriendRequest) => {
        const requestIdentifier = request.documentId || request.id
        setProcessingId(requestIdentifier)
        try {
            await rejectFriendRequest(requestIdentifier)
            toast.success("Friend request rejected")
            refreshAll()
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
            refreshAll()
        } catch (error: any) {
            toast.error(error.message || "Failed to unfriend user")
        } finally {
            setProcessingId(null)
        }
    }

    const getProfileForMember = useCallback(
        (id?: number | null, documentId?: string | null) => {
            const keyFromId = buildProfileKey(id ?? null, null)
            const keyFromDoc = buildProfileKey(null, documentId ?? null)
            return (keyFromId && memberProfiles[keyFromId]) || (keyFromDoc && memberProfiles[keyFromDoc]) || null
        },
        [memberProfiles]
    )

    const loadMemberProfiles = useCallback(
        async (targets: Array<{ id?: number | null; documentId?: string | null }>) => {
            if (pendingProfileFetchRef.current) return
            if (!targets || targets.length === 0) return

            const uniqueTargets: Array<{ id?: number | null; documentId?: string | null }> = []
            const seen = new Set<string>()

            targets.forEach(({ id, documentId }) => {
                const key = buildProfileKey(id ?? null, documentId ?? null)
                if (!key || memberProfiles[key] || seen.has(key)) return
                uniqueTargets.push({ id: id ?? null, documentId: documentId ?? null })
                seen.add(key)
            })

            if (uniqueTargets.length === 0) return

            pendingProfileFetchRef.current = true
            try {
                const profiles = await getUsersByIdentifiers(uniqueTargets)
                if (profiles.length > 0) {
                    setMemberProfiles((prev) => {
                        const next = { ...prev }
                        profiles.forEach((profile) => {
                            const keyFromId = buildProfileKey(profile.id ?? null, null)
                            const keyFromDoc = buildProfileKey(null, profile.documentId ?? null)
                            if (keyFromId) next[keyFromId] = profile
                            if (keyFromDoc) next[keyFromDoc] = profile
                        })
                        return next
                    })
                }
            } catch (error) {
                console.error("Error loading member profiles:", error)
            } finally {
                pendingProfileFetchRef.current = false
            }
        },
        [memberProfiles]
    )

    const friendCount = friendsState.total || friendsState.items.length
    const groupCount = userGroupsState.total || userGroupsState.items.length
    const rawGroupLimit = (user as any)?.user_group_limit
    const groupLimit =
        typeof rawGroupLimit === "number" && rawGroupLimit > 0
            ? rawGroupLimit
            : typeof rawGroupLimit === "string" && /^\d+$/.test(rawGroupLimit)
            ? Number(rawGroupLimit)
            : DEFAULT_USER_GROUP_LIMIT
    const isGroupLimitReached = groupCount >= groupLimit
    const groupSlotsRemaining = Math.max(groupLimit - groupCount, 0)
    const isNearLimit = friendCount >= friendLimit * 0.9
    const canAddMore = friendCount < friendLimit
    const pendingFriendReceivedCount = receivedState.items.filter((request) => request.friend_status === "pending").length
    const pendingFriendSentCount = sentState.items.filter((request) => request.friend_status === "pending").length
    const pendingGroupReceivedCount = groupReceivedInvitesState.items.filter((invite) => invite.request_status === "pending").length
    const pendingGroupSentCount = groupSentInvitesState.items.filter((invite) => invite.request_status === "pending").length
    const pendingReceivedCount = pendingFriendReceivedCount + pendingGroupReceivedCount
    const pendingSentCount = pendingFriendSentCount + pendingGroupSentCount

    const requestsInitialLoading = receivedState.initialLoading || groupReceivedInvitesState.initialLoading
    const requestsLoading = receivedState.loading || groupReceivedInvitesState.loading
    const hasFriendRequests = receivedState.items.length > 0
    const hasGroupInvites = groupReceivedInvitesState.items.length > 0

    const sentInitialLoading = sentState.initialLoading || groupSentInvitesState.initialLoading
    const sentLoading = sentState.loading || groupSentInvitesState.loading
    const hasFriendSentRequests = sentState.items.length > 0
    const hasGroupSentInvites = groupSentInvitesState.items.length > 0

    const selectedGroupOwnerInfo = React.useMemo(() => {
        if (!selectedGroup) {
            return {
                ownerId: undefined as number | undefined,
                ownerDocumentId: undefined as string | undefined,
                ownerName: "",
                ownerEmail: undefined as string | undefined,
                ownerAvatar: undefined as any,
            }
        }
        const ownerSource = selectedGroup.owner as any
        const ownerRecord = ownerSource?.data?.attributes ?? ownerSource?.attributes ?? ownerSource
        const ownerId = extractNumericId(ownerRecord?.id ?? ownerSource?.id ?? ownerSource)
        const ownerDocumentId = extractDocumentId(ownerRecord) ?? extractDocumentId(ownerSource)
        const fallbackName =
            ownerRecord?.username ||
            ownerRecord?.email ||
            ownerRecord?.name ||
            (typeof ownerSource === "string" ? ownerSource : "Owner")
        const profile = getProfileForMember(ownerId ?? null, ownerDocumentId ?? null)
        return {
            ownerId: ownerId !== undefined ? Number(ownerId) : undefined,
            ownerDocumentId: ownerDocumentId ? String(ownerDocumentId) : undefined,
            ownerName: profile?.username || profile?.name || fallbackName,
            ownerEmail: profile?.email || ownerRecord?.email,
            ownerAvatar: profile?.avatar || ownerRecord?.avatar,
        }
    }, [selectedGroup, getProfileForMember])

    const selectedGroupMembers = React.useMemo(() => {
        if (!selectedGroup) return []
        if (Array.isArray(selectedGroup.users)) return selectedGroup.users
        const nested = (selectedGroup as any)?.users?.data
        if (Array.isArray(nested)) {
            return nested.map((entry: any) => {
                if (entry?.attributes) {
                    return { id: entry.id, documentId: entry.attributes?.documentId, ...entry.attributes }
                }
                return entry
            })
        }
        return []
    }, [selectedGroup])

    const selectedGroupMemberIds = React.useMemo(() => {
        const ids = new Set<number>()
        selectedGroupMembers.forEach((member: any) => {
            const memberRecord = member?.data?.attributes ?? member?.attributes ?? member
            const id = extractNumericId(memberRecord?.id ?? member?.id ?? member)
            if (id !== undefined) ids.add(id)
        })
        if (selectedGroupOwnerInfo.ownerId !== undefined) {
            ids.add(selectedGroupOwnerInfo.ownerId)
        }
        return ids
    }, [selectedGroupMembers, selectedGroupOwnerInfo.ownerId])

    const selectedGroupMemberDocIds = React.useMemo(() => {
        const docs = new Set<string>()
        selectedGroupMembers.forEach((member: any) => {
            const memberRecord = member?.data?.attributes ?? member?.attributes ?? member
            const docId = extractDocumentId(memberRecord) ?? extractDocumentId(member)
            if (docId) docs.add(docId)
        })
        if (selectedGroupOwnerInfo.ownerDocumentId) {
            docs.add(String(selectedGroupOwnerInfo.ownerDocumentId))
        }
        return docs
    }, [selectedGroupMembers, selectedGroupOwnerInfo.ownerDocumentId])

    const availableFriendsForSelectedGroup = React.useMemo(() => {
        if (!selectedGroup) return []
        return friendsState.items.filter((friend: any) => {
            const friendRecord = friend?.data?.attributes ?? friend?.attributes ?? friend
            const friendId = extractNumericId(friendRecord?.id ?? friend?.id ?? friend)
            const friendDocId = extractDocumentId(friendRecord) ?? extractDocumentId(friend)
            if (friendId === undefined && !friendDocId) return false
            if (friendId !== undefined && selectedGroupMemberIds.has(friendId)) return false
            if (friendDocId && selectedGroupMemberDocIds.has(friendDocId)) return false
            return true
        })
    }, [friendsState.items, selectedGroup, selectedGroupMemberIds, selectedGroupMemberDocIds])

    const isCurrentUserGroupOwner =
        selectedGroup !== null &&
        ((selectedGroupOwnerInfo.ownerId !== undefined &&
            currentUserNumericId !== undefined &&
            selectedGroupOwnerInfo.ownerId === currentUserNumericId) ||
            (selectedGroupOwnerInfo.ownerDocumentId !== undefined &&
                currentUserDocId !== undefined &&
                selectedGroupOwnerInfo.ownerDocumentId === currentUserDocId))

    const inviteCandidates = React.useMemo<InviteCandidate[]>(() => {
        const candidates = availableFriendsForSelectedGroup
            .map((friend: any) => {
                const friendRecord = friend?.data?.attributes ?? friend?.attributes ?? friend
                const id = extractNumericId(friendRecord?.id ?? friend?.id ?? friend)
                const friendDocId = extractDocumentId(friendRecord) ?? extractDocumentId(friend)
                if (id === undefined) return null
                if (pendingGroupInviteIds.has(id)) return null
                const profile = friendProfileMap.byId[id] || (friendDocId ? friendProfileMap.byDoc[friendDocId] : undefined)
                const name =
                    profile?.username ||
                    profile?.email ||
                    profile?.name ||
                    friendRecord?.username ||
                    friendRecord?.email ||
                    friendRecord?.name ||
                    (typeof friend === "string" ? friend : `Member #${id}`)
                const email = profile?.email ?? friendRecord?.email ?? undefined
                const bio = profile?.bio || friendRecord?.bio || friendRecord?.about || undefined
                const avatar = getAvatarUrl(profile?.avatar ?? friendRecord?.avatar) ?? null
                const documentId = profile?.documentId ?? friendDocId ?? null
                const rawLimit = profile?.user_group_limit
                let groupLimit: number | null = null
                if (typeof rawLimit === "number") {
                    groupLimit = rawLimit > 0 ? rawLimit : null
                } else if (typeof rawLimit === "string" && /^\d+$/.test(rawLimit)) {
                    const parsed = Number(rawLimit)
                    groupLimit = parsed > 0 ? parsed : null
                }
                return { id, name, email, bio, avatar, documentId, groupLimit } as InviteCandidate
            })
            .filter((candidate): candidate is InviteCandidate => candidate !== null)
        return candidates
    }, [availableFriendsForSelectedGroup, friendProfileMap, pendingGroupInviteIds])

    useEffect(() => {
        if (!selectedGroup) return

        const targets: Array<{ id?: number | null; documentId?: string | null }> = []

        const pushTarget = (id?: number | null, documentId?: string | null) => {
            const key = buildProfileKey(id ?? null, documentId ?? null)
            if (!key || memberProfiles[key]) return
            targets.push({ id: id ?? null, documentId: documentId ?? null })
        }

        pushTarget(selectedGroupOwnerInfo.ownerId ?? null, selectedGroupOwnerInfo.ownerDocumentId ?? null)

        selectedGroupMembers.forEach((member: any) => {
            const memberData = member?.data?.attributes ?? member?.attributes ?? member
            const memberId = extractNumericId(memberData?.id ?? member?.id ?? member)
            const memberDocumentId = extractDocumentId(memberData) ?? extractDocumentId(member)
            pushTarget(memberId ?? null, memberDocumentId ?? null)
        })

        if (targets.length > 0) {
            loadMemberProfiles(targets)
        }
    }, [
        selectedGroup,
        selectedGroupMembers,
        selectedGroupOwnerInfo.ownerId,
        selectedGroupOwnerInfo.ownerDocumentId,
        memberProfiles,
        loadMemberProfiles,
    ])

    useEffect(() => {
        if (!selectedGroup) {
            if (groupProfilesKeyRef.current !== "") {
                groupProfilesKeyRef.current = ""
                setGroupProfileMap({ byId: {}, byDoc: {} })
            }
            return
        }

        const identifiers: Array<{ id?: number | string | null; documentId?: string | null }> = []
        const seen = new Set<string>()

        if (selectedGroupOwnerInfo.ownerId !== undefined || selectedGroupOwnerInfo.ownerDocumentId) {
            const key = `${selectedGroupOwnerInfo.ownerId ?? ""}:${selectedGroupOwnerInfo.ownerDocumentId ?? ""}`
            if (!seen.has(key)) {
                seen.add(key)
                identifiers.push({ id: selectedGroupOwnerInfo.ownerId, documentId: selectedGroupOwnerInfo.ownerDocumentId })
            }
        }

        selectedGroupMembers.forEach((member: any) => {
            const memberData = member?.data?.attributes ?? member?.attributes ?? member
            const id = extractNumericId(memberData?.id ?? member?.id ?? member)
            const documentId = extractDocumentId(memberData) ?? extractDocumentId(member)
            if (id === undefined && !documentId) return
            const key = `${id ?? ""}:${documentId ?? ""}`
            if (seen.has(key)) return
            seen.add(key)
            identifiers.push({ id, documentId })
        })

        if (identifiers.length === 0) {
            if (groupProfilesKeyRef.current !== "") {
                groupProfilesKeyRef.current = ""
                setGroupProfileMap({ byId: {}, byDoc: {} })
            }
            return
        }

        const key = identifiers
            .map(({ id, documentId }) => `${id ?? ""}:${documentId ?? ""}`)
            .sort()
            .join("|")

        if (groupProfilesKeyRef.current === key) {
            return
        }

        groupProfilesKeyRef.current = key

        let cancelled = false
        ;(async () => {
            try {
                const profiles = await getUsersByIdentifiers(identifiers)
                if (!cancelled) {
                    setGroupProfileMap(buildProfileLookup(profiles))
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Failed to load group member profiles:", error)
                }
            }
        })()

        return () => {
            cancelled = true
        }
    }, [selectedGroup, selectedGroupMembers, selectedGroupOwnerInfo.ownerId, selectedGroupOwnerInfo.ownerDocumentId, buildProfileLookup])

    useEffect(() => {
        const identifiers: Array<{ id?: number | string | null; documentId?: string | null }> = []
        const seen = new Set<string>()

        friendsState.items.forEach((friend: any) => {
            const friendRecord = friend?.data?.attributes ?? friend?.attributes ?? friend
            const id = extractNumericId(friendRecord?.id ?? friend?.id ?? friend)
            const documentId = extractDocumentId(friendRecord) ?? extractDocumentId(friend)
            if (id === undefined && !documentId) return
            const key = `${id ?? ""}:${documentId ?? ""}`
            if (seen.has(key)) return
            seen.add(key)
            identifiers.push({ id, documentId })
        })

        if (identifiers.length === 0) {
            if (friendProfilesKeyRef.current !== "") {
                friendProfilesKeyRef.current = ""
                setFriendProfileMap({ byId: {}, byDoc: {} })
            }
            return
        }

        const key = identifiers
            .map(({ id, documentId }) => `${id ?? ""}:${documentId ?? ""}`)
            .sort()
            .join("|")

        if (friendProfilesKeyRef.current === key) {
            return
        }

        friendProfilesKeyRef.current = key

        let cancelled = false
        ;(async () => {
            try {
                const profiles = await getUsersByIdentifiers(identifiers)
                if (!cancelled) {
                    setFriendProfileMap(buildProfileLookup(profiles))
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Failed to load friend profiles:", error)
                }
            }
        })()

        return () => {
            cancelled = true
        }
    }, [friendsState.items, buildProfileLookup])

    useEffect(() => {
        if (!isInviteFriendsModalOpen) return
        const toFetch: Array<{ id: number; documentId: string | null }> = []

        console.log("[DashboardFriends] capacity effect triggered", {
            isModalOpen: isInviteFriendsModalOpen,
            candidateCount: inviteCandidates.length,
            previousKeys: Object.keys(candidateCapacity),
        })

        setCandidateCapacity((prev) => {
            const next = { ...prev }
            inviteCandidates.forEach((candidate) => {
                // Only track candidates that have explicit limits
                if (!candidate.groupLimit || candidate.groupLimit <= 0) {
                    if (!prev[candidate.id]) {
                        console.log("[DashboardFriends] candidate has no limit, marking resolved", {
                            candidateId: candidate.id,
                            candidateName: candidate.name,
                        })
                    }
                    next[candidate.id] = { total: 0, loading: false }
                    return
                }

                const status = next[candidate.id]
                // Only fetch if we don't have a confirmed total yet
                // Default to total: 0 (has capacity) while fetching
                const needsFetch = !status || typeof status.total !== "number"
                if (needsFetch) {
                    console.log("[DashboardFriends] scheduling capacity fetch", {
                        candidateId: candidate.id,
                        candidateName: candidate.name,
                        limit: candidate.groupLimit,
                    })
                    // Set total to 0 (optimistic - assume they have capacity) and loading: false
                    // This prevents "Checking..." from showing
                    next[candidate.id] = {
                        total: 0,
                        loading: false,
                    }
                    toFetch.push({ id: candidate.id, documentId: candidate.documentId ?? null })
                }
            })
            return next
        })

        if (toFetch.length === 0) return

        console.log("[DashboardFriends] capacity fetch queue", toFetch)

        ;(async () => {
            console.log("[DashboardFriends] running capacity fetch batch", { count: toFetch.length })
            const results = await Promise.all(
                toFetch.map(async ({ id, documentId }) => {
                    try {
                        const { total } = await userHasCapacityForMoreGroups(id, documentId)
                        console.log("[DashboardFriends] capacity result", { id, total })
                        return { id, total }
                    } catch (error) {
                        console.error("Failed to compute candidate capacity:", error)
                            return { id, total: undefined }
                    }
                })
            )

            console.log("[DashboardFriends] capacity fetch resolved", results)

            setCandidateCapacity((prev) => {
                const next = { ...prev }
                results.forEach(({ id, total }) => {
                    const normalizedTotal = typeof total === "number" ? total : 0
                    console.log("[DashboardFriends] capacity state update", {
                        id,
                        previous: prev[id],
                        nextTotal: normalizedTotal,
                    })
                    next[id] = { total: normalizedTotal, loading: false }
                })
                return next
            })
        })()

        return undefined
    }, [isInviteFriendsModalOpen, inviteCandidates])

    const inviteCandidatesWithCapacity = React.useMemo(() => {
        const mapped = inviteCandidates.map((candidate) => {
            const status = candidateCapacity[candidate.id]
            // Always default to 0 if no status or no total yet (optimistic - assume capacity)
            const totalGroups = typeof status?.total === "number" ? status.total : 0
            const limit = candidate.groupLimit ?? null
            // Only show limit reached if we have a confirmed total >= limit
            const limitReached =
                limit !== null && limit !== undefined && limit > 0 && totalGroups >= limit
            // Never show "Checking..." - always false
            const isCheckingCapacity = false
            return {
                ...candidate,
                currentGroupCount: totalGroups,
                limitReached,
                isCheckingCapacity,
            }
        })
        console.log("[DashboardFriends] invite candidates hydrated", mapped)
        return mapped
    }, [inviteCandidates, candidateCapacity])

    const groupDialogs = (
        <>
            <Dialog
                open={isCreateGroupDialogOpen}
                onOpenChange={(open) => {
                    setIsCreateGroupDialogOpen(open)
                    if (!open) {
                        resetGroupForm()
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a learning circle</DialogTitle>
                        <DialogDescription>
                            Give your group a name and choose whether it should be private or visible to all members.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-group-name">Group name</Label>
                            <Input
                                id="new-group-name"
                                value={newGroupName}
                                onChange={(event) => setNewGroupName(event.target.value)}
                                placeholder="e.g. UX Study Circle"
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">Private group</p>
                                <p className="text-xs text-muted-foreground">
                                    Only invited members can view and join a private group.
                                </p>
                            </div>
                            <Switch checked={newGroupPrivate} onCheckedChange={setNewGroupPrivate} className="data-[state=unchecked]:dark:bg-gray-400/20" />
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsCreateGroupDialogOpen(false)
                                resetGroupForm()
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCreateGroup} disabled={isCreatingGroup || !newGroupName.trim()}>
                            {isCreatingGroup ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <PlusCircle className="w-4 h-4 mr-2" />
                            )}
                            Create group
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isRenameGroupDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        resetRenameDialog()
                        return
                    }
                    if (renameGroupTarget) {
                        setRenameGroupValue(renameGroupTarget.name || "")
                    }
                    setIsRenameGroupDialogOpen(true)
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename group</DialogTitle>
                        <DialogDescription>Update the name that your members will see.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="rename-group-name">Group name</Label>
                            <Input
                                id="rename-group-name"
                                value={renameGroupValue}
                                onChange={(event) => setRenameGroupValue(event.target.value)}
                                placeholder="e.g. Product Design Cohort"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={resetRenameDialog} disabled={isRenamingGroup}>
                            Cancel
                        </Button>
                        <Button onClick={submitRenameGroup} disabled={isRenamingGroup || !renameGroupValue.trim()}>
                            {isRenamingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4 mr-2" />}
                            Save changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )

    const tabConfig = [
        { key: "friends", label: "My Friends", count: friendCount, icon: Users },
        { key: "groups", label: "Groups", count: groupCount, icon: Users2 },
        { key: "received", label: "Requests", count: pendingReceivedCount, icon: Clock },
        { key: "sent", label: "Sent", count: pendingSentCount, icon: UserPlus },
    ] as const

    const indicatorWidth = 100 / tabConfig.length
    const activeIndex = Math.max(0, tabConfig.findIndex((item) => item.key === activeTab))
 
    if (isSearchViewOpen) {
    return (
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="space-y-6"
            >
                <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-background/90 backdrop-blur-3xl shadow-[0_0_45px_rgba(99,102,241,0.35)]">
                    <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-48 opacity-60"
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 28, ease: "linear" }}
                        style={{
                            background: "radial-gradient(circle at center, rgba(129,140,248,0.28), transparent 60%)",
                        }}
                    />
                    <div className="relative space-y-6 p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.35em] text-muted-foreground/70">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <span>Discover Creators</span>
                        </div>
                                <h2 className="text-2xl sm:text-3xl font-semibold text-foreground bg-gradient-to-r from-blue-500 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    Find Learning Allies
                                </h2>
                                <p className="text-sm text-muted-foreground/85">
                                    Search across the NEXT4LEARN universe and build your circle of mentors, collaborators, and lifelong friends.
                                </p>
                    </div>
                            <div className="flex items-center gap-2">
                                <Button
                            variant="outline" 
                                    onClick={() => setIsSearchViewOpen(false)}
                                    className="rounded-xl border-white/20 bg-background/60"
                                >
                                    Back to Friends
                                </Button>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/30 via-blue-500/20 to-purple-500/30 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 blur-2xl transition-opacity duration-500" />
                            <div className="relative flex items-center rounded-2xl border border-white/10 bg-background/70 backdrop-blur-xl pr-2 shadow-inner shadow-primary/10">
                                <Search className="w-5 h-5 ml-4 text-muted-foreground/70" />
                                <Input
                                    placeholder="Search by username, email, or vibe..."
                                    value={searchDraft}
                                    onChange={(e) => setSearchDraft(e.target.value)}
                                    className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-5 text-base"
                                    autoFocus
                                />
                                {searchDraft && (
                        <Button
                                        variant="ghost"
                                        size="icon"
                                        className="ml-auto h-8 w-8 rounded-full text-muted-foreground/70 hover:text-foreground"
                                        onClick={() => {
                                            setSearchDraft("")
                                            setDebouncedQuery("")
                                            activeSearchRef.current = ""
                                            setSearchState(createSearchState())
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
                        </div>

                        {recentSearches.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {recentSearches.map((term) => (
                <Button
                                        key={term}
                                        size="sm"
                                        variant="outline"
                                        className="rounded-full border-white/15 bg-background/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/10"
                                        onClick={() => setSearchDraft(term)}
                                    >
                                        {term}
                </Button>
                                ))}
                            </div>
                        )}

                        <div className="relative rounded-2xl border border-white/10 bg-background/70 backdrop-blur-xl px-1 py-4">
                            <div className="max-h-[420px] overflow-y-auto scrollbar-hide space-y-3 pr-2">
                                {searchState.initialLoading && (
                                    <div className="space-y-3">
                                        {Array.from({ length: 3 }).map((_, idx) => (
                                            <div
                                                key={idx}
                                                className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 via-white/2 to-white/5"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-pulse" />
                                                <div className="flex items-center gap-4 p-4 opacity-70">
                                                    <div className="h-12 w-12 rounded-full bg-white/10" />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-3 w-1/3 rounded-full bg-white/10" />
                                                        <div className="h-3 w-1/2 rounded-full bg-white/5" />
                            </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}

                                {!searchState.initialLoading && searchState.items.length > 0 && (
                                    <div className="space-y-3">
                                        {searchState.items.map((candidate: any, idx) => {
                                            const candidateKey = getCandidateKey(candidate)
                                            const status = getCandidateStatus(candidate)
                                            const statusMeta = STATUS_META[status]
                                            const profileId = candidate?.id ?? candidate?.documentId ?? candidate?.document_id
                                            const isProcessingCandidate = processingId === `candidate-${candidateKey}`
                                            const limitReached = !canAddMore && status === "available"

                                            return (
                                    <motion.div
                                                    key={candidateKey}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-primary/5 to-purple-500/10 backdrop-blur-lg p-4 shadow-lg shadow-primary/10"
                                                >
                                                    <div
                                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                                        style={{
                                                            background: "radial-gradient(120% 120% at 15% 15%, rgba(129,140,248,0.25), transparent), radial-gradient(120% 120% at 85% 85%, rgba(236,72,153,0.2), transparent)",
                                                        }}
                                                    />
                                                    <div className="relative flex items-center gap-4">
                                                <QuantumAvatar
                                                            src={getAvatarUrl(candidate.avatar) ?? undefined}
                                                            alt={candidate.username || candidate.email}
                                                            size="lg"
                                                    variant="neon"
                                                />
                                                        <div className="flex-1 min-w-0 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold text-foreground truncate">
                                                                    {candidate.username || candidate.email}
                                                                </p>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn("rounded-full border", statusMeta.badgeClass)}
                                                                >
                                                                    {statusMeta.label}
                                                                </Badge>
                                                            </div>
                                                            {candidate.bio && (
                                                                <p className="text-xs text-muted-foreground/90 line-clamp-2">
                                                                    {candidate.bio}
                                                                </p>
                                                            )}
                                                            {statusMeta.description && (
                                                                <p className="text-[11px] text-muted-foreground/70">
                                                                    {statusMeta.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                            {status === "available" ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={async () => {
                                                                        await handleAddFriend(candidate)
                                                                    }}
                                                                    disabled={isProcessingCandidate || limitReached}
                                                                    className={cn(
                                                                        "bg-gradient-to-r from-blue-500 to-purple-500 text-white",
                                                                        !limitReached && "hover:from-blue-600 hover:to-purple-600",
                                                                        (isProcessingCandidate || limitReached) && "opacity-60 cursor-not-allowed"
                                                                    )}
                                                                >
                                                                    {isProcessingCandidate ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                    ) : limitReached ? (
                                                                        "Limit reached"
                                                        ) : (
                                                            <>
                                                                <UserPlus className="w-4 h-4 mr-1" />
                                                                            Invite
                                                            </>
                                                        )}
                                                    </Button>
                                                            ) : status === "incoming" ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setIsSearchViewOpen(false)
                                                                        setActiveTab("received")
                                                                    }}
                                                                >
                                                                    View request
                                                                </Button>
                                                            ) : status === "outgoing" ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleCancelRequest(candidate.pendingRequestId)}
                                                                >
                                                                    Cancel request
                                                                </Button>
                                                            ) : status === "friend" ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled
                                                                    className="text-emerald-500"
                                                                >
                                                                    Friends
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled
                                                                >
                                                                    That's you
                                                                </Button>
                                                            )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                                onClick={() => profileId && router.push(`/users/${profileId}`)}
                                                                className="text-muted-foreground hover:text-foreground"
                                                                disabled={!profileId}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                        </div>
                                                </div>
                                            </motion.div>
                                            )
                                        })}
                                    </div>
                                )}

                                {!searchState.initialLoading && searchState.items.length === 0 && debouncedQuery && (
                                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
                                        <Users className="w-12 h-12 opacity-30" />
                                        <div>
                                            <p className="font-semibold text-foreground">No matches found</p>
                                            <p className="text-sm text-muted-foreground/80">Adjust your search terms or keep scrolling to discover more users.</p>
                                        </div>
                                </div>
                            )}

                                <div ref={searchEndRef} />

                                {searchState.loading && !searchState.initialLoading && (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            )}
                        </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        )
    }

    if (groupViewMode === "detail" && selectedGroup) {
        const detailIdentifier = selectedGroup.documentId || selectedGroup.id
        const detailMemberCount = selectedGroupMembers.length + (selectedGroupOwnerInfo.ownerId ? 1 : 0)
        const detailUpdatedLabel = selectedGroup.updatedAt
            ? new Date(selectedGroup.updatedAt).toLocaleDateString()
            : "recently"
        const isGroupPrivate = !!(selectedGroup.isPrivate ?? (selectedGroup as any)?.privete ?? (selectedGroup as any)?.private)
        const isLeavingGroup = groupProcessingId === `leave-${detailIdentifier}`
        const isDeletingGroup = groupProcessingId === `delete-${detailIdentifier}`
        const isPrivacyUpdating = groupProcessingId === `privacy-${detailIdentifier}`
        const memberSlotsRemaining = Math.max(userGroupMemberLimit - detailMemberCount, 0)
        const memberLimitReached = isCurrentUserGroupOwner && memberSlotsRemaining <= 0
        const inviteCtaDisabled = memberLimitReached
        const privacyToggleLabel = isGroupPrivate ? "Make group public" : "Make group private"

        return (<>
            <div className="space-y-8">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <button
                        onClick={() => {
                            setGroupViewMode("list")
                            setSelectedGroup(null)
                            setIsInviteFriendsModalOpen(false)
                            resetRenameDialog()
                        }}
                        className="flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        My Friends
                    </button>
                    <span>/</span>
                    <span className="font-medium text-foreground">{selectedGroup.name || "Group"}</span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-primary/20">
                            <Users2 className="w-8 h-8 text-primary" />
                            </div>
                            <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                                            {selectedGroup.name || "Untitled group"}
                                        {isCurrentUserGroupOwner && <Crown className="w-5 h-5 text-yellow-400" />}
                                </h2>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                        "flex items-center gap-1 border border-border/60",
                                        isGroupPrivate ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-500"
                                        )}
                                    >
                                        <Shield className="w-3 h-3" />
                                        {isGroupPrivate ? "Private" : "Public"}
                                    </Badge>
                                <Badge variant="outline" className="border-border/60 bg-background/80 text-muted-foreground">
                                        Updated {detailUpdatedLabel}
                                    </Badge>
                            </div>
                            <p className="text-muted-foreground">
                                {detailMemberCount} member{detailMemberCount === 1 ? "" : "s"} in this group
                                {isCurrentUserGroupOwner ? (
                                    <span className={`ml-2 text-xs ${memberLimitReached ? "text-destructive/80" : "text-muted-foreground/70"}`}>
                                            {memberLimitReached
                                                ? "Member limit reached"
                                            : `${memberSlotsRemaining} slot${memberSlotsRemaining === 1 ? "" : "s"} remaining`}
                                    </span>
                                ) : (
                                    <span className="ml-2 text-xs text-muted-foreground/70">
                                        • Owned by {selectedGroupOwnerInfo.ownerName || "Unknown"}
                                    </span>
                                )}
                            </p>
                            </div>
                        </div>

                <div className="flex flex-wrap items-center gap-2">
                            {isCurrentUserGroupOwner ? (
                                <>
                                    <Button
                                        onClick={() => {
                                            if (memberLimitReached) {
                                                toast.error("You've reached the member limit for this group")
                                                return
                                            }
                                            if (inviteCandidates.length === 0) {
                                                toast.info("No friends available to add right now. Invite new friends first.")
                                            }
                                            handleOpenGroup(selectedGroup, "add");
                                        }}
                                    className="relative bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                                    size="sm"
                                    disabled={memberLimitReached}
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" />
                                    {memberLimitReached ? "Member limit reached" : "Add Member"}
                                    {memberLimitReached && (
                                        <span className="absolute -top-2 -right-2">
                                            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-transparent shadow-sm">
                                                Pro
                                            </Badge>
                                        </span>
                                    )}
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    if (memberLimitReached) {
                                                        toast.error("You've reached the member limit for this group")
                                                        return
                                                    }
                                                handleOpenGroup(selectedGroup, "add")
                                                }}
                                            disabled={memberLimitReached}
                                            >
                                                <UserPlus className="w-4 h-4 mr-2" />
                                            Add Member
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                            onSelect={(event) => {
                                                event.preventDefault()
                                                event.stopPropagation()
                                            }}
                                            className="flex items-center justify-between gap-4"
                                        >
                                            <div className="flex flex-col leading-tight">
                                                <span className="text-xs text-muted-foreground">Privacy</span>
                                                <span className="text-sm font-medium text-foreground">
                                                    {isGroupPrivate ? "Private" : "Public"}
                                                </span>
                                            </div>
                                            <Switch
                                                checked={isGroupPrivate}
                                                onCheckedChange={(value) => handleToggleGroupPrivacy(selectedGroup, value)}
                                                disabled={isPrivacyUpdating}
                                                className="h-4 w-9"
                                            />
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleRenameGroup(selectedGroup)}>
                                                <Edit3 className="w-4 h-4 mr-2" />
                                                Rename group
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDeleteGroup(selectedGroup)}
                                                className="text-destructive"
                                            >
                                            {isDeletingGroup ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4 mr-2" />
                                            )}
                                                Delete group
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleLeaveGroup(selectedGroup)}
                                    disabled={isLeavingGroup}
                                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                                >
                                    {isLeavingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                                    Leave group
                                </Button>
                            )}
                        </div>
                    </div>

                <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-sm shadow-sm">
                    <div className="p-6 sm:p-8 space-y-6">

                        {(() => {
                            const ownerSource = selectedGroup?.owner?.data?.attributes ?? selectedGroup?.owner ?? null
                            const ownerId = extractNumericId(ownerSource?.id ?? selectedGroupOwnerInfo.ownerId)
                            const ownerDocumentId = extractDocumentId(ownerSource) ?? selectedGroupOwnerInfo.ownerDocumentId
                            const ownerProfile =
                                (ownerId !== undefined ? groupProfileMap.byId[ownerId] : undefined) ||
                                (ownerDocumentId ? groupProfileMap.byDoc[ownerDocumentId] : undefined)
                            const ownerEmail = ownerProfile?.email || ownerSource?.email || ownerSource?.attributes?.email || ownerSource?.username || undefined
                            const ownerBio = ownerProfile?.bio || ownerSource?.bio || ownerSource?.about || ownerSource?.attributes?.bio || undefined
                            const ownerAvatar = getAvatarUrl(ownerProfile?.avatar ?? ownerSource?.avatar ?? ownerSource?.attributes?.avatar) ?? undefined
                            const ownerIsCurrentUser =
                                (ownerId !== undefined && currentUserNumericId !== undefined && ownerId === currentUserNumericId) ||
                                (ownerDocumentId && currentUserDocId && ownerDocumentId === currentUserDocId)

                            const memberCards = (selectedGroupMembers
                                .map((rawMember: any) => {
                                    const memberData = rawMember?.data?.attributes ?? rawMember?.attributes ?? rawMember
                                    const memberId = extractNumericId(memberData?.id ?? rawMember?.id ?? rawMember)
                                    const memberDocId = extractDocumentId(memberData) ?? extractDocumentId(rawMember)
                                    if (memberId === undefined && !memberDocId) return null
                                    const profile =
                                        (memberId !== undefined ? groupProfileMap.byId[memberId] : undefined) ||
                                        (memberDocId ? groupProfileMap.byDoc[memberDocId] : undefined)
                                    const resolvedId = memberId ?? (profile?.id !== undefined ? Number(profile.id) : undefined)
                                    if (resolvedId === undefined) return null
                                    const memberName =
                                        profile?.username ||
                                        profile?.email ||
                                        profile?.name ||
                                        memberData?.username ||
                                        memberData?.email ||
                                        memberData?.name ||
                                        (typeof rawMember === "string" ? rawMember : `Member #${resolvedId}`)
                                    const memberEmail = profile?.email || memberData?.email || undefined
                                    const memberBio = profile?.bio || memberData?.bio || memberData?.about || undefined
                                    const disableRemoval = groupProcessingId === `remove-${detailIdentifier}-${resolvedId}`
                                    const isCurrentUser =
                                        currentUserNumericId !== undefined && currentUserNumericId === resolvedId
                                    const avatar = getAvatarUrl(profile?.avatar ?? memberData?.avatar) ?? undefined
                                    const profileId = resolvedId ?? extractDocumentId(memberData) ?? extractDocumentId(rawMember)

                                    return {
                                        key: `${detailIdentifier}-${resolvedId}`,
                                        id: resolvedId,
                                        name: isCurrentUser ? "You" : memberName,
                                        role: "Member" as const,
                                        email: memberEmail,
                                        bio: memberBio,
                                        avatar,
                                        initials: getInitials(memberName),
                                        profileId,
                                        canRemove:
                                            isCurrentUserGroupOwner &&
                                            selectedGroupOwnerInfo.ownerId !== resolvedId &&
                                            !isCurrentUser,
                                        onRemove: () => handleRemoveMemberFromGroup(selectedGroup, resolvedId),
                                        disableRemoval,
                                    } as ParticipantEntry
                                })
                                .filter((card): card is ParticipantEntry => card !== null))

                            const participants: ParticipantEntry[] = [
                                ownerSource
                                    ? {
                                          key: `${detailIdentifier}-owner`,
                                          id: ownerId,
                                          name: ownerIsCurrentUser
                                              ? "You"
                                              : ownerProfile?.username || ownerProfile?.email || ownerProfile?.name || selectedGroupOwnerInfo.ownerName || "Owner",
                                          role: "Owner",
                                          email: ownerEmail,
                                          bio: ownerBio,
                                          avatar: ownerAvatar,
                                          initials: getInitials(ownerProfile?.username || ownerProfile?.email || selectedGroupOwnerInfo.ownerName || "Owner"),
                                          profileId: ownerId ?? ownerDocumentId,
                                          canRemove: false,
                                          onRemove: () => {},
                                          disableRemoval: false,
                                      }
                                    : null,
                                ...memberCards,
                            ].filter((participant): participant is ParticipantEntry => participant !== null)

    return (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium uppercase tracking-[0.32em] text-muted-foreground">
                                            Participants
                                        </span>
                                        <Badge variant="outline" className="border-border/60 bg-background/80 text-muted-foreground">
                                            {participants.length} total
                                        </Badge>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 h-fit">
                                        {participants.map((participant) => (
                                            <div
                                                key={participant.key}
                                                className="h-fit relative flex flex-col gap-4 rounded-2xl border border-border/60 bg-white p-5 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/70"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <QuantumAvatar
                                                        src={participant.avatar}
                                                        alt={participant.name}
                                                        size="md"
                                                        variant="neon"
                                                        fallback={participant.initials}
                                                    />
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <p className="text-base font-semibold text-foreground truncate">
                                                            {participant.name}
                                                        </p>
                                                        <p className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                                                            {participant.role}
                                                        </p>
                                                        {participant.email && (
                                                            <p className="text-xs text-muted-foreground truncate">{participant.email}</p>
                                                        )}
                                                        {participant.bio && (
                                                            <p className="text-[11px] text-muted-foreground/80 line-clamp-2">
                                                                {participant.bio}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {participant.canRemove && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={participant.onRemove}
                                                            disabled={participant.disableRemoval}
                                                            className="absolute top-4 right-4 h-8 w-8 rounded-full border border-destructive/30 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            {participant.disableRemoval ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <X className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 justify-center"
                                                        onClick={() => {
                                                            if (!participant.profileId) return
                                                            router.push(`/users/${participant.profileId}`)
                                                        }}
                                                        disabled={!participant.profileId}
                                                    >
                                                        View Profile
                                                    </Button>
                                            </div>
                                            </div>
                                        ))}
                                        {participants.length === 0 && (
                                            <div className="sm:col-span-1 xl:col-span-2 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-background/60 px-6 py-16 text-center text-muted-foreground">
                                                <Users className="w-10 h-10 opacity-30" />
                                                <div className="space-y-1">
                                                    <p className="text-base font-semibold text-foreground">No other members yet</p>
                                                    <p className="text-sm text-muted-foreground/75">
                                                        Use the invite actions above to add collaborators to this group.
                                                    </p>
                                                </div>
                                            </div>
                                )}
                            </div>
                        </div>
                            )
                        })()}
                    </div>
                </div>

                    {/* All additional controls are surfaced via the header actions menu. */}
                </div>

                {groupDialogs}
            <InviteFriendsToGroupModal
                open={isInviteFriendsModalOpen && !!selectedGroup}
                onClose={() => setIsInviteFriendsModalOpen(false)}
                groupName={selectedGroup?.name || "Group"}
                candidates={selectedGroup ? inviteCandidatesWithCapacity : []}
                onAddMember={(candidate) => {
                    if (!selectedGroup) return
                    handleInviteMemberToGroup(selectedGroup, candidate.id)
                }}
                isProcessing={(candidateId) => {
                    if (!selectedGroup) return false
                    const identifier = selectedGroup.documentId || selectedGroup.id
                    return groupProcessingId === `add-${identifier}-${candidateId}`
                }}
                isLimitReached={(() => {
                    if (!selectedGroup || !isCurrentUserGroupOwner) return false
                    const count = selectedGroupMembers.length + (selectedGroupOwnerInfo.ownerId ? 1 : 0)
                    return count >= userGroupMemberLimit
                })()}
                memberLimit={userGroupMemberLimit}
                currentCount={selectedGroup ? selectedGroupMembers.length + (selectedGroupOwnerInfo.ownerId ? 1 : 0) : undefined}
                slotsRemaining={selectedGroup ? Math.max(userGroupMemberLimit - (selectedGroupMembers.length + (selectedGroupOwnerInfo.ownerId ? 1 : 0)), 0) : undefined}
            />
        </>)
    }

    return (
        <>
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
                            <span className="font-semibold text-foreground">{pendingReceivedCount}</span>
                            <span>Pending Requests</span>
                        </div>
                    </div>
                    {isNearLimit && (
                        <Badge 
                            variant="outline" 
                            className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 flex items-center gap-1"
                        >
                            <AlertCircle className="w-3 h-3" />
                            {friendLimit - friendCount} slots remaining
                        </Badge>
                    )}
                    {!canAddMore && (
                        <Button
                                onClick={() => router.push('/pricing')}
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
                    onClick={() => setIsSearchViewOpen(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 flex items-center gap-2"
                >
                    <Search className="w-4 h-4" />
                    Search & Add Friends
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="relative">
                    <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50 rounded-xl relative">
                        {activeIndicator && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                    className="absolute inset-y-0 bg-background rounded-lg z-0 shadow-sm dark:bg-gray-400/30"
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                style={{
                                    width: `${indicatorWidth}%`,
                                    left: `${indicatorWidth * activeIndex}%`
                                }}
                            />
                        )}
                        {tabConfig.map((tab) => {
                            const IconComponent = tab.icon
                            return (
                        <TabsTrigger 
                                    key={tab.key}
                                    value={tab.key}
                            className="data-[state=active]:bg-transparent relative z-10"
                                    onClick={() => setActiveTab(tab.key)}
                        >
                                    <IconComponent className="w-4 h-4 mr-2" />
                                    {tab.label} ({tab.count})
                        </TabsTrigger>
                            )
                        })}
                    </TabsList>
                </div>

                {/* My Friends Tab */}
                <TabsContent value="friends" className="mt-6">
                    {friendsState.initialLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : friendsState.items.length === 0 ? (
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
                            {friendsState.items.map((friend: any, index: number) => {
                                const friendRecord = friend?.data?.attributes ?? friend?.attributes ?? friend
                                const friendId = extractNumericId(friendRecord?.id ?? friend?.id ?? friend)
                                const friendDocId = extractDocumentId(friendRecord) ?? extractDocumentId(friend)
                                const profile =
                                    (friendId !== undefined ? friendProfileMap.byId[friendId] : undefined) ||
                                    (friendDocId ? friendProfileMap.byDoc[friendDocId] : undefined)
                                const displayName =
                                    profile?.username ||
                                    profile?.email ||
                                    profile?.name ||
                                    friendRecord?.username ||
                                    friendRecord?.email ||
                                    friendRecord?.name ||
                                    (typeof friend === "string" ? friend : friendId !== undefined ? `Friend #${friendId}` : "Friend")
                                const avatarSrc = getAvatarUrl(profile?.avatar ?? friendRecord?.avatar) ?? undefined
                                const bio = profile?.bio || friendRecord?.bio || friendRecord?.about || undefined
                                const key = friendId ?? friendDocId ?? `friend-${index}`

                                return (
                                <motion.div
                                     key={key}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4 hover:bg-card/70 transition-all"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <QuantumAvatar
                                             src={avatarSrc}
                                             alt={displayName}
                                            size="lg"
                                            variant="quantum"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-foreground truncate">
                                                 {displayName}
                                            </p>
                                             {bio && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                     {bio}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                             onClick={() => {
                                                 const profileId = friendId ?? friendDocId
                                                 if (!profileId) return
                                                 router.push(`/users/${profileId}`)
                                             }}
                                            className="flex-1"
                                        >
                                            <ExternalLink className="w-3 h-3 mr-1" />
                                            View Profile
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                             onClick={() => {
                                                 if (friendId === undefined) return
                                                 handleUnfriend(friendId)
                                             }}
                                             disabled={friendId === undefined || processingId === friendId}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                             {friendId !== undefined && processingId === friendId ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <UserMinus className="w-3 h-3" />
                                            )}
                                        </Button>
                                    </div>
                                </motion.div>
                                 )
                             })}
                        </div>
                    )}

                    <div ref={friendsEndRef} />
                    {friendsState.loading && !friendsState.initialLoading && (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}
                </TabsContent>

                {/* Groups Tab */}
                <TabsContent value="groups" className="mt-6">
                    {userGroupsState.initialLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : userGroupsState.items.length === 0 ? (
                        <Card className="liquid-glass-card p-12 text-center">
                            <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-foreground mb-2">No groups yet</p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Create your first learning circle to collaborate with friends on shared goals.
                                </p>
                                {isGroupLimitReached ? (
                                <Button
                                    disabled
                                    className="relative inline-flex items-center gap-2 rounded-full border border-amber-400/60 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/25 px-5 py-2 text-sm font-semibold text-amber-900 shadow-[0_18px_45px_-20px_rgba(217,119,6,0.8)]"
                                >
                                    <span className="pointer-events-none absolute inset-0 rounded-full bg-white/10 opacity-60" />
                                    <span className="relative flex items-center gap-2">
                                        <Crown className="w-4 h-4 text-amber-500" />
                                        Group limit reached
                                    </span>
                                    <span className="absolute -top-2 -right-2">
                                        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-transparent shadow-sm">
                                            Pro
                                        </Badge>
                                    </span>
                                </Button>
                            ) : (
                                    <Button
                                        onClick={() => {
                                            resetGroupForm()
                                            setIsCreateGroupDialogOpen(true)
                                        }}
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 flex items-center gap-2"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        Start a Group
                                    </Button>
                                )}
                        </Card>
                    ) : (
                        <>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Your circles</h3>
                                <p className="text-sm text-muted-foreground">
                                    {groupCount} active group{groupCount === 1 ? "" : "s"}. Collaborate with friends on shared goals.
                                </p>
                            </div>
                            {isGroupLimitReached ? (
                                <div className="flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50/80 px-3 py-1 text-amber-700">
                                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-transparent shadow-sm">
                                        Pro
                                    </Badge>
                                    <span className="text-sm font-medium">Group limit reached</span>
                                </div>
                            ) : (
                                <Button
                                    onClick={() => {
                                        resetGroupForm()
                                        setIsCreateGroupDialogOpen(true)
                                    }}
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 flex items-center gap-2"
                                >
                                    <PlusCircle className="w-4 h-4" />
                                    Create group
                                </Button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {userGroupsState.items.map((group) => {
                                    const identifier = group.documentId || group.id
                                const owner = group.owner as any
                                const ownerId = typeof owner === "object" ? owner?.id ?? owner?.attributes?.id : owner
                                    const ownerDocumentId =
                                        typeof owner === "object"
                                            ? owner?.documentId || owner?.document_id || owner?.attributes?.documentId
                                            : undefined
                                    const ownerName =
                                        typeof owner === "object"
                                            ? owner?.username || owner?.email || owner?.name || "Owner"
                                            : owner
                                    const isOwner =
                                        (currentUserNumericId !== undefined && ownerId
                                            ? Number(ownerId) === Number(currentUserNumericId)
                                            : false) ||
                                        (currentUserDocId && ownerDocumentId
                                            ? ownerDocumentId === currentUserDocId
                                            : false)
                                const members = Array.isArray(group.users) ? group.users : []
                                const memberCount = members.length + (owner ? 1 : 0)
                                    const memberLimitReachedForGroup = isOwner && memberCount >= userGroupMemberLimit
                                    const memberSlotsRemainingForGroup = Math.max(userGroupMemberLimit - memberCount, 0)
                                const isPrivate = !!(group.isPrivate ?? (group as any)?.privete ?? (group as any)?.private)
                                const previewMembers = members.slice(0, 4)
                                const remainingPreview = Math.max(memberCount - (previewMembers.length + (owner ? 1 : 0)), 0)
                                const updatedLabel = group.updatedAt ? new Date(group.updatedAt).toLocaleDateString() : "recently"
                                const isLeavingGroup = groupProcessingId === `leave-${identifier}`
                                const isDeletingGroup = groupProcessingId === `delete-${identifier}`
                                const isPrivacyUpdating = groupProcessingId === `privacy-${identifier}`

                                return (
                                    <motion.div
                                            key={identifier}
                                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.25 }}
                                        onClick={() => handleOpenGroup(group)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault()
                                                handleOpenGroup(group)
                                            }
                                        }}
                                        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background/80 via-primary/10 to-purple-500/15 backdrop-blur-2xl p-6 shadow-xl shadow-primary/15 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                    >
                                        {memberLimitReachedForGroup && (
                                            <Badge className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-transparent shadow-sm">
                                                Pro
                                            </Badge>
                                        )}
                                        <div
                                            className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                                            style={{
                                                background:
                                                    "radial-gradient(120% 120% at 15% 15%, rgba(129,140,248,0.22), transparent), radial-gradient(120% 120% at 85% 85%, rgba(236,72,153,0.18), transparent)",
                                            }}
                                        />
                                        <div className="relative space-y-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-2 text-foreground">
                                                            <Users2 className="w-5 h-5 text-primary" />
                                                            <h3 className="text-lg font-semibold leading-snug truncate">
                                                        {group.name || "Untitled Group"}
                                                    </h3>
                                                            {isOwner && <Crown className="w-4 h-4 text-yellow-400" />}
                                                </div>
                                                        {isPrivate && (
                                                            <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary flex items-center gap-1">
                                                                <Shield className="w-3 h-3" />
                                                                Private
                                                            </Badge>
                                                        )}
                                                        {!isPrivate && (
                                                            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-500">
                                                                Public
                                                            </Badge>
                                                        )}
                                            </div>
                                                    <p className="text-xs text-muted-foreground/80">
                                                        Owned by {isOwner ? "you" : ownerName || "Unknown"}
                                                    </p>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={(event) => event.stopPropagation()}
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {isOwner ? (
                                                            <>
                                                                <DropdownMenuItem
                                                                    onClick={(event) => {
                                                                        event.stopPropagation()
                                                                        handleOpenGroup(group)
                                                                    }}
                                                                >
                                                                    <Users2 className="w-4 h-4 mr-2" />
                                                                    Open group
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(event) => {
                                                                        event.stopPropagation()
                                                                        if (memberLimitReachedForGroup) {
                                                                            toast.error("You've reached the member limit for this group")
                                                                            return
                                                                        }
                                                                        handleOpenGroup(group, "add")
                                                                    }}
                                                                    disabled={memberLimitReachedForGroup}
                                                                >
                                                                    <UserPlus className="w-4 h-4 mr-2" />
                                                                    {memberLimitReachedForGroup ? "Limit reached" : "Add Member"}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(event) => {
                                                                        event.stopPropagation()
                                                                        handleRenameGroup(group)
                                                                    }}
                                                                >
                                                                    <Edit3 className="w-4 h-4 mr-2" />
                                                                    Rename
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onSelect={(event) => {
                                                                        event.preventDefault()
                                                                        event.stopPropagation()
                                                                    }}
                                                                    className="flex items-center justify-between gap-4"
                                                                >
                                                                    <div className="flex flex-col leading-tight">
                                                                        <span className="text-xs text-muted-foreground">Privacy</span>
                                                                        <span className="text-sm font-medium text-foreground">
                                                                            {isPrivate ? "Private" : "Public"}
                                                                        </span>
                                                                    </div>
                                                                    <Switch
                                                                        checked={isPrivate}
                                                                        onCheckedChange={(value) => handleToggleGroupPrivacy(group, value)}
                                                                        disabled={isPrivacyUpdating}
                                                                        className="h-4 w-9"
                                                                    />
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={(event) => {
                                                                        event.stopPropagation()
                                                                        handleDeleteGroup(group)
                                                                    }}
                                                                    className="text-destructive focus:text-destructive"
                                                                >
                                                                    {isDeletingGroup ? (
                                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                    ) : (
                                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                                    )}
                                                                    Delete group
                                                                </DropdownMenuItem>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <DropdownMenuItem
                                                                    onClick={(event) => {
                                                                        event.stopPropagation()
                                                                        handleOpenGroup(group)
                                                                    }}
                                                                >
                                                                    <Users2 className="w-4 h-4 mr-2" />
                                                                    View group
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={(event) => {
                                                                        event.stopPropagation()
                                                                        handleLeaveGroup(group)
                                                                    }}
                                                                    className="text-destructive focus:text-destructive"
                                                                >
                                                                    {isLeavingGroup ? (
                                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                    ) : (
                                                                        <LogOut className="w-4 h-4 mr-2" />
                                                                    )}
                                                                    Leave group
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                <span>{memberCount} member{memberCount === 1 ? "" : "s"}</span>
                                                <span>Updated {updatedLabel}</span>
                                                {isOwner ? (
                                                    <span className="text-muted-foreground/60">
                                                        {memberLimitReachedForGroup
                                                            ? "Member limit reached"
                                                            : `${memberSlotsRemainingForGroup} member slot${memberSlotsRemainingForGroup === 1 ? "" : "s"} left`}
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="flex items-center justify-between pt-3">
                                                <div className="flex items-center -space-x-3">
                                                    <div
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-background"
                                                        title={isOwner ? "You" : ownerName}
                                                    >
                                                        <QuantumAvatar src={getAvatarUrl((owner as any)?.avatar) ?? undefined} alt={ownerName} size="sm" />
                                                    </div>
                                                    {previewMembers.map((member: any, idx: number) => {
                                                        const memberRecord = member?.data?.attributes ?? member?.attributes ?? member
                                                        const memberId = extractNumericId(memberRecord?.id ?? member?.id ?? member) ?? idx
                                                        const name =
                                                            memberRecord?.username ||
                                                            memberRecord?.email ||
                                                            memberRecord?.name ||
                                                            `Member #${memberId}`
                                                        const avatar = getAvatarUrl(memberRecord?.avatar) ?? undefined
                                                        return (
                                                            <div
                                                                key={`${identifier}-${memberId}`}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-background"
                                                                title={name}
                                                            >
                                                                <QuantumAvatar src={avatar} alt={name} size="sm" />
                                                            </div>
                                                        )
                                                    })}
                                                    {remainingPreview > 0 && (
                                                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold text-muted-foreground">
                                                            +{remainingPreview}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground/70">Tap to open group →</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                         </>
                    )}

                    <div ref={groupsEndRef} />

                    {userGroupsState.loading && !userGroupsState.initialLoading && (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}
                </TabsContent>

                {/* Received Requests Tab */}
                <TabsContent value="received" className="mt-6">
                    {requestsInitialLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : !hasFriendRequests && !hasGroupInvites ? (
                        <Card className="liquid-glass-card p-12 text-center">
                            <Clock className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-foreground mb-2">No pending requests</p>
                            <p className="text-sm text-muted-foreground">You don't have any pending requests right now.</p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {hasFriendRequests && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Friend requests
                                    </h4>
                            {receivedState.items.map((request) => {
                                const fromUser = request.from_user as any
                                if (!fromUser) return null
                                    const requestIdentifier = request.documentId || request.id
                                
                                return (
                                    <motion.div
                                            key={requestIdentifier}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4 flex items-center gap-4"
                                    >
                                        <QuantumAvatar
                                            src={getAvatarUrl(fromUser.avatar) ?? undefined}
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
                                                        {new Date(request.requested_at!).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleAcceptRequest(request)}
                                                    disabled={processingId === requestIdentifier || !canAddMore}
                                                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                                            >
                                                    {processingId === requestIdentifier ? (
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
                                                    onClick={() => handleRejectRequest(request)}
                                                    disabled={processingId === requestIdentifier}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                    {processingId === requestIdentifier ? (
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

                            {hasGroupInvites && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Group invitations
                                    </h4>
                                    {groupReceivedInvitesState.items.map((invitation) => {
                                        const inviter = normalizeUserRelation(invitation.from_user)
                                        const groupRecord =
                                            invitation.user_group_group?.data ?? invitation.user_group_group ?? null
                                        const groupAttributes = groupRecord?.attributes ?? groupRecord ?? {}
                                        const groupName = groupAttributes?.name ?? "Unnamed group"
                                        const isPrivateGroup =
                                            Boolean(groupAttributes?.private ?? groupAttributes?.is_private ?? groupAttributes?.isPrivate)
                                        const invitationKey = invitation.documentId ?? invitation.id
                                        const processing =
                                            groupInvitationProcessingId === `accept-${invitationKey}` ||
                                            groupInvitationProcessingId === `reject-${invitationKey}`
                                        const invitedAt = invitation.invited_at ?? invitation.createdAt

                                        return (
                                            <motion.div
                                                key={`group-invite-${invitationKey}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                    <div className="flex items-start gap-3 md:gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <QuantumAvatar
                                                                src={getAvatarUrl(inviter?.avatar) ?? undefined}
                                                                alt={inviter?.username || inviter?.email || "Inviter"}
                                                                size="lg"
                                                                variant="quantum"
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="text-sm text-muted-foreground">
                                                                    {inviter?.username || inviter?.email || "Someone"} invited you to
                                                                </p>
                                                                <p className="text-lg font-semibold text-foreground">
                                                                    {groupName}
                                                                </p>
                                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={cn(
                                                                            "border-border/60 text-xs",
                                                                            isPrivateGroup
                                                                                ? "bg-primary/10 text-primary"
                                                                                : "bg-emerald-500/10 text-emerald-500"
                                                                        )}
                                                                    >
                                                                        {isPrivateGroup ? "Private group" : "Public group"}
                                                                    </Badge>
                                                                    {invitedAt && (
                                                                        <Badge variant="outline" className="border-border/60 text-xs">
                                                                            Invited {new Date(invitedAt).toLocaleString()}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleAcceptGroupInvite(invitation)}
                                                            disabled={processing}
                                                            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
                                                        >
                                                            {groupInvitationProcessingId === `accept-${invitationKey}` ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                                    Accept invite
                                                                </>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleRejectGroupInvite(invitation)}
                                                            disabled={processing}
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            {groupInvitationProcessingId === `reject-${invitationKey}` ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <XCircle className="w-4 h-4 mr-1" />
                                                                    Decline
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                    <div ref={receivedEndRef} />
                    {requestsLoading && !requestsInitialLoading && (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}
                </TabsContent>

                {/* Sent Requests Tab */}
                <TabsContent value="sent" className="mt-6">
                    {sentInitialLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : !hasFriendSentRequests && !hasGroupSentInvites ? (
                        <Card className="liquid-glass-card p-12 text-center">
                            <UserPlus className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-foreground mb-2">No sent requests</p>
                            <p className="text-sm text-muted-foreground">You haven't sent any requests yet.</p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {hasFriendSentRequests && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Friend requests
                                    </h4>
                            {sentState.items.map((request) => {
                                const toUser = request.to_user as any
                                if (!toUser) return null
                                    const requestIdentifier = request.documentId || request.id
                                
                                return (
                                    <motion.div
                                            key={requestIdentifier}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4 flex items-center gap-4"
                                    >
                                        <QuantumAvatar
                                            src={getAvatarUrl(toUser.avatar) ?? undefined}
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
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 mt-2"
                                                    >
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

                            {hasGroupSentInvites && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Group invitations
                                    </h4>
                                    {groupSentInvitesState.items.map((invitation) => {
                                        const invitee = normalizeUserRelation(invitation.to_user)
                                        const groupRecord =
                                            invitation.user_group_group?.data ?? invitation.user_group_group ?? null
                                        const groupAttributes = groupRecord?.attributes ?? groupRecord ?? {}
                                        const groupName = groupAttributes?.name ?? "Unnamed group"
                                        const invitationKey = invitation.documentId ?? invitation.id
                                        const invitedAt = invitation.invited_at ?? invitation.createdAt

                                        return (
                                            <motion.div
                                                key={`sent-group-invite-${invitationKey}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                                            >
                                                <div className="flex items-start gap-3 md:gap-4">
                                                    <QuantumAvatar
                                                        src={getAvatarUrl(invitee?.avatar) ?? undefined}
                                                        alt={invitee?.username || invitee?.email || "Invitee"}
                                                        size="lg"
                                                        variant="quantum"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-muted-foreground">
                                                            Invitation sent to{" "}
                                                            <span className="font-semibold text-foreground">
                                                                {invitee?.username || invitee?.email || "Unknown member"}
                                                            </span>
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Group • <span className="font-semibold">{groupName}</span>
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                                                Pending
                                                            </Badge>
                                                            {invitedAt && (
                                                                <Badge variant="outline" className="border-border/60 text-xs">
                                                                    {new Date(invitedAt).toLocaleString()}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        const profileId = invitee?.documentId ?? invitee?.id
                                                        if (!profileId) return
                                                        router.push(`/users/${profileId}`)
                                                    }}
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    View Profile
                                                </Button>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                    <div ref={sentEndRef} />
                    {sentLoading && !sentInitialLoading && (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}
                </TabsContent>
            </Tabs>

                {groupDialogs}
        </div>
            <InviteFriendsToGroupModal
                open={isInviteFriendsModalOpen && !!selectedGroup}
                onClose={() => setIsInviteFriendsModalOpen(false)}
                groupName={selectedGroup?.name || "Group"}
                candidates={selectedGroup ? inviteCandidatesWithCapacity : []}
                onAddMember={(candidate) => {
                    if (!selectedGroup) return
                    handleInviteMemberToGroup(selectedGroup, candidate.id)
                }}
                isProcessing={(candidateId) => {
                    if (!selectedGroup) return false
                    const identifier = selectedGroup.documentId || selectedGroup.id
                    return groupProcessingId === `add-${identifier}-${candidateId}`
                }}
                isLimitReached={(() => {
                    if (!selectedGroup || !isCurrentUserGroupOwner) return false
                    const count = selectedGroupMembers.length + (selectedGroupOwnerInfo.ownerId ? 1 : 0)
                    return count >= userGroupMemberLimit
                })()}
                memberLimit={userGroupMemberLimit}
                currentCount={selectedGroup ? selectedGroupMembers.length + (selectedGroupOwnerInfo.ownerId ? 1 : 0) : undefined}
                slotsRemaining={selectedGroup ? Math.max(userGroupMemberLimit - (selectedGroupMembers.length + (selectedGroupOwnerInfo.ownerId ? 1 : 0)), 0) : undefined}
            />
        </>
    )
}

