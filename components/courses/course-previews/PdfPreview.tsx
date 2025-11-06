"use client"
import React from "react"
import { Button } from "@/components/ui/button"
import { Loader2, FileText } from "lucide-react"
import { cn } from "@/utils/utils"

interface PdfPreviewProps {
    url: string;
    onError?: (error: string) => void;
    isRestricted?: boolean; // If true, show a full overlay
}

export function PdfPreview({ url, onError, isRestricted = false }: PdfPreviewProps) {
    const [loading, setLoading] = React.useState(true);
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    const handleIframeLoad = () => {
        setLoading(false);
    };

    React.useEffect(() => {
        setLoading(true);
    }, [url]);

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100 dark:bg-gray-800">
                    <Loader2 className="animate-spin w-10 h-10 text-gray-500" />
                </div>
            )}
            <iframe
                ref={iframeRef}
                src={url}
                title="PDF Preview"
                width="100%"
                height="100%"
                className={cn("border-none", loading ? "hidden" : "block")}
                onLoad={handleIframeLoad}
                onError={() => {
                    onError?.("Failed to load PDF. Please check the URL.");
                    setLoading(false);
                }}
            />

            {isRestricted && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm text-white text-center p-8 z-30">
                    <FileText className="w-16 h-16 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Content Locked</h3>
                    <p className="text-lg mb-6">Enroll in the course to unlock the full document.</p>
                    <Button
                        onClick={() => { /* TODO: Implement enrollment action */ }}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90 rounded-full px-6 py-2"
                    >
                        Enroll Now
                    </Button>
                </div>
            )}
        </div>
    );
}