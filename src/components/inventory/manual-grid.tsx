"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface ManualRow {
  id: string
  sku: string
  productName: string
  pac: string
  car: string
  ea: string
}

interface ManualGridProps {
  rows: ManualRow[]
  onChange: (rows: ManualRow[]) => void
}

export function ManualGrid({ rows, onChange }: ManualGridProps) {
  const addRow = () => {
    onChange([
      ...rows,
      { id: crypto.randomUUID(), sku: "", productName: "", pac: "0", car: "0", ea: "0" },
    ])
  }

  const updateRow = (id: string, field: keyof ManualRow, value: string) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const removeRow = (id: string) => {
    onChange(rows.filter((r) => r.id !== id))
  }

  const isValidRow = (row: ManualRow) =>
    row.sku.trim() !== "" &&
    (parseInt(row.pac) > 0 || parseInt(row.car) > 0 || parseInt(row.ea) > 0)

  return (
    <div className="space-y-3">
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">SKU</TableHead>
              <TableHead>Nama Produk</TableHead>
              <TableHead className="w-[80px] text-center">PAC</TableHead>
              <TableHead className="w-[80px] text-center">CAR</TableHead>
              <TableHead className="w-[80px] text-center">EA</TableHead>
              <TableHead className="w-[60px] text-center">Valid</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground text-sm py-8">
                  Belum ada data. Klik "+ Tambah Baris" atau upload file.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Input
                      value={row.sku}
                      onChange={(e) => updateRow(row.id, "sku", e.target.value)}
                      placeholder="SKU"
                      className="h-8 text-sm font-mono"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.productName}
                      onChange={(e) => updateRow(row.id, "productName", e.target.value)}
                      placeholder="Nama produk"
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={row.pac}
                      onChange={(e) => updateRow(row.id, "pac", e.target.value)}
                      className="h-8 text-sm text-center"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={row.car}
                      onChange={(e) => updateRow(row.id, "car", e.target.value)}
                      className="h-8 text-sm text-center"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={row.ea}
                      onChange={(e) => updateRow(row.id, "ea", e.target.value)}
                      className="h-8 text-sm text-center"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    {isValidRow(row) ? (
                      <Badge variant="secondary" className="text-[var(--success)] bg-[var(--success)]/10">
                        ✓
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground">
                        –
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeRow(row.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Button variant="outline" size="sm" onClick={addRow}>
        <Plus className="mr-1 h-4 w-4" /> Tambah Baris
      </Button>
      {rows.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {rows.filter(isValidRow).length} dari {rows.length} baris valid dan akan dieksekusi.
        </p>
      )}
    </div>
  )
}
