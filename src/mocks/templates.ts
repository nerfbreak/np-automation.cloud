import { AutomationFormValues } from "@/lib/validations"

export interface AutomationTemplate {
  id: string
  name: string
  description: string
  category: string
  defaultValues: Partial<AutomationFormValues>
}

export const automationTemplates: AutomationTemplate[] = [
  {
    id: "tpl-offboarding",
    name: "Employee Offboarding",
    description: "Revoke access across 5 internal portals automatically.",
    category: "HR Operations",
    defaultValues: {
      name: "Employee Offboarding",
      description: "Revoke user access across standard internal applications including email, Slack, and VPN.",
      owner: "",
      tags: ["Offboarding", "HR", "Security"],
      payload: {
        targetUrl: "https://portal.example.com/admin/users",
        headless: true,
        timeoutMs: 60000,
        background: false,
        steps: [
          { id: 1, name: "Login to admin portal", action: "click", selector: "#login-btn" },
          { id: 2, name: "Search for employee", action: "type", selector: "#user-search", value: "" },
          { id: 3, name: "Open user profile", action: "click", selector: ".user-result" },
          { id: 4, name: "Deactivate account", action: "click", selector: "#deactivate-btn" },
          { id: 5, name: "Confirm deactivation", action: "click", selector: "#confirm-btn" },
        ],
      },
    },
  },
  {
    id: "tpl-sales-export",
    name: "Daily Sales Export",
    description: "Log into the CRM, export yesterday's sales, and upload to Drive.",
    category: "Reporting",
    defaultValues: {
      name: "Daily Sales Export",
      description: "Logs into the CRM portal and exports sales data from the previous day as a CSV file.",
      owner: "",
      tags: ["Daily", "Export", "Reporting"],
      payload: {
        targetUrl: "https://crm.example.com/login",
        headless: true,
        timeoutMs: 90000,
        background: true,
        steps: [
          { id: 1, name: "Login to CRM", action: "type", selector: "#email", value: "" },
          { id: 2, name: "Submit login", action: "click", selector: "#login-submit" },
          { id: 3, name: "Navigate to reports", action: "click", selector: "#nav-reports" },
          { id: 4, name: "Select yesterday's date", action: "click", selector: ".date-yesterday" },
          { id: 5, name: "Download CSV", action: "download", selector: "#export-csv-btn" },
        ],
      },
    },
  },
  {
    id: "tpl-password-rotation",
    name: "Password Rotation",
    description: "Force password reset and update credentials in the vault.",
    category: "Security",
    defaultValues: {
      name: "Password Rotation",
      description: "Forces a password reset for a target user and updates the credential vault accordingly.",
      owner: "",
      tags: ["Security", "Credentials"],
      payload: {
        targetUrl: "https://idm.example.com/admin",
        headless: true,
        timeoutMs: 30000,
        background: false,
        steps: [
          { id: 1, name: "Open identity manager", action: "click", selector: "#users-menu" },
          { id: 2, name: "Search user", action: "type", selector: "#search-user", value: "" },
          { id: 3, name: "Force reset password", action: "click", selector: "#reset-password-btn" },
          { id: 4, name: "Confirm reset", action: "click", selector: "#confirm-reset" },
        ],
      },
    },
  },
  {
    id: "tpl-uptime-check",
    name: "Service Uptime Check",
    description: "Visually verify that the legacy intranet portal is rendering correctly.",
    category: "Monitoring",
    defaultValues: {
      name: "Service Uptime Check",
      description: "Navigates to the intranet portal and verifies that key page elements are rendering correctly.",
      owner: "",
      tags: ["Monitoring", "Health Check"],
      payload: {
        targetUrl: "https://intranet.example.com",
        headless: true,
        timeoutMs: 15000,
        background: true,
        steps: [
          { id: 1, name: "Open intranet", action: "wait", selector: ".main-nav" },
          { id: 2, name: "Take screenshot", action: "screenshot", selector: "body" },
        ],
      },
    },
  },
  {
    id: "tpl-schedule-sync",
    name: "Weekly Schedule Sync",
    description: "Sync shift schedules from the vendor portal into our local calendar.",
    category: "Data Sync",
    defaultValues: {
      name: "Weekly Schedule Sync",
      description: "Logs into the vendor portal and downloads the shift schedule for the upcoming week.",
      owner: "",
      tags: ["Weekly", "Sync", "Data"],
      payload: {
        targetUrl: "https://vendor.example.com/schedules",
        headless: true,
        timeoutMs: 45000,
        background: true,
        steps: [
          { id: 1, name: "Login to vendor portal", action: "type", selector: "#username", value: "" },
          { id: 2, name: "Submit credentials", action: "click", selector: "#login" },
          { id: 3, name: "Navigate to schedules", action: "click", selector: "#schedules-nav" },
          { id: 4, name: "Select upcoming week", action: "click", selector: ".week-next" },
          { id: 5, name: "Export schedule", action: "download", selector: "#export-btn" },
        ],
      },
    },
  },
]
