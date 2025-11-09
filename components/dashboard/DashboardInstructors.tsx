"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Crown, Users, DollarSign, CheckCircle, XCircle, UserPlus, Bell, ExternalLink, FolderOpen, ArrowLeft, Search, MoreVertical, Lock, Users2, Edit3 } from "lucide-react";
import { QuantumAvatar } from "@/components/ui/quantum-avatar";
import { getInstructors, deleteInstructor, Instructor, getInstructor } from "@/integrations/strapi/instructor";
import { getCollaboratingInstructors, getPendingInvitationsCount } from "@/integrations/strapi/instructor-invitation";
import { getUserSubscription, calculateSubscriptionBilling, Subscription } from "@/integrations/strapi/subscription";
import { getUserInstructorGroups, getInstructorGroupsForInstructor, InstructorGroup, removeInstructorFromGroup, deleteInstructorGroup, addInstructorToGroup, addInstructorsToGroup, getInstructorGroup, updateGroupName } from "@/integrations/strapi/instructor-group";
import { toast } from "sonner";
import CreateInstructorForm from "./CreateInstructorForm";
import { InstructorInvitationsPanel } from "./InstructorInvitationsPanel";
import { InviteInstructorToGroupModal } from "./InviteInstructorToGroupModal";
import { CreateGroupModal } from "./CreateGroupModal";
import { SelectInstructorsModal } from "./SelectInstructorsModal";
import { getAvatarUrl } from "@/lib/getAvatarUrl";
import { FreePlanAgreementPopup } from "./FreePlanAgreementPopup";
import { getMissingFreePlans } from "@/integrations/strapi/subscription";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface DashboardInstructorsProps {
    onCreateInstructor?: () => void;
}

type ViewMode = "instructors" | "group" | "invitations" | "edit";

export function DashboardInstructors({ onCreateInstructor }: DashboardInstructorsProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [userSub, setUserSub] = useState<any>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
    const [activeTab, setActiveTab] = useState<"list" | "invitations">("list");
    const [collaboratingInstructors, setCollaboratingInstructors] = useState<Instructor[]>([]);
    const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
    
    // Group management state
    const [viewMode, setViewMode] = useState<ViewMode>("instructors");
    const [selectedGroup, setSelectedGroup] = useState<InstructorGroup | null>(null);
    const [groups, setGroups] = useState<InstructorGroup[]>([]);
    const [groupInstructors, setGroupInstructors] = useState<Instructor[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [groupSearchQuery, setGroupSearchQuery] = useState("");
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showSelectInstructorsModal, setShowSelectInstructorsModal] = useState(false);
    const [availableInstructorsForSelection, setAvailableInstructorsForSelection] = useState<Instructor[]>([]);
    const [groupInstructorsMap, setGroupInstructorsMap] = useState<Map<string | number, Instructor[]>>(new Map());
    
    // Free plan popup state
    const [showFreePlanPopup, setShowFreePlanPopup] = useState(false);
    const [missingFreePlans, setMissingFreePlans] = useState<any[]>([]);

    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [renamingGroup, setRenamingGroup] = useState<InstructorGroup | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [renaming, setRenaming] = useState(false);

    const numericUserId = useMemo(() => (user?.id ? Number(user.id) : undefined), [user?.id]);
    const documentUserId: string | undefined = user?.documentId ?? undefined;

    const isCurrentUserOwner = useCallback(
        (owner: any): boolean => {
            if (!owner) return false;
            const ownerNumeric = typeof owner === "object" ? owner.id : owner;
            const ownerDocumentId = typeof owner === "object" ? owner.documentId : (typeof owner === "string" ? owner : undefined);

            if (numericUserId !== undefined && ownerNumeric !== undefined) {
                const parsed = Number(ownerNumeric);
                if (!Number.isNaN(parsed) && parsed === numericUserId) {
                    return true;
                }
            }

            if (documentUserId && ownerDocumentId && ownerDocumentId === documentUserId) {
                return true;
            }

            return false;
        },
        [numericUserId, documentUserId]
    );

    // Helper function to get instructor profile URL
    const getInstructorProfileUrl = (instructor: Instructor): string => {
        return `/instructors/${instructor.documentId || instructor.id}`;
    };

    // Handle instructor card click
    const handleInstructorClick = (instructor: Instructor, e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) {
            return;
        }
        const profileUrl = getInstructorProfileUrl(instructor);
        router.push(profileUrl);
    };

    const openRenameDialog = useCallback((group: InstructorGroup) => {
        setRenamingGroup(group);
        setRenameValue(group.name);
        setRenameDialogOpen(true);
    }, []);

    const closeRenameDialog = useCallback(() => {
        setRenameDialogOpen(false);
        setRenamingGroup(null);
        setRenameValue("");
    }, []);

    const loadGroups = useCallback(async () => {
        if (!user?.id) return;
        setLoadingGroups(true);
        try {
            const ownedGroups = await getUserInstructorGroups(user.id);
            const userInstructors = await getInstructors(user.id);
            const memberGroupsMap = new Map<number, InstructorGroup>();

            for (const instructor of userInstructors) {
                try {
                    const groupsForInstructor = await getInstructorGroupsForInstructor(instructor.id);
                    for (const group of groupsForInstructor) {
                        if (!ownedGroups.some(g => g.id === group.id)) {
                            memberGroupsMap.set(group.id, group);
                        }
                    }
                } catch (error) {
                    console.error(`Error loading groups for instructor ${instructor.id}:`, error);
                }
            }

            const allGroups = [...ownedGroups, ...Array.from(memberGroupsMap.values())];
            setGroups(allGroups);

            const instructorsMap = new Map<string | number, Instructor[]>();
            for (const group of allGroups) {
                if (group.instructors && Array.isArray(group.instructors)) {
                    const instructorsList: Instructor[] = [];
                    for (const inst of group.instructors) {
                        if (typeof inst === "number") {
                            const instructorData = await getInstructorAvatarById(inst);
                            if (instructorData) {
                                instructorsList.push(instructorData);
                            }
                        } else if (inst && typeof inst === "object" && "id" in inst) {
                            const mappedInst = await getInstructorAvatarById((inst as Instructor).id);
                            if (mappedInst) {
                                instructorsList.push(mappedInst);
                            }
                        }
                    }
                    instructorsMap.set(group.id, instructorsList);
                }
            }
            setGroupInstructorsMap(instructorsMap);
        } catch (error) {
            console.error("Error loading groups:", error);
            toast.error("Failed to load groups");
        } finally {
            setLoadingGroups(false);
        }
    }, [user?.id]);

    const submitRename = useCallback(async () => {
        if (!renamingGroup || !renameValue.trim()) {
            toast.error("Please enter a group name");
            return;
        }

        setRenaming(true);
        try {
            await updateGroupName(renamingGroup.documentId || renamingGroup.id, renameValue.trim(), "instructor");
            toast.success("Group name updated");
            closeRenameDialog();
            await loadGroups();
            if (viewMode === "group" && selectedGroup && selectedGroup.id === renamingGroup.id) {
                const refreshedGroup = await getInstructorGroup(renamingGroup.id);
                if (refreshedGroup) {
                    setSelectedGroup(refreshedGroup);
                }
            }
        } catch (error: any) {
            console.error("Rename error:", error);
            toast.error(error.message || "Failed to rename group");
        } finally {
            setRenaming(false);
        }
    }, [renamingGroup, renameValue, closeRenameDialog, loadGroups, viewMode, selectedGroup]);

    const loadData = useCallback(async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const [instructorsData, userSubscription] = await Promise.all([
                getInstructors(user.id),
                getUserSubscription(user.id)
            ]);

            setInstructors(instructorsData);
            setUserSub(userSubscription);

            if (userSubscription?.subscription && typeof userSubscription.subscription === 'object') {
                setSubscription(userSubscription.subscription as Subscription);
            }

            if (instructorsData.length > 0) {
                const primaryInstructor = instructorsData[0];
                try {
                    const [collaborators, pendingCount] = await Promise.all([
                        getCollaboratingInstructors(primaryInstructor.id),
                        getPendingInvitationsCount(primaryInstructor.id)
                    ]);
                    setCollaboratingInstructors(collaborators);
                    setPendingInvitationsCount(pendingCount);
                } catch (error) {
                    console.error("Error loading collaborating instructors:", error);
                    setCollaboratingInstructors([]);
                    setPendingInvitationsCount(0);
                }
            } else {
                setCollaboratingInstructors([]);
                setPendingInvitationsCount(0);
            }

            await loadGroups();
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load instructors");
        } finally {
            setLoading(false);
        }
    }, [user?.id, loadGroups]);

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        loadData();
    }, [user?.id, loadData]);

    /**
     * Get instructor with avatar by ID - ensures avatar is properly fetched
     * This function uses getInstructor which already handles avatar extraction via mapInstructor
     */
    const getInstructorAvatarById = async (instructorId: string | number): Promise<Instructor | null> => {
        try {
            return await getInstructor(instructorId);
        } catch (error) {
            console.error(`Error fetching instructor avatar for ${instructorId}:`, error);
            return null;
        }
    };

    const loadGroupInstructors = async (group: InstructorGroup) => {
        if (!group.instructors || !Array.isArray(group.instructors)) {
            setGroupInstructors([]);
            return;
        }

        const instructorsList: Instructor[] = [];
        for (const inst of group.instructors) {
            // Use helper function to ensure avatar is properly fetched
            const instructorId = typeof inst === 'number' ? inst : (inst && typeof inst === 'object' && 'id' in inst ? inst.id : null);
            if (instructorId) {
                const instructorData = await getInstructorAvatarById(instructorId);
                if (instructorData) {
                    instructorsList.push(instructorData);
                }
            }
        }
        setGroupInstructors(instructorsList);
    };

    const handleGroupClick = async (group: InstructorGroup) => {
        setSelectedGroup(group);
        setViewMode("group");
        await loadGroupInstructors(group);
    };

    const handleBackToInstructors = () => {
        setViewMode("instructors");
        setSelectedGroup(null);
        setGroupInstructors([]);
    };

    const handleDeleteGroup = async (groupId: string | number) => {
        if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) return;

        try {
            const success = await deleteInstructorGroup(groupId);
            if (success) {
                toast.success("Group deleted successfully");
                await loadGroups();
                if (selectedGroup?.id === groupId) {
                    handleBackToInstructors();
                }
            } else {
                toast.error("Failed to delete group");
            }
        } catch (error: any) {
            console.error("Error deleting group:", error);
            toast.error(error.message || "Failed to delete group");
        }
    };

    const handleRemoveInstructor = async (groupId: string | number, instructorId: string | number) => {
        if (!confirm("Remove this instructor from the group?")) return;

        try {
            const success = await removeInstructorFromGroup(groupId, instructorId);
            if (success) {
                toast.success("Instructor removed from group");
                if (selectedGroup) {
                    await loadGroupInstructors(selectedGroup);
                }
                await loadGroups();
            } else {
                toast.error("Failed to remove instructor");
            }
        } catch (error: any) {
            console.error("Error removing instructor:", error);
            toast.error(error.message || "Failed to remove instructor");
        }
    };

    /**
     * Handle assigning owner's instructor directly to the group
     */
    const handleAssignMyInstructor = async () => {
        if (!user?.id || !selectedGroup) return;

        // Get all user's instructors
        const userInstructors = await getInstructors(user.id);
        if (userInstructors.length === 0) {
            toast.error("You don't have any instructors to add");
            return;
        }

        // Get current group instructors
        const currentInstructorIds = selectedGroup.instructors
            ? selectedGroup.instructors.map((inst: any) => 
                typeof inst === 'number' ? inst : (inst?.id || inst)
              ).filter((id: any) => !isNaN(Number(id))).map((id: any) => Number(id))
            : [];

        // Filter out instructors already in the group
        const availableInstructors = userInstructors.filter(
            inst => !currentInstructorIds.includes(Number(inst.id))
        );

        if (availableInstructors.length === 0) {
            toast.error("All your instructors are already in this group");
            return;
        }

        // If only one instructor available, add it directly
        if (availableInstructors.length === 1) {
            try {
                const success = await addInstructorToGroup(selectedGroup.id, availableInstructors[0].id);
                if (success) {
                    toast.success(`${availableInstructors[0].name} added to group`);
                    await loadGroupInstructors(selectedGroup);
                    await loadGroups();
                } else {
                    toast.error("Failed to add instructor to group");
                }
            } catch (error: any) {
                console.error("Error adding instructor to group:", error);
                toast.error(error.message || "Failed to add instructor to group");
            }
            return;
        }

        // If multiple instructors, show selection modal
        setAvailableInstructorsForSelection(availableInstructors);
        setShowSelectInstructorsModal(true);
    };

    /**
     * Handle confirming selected instructors to add to group
     */
    const handleConfirmSelectedInstructors = async (selectedInstructorIds: number[]) => {
        if (!selectedGroup || selectedInstructorIds.length === 0) return;

        try {
            // Add all selected instructors in a single batch operation
            await addInstructorsToGroup(selectedGroup.id, selectedInstructorIds);
            
            const count = selectedInstructorIds.length;
            toast.success(`${count} instructor${count !== 1 ? 's' : ''} added to group`);
            
            // Refresh the group data immediately
            // First, reload the groups list to update the map
            await loadGroups();
            
            // Then, reload the selected group to get updated instructors list
            const updatedGroup = await getInstructorGroup(selectedGroup.id);
            if (updatedGroup) {
                setSelectedGroup(updatedGroup);
                await loadGroupInstructors(updatedGroup);
            } else {
                // Fallback: reload instructors from the current selectedGroup
                await loadGroupInstructors(selectedGroup);
            }
        } catch (error: any) {
            console.error("Error adding instructors to group:", error);
            toast.error(error.message || "Failed to add instructors to group");
            throw error; // Re-throw so modal can handle it
        }
    };

    /**
     * Handle leaving a group (member removes their own instructor)
     * This function finds the user's instructor that is in the group by matching instructor IDs
     */
    const handleLeaveGroup = async (group: InstructorGroup) => {
        if (!user?.id) return;
        
        // Get all of the user's instructors first
        const userInstructors = await getInstructors(user.id);
        if (userInstructors.length === 0) {
            toast.error("You don't have any instructors");
            return;
        }
        
        const userInstructorIds = userInstructors.map(inst => Number(inst.id)).filter(id => !isNaN(id));
        
        // Get the group's instructor IDs (from the group.instructors array)
        if (!group.instructors || !Array.isArray(group.instructors)) {
            toast.error("This group has no instructors");
            return;
        }
        
        // Extract instructor IDs from the group
        const groupInstructorIds = group.instructors
            .map((inst: any) => {
                if (typeof inst === 'number') {
                    return Number(inst);
                } else if (inst && typeof inst === 'object') {
                    return Number(inst.id || inst);
                }
                return null;
            })
            .filter((id: any) => id !== null && !isNaN(Number(id)))
            .map((id: any) => Number(id));
        
        // Find which of the user's instructors is in this group
        const matchingInstructorId = groupInstructorIds.find((groupId: number) => 
            userInstructorIds.includes(groupId)
        );
        
        if (!matchingInstructorId) {
            toast.error("Your instructor is not in this group");
            return;
        }

        if (!confirm("Leave this group? Your instructor will be removed from the group.")) return;

        try {
            const success = await removeInstructorFromGroup(group.id, matchingInstructorId);
            if (success) {
                toast.success("Left group successfully");
                if (selectedGroup?.id === group.id) {
                    handleBackToInstructors();
                }
                await loadGroups();
            } else {
                toast.error("Failed to leave group");
            }
        } catch (error: any) {
            console.error("Error leaving group:", error);
            toast.error(error.message || "Failed to leave group");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this instructor profile?")) return;
        
        const success = await deleteInstructor(id);
        if (success) {
            toast.success("Instructor deleted successfully");
            loadData();
        } else {
            toast.error("Failed to delete instructor");
        }
    };

    const handleCreateSuccess = () => {
        setShowCreateForm(false);
        setSelectedInstructor(null);
        setViewMode("instructors");
        loadData();
        onCreateInstructor?.();
    };

    // Check for free plans when user tries to create first instructor
    const handleCreateInstructorClick = async () => {
        // Check if this is the first instructor
        if (instructors.length === 0 && user?.id) {
            try {
                const missingPlans = await getMissingFreePlans(user.id);
                if (missingPlans.length > 0) {
                    setMissingFreePlans(missingPlans);
                    setShowFreePlanPopup(true);
                    return; // Don't show create form yet
                }
            } catch (error) {
                console.error("Error checking free plans:", error);
            }
        }
        // If no missing plans or not first instructor, proceed normally
        setShowCreateForm(true);
        setSelectedInstructor(null);
        setViewMode("instructors");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const primaryInstructor = instructors[0];
    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(groupSearchQuery.toLowerCase())
    );

    // Edit/Create View - Show edit form replacing main view
    if (showCreateForm) {
        return (
            <div className="space-y-6">
                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <button
                        onClick={() => {
                            setViewMode("instructors");
                            setShowCreateForm(false);
                            setSelectedInstructor(null);
                        }}
                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>My Instructors</span>
                    </button>
                    <span>/</span>
                    <span className="text-foreground font-medium">
                        {selectedInstructor ? `Edit ${selectedInstructor.name}` : "Create Instructor"}
                    </span>
                </div>
            <CreateInstructorForm
                    onCancel={() => {
                        setViewMode("instructors");
                        setShowCreateForm(false);
                        setSelectedInstructor(null);
                    }}
                onSuccess={handleCreateSuccess}
                editingInstructor={selectedInstructor}
            />
            </div>
        );
    }

    // Group View - Show instructors in selected group
    if (viewMode === "group" && selectedGroup) {
        const isOwner = isCurrentUserOwner(selectedGroup.owner);

        return (
            <div className="space-y-6">
                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <button
                        onClick={handleBackToInstructors}
                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>My Instructors</span>
                    </button>
                    <span>/</span>
                    <span className="text-foreground font-medium">{selectedGroup.name}</span>
                </div>

                {/* Group Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-primary/20">
                            <Users2 className="w-8 h-8 text-primary" />
                        </div>
                <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                                {selectedGroup.name}
                                {isOwner && <Crown className="w-5 h-5 text-yellow-500" />}
                            </h2>
                            <p className="text-muted-foreground mt-1">
                                {groupInstructors.length} instructor{groupInstructors.length !== 1 ? 's' : ''} in this group
                            </p>
                </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isOwner && (
                        <>
                            <Button
                                onClick={() => setShowInviteModal(true)}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                                    size="sm"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                    Invite Instructors
                            </Button>
                            <Button
                                    onClick={handleAssignMyInstructor}
                                variant="outline"
                                    size="sm"
                                    className="border-primary/50 text-primary hover:bg-primary/10"
                            >
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    Add My Instructor
                            </Button>
                        </>
                    )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {isOwner ? (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => openRenameDialog(selectedGroup)}
                                        >
                                            <Edit3 className="w-4 h-4 mr-2" />
                                            Rename Group
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleDeleteGroup(selectedGroup.id)}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Group
                                        </DropdownMenuItem>
                                        {/* Owner can also leave if their instructor is in the group */}
                                        {groupInstructors.some(
                                            inst => inst.user === user?.id || (typeof inst.user === 'object' && inst.user?.id === user?.id)
                                        ) && (
                                            <DropdownMenuItem
                                                onClick={() => handleLeaveGroup(selectedGroup)}
                                                className="text-destructive"
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Leave Group
                                            </DropdownMenuItem>
                                        )}
                                    </>
                                ) : (
                                    <DropdownMenuItem
                                        onClick={() => handleLeaveGroup(selectedGroup)}
                                        className="text-destructive"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Leave Group
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Group Instructors List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupInstructors.length === 0 ? (
                        <div className="col-span-full bg-card/50 backdrop-blur-xl border border-border rounded-xl p-12 text-center">
                            <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-foreground mb-2">No Instructors Yet</h3>
                            <p className="text-muted-foreground mb-6">
                                {isOwner 
                                    ? "Add instructors to this group to get started"
                                    : "This group has no instructors yet"}
                            </p>
                            {isOwner && (
                    <Button
                                onClick={() => setShowInviteModal(true)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                                    <UserPlus className="w-5 h-5 mr-2" />
                                    Add Instructors
                    </Button>
                            )}
                </div>
                    ) : (
                        groupInstructors.map((instructor, index) => (
                            <motion.div
                                key={instructor.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={(e) => handleInstructorClick(instructor, e)}
                                className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-6 hover:border-primary/40 hover:shadow-lg cursor-pointer transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <QuantumAvatar
                                            src={getAvatarUrl(instructor.avatar) || undefined}
                                            alt={instructor.name}
                                            size="md"
                                            verified={instructor.is_verified}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg text-foreground truncate">
                                                {instructor.name}
                                            </h3>
                                            {instructor.bio && (
                                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                    {instructor.bio}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {isOwner && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Owner can kick any instructor (including their own)
                                                handleRemoveInstructor(selectedGroup.id, instructor.id);
                                            }}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            title="Kick instructor from group"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </Button>
                                    )}
                                    {!isOwner && (instructor.user === user?.id || (typeof instructor.user === 'object' && instructor.user?.id === user?.id)) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Member can only remove their own instructor
                                                handleLeaveGroup(selectedGroup);
                                            }}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            title="Leave group"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const profileUrl = getInstructorProfileUrl(instructor);
                                            router.push(profileUrl);
                                        }}
                                        className="flex-1"
                                    >
                                        View Profile
                            </Button>
                                </div>
                            </motion.div>
                        ))
                    )}
            </div>

                {/* Invite Modal - Only show if user is owner */}
                {user?.id && isOwner && (
                    <>
                        <InviteInstructorToGroupModal
                    open={showInviteModal}
                    onClose={() => setShowInviteModal(false)}
                            groupId={selectedGroup.id}
                            groupName={selectedGroup.name}
                            currentUserId={user.id}
                            currentUserDocumentId={documentUserId}
                    onInviteSent={() => {
                                loadGroupInstructors(selectedGroup);
                                loadGroups();
                            }}
                        />
                        <SelectInstructorsModal
                            open={showSelectInstructorsModal}
                            onClose={() => setShowSelectInstructorsModal(false)}
                            availableInstructors={availableInstructorsForSelection}
                            onConfirm={handleConfirmSelectedInstructors}
                            groupName={selectedGroup.name}
                        />
                    </>
                )}

                <Dialog open={renameDialogOpen} onOpenChange={(open) => {
                    setRenameDialogOpen(open);
                    if (!open) {
                        closeRenameDialog();
                    }
                }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Rename Group</DialogTitle>
                            <DialogDescription>
                                Enter a new name to update this instructor group.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            <Label htmlFor="group-view-rename-group" className="text-sm font-medium text-muted-foreground">
                                New group name
                            </Label>
                            <Input
                                id="group-view-rename-group"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                placeholder="Enter new group name"
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={closeRenameDialog}>
                                Cancel
                            </Button>
                            <Button
                                onClick={submitRename}
                                disabled={renaming || !renameValue.trim()}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                            >
                                {renaming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // Main View - Show instructors and groups
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">My Instructors</h2>
                    <p className="text-foreground/70 mt-1 text-sm sm:text-base">Manage your instructor profiles and groups</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    {primaryInstructor && (
                            <Button
                                onClick={() => setActiveTab("invitations")}
                                variant="outline"
                            className="border-border text-foreground hover:bg-accent text-sm sm:text-base overflow-auto scrollbar-hide"
                            size="sm"
                        >
                            <Bell className="w-4 h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Invitations</span>
                            <span className="sm:hidden">Invites</span>
                            {pendingInvitationsCount > 0 && (
                                <span className="absolute top-0 right-2 z-10 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                                    {pendingInvitationsCount}
                                </span>
                            )}
                            </Button>
                    )}
                    {(() => {
                        const instructorLimit = subscription?.amount_instructor || (user as any)?.instructor_limit;
                        const isLocked = (subscription?.amount_instructor && subscription.amount_instructor > 0 && instructors.length >= subscription.amount_instructor) ||
                            ((user as any)?.instructor_limit && instructors.length >= (user as any)?.instructor_limit);
                        
                        return isLocked ? (
                            <motion.div
                                initial={{ scale: 1 }}
                                whileHover={{ scale: 1.02 }}
                                className="relative overflow-visible"
                            >
                                <Button
                                    onClick={() => {
                                        toast.error("You've reached your instructor limit. Please upgrade your subscription to create more instructors.", {
                                            duration: 5000,
                                        });
                                    }}
                                    className="relative overflow-visible bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 hover:from-slate-700 hover:via-slate-600 hover:to-slate-700 text-white text-sm sm:text-base border-2 border-slate-400/50 shadow-lg"
                                    size="sm"
                                >
                                    {/* Shimmer effect */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent overflow-hidden rounded-md"
                                        animate={{
                                            x: ['-100%', '100%'],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            repeatDelay: 1,
                                            ease: "easeInOut",
                                        }}
                                    />
                                    <div className="relative flex items-center gap-2 z-10">
                                        <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span className="hidden sm:inline">Create Instructor</span>
                                        <span className="sm:hidden">Create</span>
                                    </div>
                                </Button>
                                {/* Premium Badge - Outside button to avoid clipping */}
                                <motion.div
                                    className="absolute -top-2 -right-2 z-20"
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 5, -5, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatDelay: 1,
                                    }}
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 rounded-full blur-sm animate-pulse" />
                                        <Badge className="relative bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-white border-2 border-white dark:border-background shadow-2xl px-2 py-0.5">
                                            <Crown className="w-3 h-3 mr-1" />
                                            <span className="text-xs font-bold">Pro</span>
                                        </Badge>
                                    </div>
                                </motion.div>
                            </motion.div>
                        ) : (
                            <Button
                                onClick={() => {
                                    setViewMode("edit");
                                    handleCreateInstructorClick();
                                }}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300"
                                size="sm"
                            >
                                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Create Instructor</span>
                                <span className="sm:hidden">Create</span>
                            </Button>
                        );
                    })()}
                </div>
            </div>

            {/* Notification Banner for Pending Invitations */}
            {pendingInvitationsCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-2 border-primary/30 rounded-xl backdrop-blur-xl"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm sm:text-base">
                                You have {pendingInvitationsCount} pending collaboration request{pendingInvitationsCount > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Click on `Invitations` tab to view and respond
                            </p>
                        </div>
                        <Button
                            onClick={() => setActiveTab("invitations")}
                            size="sm"
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white w-full sm:w-auto"
                        >
                            View Invitations
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Tabs - Ultra Creative Design */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "list" | "invitations")}>
                <TabsList className="relative grid w-full grid-cols-2 mb-6 p-1.5 bg-gradient-to-r from-background/80 via-muted/40 to-background/80 dark:from-slate-900/80 dark:via-slate-800/40 dark:to-slate-900/80 backdrop-blur-xl rounded-2xl border-2 border-border/50 dark:border-slate-700/50 shadow-2xl overflow-hidden group">
                    {/* Animated background gradient */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 dark:from-blue-500/30 dark:via-purple-500/30 dark:to-pink-500/30"
                        animate={{
                            backgroundPosition: ["0% 0%", "100% 100%"],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                        }}
                        style={{
                            backgroundSize: "200% 200%",
                        }}
                    />
                    
                    {/* Shimmer effect */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent"
                        animate={{
                            x: ["-100%", "100%"],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatDelay: 2,
                            ease: "easeInOut",
                        }}
                    />
                    
                    {/* Active tab indicator with glow effect */}
                    <motion.div
                        className="absolute top-1.5 bottom-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600 rounded-xl shadow-2xl"
                        initial={false}
                        animate={{
                            left: activeTab === "list" ? "4px" : "50%",
                            width: "calc(50% - 8px)",
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                        }}
                    />
                    {/* Glow effect for active tab */}
                    <motion.div
                        className="absolute top-1.5 bottom-1.5 bg-gradient-to-r from-blue-400/50 via-purple-400/50 to-pink-400/50 dark:from-blue-500/50 dark:via-purple-500/50 dark:to-pink-500/50 rounded-xl blur-xl"
                        initial={false}
                        animate={{
                            left: activeTab === "list" ? "4px" : "50%",
                            width: "calc(50% - 8px)",
                            opacity: [0.5, 0.8],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                        }}
                    />
                    
                    <TabsTrigger 
                        value="list"
                        className="relative z-10 data-[state=active]:text-gray-600 dark:data-[state=active]:text-white data-[state=inactive]:text-muted-foreground dark:data-[state=inactive]:text-slate-400 font-semibold transition-all duration-300 hover:text-foreground dark:hover:text-slate-200"
                    >
                        <motion.div
                            className="flex items-center justify-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Users className="w-4 h-4 mr-2" />
                            <span>Instructors</span>
                        </motion.div>
                    </TabsTrigger>
                    <TabsTrigger 
                        value="invitations"
                        className="relative z-10 data-[state=active]:text-gray-600 dark:data-[state=active]:text-white data-[state=inactive]:text-muted-foreground dark:data-[state=inactive]:text-slate-400 font-semibold transition-all duration-300 hover:text-foreground dark:hover:text-slate-200"
                    >
                        <motion.div
                            className="flex items-center justify-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Bell className="w-4 h-4 mr-2" />
                            <span>Invitations</span>
                            {pendingInvitationsCount > 0 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                >
                                    <Badge className="ml-2 bg-gradient-to-r from-red-500 to-pink-500 dark:from-red-600 dark:to-pink-600 text-white border-0 shadow-lg animate-pulse">
                                        {pendingInvitationsCount}
                                    </Badge>
                                </motion.div>
                            )}
                        </motion.div>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-6">
                    {/* My Instructors Section */}
                                <div>
                        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            My Instructors ({instructors.length})
                        </h3>
                    {instructors.length === 0 ? (
                        <div className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-12 text-center">
                            <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-foreground mb-2">No Instructors Yet</h3>
                                <p className="text-muted-foreground mb-6">
                                    Create your first instructor profile to get started
                                </p>
                            {(() => {
                                const instructorLimit = subscription?.amount_instructor || (user as any)?.instructor_limit;
                                const isLocked = (subscription?.amount_instructor && subscription.amount_instructor > 0 && instructors.length >= subscription.amount_instructor) ||
                                    ((user as any)?.instructor_limit && instructors.length >= (user as any)?.instructor_limit);
                                
                                return isLocked ? (
                                    <motion.div
                                        initial={{ scale: 1 }}
                                        whileHover={{ scale: 1.02 }}
                                        className="relative overflow-visible"
                                    >
                                        <Button
                                            onClick={() => {
                                                toast.error("You've reached your instructor limit. Please upgrade your subscription to create more instructors.", {
                                                    duration: 5000,
                                                });
                                            }}
                                            className="relative overflow-visible bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 hover:from-slate-700 hover:via-slate-600 hover:to-slate-700 text-white border-2 border-slate-400/50 shadow-lg"
                                        >
                                            {/* Shimmer effect */}
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent overflow-hidden rounded-md"
                                                animate={{
                                                    x: ['-100%', '100%'],
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    repeatDelay: 1,
                                                    ease: "easeInOut",
                                                }}
                                            />
                                            <div className="relative flex items-center gap-2 z-10">
                                                <Lock className="w-5 h-5" />
                                                Create First Instructor
                                            </div>
                                        </Button>
                                        {/* Premium Badge - Outside button to avoid clipping */}
                                        <motion.div
                                            className="absolute -top-2 -right-2 z-20"
                                            animate={{
                                                scale: [1, 1.1, 1],
                                                rotate: [0, 5, -5, 0],
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                repeatDelay: 1,
                                            }}
                                        >
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 rounded-full blur-sm animate-pulse" />
                                                <Badge className="relative bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-white border-2 border-white dark:border-background shadow-2xl px-2 py-0.5">
                                                    <Crown className="w-3 h-3 mr-1" />
                                                    <span className="text-xs font-bold">Pro</span>
                                                </Badge>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                ) : (
                                    <Button
                                        onClick={() => {
                                            setViewMode("edit");
                                            handleCreateInstructorClick();
                                        }}
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                        <PlusCircle className="w-5 h-5 mr-2" />
                                        Create First Instructor
                                    </Button>
                                );
                            })()}
                        </div>
                    ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {instructors.map((instructor, index) => (
                                <motion.div
                                    key={instructor.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={(e) => handleInstructorClick(instructor, e)}
                                        whileHover={{ y: -5, scale: 1.02 }}
                                        className="group relative bg-gradient-to-br from-card/80 via-card/60 to-card/80 dark:from-slate-900/80 dark:via-slate-800/60 dark:to-slate-900/80 backdrop-blur-xl border-2 border-border/50 dark:border-slate-700/50 rounded-2xl p-6 hover:border-primary/50 dark:hover:border-blue-500/50 hover:shadow-2xl hover:shadow-primary/20 dark:hover:shadow-blue-500/20 cursor-pointer transition-all duration-300 overflow-hidden"
                                >
                                    {/* Animated background gradient */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                        animate={{
                                            backgroundPosition: ["0% 0%", "100% 100%"],
                                        }}
                                        transition={{
                                            duration: 4,
                                            repeat: Infinity,
                                            repeatType: "reverse",
                                            ease: "easeInOut",
                                        }}
                                        style={{
                                            backgroundSize: "200% 200%",
                                        }}
                                    />
                                    
                                    {/* Shimmer effect on hover */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent opacity-0 group-hover:opacity-100"
                                        animate={{
                                            x: ["-100%", "100%"],
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            repeatDelay: 1,
                                            ease: "easeInOut",
                                        }}
                                    />
                                    
                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <QuantumAvatar
                                                    src={getAvatarUrl(instructor.avatar) || undefined}
                                            alt={instructor.name}
                                                    size="md"
                                            verified={instructor.is_verified}
                                        />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-lg text-foreground truncate">
                                                        {instructor.name}
                                                    </h3>
                                    {instructor.bio && (
                                                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                            {instructor.bio}
                                        </p>
                                    )}
                                        </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedInstructor(instructor);
                                                            setViewMode("edit");
                                                            setShowCreateForm(true);
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const profileUrl = getInstructorProfileUrl(instructor);
                                                            if (profileUrl) {
                                                                router.push(profileUrl);
                                                            }
                                                        }}
                                                    >
                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                        View Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(instructor.documentId || instructor.id.toString());
                                                        }}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedInstructor(instructor);
                                                    setViewMode("edit");
                                                    setShowCreateForm(true);
                                                }}
                                                className="flex-1"
                                            >
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const profileUrl = getInstructorProfileUrl(instructor);
                                                    router.push(profileUrl);
                                                }}
                                                className="flex-1"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                View
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                                        ))}
                                </div>
                            )}
                                </div>

                    {/* Instructor Groups Section - Like Folders */}
                        <div className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Users2 className="w-6 h-6 text-primary" />
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Instructor Groups</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Organize your instructors into groups
                                    </p>
                                </div>
                            </div>
                            {(() => {
                                const groupLimit = subscription?.amount_instructor_group_allowed || (user as any)?.instructor_group_limit;
                                const isLocked = (subscription?.amount_instructor_group_allowed && subscription.amount_instructor_group_allowed > 0 && groups.length >= subscription.amount_instructor_group_allowed) ||
                                    ((user as any)?.instructor_group_limit && groups.length >= (user as any)?.instructor_group_limit);
                                
                                return isLocked ? (
                                    <motion.div
                                        initial={{ scale: 1 }}
                                        whileHover={{ scale: 1.02 }}
                                        className="relative overflow-visible"
                                    >
                                        <Button
                                            onClick={() => {
                                                toast.error("You've reached your instructor group limit. Please upgrade your subscription to create more groups.", {
                                                    duration: 5000,
                                                });
                                            }}
                                            variant="outline"
                                            size="sm"
                                            className="relative overflow-visible border-2 border-slate-400/50 bg-gradient-to-r from-slate-50/50 via-slate-100/50 to-slate-50/50 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 text-slate-600 dark:text-slate-300 shadow-lg hover:shadow-xl transition-all"
                                        >
                                            {/* Shimmer effect */}
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent overflow-hidden rounded-md"
                                                animate={{
                                                    x: ['-100%', '100%'],
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    repeatDelay: 1,
                                                    ease: "easeInOut",
                                                }}
                                            />
                                            <div className="relative flex items-center gap-2 z-10">
                                                <Lock className="w-4 h-4" />
                                                Create Group
                                            </div>
                                        </Button>
                                        {/* Premium Badge - Outside button to avoid clipping */}
                                        <motion.div
                                            className="absolute -top-2 -right-2 z-20"
                                            animate={{
                                                scale: [1, 1.1, 1],
                                                rotate: [0, 5, -5, 0],
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                repeatDelay: 1,
                                            }}
                                        >
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 rounded-full blur-sm animate-pulse" />
                                                <Badge className="relative bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-white border-2 border-white dark:border-background shadow-2xl px-2 py-0.5">
                                                    <Crown className="w-3 h-3 mr-1" />
                                                    <span className="text-xs font-bold">Pro</span>
                                                </Badge>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                ) : (
                                    <Button
                                        onClick={() => setShowCreateGroupModal(true)}
                                        variant="outline"
                                        size="sm"
                                        className="hover:bg-accent/50 transition-all duration-300"
                                    >
                                        <PlusCircle className="w-4 h-4 mr-2" />
                                        Create Group
                                    </Button>
                                );
                            })()}
                                                </div>
                                                
                        {/* Search Groups */}
                        {groups.length > 0 && (
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={groupSearchQuery}
                                    onChange={(e) => setGroupSearchQuery(e.target.value)}
                                    placeholder="Search groups..."
                                    className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                                    />
                                                                </div>
                        )}

                        {/* Groups Grid - Folder Style */}
                        {loadingGroups ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                                    </div>
                        ) : filteredGroups.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Users2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                <p className="font-semibold mb-2">
                                    {groupSearchQuery ? "No groups match your search" : "No groups yet"}
                                </p>
                                <p className="text-sm">
                                    {groupSearchQuery ? "Try a different search term" : "Create your first group to organize instructors"}
                                </p>
                                                                    </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredGroups.map((group, index) => {
                                    // Check if user is owner - handle both numeric ID and object formats
                                    const ownerId = typeof group.owner === 'object' ? group.owner?.id : group.owner;
                                    const isOwner = isCurrentUserOwner(group.owner);
                                    const groupInstructors = groupInstructorsMap.get(group.id) || [];
                                    const instructorCount = groupInstructors.length;
                                                        
                                                        return (
                                        <motion.div
                                            key={group.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => handleGroupClick(group)}
                                            className="group relative bg-gradient-to-br from-background/80 via-background/60 to-background/80 backdrop-blur-xl border-2 border-border hover:border-primary/50 rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 group-hover:from-blue-500/30 group-hover:via-purple-500/30 group-hover:to-pink-500/30 transition-colors">
                                                    <Users2 className="w-6 h-6 text-primary" />
                                                </div>
                                                {isOwner && (
                                                    <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                                )}
                                            </div>
                                            <h4 className="font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                                                {group.name}
                                            </h4>
                                            
                                            {/* Instructor Avatars */}
                                            {groupInstructors.length > 0 ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 -space-x-2">
                                                        {groupInstructors.slice(0, 4).map((instructor) => (
                                                            <div
                                                                key={instructor.id}
                                                                className="relative ring-2 ring-background rounded-full"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const profileUrl = getInstructorProfileUrl(instructor);
                                                                    router.push(profileUrl);
                                                                }}
                                                                >
                                                                    <QuantumAvatar
                                                                    src={getAvatarUrl(instructor.avatar) || undefined}
                                                                    alt={instructor.name}
                                                                    size="sm"
                                                                        verified={instructor.is_verified}
                                                                    className="cursor-pointer hover:scale-110 transition-transform"
                                                                    />
                                                                </div>
                                                        ))}
                                                        {groupInstructors.length > 4 && (
                                                            <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-semibold text-foreground">
                                                                +{groupInstructors.length - 4}
                                                                    </div>
                                                                        )}
                                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Users className="w-3 h-3" />
                                                        <span>{instructorCount} instructor{instructorCount !== 1 ? 's' : ''}</span>
                                                                </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Users className="w-4 h-4" />
                                                    <span>No instructors</span>
                                                    </div>
                                            )}
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                            <MoreVertical className="w-3 h-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleGroupClick(group);
                                                            }}
                                                        >
                                                            <Users2 className="w-4 h-4 mr-2" />
                                                            Open Group
                                                        </DropdownMenuItem>
                                                        {isOwner && (
                                                            <>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedGroup(group);
                                                                        setShowInviteModal(true);
                                                                    }}
                                                                >
                                                                    <UserPlus className="w-4 h-4 mr-2" />
                                                                    Add Instructors
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openRenameDialog(group);
                                                                    }}
                                                                >
                                                                    <Edit3 className="w-4 h-4 mr-2" />
                                                                    Rename Group
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                            </>
                                                        )}
                                                        {isOwner ? (
                                                            <>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteGroup(group.id);
                                                                    }}
                                                                    className="text-destructive"
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    Delete Group
                                                                </DropdownMenuItem>
                                                                {(groupInstructorsMap.get(group.id) || []).some(
                                                                    inst => inst.user === user?.id || (typeof inst.user === 'object' && inst.user?.id === user?.id)
                                                                ) && (
                                                                    <DropdownMenuItem
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleLeaveGroup(group);
                                                                        }}
                                                                        className="text-destructive"
                                                                    >
                                                                        <XCircle className="w-4 h-4 mr-2" />
                                                                        Leave Group
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleLeaveGroup(group);
                                                                }}
                                                                className="text-destructive"
                                                            >
                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                Leave Group
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                </div>
                                            </motion.div>
                                    );
                                })}
                                </div>
                            )}
                        </div>
                </TabsContent>

                <TabsContent value="invitations">
                    {instructors.length > 0 ? (
                        <InstructorInvitationsPanel
                            instructorId={instructors.map(i => i.id)}
                            onUpdate={() => {
                                loadData();
                            }}
                        />
                    ) : (
                        <div className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-12 text-center">
                            <Bell className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-foreground mb-2">No Instructor Profile</h3>
                            <p className="text-muted-foreground mb-6">
                                Create an instructor profile to receive collaboration invitations
                            </p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Create/Edit Instructor Form - Only show if not in edit view mode */}
            {showCreateForm && viewMode !== "edit" && (
                <CreateInstructorForm
                    onCancel={() => {
                        setShowCreateForm(false);
                        setSelectedInstructor(null);
                    }}
                    onSuccess={handleCreateSuccess}
                    editingInstructor={selectedInstructor}
                />
            )}

            {/* Create Group Modal */}
            {user && user.id && (
                <CreateGroupModal
                    open={showCreateGroupModal}
                    onClose={() => setShowCreateGroupModal(false)}
                    onSuccess={(group) => {
                        loadGroups();
                    }}
                    currentUserId={user.id}
                />
            )}

            {/* Free Plan Agreement Popup */}
            <FreePlanAgreementPopup
                isOpen={showFreePlanPopup}
                plans={missingFreePlans}
                onClose={() => setShowFreePlanPopup(false)}
                onSuccess={() => {
                    setShowFreePlanPopup(false);
                    // After confirming, show create form
                    setShowCreateForm(true);
                    setSelectedInstructor(null);
                    setViewMode("instructors");
                    // Reload data to get updated user limits
                    loadData();
                }}
            />

            {/* Invite Modal - Only show if user is owner */}
            {selectedGroup && user && user.id && isCurrentUserOwner(selectedGroup.owner) && (
                <InviteInstructorToGroupModal
                    open={showInviteModal}
                    onClose={() => {
                        setShowInviteModal(false);
                        setSelectedGroup(null);
                    }}
                    groupId={selectedGroup.id}
                    groupName={selectedGroup.name}
                    currentUserId={user.id}
                    currentUserDocumentId={documentUserId}
                    onInviteSent={() => {
                        loadGroups();
                        if (viewMode === "group" && selectedGroup) {
                            loadGroupInstructors(selectedGroup);
                        }
                    }}
                />
            )}

            <Dialog open={renameDialogOpen} onOpenChange={(open) => {
                setRenameDialogOpen(open);
                if (!open) {
                    closeRenameDialog();
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Group</DialogTitle>
                        <DialogDescription>
                            Enter a new name to update this instructor group.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <Label htmlFor="dashboard-rename-group" className="text-sm font-medium text-muted-foreground">
                            New group name
                        </Label>
                        <Input
                            id="dashboard-rename-group"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            placeholder="Enter new group name"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={closeRenameDialog}>
                            Cancel
                        </Button>
                        <Button
                            onClick={submitRename}
                            disabled={renaming || !renameValue.trim()}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                            {renaming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
