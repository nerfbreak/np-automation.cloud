"use client";

import { AppShell } from "@/components/layout/app-shell"
import { DistributorsTable } from "@/components/master-data/distributors-table"
import { ShieldAlert } from "lucide-react"

export default function DistributorCredentialsPage() {
  return (
    <AppShell breadcrumbs={[{ label: "Master Data" }, { label: "Distributor Credentials" }]}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Akun Distributor</h1>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-6">
            Kelola kredensial login bot untuk masing-masing distributor. Tambahkan distributor baru dan masukkan password secara langsung (akan dienkripsi otomatis oleh sistem sebelum disimpan).
          </p>
          <DistributorsTable />
        </div>
      </div>
    </AppShell>
  )
}
