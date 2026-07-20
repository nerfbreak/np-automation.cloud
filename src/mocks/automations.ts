import { Automation } from "@/types"

export const automationsMock: Automation[] = [
  {
    id: "AUTO-101",
    name: "Daily Ticket Export",
    description: "Exports all resolved tickets from ServiceNow to a CSV and uploads to SharePoint.",
    status: "Active",
    owner: "IT Service Desk",
    tags: ["ServiceNow", "Export", "Daily"],
    stepCount: 8,
    lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    successRate: 98.5,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago
  },
  {
    id: "AUTO-102",
    name: "Portal Health Check",
    description: "Logs into the main employee portal and verifies core services are loading.",
    status: "Active",
    owner: "IT Ops",
    tags: ["Monitoring", "Health Check"],
    stepCount: 5,
    lastRun: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    successRate: 99.9,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 2 weeks ago
  },
  {
    id: "AUTO-103",
    name: "Weekly SLA Report",
    description: "Generates the weekly SLA compliance report and emails the leadership team.",
    status: "Draft",
    owner: "Jane Doe",
    tags: ["Reporting", "SLA"],
    stepCount: 12,
    successRate: 0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "AUTO-104",
    name: "Asset Inventory Sync",
    description: "Synchronizes device statuses between Jamf and Snipe-IT.",
    status: "Active",
    owner: "Endpoint Management",
    tags: ["Assets", "Sync"],
    stepCount: 20,
    lastRun: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    successRate: 85.0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 1 month ago
  },
  {
    id: "AUTO-105",
    name: "Offboarding Workflow",
    description: "Revokes user access across standard internal applications.",
    status: "Archived",
    owner: "Identity Team",
    tags: ["Offboarding", "Security"],
    stepCount: 15,
    lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(), // 3 months ago
    successRate: 92.4,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(),
  },
]
