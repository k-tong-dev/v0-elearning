"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    AnimatedModal,
    AnimatedModalContent,
    AnimatedModalHeader,
    AnimatedModalTitle,
    AnimatedModalDescription,
} from "@/components/ui/aceternity/AnimatedModal";
import { Search, UserPlus, X, Loader2, CheckCircle2, AlertCircle, Users, Check, MoreVertical, Edit3 } from "lucide-react";
import { searchInstructors, sendInvitation } from "@/integrations/strapi/instructor-invitation";
import { getUserInstructorGroups, updateGroupName } from "@/integrations/strapi/instructor-group";
import { Instructor } from "@/integrations/strapi/instructor";
import { InstructorGroup } from "@/integrations/strapi/instructor-group";
import { toast } from "sonner";
import { getAvatarUrl } from "@/lib/getAvatarUrl";
import { QuantumAvatar } from "@/components/ui/quantum-avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface InviteInstructorToGroupModalProps {
    open: boolean;
    onClose: () => void;
    groupId: string | number;
    groupName: string;
    currentUserId: string | number;
    currentUserDocumentId?: string;
    onInviteSent?: () => void;
}

export function InviteInstructorToGroupModal({
    open,
    onClose,
    groupId,
    groupName,
    currentUserId,
    currentUserDocumentId,
    onInviteSent,
}: InviteInstructorToGroupModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Instructor[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string | number>(groupId);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [userGroups, setUserGroups] = useState<InstructorGroup[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [renamingGroup, setRenamingGroup] = useState<InstructorGroup | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [renaming, setRenaming] = useState(false);

    const numericCurrentUserId = useMemo(() => {
        const numeric = Number(currentUserId);
        return Number.isNaN(numeric) ? undefined : numeric;
    }, [currentUserId]);

    const isGroupOwner = useCallback(
        (owner: any): boolean => {
            if (!owner) return false;
            const ownerNumeric = typeof owner === "object" ? owner.id : owner;
            const ownerDocumentId = typeof owner === "object" ? (owner.documentId ?? undefined) : (typeof owner === "string" ? owner : undefined);

            if (numericCurrentUserId !== undefined && ownerNumeric !== undefined) {
                const parsed = Number(ownerNumeric);
                if (!Number.isNaN(parsed) && parsed === numericCurrentUserId) {
                    return true;
                }
            }

            if (currentUserDocumentId && ownerDocumentId && ownerDocumentId === currentUserDocumentId) {
                return true;
            }

            return false;
        },
        [numericCurrentUserId, currentUserDocumentId]
    );

    // Load user's groups
    useEffect(() => {
        if (open && currentUserId) {
            loadUserGroups();
        }
    }, [open, currentUserId]);

    // Update selected group when groupId prop changes
    useEffect(() => {
        if (groupId) {
            setSelectedGroupId(groupId);
        }
    }, [groupId]);

    const loadUserGroups = async () => {
        if (!currentUserId) return;
        
        setLoadingGroups(true);
        try {
            const groups = await getUserInstructorGroups(currentUserId);
            setUserGroups(groups);
        } catch (error) {
            console.error("Error loading groups:", error);
            toast.error("Failed to load groups");
        } finally {
            setLoadingGroups(false);
        }
    };

    const openRenameDialog = (group: InstructorGroup) => {
        setRenamingGroup(group);
        setRenameValue(group.name);
        setRenameDialogOpen(true);
    };

    const closeRenameDialog = () => {
        setRenameDialogOpen(false);
        setRenamingGroup(null);
        setRenameValue("");
    };

    const submitRename = async () => {
        if (!renamingGroup || !renameValue.trim()) {
            toast.error("Please enter a group name");
            return;
        }

        setRenaming(true);
        try {
            await updateGroupName(renamingGroup.documentId || renamingGroup.id, renameValue.trim(), "instructor");
            toast.success("Group name updated");
            closeRenameDialog();
            await loadUserGroups();
        } catch (error: any) {
            console.error("Rename error:", error);
            toast.error(error.message || "Failed to rename group");
        } finally {
            setRenaming(false);
        }
    };

    // Debounced search
    useEffect(() => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const results = await searchInstructors(searchQuery);
                setSearchResults(results);
            } catch (error) {
                console.error("Search error:", error);
                toast.error("Failed to search instructors");
            } finally {
                setSearching(false);
            }
        }, 500);

        setDebounceTimer(timer);

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    }, [searchQuery]);

    const handleInvite = async () => {
        if (!selectedInstructor || !selectedGroupId || !currentUserId) return;

        setSending(true);
        try {
            const success = await sendInvitation(
                currentUserId,
                selectedInstructor.id || selectedInstructor.documentId,
                selectedGroupId,
                message.trim() || undefined
            );

            if (success) {
                toast.success(`Invitation sent to ${selectedInstructor.name}!`);
                // Remove invited instructor from search results but keep everything else
                const invitedId = selectedInstructor.id || selectedInstructor.documentId;
                setSelectedInstructor(null);
                setMessage("");
                setSearchResults(prev => prev.filter(inst => 
                    (inst.id !== invitedId) && 
                    (inst.documentId !== invitedId)
                ));
                onInviteSent?.();
                // Don't close modal - allow multiple invitations
            } else {
                toast.error("Failed to send invitation");
            }
        } catch (error: any) {
            if (error.message && (error.message.includes('already pending') || error.message.includes('already have'))) {
                toast.error(error.message);
            } else {
                toast.error("Failed to send invitation");
            }
        } finally {
            setSending(false);
        }
    };

    const reset = () => {
        setSearchQuery("");
        setSearchResults([]);
        setSelectedInstructor(null);
        setMessage("");
        setSelectedGroupId(groupId); // Reset to initial group
    };

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                reset();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open]);

    const selectedGroup = userGroups.find(g => g.id === selectedGroupId || g.documentId === selectedGroupId);

    return (
        <AnimatedModal 
            open={open} 
            onOpenChange={onClose}
            className="sm:max-w-6xl lg:max-w-7xl bg-gradient-to-br from-background via-background to-accent/5 border-2 border-border/50 backdrop-blur-2xl shadow-2xl dark:shadow-purple-500/10"
            closeOnOverlayClick={true}
        >
            <AnimatedModalContent className="bg-transparent p-0">
                <AnimatedModalHeader className="space-y-4 pb-6 border-b border-border/50 bg-gradient-to-r from-transparent via-accent/10 to-transparent px-8 pt-8">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-4 flex-1">
                            <motion.div 
                                className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 dark:from-blue-500/30 dark:via-purple-500/30 dark:to-pink-500/30 border border-primary/20"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <UserPlus className="w-7 h-7 text-primary" />
                            </motion.div>
                            <div>
                                <AnimatedModalTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                                    Invite Instructor to Group
                                </AnimatedModalTitle>
                                <AnimatedModalDescription className="text-muted-foreground mt-2 text-base">
                                    Select a group and search for instructors to invite
                                </AnimatedModalDescription>
                            </div>
                        </div>
                    </div>
                </AnimatedModalHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
                    {/* Left Side - Group Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">Select Group</h3>
                        </div>
                        
                        {loadingGroups ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : userGroups.length === 0 ? (
                            <div className="text-center py-8 bg-muted/30 rounded-xl border border-border/50">
                                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">No groups available</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                {userGroups.map((group) => {
                                    const isSelected = group.id === selectedGroupId || group.documentId === selectedGroupId;
                                    
                                    return (
                                        <motion.div
                                            key={group.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedGroupId(group.id)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                                                isSelected
                                                    ? 'border-primary/70 bg-gradient-to-br from-primary/15 via-primary/8 to-transparent shadow-lg shadow-primary/20'
                                                    : 'border-border/50 hover:border-primary/30 bg-card/50 hover:bg-card/80'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-foreground truncate">{group.name}</h4>
                                                        {isSelected && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                transition={{ type: "spring" }}
                                                            >
                                                                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                                                                    <Check className="w-3 h-3 text-white" />
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                    {group.instructors && Array.isArray(group.instructors) && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {group.instructors.length} instructor{group.instructors.length !== 1 ? 's' : ''}
                                                        </p>
                                                    )}
                                                </div>
                                                {isGroupOwner(group.owner) && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openRenameDialog(group);
                                                                }}
                                                            >
                                                                <Edit3 className="w-4 h-4 mr-2" />
                                                                Rename Group
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Side - Search & Results */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Search className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">Search Instructors</h3>
                        </div>

                        {/* Search Input */}
                        <motion.div 
                            className="relative"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl blur-xl opacity-60" />
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by username or instructor name..."
                                    className="pl-12 pr-12 h-12 bg-background/90 backdrop-blur-xl border-2 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/70 focus:ring-4 focus:ring-primary/20 transition-all duration-300 rounded-xl"
                                />
                                {searching && (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2"
                                    >
                                        <Loader2 className="w-5 h-5 text-primary" />
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>

                        {/* Search Results */}
                        <AnimatePresence mode="wait">
                            {searchQuery.trim().length >= 2 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar"
                                >
                                    {searchResults.length === 0 && !searching && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center py-12 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50"
                                        >
                                            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                                            <p className="text-muted-foreground font-semibold">No instructors found</p>
                                            <p className="text-xs text-muted-foreground/70 mt-1">Try a different search term</p>
                                        </motion.div>
                                    )}
                                    
                                    {searchResults.map((instructor, index) => (
                                        <motion.div
                                            key={instructor.documentId}
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ 
                                                delay: index * 0.03,
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 20
                                            }}
                                            whileHover={{ scale: 1.02, y: -4 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedInstructor(instructor)}
                                            className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-500 ${
                                                selectedInstructor?.documentId === instructor.documentId
                                                    ? 'border-primary/70 bg-gradient-to-br from-primary/15 via-primary/8 to-transparent shadow-xl shadow-primary/20'
                                                    : 'border-border/50 hover:border-primary/50 bg-card/80 hover:bg-card backdrop-blur-xl hover:shadow-lg'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <QuantumAvatar
                                                    src={getAvatarUrl(instructor.avatar) ?? undefined}
                                                    alt={instructor.name}
                                                    size="md"
                                                    variant="quantum"
                                                    showStatus
                                                    verified={instructor.is_verified}
                                                    interactive
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-foreground truncate">
                                                            {instructor.name}
                                                        </h4>
                                                        {instructor.is_verified && (
                                                            <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    {instructor.bio && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {instructor.bio}
                                                        </p>
                                                    )}
                                                    {instructor.user && typeof instructor.user === 'object' && instructor.user.username && (
                                                        <p className="text-xs text-muted-foreground/70 mt-1">
                                                            @{instructor.user.username}
                                                        </p>
                                                    )}
                                                </div>
                                                {selectedInstructor?.documentId === instructor.documentId && (
                                                    <motion.div
                                                        initial={{ scale: 0, rotate: -180 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        transition={{ type: "spring", stiffness: 300 }}
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                                                            <Check className="w-4 h-4 text-white" />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Empty State */}
                        {searchQuery.trim().length < 2 && !selectedInstructor && (
                            <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl border border-border/50">
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Start typing to search for instructors</p>
                                <p className="text-xs mt-1">Minimum 2 characters</p>
                            </div>
                        )}

                        {/* Selected Instructor & Message */}
                        {selectedInstructor && selectedGroup && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                animate={{ opacity: 1, height: "auto", scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className="relative space-y-4 p-6 bg-gradient-to-br from-card via-card/95 to-card rounded-xl border border-primary/20 shadow-xl overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-pulse" />
                                
                                <div className="relative space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <QuantumAvatar
                                                src={getAvatarUrl(selectedInstructor.avatar) ?? undefined}
                                                alt={selectedInstructor.name}
                                                size="md"
                                                variant="quantum"
                                                verified={selectedInstructor.is_verified}
                                                interactive
                                            />
                                            <div>
                                                <h4 className="font-semibold text-foreground">
                                                    Inviting {selectedInstructor.name}
                                                </h4>
                                                <p className="text-xs text-muted-foreground">
                                                    to {selectedGroup.name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedGroup && isGroupOwner(selectedGroup.owner) && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openRenameDialog(selectedGroup);
                                                            }}
                                                        >
                                                            <Edit3 className="w-4 h-4 mr-2" />
                                                            Rename Group
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedInstructor(null)}
                                                className="hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <Textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Hi! I'd like to invite you to join my group..."
                                        rows={3}
                                        className="bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                                    />

                                    <Button
                                        onClick={handleInvite}
                                        disabled={sending || !selectedGroupId}
                                        className="w-full bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 hover:from-blue-600 hover:via-purple-700 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                        {sending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                Send Invitation
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </AnimatedModalContent>
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
                            Enter a new name for this instructor group.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <Label htmlFor="invite-rename-group" className="text-sm font-medium text-muted-foreground">
                            New group name
                        </Label>
                        <Input
                            id="invite-rename-group"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            placeholder="Enter new group name"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={closeRenameDialog}
                        >
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
        </AnimatedModal>
    );
}

