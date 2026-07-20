"use client"

import { AppShell } from "@/components/layout/app-shell"
import { DataTable } from "@/components/data-display/data-table"
import { useEffect, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Shield, RefreshCw } from "lucide-react"

export interface AuditLog {
  id: string
  timestamp: string
  action: string
  actor: string
  resource: string
  details?: string
}

const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    cell: ({ row }) => (
      <div className="text-sm">
        {format(new Date(row.getValue("timestamp")), "PPpp")}
      </div>
    ),
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("action")}</div>
    ),
  },
  {
    accessorKey: "actor",
    header: "Actor",
  },
  {
    accessorKey: "resource",
    header: "Resource",
  },
  {
    accessorKey: "details",
    header: "Details",
    cell: ({ row }) => (
      <div className="text-muted-foreground text-sm max-w-[300px] truncate">
        {row.getValue("details")}
      </div>
    ),
  },
]

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/audit-logs")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setLogs(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <AppShell breadcrumbs={[
      { label: "Settings", href: "/settings" },
      { label: "Audit Logs" }
    ]}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
              <p className="text-muted-foreground mt-1">
                Security and activity events across the platform.
              </p>
            </div>
          </div>
          <button 
            onClick={fetchLogs} 
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-md hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <DataTable 
          columns={columns} 
          data={logs} 
          searchKey="action" 
          searchPlaceholder="Search by action..." 
        />
      </div>
    </AppShell>
  )
}
