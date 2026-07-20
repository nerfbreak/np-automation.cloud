"use client"

import { AppShell } from "@/components/layout/app-shell"
import { DataTable } from "@/components/data-display/data-table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/feedback/status-badge"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, CalendarClock, PlayCircle, PauseCircle, Clock } from "lucide-react"

type Schedule = {
  id: string
  automationName: string
  cronExpression: string
  nextRun: string
  status: "active" | "paused"
  lastRunStatus: "success" | "failed" | "pending"
}

const mockSchedules: Schedule[] = [
  {
    id: "SCH-001",
    automationName: "Daily Sales Export",
    cronExpression: "0 8 * * *",
    nextRun: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
    status: "active",
    lastRunStatus: "success",
  },
  {
    id: "SCH-002",
    automationName: "Legacy Intranet Keepalive",
    cronExpression: "*/15 * * * *",
    nextRun: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
    status: "active",
    lastRunStatus: "success",
  },
  {
    id: "SCH-003",
    automationName: "Weekly User Sync",
    cronExpression: "0 0 * * 0",
    nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    status: "paused",
    lastRunStatus: "pending",
  },
]

const columns: ColumnDef<Schedule>[] = [
  {
    accessorKey: "automationName",
    header: "Automation",
    cell: ({ row }) => <div className="font-medium">{row.getValue("automationName")}</div>,
  },
  {
    accessorKey: "cronExpression",
    header: "Schedule (Cron)",
    cell: ({ row }) => <code className="bg-muted px-2 py-1 rounded text-sm">{row.getValue("cronExpression")}</code>,
  },
  {
    accessorKey: "nextRun",
    header: "Next Run",
    cell: ({ row }) => {
      const date = new Date(row.getValue("nextRun"))
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {date.toLocaleString()}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <div className="flex items-center gap-2">
          {status === "active" ? (
            <PlayCircle className="h-4 w-4 text-[var(--success)]" />
          ) : (
            <PauseCircle className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="capitalize">{status}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "lastRunStatus",
    header: "Last Run",
    cell: ({ row }) => <StatusBadge status={row.getValue("lastRunStatus")} />,
  },
]

export default function SchedulesPage() {
  return (
    <AppShell breadcrumbs={[{ label: "Schedules" }]}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Schedules</h1>
              <p className="text-muted-foreground mt-1">
                Manage automated execution triggers and cron jobs.
              </p>
            </div>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Schedule
          </Button>
        </div>

        <DataTable 
          columns={columns} 
          data={mockSchedules} 
          searchKey="automationName" 
          searchPlaceholder="Search schedules..." 
        />
      </div>
    </AppShell>
  )
}
