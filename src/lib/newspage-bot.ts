import { chromium, Browser, Page, BrowserContext, Frame } from "playwright"
import * as path from "path"
import * as fs from "fs/promises"
import * as os from "os"

// ── Config ────────────────────────────────────────────────────────────────────
const NEWSPAGE_URL = process.env.NEWSPAGE_URL!
const HEADLESS = true // toggle via PLAYWRIGHT_HEADLESS env when stable
const TIMEOUT = parseInt(process.env.PLAYWRIGHT_TIMEOUT_MS ?? "60000")

export interface Credentials {
  username: string
  password: string
}

export type ProgressCallback = (event: BotProgressEvent) => void

export interface BotProgressEvent {
  type: "log" | "progress" | "error" | "done" | "screenshot" | "result" | "waiting"
  message?: string
  sku?: string
  status?: "running" | "done" | "error"
  index?: number
  total?: number
  position?: number  // posisi antrian kalau waiting
  screenshotBase64?: string
  data?: ExtractedStockRow[]
  rawCsv?: string
}

export interface AdjustmentRow {
  sku: string
  productName: string
  qty: number
}

export interface ExtractedStockRow {
  sku: string
  productName: string
  qty: number
}

// ── Browser Singleton ───────────────────────────────────────────────────────────
const globalAny: any = globalThis

// ── Browser Pool ─────────────────────────────────────────────────────────────
// Tiap distributor (username) punya browser instance sendiri.
// Ini memungkinkan beberapa user jalan bersamaan tanpa konflik session.
const MAX_CONCURRENT_BROWSERS = parseInt(process.env.MAX_CONCURRENT_BROWSERS || '2')
// Minimum free RAM sebelum boleh spawn browser baru (~500MB per Chromium instance)
const MIN_FREE_RAM_MB = parseInt(process.env.MIN_FREE_RAM_MB || '700')
interface BrowserInstance {
  browser: Browser
  context: BrowserContext
  page: Page
  refCount: number
}

function getBrowserPool(): Map<string, BrowserInstance> {
  if (!globalAny.browserPool) globalAny.browserPool = new Map<string, BrowserInstance>()
  return globalAny.browserPool
}

function getWaitQueue(): Array<{ resolve: () => void }> {
  if (!globalAny.browserWaitQueue) globalAny.browserWaitQueue = []
  return globalAny.browserWaitQueue
}

async function getOrCreateBrowser(
  username: string,
  onWaiting?: (position: number) => void
): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  const pool = getBrowserPool()
  const existing = pool.get(username)

  // Reuse browser kalau masih hidup
  if (existing && existing.browser.isConnected() && !existing.page.isClosed()) {
    existing.refCount++
    console.log(`[Browser:${username}] Reuse session (ref: ${existing.refCount})`)
    return { browser: existing.browser, context: existing.context, page: existing.page }
  }

  // Kalau pool sudah penuh ATAU RAM tidak cukup, masuk antrian
  const freeMB = os.freemem() / 1024 / 1024
  const ramOk = freeMB >= MIN_FREE_RAM_MB
  if (pool.size >= MAX_CONCURRENT_BROWSERS || !ramOk) {
    const queue = getWaitQueue()
    const position = queue.length + 1
    if (!ramOk) {
      console.warn(`[Browser:${username}] RAM kritis! Free: ${Math.round(freeMB)}MB < ${MIN_FREE_RAM_MB}MB minimum. Antrian #${position}`)
    } else {
      console.log(`[Browser:${username}] Pool penuh (${pool.size}/${MAX_CONCURRENT_BROWSERS}), antrian #${position}`)
    }
    onWaiting?.(position)
    await new Promise<void>(resolve => { queue.push({ resolve }) })
  }
  // Buka browser baru untuk username ini
  console.log(`[Browser:${username}] Membuka browser baru... (slot ${pool.size + 1}/${MAX_CONCURRENT_BROWSERS})`)
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--remote-allow-origins=*",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1920,1080",
    ],
  })

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    acceptDownloads: true,
  })
  const page = await context.newPage()
  page.setDefaultTimeout(TIMEOUT)
  page.setDefaultNavigationTimeout(TIMEOUT)

  const instance: BrowserInstance = { browser, context, page, refCount: 1 }
  pool.set(username, instance)
  return { browser, context, page }
}

export async function closeBrowser(username: string, force = false): Promise<void> {
  const pool = getBrowserPool()
  const instance = pool.get(username)
  if (!instance) return

  if (!force) {
    instance.refCount = Math.max(0, instance.refCount - 1)
    if (instance.refCount > 0) {
      console.log(`[Browser:${username}] masih dipakai (ref: ${instance.refCount}), skip close.`)
      return
    }
  } else {
    console.log(`[Browser:${username}] Force close! Session stale di-reset.`)
    instance.refCount = 0
  }

  try {
    await instance.page.close().catch(() => {})
    await instance.context.close().catch(() => {})
    await instance.browser.close()
    console.log(`[Browser:${username}] Closed. RAM freed.`)
  } catch (e) {
    console.error(`[Browser:${username}] Failed to close gracefully:`, e)
  } finally {
    // Force-kill semua child process Chromium (gpu-process, renderer, dll)
    // kalau browser.close() tidak cascade dengan benar
    try {
      ;(instance.browser as any).process()?.kill('SIGKILL')
    } catch { /* already dead */ }
  }
  pool.delete(username)
  console.log(`[Browser:${username}] Removed from pool. Active: ${pool.size}/${MAX_CONCURRENT_BROWSERS}`)

  // Notif antrian berikutnya kalau ada slot kosong
  const queue = getWaitQueue()
  if (queue.length > 0 && pool.size < MAX_CONCURRENT_BROWSERS) {
    console.log(`[Browser] Slot freed, notifying queue (${queue.length} waiting)`)
    const next = queue.shift()!
    next.resolve()
  }
}

/** Cek apakah browser untuk username tertentu sedang dipakai */
export function isBrowserBusy(username: string): boolean {
  const pool = getBrowserPool()
  const instance = pool.get(username)
  return instance ? instance.refCount > 0 : false
}

/**
 * findFrame — search all frames (main + iframes) for an element by ID or CSS selector.
 * Newspage loads its content in nested iframes.
 */
async function findFrame(page: Page, selectorOrId: string): Promise<Frame> {
  for (const frame of page.frames()) {
    const found = await frame.evaluate(
      (sel) => {
        const isSel = sel.includes('[') || sel.includes('.') || sel.includes('#') || sel.includes('>');
        if (!isSel) return !!document.getElementById(sel);
        const els = document.querySelectorAll(sel);
        for (let i = els.length - 1; i >= 0; i--) {
          if ((els[i] as HTMLElement).offsetHeight > 0 || (els[i] as HTMLElement).offsetWidth > 0) return true;
        }
        return els.length > 0;
      },
      selectorOrId
    ).catch(() => false)
    if (found) return frame
  }
  throw new Error(`Element not found in any frame: ${selectorOrId}`)
}

/** jsClick — fire click via native browser events (focus, mousedown, click) to ensure all WebForms handlers execute */
async function jsClick(page: Page, selectorOrId: string): Promise<void> {
  await waitForElement(page, selectorOrId) // Tunggu elemen muncul dulu (penting di VPS yang lebih lambat)
  const frame = await findFrame(page, selectorOrId)
  await frame.evaluate((sel) => {
    const isSel = sel.includes('[') || sel.includes('.') || sel.includes('#') || sel.includes('>');
    let el: Element | null = null;
    if (!isSel) el = document.getElementById(sel);
    else {
      const els = document.querySelectorAll(sel);
      for (let i = els.length - 1; i >= 0; i--) {
        if ((els[i] as HTMLElement).offsetHeight > 0 || (els[i] as HTMLElement).offsetWidth > 0) { el = els[i]; break; }
      }
      if (!el && els.length > 0) el = els[els.length - 1];
    }
    if (el && el instanceof HTMLElement) {
      el.focus() // Wajib untuk WebForms: set SYS_activeElementId
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })) // Eksekusi appendDelayCall() kalau ada di onmousedown
      el.click() // Eksekusi postback
    }
    else throw new Error(`Element ${sel} disappeared before click`)
  }, selectorOrId)
}

/** jsSelect — set select value + dispatch change, searches all frames */
async function jsSelect(page: Page, selectorOrId: string, value: string): Promise<void> {
  const frame = await findFrame(page, selectorOrId)
  await frame.evaluate(({ sel, val }) => {
    const isSel = sel.includes('[') || sel.includes('.') || sel.includes('#') || sel.includes('>');
    let el: HTMLSelectElement | null = null;
    if (!isSel) el = document.getElementById(sel) as HTMLSelectElement | null;
    else {
      const els = document.querySelectorAll(sel);
      for (let i = els.length - 1; i >= 0; i--) {
        if ((els[i] as HTMLElement).offsetHeight > 0 || (els[i] as HTMLElement).offsetWidth > 0) { el = els[i] as HTMLSelectElement; break; }
      }
      if (!el && els.length > 0) el = els[els.length - 1] as HTMLSelectElement;
    }
    if (!el) throw new Error(`${sel} disappeared`)
    el.value = val
    el.dispatchEvent(new Event("change", { bubbles: true }))
  }, { sel: selectorOrId, val: value })
}

/** jsFill — set input value + dispatch events, searches all frames */
async function jsFill(page: Page, selectorOrId: string, value: string): Promise<void> {
  const frame = await findFrame(page, selectorOrId)
  await frame.evaluate(({ sel, val }) => {
    const isSel = sel.includes('[') || sel.includes('.') || sel.includes('#') || sel.includes('>');
    let el: HTMLInputElement | null = null;
    if (!isSel) el = document.getElementById(sel) as HTMLInputElement | null;
    else {
      const els = document.querySelectorAll(sel);
      for (let i = els.length - 1; i >= 0; i--) {
        if ((els[i] as HTMLElement).offsetHeight > 0 || (els[i] as HTMLElement).offsetWidth > 0) { el = els[i] as HTMLInputElement; break; }
      }
      if (!el && els.length > 0) el = els[els.length - 1] as HTMLInputElement;
    }
    if (!el) throw new Error(`${sel} disappeared`)
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set
    nativeSetter?.call(el, val)
    el.dispatchEvent(new Event("input", { bubbles: true }))
    el.dispatchEvent(new Event("change", { bubbles: true }))
  }, { sel: selectorOrId, val: value })
}

/** jsCheck — check a checkbox via JS, searches all frames */
async function jsCheck(page: Page, selectorOrId: string): Promise<void> {
  const frame = await findFrame(page, selectorOrId)
  await frame.evaluate((sel) => {
    const isSel = sel.includes('[') || sel.includes('.') || sel.includes('#') || sel.includes('>');
    let el: HTMLInputElement | null = null;
    if (!isSel) el = document.getElementById(sel) as HTMLInputElement | null;
    else {
      const els = document.querySelectorAll(sel);
      for (let i = els.length - 1; i >= 0; i--) {
        if ((els[i] as HTMLElement).offsetHeight > 0 || (els[i] as HTMLElement).offsetWidth > 0) { el = els[i] as HTMLInputElement; break; }
      }
      if (!el && els.length > 0) el = els[els.length - 1] as HTMLInputElement;
    }
    if (!el.checked) {
      el.checked = true
      el.dispatchEvent(new Event("change", { bubbles: true }))
    }
  }, selectorOrId)
}

/** 
 * Smart wait khusus untuk portal ASP.NET legacy: 
 * Menunggu network idle, load state, dan memberi jeda ekstra untuk memastikan UpdatePanel selesai me-render DOM.
 */
async function smartWait(page: Page, extraDelay = 250) {
  // Tunggu sejenak memberi waktu bagi JS onclick handlers untuk nge-trigger 
  // XMLHttpRequest/UpdatePanel postback sebelum kita nge-cek statusnya.
  await page.waitForTimeout(500)
  
  await page.waitForLoadState("domcontentloaded").catch(() => {})
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})
  
  // Custom polling: Tunggu sampai semua frame bener-bener ready dan gak ada AJAX postback ASP.NET yang jalan
  const start = Date.now()
  while (Date.now() - start < 30000) {
    let isBusy = false
    for (const frame of page.frames()) {
      const busy = await frame.evaluate(() => {
        if (document.readyState !== 'complete') return true
        
        // Cek ASP.NET AJAX UpdatePanel state
        const sys = (window as any).Sys
        if (typeof sys !== 'undefined' && sys.WebForms && sys.WebForms.PageRequestManager) {
          const prm = sys.WebForms.PageRequestManager.getInstance()
          if (prm && prm.get_isInAsyncPostBack()) return true
        }
        return false
      }).catch((e: Error) => {
        // If the frame is navigating or destroyed, consider it BUSY.
        // If it's a cross-origin error, ignore it.
        if (e.message.includes('Execution context was destroyed') || e.message.includes('navigating')) return true;
        return false;
      })
      
      if (busy) {
        isBusy = true
        break
      }
    }
    
    if (!isBusy) break
    await new Promise(r => setTimeout(r, 500))
  }

  // Delay fisik karena JavaScript UpdatePanel (UpdateProgress) kadang butuh waktu ekstra untuk me-replace DOM setelah request selesai
  await page.waitForTimeout(extraDelay)
}

/** waitForElement — poll all frames until element appears, with timeout */
async function waitForElement(page: Page, selectorOrId: string, timeoutMs = TIMEOUT): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    for (const frame of page.frames()) {
      const found = await frame.evaluate((sel) => {
        const isSel = sel.includes('[') || sel.includes('.') || sel.includes('#') || sel.includes('>');
        if (!isSel) return !!document.getElementById(sel);
        const els = document.querySelectorAll(sel);
        for (let i = els.length - 1; i >= 0; i--) {
          if ((els[i] as HTMLElement).offsetHeight > 0 || (els[i] as HTMLElement).offsetWidth > 0) return true;
        }
        return els.length > 0;
      }, selectorOrId).catch(() => false)
      if (found) return
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Timeout waiting for element: ${selectorOrId}`)
}

/** debugScreenshot — capture and send current page state as log */
async function debugScreenshot(page: Page, onProgress: ProgressCallback): Promise<void> {
  const buf = await page.screenshot({ fullPage: false })
  onProgress({ type: "screenshot", screenshotBase64: buf.toString("base64"), message: "Debug screenshot" })
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function login(page: Page, creds: Credentials, onProgress: ProgressCallback): Promise<void> {
  // Check if we are already logged in (singleton browser session)
  const currentUrl = page.url()
  if (currentUrl && currentUrl.includes(NEWSPAGE_URL.split("/")[2]) && !currentUrl.includes("Logon.aspx") && !currentUrl.includes("about:blank")) {
    onProgress({ type: "log", message: "Sesi browser masih aktif, melanjutkan tanpa login ulang..." })
    return
  }

  onProgress({ type: "log", message: "Membuka portal Newspage..." })
  await page.goto(NEWSPAGE_URL, { waitUntil: "domcontentloaded" })

  onProgress({ type: "log", message: "Mengisi kredensial..." })
  const finalUsername = creds.username.startsWith("NPSYS") ? creds.username : "NPSYS" + creds.username
  await page.fill("#txtUserid", finalUsername)
  await page.fill("#txtPasswd", creds.password)
  await page.click("#btnLogin")
  await smartWait(page)

  const hasPopup = await page.evaluate(() => !!document.querySelector("#SYS_ASCX_btnContinue")).catch(() => false)
  if (hasPopup) {
    onProgress({ type: "log", message: "Sesi aktif terdeteksi — bypass..." })
    await page.click("#SYS_ASCX_btnContinue")
    await smartWait(page)
  }

  onProgress({ type: "log", message: "Login berhasil." })
}

// ── Logout ────────────────────────────────────────────────────────────────────
async function logout(page: Page, onProgress: ProgressCallback): Promise<void> {
  try {
    await jsClick(page, "btnLogout")
    await smartWait(page)
    onProgress({ type: "log", message: "Logout berhasil." })
  } catch { /* ignore */ }
}

// ═════════════════════════════════════════════════════════════════════════════
// EXTRACT — Auto Compare Mode
// ═════════════════════════════════════════════════════════════════════════════
export async function extractNewspageStock(
  creds: Credentials,
  warehouseCode: string,
  onProgress: ProgressCallback
): Promise<{ rows: ExtractedStockRow[], rawCsv: string }> {
  const { browser, page } = await getOrCreateBrowser(
    creds.username,
    (position) => {
      onProgress({ type: "waiting", message: `⏳ Antrian #${position} — menunggu slot browser tersedia...`, position })
    }
  )

  try {
    await login(page, creds, onProgress)

    // ── Step 2: Hover System Admin page ─────────────
    // Retry sampai 3x — kalau hover ditelan diam-diam, itm_Job tidak akan muncul
    const frameNavId = "[id$='_SysAdminSetup']"
    let hoverOk = false
    
    // Tunggu sampai element-nya beneran muncul di DOM (bisa lama loadnya di VPS)
    onProgress({ type: "log", message: "Menunggu menu SysAdminSetup muncul..." })
    await waitForElement(page, frameNavId, TIMEOUT)
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const frame = await findFrame(page, frameNavId)
        
        // Coba Playwright native hover dulu
        await frame.locator(frameNavId).hover({ force: true, timeout: 5000 }).catch(async (err) => {
          // Fallback ke JS Events kalau native hover ditolak/gagal
          console.warn(`Native hover gagal, mencoba JS events... Error: ${err.message}`)
          await frame.evaluate((sel) => {
            const isSelector = sel.includes('[') || sel.includes('.') || sel.includes('#') || sel.includes('>');
            const el = isSelector ? document.querySelector(sel) : document.getElementById(sel)
            if (el) {
              el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
              el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
            }
          }, frameNavId)
        })
        
        await smartWait(page, attempt * 1000) // 1s → 2s → 3s
        hoverOk = true
        break
      } catch (err: any) {
        onProgress({ type: "log", message: `⚠️ Hover SysAdminSetup attempt ${attempt}/3 gagal: ${err.message}` })
        if (attempt === 3) {
          // Ambil screenshot buat debug
          const ssBuffer = await page.screenshot({ fullPage: false }).catch(() => null)
          if (ssBuffer) onProgress({ type: "screenshot", screenshotBase64: ssBuffer.toString('base64') })
          throw new Error(`Gagal hover SysAdminSetup setelah 3x percobaan`)
        }
        await smartWait(page, 2000)
      }
    }

    // ── Step 3: Find and click Job menu ───────────────────────────────────
    // pag_Sys_Root_tab_Detail_itm_Job muncul di DOM setelah hover SysAdminSetup
    onProgress({ type: "log", message: "Navigasi ke menu Job..." })
    await waitForElement(page, "[id$='_itm_Job']", TIMEOUT)
    onProgress({ type: "log", message: "✓ Job menu ditemukan — klik..." })
    await jsClick(page, "[id$='_itm_Job']")
    await smartWait(page) // Tunggu transisi halaman Job

    // ── Step 4: Add new job ───────────────────────────────────────────────
    onProgress({ type: "log", message: "Membuat job baru..." })
    await waitForElement(page, "pag_FW_SYS_INTF_JOB_btn_Add_Value")
    await jsClick(page, "pag_FW_SYS_INTF_JOB_btn_Add_Value")
    await smartWait(page)

    await waitForElement(page, "pag_FW_SYS_INTF_JOB_RootNew_btn_Next_Value")
    await jsClick(page, "pag_FW_SYS_INTF_JOB_RootNew_btn_Next_Value")
    await smartWait(page)

    // ── Step 4: General configuration ────────────────────────────────────
    onProgress({ type: "log", message: "Konfigurasi: Type=E, Desc, Timeout, ExeType=M..." })
    await waitForElement(page, "pag_FW_SYS_INTF_JOB_NewGeneral_JOB_TYPE_Value")
    await jsSelect(page, "pag_FW_SYS_INTF_JOB_NewGeneral_JOB_TYPE_Value", "E")
    await jsFill(page, "pag_FW_SYS_INTF_JOB_NewGeneral_JOB_DESC_Value", "Inventory Export")
    await jsFill(page, "pag_FW_SYS_INTF_JOB_NewGeneral_JOB_TIMEOUT_Value", "9999999")
    // Tab press must go to the frame that owns the input
    const timeoutFrame = await findFrame(page, "pag_FW_SYS_INTF_JOB_NewGeneral_JOB_TIMEOUT_Value")
    await timeoutFrame.press("#pag_FW_SYS_INTF_JOB_NewGeneral_JOB_TIMEOUT_Value", "Tab")
    await jsSelect(page, "pag_FW_SYS_INTF_JOB_NewGeneral_EXE_TYPE_Value", "M")
    await jsClick(page, "pag_FW_SYS_INTF_JOB_RootNew_btn_Next_Value")
    await smartWait(page)

    // ── Step 5: Disclaimer ────────────────────────────────────────────────
    try {
      await waitForElement(page, "pag_FW_DisclaimerMessage_btn_okay_Value", 8000)
      onProgress({ type: "log", message: "Memeriksa disclaimer popup..." })
      await jsClick(page, "pag_FW_DisclaimerMessage_btn_okay_Value")
      await smartWait(page)
    } catch { /* no disclaimer */ }

    // ── Step 5: Interface search popup ───────────────────────────────────
    onProgress({ type: "log", message: "Membuka pencarian modul ekspor..." })
    await waitForElement(page, "pag_FW_SYS_INTF_JOB_DTL_PopupNew_INTF_ID_SelectButton")
    await jsClick(page, "pag_FW_SYS_INTF_JOB_DTL_PopupNew_INTF_ID_SelectButton")
    await smartWait(page)

    await waitForElement(page, "[id$='_FilterField_Value']", 20000)
    await jsFill(page, "[id$='_FilterField_Value']", "E_20150315090000028")
    await jsClick(page, "[id$='SearchForm_ButtonSearch_Value']")
    await smartWait(page)

    onProgress({ type: "log", message: "Memilih modul E_20150315090000028..." })
    await waitForElement(page, "[id$='_DynCol_INTF_ID_Value']")
    await jsClick(page, "[id$='_DynCol_INTF_ID_Value']")
    await smartWait(page)



    // ── Step 6: File type, separator, warehouse, status ───────────────────
    onProgress({ type: "log", message: "Konfigurasi file type, separator, warehouse, status..." })
    
    // File Type = D
    const fileTypeId = "pag_FW_SYS_INTF_JOB_DTL_PopupNew_FILE_TYPE_Value"
    try {
      await waitForElement(page, fileTypeId)
      const frame = await findFrame(page, fileTypeId)
      const ft = frame.locator(`#${fileTypeId}`)
      const currentFt = await ft.inputValue()
      if (currentFt !== "D") {
        await ft.selectOption("D")
        await smartWait(page, 2000)
      }
    } catch { }
    
    // Separator = 9 (Tab)
    const separatorId = "pag_FW_SYS_INTF_JOB_DTL_PopupNew_FLD_SEPARATOR_STD_Value_0"
    try {
      await waitForElement(page, separatorId, 5000)
      const frame = await findFrame(page, separatorId)
      const sep = frame.locator(`#${separatorId}`)
      const isChecked = await sep.isChecked()
      if (!isChecked) {
        await sep.check()
        await smartWait(page, 1500)
      }
    } catch { }

    // Warehouse = GOOD_WHS
    const wh = "GOOD_WHS"
    const whInputId = "[id$='_ctl02_dyn_Field_txt_Value']"
    try {
      await waitForElement(page, whInputId, 5000)
      const frame = await findFrame(page, whInputId)
      const whLocator = frame.locator(`#${whInputId}`)
      
      const currentWh = await whLocator.inputValue()
      if (currentWh !== wh) {
        await whLocator.fill(wh)
        await whLocator.press("Tab")
        await smartWait(page, 1500)
      }
    } catch { }
    
    // Status = A
    const statusId = "[id$='_ctl07_dyn_Field_drp_Value']"
    try {
      const frame = await findFrame(page, statusId)
      const st = frame.locator(`#${statusId}`)
      
      const currentSt = await st.inputValue()
      if (currentSt !== "A") {
        await st.selectOption("A")
        await smartWait(page, 1500)
      }
    } catch { }

    await jsClick(page, "pag_FW_SYS_INTF_JOB_DTL_PopupNew_btn_Add_Value")
    await smartWait(page)

    // ── Step 7: Save & run ────────────────────────────────────────────────
    onProgress({ type: "log", message: "Menyimpan dan menjalankan job... (server bisa lambat)" })
    await jsClick(page, "pag_FW_SYS_INTF_JOB_RootNew_btn_Save_Value")
    await smartWait(page)

    try {
      await waitForElement(page, "TF_Prompt_btn_Ok_Value", 10000)
      onProgress({ type: "log", message: "Konfirmasi popup OK..." })
      await jsClick(page, "TF_Prompt_btn_Ok_Value")
      await smartWait(page, 1000)
    } catch { /* no popup */ }

    onProgress({ type: "log", message: "Menunggu antrean server (status SUCCESS)..." })
    
    // Gunakan locator untuk menunggu tombol download tidak berstatus 'disabled'
    // Server butuh waktu lama untuk memproses (bisa sampai 5 menit)
    const downloadBtnId = "pag_FW_SYS_INTF_STATUS_JOB_btn_Download_Value"
    await waitForElement(page, downloadBtnId, 300000)
    const dFrame = await findFrame(page, downloadBtnId)
    const downloadLocator = dFrame.locator(`#${downloadBtnId}:not([disabled])`)
    await downloadLocator.waitFor({ state: "attached", timeout: 300000 })

    onProgress({ type: "log", message: "Mendownload hasil ekstraksi..." })
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 300000 }),
      downloadLocator.click(),
    ])

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "newspage-"))
    const zipPath = path.join(tmpDir, "inventory.zip")
    await download.saveAs(zipPath)

    onProgress({ type: "log", message: "Mengekstrak file ZIP hasil download..." })
    const AdmZip = (await import("adm-zip")).default
    const zip = new AdmZip(zipPath)
    const zipEntries = zip.getEntries()
    
    if (zipEntries.length === 0) {
      throw new Error("File ZIP hasil download kosong!")
    }

    const entry = zipEntries.find(e => e.entryName.toLowerCase().endsWith(".csv") || e.entryName.toLowerCase().endsWith(".txt")) || zipEntries[0]
    onProgress({ type: "log", message: `Membaca file dari ZIP: ${entry.entryName}` })
    const raw = entry.getData().toString("utf8")

    onProgress({ type: "log", message: "Parsing data stok..." })
    const rows = parseInventoryCsv(raw)

    onProgress({ type: "log", message: `✓ ${rows.length} produk berhasil diekstrak.` })
    return { rows, rawCsv: raw }
  } catch (error: any) {
    onProgress({ type: "log", message: `Error: ${error.message}` })
    await closeBrowser(creds.username, true)
    throw error
  }
}

function parseInventoryCsv(raw: string): ExtractedStockRow[] {
  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  let separator = ","
  if (lines[0].includes("\t") || (lines.length > 3 && lines[3].includes("\t"))) separator = "\t"
  else if (lines[0].includes("|") || (lines.length > 3 && lines[3].includes("|"))) separator = "|"
  else if (lines[0].includes(";") || (lines.length > 3 && lines[3].includes(";"))) separator = ";"
  
  // Find the actual header row
  let headerIdx = 0
  let header: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase()
    // A real header row should contain combinations of these concepts
    const hasCode = lineLower.includes("product code") || lineLower.includes("sku") || lineLower.includes("item") || lineLower.includes("code")
    const hasName = lineLower.includes("desc") || lineLower.includes("name") || lineLower.includes("product")
    const hasQty = lineLower.includes("stock") || lineLower.includes("qty") || lineLower.includes("available") || lineLower.includes("balance")
    
    // If it has at least 2 of the 3 main columns, it's the header table
    if ((hasCode && hasName) || (hasCode && hasQty) || (hasName && hasQty)) {
      headerIdx = i
      header = lines[i].split(separator).map((h) => h.trim().toLowerCase().replace(/["']/g, ""))
      break
    }
  }

  // If no clear header found, assume it's line 0
  if (header.length === 0) {
    header = lines[0].split(separator).map((h) => h.trim().toLowerCase().replace(/["']/g, ""))
  }
  
  // Find column indexes based on the header (prioritize exact matches)
  let skuIdx = header.findIndex((h) => h === "product code" || h === "product_code")
  if (skuIdx === -1) skuIdx = header.findIndex((h) => h.includes("sku") || h.includes("item"))
  
  let nameIdx = header.findIndex((h) => h === "product description" || h === "product_desc")
  if (nameIdx === -1) nameIdx = header.findIndex((h) => h.includes("desc") || h.includes("product name"))
  
  let qtyIdx = header.findIndex((h) => h === "stock available" || h === "stock_qty")
  if (qtyIdx === -1) qtyIdx = header.findIndex((h) => h.includes("qty") || h === "stock balance" || h === "stock on hand")

  // Parse items starting from the line after the header
  return lines.slice(headerIdx + 1).map((line) => {
    const cols = line.split(separator).map((c) => c.trim())
    return {
      sku: skuIdx >= 0 ? cols[skuIdx] : (cols[0] ?? ""), // Fallback to column 0 for SKU
      productName: nameIdx >= 0 ? cols[nameIdx] : (cols[1] ?? ""), // Fallback to column 1 for Name
      qty: parseInt(qtyIdx >= 0 ? (cols[qtyIdx] || "0") : (cols[2] || "0")) || 0, // Fallback to column 2 for Qty
    }
  }).filter((r) => r.sku && r.sku !== "EOF")
}

// ═════════════════════════════════════════════════════════════════════════════
// EXECUTE — Stock Adjustment Injection
// ═════════════════════════════════════════════════════════════════════════════
export async function executeStockAdjustment(
  creds: Credentials,
  rows: AdjustmentRow[],
  remark: string,
  onProgress: ProgressCallback
): Promise<{ screenshotBase64: string; adjustedCount: number }> {
  const { browser, page } = await getOrCreateBrowser(creds.username)
  let screenshotBase64 = ""
  let adjustedCount = 0

  try {
    await login(page, creds, onProgress)

    onProgress({ type: "log", message: "Membuka menu Stock Adjustment..." })
    await jsClick(page, "pag_InventoryRoot_tab_Main_itm_StkAdj")
    await smartWait(page)

    onProgress({ type: "log", message: "Membuat dokumen Stock Adjustment baru (Add)..." })
    await jsClick(page, "pag_I_StkAdj_btn_Add_Value")
    await smartWait(page)
    
    onProgress({ type: "log", message: "Memilih Warehouse (GOOD_WHS)..." })
    await jsClick(page, "[id$='_ctl03_REF_PARAM_Value']")
    await smartWait(page)
    
    onProgress({ type: "log", message: "Memilih Reason: SA2 - Selisih Barang..." })
    await jsSelect(page, "pag_I_StkAdj_NewGeneral_drp_n_REASON_HDR_Value", "SA2")
    await smartWait(page)

    onProgress({ type: "log", message: `Mengeksekusi ${rows.length} baris selisih...` })

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      onProgress({
        type: "progress",
        sku: row.sku,
        status: "running",
        index: i,
        total: rows.length,
        message: `[${i + 1}/${rows.length}] Input SKU: ${row.sku}`,
      })

      // Tunggu sampai input SKU muncul (buat jaga-jaga kalau server lambat ngerender ulang setelah tombol Add ditekan)
      await waitForElement(page, "pag_I_StkAdj_NewGeneral_sel_PRD_CD_Value", 20000)
      await page.waitForTimeout(300) // Kasih napas dikit sebelum ngetik SKU

      // Input SKU dengan simulasi ketikan asli (pressSequentially) supaya semua event JS di webforms ketrigger
      const frame = await findFrame(page, "pag_I_StkAdj_NewGeneral_sel_PRD_CD_Value")
      const skuInput = frame.locator("#pag_I_StkAdj_NewGeneral_sel_PRD_CD_Value")
      await skuInput.click()
      await skuInput.fill("") // Clear dulu
      await skuInput.pressSequentially(row.sku, { delay: 10 })
      await page.waitForTimeout(100) // Kasih napas setelah ngetik SKU
      
      // Tekan Tab
      await skuInput.press("Tab")
      await smartWait(page, 100) // Tunggu loading postback selesai dengan lebih cepat

      // Cek apakah SKU ditolak oleh Newspage (field jadi kosong lagi)
      // Tambahkan locator baru karena DOM mungkin ter-refresh setelah postback
      const currentSkuVal = await frame.locator("#pag_I_StkAdj_NewGeneral_sel_PRD_CD_Value").inputValue().catch(() => "")
      if (!currentSkuVal || currentSkuVal.trim() === "") {
        throw new Error(`SKU ${row.sku} ditolak oleh sistem (mungkin kode tidak valid atau hilang angka nol di depan).`)
      }

      // Tunggu sampai kolom QTY muncul (karena setelah Tab biasanya ada loading postback buat ngecek SKU)
      await waitForElement(page, "pag_I_StkAdj_NewGeneral_txt_QTY1_Value", 20000)

      // Input QTY (bisa plus atau minus, sesuai nilai 'qty' dari parameter, dikonversi jadi string)
      await jsFill(page, "pag_I_StkAdj_NewGeneral_txt_QTY1_Value", String(row.qty))

      // Input Remark (sesuai nama file tanpa extension)
      if (remark) {
        await jsFill(page, "pag_I_StkAdj_NewGeneral_txt_REMARK_Value", remark.substring(0, 50)).catch(() => {})
      }
      
      // Klik Add Item
      await waitForElement(page, "pag_I_StkAdj_NewGeneral_btn_Add_Value", 20000)
      await jsClick(page, "pag_I_StkAdj_NewGeneral_btn_Add_Value")
      await smartWait(page, 200) // Ekstra wait biar form clear sebelum sku berikutnya

      onProgress({
        type: "progress",
        sku: row.sku,
        status: "done",
        index: i,
        total: rows.length,
        message: `[${i + 1}/${rows.length}] ✓ ${row.sku} — ${row.qty} EA tersimpan`,
      })
      adjustedCount++
    }

    onProgress({ type: "log", message: "Menyimpan seluruh dokumen Stock Adjustment..." })
    await jsClick(page, "pag_I_StkAdj_NewGeneral_btn_Save_Value")
    
    // Server butuh waktu lama buat merespon klik Save kalau datanya ratusan baris
    try {
      onProgress({ type: "log", message: "Menunggu popup konfirmasi Save..." })
      await waitForElement(page, "pag_PopUp_YesNo_btn_Yes_Value", 60000) // Tunggu sampai 60 detik
      await jsClick(page, "pag_PopUp_YesNo_btn_Yes_Value")
      
      onProgress({ type: "log", message: "Menyimpan ke database (bisa agak lama)..." })
      await smartWait(page, 1000)
    } catch (err: any) { 
      onProgress({ type: "log", message: "Popup konfirmasi tidak muncul atau gagal diklik: " + err.message })
    }

    onProgress({ type: "log", message: "Mencari dokumen yang baru dibuat untuk bukti..." })
    
    // Tunggu sampai beneran balik ke halaman List. Kalau nggak balik, berarti Save gagal.
    await waitForElement(page, "pag_I_StkAdj_drp_Status_Value", 60000).catch(() => {
      throw new Error("Gagal kembali ke halaman List setelah Save. Kemungkinan proses Save gagal atau server timeout.")
    })
    
    try {
      // 1. Kosongkan filter status biar aman
      await jsSelect(page, "pag_I_StkAdj_drp_Status_Value", "")
      await smartWait(page, 1000)
      
      // 2. Klik Search
      await jsClick(page, "pag_I_StkAdj_grd_List_SearchForm_ButtonSearch_Value")
      await smartWait(page)

      // 3. Klik header Sort 1x (Ascending)
      await jsClick(page, "[id$='_TXN_NO_SortField']")
      await smartWait(page)

      // 4. Klik header Sort 2x (Descending - dokumen paling baru di atas)
      await jsClick(page, "[id$='_TXN_NO_SortField']")
      await smartWait(page)

      // 5. Buka dokumen paling atas (TXN NO terbaru)
      await jsClick(page, "[id$='_ctl02_grs_TXN_NO_Value']")
      await smartWait(page)
    } catch (e: any) {
      onProgress({ type: "log", message: "Lewati pencarian otomatis karena element tidak ditemukan: " + e.message })
    }

    onProgress({ type: "log", message: "Mengambil screenshot bukti..." })
    const screenshotBuffer = await page.screenshot({ fullPage: false })
    screenshotBase64 = screenshotBuffer.toString("base64")

    onProgress({ type: "screenshot", screenshotBase64, message: "Screenshot bukti berhasil diambil." })

    onProgress({ type: "done", message: "Eksekusi selesai." })
    return { screenshotBase64, adjustedCount }
  } catch (e: any) {
    onProgress({ type: "error", message: e.message || String(e) })
    throw e
  } finally {
    // Selalu tutup browser di akhir proses eksekusi
    await closeBrowser(creds.username)
  }
}
