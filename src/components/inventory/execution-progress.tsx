"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ExecutionItem {
  sku: string
  productName: string
  qty: number
  status: "pending" | "running" | "done" | "error"
}

interface ExecutionProgressProps {
  items: ExecutionItem[]
  onComplete: () => void
}

export function ExecutionProgress({ items, onComplete }: ExecutionProgressProps) {
  const doneCount = items.filter((e) => e.status === "done").length
  const progress = items.length > 0 ? (doneCount / items.length) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress Eksekusi</span>
          <span className="font-medium">{doneCount} / {items.length} selesai</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="rounded-lg border divide-y max-h-72 overflow-y-auto">
        {items.map((item, i) => (
          <div
            key={`${item.sku}-${i}`}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
              item.status === "running" && "bg-primary/5"
            )}
          >
            <div className="shrink-0">
              {item.status === "done" && <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />}
              {item.status === "running" && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
              {item.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
              {item.status === "pending" && (
                <div className="h-4 w-4 rounded-full border-2 border-muted" />
              )}
            </div>
            <span className="font-mono text-xs text-muted-foreground w-16 shrink-0">{item.sku}</span>
            <span className="flex-1 truncate">{item.productName}</span>
            <Badge variant="secondary" className="shrink-0">
              {item.qty > 0 ? `+${item.qty}` : item.qty} EA
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
