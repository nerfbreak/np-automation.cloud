import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  CircleDashed,
  Clock,
  HelpCircle,
  Loader2,
  RefreshCcw,
  TriangleAlert,
  XCircle,
  Ban
} from "lucide-react"

export type JobStatus = 
  | "Draft"
  | "Validating"
  | "Queued"
  | "Running"
  | "Completed"
  | "Completed with warnings"
  | "Failed"
  | "Retrying"
  | "Cancelled"
  | "Timed out"

const statusBadgeVariants = cva(
  "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      status: {
        Draft: "bg-zinc-800/80 text-zinc-400",
        Validating: "bg-blue-950/80 text-blue-500",
        Queued: "bg-zinc-800/80 text-zinc-400",
        Running: "bg-blue-950/80 text-blue-500",
        Completed: "bg-emerald-950/80 text-emerald-500",
        "Completed with warnings": "bg-amber-950/80 text-amber-500",
        Failed: "bg-red-950/80 text-red-500",
        Retrying: "bg-amber-950/80 text-amber-500",
        Cancelled: "bg-zinc-800/80 text-zinc-400",
        "Timed out": "bg-red-950/80 text-red-500",
      },
    },
    defaultVariants: {
      status: "Draft",
    },
  }
)

const StatusIconMap: Record<JobStatus, React.ElementType> = {
  Draft: CircleDashed,
  Validating: Loader2,
  Queued: Clock,
  Running: RefreshCcw,
  Completed: CheckCircle2,
  "Completed with warnings": TriangleAlert,
  Failed: XCircle,
  Retrying: RefreshCcw,
  Cancelled: Ban,
  "Timed out": Clock,
}

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  status: string
  showIcon?: boolean
}

export function StatusBadge({
  className,
  status: rawStatus,
  showIcon = true,
  ...props
}: StatusBadgeProps) {
  let status: JobStatus = "Draft"
  const s = (rawStatus || "").toUpperCase()
  
  if (s === "PENDING" || s === "QUEUED") status = "Queued"
  else if (s === "RUNNING") status = "Running"
  else if (s === "COMPLETED") status = "Completed"
  else if (s === "FAILED") status = "Failed"
  else if (s === "COMPLETED WITH WARNINGS") status = "Completed with warnings"
  else if (s === "RETRYING") status = "Retrying"
  else if (s === "CANCELLED") status = "Cancelled"
  else if (s === "VALIDATING") status = "Validating"
  else if (s === "TIMED OUT") status = "Timed out"

  const Icon = StatusIconMap[status] || HelpCircle
  const isSpinning = status === "Validating" || status === "Running" || status === "Retrying"

  return (
    <div className={cn(statusBadgeVariants({ status }), className)} {...props}>
      {showIcon && (
        <Icon className={cn("h-4 w-4", isSpinning && "animate-spin")} />
      )}
      {status}
    </div>
  )
}
