"use client";

import React from "react";

interface ArticleViewerProps {
    content: string;
    className?: string;
}

/**
 * Component to display Article content in detail view
 * Renders HTML content from TipTap editor
 */
export function ArticleViewer({
    content,
    className = "",
}: ArticleViewerProps) {
    if (!content) {
        return (
            <div className={`rounded-xl border border-border/40 bg-muted/30 p-8 text-center ${className}`}>
                <p className="text-muted-foreground">No article content available.</p>
            </div>
        );
    }

    return (
        <div className={`rounded-xl border border-border/40 bg-card/50 p-6 ${className}`}>
            <div 
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        </div>
    );
}
