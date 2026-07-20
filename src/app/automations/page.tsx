"use client"

import { AppShell } from "@/components/layout/app-shell"
import { DataTable } from "@/components/data-display/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { automationsMock } from "@/mocks/automations"
import { Automation } from "@/types"
import { ColumnDef } from "@tanstack/react-table"
import { formatDistanceToNow } from "date-fns"
import { Bot, FileEdit, MoreHorizontal, Play, Trash } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const columns: ColumnDef<Automation>[] = [
  {
    accessorKey: "name",
    header: "Automation",
    cell: ({ row }) => (
      <div>
        <Link href={`/automations/${row.original.id}`} className="font-medium hover:underline flex items-center gap-2">
          <Bot className="h-4 w-4 text-muted-foreground" />
          {row.getValue("name")}
        </Link>
        <div className="text-xs text-muted-foreground mt-1 max-w-[300px] truncate">
          {row.original.description}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "Active" ? "default" : status === "Draft" ? "secondary" : "outline"}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "owner",
    header: "Owner",
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string[]
      return (
        <div className="flex gap-1 flex-wrap">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0 font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: "successRate",
    header: "Success Rate",
    cell: ({ row }) => {
      const rate = row.getValue("successRate") as number
      if (rate === 0 && row.original.status === "Draft") return <span className="text-muted-foreground">-</span>
      return (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full ${rate > 95 ? "bg-success" : rate > 80 ? "bg-warning" : "bg-destructive"}`} 
              style={{ width: `${rate}%` }} 
            />
          </div>
          <span className="text-sm">{rate}%</span>
        </div>
      )
    },
  },
  {
    accessorKey: "lastRun",
    header: "Last Run",
    cell: ({ row }) => {
      const lastRun = row.getValue("lastRun") as string | undefined
      if (!lastRun) return <span className="text-muted-foreground">Never</span>
      const date = new Date(lastRun)
      return (
        <div className="text-sm">
          {formatDistanceToNow(date, { addSuffix: true })}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>
                <Play className="mr-2 h-4 w-4" /> Run Now
              </DropdownMenuItem>
              <DropdownMenuItem 
                render={
                  <Link href={`/automations/${row.original.id}/edit`}>
                    <FileEdit className="mr-2 h-4 w-4" /> Edit
                  </Link>
                }
              />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export default function AutomationsPage() {
  return (
    <AppShell breadcrumbs={[{ label: "Automations" }]}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Automations</h1>
            <p className="text-muted-foreground mt-2">
              Manage and monitor your browser automation workflows.
            </p>
          </div>
          <Button nativeButton={false} render={<Link href="/automations/new">Create Automation</Link>} />
        </div>

        <DataTable 
          columns={columns} 
          data={automationsMock} 
          searchKey="name" 
          searchPlaceholder="Search automations..." 
        />
      </div>
    </AppShell>
  )
}
