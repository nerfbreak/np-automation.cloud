import { create } from 'zustand'
import { MismatchRow } from '@/components/inventory/mismatch-table'
import { ManualRow } from '@/components/inventory/manual-grid'
import { ExecutionItem } from '@/components/inventory/execution-progress'

type Mode = "auto" | "manual" | null

interface InventoryState {
  mode: Mode
  step: number
  distributorId: string
  distributors: any[]
  businessRules: { exceptions: string[], multipliers: { sku: string, multiplier: number }[] }
  
  extracting: boolean
  extracted: boolean
  extractLogs: { type: string; message: string }[]
  realNewspageStock: { sku: string; productName: string; qty: number }[] | null
  
  uploadedFile: File | null
  mapping: Record<string, string>
  mismatches: MismatchRow[]
  matchedRows: MismatchRow[]
  remark: string
  manualRows: ManualRow[]
  
  executionItems: ExecutionItem[]
  executionLogs: string[]
  screenshotBase64: string
  done: boolean
  botError: string
  rawCsvContent: string
  
  distributorColumns: string[]
  distributorRawData: any[]

  // Actions
  setMode: (mode: Mode) => void
  setStep: (step: number | ((s: number) => number)) => void
  setDistributorId: (id: string) => void
  setDistributors: (distributors: any[]) => void
  setBusinessRules: (rules: any) => void
  
  setExtracting: (val: boolean) => void
  setExtracted: (val: boolean) => void
  setExtractLogs: (logs: { type: string; message: string }[] | ((prev: { type: string; message: string }[]) => { type: string; message: string }[])) => void
  setRealNewspageStock: (stock: any[] | null) => void
  setUploadedFile: (file: File | null) => void
  setMapping: (mapping: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void
  setMismatches: (mismatches: MismatchRow[]) => void
  setMatchedRows: (matchedRows: MismatchRow[]) => void
  setRemark: (remark: string) => void
  setManualRows: (rows: ManualRow[]) => void
  
  setExecutionItems: (items: ExecutionItem[] | ((prev: ExecutionItem[]) => ExecutionItem[])) => void
  setExecutionLogs: (logs: string[] | ((prev: string[]) => string[])) => void
  setScreenshotBase64: (base64: string) => void
  setDone: (done: boolean) => void
  setBotError: (error: string) => void
  setRawCsvContent: (content: string) => void
  
  setDistributorColumns: (columns: string[]) => void
  setDistributorRawData: (data: any[]) => void
  
  resetState: () => void
}

const initialState = {
  mode: null as Mode,
  step: 1,
  distributorId: "",
  distributors: [],
  businessRules: { exceptions: [], multipliers: [] },
  
  extracting: false,
  extracted: false,
  extractLogs: [],
  realNewspageStock: null,
  
  uploadedFile: null,
  mapping: { sku: "", productName: "", qty: "" },
  mismatches: [],
  matchedRows: [],
  remark: "",
  manualRows: [{ id: "1", sku: "", productName: "", qty: "", ea: "", pac: "", car: "" }],
  
  executionItems: [],
  executionLogs: [],
  screenshotBase64: "",
  done: false,
  botError: "",
  rawCsvContent: "",
  
  distributorColumns: [],
  distributorRawData: [],
}

export const useInventoryStore = create<InventoryState>((set) => ({
  ...initialState,
  
  setMode: (mode) => set({ mode }),
  setStep: (step) => set((state) => ({ step: typeof step === 'function' ? step(state.step) : step })),
  setDistributorId: (distributorId) => set({ distributorId }),
  setDistributors: (distributors) => set({ distributors }),
  setBusinessRules: (businessRules) => set({ businessRules }),
  
  setExtracting: (extracting) => set({ extracting }),
  setExtracted: (extracted) => set({ extracted }),
  setExtractLogs: (fn) => set((state) => ({ extractLogs: typeof fn === 'function' ? fn(state.extractLogs) : fn })),
  setRealNewspageStock: (realNewspageStock) => set({ realNewspageStock }),
  
  setUploadedFile: (uploadedFile) => set({ uploadedFile }),
  setMapping: (fn) => set((state) => ({ mapping: typeof fn === 'function' ? fn(state.mapping) : fn })),
  setMismatches: (mismatches) => set({ mismatches }),
  setMatchedRows: (matchedRows) => set({ matchedRows }),
  setRemark: (remark) => set({ remark }),
  setManualRows: (manualRows) => set({ manualRows }),
  
  setExecutionItems: (fn) => set((state) => ({ executionItems: typeof fn === 'function' ? fn(state.executionItems) : fn })),
  setExecutionLogs: (fn) => set((state) => ({ executionLogs: typeof fn === 'function' ? fn(state.executionLogs) : fn })),
  setScreenshotBase64: (screenshotBase64) => set({ screenshotBase64 }),
  setDone: (done) => set({ done }),
  setBotError: (botError) => set({ botError }),
  setRawCsvContent: (rawCsvContent) => set({ rawCsvContent }),
  
  setDistributorColumns: (distributorColumns) => set({ distributorColumns }),
  setDistributorRawData: (distributorRawData) => set({ distributorRawData }),
  
  resetState: () => set(initialState)
}))
