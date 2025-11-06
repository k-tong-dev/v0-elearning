"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
    ArrowLeft, 
    Save, 
    Upload, 
    User, 
    Link2, 
    Settings, 
    Youtube, 
    Linkedin, 
    Github, 
    Facebook, 
    Instagram,
    Video,
    Lock,
    CheckCircle
} from "lucide-react";
import { createInstructor, updateInstructor, Instructor } from "@/integrations/strapi/instructor";
import { toast } from "sonner";
import { getAvatarUrl } from "@/lib/getAvatarUrl";
import { uploadStrapiFile, deleteStrapiFile } from "@/integrations/strapi/utils";
import { QuantumAvatar } from "@/components/ui/quantum-avatar";
import { AvatarModal } from "@/components/ui/aceternity/avatar-modal";
import { useAvatarModal } from "@/hooks/useAvatarModal";
import { AvatarDock, AvatarDockIcon } from "@/components/ui/aceternity/avatar-dock";
import { avatarList } from "@/lib/static-avatars";
import Image from "next/image";
import { cn } from "@/utils/utils";
import { Loader2, ImageIcon } from "lucide-react";

interface CreateInstructorFormProps {
    onCancel: () => void;
    onSuccess: () => void;
    editingInstructor?: Instructor | null;
}

export default function CreateInstructorForm({ onCancel, onSuccess, editingInstructor }: CreateInstructorFormProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        specializations: '',
        avatar: null as File | null,
        avatarPreview: '' as string | null,
        avatarStrapiObject: null as any,
        cover: null as File | null,
        coverPreview: '' as string | null,
        youtube: '',
        linkin: '',
        github: '',
        facebook: '',
        tiktok: '',
        instagram: '',
        is_active: true,
        monetization: false,
    });

    // Avatar modal handler
    const handleAvatarChange = async (file: File | string) => {
        setIsUploadingAvatar(true);
        try {
            let fileToUpload: File;
            
            // If it's a string (template URL), convert it to a File object
            if (typeof file === 'string') {
                try {
                    const response = await fetch(file);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch image: ${response.statusText}`);
                    }
                    const blob = await response.blob();
                    const urlParts = file.split('/');
                    const filename = urlParts[urlParts.length - 1] || 'avatar.png';
                    const mimeType = blob.type || 'image/png';
                    fileToUpload = new File([blob], filename, { type: mimeType });
                } catch (error: any) {
                    console.error("Error converting template URL to File:", error);
                    throw new Error(`Failed to load template avatar: ${error.message}`);
                }
            } else {
                fileToUpload = file;
            }

            // Get old avatar ID for cleanup (if editing)
            let oldAvatarId: number | string | null = null;
            if (editingInstructor?.avatar && typeof editingInstructor.avatar === 'object') {
                if (editingInstructor.avatar.id) {
                    oldAvatarId = editingInstructor.avatar.id;
                } else if (editingInstructor.avatar.documentId) {
                    oldAvatarId = editingInstructor.avatar.documentId;
                }
            }

            // Upload new avatar
            const uploadedFile = await uploadStrapiFile(fileToUpload);
            
            // Delete old avatar if exists (non-blocking)
            if (oldAvatarId && oldAvatarId !== uploadedFile.id) {
                deleteStrapiFile(oldAvatarId).catch((error) => {
                    console.warn("Failed to delete old avatar:", error);
                });
            }

            const previewUrl = uploadedFile.formats?.thumbnail?.url || uploadedFile.formats?.small?.url || uploadedFile.url;
            const strapiURL = process.env.NEXT_PUBLIC_STRAPI_URL || '';
            const fullPreviewUrl = previewUrl ? `${strapiURL}${previewUrl}` : `${strapiURL}${uploadedFile.url}`;

            setFormData(prev => ({
                ...prev,
                avatar: fileToUpload,
                avatarPreview: fullPreviewUrl,
                avatarStrapiObject: uploadedFile,
            }));
        } catch (error: any) {
            console.error("Avatar upload error:", error);
            toast.error(error.message || "Failed to upload avatar");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const {
        isOpen: isAvatarModalOpen,
        openModal: openAvatarModal,
        closeModal: closeAvatarModal,
        selectedImage,
        previewURL,
        fileInputRef,
        setSelectedImage,
        setPreviewURL,
        handleFileChange: handleAvatarFileChange,
        handleSave: handleAvatarSave,
    } = useAvatarModal(handleAvatarChange);

    useEffect(() => {
        if (editingInstructor) {
            // Convert blocks format back to plain text for display
            let specializationsText = '';
            if (editingInstructor.specializations) {
                if (typeof editingInstructor.specializations === 'string') {
                    specializationsText = editingInstructor.specializations;
                } else if (Array.isArray(editingInstructor.specializations)) {
                    // Extract text from blocks format
                    specializationsText = editingInstructor.specializations
                        .map((block: any) => {
                            if (block.children && Array.isArray(block.children)) {
                                return block.children
                                    .map((child: any) => child.text || '')
                                    .join('');
                            }
                            return '';
                        })
                        .filter(Boolean)
                        .join('\n');
                } else {
                    specializationsText = JSON.stringify(editingInstructor.specializations);
                }
            }

            const avatarUrl = getAvatarUrl(editingInstructor.avatar);
            setFormData({
                name: editingInstructor.name || '',
                bio: editingInstructor.bio || '',
                specializations: specializationsText,
                avatar: null,
                avatarPreview: avatarUrl,
                avatarStrapiObject: typeof editingInstructor.avatar === 'object' ? editingInstructor.avatar : null,
                cover: null,
                coverPreview: getAvatarUrl(editingInstructor.cover) || null,
                youtube: editingInstructor.youtube || '',
                linkin: editingInstructor.linkin || '',
                github: editingInstructor.github || '',
                facebook: editingInstructor.facebook || '',
                tiktok: editingInstructor.tiktok || '',
                instagram: editingInstructor.instagram || '',
                is_active: editingInstructor.is_active ?? true,
                monetization: editingInstructor.monetization ?? false,
            });
            
        }
    }, [editingInstructor, setSelectedImage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            toast.error("Please enter an instructor name");
            return;
        }

        if (!user?.id) {
            toast.error("You must be logged in to create an instructor");
            return;
        }

        setLoading(true);
        try {
            // Step 1: Create or update instructor first (without new files)
            // Convert specializations text to blocks format if provided
            let specializations = null;
            if (formData.specializations && formData.specializations.trim()) {
                // Convert plain text to Strapi blocks format
                // Blocks format: [{ type: 'paragraph', children: [{ type: 'text', text: 'content' }] }]
                const lines = formData.specializations.split('\n').filter(line => line.trim());
                if (lines.length > 0) {
                    specializations = lines.map(line => ({
                        type: 'paragraph',
                        children: [{ type: 'text', text: line.trim() }]
                    }));
                }
            }

            const instructorData: any = {
                name: formData.name,
                user: user.id,
                bio: formData.bio,
                specializations: specializations,
                // Use new avatar if uploaded, otherwise keep existing
                avatar: formData.avatarStrapiObject?.id || (editingInstructor?.avatar ? (typeof editingInstructor.avatar === 'object' ? editingInstructor.avatar.id : editingInstructor.avatar) : null),
                cover: editingInstructor?.cover ? (typeof editingInstructor.cover === 'object' ? editingInstructor.cover.id : editingInstructor.cover) : null,
                youtube: formData.youtube || null,
                linkin: formData.linkin || null,
                github: formData.github || null,
                facebook: formData.facebook || null,
                tiktok: formData.tiktok || null,
                instagram: formData.instagram || null,
                // Admin-only fields - readonly, but still need to send current values
                is_active: editingInstructor?.is_active ?? true,
                monetization: editingInstructor?.monetization ?? false,
            };

            let instructorId: string | number;
            if (editingInstructor) {
                await updateInstructor(editingInstructor.documentId, instructorData);
                instructorId = editingInstructor.documentId;
            } else {
                const created = await createInstructor(instructorData as any);
                if (!created) {
                    throw new Error("Failed to create instructor");
                }
                instructorId = created.documentId;
            }

            // Step 2: Upload new files and attach them to the instructor
            // Avatar is already uploaded via handleAvatarChange, so we just need to ensure it's attached
            // The avatarStrapiObject should already have the uploaded file ID
            if (formData.avatarStrapiObject && formData.avatarStrapiObject.id) {
                // Avatar was already uploaded via modal, just ensure it's attached
                // This is already handled in instructorData above
            } else if (formData.avatar) {
                // Fallback: if avatar was selected but not uploaded via modal
                try {
                    setUploading(true);
                    const uploadResult = await uploadStrapiFile(formData.avatar);
                    if (uploadResult?.id) {
                        await updateInstructor(instructorId, {
                            avatar: uploadResult.id,
                        });
                    }
                } catch (error) {
                    console.error("Avatar upload error:", error);
                    toast.error("Instructor saved but failed to upload avatar. Please edit to retry.");
                } finally {
                    setUploading(false);
                }
            }

            if (formData.cover) {
                try {
                    setUploading(true);
                    // Upload file to media library
                    const uploadResult = await uploadStrapiFile(formData.cover);
                    if (uploadResult?.id) {
                        // Attach file to instructor's cover field
                        await updateInstructor(instructorId, {
                            cover: uploadResult.id,
                        });
                    }
                } catch (error) {
                    console.error("Cover upload error:", error);
                    toast.error("Instructor saved but failed to upload cover. Please edit to retry.");
                } finally {
                    setUploading(false);
                }
            }

            toast.success(editingInstructor ? "Instructor updated successfully!" : "Instructor created successfully!");
            onSuccess();
        } catch (error) {
            console.error("Error creating instructor:", error);
            toast.error("Failed to save instructor");
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                cover: file,
                coverPreview: URL.createObjectURL(file),
            }));
        }
    };

    const SocialIcon = ({ platform, className }: { platform: string; className?: string }) => {
        const icons: Record<string, React.ReactNode> = {
            youtube: <Youtube className={className} />,
            linkin: <Linkedin className={className} />,
            github: <Github className={className} />,
            facebook: <Facebook className={className} />,
            instagram: <Instagram className={className} />,
            tiktok: <Video className={className} />,
        };
        return icons[platform] || <Link2 className={className} />;
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button
                onClick={onCancel}
                variant="ghost"
                className="mb-6 text-foreground hover:bg-accent"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Instructors
            </Button>

            {/* Facebook-style Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/50 backdrop-blur-xl border border-border rounded-xl overflow-hidden"
            >
                {/* Cover Photo Section */}
                <div className="relative h-64 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                    {formData.coverPreview && (
                        <img
                            src={formData.coverPreview}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                    )}
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute top-4 right-4 z-20">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverFileChange}
                            className="hidden"
                            id="cover-upload-input"
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            onClick={() => document.getElementById('cover-upload-input')?.click()}
                            className="bg-black/60 hover:bg-black/80 text-white border-none backdrop-blur-sm shadow-lg w-10 h-10 rounded-full cursor-pointer relative z-10"
                            style={{ pointerEvents: 'auto' }}
                        >
                            <Upload className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Profile Section */}
                <div className="relative px-8 pb-6">
                    {/* Avatar */}
                    <div className="flex items-end gap-6 -mt-16 mb-4">
                        <div className="relative">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={openAvatarModal}
                                className="cursor-pointer"
                            >
                                {formData.avatarPreview ? (
                                    <QuantumAvatar
                                        src={formData.avatarPreview}
                                        alt="Avatar"
                                        size="2xl"
                                        variant="quantum"
                                        interactive
                                        animated
                                        glow
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-4 border-card hover:border-primary/50 transition-colors">
                                        <User className="w-16 h-16 text-white/50" />
                                    </div>
                                )}
                            </motion.div>
                            <div 
                                className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors border-2 border-card shadow-lg"
                                onClick={openAvatarModal}
                            >
                                <Upload className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div className="flex-1 pb-4">
                            <h2 className="text-3xl font-bold text-foreground mb-2">
                                {editingInstructor ? 'Edit Instructor Profile' : 'Create Instructor Profile'}
                            </h2>
                            <p className="text-muted-foreground">
                                {editingInstructor?.is_verified && (
                                    <span className="inline-flex items-center gap-1 text-blue-500">
                                        <CheckCircle className="w-4 h-4" />
                                        Verified Instructor
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Tabs with Liquid Glass Effect */}
                    <form onSubmit={handleSubmit}>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="relative grid w-full grid-cols-3 mb-6 p-1.5 bg-gradient-to-r from-background/50 via-muted/30 to-background/50 backdrop-blur-xl rounded-xl border border-border/50 shadow-lg overflow-hidden">
                                {/* Liquid glass background effect */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-2xl"
                                    animate={{
                                        backgroundPosition: ["0% 0%", "100% 100%"],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        repeatType: "reverse",
                                    }}
                                    style={{
                                        backgroundSize: "200% 200%",
                                    }}
                                />
                                
                                {/* Animated indicator */}
                                <motion.div
                                    className="absolute bottom-0 h-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-lg border border-white/20 shadow-lg"
                                    layoutId="activeTab"
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30,
                                    }}
                                    style={{
                                        width: "33.333%",
                                        left: activeTab === "profile" ? "0%" : activeTab === "social" ? "33.333%" : "66.666%",
                                    }}
                                />
                                
                                <TabsTrigger 
                                    value="profile" 
                                    className="relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:text-foreground data-[state=active]:font-semibold"
                                >
                                    <motion.div
                                        animate={{ rotate: activeTab === "profile" ? [0, 10, -10, 0] : 0 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <User className="w-4 h-4" />
                                    </motion.div>
                                    Profile
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="social" 
                                    className="relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:text-foreground data-[state=active]:font-semibold"
                                >
                                    <motion.div
                                        animate={{ rotate: activeTab === "social" ? [0, 10, -10, 0] : 0 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <Link2 className="w-4 h-4" />
                                    </motion.div>
                                    Social Links
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="admin" 
                                    className="relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:text-foreground data-[state=active]:font-semibold"
                                >
                                    <motion.div
                                        animate={{ rotate: activeTab === "admin" ? [0, 10, -10, 0] : 0 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <Settings className="w-4 h-4" />
                                    </motion.div>
                                    Admin Settings
                                </TabsTrigger>
                            </TabsList>

                            {/* Profile Tab */}
                            <TabsContent 
                                value="profile" 
                                className="space-y-6"
                            >
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name */}
                                    <div className="md:col-span-2">
                                        <label className="block text-foreground font-medium mb-2">
                                            Instructor Name *
                                        </label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Enter instructor display name"
                                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                                            required
                                        />
                                    </div>

                                    {/* Bio */}
                                    <div className="md:col-span-2">
                                        <label className="block text-foreground font-medium mb-2">
                                            Bio
                                        </label>
                                        <Textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                            placeholder="Tell us about this instructor..."
                                            rows={4}
                                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                                        />
                                    </div>

                                    {/* Specializations */}
                                    <div className="md:col-span-2">
                                        <label className="block text-foreground font-medium mb-2">
                                            Specializations
                                        </label>
                                        <Textarea
                                            value={formData.specializations}
                                            onChange={(e) => setFormData(prev => ({ ...prev, specializations: e.target.value }))}
                                            placeholder="Enter specializations (e.g., Web Development, Data Science, UI/UX Design)"
                                            rows={3}
                                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            List areas of expertise separated by commas
                                        </p>
                                    </div>
                                </div>
                                </motion.div>
                            </TabsContent>

                            {/* Social Links Tab */}
                            <TabsContent value="social" className="space-y-6">
                                <motion.div
                                    key="social"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* YouTube */}
                                    <div>
                                        <label className="block text-foreground font-medium mb-2 flex items-center gap-2">
                                            <Youtube className="w-4 h-4 text-red-500" />
                                            YouTube URL
                                        </label>
                                        <Input
                                            type="url"
                                            value={formData.youtube}
                                            onChange={(e) => setFormData(prev => ({ ...prev, youtube: e.target.value }))}
                                            placeholder="https://youtube.com/@username"
                                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                                        />
                                    </div>

                                    {/* LinkedIn */}
                                    <div>
                                        <label className="block text-foreground font-medium mb-2 flex items-center gap-2">
                                            <Linkedin className="w-4 h-4 text-blue-600" />
                                            LinkedIn URL
                                        </label>
                                        <Input
                                            type="url"
                                            value={formData.linkin}
                                            onChange={(e) => setFormData(prev => ({ ...prev, linkin: e.target.value }))}
                                            placeholder="https://linkedin.com/in/username"
                                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                                        />
                                    </div>

                                    {/* GitHub */}
                                    <div>
                                        <label className="block text-foreground font-medium mb-2 flex items-center gap-2">
                                            <Github className="w-4 h-4" />
                                            GitHub URL
                                        </label>
                                        <Input
                                            type="url"
                                            value={formData.github}
                                            onChange={(e) => setFormData(prev => ({ ...prev, github: e.target.value }))}
                                            placeholder="https://github.com/username"
                                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                                        />
                                    </div>

                                    {/* Facebook */}
                                    <div>
                                        <label className="block text-foreground font-medium mb-2 flex items-center gap-2">
                                            <Facebook className="w-4 h-4 text-blue-500" />
                                            Facebook URL
                                        </label>
                                        <Input
                                            type="url"
                                            value={formData.facebook}
                                            onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                                            placeholder="https://facebook.com/username"
                                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                                        />
                                    </div>

                                    {/* Instagram */}
                                    <div>
                                        <label className="block text-foreground font-medium mb-2 flex items-center gap-2">
                                            <Instagram className="w-4 h-4 text-pink-500" />
                                            Instagram URL
                                        </label>
                                        <Input
                                            type="url"
                                            value={formData.instagram}
                                            onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                                            placeholder="https://instagram.com/username"
                                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                                        />
                                    </div>

                                    {/* TikTok */}
                                    <div>
                                        <label className="block text-foreground font-medium mb-2 flex items-center gap-2">
                                            <Video className="w-4 h-4" />
                                            TikTok URL
                                        </label>
                                        <Input
                                            type="url"
                                            value={formData.tiktok}
                                            onChange={(e) => setFormData(prev => ({ ...prev, tiktok: e.target.value }))}
                                            placeholder="https://tiktok.com/@username"
                                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                                        />
                                    </div>
                                </div>
                                </motion.div>
                            </TabsContent>

                            {/* Admin Settings Tab */}
                            <TabsContent value="admin" className="space-y-6">
                                <motion.div
                                    key="admin"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                <div className="bg-muted/50 rounded-lg p-6 space-y-6">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                        <Lock className="w-5 h-5" />
                                        <p className="text-sm">
                                            These settings are managed by administrators only. Contact support to request changes.
                                        </p>
                                    </div>

                                    {/* Active Status */}
                                    <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                                        <div>
                                            <label className="block text-foreground font-medium mb-1">
                                                Active Status
                                            </label>
                                            <p className="text-sm text-muted-foreground">
                                                Whether this instructor profile is active and visible
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                formData.is_active
                                                    ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                                    : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                                            }`}>
                                                {formData.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={formData.is_active ?? true}
                                                disabled
                                                readOnly
                                                className="w-5 h-5 rounded border-border bg-background opacity-50 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    {/* Monetization */}
                                    <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                                        <div>
                                            <label className="block text-foreground font-medium mb-1">
                                                Monetization
                                            </label>
                                            <p className="text-sm text-muted-foreground">
                                                Whether monetization features are enabled for this instructor
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                formData.monetization
                                                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                                    : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                                            }`}>
                                                {formData.monetization ? 'Enabled' : 'Disabled'}
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={formData.monetization ?? false}
                                                disabled
                                                readOnly
                                                className="w-5 h-5 rounded border-border bg-background opacity-50 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    {/* Rating (if available) */}
                                    {editingInstructor?.rating !== undefined && (
                                        <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                                            <div>
                                                <label className="block text-foreground font-medium mb-1">
                                                    Rating
                                                </label>
                                                <p className="text-sm text-muted-foreground">
                                                    Average instructor rating
                                                </p>
                                            </div>
                                            <div className="text-2xl font-bold text-foreground">
                                                {editingInstructor.rating.toFixed(1)} ⭐
                                            </div>
                                        </div>
                                    )}
                                </div>
                                </motion.div>
                            </TabsContent>
                        </Tabs>

                        {/* Submit Buttons */}
                        <div className="flex gap-3 pt-6 border-t border-border mt-6">
                            <Button
                                type="button"
                                onClick={onCancel}
                                variant="outline"
                                className="flex-1 border-border text-foreground hover:bg-accent"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || uploading}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                            >
                                {uploading ? (
                                    'Uploading...'
                                ) : loading ? (
                                    'Saving...'
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {editingInstructor ? 'Update Instructor' : 'Create Instructor'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </motion.div>

            {/* Avatar Modal */}
            <AvatarModal open={isAvatarModalOpen} onOpenChange={closeAvatarModal}>
                <div className="relative w-full p-8 flex flex-col items-center gap-8 pointer-events-auto">
                    <motion.div
                        className="relative w-56 h-56 rounded-3xl overflow-hidden bg-white/5 flex items-center justify-center backdrop-blur-2xl border border-white/20 shadow-md"
                        whileHover={{ scale: 1.04 }}
                        transition={{ duration: 0.2 }}
                    >
                        {previewURL || selectedImage ? (
                            <Image
                                src={previewURL || selectedImage}
                                alt="Preview"
                                fill
                                className="object-cover rounded-3xl"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <User className="w-24 h-24 text-white/30" />
                            </div>
                        )}
                    </motion.div>

                    {/* Buttons */}
                    <div className="flex gap-6 mt-4">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-500/30 dark:to-purple-500/30 hover:from-blue-500/30 hover:to-purple-500/30 dark:hover:from-blue-500/40 dark:hover:to-purple-500/40 text-white rounded-full px-10 py-3 font-semibold tracking-tight shadow-md hover:shadow-lg"
                            >
                                <ImageIcon className="w-5 h-5 mr-2" />
                                Upload Photo
                            </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                onClick={handleAvatarSave}
                                disabled={isUploadingAvatar}
                                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full px-10 py-3 font-semibold tracking-tight shadow-md hover:shadow-lg"
                            >
                                {isUploadingAvatar ? (
                                    <Loader2 className="animate-spin w-5 h-5" />
                                ) : (
                                    "Save"
                                )}
                            </Button>
                        </motion.div>
                    </div>

                    {/* Avatar Templates with AvatarDock */}
                    <div className="w-full mt-8">
                        <p className="text-sm text-gray-500 dark:text-gray-300 mb-4 text-center font-medium">
                            Or select a template avatar
                        </p>
                        <AvatarDock className="mx-auto max-w-4xl dark:bg-gray-900/50">
                            {avatarList.map(({ name, src }) => (
                                <AvatarDockIcon
                                    key={name}
                                    label={name}
                                    active={selectedImage === src.src}
                                    onClick={() => {
                                        setSelectedImage(src.src);
                                        setPreviewURL(null);
                                    }}
                                >
                                    <div
                                        className={cn(
                                            "relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer border",
                                            selectedImage === src.src
                                                ? "border-blue-500 shadow-[0_0_15px_rgba(0,255,255,0.5)]"
                                                : "border-white/20 hover:border-blue-500"
                                        )}
                                    >
                                        <Image src={src} alt={name} fill className="object-cover" />
                                    </div>
                                </AvatarDockIcon>
                            ))}
                        </AvatarDock>
                    </div>

                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleAvatarFileChange}
                    />
                </div>
            </AvatarModal>
        </div>
    );
}
