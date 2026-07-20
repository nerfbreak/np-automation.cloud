export interface AuditLog {
  id: string
  action: string
  actor: string
  resource: string
  timestamp: string
  details: string
}

export const auditLogsMock: AuditLog[] = [
  {
    id: "LOG-001",
    action: "Login",
    actor: "jane.doe@example.com",
    resource: "System",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    details: "Successful login via SSO",
  },
  {
    id: "LOG-002",
    action: "Create Automation",
    actor: "john.smith@example.com",
    resource: "Automation (AUTO-105)",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    details: "Created new automation 'Offboarding Workflow'",
  },
  {
    id: "LOG-003",
    action: "Update Settings",
    actor: "admin@example.com",
    resource: "System Settings",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    details: "Updated global notification preferences",
  },
  {
    id: "LOG-004",
    action: "Delete Automation",
    actor: "jane.doe@example.com",
    resource: "Automation (AUTO-099)",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    details: "Deleted deprecated workflow",
  },
  {
    id: "LOG-005",
    action: "Failed Login",
    actor: "unknown",
    resource: "System",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    details: "Invalid credentials provided from IP 192.168.1.50",
  },
]
