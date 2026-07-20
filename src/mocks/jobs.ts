import { Job } from "@/types"

export const recentJobsMock: Job[] = [
  {
    id: "JOB-9823",
    automationId: "AUTO-101",
    automationName: "Daily Ticket Export",
    status: "Completed",
    initiatedBy: "System Schedule",
    trigger: "Schedule",
    startedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    completedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    durationMs: 60000,
    retryCount: 0,
  },
  {
    id: "JOB-9824",
    automationId: "AUTO-102",
    automationName: "Portal Health Check",
    status: "Running",
    initiatedBy: "Jane Doe (IT Ops)",
    trigger: "Manual",
    startedAt: new Date(Date.now() - 1000 * 30).toISOString(), // 30 secs ago
    retryCount: 0,
  },
  {
    id: "JOB-9825",
    automationId: "AUTO-103",
    automationName: "Weekly SLA Report",
    status: "Failed",
    initiatedBy: "API Trigger",
    trigger: "API",
    startedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    completedAt: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
    durationMs: 120000,
    retryCount: 1,
  },
  {
    id: "JOB-9826",
    automationId: "AUTO-104",
    automationName: "Asset Inventory Sync",
    status: "Completed with warnings",
    initiatedBy: "System Schedule",
    trigger: "Schedule",
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
    durationMs: 1800000, // 30 mins
    retryCount: 0,
  },
  {
    id: "JOB-9827",
    automationId: "AUTO-101",
    automationName: "Daily Ticket Export",
    status: "Queued",
    initiatedBy: "John Smith",
    trigger: "Manual",
    startedAt: new Date(Date.now()).toISOString(),
    retryCount: 0,
  },
]
