"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { AuthFlowUltraV2 } from "@/components/auth/AuthFlowUltraV2";

export default function AuthStartPage() {
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode") as "signin" | "signup" | null;

    return <AuthFlowUltraV2 initialMode={mode || "signin"} />;
}