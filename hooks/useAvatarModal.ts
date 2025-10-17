"use client"
import { useState, useRef } from "react"

export function useAvatarModal(onAvatarChange: (file: File | string) => Promise<void>) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [previewURL, setPreviewURL] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const openModal = () => setIsOpen(true)
    const closeModal = () => setIsOpen(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            const reader = new FileReader()
            reader.onload = (event) => {
                setPreviewURL(event.target?.result as string)
            }
            reader.readAsDataURL(file)
            setSelectedImage(URL.createObjectURL(file))
        }
    }

    const handleSave = async () => {
        if (previewURL) {
            const res = await fetch(previewURL)
            const blob = await res.blob()
            const file = new File([blob], "avatar.png", { type: blob.type })
            await onAvatarChange(file)
        } else if (selectedImage && !selectedImage.startsWith("blob:")) {
            // Handle template avatar URL directly
            await onAvatarChange(selectedImage)
        } else if (selectedImage) {
            // Handle uploaded file (blob URL)
            const res = await fetch(selectedImage)
            const blob = await res.blob()
            const file = new File([blob], "avatar.png", { type: blob.type })
            await onAvatarChange(file)
        }
        setIsOpen(false)
    }

    return {
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
    }
}