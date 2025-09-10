"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
import {Button} from "@/components/ui/moving-border"
import { Input } from "@/components/ui/input";
import { Share2, Copy } from "lucide-react";
import { toast } from "sonner";

interface ForumShareDialogProps {
    isOpen: boolean;
    onClose: () => void;
    postTitle: string;
    postId: string;
}

export function ForumShareDialog({ isOpen, onClose, postTitle, postId }: ForumShareDialogProps) {
    const postLink = `${window.location.origin}/forum/${postId}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(postLink);
            toast.success("Post link copied to clipboard!");
        } catch (error) {
            console.error("Failed to copy link:", error);
            toast.error("Failed to copy link.");
        }
        onClose();
    };

    const handleShareToPlatform = (platform: string) => {
        let shareUrl = "";
        const text = `Check out this discussion: ${postTitle}`;

        switch (platform) {
            case "twitter":
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postLink)}`;
                break;
            case "facebook":
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postLink)}`;
                break;
            case "linkedin":
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postLink)}`;
                break;
            default:
                break;
        }

        if (shareUrl) {
            window.open(shareUrl, "_blank", "width=600,height=400");
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="">
                <DialogHeader>
                    <DialogTitle>Share this discussion</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-center gap-2 p-2 bg-transparent rounded active:border-0 focus-visible:ring-0">
                        <Input
                            value={postLink}
                            readOnly
                            className="flex-1 border-gray-800 shadow-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <Button onClick={handleCopyLink}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => handleShareToPlatform("twitter")}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Twitter
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => handleShareToPlatform("facebook")}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Facebook
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => handleShareToPlatform("linkedin")}>
                            <Share2 className="w-4 h-4 mr-2" />
                            LinkedIn
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}