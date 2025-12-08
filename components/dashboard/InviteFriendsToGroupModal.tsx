"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    AnimatedModal,
    AnimatedModalContent,
    AnimatedModalHeader,
    AnimatedModalTitle,
    AnimatedModalDescription,
} from "@/components/ui/aceternity/AnimatedModal";
import { Badge } from "@/components/ui/badge";
import { QuantumAvatar } from "@/components/ui/quantum-avatar";
import { getAvatarUrl } from "@/lib/getAvatarUrl";
import { cn } from "@/utils/utils";
import { Search, UserPlus, Users, Loader2, Sparkles } from "lucide-react";

export interface InviteCandidate {
    id: number;
    name: string;
    email?: string;
    bio?: string;
    avatar?: string | null;
    documentId?: string | null;
    groupLimit?: number | null;
    currentGroupCount?: number | null;
    limitReached?: boolean;
    isCheckingCapacity?: boolean;
}

interface InviteFriendsToGroupModalProps {
    open: boolean;
    onClose: () => void;
    groupName: string;
    candidates: InviteCandidate[];
    onAddMember: (candidate: InviteCandidate) => void;
    isProcessing?: (candidateId: number) => boolean;
    isLimitReached?: boolean;
    memberLimit?: number;
    currentCount?: number;
    slotsRemaining?: number;
}

export function InviteFriendsToGroupModal({
    open,
    onClose,
    groupName,
    candidates,
    onAddMember,
    isProcessing,
    isLimitReached = false,
    memberLimit,
    currentCount,
    slotsRemaining,
}: InviteFriendsToGroupModalProps) {
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => setSearchTerm(""), 250);
            return () => clearTimeout(timer);
        }
    }, [open]);

    const filteredCandidates = useMemo(() => {
        if (!searchTerm.trim()) return candidates;
        const lowered = searchTerm.toLowerCase();
        return candidates.filter((candidate) => {
            return (
                candidate.name.toLowerCase().includes(lowered) ||
                candidate.email?.toLowerCase().includes(lowered) ||
                candidate.bio?.toLowerCase().includes(lowered)
            );
        });
    }, [candidates, searchTerm]);

    const handleAdd = (candidate: InviteCandidate) => {
        if (isLimitReached || candidate.limitReached || candidate.isCheckingCapacity) return;
        onAddMember(candidate);
    };

    return (
        <AnimatedModal
            open={open}
            onOpenChange={(value) => {
                if (!value) {
                    onClose();
                }
            }}
            closeOnOverlayClick
            className="sm:max-w-5xl bg-gradient-to-br from-background via-background to-primary/5 border border-border/60 backdrop-blur-2xl shadow-2xl"
        >
            <AnimatedModalContent className="bg-transparent p-0">
                <AnimatedModalHeader className="space-y-4 px-8 pt-8 pb-6 border-b border-border/50">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                            <motion.div
                                className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-primary/20"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 260 }}
                            >
                                <UserPlus className="w-6 h-6 text-primary" />
                            </motion.div>
                            <div>
                                <AnimatedModalTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-300 dark:via-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                                    Add members to {groupName}
                                </AnimatedModalTitle>
                                <AnimatedModalDescription className="text-muted-foreground">
                                    Choose teammates from your friends list and collaborate inside this circle.
                                </AnimatedModalDescription>
                            </div>
                        </div>
                        {memberLimit !== undefined && currentCount !== undefined && (
                            <Badge variant="outline" className="border-border/60 bg-background/60 text-muted-foreground">
                                {currentCount}/{memberLimit} members
                            </Badge>
                        )}
                    </div>
                </AnimatedModalHeader>

                <div className="space-y-6 px-8 py-8">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <p className="text-sm text-muted-foreground">
                                    {isLimitReached
                                        ? "Member limit reached. Remove someone before inviting new members."
                                        : slotsRemaining !== undefined
                                        ? `${slotsRemaining} spot${slotsRemaining === 1 ? "" : "s"} remaining`
                                        : "Search and add members instantly."}
                                </p>
                            </div>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search friends by name or email"
                                className="pl-11 pr-4 h-11 rounded-xl border border-border/60 bg-background/80 backdrop-blur-xl"
                            />
                        </div>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1">
                        <AnimatePresence mode="popLayout">
                            {filteredCandidates.length === 0 ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-background/70 px-6 py-16 text-center text-muted-foreground"
                                >
                                    <Users className="w-10 h-10 opacity-40" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-foreground">No matches</p>
                                        <p className="text-xs text-muted-foreground/80">Try a different keyword.</p>
                                    </div>
                                </motion.div>
                            ) : (
                                filteredCandidates.map((candidate) => {
                                    const processing = isProcessing?.(candidate.id) ?? false;
                                    const limitReached = candidate.limitReached ?? false;
                                    const inviteDisabled = processing || isLimitReached || limitReached;
                                    const ctaLabel = limitReached ? "User Limit Reached" : "Add Member";
                                    const showSpinner = processing;
                                    return (
                                        <motion.div
                                            layout
                                            key={candidate.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className={cn(
                                                "flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 shadow-sm",
                                                processing && "ring-1 ring-primary/40"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <QuantumAvatar
                                                    src={candidate.avatar ?? undefined}
                                                    alt={candidate.name}
                                                    size="sm"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-foreground truncate">{candidate.name}</p>
                                                    {candidate.email && (
                                                        <p className="text-xs text-muted-foreground truncate">{candidate.email}</p>
                                                    )}
                                                    {candidate.bio && (
                                                        <p className="text-xs text-muted-foreground/70 truncate">{candidate.bio}</p>
                                                    )}
                                                    {candidate.groupLimit && candidate.groupLimit > 0 && (
                                                        <p className="text-[11px] text-muted-foreground/70 mt-1">
                                                            {candidate.currentGroupCount !== null && candidate.currentGroupCount !== undefined
                                                                ? `${candidate.currentGroupCount}/${candidate.groupLimit} groups used`
                                                                : "Checking group usage..."}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={inviteDisabled}
                                                onClick={() => handleAdd(candidate)}
                                                className="flex items-center gap-2"
                                            >
                                                {showSpinner ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <UserPlus className="w-4 h-4" />
                                                )}
                                                {ctaLabel}
                                            </Button>
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </AnimatedModalContent>
        </AnimatedModal>
    );
}
