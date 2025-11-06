"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Check, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantumAvatar } from "@/components/ui/quantum-avatar";
import { getAvatarUrl } from "@/lib/getAvatarUrl";
import { Instructor } from "@/integrations/strapi/instructor";
import { AnimatedModal } from "@/components/ui/aceternity/AnimatedModal";

interface SelectInstructorsModalProps {
    open: boolean;
    onClose: () => void;
    availableInstructors: Instructor[];
    onConfirm: (selectedInstructorIds: number[]) => Promise<void>;
    groupName: string;
}

export function SelectInstructorsModal({
    open,
    onClose,
    availableInstructors,
    onConfirm,
    groupName,
}: SelectInstructorsModalProps) {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (open) {
            setSelectedIds(new Set());
            setIsAdding(false);
        }
    }, [open]);

    const toggleSelection = (instructorId: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(instructorId)) {
            newSelected.delete(instructorId);
        } else {
            newSelected.add(instructorId);
        }
        setSelectedIds(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === availableInstructors.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(availableInstructors.map(inst => Number(inst.id))));
        }
    };

    const handleConfirm = async () => {
        if (selectedIds.size === 0) {
            return;
        }
        setIsAdding(true);
        try {
            await onConfirm(Array.from(selectedIds));
            // Close modal after successful addition
            onClose();
        } catch (error) {
            console.error("Error adding instructors:", error);
            // Keep modal open on error so user can retry
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <AnimatedModal
            open={open}
            onOpenChange={onClose}
            closeOnOverlayClick={true}
        >
            <div className="w-full max-w-2xl mx-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Select Instructors</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Choose instructors to add to "{groupName}"
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {selectedIds.size} of {availableInstructors.length} selected
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                    >
                        {selectedIds.size === availableInstructors.length ? "Deselect All" : "Select All"}
                    </Button>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2 mb-6">
                    {availableInstructors.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No instructors available
                        </div>
                    ) : (
                        availableInstructors.map((instructor) => {
                            const isSelected = selectedIds.has(Number(instructor.id));
                            return (
                                <motion.div
                                    key={instructor.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => toggleSelection(Number(instructor.id))}
                                    className={`
                                        flex items-center gap-4 p-4 rounded-lg border cursor-pointer
                                        transition-all duration-200
                                        ${isSelected 
                                            ? "bg-primary/10 border-primary shadow-md" 
                                            : "bg-card/50 border-border hover:border-primary/50 hover:bg-card"
                                        }
                                    `}
                                >
                                    <div className={`
                                        flex items-center justify-center w-6 h-6 rounded-full border-2
                                        ${isSelected 
                                            ? "bg-primary border-primary" 
                                            : "border-border"
                                        }
                                    `}>
                                        {isSelected && (
                                            <Check className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                    <QuantumAvatar
                                        src={getAvatarUrl(instructor.avatar) || undefined}
                                        alt={instructor.name}
                                        size="md"
                                        verified={instructor.is_verified}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-foreground truncate">
                                            {instructor.name}
                                        </h3>
                                        {instructor.bio && (
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {instructor.bio}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={selectedIds.size === 0 || isAdding}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white disabled:opacity-50"
                    >
                        {isAdding ? (
                            <>
                                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Add {selectedIds.size > 0 ? `${selectedIds.size} ` : ""}Instructor{selectedIds.size !== 1 ? "s" : ""}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </AnimatedModal>
    );
}

