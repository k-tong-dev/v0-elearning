"use client";

import React, { useState, useEffect } from "react";
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
import { Search, UserPlus, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { searchInstructors, sendInvitation } from "@/integrations/strapi/instructor-invitation";
import { Instructor } from "@/integrations/strapi/instructor";
import { toast } from "sonner";
import { getAvatarUrl } from "@/lib/getAvatarUrl";
import { QuantumAvatar } from "@/components/ui/quantum-avatar";

interface InviteInstructorModalProps {
    open: boolean;
    onClose: () => void;
    currentInstructorId: string | number;
    onInviteSent?: () => void;
}

export function InviteInstructorModal({
    open,
    onClose,
    currentInstructorId,
    onInviteSent,
}: InviteInstructorModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Instructor[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

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
                // Filter out current instructor
                const filtered = results.filter(
                    (instructor) => 
                        instructor.documentId !== currentInstructorId && 
                        instructor.id !== currentInstructorId
                );
                setSearchResults(filtered);
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
    }, [searchQuery, currentInstructorId]);

    const handleInvite = async () => {
        if (!selectedInstructor) return;

        setSending(true);
        try {
            // Ensure we use numeric IDs for both instructors
            // sendInvitation will handle conversion from documentId to numeric ID if needed
            // But we prefer to use numeric ID directly if available
            const toInstructorId = selectedInstructor.id || selectedInstructor.documentId;
            const fromInstructorId = currentInstructorId;
            
            console.log("Sending invitation:", {
                fromInstructorId,
                fromInstructorIdType: typeof fromInstructorId,
                toInstructorId,
                toInstructorIdType: typeof toInstructorId,
                selectedInstructor: {
                    id: selectedInstructor.id,
                    documentId: selectedInstructor.documentId,
                    name: selectedInstructor.name
                }
            });
            
            try {
                const success = await sendInvitation(
                    fromInstructorId,
                    toInstructorId,
                    message.trim() || undefined
                );

                if (success) {
                    toast.success(`Invitation sent to ${selectedInstructor.name}!`);
                    // Only reset selected instructor and message, keep everything else
                    const invitedId = selectedInstructor.id || selectedInstructor.documentId;
                    setSelectedInstructor(null);
                    setMessage("");
                    // Remove invited instructor from search results but keep search query and other results
                    setSearchResults(prev => prev.filter(inst => 
                        (inst.id !== invitedId) && 
                        (inst.documentId !== invitedId)
                    ));
                    onInviteSent?.();
                    // Don't close modal - allow multiple invitations
                    // Don't reset search query - keep it so user can continue searching
                } else {
                    toast.error("Failed to send invitation");
                }
            } catch (error: any) {
                // Handle duplicate invitation error
                if (error.message && (error.message.includes('already pending') || error.message.includes('already have'))) {
                    toast.error(error.message);
                } else {
                    toast.error("Failed to send invitation");
                }
            }
        } catch (error) {
            console.error("Invite error:", error);
            toast.error("Failed to send invitation");
        } finally {
            setSending(false);
        }
    };

    const reset = () => {
        // Only reset when modal is closed, not on every open/close
        setSearchQuery("");
        setSearchResults([]);
        setSelectedInstructor(null);
        setMessage("");
    };

    useEffect(() => {
        // Only reset when modal is actually closed (not just when open changes)
        if (!open) {
            // Use a small delay to ensure state is preserved during transitions
            const timer = setTimeout(() => {
            reset();
            }, 300); // Wait for animation to complete
            
            return () => clearTimeout(timer);
        }
    }, [open]);

    return (
        <AnimatedModal 
            open={open} 
            onOpenChange={onClose}
            className="sm:max-w-3xl bg-gradient-to-br from-background via-background to-accent/5 border-2 border-border/50 backdrop-blur-2xl shadow-2xl dark:shadow-purple-500/10"
        >
            <AnimatedModalContent className="bg-transparent">
                <AnimatedModalHeader className="space-y-4 pb-6 border-b border-border/50 bg-gradient-to-r from-transparent via-accent/10 to-transparent">
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
                                    Invite Instructor
                                </AnimatedModalTitle>
                                <AnimatedModalDescription className="text-muted-foreground mt-2 text-base">
                                    Search for instructors by username or name and invite them to collaborate
                                </AnimatedModalDescription>
                            </div>
                        </div>
                    </div>
                </AnimatedModalHeader>

                <div className="space-y-6 mt-6">
                    {/* Ultra Enhanced Search */}
                    <motion.div 
                        className="relative"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 rounded-2xl blur-2xl opacity-60" />
                        <div className="relative">
                            <motion.div
                                animate={{ 
                                    scale: searching ? [1, 1.02, 1] : 1,
                                }}
                                transition={{ 
                                    duration: 1.5, 
                                    repeat: searching ? Infinity : 0,
                                    ease: "easeInOut"
                                }}
                            >
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground dark:text-muted-foreground z-10" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by username or instructor name..."
                                    className="pl-14 pr-14 h-14 bg-background/90 dark:bg-background/80 backdrop-blur-xl border-2 border-border/50 dark:border-border/70 text-foreground placeholder:text-muted-foreground focus:border-primary/70 dark:focus:border-primary/50 focus:ring-4 focus:ring-primary/20 dark:focus:ring-primary/10 transition-all duration-300 rounded-xl text-base shadow-lg"
                                />
                                {searching && (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="absolute right-5 top-1/2 -translate-y-1/2"
                                    >
                                        <Loader2 className="w-5 h-5 text-primary" />
                                    </motion.div>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Ultra Enhanced Search Results */}
                    <AnimatePresence mode="wait">
                        {searchQuery.trim().length >= 2 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar"
                            >
                                {searchResults.length === 0 && !searching && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-16 bg-gradient-to-br from-muted/30 to-muted/10 dark:from-muted/20 dark:to-muted/5 rounded-2xl border-2 border-border/50 dark:border-border/30"
                                    >
                                        <AlertCircle className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30 dark:text-muted-foreground/40" />
                                        <p className="text-muted-foreground dark:text-muted-foreground font-semibold text-lg">No instructors found</p>
                                        <p className="text-sm text-muted-foreground/70 dark:text-muted-foreground/70 mt-2">Try a different search term</p>
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
                                        className={`group relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-500 ${
                                            selectedInstructor?.documentId === instructor.documentId
                                                ? 'border-primary/70 dark:border-primary/50 bg-gradient-to-br from-primary/15 via-primary/8 to-transparent dark:from-primary/20 dark:via-primary/10 shadow-2xl shadow-primary/20 dark:shadow-primary/10'
                                                : 'border-border/50 dark:border-border/70 hover:border-primary/50 dark:hover:border-primary/40 bg-card/80 dark:bg-card/60 hover:bg-card dark:hover:bg-card/80 backdrop-blur-xl hover:shadow-xl dark:hover:shadow-2xl'
                                        }`}
                                        onClick={() => setSelectedInstructor(instructor)}
                                    >
                                        {/* Enhanced Glow effect on hover */}
                                        <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 dark:group-hover:from-blue-500/5 dark:group-hover:via-purple-500/5 dark:group-hover:to-pink-500/5 transition-all duration-500 rounded-2xl blur-xl`} />
                                        {/* Animated border gradient */}
                                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/20 group-hover:via-purple-500/20 group-hover:to-pink-500/20 dark:group-hover:from-blue-500/10 dark:group-hover:via-purple-500/10 dark:group-hover:to-pink-500/10 transition-all duration-500 -z-10`} />
                                    
                                        <div className="relative flex items-center gap-5 w-full z-10">
                                            <motion.div
                                                whileHover={{ scale: 1.1 }}
                                                transition={{ type: "spring", stiffness: 300 }}
                                            >
                                                <QuantumAvatar
                                                    src={getAvatarUrl(instructor.avatar)}
                                                    alt={instructor.name}
                                                    size="lg"
                                                    variant="quantum"
                                                    showStatus
                                                    status="online"
                                                    verified={instructor.is_verified}
                                                    interactive
                                                />
                                            </motion.div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2.5 mb-2">
                                                    <h3 className="font-bold text-lg text-foreground dark:text-foreground truncate">
                                                        {instructor.name}
                                                    </h3>
                                                    {instructor.is_verified && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ type: "spring", delay: 0.2 }}
                                                        >
                                                            <CheckCircle2 className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                                        </motion.div>
                                                    )}
                                                </div>
                                                {instructor.bio && (
                                                    <p className="text-sm text-muted-foreground dark:text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                                                        {instructor.bio}
                                                    </p>
                                                )}
                                                {instructor.user && typeof instructor.user === 'object' && instructor.user.username && (
                                                    <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground/70 font-medium">
                                                        @{instructor.user.username}
                                                    </p>
                                                )}
                                            </div>
                                            {selectedInstructor?.documentId === instructor.documentId && (
                                                <motion.div
                                                    initial={{ scale: 0, rotate: -180 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                                    className="flex-shrink-0"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Enhanced Selected Instructor & Message */}
                    {selectedInstructor && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, scale: 0.95 }}
                            animate={{ opacity: 1, height: "auto", scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="relative space-y-4 p-6 bg-gradient-to-br from-card via-card/95 to-card rounded-xl border border-primary/20 shadow-xl overflow-hidden"
                        >
                            {/* Animated background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-pulse" />
                            
                            <div className="relative space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <QuantumAvatar
                                            src={getAvatarUrl(selectedInstructor.avatar)}
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
                                            <p className="text-sm text-muted-foreground">
                                                Optional: Add a personal message
                                            </p>
                                        </div>
                                    </div>
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

                                <Textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Hi! I'd like to invite you to collaborate on my courses..."
                                    rows={3}
                                    className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                                />

                                <Button
                                    onClick={handleInvite}
                                    disabled={sending}
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

                    {/* Empty State */}
                    {searchQuery.trim().length < 2 && !selectedInstructor && (
                        <div className="text-center py-12 text-muted-foreground">
                            <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>Start typing to search for instructors</p>
                            <p className="text-sm mt-2">
                                Search by username or instructor name (minimum 2 characters)
                            </p>
                        </div>
                    )}
                </div>
            </AnimatedModalContent>
        </AnimatedModal>
    );
}

