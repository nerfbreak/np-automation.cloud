"use client"

import { AppShell } from "@/components/layout/app-shell"
import { DataTable } from "@/components/data-display/data-table"
import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, KeyRound, Lock, EyeOff } from "lucide-react"

type Credential = {
  id: string
  name: string
  environment: string
  lastUpdated: string
}

const mockCredentials: Credential[] = [
  {
    id: "CRED-001",
    name: "ServiceNow API Key",
    environment: "Production",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: "CRED-002",
    name: "Salesforce Sandbox Account",
    environment: "Staging",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "CRED-003",
    name: "Legacy Portal Admin",
    environment: "Production",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
  },
]

const columns: ColumnDef<Credential>[] = [
  {
    accessorKey: "name",
    header: "Credential Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 font-medium">
        <Lock className="h-4 w-4 text-muted-foreground" />
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "environment",
    header: "Environment",
  },
  {
    accessorKey: "value",
    header: "Secret Value",
    cell: () => (
      <div className="flex items-center gap-2 text-muted-foreground">
        <EyeOff className="h-4 w-4" />
        <span>••••••••••••</span>
      </div>
    ),
  },
  {
    accessorKey: "lastUpdated",
    header: "Last Updated",
    cell: ({ row }) => {
      const date = new Date(row.getValue("lastUpdated"))
      return <div className="text-sm">{date.toLocaleDateString()}</div>
    },
  },
]

export default function CredentialsPage() {
  return (
    <AppShell breadcrumbs={[{ label: "Credentials" }]}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyRound className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Credentials Vault</h1>
              <p className="text-muted-foreground mt-1">
                Securely manage secrets, passwords, and API keys used by automations.
              </p>
            </div>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Secret
          </Button>
        </div>

        <DataTable 
          columns={columns} 
          data={mockCredentials} 
          searchKey="name" 
          searchPlaceholder="Search credentials..." 
        />
      </div>
    </AppShell>
  )
}
