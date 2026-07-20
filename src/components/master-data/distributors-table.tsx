"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { toast } from "sonner"
import { Loader2, Trash2, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Pencil } from "lucide-react"

export function DistributorsTable() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [warehouse, setWarehouse] = useState("GOOD_WHS")
  const [password, setPassword] = useState("")

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/distributors")
      const json = await res.json()
      if (json.distributors) setData(json.distributors)
    } catch (err) {
      toast.error("Gagal memuat data distributor")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenAdd = () => {
    setEditingId(null)
    setCode("")
    setName("")
    setWarehouse("GOOD_WHS")
    setPassword("")
    setOpen(true)
  }

  const handleOpenEdit = (row: any) => {
    setEditingId(row.id)
    setCode(row.username)
    setName(row.name)
    setWarehouse(row.warehouse_code)
    setPassword("")
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const isEdit = !!editingId
      const res = await fetch("/api/distributors", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, code, name, warehouse, password })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      
      toast.success(isEdit ? "Distributor berhasil diperbarui." : "Distributor berhasil ditambahkan. Password dienkripsi otomatis.")
      setOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus distributor ini?")) return
    try {
      const res = await fetch(`/api/distributors?id=${id}`, { method: "DELETE" })
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
        <h3 className="text-lg font-semibold">Daftar Akun Distributor</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" onClick={handleOpenAdd} />}>
            Tambah
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Distributor" : "Tambah Distributor Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Distributor Code (Username)</label>
                <Input 
                  value={code} 
                  onChange={e => setCode(e.target.value)} 
                  required 
                  placeholder="Misal: 1000000045"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Distributor</label>
                <Input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  placeholder="Misal: PT. BARU - JAKARTA"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Warehouse Code</label>
                <Input 
                  value={warehouse} 
                  onChange={e => setWarehouse(e.target.value)} 
                  required 
                  placeholder="Misal: GOOD_WHS"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password Bot (Plain Text)</label>
                <Input 
                  type="password"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required={!editingId} 
                  placeholder={editingId ? "Kosongkan jika tidak ingin mengubah password" : "Password akan dienkripsi otomatis"}
                />
              </div>
              <div className={editingId ? "flex gap-2" : ""}>
                <Button type="submit" className={editingId ? "flex-1" : "w-full"}>{editingId ? "Simpan Perubahan" : "Simpan & Enkripsi"}</Button>
                {editingId && (
                  <Button type="button" variant="destructive" onClick={() => {
                    handleDelete(editingId)
                    setOpen(false)
                  }}>
                    Hapus
                  </Button>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Distributor</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead className="w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  Belum ada data.
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono font-medium">NPSYS{row.username}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.warehouse_code || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(row)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
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
