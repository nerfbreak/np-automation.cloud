"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, Download, Share2, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface ResultPanelProps {
  distributorName: string
  remark: string
  totalAdjusted: number
  screenshotBase64?: string
  onReset: () => void
}

export function ResultPanel({ distributorName, remark, totalAdjusted, screenshotBase64, onReset }: ResultPanelProps) {
  const handleDownload = () => {
    if (screenshotBase64) {
      const link = document.createElement("a")
      link.href = `data:image/png;base64,${screenshotBase64}`
      link.download = `bukti-adjustment-${Date.now()}.png`
      link.click()
    } else {
      toast.success("Screenshot diunduh", { description: "File bukti tersimpan di folder Downloads." })
    }
  }

  const handleShare = async () => {
    const text = `✅ Stock Adjustment Selesai\nDistributor: ${distributorName}\nRemark: ${remark}\nTotal item disesuaikan: ${totalAdjusted}`
    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(text)
      toast.success("Teks tersalin ke clipboard", { description: "Paste ke WhatsApp atau aplikasi lainnya." })
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Success indicator */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-16 w-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
          <CheckCircle2 className="h-9 w-9 text-[var(--success)]" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Eksekusi Berhasil!</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {totalAdjusted} item telah disesuaikan di portal Newspage.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="w-full max-w-sm rounded-lg border bg-muted/30 px-5 py-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Distributor</span>
          <span className="font-medium">{distributorName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Remark</span>
          <span className="font-medium truncate max-w-[180px]">{remark}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Item</span>
          <span className="font-medium">{totalAdjusted}</span>
        </div>
      </div>

      {/* Screenshot */}
      {screenshotBase64 ? (
        <div className="w-full max-w-lg rounded-lg border overflow-hidden shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${screenshotBase64}`}
            alt="Screenshot bukti stock adjustment"
            className="w-full"
          />
        </div>
      ) : (
        <div className="w-full max-w-sm rounded-lg border-2 border-dashed border-muted flex flex-col items-center justify-center gap-2 py-8 bg-muted/20">
          <ExternalLink className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Screenshot bukti</p>
          <p className="text-xs text-muted-foreground/60">
            (dihasilkan oleh bot setelah eksekusi nyata)
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" /> Download Bukti
        </Button>
        <Button variant="outline" onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" /> Share (WhatsApp)
        </Button>
        <Button onClick={onReset}>
          Selesai
        </Button>
      </div>
    </div>
  )
}
