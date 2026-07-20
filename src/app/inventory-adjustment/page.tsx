"use client"

import { useCallback, useEffect } from "react"
import { useInventoryStore } from "@/store/inventory-store"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { Stepper } from "@/components/inventory/stepper"
import { FileUpload } from "@/components/inventory/file-upload"
import { ColumnMapper } from "@/components/inventory/column-mapper"
import { MismatchTable, MismatchRow } from "@/components/inventory/mismatch-table"
import { ManualGrid, ManualRow } from "@/components/inventory/manual-grid"
import { ExecutionProgress, ExecutionItem } from "@/components/inventory/execution-progress"
import { ResultPanel } from "@/components/inventory/result-panel"
import { mockNewspageStock, mockDistributorStock } from "@/mocks/distributors"
import { GitCompareArrows, ClipboardList, Loader2, Copy, Download, Timer, AlertCircle, ChevronRight, Ban } from "lucide-react"
import { InlineAlert } from "@/components/feedback/inline-alert"
import { BotProgressEvent } from "@/lib/newspage-bot"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
type Mode = "auto" | "manual" | null

// ── Auto Compare steps ──────────────────────────────────────────────────────
const AUTO_STEPS = [
  { id: 1, label: "Pilih Distributor" },
  { id: 2, label: "Ekstrak Stok" },
  { id: 3, label: "Upload File" },
  { id: 4, label: "Mapping Kolom" },
  { id: 5, label: "Review Selisih" },
  { id: 6, label: "Remark" },
  { id: 7, label: "Eksekusi" },
]

// ── Manual steps ─────────────────────────────────────────────────────────────
const MANUAL_STEPS = [
  { id: 1, label: "Pilih Distributor" },
  { id: 2, label: "Input Data" },
  { id: 3, label: "Remark" },
  { id: 4, label: "Eksekusi" },
]

export default function InventoryAdjustmentPage() {
  const {
    mode, setMode,
    step, setStep,
    distributorId, setDistributorId,
    distributors, setDistributors,
    businessRules, setBusinessRules,
    
    extracting, setExtracting,
    extracted, setExtracted,
    extractLogs, setExtractLogs,
    realNewspageStock, setRealNewspageStock,
    
    uploadedFile, setUploadedFile,
    mapping, setMapping,
    mismatches, setMismatches,
    matchedRows, setMatchedRows,
    remark, setRemark,
    manualRows, setManualRows,
    
    executionItems, setExecutionItems,
    executionLogs, setExecutionLogs,
    screenshotBase64, setScreenshotBase64,
    done, setDone,
    botError, setBotError,
    rawCsvContent, setRawCsvContent,
    
    distributorColumns, setDistributorColumns,
    distributorColumns, setDistributorColumns,
    distributorRawData, setDistributorRawData
  } = useInventoryStore()

  const abortControllerRef = useRef<AbortController | null>(null)

  // Fetch distributors on mount
  useEffect(() => {
    fetch("/api/distributors")
      .then(res => res.json())
      .then(data => { if (data.distributors) setDistributors(data.distributors) })
      .catch(console.error)
  }, [])

  // Fetch business rules when distributor changes
  const distributor = distributors.find((d) => d.id === distributorId)
  useEffect(() => {
    if (distributor?.username) {
      fetch(`/api/inventory/rules?username=${distributor.username}`)
        .then(res => res.json())
        .then(data => { if (!data.error) setBusinessRules(data) })
        .catch(console.error)
    }
  }, [distributor?.username])

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file)
    setRemark(file.name.replace(/\.[^/.]+$/, ""))
    
    try {
      const data = await file.arrayBuffer()
      const XLSX = await import("xlsx")
      const workbook = XLSX.read(data, { type: "array" })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" })
      
      if (jsonData.length > 0) {
        const headers = Object.keys(jsonData[0] as object)
        setDistributorColumns(headers)
        setDistributorRawData(jsonData)
        
        // Auto-map if possible
        const newMapping: Record<string, string> = {}
        headers.forEach(h => {
          const lower = h.toLowerCase()
          // Exact matches for the specific Report5010 template
          if (lower === "alias kode 2") newMapping.sku = h
          else if (lower === "stokakhir") newMapping.qty = h
          // Fallback logic
          else if (!newMapping.sku && (lower.includes("sku") || lower.includes("code") || lower.includes("kode"))) newMapping.sku = h
          else if (!newMapping.productName && (lower.includes("desc") || lower.includes("name") || lower.includes("nama") || lower.includes("barang"))) newMapping.productName = h
          else if (!newMapping.qty && (lower.includes("qty") || lower.includes("jumlah") || lower.includes("stok") || lower.includes("stock") || lower.includes("available"))) newMapping.qty = h
        })
        setMapping(newMapping)
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setExtractLogs(prev => [...prev, { type: "error", message: "Proses ekstraksi dibatalkan oleh user." }])
        setBotError("Dibatalkan")
      } else {
        toast.error("Gagal membaca file. Pastikan formatnya CSV atau Excel (XLS/XLSX).")
      }
    } finally {
      setExtracting(false)
    }
  }

  const next = () => setStep((s) => s + 1)
  const back = () => setStep((s) => s - 1)

  const { resetState } = useInventoryStore()
  const reset = () => {
    resetState()
  }

  // ── Real Newspage extraction via bot API ─────────────────────────────────
  const handleExtract = async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
    abortControllerRef.current = new AbortController()
    
    setExtracting(true)
    setExtractLogs([])
    setBotError("")
    setRawCsvContent("")
    try {
      const resp = await fetch("/api/inventory/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warehouseCode: distributor?.warehouse ?? "", username: distributor?.username ?? "" }),
        signal: abortControllerRef.current.signal,
      })
      const reader = resp.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break
        // Accumulate chunks — a single chunk may contain a partial SSE line
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        // Keep the last (possibly incomplete) line in the buffer
        buffer = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.message) setExtractLogs((prev) => [...prev, { type: event.type ?? "log", message: event.message! }])
            if (event.type === "screenshot") {
              // Intermediate debug screenshot — show in UI
              setScreenshotBase64(event.screenshotBase64 ?? "")
            }
            if (event.type === "result") {
              setRealNewspageStock(event.data)
              setRawCsvContent(event.rawCsv || "")
              setExtracted(true)
            }
            if (event.type === "error") setBotError(event.message ?? "Bot error")
          } catch { /* skip malformed line */ }
        }
      }
    } catch (err) {
      setBotError(err instanceof Error ? err.message : "Gagal terhubung ke bot")
    } finally {
      setExtracting(false)
    }
  }

  // ── Compute mismatches — uses real data if available, falls back to mock ──
  const computeMismatches = () => {
    const newspageData = realNewspageStock ?? mockNewspageStock
    const rows: MismatchRow[] = []
    const matched: MismatchRow[] = []
    
    // Filter Report5010 specific format if applicable
    let filteredDistributorData = distributorRawData;
    if (distributorColumns.length > 0) {
      const colsLower = distributorColumns.map(c => c.toLowerCase());
      const isReport5010 = (colsLower.includes('status brg nam') || colsLower.includes('statusbrgnam')) && 
                           (colsLower.includes('nama gudang') || colsLower.includes('namagudang'));
      
      if (isReport5010) {
        filteredDistributorData = distributorRawData.filter(row => {
          const getVal = (possibleNames: string[]) => {
            for (const name of possibleNames) {
              const originalKey = distributorColumns.find(c => c.toLowerCase() === name.toLowerCase());
              if (originalKey && row[originalKey] !== undefined) {
                return String(row[originalKey]).trim();
              }
            }
            return "";
          };

          const statusBrg = getVal(['Status Brg Nam', 'StatusBrgNam']).toLowerCase();
          const statusAktifGudang = getVal(['Status Aktif Gudang', 'StatusAktifGudang']);
          const namaGudang = getVal(['Nama Gudang', 'NamaGudang']).toUpperCase();
          const aktif = getVal(['Aktif']);
          
          return statusBrg === 'good' && 
                 statusAktifGudang === '1' && 
                 namaGudang === 'GUDANG UTAMA' && 
                 aktif === '1';
        });
      }
    }
    
    // Convert parsed raw data to standard format using the user's mapping
    const parsedDistributorStock = filteredDistributorData.map(row => {
      const rawQty = String(row[mapping.qty] || "0")
      // Remove all non-numeric chars except dot/comma for parsing
      let cleanQty = parseFloat(rawQty.replace(/[^\d.,-]/g, '').replace(/,/g, '')) || 0
      
      let rawSku = String(row[mapping.sku] || "").trim()

      // 1. Check if SKU needs leading zero exception
      // The rules API returned exact matching string, e.g. "0260659". 
      // If our rawSku matches the rule without the zero (e.g. "260659"), we append the 0.
      const exceptionMatch = businessRules.exceptions.find(e => e.replace(/^0+/, '') === rawSku.replace(/^0+/, ''))
      if (exceptionMatch) {
        rawSku = exceptionMatch // Enforce the correct zero-padded SKU
      }

      // 2. Check for SKU Multipliers
      const multiplierRule = businessRules.multipliers.find(m => m.sku === rawSku)
      if (multiplierRule) {
        cleanQty = cleanQty * multiplierRule.multiplier
      }

      return {
        sku: rawSku,
        productName: String(row[mapping.productName] || "").trim(),
        qty: Math.round(cleanQty)
      }
    }).filter(r => r.sku)
    
    const distStockToUse = parsedDistributorStock.length > 0 ? parsedDistributorStock : mockDistributorStock

    const cleanSku = (s: string) => String(s).replace(/^0+/, '').replace(/["']/g, '').trim().toLowerCase()

    const processedSkus = new Set<string>()

    // 1. File Upload (Distributor) sebagai patokan utama
    for (const dist of distStockToUse) {
      const distSkuClean = cleanSku(dist.sku)
      processedSkus.add(distSkuClean)
      
      const np = newspageData.find((n) => cleanSku(n.sku) === distSkuClean)
      const npQty = np ? np.qty : 0
      const diff = dist.qty - npQty
      
      if (diff !== 0) {
        rows.push({ 
          sku: np ? np.sku : dist.sku, 
          productName: np ? np.productName : (dist.productName || "Unknown Product"), 
          newspageQty: npQty, 
          distributorQty: dist.qty, 
          diff 
        })
      } else {
        matched.push({ 
          sku: np ? np.sku : dist.sku, 
          productName: np ? np.productName : (dist.productName || "Unknown Product"), 
          newspageQty: npQty, 
          distributorQty: dist.qty, 
          diff 
        })
      }
    }

    // 2. Tambahkan juga produk yang ada di Newspage tapi GAK ADA di file Upload (dibuat jadi 0)
    for (const np of newspageData) {
      const npSkuClean = cleanSku(np.sku)
      if (!processedSkus.has(npSkuClean)) {
        const diff = 0 - np.qty
        if (diff !== 0) {
          rows.push({ 
            sku: np.sku, 
            productName: np.productName, 
            newspageQty: np.qty, 
            distributorQty: 0, 
            diff 
          })
        } else {
          matched.push({ 
            sku: np.sku, 
            productName: np.productName, 
            newspageQty: np.qty, 
            distributorQty: 0, 
            diff 
          })
        }
      }
    }
    setMismatches(rows)
    setMatchedRows(matched)
    next()
  }

  // ── Enqueue execution via API ──────────────────────────────────────────────
  const prepareExecution = async () => {
    let adjRows: { sku: string; productName: string; qty: number }[] = []
    if (mode === "auto") {
      adjRows = mismatches.map((m) => ({ sku: m.sku, productName: m.productName, qty: m.diff }))
    } else {
      adjRows = manualRows
        .filter((r) => r.sku && (parseInt(r.ea) > 0 || parseInt(r.pac) > 0 || parseInt(r.car) > 0))
        .map((r) => ({
          sku: r.sku,
          productName: r.productName || r.sku,
          qty: parseInt(r.ea) || parseInt(r.pac) || parseInt(r.car),
        }))
    }

    setBotError("")
    setExecutionLogs([])
    try {
      const resp = await fetch("/api/inventory/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rows: adjRows, 
          remark,
          distributorUsername: distributor?.username,
          userId: "00000000-0000-0000-0000-000000000000" // Temporary user UUID until auth is wired
        }),
      })
      
      const data = await resp.json()
      
      if (!resp.ok) {
        throw new Error(data.error || "Gagal memasukkan antrian")
      }
      
      setExecutionLogs([`Sukses! Job ID: ${data.jobId}`, data.message, `Jumlah SKU: ${adjRows.length}`])
      setDone(true)
      toast.success("Berhasil Masuk Antrian", {
        description: `Job ID: ${data.jobId}. Cek Dashboard untuk melihat progress.`,
      })
      next()
    } catch (err) {
      setBotError(err instanceof Error ? err.message : "Gagal terhubung ke server")
      setDone(true)
      next()
    }
  }

  const handleComplete = useCallback(() => setDone(true), [])

  // ── Determine current steps ───────────────────────────────────────────────
  const steps = mode === "auto" ? AUTO_STEPS : MANUAL_STEPS
  const totalSteps = steps.length

  // ═══════════════════════════════════════════════════════════════════════════
  // MODE SELECTION
  // ═══════════════════════════════════════════════════════════════════════════
  if (!mode) {
    return (
      <AppShell breadcrumbs={[{ label: "Inventory Adjustment" }]}>
        <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-12 w-full">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory Adjustment</h1>
            <p className="text-muted-foreground mt-2">
              Pilih mode penyesuaian stok yang akan digunakan.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auto Compare */}
            <Card
              className="cursor-pointer hover:border-primary/60 hover:shadow-md transition-all group"
              onClick={() => setMode("auto")}
            >
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-xl w-fit group-hover:bg-primary/20 transition-colors mb-2">
                  <GitCompareArrows className="h-7 w-7 text-primary" />
                </div>
                <CardTitle>Auto Compare Mode</CardTitle>
                <CardDescription>
                  Ekstrak stok Newspage secara otomatis, upload file distributor, dan sistem akan mendeteksi selisih untuk dieksekusi.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>✓ Ekstraksi otomatis dari Newspage</p>
                <p>✓ Mapping kolom fleksibel</p>
                <p>✓ Hanya baris selisih yang diproses</p>
              </CardContent>
            </Card>

            {/* Manual Entry */}
            <Card
              className="cursor-pointer hover:border-primary/60 hover:shadow-md transition-all group"
              onClick={() => setMode("manual")}
            >
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-xl w-fit group-hover:bg-primary/20 transition-colors mb-2">
                  <ClipboardList className="h-7 w-7 text-primary" />
                </div>
                <CardTitle>Manual Entry Mode</CardTitle>
                <CardDescription>
                  Input SKU dan kuantitas secara langsung atau upload file, lalu eksekusi penyesuaian tanpa perlu ekstraksi Newspage.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>✓ Input SKU langsung (PAC / CAR / EA)</p>
                <p>✓ Upload file opsional</p>
                <p>✓ Hanya baris valid yang dieksekusi</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WIZARD
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <AppShell breadcrumbs={[
      { label: "Inventory Adjustment", href: "/inventory-adjustment" },
      { label: mode === "auto" ? "Auto Compare" : "Manual Entry" },
    ]}>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "auto" ? "Auto Compare Mode" : "Manual Entry Mode"}
            </h1>
            {distributor && (
              <p className="text-muted-foreground text-sm mt-1">
                Distributor: <strong>{distributor.name}</strong>
              </p>
            )}
          </div>
          <Button variant="ghost" onClick={reset}>Ganti Mode</Button>
        </div>

        {/* Stepper */}
        <Stepper steps={steps} currentStep={step} />

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{steps[step - 1]?.label}</CardTitle>
          </CardHeader>
          <Separator className="mx-6 mb-4 w-auto" />
          <CardContent className="space-y-5">

            {/* ── AUTO COMPARE STEPS ─────────────────────────────────────── */}
            {mode === "auto" && (
              <>
                {/* Step 1 – Select Distributor */}
                {step === 1 && (
                  <div className="space-y-3">
                    <Combobox 
                      items={distributors}
                      itemToStringLabel={(item: any) => item ? item.name : ""}
                      value={distributors.find(d => d.id === distributorId) || null} 
                      onValueChange={(val: any) => {
                         setDistributorId(val?.id || "")
                      }}
                    >
                      <ComboboxInput placeholder="Pilih distributor..." showClear={false} />
                      <ComboboxContent>
                        <ComboboxEmpty>Distributor tidak ditemukan.</ComboboxEmpty>
                        <ComboboxList>
                          {(item: any) => (
                            <ComboboxItem key={item.id} value={item}>
                              {item.name}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>
                )}

                {/* Step 2 – Extract */}
                {step === 2 && (
                  <div className="space-y-4">
                    <InlineAlert variant="info" title="Bot akan mengekstrak data stok dari Newspage">
                      Bot akan login ke Newspage, membuat Export Job, dan mendownload Inventory Master secara otomatis.
                    </InlineAlert>
                    {botError && (
                      <InlineAlert variant="destructive" title="Error">
                        {botError}
                      </InlineAlert>
                    )}
                    {!extracted ? (
                      <>
                        <Button onClick={handleExtract} disabled={extracting} className="w-full">
                          {extracting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> <span className="shimmer">Bot sedang berjalan...</span></>
                          ) : (
                            "Mulai Ekstraksi Stok Newspage"
                          )}
                        </Button>
                        {extractLogs.length > 0 && (
                          <div className="relative rounded-lg bg-black/90 text-green-400 font-mono text-xs p-4 max-h-48 overflow-y-auto space-y-1">
                              <div className="absolute top-2 right-2 flex items-center gap-2">
                                <Tooltip>
                                  <TooltipTrigger
                                    onClick={() => {
                                      if (abortControllerRef.current) {
                                        abortControllerRef.current.abort()
                                        setExtracting(false)
                                      }
                                    }}
                                    className="text-red-400/50 hover:text-red-400 transition-colors"
                                  >
                                    <Ban className="h-3.5 w-3.5" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Batalkan
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger
                                    onClick={() => {
                                      navigator.clipboard.writeText(extractLogs.map(l => l.message).join("\n"))
                                      toast.success("Log disalin!", { description: `${extractLogs.length} baris tersalin ke clipboard.` })
                                    }}
                                    className="text-green-400/50 hover:text-green-300 transition-colors"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Copy all logs
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              {extractLogs.map((log, i) => {
                              const isWaiting = log.type === "waiting"
                              const isError = log.type === "error"
                              return (
                                <div key={i} className={`flex items-start gap-1.5 ${
                                  isWaiting ? "text-amber-400" :
                                  isError ? "text-red-400" :
                                  "text-green-400"
                                }`}>
                                  {isWaiting
                                    ? <Timer className="h-3 w-3 mt-0.5 shrink-0 animate-pulse" />
                                    : isError
                                    ? <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                    : <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" />}
                                  <span>{log.message}</span>
                                </div>
                              )
                            })}
                            {extracting && <div className="animate-pulse">› ...</div>}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4">
                        <InlineAlert variant="success" title="Ekstraksi selesai">
                          {(realNewspageStock ?? mockNewspageStock).length} produk berhasil diekstrak dari Newspage.
                        </InlineAlert>
                        {rawCsvContent && (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => {
                              const blob = new Blob([rawCsvContent], { type: 'text/csv' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = 'raw_newspage_export.csv'
                              a.click()
                              URL.revokeObjectURL(url)
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" /> Download Raw CSV File
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3 – Upload file */}
                {step === 3 && (
                  <FileUpload
                    onFileSelect={handleFileUpload}
                  />
                )}

                {/* Step 4 – Column Mapping */}
                {step === 4 && (
                  <ColumnMapper
                    distributorColumns={distributorColumns.length > 0 ? distributorColumns : ["Kode SKU", "Nama Barang", "Jumlah Stok"]}
                    mapping={mapping}
                    onChange={setMapping}
                  />
                )}

                {/* Step 5 – Review mismatches */}
                {step === 5 && (
                  <div className="space-y-3">
                    {mismatches.length === 0 && (
                      <div className="space-y-4">
                        <InlineAlert variant="success" title="Stok Sinkron">
                          Tidak ada selisih stok antara data Newspage dan file Distributor. Anda tidak perlu melakukan penyesuaian (adjustment).
                        </InlineAlert>
                        <div className="bg-muted p-4 rounded-md text-xs font-mono overflow-auto whitespace-pre-wrap">
                          <strong>DIAGNOSTIC DEBUG INFO:</strong><br />
                          Newspage items: {realNewspageStock?.length ?? mockNewspageStock.length}<br />
                          Distributor items: {distributorRawData.length}<br />
                          Matched items: {matchedRows.length}<br /><br />
                          <strong>Sample Matched Data (first 3):</strong><br />
                          {JSON.stringify(matchedRows.slice(0, 3).map(r => ({
                            sku: r.sku,
                            productName: r.productName,
                            qty_newspage: r.newspageQty,
                            qty_distributor: r.distributorQty,
                            status: "MATCHED"
                          })), null, 2)}
                        </div>
                      </div>
                    )}
                    {mismatches.length > 0 && <MismatchTable rows={mismatches} />}
                  </div>
                )}

                {/* Step 6 – Remark */}
                {step === 6 && (
                  <div className="space-y-2">
                    <Label htmlFor="remark">Keterangan / Remark <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="remark"
                      placeholder="Contoh: Stock Opname IMP Juli 2026"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      rows={3}
                    />
                    {uploadedFile && (
                      <p className="text-xs text-muted-foreground">
                        Auto-filled dari nama file: <em>{uploadedFile.name}</em>
                      </p>
                    )}
                  </div>
                )}

                {/* Step 7 – Execute */}
                {step === 7 && (
                  <div className="space-y-4">
                    {botError ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <InlineAlert variant="destructive" title="Gagal Masuk Antrian">
                          {botError}
                        </InlineAlert>
                        <Button variant="outline" onClick={() => { setBotError(""); setDone(false); back() }}>Coba Lagi</Button>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-4 pt-2 pb-4">
                        <InlineAlert variant="success" title="Berhasil Dimasukkan ke Antrian (Queue)">
                          Data penyesuaian stok sudah masuk antrian BullMQ. Robot akan mengeksekusi secara bergiliran.
                        </InlineAlert>
                        <div className="bg-muted p-4 rounded-md text-xs font-mono w-full">
                          {executionLogs.map((log, i) => (
                            <div key={i}>{log}</div>
                          ))}
                        </div>
                        <div className="flex gap-4">
                          <Button variant="outline" onClick={reset}>Mulai Baru</Button>
                          <Button nativeButton={false} render={<a href="/tasks">Lihat Tasks</a>} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── MANUAL ENTRY STEPS ────────────────────────────────────── */}
            {mode === "manual" && (
              <>
                {/* Step 1 – Select Distributor */}
                {step === 1 && (
                  <div className="space-y-3 pb-[200px]">
                    <Combobox 
                      items={distributors}
                      itemToStringLabel={(item: any) => item ? item.name : ""}
                      value={distributors.find(d => d.id === distributorId) || null} 
                      onValueChange={(val: any) => {
                         setDistributorId(val?.id || "")
                      }}
                    >
                      <ComboboxInput placeholder="Pilih distributor..." showClear={false} />
                      <ComboboxContent>
                        <ComboboxEmpty>Distributor tidak ditemukan.</ComboboxEmpty>
                        <ComboboxList>
                          {(item: any) => (
                            <ComboboxItem key={item.id} value={item}>
                              {item.name}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>
                )}

                {/* Step 2 – Manual grid + optional upload */}
                {step === 2 && (
                  <div className="space-y-5">
                    <FileUpload
                      label="Upload file opsional (CSV / XLS / XLSX) untuk pre-fill tabel"
                      onFileSelect={(f) => setRemark(f.name.replace(/\.[^/.]+$/, ""))}
                    />
                    <div className="relative flex items-center gap-3">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">atau isi manual</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <ManualGrid rows={manualRows} onChange={setManualRows} />
                  </div>
                )}

                {/* Step 3 – Remark */}
                {step === 3 && (
                  <div className="space-y-2">
                    <Label htmlFor="remark-manual">Keterangan / Remark <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="remark-manual"
                      placeholder="Contoh: Adjustment manual SAT Juni 2026"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                {/* Step 4 – Execute */}
                {step === 4 && (
                  <div className="space-y-4">
                    {botError ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <InlineAlert variant="destructive" title="Gagal Masuk Antrian">
                          {botError}
                        </InlineAlert>
                        <Button variant="outline" onClick={() => { setBotError(""); setDone(false); back() }}>Coba Lagi</Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <InlineAlert variant="success" title="Berhasil Dimasukkan ke Antrian (Queue)">
                          Data penyesuaian stok manual sudah masuk antrian BullMQ. Robot akan mengeksekusi secara bergiliran.
                        </InlineAlert>
                        <div className="bg-muted p-4 rounded-md text-xs font-mono w-full">
                          {executionLogs.map((log, i) => (
                            <div key={i}>{log}</div>
                          ))}
                        </div>
                        <div className="flex gap-4">
                          <Button variant="outline" onClick={reset}>Mulai Baru</Button>
                          <Button nativeButton={false} render={<a href="/tasks">Lihat Tasks</a>} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

          </CardContent>
        </Card>

        {/* Navigation */}
        {!done && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={step === 1 ? reset : back}
            >
              {step === 1 ? "Ganti Mode" : "← Kembali"}
            </Button>

            {/* Auto Compare: special actions */}
            {mode === "auto" && (
              <>
                {step === 2 && (
                  <Button onClick={next} disabled={!extracted}>
                    Lanjut →
                  </Button>
                )}
                {step === 3 && (
                  <Button onClick={next} disabled={!uploadedFile}>
                    Lanjut →
                  </Button>
                )}
                {step === 4 && (
                  <Button
                    onClick={() => {
                      const allMapped = ["sku", "productName", "qty"].every((k) => mapping[k])
                      if (allMapped) computeMismatches()
                    }}
                    disabled={!["sku", "productName", "qty"].every((k) => mapping[k])}
                  >
                    Bandingkan Stok →
                  </Button>
                )}
                {step === 5 && (
                  <Button onClick={mismatches.length === 0 ? reset : next}>
                    {mismatches.length === 0 ? "Selesai (Kembali ke Awal)" : `Review Remark (${mismatches.length} baris) →`}
                  </Button>
                )}
                {step === 6 && (
                  <Button onClick={prepareExecution} disabled={!remark.trim()}>
                    Mulai Eksekusi →
                  </Button>
                )}
                {step === 1 && (
                  <Button onClick={next} disabled={!distributorId}>
                    Lanjut →
                  </Button>
                )}
              </>
            )}

            {/* Manual: special actions */}
            {mode === "manual" && (
              <>
                {step === 1 && (
                  <Button onClick={next} disabled={!distributorId}>
                    Lanjut →
                  </Button>
                )}
                {step === 2 && (
                  <Button
                    onClick={next}
                    disabled={manualRows.filter((r) => r.sku.trim()).length === 0}
                  >
                    Lanjut →
                  </Button>
                )}
                {step === 3 && (
                  <Button onClick={prepareExecution} disabled={!remark.trim()}>
                    Mulai Eksekusi →
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
