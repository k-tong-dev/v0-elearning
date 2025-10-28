"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { ReportIssueForm } from "@/components/report/ReportIssueForm";

export default function ReportPage() {
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