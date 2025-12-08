"use client"

import { Toaster as SonnerToaster } from "sonner"
import { cn } from "@/utils/utils"

export function UltraLiquidToaster() {
    return (
        <SonnerToaster
            position="top-center"
            richColors
            className="ultra-liquid-toaster"
            toastOptions={{
                className: "ultra-liquid-toast",
                classNames: {
                    toast: cn(
                        "ultra-liquid-toast-base",
                        "group toast"
                    ),
                    title: "ultra-liquid-toast-title",
                    description: "ultra-liquid-toast-description",
                    actionButton: "ultra-liquid-toast-action",
                    cancelButton: "ultra-liquid-toast-cancel",
                    success: "ultra-liquid-toast-success",
                    error: "ultra-liquid-toast-error",
                    warning: "ultra-liquid-toast-warning",
                    info: "ultra-liquid-toast-info",
                },
            }}
        />
    )
}

