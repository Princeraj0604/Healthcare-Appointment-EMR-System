import * as React from "react"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100 items-center justify-center font-semibold text-slate-700",
      className
    )}
    {...props}
  />
))
Avatar.displayName = "Avatar"

export { Avatar }
