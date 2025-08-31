"use client"

import React, { useRef } from "react" // Import useRef
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

interface AvatarUploadFieldProps {
    avatar: string
    name: string
    isUploadingAvatar: boolean
    onAvatarChange: (file: File) => Promise<void>
}

// Mock function to simulate image upload to a storage service
const mockUploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const mockImageUrl = URL.createObjectURL(file); // Use object URL for immediate preview
            console.log("Mock upload successful, URL:", mockImageUrl);
            resolve(mockImageUrl); // In a real app, this would be a permanent URL
        }, 1500);
    });
};

export function AvatarUploadField({
                                      avatar,
                                      name,
                                      isUploadingAvatar,
                                      onAvatarChange,
                                  }: AvatarUploadFieldProps) {
    const fileInputRef = useRef<HTMLInputElement>(null); // Create a ref for the file input

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            toast.loading("Uploading avatar...", { id: "avatar-upload" });
            try {
                const imageUrl = await mockUploadImage(file); // Simulate upload
                await onAvatarChange(file); // Pass the file to the parent handler
                toast.success("Avatar uploaded successfully!", { id: "avatar-upload" });
            } catch (error) {
                console.error("Failed to upload avatar:", error);
                toast.error("Failed to upload avatar.", { id: "avatar-upload" });
            }
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click(); // Programmatically click the hidden file input
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24 border-4 border-primary shadow-md avatar-border-gradient"> {/* Applied avatar-border-gradient */}
                <AvatarImage src={avatar || "/placeholder-user.jpg"} />
                <AvatarFallback>
                    {name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
            </Avatar>

            {/* Hidden file input */}
            <Input
                id="avatar-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploadingAvatar}
                ref={fileInputRef} // Attach the ref
            />

            {/* Button to trigger the file input */}
            <Button type="button" variant="outline" size="sm" onClick={handleButtonClick} disabled={isUploadingAvatar}>
                {isUploadingAvatar ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <Upload className="w-4 h-4 mr-2" />
                )}
                {isUploadingAvatar ? "Uploading..." : "Change Avatar"}
            </Button>
        </div>
    );
}