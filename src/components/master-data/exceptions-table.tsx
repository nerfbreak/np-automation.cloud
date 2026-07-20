"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, Trash2, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"

export function ExceptionsTable() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  
  const [skuCorrect, setSkuCorrect] = useState("")
  const [description, setDescription] = useState("")

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/master-data/sku-exceptions")
      const json = await res.json()
      if (json.data) setData(json.data)
    } catch (err) {
      toast.error("Gagal memuat data exceptions")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/master-data/sku-exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku_correct: skuCorrect, description })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      
      toast.success("SKU Exception berhasil ditambahkan")
      setOpen(false)
      setSkuCorrect("")
      setDescription("")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus?")) return
    try {
      const res = await fetch(`/api/master-data/sku-exceptions?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus")
      toast.success("Berhasil dihapus")
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const currentData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Daftar SKU Exceptions</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            Tambah
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah SKU Exception</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">SKU Benar (Misal: 0260659)</label>
                <Input 
                  value={skuCorrect} 
                  onChange={e => setSkuCorrect(e.target.value)} 
                  required 
                  placeholder="0260659"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Deskripsi (Opsional)</label>
                <Input 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Nama barang..."
                />
              </div>
              <Button type="submit" className="w-full">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU Benar</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead className="w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                  Belum ada data.
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono font-medium">{row.sku_correct}</TableCell>
                  <TableCell>{row.description || "-"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {!loading && data.length > 0 && (
        <div className="flex items-center justify-between px-2 relative">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
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
              <ComboboxInput placeholder={`${itemsPerPage}`} className="w-[80px] h-8" showClear={false} />
              <ComboboxContent side="top">
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                  {(item: string) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
