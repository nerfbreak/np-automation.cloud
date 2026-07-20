import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  className?: string
}

export function MetricCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center text-xs mt-1">
            {trend && (
              <span
                className={cn(
                  "mr-2 font-medium flex items-center",
                  trend.isPositive ? "text-success" : "text-destructive",
                  trend.isPositive === undefined && "text-muted-foreground"
                )}
              >
                {trend.isPositive ? "+" : trend.isPositive === false ? "-" : ""}
                {Math.abs(trend.value)}%
              </span>
            )}
            <span className="text-muted-foreground">
              {description || (trend && trend.label)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
