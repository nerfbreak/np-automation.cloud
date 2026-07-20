"use client";

import { AppShell } from "@/components/layout/app-shell"
import { ExceptionsTable } from "@/components/master-data/exceptions-table"
import { ShieldAlert } from "lucide-react"

export default function SkuExceptionsPage() {
  return (
    <AppShell breadcrumbs={[{ label: "Master Data" }, { label: "SKU Exceptions" }]}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Penambahan Nol di Depan (SKU Exceptions)</h1>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-6">
            Sistem stok Newspage terkadang menolak SKU jika angka 0 di depan hilang (misal: 260659 ditolak, seharusnya 0260659).
            Masukkan daftar SKU yang <strong>seharusnya</strong> menggunakan angka 0 di depan ke dalam tabel ini. Bot akan otomatis menambahkannya.
          </p>
          <ExceptionsTable />
        </div>
      </div>
    </AppShell>
  )
}
