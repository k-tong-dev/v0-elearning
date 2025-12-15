"use client";

import React from "react";
import { cn } from "@/utils/utils";

/**
 * Minimal, static container version of the old animated background.
 * Keeps layout sizing but removes rainbow gradients, beams, and explosions.
 */
export const BackgroundBeamsWithCollision = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <div
            className={cn(
                "h-96 md:h-[40rem] relative flex items-center justify-center w-full overflow-hidden bg-transparent",
                className
            )}
        >
            <div className="relative z-10 w-full pointer-events-auto">{children}</div>
        </div>
    );
};
