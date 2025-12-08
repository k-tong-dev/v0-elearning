"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/utils/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const router = useRouter();

  const handleClick = (item: BreadcrumbItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
    >
      <button
        type="button"
        onClick={() => router.push("/dashboard?tab=my-courses")}
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </button>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isClickable = (item.href || item.onClick) && !isLast;
        
        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
            {isClickable ? (
              <button
                type="button"
                onClick={() => handleClick(item)}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            ) : (
              <span className={cn("flex items-center gap-1", isLast && "text-foreground font-medium")}>
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

