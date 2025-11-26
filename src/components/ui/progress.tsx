import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      variant: {
        default: "h-4",
        sm: "h-2",
        lg: "h-6",
      },
      color: {
        default: "",
        primary: "",
        success: "",
        warning: "",
        info: "",
        purple: "",
      },
    },
    defaultVariants: {
      variant: "default",
      color: "default",
    },
  }
)

const indicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-500 ease-out",
  {
    variants: {
      color: {
        default: "bg-gradient-to-r from-primary via-primary to-primary/90",
        primary: "bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600",
        success: "bg-gradient-to-r from-emerald-400 via-green-500 to-green-600",
        warning: "bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600",
        info: "bg-gradient-to-r from-cyan-300 via-cyan-500 to-blue-500",
        purple: "bg-gradient-to-r from-purple-400 via-violet-500 to-purple-600",
      },
    },
    defaultVariants: {
      color: "default",
    },
  }
)

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  variant?: "default" | "sm" | "lg"
  color?: "default" | "primary" | "success" | "warning" | "info" | "purple"
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant, color, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(progressVariants({ variant, color }), className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(indicatorVariants({ color }))}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }

