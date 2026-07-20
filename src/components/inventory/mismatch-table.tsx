"use client"

import { useState } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { TrendingDown, TrendingUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

export interface MismatchRow {
  sku: string
  productName: string
  newspageQty: number
  distributorQty: number
  diff: number
}

interface MismatchTableProps {
  rows: MismatchRow[]
}

export function MismatchTable({ rows }: MismatchTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  if (rows.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        ✅ Tidak ada selisih stok ditemukan.
      </div>
    )
  }

  const totalPages = Math.ceil(rows.length / itemsPerPage)
  const currentData = rows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Nama Produk</TableHead>
            <TableHead className="text-right">Stok Newspage</TableHead>
            <TableHead className="text-right">Stok Distributor</TableHead>
            <TableHead className="text-right">Selisih</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentData.map((row) => (
            <TableRow key={row.sku}>
              <TableCell className="font-mono text-sm">{row.sku}</TableCell>
              <TableCell>{row.productName}</TableCell>
              <TableCell className="text-right">{row.newspageQty.toLocaleString()}</TableCell>
              <TableCell className="text-right">{row.distributorQty.toLocaleString()}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {row.diff > 0 ? (
                    <>
                      <TrendingUp className="h-3.5 w-3.5 text-[var(--success)]" />
                      <Badge variant="secondary" className="text-[var(--success)] bg-[var(--success)]/10">
                        +{row.diff}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                      <Badge variant="secondary" className="text-destructive bg-destructive/10">
                        {row.diff}
                      </Badge>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/10 text-xs text-muted-foreground">
        <div>
          {rows.length} baris akan dieksekusi
        </div>
        
        {rows.length > 0 && (
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="font-medium">Rows per page</p>
              <Combobox
                items={["5", "10", "20", "30", "40", "50"]}
                value={`${itemsPerPage}`}
                onValueChange={(value: string | null) => {
                  if (value) {
                    setItemsPerPage(Number(value))
                    setCurrentPage(1)
                  }
                }}
              >
                <ComboboxInput placeholder={`${itemsPerPage}`} className="w-[80px] h-7 text-xs" showClear={false} />
                <ComboboxContent side="top">
                  <ComboboxEmpty>No items found.</ComboboxEmpty>
                  <ComboboxList>
                    {(item: string) => (
                      <ComboboxItem key={item} value={item} className="text-xs">
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <div className="flex w-[80px] items-center justify-center font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="icon"
                className="w-7 h-7"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="w-7 h-7"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="w-7 h-7"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="w-7 h-7"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
