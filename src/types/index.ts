import { JobStatus } from "@/components/feedback/status-badge"

export interface AutomationStep {
  id: number
  name: string
  action: "click" | "type" | "wait" | "select" | "download" | "screenshot"
  selectorType?: "element_id" | "css" | "xpath" | "text"
  selector?: string
  value?: string | number
  status: "ready" | "running" | "success" | "failed"
}

export interface AutomationPayload {
  run: boolean
  targetUrl: string
  headless: boolean
  timeoutMs: number
  background: boolean
  steps: AutomationStep[]
}

export interface Automation {
  id: string
  name: string
  description?: string
  status: "Active" | "Draft" | "Archived"
  owner: string
  tags: string[]
  stepCount: number
  lastRun?: string
  successRate: number
  updatedAt: string
}

export interface Job {
  id: string
  automationId: string
  automationName: string
  status: JobStatus
  initiatedBy: string
  trigger: "Manual" | "Schedule" | "API"
  startedAt: string
  completedAt?: string
  durationMs?: number
  retryCount: number
}

export interface Template {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  version: string
  lastUpdated: string
  payload: AutomationPayload
}
