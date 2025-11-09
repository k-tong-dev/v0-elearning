"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
import { getUserGroupsForUserPaginated, updateGroupName } from "@/integrations/strapi/instructor-group"
import type { InstructorGroup } from "@/integrations/strapi/instructor-group"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { QuantumAvatar } from "@/components/ui/quantum-avatar"
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
    UserCog
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/utils/utils"

const DEFAULT_FRIEND_LIMIT = 1000;
const PAGE_SIZE = 10;

type ListState<T> = {
    items: T[]
    page: number
    hasMore: boolean
    loading: boolean
    initialLoading: boolean
    total: number
    currentQuery: string
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

    const friendsEndRef = useRef<HTMLDivElement | null>(null)
    const receivedEndRef = useRef<HTMLDivElement | null>(null)
    const sentEndRef = useRef<HTMLDivElement | null>(null)
    const groupsEndRef = useRef<HTMLDivElement | null>(null)
    const searchEndRef = useRef<HTMLDivElement | null>(null)
    const activeSearchRef = useRef("")

    const resetStates = useCallback(() => {
        setFriendsState(createInitialState())
        setReceivedState(createInitialState())
        setSentState(createInitialState())
        setUserGroupsState(createInitialState())
    }, [])

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
        return { numeric, doc }
    }, [sentState.items])

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
        return { numeric, doc }
    }, [receivedState.items])

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

    const getCandidateKey = useCallback((candidate: any) => {
        const docId = extractDocumentId(candidate)
        if (docId) return `doc:${docId}`
        const numericId = extractNumericId(candidate?.id ?? candidate)
        if (numericId !== undefined) return `id:${numericId}`
        if (typeof candidate.email === "string") return `email:${candidate.email}`
        return `candidate:${Math.random().toString(36).slice(2)}`
    }, [])

    const currentUserNumericId = React.useMemo(() => extractNumericId(user?.id), [user?.id])
    const currentUserDocId = React.useMemo(() => extractDocumentId(user), [user])

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
    }, [user?.id, resetStates, fetchFriends, fetchReceived, fetchSent, fetchUserGroups])

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
            router.push('/subscription')
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
            await cancelFriendRequest(requestId)
            toast.success("Request cancelled")
            fetchSearchResults(activeSearchRef.current, 1, false)
            refreshAll()
        } catch (error: any) {
            toast.error(error.message || "Failed to cancel request")
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

    const handleAcceptRequest = async (request: FriendRequest) => {
        if (!user?.id) return

        // Check friend limit
        if (friendsState.total >= friendLimit) {
            toast.error(`Friend limit reached (${friendLimit}). Please upgrade your subscription to add more friends.`)
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
            refreshAll()
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

    const friendCount = friendsState.total || friendsState.items.length
    const groupCount = userGroupsState.total || userGroupsState.items.length
    const isNearLimit = friendCount >= friendLimit * 0.9
    const canAddMore = friendCount < friendLimit
    const pendingReceivedCount = receivedState.total || receivedState.items.length
    const pendingSentCount = sentState.total || sentState.items.length

    const tabConfig = [
        { key: "friends", label: "My Friends", count: friendCount, icon: Users },
        { key: "groups", label: "Groups", count: groupCount, icon: UserCog },
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
                                    Search across the CamEdu universe and build your circle of mentors, collaborators, and lifelong friends.
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
                            <div className="max-h-[420px] overflow-y-auto space-y-3 pr-2">
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
                                className="absolute inset-y-0 bg-background rounded-lg z-0 shadow-sm"
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
                            {friendsState.items.map((friend: any) => (
                                <motion.div
                                    key={friend.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4 hover:bg-card/70 transition-all"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <QuantumAvatar
                                            src={getAvatarUrl(friend.avatar) ?? undefined}
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
                            <p className="text-sm text-muted-foreground">
                                Create or join a user group to collaborate with friends on shared learning paths.
                            </p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {userGroupsState.items.map((group) => {
                                const owner = group.owner as any
                                const ownerId = typeof owner === "object" ? owner?.id ?? owner?.attributes?.id : owner
                                const isOwner = user?.id && ownerId ? Number(ownerId) === Number(user.id) : false
                                const members = Array.isArray(group.users) ? group.users : []
                                const memberCount = members.length + (owner ? 1 : 0)

                                return (
                                    <motion.div
                                        key={group.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-primary/5 via-background to-purple-500/10 backdrop-blur-xl p-5 shadow-lg shadow-primary/10"
                                    >
                                        <div className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-500" style={{
                                            background: "radial-gradient(120% 120% at 15% 15%, rgba(129,140,248,0.18), transparent), radial-gradient(120% 120% at 85% 85%, rgba(236,72,153,0.15), transparent)"
                                        }} />
                                        <div className="relative space-y-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground/70">User Group</p>
                                                    <h3 className="text-xl font-semibold text-foreground mt-1">
                                                        {group.name || "Untitled Group"}
                                                    </h3>
                                                </div>
                                                <Badge variant="outline" className="rounded-full border-white/20 bg-background/60">
                                                    {isOwner ? "Owner" : "Member"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <span>{memberCount} member{memberCount === 1 ? "" : "s"}</span>
                                                {owner && (
                                                    <span>
                                                        {isOwner ? "You" : owner?.username || owner?.email || "Owner"}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                                                <Clock className="w-3 h-3" />
                                                <span>Updated {group.updatedAt ? new Date(group.updatedAt).toLocaleDateString() : "recently"}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1"
                                                    disabled
                                                >
                                                    Coming Soon
                                                </Button>
                                                {isOwner && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={async () => {
                                                            const nextName = prompt("Rename group", group.name)
                                                            if (!nextName || !nextName.trim() || nextName.trim() === group.name) return
                                                            const token = `group-${group.id}`
                                                            setProcessingId(token)
                                                            try {
                                                                await updateGroupName(group.documentId || group.id, nextName.trim(), "user")
                                                                toast.success("Group renamed")
                                                                fetchUserGroups(1)
                                                            } catch (error: any) {
                                                                toast.error(error?.message || "Failed to rename group")
                                                            } finally {
                                                                setProcessingId(null)
                                                            }
                                                        }}
                                                        disabled={processingId === `group-${group.id}`}
                                                        className="text-muted-foreground hover:text-foreground"
                                                    >
                                                        {processingId === `group-${group.id}` ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            "Rename"
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
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
                    {receivedState.initialLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : receivedState.items.length === 0 ? (
                        <Card className="liquid-glass-card p-12 text-center">
                            <Clock className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-foreground mb-2">No pending requests</p>
                            <p className="text-sm text-muted-foreground">
                                You don't have any pending friend requests at the moment.
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {receivedState.items.map((request) => {
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
                    <div ref={receivedEndRef} />
                    {receivedState.loading && !receivedState.initialLoading && (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}
                </TabsContent>

                {/* Sent Requests Tab */}
                <TabsContent value="sent" className="mt-6">
                    {sentState.initialLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : sentState.items.length === 0 ? (
                        <Card className="liquid-glass-card p-12 text-center">
                            <UserPlus className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-foreground mb-2">No sent requests</p>
                            <p className="text-sm text-muted-foreground">
                                You haven't sent any friend requests yet.
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {sentState.items.map((request) => {
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
                    <div ref={sentEndRef} />
                    {sentState.loading && !sentState.initialLoading && (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

