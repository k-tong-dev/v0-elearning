"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    AnimatedModal,
    AnimatedModalContent,
    AnimatedModalHeader,
    AnimatedModalTitle,
    AnimatedModalDescription,
} from "@/components/ui/aceternity/AnimatedModal";
import { FolderPlus, Loader2 } from "lucide-react";
import { createInstructorGroup } from "@/integrations/strapi/instructor-group";
import { toast } from "sonner";

interface CreateGroupModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (group: any) => void;
    currentUserId: string | number;
}

export function CreateGroupModal({
    open,
    onClose,
    onSuccess,
    currentUserId,
}: CreateGroupModalProps) {
    const [groupName, setGroupName] = useState("");
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!groupName.trim()) {
            toast.error("Please enter a group name");
            return;
        }
        
        if (!currentUserId) {
            toast.error("User ID is required");
            console.error("CreateGroupModal: currentUserId is missing", currentUserId);
            return;
        }

        console.log("Creating group with:", { groupName: groupName.trim(), currentUserId, type: typeof currentUserId });
        
        setCreating(true);
        try {
            const newGroup = await createInstructorGroup(groupName.trim(), currentUserId);
            if (newGroup) {
                toast.success(`Group "${groupName}" created successfully!`);
                setGroupName("");
                onSuccess(newGroup);
                onClose();
            } else {
                toast.error("Failed to create group");
            }
        } catch (error: any) {
            console.error("Error creating group:", error);
            toast.error(error.message || "Failed to create group");
        } finally {
            setCreating(false);
        }
    };

    const handleClose = () => {
        if (!creating) {
            setGroupName("");
            onClose();
        }
    };

    return (
        <AnimatedModal 
            open={open} 
            onOpenChange={handleClose}
            className="sm:max-w-md bg-gradient-to-br from-background via-background to-accent/5 border-2 border-border/50 backdrop-blur-2xl shadow-2xl dark:shadow-purple-500/10"
            closeOnOverlayClick={!creating}
        >
            <AnimatedModalContent className="bg-transparent p-0">
                <AnimatedModalHeader className="space-y-4 pb-6 border-b border-border/50 bg-gradient-to-r from-transparent via-accent/10 to-transparent px-8 pt-8">
                    <div className="flex items-center gap-4">
                        <motion.div 
                            className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 dark:from-blue-500/30 dark:via-purple-500/30 dark:to-pink-500/30 border border-primary/20"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <FolderPlus className="w-7 h-7 text-primary" />
                        </motion.div>
                        <div>
                            <AnimatedModalTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                                Create Instructor Group
                            </AnimatedModalTitle>
                            <AnimatedModalDescription className="text-muted-foreground mt-2">
                                Organize your instructors into groups
                            </AnimatedModalDescription>
                        </div>
                    </div>
                </AnimatedModalHeader>

                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Group Name
                        </label>
                        <Input
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Enter group name..."
                            className="h-12 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && groupName.trim() && !creating) {
                                    handleCreate();
                                } else if (e.key === "Escape") {
                                    handleClose();
                                }
                            }}
                            autoFocus
                            disabled={creating}
                        />
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={creating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={!groupName.trim() || creating}
                            className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 hover:from-blue-600 hover:via-purple-700 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <FolderPlus className="w-4 h-4 mr-2" />
                                    Create Group
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </AnimatedModalContent>
        </AnimatedModal>
    );
}

