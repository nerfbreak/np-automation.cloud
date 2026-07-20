"use client"

import React from "react"

import { notFound } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { StatusBadge } from "@/components/feedback/status-badge"
import { MetricCard } from "@/components/data-display/metric-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { automationsMock } from "@/mocks/automations"
import { recentJobsMock } from "@/mocks/jobs"
import {
  Play,
  FileEdit,
  Activity,
  CheckCircle2,
  Clock,
  Tag,
  User,
  CalendarDays,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = React.use(params)
  const automation = automationsMock.find((a) => a.id === id)

  if (!automation) {
    notFound()
  }

  const relatedJobs = recentJobsMock.filter(
    (j) => j.automationId === id
  )

  const statusColor: Record<string, string> = {
    Active: "text-[var(--success)]",
    Draft: "text-[var(--warning)]",
    Archived: "text-muted-foreground",
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "Automations", href: "/automations" },
        { label: automation.name },
      ]}
    >
      <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12 w-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {automation.name}
              </h1>
              <span
                className={`text-sm font-medium ${statusColor[automation.status] ?? ""}`}
              >
                ● {automation.status}
              </span>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              {automation.description}
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {automation.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button nativeButton={false} variant="outline" render={
              <Link href={`/automations/${id}/edit`}>
                <FileEdit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            } />
            <Button>
              <Play className="mr-2 h-4 w-4" />
              Run Now
            </Button>
          </div>
        </div>

        <Separator />

        {/* Meta info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Owner
            </span>
            <span className="font-medium">{automation.owner}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" /> Steps
            </span>
            <span className="font-medium">{automation.stepCount}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> Last Run
            </span>
            <span className="font-medium">
              {automation.lastRun
                ? format(new Date(automation.lastRun), "PPp")
                : "Never"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Updated
            </span>
            <span className="font-medium">
              {format(new Date(automation.updatedAt), "PPp")}
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Success Rate"
            value={`${automation.successRate.toFixed(1)}%`}
            icon={<CheckCircle2 className="h-4 w-4" />}
            description="Over all-time executions"
          />
          <MetricCard
            title="Total Runs"
            value={relatedJobs.length}
            icon={<Activity className="h-4 w-4" />}
            description="Visible in current dataset"
          />
          <MetricCard
            title="Steps"
            value={automation.stepCount}
            icon={<Clock className="h-4 w-4" />}
            description="Configured automation steps"
          />
        </div>

        {/* Related Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Job Runs</CardTitle>
          </CardHeader>
          <CardContent>
            {relatedJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No job runs found for this automation.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Triggered By</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-sm">
                        {job.id}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={job.status as "Completed" | "Failed" | "Running" | "Queued" | "Completed with warnings"} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {job.initiatedBy}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(job.startedAt), "PPp")}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {job.durationMs
                          ? `${(job.durationMs / 1000).toFixed(0)}s`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          nativeButton={false}
                          render={<Link href={`/jobs/${job.id}`}>View</Link>}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
