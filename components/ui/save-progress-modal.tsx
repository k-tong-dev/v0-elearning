import React from "react"
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/utils/utils"
import { AnimatePresence, motion } from "framer-motion"
import {
    Loader2,
    CheckCircle2,
    AlertTriangle,
    X,
    BookOpen,
    FileText,
    Layers,
    Award,
} from "lucide-react"

export type GlobalSaveProgressItem = {
    id: string
    type: "material" | "content" | "course"
    name: string
    status: "saving" | "success" | "error"
    errorMessage?: string
}

export interface SaveProgressSection {
    id: string
    label: string
    description?: string
    progress?: number
    status?: "idle" | "running" | "success" | "error"
    accent?: "blue" | "purple" | "emerald"
}

interface SaveProgressModalProps {
    open: boolean
    onClose?: () => void
    sections: SaveProgressSection[]
    items: GlobalSaveProgressItem[]
    summary?: {
        saving: number
        success: number
        error: number
    }
    disableClose?: boolean
    onClearHistory?: () => void
    title?: string
    subtitle?: string
}

const sectionAccentMap: Record<NonNullable<SaveProgressSection["accent"]>, string> = {
    blue: "from-blue-500/15 to-cyan-500/10 border-blue-500/30",
    purple: "from-purple-500/15 to-pink-500/10 border-purple-500/30",
    emerald: "from-emerald-500/15 to-teal-500/10 border-emerald-500/30",
}

const typeIconMap = {
    material: BookOpen,
    content: FileText,
    course: Award,
}

export function SaveProgressModal({
    open,
    onClose,
    sections,
    items,
    summary,
    disableClose,
    onClearHistory,
    title = "Save Progress",
    subtitle = "We’re saving your latest changes. Sit tight for a moment.",
}: SaveProgressModalProps) {
    const derivedSummary = summary ?? {
        saving: items.filter((item) => item.status === "saving").length,
        success: items.filter((item) => item.status === "success").length,
        error: items.filter((item) => item.status === "error").length,
    }

    const hasErrors = derivedSummary.error > 0

    const canClearHistory = !disableClose && items.length > 0 && onClearHistory

    return (
        <Modal
            isOpen={open}
            onOpenChange={(isOpen) => {
                if (!isOpen && !disableClose) {
                    onClose?.()
                }
            }}
            isDismissable={!disableClose}
            isKeyboardDismissDisabled={disableClose}
            hideCloseButton
            backdrop="blur"
            scrollBehavior="inside"
            size="4xl"
            placement="center"
            classNames={{
                base: "max-w-4xl border border-primary/10 bg-gradient-to-b from-background via-background to-primary/5 shadow-2xl shadow-primary/10",
                header: "px-6 pt-6 pb-2",
                body: "px-6 pb-6",
            }}
            className="z-[120]"
            motionProps={{
                variants: {
                    enter: {
                        y: 0,
                        opacity: 1,
                        transition: { duration: 0.25, ease: "easeOut" },
                    },
                    exit: {
                        y: 20,
                        opacity: 0,
                        transition: { duration: 0.2, ease: "easeIn" },
                    },
                },
            }}
        >
            <ModalContent>
                {(modalClose) => (
                    <>
                        <ModalHeader className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
                                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/40">
                                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                        {title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (disableClose) return
                                    modalClose()
                                    onClose?.()
                                }}
                                className={cn(
                                    "rounded-full p-2 transition-colors",
                                    disableClose
                                        ? "text-muted-foreground cursor-not-allowed opacity-60"
                                        : "hover:bg-primary/10 text-primary"
                                )}
                                disabled={disableClose}
                                aria-label="Close save progress"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </ModalHeader>

                        <ModalBody className="pb-0">
                            <div className="grid gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {sections.map((section) => {
                            const status = section.status ?? "idle"
                            const SectionIcon =
                                status === "success"
                                    ? CheckCircle2
                                    : status === "error"
                                        ? AlertTriangle
                                        : Loader2
                            const accentClass = section.accent ? sectionAccentMap[section.accent] : ""
                            return (
                                <div
                                    key={section.id}
                                    className={cn(
                                        "rounded-2xl border px-4 py-3 bg-gradient-to-br",
                                        accentClass || "from-muted/40 to-muted/10 border-border/60"
                                    )}
                                >
                                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-1">
                                        <span>{section.label}</span>
                                        <span>{Math.min(100, Math.round(section.progress ?? 0))}%</span>
                                    </div>
                                    <Progress value={section.progress ?? 0} className="h-1.5" />
                                    <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                                        <SectionIcon
                                            className={cn(
                                                "h-3.5 w-3.5",
                                                status === "success" && "text-emerald-500",
                                                status === "error" && "text-red-500",
                                                status === "running" && "text-primary animate-spin"
                                            )}
                                        />
                                        <span className="capitalize">
                                            {status === "running"
                                                ? "In progress"
                                                : status === "success"
                                                    ? "Completed"
                                                    : status === "error"
                                                        ? "Error"
                                                        : "Pending"}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                                </div>

                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                            Saving: {derivedSummary.saving}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
                            Completed: {derivedSummary.success}
                        </span>
                        <span className={cn(
                            "px-3 py-1 rounded-full font-medium",
                            hasErrors ? "bg-red-500/10 text-red-600" : "bg-muted"
                        )}>
                            {hasErrors ? `Errors: ${derivedSummary.error}` : "No errors"}
                        </span>
                        {canClearHistory && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7"
                                onClick={onClearHistory}
                            >
                                Clear history
                            </Button>
                        )}
                    </div>

                                <div className="rounded-2xl border border-border/60 bg-background/70 backdrop-blur">
                        <div className="px-4 py-2 border-b border-border/60 text-xs font-semibold text-muted-foreground">
                            Detailed tasks
                        </div>
                        <div className="max-h-[320px] overflow-y-auto px-2 py-3 space-y-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                            <AnimatePresence>
                                {items.map((item) => {
                                    const Icon = typeIconMap[item.type] ?? Layers
                                    return (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.25 }}
                                            className={cn(
                                                "rounded-xl border px-3 py-2.5 flex items-start gap-3 text-sm",
                                                item.status === "saving" && "border-primary/30 bg-primary/5 shadow-sm shadow-primary/10",
                                                item.status === "success" && "border-emerald-400/30 bg-emerald-500/5",
                                                item.status === "error" && "border-red-400/30 bg-red-500/5"
                                            )}
                                        >
                                            <div className="mt-0.5">
                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                                                    <span className="capitalize">{item.type}</span>
                                                    {item.status === "saving" && (
                                                        <span className="flex items-center gap-1 text-primary">
                                                            <Loader2 className="h-3 w-3 animate-spin" /> Saving
                                                        </span>
                                                    )}
                                                    {item.status === "success" && (
                                                        <span className="flex items-center gap-1 text-emerald-600">
                                                            <CheckCircle2 className="h-3 w-3" /> Saved
                                                        </span>
                                                    )}
                                                    {item.status === "error" && (
                                                        <span className="flex items-center gap-1 text-red-600">
                                                            <AlertTriangle className="h-3 w-3" /> Error
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[13px] font-medium text-foreground mt-0.5">
                                                    {item.name}
                                                </p>
                                                {item.errorMessage && (
                                                    <p className="text-xs text-red-500 mt-1">{item.errorMessage}</p>
                                                )}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                                {items.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-6 text-sm text-muted-foreground"
                                    >
                                        No active tasks.
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                            </div>
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}

