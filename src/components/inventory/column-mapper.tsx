"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowRight } from "lucide-react"
import { newspageColumns } from "@/mocks/distributors"

interface ColumnMapperProps {
  distributorColumns: string[]
  mapping: Record<string, string>
  onChange: (mapping: Record<string, string>) => void
}

export function ColumnMapper({ distributorColumns, mapping, onChange }: ColumnMapperProps) {
  const handleChange = (newspageKey: string, distributorCol: string) => {
    onChange({ ...mapping, [newspageKey]: distributorCol })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center text-xs font-medium text-muted-foreground px-1">
        <span>Kolom Newspage</span>
        <span></span>
        <span>Kolom File Distributor</span>
      </div>
      {newspageColumns.map((col) => (
        <div key={col.key} className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <div className="bg-muted rounded-md px-3 py-2 text-sm font-medium border">
            {col.label}
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Select
            value={mapping[col.key] || ""}
            onValueChange={(val) => handleChange(col.key, val || "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih kolom..." />
            </SelectTrigger>
            <SelectContent>
              {distributorColumns.map((dc) => (
                <SelectItem key={dc} value={dc}>
                  {dc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      <p className="text-xs text-muted-foreground pt-1">
        Petakan kolom dari file distributor ke kolom Newspage yang sesuai.
      </p>
    </div>
  )
}
