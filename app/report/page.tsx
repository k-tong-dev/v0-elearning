"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ReportIssueForm } from "@/components/report/ReportIssueForm";
import { PageLoading } from "@/components/page-loading";

function ReportContent() {
    const searchParams = useSearchParams();
    const initialTitle = searchParams.get("title") || undefined;
    const initialDescription = searchParams.get("error") || undefined;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
            <ReportIssueForm
                initialTitle={initialTitle}
                initialDescription={initialDescription}
                // You can add onSuccess/onCancel handlers here if needed for page-specific logic
            />
        </div>
    );
}

export default function ReportPage() {
    return (
        <Suspense fallback={<PageLoading message="Loading report form..." />}>
            <ReportContent />
        </Suspense>
    );
}