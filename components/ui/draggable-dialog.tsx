// components/ui/draggable-dialog.tsx
"use client";

import React, { useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface DraggableDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function DraggableDialog({
                                    open,
                                    onOpenChange,
                                    title,
                                    description = "Move this dialog by dragging the handle.",
                                    children,
                                    className,
                                }: DraggableDialogProps) {
    const dragHandleRef = useRef<HTMLDivElement>(null);
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: "draggable-dialog",
        disabled: !open,
        handle: dragHandleRef, // Restrict dragging to the handle
    });

    const style = transform
        ? {
            transform: CSS.Translate.toString(transform),
            transition: "transform 0.2s ease",
            touchAction: "none", // Prevent default touch behaviors
        }
        : undefined;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                ref={setNodeRef}
                style={style}
                className={`sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl rounded-2xl ${className}`}
                onPointerDown={(e) => e.stopPropagation()} // Stop propagation at content level
            >
                <div
                    ref={dragHandleRef}
                    {...listeners}
                    {...attributes}
                    className="flex items-center justify-center h-10 bg-gradient-to-r from-blue-500 to-purple-500 cursor-move text-white text-sm font-medium rounded-t-2xl"
                >
                    <GripVertical className="w-5 h-5 mr-1" />
                    Drag to Move
                </div>
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent text-center">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground text-center mt-1">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="p-6 pt-0">{children}</div>
            </DialogContent>
        </Dialog>
    );
}