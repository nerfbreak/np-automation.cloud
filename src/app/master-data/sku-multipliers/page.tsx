"use client";

import { AppShell } from "@/components/layout/app-shell"
import { MultipliersTable } from "@/components/master-data/multipliers-table"
import { ShieldAlert } from "lucide-react"

export default function SkuMultipliersPage() {
  return (
    <AppShell breadcrumbs={[{ label: "Master Data" }, { label: "SKU Multipliers" }]}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Perkalian Stok (SKU Multipliers)</h1>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-6">
            Khusus untuk distributor tertentu (misal: PT. Borwita Cipta Prima), beberapa data produk seperti Strepsils (SKU: 8021804, 8021803) pada file stok belum dikonversi ke satuan Pieces (PCS).
            Tentukan SKU dan angka pengali (multiplier) di sini agar bot dapat mengonversinya secara otomatis.
          </p>
          <MultipliersTable />
        </div>
      </div>
    </AppShell>
  )
}
