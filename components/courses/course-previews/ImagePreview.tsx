"use client"

import React, { useState, useEffect } from "react";
import { Loader2, Image as ImageIcon } from "lucide-react";

interface ImagePreviewProps {
    url: string;
    onError: (error: string) => void;
    onLoad: () => void;
}

export function ImagePreview({ url, onError, onLoad }: ImagePreviewProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        setError(null);
    }, [url]);

    const handleImageLoad = () => {
        setIsLoading(false);
        if (onLoad) onLoad();
    };

    const handleImageError = () => {
        const errorMsg = "Failed to load image. Check the URL or ensure the image is accessible.";
        setError(errorMsg);
        setIsLoading(false);
        if (onError) onError(errorMsg);
    };

    if (!url) {
        return <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-600 p-4">No image URL provided.</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center w-full h-full bg-red-100 text-red-600 p-4">{error}</div>;
    }

    return (
        <div className="relative w-full h-full min-h-[200px]">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/50">
                    <Loader2 className="animate-spin w-10 h-10 text-white/70" />
                </div>
            )}
            <img
                src={url}
                alt="Course preview"
                className="w-full h-full object-contain"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ display: isLoading ? "none" : "block" }}
            />
        </div>
    );
}