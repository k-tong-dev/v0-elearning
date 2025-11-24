"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/utils/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-0 transition-all duration-300 ease-in-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-50",
      // iOS 26 style: Green when checked, gray when unchecked
      "data-[state=checked]:bg-green-500 dark:data-[state=checked]:bg-green-500",
      "data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600",
      // Smooth color transition
      "transition-colors duration-300 ease-in-out",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-6 w-6 rounded-full bg-white shadow-lg ring-0",
        "transition-all duration-300 ease-in-out",
        // iOS 26 style: Smooth spring animation
        "data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-[2px]",
        // Scale animation on toggle
        "data-[state=checked]:scale-100 data-[state=unchecked]:scale-100",
        // Smooth shadow transition
        "data-[state=checked]:shadow-[0_2px_4px_rgba(0,0,0,0.2)] data-[state=unchecked]:shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
