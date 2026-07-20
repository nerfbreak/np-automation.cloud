"use client"

import { useCallback, useState } from "react"
import { cn } from "@/lib/utils"
import { UploadCloud, FileSpreadsheet, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  className?: string
  label?: string
}

export function FileUpload({
  onFileSelect,
  accept = ".csv,.xls,.xlsx",
  className,
  label = "Upload file distributor (CSV / XLS / XLSX)",
}: FileUploadProps) {
  const [dragging, setDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) {
        setSelectedFile(file)
        onFileSelect(file)
      }
    },
    [onFileSelect]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      onFileSelect(file)
    }
  }

  const clear = () => setSelectedFile(null)

  if (selectedFile) {
    return (
      <div className="flex items-center gap-3 border rounded-lg px-4 py-3 bg-muted/40">
        <FileSpreadsheet className="h-8 w-8 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{selectedFile.name}</p>
          <p className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024).toFixed(1)} KB
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={clear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 transition-colors cursor-pointer",
        dragging ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50 hover:bg-muted/40",
        className
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById("file-input")?.click()}
    >
      <UploadCloud className={cn("h-10 w-10", dragging ? "text-primary" : "text-muted-foreground")} />
      <div className="text-center">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">Drag & drop atau klik untuk browse</p>
      </div>
      <input
        id="file-input"
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
