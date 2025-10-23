// components/verification-modal.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { DraggableDialog } from "@/components/ui/draggable-dialog";

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (code: string) => Promise<boolean>;
    onAuthSuccess?: () => void;
}

export function VerificationModal({
                                      isOpen,
                                      onClose,
                                      onVerify,
                                      onAuthSuccess,
                                  }: VerificationModalProps) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleVerify = async () => {
        setLoading(true);
        setError("");
        const isValid = await onVerify(code);
        setLoading(false);
        if (isValid) {
            onAuthSuccess?.();
            onClose();
        } else {
            setError("Invalid verification code. Please try again.");
        }
    };

    return (
        <DraggableDialog
            open={isOpen}
            onOpenChange={onClose}
            title="Verify You're Not a Robot"
            description="Please enter the code sent to your email or complete the CAPTCHA."
        >
            <div className="space-y-6">
                <Input
                    type="text"
                    placeholder="Enter verification code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full border-2 hover:border-emerald-300 focus:border-emerald-500"
                />
                <Button
                    onClick={handleVerify}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                </Button>
                {error && <p className="text-red-600 text-center">{error}</p>}
            </div>
        </DraggableDialog>
    );
}