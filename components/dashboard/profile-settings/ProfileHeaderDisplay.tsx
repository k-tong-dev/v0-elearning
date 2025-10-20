"use client"

import React from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AvatarModal } from "@/components/ui/aceternity/avatar-modal"
import { useAvatarModal } from "@/hooks/useAvatarModal"
import {
    Users,
    CheckCircle,
    Loader2,
    Camera,
    ImageIcon,
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { AvatarDock, AvatarDockIcon } from "@/components/ui/aceternity/avatar-dock"
import { avatarList } from "@/lib/static-avatars"
import {BackgroundBeams} from "@/components/ui/aceternity/background-beams";

const roleColors = {
    instructor: "from-blue-500 to-purple-500",
    admin: "from-red-500 to-pink-500",
    expert: "from-yellow-500 to-orange-500",
    mentor: "from-green-500 to-emerald-500",
    student: "from-gray-500 to-slate-500",
    company: "from-indigo-500 to-cyan-500",
    job_seeker: "from-teal-500 to-blue-500",
    other: "from-pink-500 to-red-500",
}

export function ProfileHeaderDisplay({avatar,name,email,followers,following,role = "student",onAvatarChange,isUploadingAvatar,}: any) {
    const {
        isOpen,
        openModal,
        closeModal,
        selectedImage,
        previewURL,
        fileInputRef,
        setSelectedImage,
        setPreviewURL,
        handleFileChange,
        handleSave,
    } = useAvatarModal(onAvatarChange)

    const roleGradient = roleColors[role] || roleColors.student
    const firstName = name ? name.split(" ")[0] : "User"

    return (
        <>
            <div className="relative overflow-hidden border border-white/10 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] bg-white/10 dark:bg-gray-950 backdrop-blur-2xl p-8 md:p-10 flex flex-col md:flex-row items-center md:items-end gap-8">
                <div className="absolute w-full h-50 top-0 left-0 -z-10">
                    <BackgroundBeams className="bg-gray-600 dark:bg-gray-800/30" />
                </div>
                <div className="flex flex-col justify-center items-center w-full text-center md:text-left">
                    <motion.div
                        className="relative w-36 h-36 rounded-full overflow-hidden cursor-pointer group border-2 border-transparent bg-gradient-to-br from-cyan-500/30 to-purple-500/30"
                        animate={{
                            scale: [1, 1.02, 1],
                            rotate: [0, 2, -2, 0],
                            borderRadius: ["50%", "48% 52% 50% 50%", "50% 50% 52% 48%", "50%"],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            times: [0, 0.4, 0.6, 1],
                        }}
                        onClick={openModal}
                    >
                        {avatar ? (
                            <Image
                                src={avatar}
                                alt={`${firstName}'s Avatar`}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/40 to-purple-500/40 text-white text-2xl font-bold">
                                {firstName[0].toUpperCase()}
                            </div>
                        )}
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                    </motion.div>


                    <h1 className="text-3xl font-bold bg-gray-600 bg-clip-text text-transparent mt-6">
                        {name}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">{email}</p>

                    <div className="flex justify-center md:justify-start gap-4 mt-3">
                        <Badge className={`bg-gradient-to-r ${roleGradient} text-white`}>
                            {role}
                        </Badge>
                    </div>

                    <div className="flex justify-center md:justify-start gap-6 text-sm text-gray-600 dark:text-gray-300 mt-4">
                        <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" /> {followers} Followers
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" /> {following} Following
                        </span>
                    </div>
                </div>
            </div>

            <AvatarModal open={isOpen} onOpenChange={closeModal}>
                <div className="relative w-full p-8 flex flex-col items-center gap-8 pointer-events-auto">
                    <motion.div
                        className="relative w-56 h-56 rounded-3xl overflow-hidden bg-white/5 flex items-center justify-center backdrop-blur-2xl border border-white/20 shadow-md"
                        whileHover={{ scale: 1.04 }}
                        transition={{ duration: 0.2 }}
                    >
                        {previewURL || selectedImage ? (
                            <Image
                                src={previewURL || selectedImage!}
                                alt="Preview"
                                fill
                                className="object-cover rounded-3xl"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                {avatar ? (
                                    <Image
                                        src={avatar}
                                        alt={`${firstName}'s Avatar`}
                                        fill
                                        className="object-cover rounded-3xl"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/40 to-purple-500/40 text-white text-2xl font-bold">
                                        {firstName[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>


                    {/* Buttons */}
                    <div className="flex gap-6 mt-4">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 dark:from-cyan-500/30 dark:to-purple-500/30 hover:from-cyan-500/30 hover:to-purple-500/30 dark:hover:from-cyan-500/40 dark:hover:to-purple-500/40 text-white rounded-full px-10 py-3 font-semibold tracking-tight shadow-md hover:shadow-lg"
                            >
                                <ImageIcon className="w-5 h-5 mr-2" />
                                Upload Photo
                            </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                onClick={handleSave}
                                disabled={isUploadingAvatar}
                                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-full px-10 py-3 font-semibold tracking-tight shadow-md hover:shadow-lg"
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
                                        setSelectedImage(src.src)
                                        setPreviewURL(null)
                                    }}
                                >
                                    <div
                                        className={cn(
                                            "relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer border",
                                            selectedImage === src.src
                                                ? "border-cyan-500 shadow-[0_0_15px_rgba(0,255,255,0.5)]"
                                                : "border-white/20 hover:border-cyan-300"
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
                        onChange={handleFileChange}
                    />
                </div>
            </AvatarModal>
        </>
    )
}