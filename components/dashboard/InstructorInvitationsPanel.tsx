"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Bell,
    UserPlus,
    CheckCircle2,
    XCircle,
    Clock,
    Eye,
    Loader2,
    Search,
    Trash2,
    ExternalLink,
    Crown,
    AlertCircle,
} from "lucide-react";
import {
    getInstructorInvitations,
    getUserInvitations,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation,
    markInvitationAsRead,
    getPendingInvitationsCount,
    InstructorInvitation,
} from "@/integrations/strapi/instructor-invitation";
import { strapiPublic } from "@/integrations/strapi/client";
import { Instructor, getInstructor } from "@/integrations/strapi/instructor";
import { toast } from "sonner";
import { getAvatarUrl } from "@/lib/getAvatarUrl";
import { QuantumAvatar } from "@/components/ui/quantum-avatar";
import { formatDistanceToNow } from "date-fns";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getUserInstructorGroups, getInstructorGroupsForInstructor } from "@/integrations/strapi/instructor-group";
import { getUserSubscription, Subscription } from "@/integrations/strapi/subscription";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { getInstructors } from "@/integrations/strapi/instructor";

interface InstructorInvitationsPanelProps {
    instructorId: string | number | (string | number)[];
    onUpdate?: () => void;
}

export function InstructorInvitationsPanel({
    instructorId,
    onUpdate,
}: InstructorInvitationsPanelProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [invitations, setInvitations] = useState<{
        sent: InstructorInvitation[];
        received: InstructorInvitation[];
    }>({ sent: [], received: [] });
    const [loading, setLoading] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
    const [instructorCache, setInstructorCache] = useState<Map<number | string, Instructor>>(new Map());
    
    // Limit dialog state
    const [showLimitDialog, setShowLimitDialog] = useState(false);
    const [pendingInvitationId, setPendingInvitationId] = useState<string | null>(null);
    const [userGroups, setUserGroups] = useState<any[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);

    const loadInvitations = async () => {
        setLoading(true);
        try {
            // Get received invitations (invitations sent TO this instructor or any of the user's instructors)
            let received: InstructorInvitation[] = [];
            
            // Handle both single instructor ID and array of instructor IDs
            const instructorIds = Array.isArray(instructorId) ? instructorId : [instructorId];
            
            // Fetch invitations for all instructors and combine
            const allReceivedPromises = instructorIds.map(id => getInstructorInvitations(id));
            const allReceived = await Promise.all(allReceivedPromises);
            
            // Combine and deduplicate by documentId
            const receivedMap = new Map<string, InstructorInvitation>();
            for (const receivedList of allReceived) {
                for (const inv of receivedList) {
                    const key = inv.documentId || inv.id.toString();
                    if (!receivedMap.has(key)) {
                        receivedMap.set(key, inv);
                    }
                }
            }
            received = Array.from(receivedMap.values());
            
            // Sort by invited_at (most recent first)
            received.sort((a, b) => {
                const dateA = a.invited_at ? new Date(a.invited_at).getTime() : 0;
                const dateB = b.invited_at ? new Date(b.invited_at).getTime() : 0;
                return dateB - dateA;
            });
            
            // Get sent invitations - need to get instructor's user ID first
            // Use the first instructor to get the user ID (all instructors should belong to the same user)
            let sent: InstructorInvitation[] = [];
            try {
                const firstInstructorId = instructorIds[0];
                if (firstInstructorId) {
                    // Fetch instructor using getInstructor which handles Strapi v5 numeric IDs properly
                    const instructorData = await getInstructor(firstInstructorId);
                    if (instructorData?.user) {
                        const userId = typeof instructorData.user === 'object' ? instructorData.user.id : instructorData.user;
                        if (userId) {
                            sent = await getUserInvitations(userId);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching sent invitations:", error);
            }
            
            setInvitations({ sent, received });
            
            // Pre-fetch instructors for all from_user IDs in received invitations
            // AND pre-fetch to_instructor data for sent invitations (to ensure avatars are loaded)
            const cache = new Map<number | string, Instructor>();
            
            // Cache instructors for "from" (received invitations)
            for (const invitation of received) {
                const fromUser = invitation.from_user;
                if (fromUser) {
                    const userId = typeof fromUser === 'object' ? fromUser.id : fromUser;
                    if (userId && !cache.has(userId)) {
                        try {
                            const response = await strapiPublic.get(`/api/instructors?filters[user][id][$eq]=${userId}&populate=*`);
                            const instructors = response.data?.data || [];
                            if (instructors.length > 0) {
                                cache.set(userId, instructors[0] as Instructor);
                            }
                        } catch (error) {
                            console.error(`Error fetching instructor for user ${userId}:`, error);
                        }
                    }
                }
            }
            
            // Cache to_instructor data for sent invitations (to ensure avatars are properly loaded)
            for (const invitation of sent) {
                const toInstructor = invitation.to_instructor;
                if (toInstructor) {
                    let instructorId: number | string | null = null;
                    
                    if (typeof toInstructor === 'object' && toInstructor !== null) {
                        instructorId = toInstructor.id || toInstructor.documentId;
                        
                        // Always cache the instructor if we have an ID
                        if (instructorId && !cache.has(instructorId)) {
                            // Check if avatar is missing or not properly populated
                            const hasAvatar = toInstructor.avatar && 
                                (typeof toInstructor.avatar === 'string' || 
                                 (typeof toInstructor.avatar === 'object' && (toInstructor.avatar.url || toInstructor.avatar.data)));
                            
                            if (!hasAvatar) {
                                // Avatar is missing, fetch full instructor data
                                try {
                                    const fullInstructor = await getInstructor(instructorId);
                                    if (fullInstructor) {
                                        cache.set(instructorId, fullInstructor);
                                    }
                                } catch (error) {
                                    console.error(`Error fetching full instructor data for ${instructorId}:`, error);
                                    // Still cache the partial data we have
                                    cache.set(instructorId, toInstructor as Instructor);
                                }
                            } else {
                                // Avatar is present, cache the instructor object we have
                                cache.set(instructorId, toInstructor as Instructor);
                            }
                        }
                    } else if (typeof toInstructor === 'number' || (typeof toInstructor === 'string' && !isNaN(Number(toInstructor)))) {
                        // If it's just an ID, fetch the instructor
                        instructorId = typeof toInstructor === 'number' ? toInstructor : Number(toInstructor);
                        if (instructorId && !cache.has(instructorId)) {
                            try {
                                const fullInstructor = await getInstructor(instructorId);
                                if (fullInstructor) {
                                    cache.set(instructorId, fullInstructor);
                                }
                            } catch (error) {
                                console.error(`Error fetching instructor ${instructorId}:`, error);
                            }
                        }
                    }
                }
            }
            
            setInstructorCache(cache);
            
            // Get pending count for all instructors
            const pendingCounts = await Promise.all(instructorIds.map(id => getPendingInvitationsCount(id)));
            const totalPendingCount = pendingCounts.reduce((sum, count) => sum + count, 0);
            setPendingCount(totalPendingCount);
        } catch (error) {
            console.error("Error loading invitations:", error);
            toast.error("Failed to load invitations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (instructorId) {
            loadInvitations();
        }
    }, [instructorId]);

    const handleAccept = async (invitationId: string) => {
        try {
            // Check group limit before accepting
            if (!user?.id) {
                toast.error("You must be logged in to accept invitations");
                return;
            }

            // First, fetch the invitation to get the group it's for
            let invitationGroupId: string | number | null = null;
            try {
                const invitationResponse = await strapiPublic.get(
                    `/api/user-request-requests/${invitationId}?populate=*`
                );
                const invitationData = invitationResponse.data?.data;

                const attributes = invitationData?.attributes || {};
                const userGroupRelation = attributes.user_group_group || invitationData?.user_group_group;

                if (userGroupRelation) {
                    if (userGroupRelation.data) {
                        invitationGroupId = userGroupRelation.data.attributes?.documentId || userGroupRelation.data.id;
                    } else if (typeof userGroupRelation === "object") {
                        invitationGroupId = userGroupRelation.documentId || userGroupRelation.id;
                    } else {
                        invitationGroupId = userGroupRelation;
                    }
                }
            } catch (error) {
                console.error("Error fetching invitation:", error);
                // Continue with limit check if we can't fetch invitation
            }

            // Fetch user's owned groups, member groups, and subscription
            const [ownedGroups, userInstructors, userSubscription] = await Promise.all([
                getUserInstructorGroups(user.id),
                getInstructors(user.id),
                getUserSubscription(user.id)
            ]);

            // Get all groups where user's instructors are members
            const memberGroupsPromises = userInstructors.map(instructor => 
                getInstructorGroupsForInstructor(instructor.id)
            );
            const memberGroupsArrays = await Promise.all(memberGroupsPromises);
            const memberGroups = memberGroupsArrays.flat();

            // Combine owned and member groups, removing duplicates by documentId
            const allGroupsMap = new Map<string, any>();
            
            // Add owned groups
            ownedGroups.forEach(group => {
                const key = group.documentId || group.id.toString();
                if (!allGroupsMap.has(key)) {
                    allGroupsMap.set(key, group);
                }
            });
            
            // Add member groups (will skip duplicates)
            memberGroups.forEach(group => {
                const key = group.documentId || group.id.toString();
                if (!allGroupsMap.has(key)) {
                    allGroupsMap.set(key, group);
                }
            });

            const allGroups = Array.from(allGroupsMap.values());
            setUserGroups(allGroups);
            
            if (userSubscription?.subscription && typeof userSubscription.subscription === 'object') {
                setSubscription(userSubscription.subscription as Subscription);
            }

            // Get subscription data for limit check
            const subData = userSubscription?.subscription;
            const subObject = typeof subData === 'object' ? subData as Subscription : null;
            const groupLimit = subObject?.amount_instructor_group_allowed || (user as any)?.instructor_group_limit;
            // Count total unique groups (owned + member)
            const currentGroupCount = allGroups.length;
            
            // Check if the invitation is for a group the user is already in
            let isExistingGroup = false;
            if (invitationGroupId) {
                // Check if this group is already in user's groups
                isExistingGroup = allGroups.some(group => {
                    const groupId = group.documentId || group.id.toString();
                    const invitationIdStr = invitationGroupId.toString();
                    return groupId === invitationIdStr || group.id.toString() === invitationIdStr;
                });
            }
            
            // Only check limit if it's a NEW group (not an existing group user is already in)
            // If user is already in the group, they're just adding another instructor, not joining a new group
            if (!isExistingGroup && groupLimit && groupLimit > 0 && currentGroupCount >= groupLimit) {
                // Show friendly dialog instead of error
                setPendingInvitationId(invitationId);
                setShowLimitDialog(true);
                return;
            }

            // If no limit issue, proceed with acceptance
            const success = await acceptInvitation(invitationId);
            if (success) {
                toast.success("Invitation accepted! Both instructors are now collaborators.");
                loadInvitations();
                onUpdate?.();
            } else {
                toast.error("Failed to accept invitation");
            }
        } catch (error: any) {
            console.error("Accept error:", error);
            
            // Check if error is about group limit
            const errorMessage = error.message || "";
            if (errorMessage.toLowerCase().includes("limit") || errorMessage.toLowerCase().includes("group")) {
                setPendingInvitationId(invitationId);
                setShowLimitDialog(true);
            } else {
                toast.error(errorMessage || "Failed to accept invitation");
            }
        }
    };

    const handleUpgradePlan = () => {
        setShowLimitDialog(false);
        router.push("/pricing");
    };

    const handleManageGroups = () => {
        setShowLimitDialog(false);
        // Navigate to instructors tab with groups view
        router.push("/dashboard?tab=instructors&view=groups");
    };

    const handleReject = async (invitationId: string) => {
        try {
            const success = await rejectInvitation(invitationId);
            if (success) {
                toast.success("Invitation rejected");
                loadInvitations();
            } else {
                toast.error("Failed to reject invitation");
            }
        } catch (error) {
            console.error("Reject error:", error);
            toast.error("Failed to reject invitation");
        }
    };

    const handleCancel = async (invitationId: string) => {
        if (!confirm("Are you sure you want to cancel this invitation?")) return;
        
        try {
            const success = await cancelInvitation(invitationId);
            if (success) {
                toast.success("Invitation cancelled");
                loadInvitations();
            } else {
                toast.error("Failed to cancel invitation");
            }
        } catch (error) {
            console.error("Cancel error:", error);
            toast.error("Failed to cancel invitation");
        }
    };

    const handleMarkAsRead = async (invitationId: string) => {
        await markInvitationAsRead(invitationId);
        loadInvitations();
    };

    const getInstructorFromInvitation = (invitation: InstructorInvitation, type: "from" | "to"): Instructor | null => {
        if (type === "to") {
            // For "to", try to get from cache first (pre-loaded with full data including avatar)
            const instructor = invitation.to_instructor;
        if (typeof instructor === "object" && instructor !== null) {
                const instructorId = instructor.id || instructor.documentId;
                
                // Check cache first (has full data with avatar)
                if (instructorId && instructorCache.has(instructorId)) {
                    return instructorCache.get(instructorId) || null;
                }
                
                // If not in cache, check if avatar is missing
                if (!instructor.avatar || (typeof instructor.avatar === 'object' && !instructor.avatar.url && !instructor.avatar.data)) {
                    // Avatar is missing, return null to trigger fallback
                    return null;
                }
                
                // Return the instructor object from invitation (has avatar)
                return instructor;
            }
            
            // If it's just an ID, try to get from cache
            if ((typeof instructor === 'number' || (typeof instructor === 'string' && !isNaN(Number(instructor))))) {
                const instructorId = typeof instructor === 'number' ? instructor : Number(instructor);
                return instructorCache.get(instructorId) || null;
        }
            
        return null;
        } else {
            // For "from", we get the instructor from the cache (pre-loaded during loadInvitations)
            const fromUser = invitation.from_user;
            if (!fromUser) return null;
            
            const userId = typeof fromUser === 'object' ? fromUser.id : fromUser;
            if (!userId) return null;
            
            return instructorCache.get(userId) || null;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "accepted":
                return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case "rejected":
                return <XCircle className="w-4 h-4 text-red-500" />;
            case "cancelled":
                return <XCircle className="w-4 h-4 text-gray-500" />;
            default:
                return <Clock className="w-4 h-4 text-yellow-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "accepted":
                return "bg-green-500/20 text-green-600 dark:text-green-400";
            case "rejected":
                return "bg-red-500/20 text-red-600 dark:text-red-400";
            case "cancelled":
                return "bg-gray-500/20 text-gray-600 dark:text-gray-400";
            default:
                return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-0">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Instructor Invitations</h2>
                    <p className="text-muted-foreground">Manage your collaboration invitations</p>
                </div>
                {pendingCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-full">
                        <Bell className="w-4 h-4" />
                        <span className="font-semibold">{pendingCount} new</span>
                    </div>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "received" | "sent")}>
                <div className="flex justify-end mb-6">
                    <TabsList className="relative grid grid-cols-2 w-auto max-w-md p-1.5 bg-gradient-to-r from-background/50 via-muted/30 to-background/50 backdrop-blur-xl rounded-xl border border-border/50 shadow-lg overflow-hidden">
                        {/* Liquid glass background effect with tracking movement */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-2xl"
                            animate={{
                                backgroundPosition: ["0% 0%", "100% 100%"],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatType: "reverse",
                            }}
                            style={{
                                backgroundSize: "200% 200%",
                            }}
                        />
                        {/* Animated sliding indicator */}
                        <motion.div
                            className="absolute bottom-0 h-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-lg border border-white/20 shadow-lg"
                            layoutId="activeInvitationTab"
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                            }}
                            style={{
                                width: "50%",
                                left: activeTab === "received" ? "0%" : "50%",
                            }}
                        />
                        <TabsTrigger 
                            value="received" 
                            className="relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:text-foreground data-[state=active]:font-semibold data-[state=active]:dark:bg-transparent"
                        >
                            <motion.div
                                animate={{ rotate: activeTab === "received" ? [0, 10, -10, 0] : 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Bell className="w-4 h-4" />
                            </motion.div>
                            Received
                            {invitations.received && invitations.received.filter(i => i.invitation_status === "pending" && !i.read).length > 0 && (
                                <Badge className="ml-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-1.5 py-0.5">
                                    {invitations.received.filter(i => i.invitation_status === "pending" && !i.read).length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger 
                            value="sent" 
                            className="relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:text-foreground data-[state=active]:font-semibold data-[state=active]:dark:bg-transparent"
                        >
                            <motion.div
                                animate={{ rotate: activeTab === "sent" ? [0, 10, -10, 0] : 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <UserPlus className="w-4 h-4" />
                            </motion.div>
                            Sent
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Received Invitations */}
                <TabsContent value="received" className="mt-6 space-y-4">
                    {!invitations.received || invitations.received.length === 0 ? (
                        <div className="text-center py-12 bg-card/50 rounded-lg border border-border">
                            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No received invitations</p>
                        </div>
                    ) : (
                        (invitations.received || []).map((invitation) => {
                            const fromInstructor = getInstructorFromInvitation(invitation, "from");
                            return (
                                <motion.div
                                    key={invitation.documentId}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-6 bg-card/50 rounded-lg border ${
                                        !invitation.read && invitation.invitation_status === "pending"
                                            ? "border-primary/50 bg-primary/5"
                                            : "border-border"
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {fromInstructor ? (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const userId = fromInstructor.user && typeof fromInstructor.user === 'object' 
                                                        ? (fromInstructor.user.id || fromInstructor.user.documentId || fromInstructor.user)
                                                        : fromInstructor.user;
                                                    if (userId) {
                                                        const userPath = typeof userId === 'number' ? `/users/${userId}` : `/users/${userId}`;
                                                        window.open(userPath, '_blank');
                                                    } else {
                                                        console.warn("No user ID found for instructor:", fromInstructor);
                                                        toast.error("User profile not available");
                                                    }
                                                }}
                                                className="hover:opacity-80 transition-opacity cursor-pointer"
                                            >
                                                <QuantumAvatar
                                                    src={getAvatarUrl(fromInstructor.avatar) ?? undefined}
                                                    alt={fromInstructor.name || "Instructor"}
                                                    size="lg"
                                                    variant="quantum"
                                                    showStatus
                                                    status="online"
                                                    verified={fromInstructor.is_verified}
                                                    interactive
                                                />
                                            </button>
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                                <UserPlus className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h3 
                                                        className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            const userId = fromInstructor?.user && typeof fromInstructor.user === 'object' 
                                                                ? (fromInstructor.user.id || fromInstructor.user.documentId || fromInstructor.user)
                                                                : fromInstructor?.user;
                                                            if (userId) {
                                                                const userPath = typeof userId === 'number' ? `/users/${userId}` : `/users/${userId}`;
                                                                window.open(userPath, '_blank');
                                                            } else {
                                                                console.warn("No user ID found for instructor:", fromInstructor);
                                                                toast.error("User profile not available");
                                                            }
                                                        }}
                                                    >
                                                        {fromInstructor?.name || "Unknown Instructor"}
                                                    </h3>
                                                    {(() => {
                                                        const userId = fromInstructor?.user && typeof fromInstructor.user === 'object' 
                                                            ? fromInstructor.user.id 
                                                            : fromInstructor?.user;
                                                        return userId ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                                onClick={() => {
                                                                    window.open(`/users/${userId}`, '_blank');
                                                                }}
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                            </Button>
                                                        ) : null;
                                                    })()}
                                                </div>
                                                <div>
                                                    {invitation.invited_at && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatDistanceToNow(new Date(invitation.invited_at), {
                                                                addSuffix: true,
                                                            })}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(invitation.invitation_status)}
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                            invitation.invitation_status
                                                        )}`}
                                                    >
                                                        {invitation.invitation_status}
                                                    </span>
                                                </div>
                                            </div>

                                            {invitation.message && (
                                                <p className="text-sm text-muted-foreground mb-4 p-3 bg-background rounded-lg border border-border">
                                                    {invitation.message}
                                                </p>
                                            )}

                                            {invitation.invitation_status === "pending" && (
                                                <div className="flex items-center gap-2 mt-4">
                                                    <Button
                                                        onClick={() => handleAccept(invitation.documentId)}
                                                        size="sm"
                                                        className="bg-green-500 hover:bg-green-600 text-white"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleReject(invitation.documentId)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                        Reject
                                                    </Button>
                                                    {!invitation.read && (
                                                        <Button
                                                            onClick={() =>
                                                                handleMarkAsRead(invitation.documentId)
                                                            }
                                                            size="sm"
                                                            variant="ghost"
                                                            className="ml-auto"
                                                        >
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Mark as read
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </TabsContent>

                {/* Sent Invitations */}
                <TabsContent value="sent" className="mt-6 space-y-4">
                    {!invitations.sent || invitations.sent.length === 0 ? (
                        <div className="text-center py-12 bg-card/50 rounded-lg border border-border">
                            <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No sent invitations</p>
                        </div>
                    ) : (
                        (invitations.sent || []).map((invitation) => {
                            const toInstructor = getInstructorFromInvitation(invitation, "to");
                            return (
                                <motion.div
                                    key={invitation.documentId}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-6 bg-card/50 rounded-lg border border-border"
                                >
                                    <div className="flex items-start gap-4">
                                        {toInstructor ? (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    // Navigate to instructor profile instead of user profile
                                                    const instructorPath = `/instructors/${toInstructor.documentId || toInstructor.id}`;
                                                    window.open(instructorPath, '_blank');
                                                }}
                                                className="hover:opacity-80 transition-opacity cursor-pointer"
                                            >
                                                <QuantumAvatar
                                                    src={getAvatarUrl(toInstructor.avatar) ?? undefined}
                                                    alt={toInstructor.name || "Instructor"}
                                                    size="lg"
                                                    variant="quantum"
                                                    showStatus
                                                    status="online"
                                                    verified={toInstructor.is_verified}
                                                    interactive
                                                />
                                            </button>
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                                <UserPlus className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h3 
                                                        className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            // Navigate to instructor profile
                                                            if (toInstructor) {
                                                                const instructorPath = `/instructors/${toInstructor.documentId || toInstructor.id}`;
                                                                window.open(instructorPath, '_blank');
                                                            }
                                                        }}
                                                    >
                                                        {toInstructor?.name || "Unknown Instructor"}
                                                    </h3>
                                                    {toInstructor && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                // Navigate to instructor profile
                                                                const instructorPath = `/instructors/${toInstructor.documentId || toInstructor.id}`;
                                                                window.open(instructorPath, '_blank');
                                                                }}
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                            </Button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(invitation.invitation_status)}
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                            invitation.invitation_status
                                                        )}`}
                                                    >
                                                        {invitation.invitation_status}
                                                    </span>
                                                </div>
                                            </div>
                                            {invitation.invited_at && (
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    Sent{" "}
                                                    {formatDistanceToNow(new Date(invitation.invited_at), {
                                                        addSuffix: true,
                                                    })}
                                                </p>
                                            )}

                                            {invitation.message && (
                                                <p className="text-sm text-muted-foreground mb-4 p-3 bg-background rounded-lg border border-border">
                                                    {invitation.message}
                                                </p>
                                            )}

                                            {invitation.invitation_status === "pending" && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Button
                                                        onClick={() => handleCancel(invitation.documentId)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        onClick={async () => {
                                                            if (confirm("Are you sure you want to delete this invitation?")) {
                                                                try {
                                                                    const success = await cancelInvitation(invitation.documentId);
                                                                    if (success) {
                                                                        toast.success("Invitation deleted");
                                                                        loadInvitations();
                                                                    } else {
                                                                        toast.error("Failed to delete invitation");
                                                                    }
                                                                } catch (error) {
                                                                    console.error("Delete error:", error);
                                                                    toast.error("Failed to delete invitation");
                                                                }
                                                            }
                                                        }}
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </TabsContent>
            </Tabs>

            {/* Group Limit Reached Dialog */}
            <AlertDialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
                <AlertDialogContent className="w-fit">
                    <AlertDialogHeader>
                        <div className="flex items-center justify-center mb-4">
                            <div className="p-3 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                                <Crown className="w-8 h-8 text-amber-500" />
                            </div>
                        </div>
                        <AlertDialogTitle className="text-2xl font-bold text-center">
                            Group Limit Reached
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center mt-4 space-y-2">
                            <span className="text-base font-saira">
                                You've reached your instructor group limit ({subscription?.amount_instructor_group_allowed || (user as any)?.instructor_group_limit || 0} groups).
                            </span>
                            <span className="text-sm text-muted-foreground">
                                To join this new group, you can either:
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <div className="space-y-3 mt-4">
                        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Crown className="w-4 h-4 text-blue-500" />
                                Upgrade Your Plan
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                Get access to more instructor groups and unlock additional features.
                            </p>
                        </div>
                        
                        <div className="p-4 rounded-lg bg-gradient-to-br from-gray-500/10 to-slate-500/10 border border-gray-500/20">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Trash2 className="w-4 h-4 text-gray-500" />
                                Manage Your Groups
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                Delete or leave a group you're no longer using to free up space.
                            </p>
                        </div>
                    </div>

                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-6">
                        <AlertDialogCancel onClick={() => setShowLimitDialog(false)} className="flex-1 sm:flex-none">
                            Cancel
                        </AlertDialogCancel>
                        <Button
                            variant="outline"
                            onClick={handleManageGroups}
                            className="flex-1 sm:flex-none border"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Manage Groups
                        </Button>
                        <AlertDialogAction
                            onClick={handleUpgradePlan}
                            className="w-fit flex flex-row p-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg"
                        >
                            <Crown className="w-4 h-4 mr-2" />
                            Upgrade Plan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

