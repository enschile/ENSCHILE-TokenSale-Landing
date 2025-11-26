import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string
  description?: string
  icon?: LucideIcon
  badge?: {
    label: string
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "purple"
  }
  progress?: number
  secondaryValue?: string
  trend?: {
    value: string
    isPositive: boolean
  }
  variant?: "default" | "gradient" | "glow" | "glass"
  colorScheme?: "primary" | "success" | "warning" | "info" | "purple"
  valueGradient?: boolean
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  badge,
  progress,
  secondaryValue,
  trend,
  variant = "default",
  colorScheme = "primary",
  valueGradient = false,
}: StatCardProps) {
  const iconColorClasses = {
    primary: "text-cyan-400",
    success: "text-emerald-400",
    warning: "text-amber-400",
    info: "text-blue-400",
    purple: "text-purple-400",
  }

  const valueGradientClasses = {
    primary: "text-gradient",
    success: "text-gradient-success",
    warning: "text-gradient-warning",
    info: "text-gradient-info",
    purple: "text-gradient",
  }

  const progressColorMap = {
    primary: "primary" as const,
    success: "success" as const,
    warning: "warning" as const,
    info: "info" as const,
    purple: "purple" as const,
  }

  return (
    <Card variant={variant} className={cn(
      variant === "glow" && colorScheme === "primary" && "card-glow",
      variant === "glow" && colorScheme === "success" && "card-glow-success",
      variant === "glow" && colorScheme === "warning" && "card-glow-warning",
      variant === "glow" && colorScheme === "purple" && "card-glow-purple",
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <div className={cn(
            "p-2 rounded-lg bg-gradient-to-br from-background/50 to-background/30",
            "border border-border/50"
          )}>
            <Icon className={cn("h-5 w-5", iconColorClasses[colorScheme])} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-3xl font-bold",
          valueGradient && valueGradientClasses[colorScheme]
        )}>
          {value}
        </div>
        {secondaryValue && (
          <p className="text-xs text-muted-foreground mt-1">{secondaryValue}</p>
        )}
        {description && (
          <CardDescription className="mt-2">{description}</CardDescription>
        )}
        {badge && (
          <div className="mt-3">
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
        )}
        {progress !== undefined && (
          <div className="mt-4">
            <Progress 
              value={progress} 
              variant="sm" 
              color={progressColorMap[colorScheme]}
            />
            <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(1)}%</p>
          </div>
        )}
        {trend && (
          <div className="mt-2">
            <p className={cn(
              "text-xs font-semibold flex items-center gap-1",
              trend.isPositive ? "text-emerald-400" : "text-red-400"
            )}>
              <span className={cn(
                "inline-block transition-transform",
                trend.isPositive ? "text-emerald-400" : "text-red-400"
              )}>
                {trend.isPositive ? "↑" : "↓"}
              </span>
              {trend.value}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

