"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {partial?: boolean}
>(({ className, partial = false, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center border-2 border-transparent shadow-sm transition-all ease-linear rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className,
      partial && "rounded",
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-[10px] bg-background shadow-lg ring-0 transition-all ease-linear data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 animate-switch-partial relative",
        partial && "rounded",
      )}
    >
      {partial && <span className="absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] block bg-primary h-[2px] w-2"/>}
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
