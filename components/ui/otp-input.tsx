"use client";

import React, { useRef, useState, ChangeEvent, KeyboardEvent, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/utils";

interface OtpInputProps {
    length: number;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

export function OtpInput({ length, value, onChange, disabled, className }: OtpInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Focus the first empty input or the last input if all are filled
        const firstEmptyIndex = value.split('').findIndex(char => char === '');
        const indexToFocus = firstEmptyIndex !== -1 ? firstEmptyIndex : Math.min(value.length, length - 1);
        if (inputRefs.current[indexToFocus]) {
            inputRefs.current[indexToFocus]?.focus();
        }
    }, [value, length]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
        const input = e.target.value;
        if (!/^\d*$/.test(input)) return; // Only allow digits

        const newValue = value.split('');
        newValue[index] = input;
        const updatedValue = newValue.join('').slice(0, length);
        onChange(updatedValue);

        // Move focus to the next input if a digit was entered
        if (input && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !value[index] && index > 0) {
            // Move focus to the previous input on backspace if current is empty
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text/plain').slice(0, length);
        if (/^\d+$/.test(pasteData)) {
            onChange(pasteData);
            // Focus the last input after pasting
            inputRefs.current[Math.min(pasteData.length - 1, length - 1)]?.focus();
        }
    };

    return (
        <div className={cn("flex justify-center gap-2", className)}>
            {Array.from({ length }).map((_, index) => (
                <Input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={value[index] || ""}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    ref={(el) => (inputRefs.current[index] = el)}
                    className="w-12 h-12 text-center text-2xl font-bold border-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                    inputMode="numeric"
                    pattern="[0-9]"
                />
            ))}
        </div>
    );
}