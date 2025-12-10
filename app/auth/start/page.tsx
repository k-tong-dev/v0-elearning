"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthFlowUltraV2 } from "@/components/auth/AuthFlowUltraV2";
import { PageLoading } from "@/components/page-loading";

function AuthStartContent() {
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode") as "signin" | "signup" | null;

    return <AuthFlowUltraV2 initialMode={mode || "signin"} />;
}

export default function AuthStartPage() {
    return (
        <Suspense fallback={<PageLoading message="Loading authentication..." />}>
            <AuthStartContent />
        </Suspense>
    );
}