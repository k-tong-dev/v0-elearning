import * as React from "react"

import { cn } from "@/utils/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "liquid-glass-input flex min-h-[80px] w-full rounded-lg",
          "bg-background/40 backdrop-blur-xl border border-border/50",
          "px-3 py-2 text-sm",
          "placeholder:text-muted-foreground/60",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 focus-visible:shadow-lg focus-visible:shadow-primary/10",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/20",
          "hover:border-border hover:shadow-md",
          "resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }