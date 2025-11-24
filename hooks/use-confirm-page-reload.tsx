"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmReloadOptions {
    title?: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
}

type MaybeAsyncCallback = (() => void | Promise<void>) | null

export function useConfirmPageReload(options?: ConfirmReloadOptions) {
    const [isOpen, setIsOpen] = useState(false)
    const pendingCallbackRef = useRef<MaybeAsyncCallback>(null)

    const requestReload = useCallback((callback?: () => void | Promise<void>) => {
        pendingCallbackRef.current = callback || null
        setIsOpen(true)
    }, [])

    const handleConfirm = useCallback(async () => {
        try {
            if (pendingCallbackRef.current) {
                await pendingCallbackRef.current()
            }
        } finally {
            setIsOpen(false)
            window.location.reload()
        }
    }, [])

    const {
        title = "Refresh to verify session",
        description = "Refreshing will reload this page and revalidate your Strapi session. Continue?",
        confirmLabel = "Refresh now",
        cancelLabel = "Cancel",
    } = options || {}

    const ReloadConfirmDialog = useMemo(
        () => (
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{title}</AlertDialogTitle>
                        <AlertDialogDescription>{description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm}>
                            {confirmLabel}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        ),
        [isOpen, title, description, confirmLabel, cancelLabel, handleConfirm]
    )

    return {
        requestReload,
        ReloadConfirmDialog,
    }
}


