import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:scale-105",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md hover:shadow-lg",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-md",
        outline: "text-foreground border-foreground/20 hover:bg-foreground/10",
        success:
          "border-transparent bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md hover:shadow-lg hover:from-emerald-400 hover:to-green-500",
        warning:
          "border-transparent bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md hover:shadow-lg hover:from-amber-400 hover:to-orange-500",
        info:
          "border-transparent bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md hover:shadow-lg hover:from-cyan-400 hover:to-blue-500",
        purple:
          "border-transparent bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-md hover:shadow-lg hover:from-purple-400 hover:to-violet-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

