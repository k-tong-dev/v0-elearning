"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    PlusCircle,
    Users,
    Search,
    Filter,
    LayoutGrid,
    Columns,
    Trash2,
    LogOut,
    Crown,
    UserPlus,
    MoreVertical,
    X,
    Loader2,
    Edit3
} from "lucide-react";
import {
    getUserInstructorGroups,
    createInstructorGroup,
    deleteInstructorGroup,
    removeInstructorFromGroup,
    updateGroupName,
    InstructorGroup as InstructorGroupType
} from "@/integrations/strapi/instructor-group";
import { getInstructor, Instructor } from "@/integrations/strapi/instructor";
import { toast } from "sonner";
import { InviteInstructorToGroupModal } from "./InviteInstructorToGroupModal";
import { getAvatarUrl } from "@/lib/getAvatarUrl";
import { QuantumAvatar } from "@/components/ui/quantum-avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface InstructorGroupManagerProps {
    onGroupUpdate?: () => void;
}

type ViewMode = "grid" | "kanban";

const DEFAULT_INSTRUCTOR_GROUP_MEMBER_LIMIT = 30;

const parsePositiveInteger = (value: unknown, fallback: number): number => {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.floor(value);
    if (typeof value === "string" && /^\d+$/.test(value)) {
        const parsed = Number(value);
        if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
    }
    return fallback;
};

export function InstructorGroupManager({ onGroupUpdate }: InstructorGroupManagerProps) {
    const { user } = useAuth();
    const [groups, setGroups] = useState<InstructorGroupType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [creatingGroup, setCreatingGroup] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<InstructorGroupType | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [groupInstructors, setGroupInstructors] = useState<Map<string | number, Instructor[]>>(new Map());
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [renamingGroup, setRenamingGroup] = useState<InstructorGroupType | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [renaming, setRenaming] = useState(false);

    const numericUserId = useMemo(() => (user?.id ? Number(user.id) : undefined), [user?.id]);
    const documentUserId: string | undefined = user?.documentId ?? undefined;
    const instructorGroupMemberLimit = useMemo(
        () => parsePositiveInteger((user as any)?.instructor_group_member_limit, DEFAULT_INSTRUCTOR_GROUP_MEMBER_LIMIT),
        [user]
    );

    const isCurrentUserOwner = useCallback(
        (owner: any): boolean => {
            if (!owner) return false;
            const ownerNumeric = typeof owner === "object" ? owner.id : owner;
            const ownerDocumentId = typeof owner === "object" ? (owner.documentId ?? undefined) : (typeof owner === "string" ? owner : undefined);

            if (numericUserId !== undefined && ownerNumeric !== undefined) {
                const ownerNumericNumber = Number(ownerNumeric);
                if (!Number.isNaN(ownerNumericNumber) && ownerNumericNumber === numericUserId) {
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

    useEffect(() => {
        if (user?.id) {
            loadGroups();
        }
    }, [user]);

    const loadGroups = async () => {
        if (!user?.id) return;
        
        setLoading(true);
        try {
            const userGroups = await getUserInstructorGroups(user.id);
            setGroups(userGroups);
            
            // Load instructors for each group
            const instructorMap = new Map<string | number, Instructor[]>();
            for (const group of userGroups) {
                if (group.instructors && Array.isArray(group.instructors)) {
                    const instructors: Instructor[] = [];
                    for (const inst of group.instructors) {
                        if (typeof inst === 'number') {
                            try {
                                const instructorData = await getInstructor(inst);
                                if (instructorData) {
                                    instructors.push(instructorData);
                                }
                            } catch (error) {
                                console.error(`Error loading instructor ${inst}:`, error);
                            }
                        } else if (inst && typeof inst === 'object' && 'id' in inst) {
                            instructors.push(inst as Instructor);
                        }
                    }
                    instructorMap.set(group.id, instructors);
                }
            }
            setGroupInstructors(instructorMap);
        } catch (error) {
            console.error("Error loading groups:", error);
            toast.error("Failed to load instructor groups");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || !user?.id) return;

        setCreatingGroup(true);
        try {
            const newGroup = await createInstructorGroup(newGroupName.trim(), user.id);
            if (newGroup) {
                toast.success(`Group "${newGroupName}" created successfully!`);
                setNewGroupName("");
                setShowCreateGroup(false);
                await loadGroups();
                onGroupUpdate?.();
            } else {
                toast.error("Failed to create group");
            }
        } catch (error: any) {
            console.error("Error creating group:", error);
            toast.error(error.message || "Failed to create group");
        } finally {
            setCreatingGroup(false);
        }
    };

    const handleDeleteGroup = async (groupId: string | number) => {
        if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) return;

        try {
            const success = await deleteInstructorGroup(groupId);
            if (success) {
                toast.success("Group deleted successfully");
                await loadGroups();
                onGroupUpdate?.();
            } else {
                toast.error("Failed to delete group");
            }
        } catch (error: any) {
            console.error("Error deleting group:", error);
            toast.error(error.message || "Failed to delete group");
        }
    };

    const handleRenameGroup = (group: InstructorGroupType) => {
        setRenamingGroup(group);
        setRenameValue(group.name);
        setRenameDialogOpen(true);
    };

    const submitRenameGroup = async () => {
        if (!renamingGroup || !renameValue.trim()) {
            toast.error("Please enter a group name");
            return;
        }

        setRenaming(true);
        try {
            await updateGroupName(renamingGroup.documentId || renamingGroup.id, renameValue.trim(), "instructor");
            toast.success("Group name updated");
            setRenameDialogOpen(false);
            setRenamingGroup(null);
            setRenameValue("");
            await loadGroups();
            onGroupUpdate?.();
        } catch (error: any) {
            console.error("Error renaming group:", error);
            toast.error(error.message || "Failed to rename group");
        } finally {
            setRenaming(false);
        }
    };

    const handleRemoveInstructor = async (groupId: string | number, instructorId: string | number) => {
        if (!confirm("Remove this instructor from the group?")) return;

        try {
            const success = await removeInstructorFromGroup(groupId, instructorId);
            if (success) {
                toast.success("Instructor removed from group");
                await loadGroups();
                onGroupUpdate?.();
            } else {
                toast.error("Failed to remove instructor");
            }
        } catch (error: any) {
            console.error("Error removing instructor:", error);
            toast.error(error.message || "Failed to remove instructor");
        }
    };

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        Instructor Groups
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Create and manage groups of instructors
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                        <Button
                            variant={viewMode === "grid" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className="h-8"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={viewMode === "kanban" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("kanban")}
                            className="h-8"
                        >
                            <Columns className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button
                        onClick={() => setShowCreateGroup(true)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        size="sm"
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Create Group
                    </Button>
                </div>
            </div>

            {/* Create Group Form */}
            <AnimatePresence>
                {showCreateGroup && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-6"
                    >
                        <div className="flex items-center gap-4">
                            <Input
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="Enter group name..."
                                className="flex-1"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleCreateGroup();
                                    } else if (e.key === "Escape") {
                                        setShowCreateGroup(false);
                                        setNewGroupName("");
                                    }
                                }}
                                autoFocus
                            />
                            <Button
                                onClick={handleCreateGroup}
                                disabled={!newGroupName.trim() || creatingGroup}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                            >
                                {creatingGroup ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Create"
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setShowCreateGroup(false);
                                    setNewGroupName("");
                                }}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search groups..."
                        className="pl-10"
                    />
                </div>
                <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                </Button>
            </div>

            {/* Groups Display */}
            {filteredGroups.length === 0 ? (
                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-12 text-center">
                    <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">No Groups Yet</h3>
                    <p className="text-muted-foreground mb-6">
                        {searchQuery ? "No groups match your search" : "Create your first instructor group to get started!"}
                    </p>
                    {!searchQuery && (
                        <Button
                            onClick={() => setShowCreateGroup(true)}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Create First Group
                        </Button>
                    )}
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGroups.map((group, index) => {
                        const instructors = groupInstructors.get(group.id) || [];
                        const isOwner = isCurrentUserOwner(group.owner);
                        const memberLimitReached = isOwner && instructors.length >= instructorGroupMemberLimit;
                        const memberSlotsRemaining = Math.max(instructorGroupMemberLimit - instructors.length, 0);

                        return (
                            <motion.div
                                key={group.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => {
                                    setSelectedGroup(group);
                                    setShowInviteModal(true);
                                }}
                                className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-6 hover:border-primary/40 hover:shadow-lg cursor-pointer transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-bold text-lg text-foreground">{group.name}</h4>
                                            {isOwner && (
                                                <Crown className="w-4 h-4 text-yellow-500" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                {instructors.length} instructor{instructors.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="sm">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                if (memberLimitReached) {
                                                    toast.error("You've reached the member limit for this group.");
                                                    return;
                                                }
                                                setSelectedGroup(group);
                                                setShowInviteModal(true);
                                            }}>
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                Add Instructors
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {isOwner ? (
                                                <>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRenameGroup(group);
                                                        }}
                                                    >
                                                        <Edit3 className="w-4 h-4 mr-2" />
                                                        Rename Group
                                                    </DropdownMenuItem>
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
                                                </>
                                            ) : (
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (user?.id) {
                                                            handleRemoveInstructor(group.id, user.id);
                                                        }
                                                    }}
                                                    className="text-destructive"
                                                >
                                                    <LogOut className="w-4 h-4 mr-2" />
                                                    Leave Group
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Instructors List */}
                                {instructors.length > 0 ? (
                                    <div className="space-y-2 mt-4">
                                        {instructors.slice(0, 3).map((instructor) => (
                                            <div
                                                key={instructor.id}
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                }}
                                            >
                                                <QuantumAvatar
                                                    src={getAvatarUrl(instructor.avatar) ?? undefined}
                                                    alt={instructor.name}
                                                    size="sm"
                                                    verified={instructor.is_verified}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">
                                                        {instructor.name}
                                                    </p>
                                                </div>
                                                {isOwner && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveInstructor(group.id, instructor.id);
                                                        }}
                                                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        {instructors.length > 3 && (
                                            <p className="text-xs text-muted-foreground text-center pt-2">
                                                +{instructors.length - 3} more
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-sm text-muted-foreground">
                                        No instructors yet. Click to add.
                                    </div>
                                )}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-4"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (memberLimitReached) {
                                            toast.error("You've reached the member limit for this group.");
                                            return;
                                        }
                                        setSelectedGroup(group);
                                        setShowInviteModal(true);
                                    }}
                                    disabled={memberLimitReached}
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    {memberLimitReached ? 'Member limit reached' : 'Add Instructors'}
                                </Button>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {filteredGroups.map((group, index) => {
                        const instructors = groupInstructors.get(group.id) || [];
                        const isOwner = isCurrentUserOwner(group.owner);
                        const memberLimitReached = isOwner && instructors.length >= instructorGroupMemberLimit;
                        const memberSlotsRemaining = Math.max(instructorGroupMemberLimit - instructors.length, 0);

                        return (
                            <motion.div
                                key={group.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="min-w-[300px] bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4 flex-shrink-0"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-foreground">{group.name}</h4>
                                        {isOwner && <Crown className="w-4 h-4 text-yellow-500" />}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => {
                                                setSelectedGroup(group);
                                                setShowInviteModal(true);
                                            }}>
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                Add Instructors
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {isOwner ? (
                                                <>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRenameGroup(group);
                                                        }}
                                                    >
                                                        <Edit3 className="w-4 h-4 mr-2" />
                                                        Rename Group
                                                    </DropdownMenuItem>
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
                                                </>
                                            ) : (
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (user?.id) {
                                                            handleRemoveInstructor(group.id, user.id);
                                                        }
                                                    }}
                                                    className="text-destructive"
                                                >
                                                    <LogOut className="w-4 h-4 mr-2" />
                                                    Leave Group
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-2">
                                    {instructors.map((instructor) => (
                                        <div
                                            key={instructor.id}
                                            className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <QuantumAvatar
                                                src={getAvatarUrl(instructor.avatar) ?? undefined}
                                                alt={instructor.name}
                                                size="sm"
                                                verified={instructor.is_verified}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                    {instructor.name}
                                                </p>
                                            </div>
                                            {isOwner && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveInstructor(group.id, instructor.id)}
                                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {instructors.length === 0 && (
                                        <div className="text-center py-8 text-sm text-muted-foreground">
                                            No instructors
                                        </div>
                                    )}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-4"
                                    onClick={() => {
                                        if (memberLimitReached) {
                                            toast.error("You've reached the member limit for this group.");
                                            return;
                                        }
                                        setSelectedGroup(group);
                                        setShowInviteModal(true);
                                    }}
                                    disabled={memberLimitReached}
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    {memberLimitReached ? 'Member limit reached' : 'Add Instructors'}
                                </Button>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Invite Modal */}
            {selectedGroup && user?.id && (() => {
                const selectedInstructors = groupInstructors.get(selectedGroup.id) || [];
                const ownsSelectedGroup = isCurrentUserOwner(selectedGroup.owner);
                const selectedLimitReached = ownsSelectedGroup && selectedInstructors.length >= instructorGroupMemberLimit;
                return (
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
                        isLimitReached={selectedLimitReached}
                        memberLimit={instructorGroupMemberLimit}
                        currentMemberCount={selectedInstructors.length}
                        onInviteSent={() => {
                            loadGroups();
                            onGroupUpdate?.();
                        }}
                    />
                );
            })()}

            <Dialog open={renameDialogOpen} onOpenChange={(open) => {
                setRenameDialogOpen(open);
                if (!open) {
                    setRenamingGroup(null);
                    setRenameValue("");
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Group</DialogTitle>
                        <DialogDescription>
                            Give this instructor group a fresh name.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <Label htmlFor="rename-group" className="text-sm font-medium text-muted-foreground">
                            New group name
                        </Label>
                        <Input
                            id="rename-group"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            placeholder="Enter new group name"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setRenameDialogOpen(false);
                                setRenamingGroup(null);
                                setRenameValue("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={submitRenameGroup}
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

