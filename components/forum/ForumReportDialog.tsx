"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Flag } from "lucide-react";
import { toast } from "sonner";

interface ForumReportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    itemId: string;
    itemType: 'post' | 'comment' | 'reply';
    onReportSubmit: (itemId: string, itemType: 'post' | 'comment' | 'reply', reason: string) => void;
}

export function ForumReportDialog({ isOpen, onClose, itemId, itemType, onReportSubmit }: ForumReportDialogProps) {
    const [reportReason, setReportReason] = useState("");

    const handleSubmit = () => {
        if (reportReason.trim()) {
            onReportSubmit(itemId, itemType, reportReason);
            setReportReason("");
            onClose();
        } else {
            toast.error("Please provide a reason for reporting.");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Report {itemType === 'post' ? 'this discussion' : itemType}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Textarea
                        placeholder="Please describe why you are reporting this content..."
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="min-h-[100px]"
                    />
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleSubmit}>
                            <Flag className="w-4 h-4 mr-2" />
                            Submit Report
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}