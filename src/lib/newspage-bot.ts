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
        let cssSel = sel;
        if (!sel.includes('[') && !sel.includes('.') && !sel.includes('#') && !sel.includes('>')) {
          cssSel = `[id='${sel}']`;
        }
        const els = document.querySelectorAll(cssSel);
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
    let cssSel = sel;
    if (!sel.includes('[') && !sel.includes('.') && !sel.includes('#') && !sel.includes('>')) {
      cssSel = `[id='${sel}']`;
    }
    let el: Element | null = null;
    const els = document.querySelectorAll(cssSel);
    for (let i = els.length - 1; i >= 0; i--) {
      if ((els[i] as HTMLElement).offsetHeight > 0 || (els[i] as HTMLElement).offsetWidth > 0) { el = els[i]; break; }
    }
    if (!el && els.length > 0) el = els[els.length - 1];
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
    let cssSel = sel;
    if (!sel.includes('[') && !sel.includes('.') && !sel.includes('#') && !sel.includes('>')) {
      cssSel = `[id='${sel}']`;
    }
    let el: HTMLSelectElement | null = null;
    const els = document.querySelectorAll(cssSel);
    for (let i = els.length - 1; i >= 0; i--) {
      if ((els[i] as HTMLElement).offsetHeight > 0 || (els[i] as HTMLElement).offsetWidth > 0) { el = els[i] as HTMLSelectElement; break; }
    }
    if (!el && els.length > 0) el = els[els.length - 1] as HTMLSelectElement;
    if (!el) throw new Error(`${sel} disappeared`)
    el.value = val
    el.dispatchEvent(new Event("change", { bubbles: true }))
  }, { sel: selectorOrId, val: value })
}

/** jsFill — set input value + dispatch events, searches all frames */
async function jsFill(page: Page, selectorOrId: string, value: string): Promise<void> {
  const frame = await findFrame(page, selectorOrId)
  await frame.evaluate(({ sel, val }) => {
    let cssSel = sel;
    if (!sel.includes('[') && !sel.includes('.') && !sel.includes('#') && !sel.includes('>')) {
      cssSel = `[id='${sel}']`;
    }
    let el: HTMLInputElement | null = null;
    const els = document.querySelectorAll(cssSel);
    for (let i = els.length - 1; i >= 0; i--) {
      if ((els[i] as HTMLElement).offsetHeight > 0 || (els[i] as HTMLElement).offsetWidth > 0) { el = els[i] as HTMLInputElement; break; }
    }
    if (!el && els.length > 0) el = els[els.length - 1] as HTMLInputElement;
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
    let cssSel = sel;
    if (!sel.includes('[') && !sel.includes('.') && !sel.includes('#') && !sel.includes('>')) {
      cssSel = `[id='${sel}']`;
    }
    let el: HTMLInputElement | null = null;
    const els = document.querySelectorAll(cssSel);
    for (let i = els.length - 1; i >= 0; i--) {
      if ((els[i] as HTMLElement).offsetHeight > 0 || (els[i] as HTMLElement).offsetWidth > 0) { el = els[i] as HTMLInputElement; break; }
    }
    if (!el && els.length > 0) el = els[els.length - 1] as HTMLInputElement;
    if (!el) throw new Error(`${sel} disappeared`);
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
  // BUG-04 FIX: Use networkidle instead of domcontentloaded.
  // ASP.NET WebForms attaches event listeners AFTER domcontentloaded.
  // Using domcontentloaded causes form fill/submit to fire before JS is ready.
  try {
    // Timeout sering terjadi jika ada polling AJAX terus menerus di background.
    // Kita biarkan time out, lalu biarkan page.fill menunggu field login muncul.
    await page.goto(NEWSPAGE_URL, { waitUntil: "networkidle", timeout: 60000 })
  } catch (err: any) {
    if (err.message.includes("Timeout")) {
      onProgress({ type: "log", message: "Timeout menunggu networkidle, mencoba paksa pengisian form..." })
    } else {
      throw err
    }
  }

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
        onProgress({ type: "log", message: `Hover SysAdminSetup attempt ${attempt}/3 gagal: ${err.message}` })
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

    // ── Step 5: Interface ID — direct fill (BUG-05 FIX) ─────────────────
    // INTF_ID_SelectButton popup was REMOVED from Newspage portal (2026-07-12).
    // The correct approach is to fill INTF_ID_Value directly and press Tab
    // to trigger the ASP.NET AutoPostBack that validates and loads the interface.
    onProgress({ type: "log", message: "Mengisi modul ekspor E_20150315090000028..." })
    const intfIdField = "pag_FW_SYS_INTF_JOB_DTL_PopupNew_INTF_ID_Value"
    await waitForElement(page, intfIdField)
    await jsFill(page, intfIdField, "E_20150315090000028")
    const intfIdFrame = await findFrame(page, intfIdField)
    await intfIdFrame.press(`#${intfIdField}`, "Tab")
    // INTF_ID Tab triggers heavy ASP.NET postback yang render grid DynamicFilter
    // (warehouse, status, dll). Grid bisa butuh 10-20 detik di VPS lambat.
    // POLL sampai grid muncul, bukan fixed wait.
    onProgress({ type: "log", message: "Menunggu grid DynamicFilter muncul setelah INTF_ID postback..." })
    const GRID_POLL_TIMEOUT = 30000 // 30 detik max
    const gridPollStart = Date.now()
    let gridFound = false
    while (Date.now() - gridPollStart < GRID_POLL_TIMEOUT) {
      for (const frame of page.frames()) {
        gridFound = await frame.evaluate(() => {
          // Cek apakah grid DynamicFilter sudah di-render
          const grid = document.querySelector("[id*='grd_DynamicFilter']")
          if (!grid) return false
          // Cek apakah ada input/select di dalam grid (bukan cuma header)
          const inputs = grid.querySelectorAll("input, select")
          return inputs.length > 0
        }).catch(() => false)
        if (gridFound) break
      }
      if (gridFound) break
      await new Promise(r => setTimeout(r, 1000)) // poll setiap 1 detik
    }
    
    if (gridFound) {
      onProgress({ type: "log", message: `Grid DynamicFilter muncul setelah ${Math.round((Date.now() - gridPollStart) / 1000)}s` })
    } else {
      onProgress({ type: "log", message: `WARNING: Grid DynamicFilter belum muncul setelah ${GRID_POLL_TIMEOUT / 1000}s. Coba lanjut...` })
    }
    await smartWait(page, 1000) // Extra settle time setelah grid muncul
    onProgress({ type: "log", message: "Modul ekspor terkonfirmasi." })

    // ── Step 5b: Discover ALL form fields ───────────────────────────────
    // Dump every input/select/textarea across all frames to find warehouse & status.
    // ASP.NET WebForms IDs are unpredictable — we match by label text instead.
    onProgress({ type: "log", message: "Scanning semua form fields di semua frames..." })
    let dynFieldMap: Record<string, { id: string, type: string, label: string, frameIndex: number }> = {}
    const allFrames = page.frames()
    for (let fi = 0; fi < allFrames.length; fi++) {
      const fields = await allFrames[fi].evaluate(() => {
        const result: Array<{ id: string, type: string, label: string }> = []
        // Scan ALL input, select, textarea — not just dyn_Field
        const els = document.querySelectorAll("input, select, textarea")
        for (const el of els) {
          const id = el.id
          if (!id) continue
          // Skip hidden/system fields
          const htmlEl = el as HTMLInputElement
          if (htmlEl.type === "hidden") continue
          const type = el.tagName.toLowerCase() === "select" ? "select" 
                     : el.tagName.toLowerCase() === "textarea" ? "textarea" : "input"
          // Cari label: span/label di parent TR, atau preceding sibling
          let label = ""
          const row = el.closest("tr")
          if (row) {
            const spans = row.querySelectorAll("span, label, td")
            for (const sp of spans) {
              const text = sp.textContent?.trim()
              if (text && text.length > 1 && text.length < 50 
                  && !text.startsWith("pag_") && sp !== el && !sp.contains(el)) {
                label = text
                break
              }
            }
          }
          result.push({ id, type, label })
        }
        return result
      }).catch(() => [])

      for (const f of fields) {
        dynFieldMap[f.id] = { ...f, frameIndex: fi }
      }
    }

    const dynFieldList = Object.values(dynFieldMap)
    // Log all fields for debugging (truncate if too many)
    const fieldsSummary = dynFieldList.map(f => `[F${f.frameIndex}] ${f.label || "?"} → ${f.id} (${f.type})`).join(" | ")
    onProgress({ type: "log", message: `Ditemukan ${dynFieldList.length} form fields: ${fieldsSummary.substring(0, 2000)}` })

    // Debug screenshot setelah INTF_ID postback — lihat state form saat ini
    {
      const ssBuffer = await page.screenshot({ fullPage: false }).catch(() => null)
      if (ssBuffer) onProgress({ type: "screenshot", screenshotBase64: ssBuffer.toString("base64"), message: "Debug: form state setelah INTF_ID postback" })
    }

    // ── Step 6: File type, separator, warehouse, status ───────────────────
    // CRITICAL: Setiap field WAJIB berhasil di-set. Kalau gagal = job jalan
    // tanpa filter → data BAD_WHS ikut tereksport.
    // Setiap field: waitForElement → set value → smartWait → verifikasi value.
    onProgress({ type: "log", message: "Konfigurasi file type, separator, warehouse, status..." })
    
    // File Type = D (Download)
    const fileTypeId = "pag_FW_SYS_INTF_JOB_DTL_PopupNew_FILE_TYPE_Value"
    onProgress({ type: "log", message: "Menunggu field File Type muncul..." })
    await waitForElement(page, fileTypeId, TIMEOUT)
    await smartWait(page, 500) // Biarkan form fully rendered
    {
      const frame = await findFrame(page, fileTypeId)
      const ft = frame.locator(`#${fileTypeId}`)
      const currentFt = await ft.inputValue()
      if (currentFt !== "D") {
        onProgress({ type: "log", message: `File Type saat ini: "${currentFt}" → ubah ke "D"` })
        await ft.selectOption("D")
        await smartWait(page, 2000) // ASP.NET postback setelah change
      }
      // Verifikasi
      const verifyFt = await ft.inputValue()
      if (verifyFt !== "D") {
        throw new Error(`Gagal set File Type ke "D". Masih: "${verifyFt}"`)
      }
      onProgress({ type: "log", message: `File Type = "${verifyFt}" OK` })
    }
    
    // Separator = Tab (radio button index 0)
    const separatorId = "pag_FW_SYS_INTF_JOB_DTL_PopupNew_FLD_SEPARATOR_STD_Value_0"
    onProgress({ type: "log", message: "Menunggu field Separator muncul..." })
    await waitForElement(page, separatorId, TIMEOUT)
    await smartWait(page, 500)
    {
      const frame = await findFrame(page, separatorId)
      const sep = frame.locator(`#${separatorId}`)
      const isChecked = await sep.isChecked()
      if (!isChecked) {
        onProgress({ type: "log", message: "Separator belum Tab — klik radio button..." })
        await sep.check()
        await smartWait(page, 1500)
      }
      // Verifikasi
      const verifySep = await sep.isChecked()
      if (!verifySep) {
        throw new Error("Gagal set Separator ke Tab. Radio button masih unchecked.")
      }
      onProgress({ type: "log", message: "Separator = Tab OK" })
    }

    // ── Re-scan fields setelah File Type + Separator postback ──────────
    // ASP.NET mungkin render field tambahan (warehouse, status) setelah postback
    onProgress({ type: "log", message: "Re-scanning fields setelah File Type + Separator..." })
    dynFieldMap = {}
    const allFrames2 = page.frames()
    for (let fi = 0; fi < allFrames2.length; fi++) {
      const fields = await allFrames2[fi].evaluate(() => {
        const result: Array<{ id: string, type: string, label: string, tagName: string }> = []
        const els = document.querySelectorAll("input, select, textarea")
        for (const el of els) {
          const id = el.id
          if (!id) continue
          const htmlEl = el as HTMLInputElement
          if (htmlEl.type === "hidden") continue
          const type = el.tagName.toLowerCase() === "select" ? "select" 
                     : el.tagName.toLowerCase() === "textarea" ? "textarea" : "input"
          let label = ""
          const row = el.closest("tr")
          if (row) {
            const spans = row.querySelectorAll("span, label, td")
            for (const sp of spans) {
              const text = sp.textContent?.trim()
              if (text && text.length > 1 && text.length < 50 
                  && !text.startsWith("pag_") && sp !== el && !sp.contains(el)) {
                label = text
                break
              }
            }
          }
          result.push({ id, type, label, tagName: el.tagName })
        }
        return result
      }).catch(() => [])
      for (const f of fields) {
        dynFieldMap[f.id] = { ...f, frameIndex: fi }
      }
    }
    const dynFieldList2 = Object.values(dynFieldMap)
    const newFields = dynFieldList2.filter(f => !dynFieldList.find(d => d.id === f.id))
    onProgress({ type: "log", message: `Re-scan: ${dynFieldList2.length} total fields. ${newFields.length} BARU: ${newFields.map(f => `[F${f.frameIndex}] ${f.label || "?"} → ${f.id} (${f.type})`).join(" | ") || "(none)"}` })
    
    // Screenshot untuk lihat state setelah File Type + Separator
    {
      const ssBuffer = await page.screenshot({ fullPage: false }).catch(() => null)
      if (ssBuffer) onProgress({ type: "screenshot", screenshotBase64: ssBuffer.toString("base64"), message: "Debug: form setelah File Type + Separator" })
    }

    // ── Cari warehouse & status dari grid DynamicFilter ──────────────
    // Field warehouse ada di grid: grd_DynamicFilter, row ctl02
    // Exact ID: pag_FW_SYS_INTF_JOB_DTL_PopupNew_grd_DynamicFilter_ctl02_dyn_Field_txt_Value
    const allDiscovered = dynFieldList2

    // Warehouse = warehouseCode (dari parameter, default GOOD_WHS)
    const wh = warehouseCode || "GOOD_WHS"
    const WAREHOUSE_EXACT_ID = "pag_FW_SYS_INTF_JOB_DTL_PopupNew_grd_DynamicFilter_ctl02_dyn_Field_txt_Value"
    
    let whFieldId: string | null = null
    // Check exact ID exists in any frame
    for (const frame of page.frames()) {
      const found = await frame.evaluate((id) => !!document.getElementById(id), WAREHOUSE_EXACT_ID).catch(() => false)
      if (found) { whFieldId = WAREHOUSE_EXACT_ID; break }
    }
    
    if (whFieldId) {
      onProgress({ type: "log", message: `Warehouse field via exact ID: ${whFieldId}` })
    } else {
      // Fallback: scan grid rows for dyn_Field_txt
      onProgress({ type: "log", message: "Exact warehouse ID gak ada, scan grid DynamicFilter..." })
      for (const frame of page.frames()) {
        const gridFields = await frame.evaluate(() => {
          const r: string[] = []
          document.querySelectorAll("[id*='grd_DynamicFilter'][id*='dyn_Field_txt']").forEach(el => { if (el.id) r.push(el.id) })
          return r
        }).catch(() => [])
        if (gridFields.length > 0) {
          whFieldId = gridFields[0]
          onProgress({ type: "log", message: `Warehouse via grid scan: ${whFieldId} (${gridFields.length} candidates)` })
          break
        }
      }
    }

    if (!whFieldId) {
      const ssBuffer = await page.screenshot({ fullPage: false }).catch(() => null)
      if (ssBuffer) onProgress({ type: "screenshot", screenshotBase64: ssBuffer.toString("base64"), message: "Screenshot: warehouse not found" })
      onProgress({ type: "log", message: `KRITIS: Warehouse field TIDAK ditemukan. IDs: ${allDiscovered.map(f => f.id).join(", ")}` })
      throw new Error("Warehouse field tidak ditemukan. Job dibatalkan.")
    }

    onProgress({ type: "log", message: `Mengisi warehouse "${wh}" ke ${whFieldId}...` })
    await waitForElement(page, whFieldId, TIMEOUT)
    await smartWait(page, 500)
    {
      const frame = await findFrame(page, whFieldId!)
      const whEl = frame.locator(`#${whFieldId}`)
      const currentWh = await whEl.inputValue()
      onProgress({ type: "log", message: `Warehouse: "${currentWh}" → "${wh}"` })
      if (currentWh !== wh) {
        await whEl.fill(wh)
        await whEl.press("Tab")
        await smartWait(page, 2000)
      }
      const verifyWh = await whEl.inputValue()
      if (verifyWh !== wh) {
        const ssBuffer = await page.screenshot({ fullPage: false }).catch(() => null)
        if (ssBuffer) onProgress({ type: "screenshot", screenshotBase64: ssBuffer.toString("base64"), message: "Screenshot gagal set warehouse" })
        throw new Error(`KRITIS: Warehouse masih "${verifyWh}", bukan "${wh}". Job dibatalkan.`)
      }
      onProgress({ type: "log", message: `Warehouse = "${verifyWh}" OK` })
    }
    
    // Status = A (Active) — grid row ctl07
    const STATUS_EXACT_ID = "pag_FW_SYS_INTF_JOB_DTL_PopupNew_grd_DynamicFilter_ctl07_dyn_Field_drp_Value"
    
    let stFieldId: string | null = null
    for (const frame of page.frames()) {
      const found = await frame.evaluate((id) => !!document.getElementById(id), STATUS_EXACT_ID).catch(() => false)
      if (found) { stFieldId = STATUS_EXACT_ID; break }
    }
    
    if (!stFieldId) {
      for (const frame of page.frames()) {
        const gridSelects = await frame.evaluate(() => {
          const r: string[] = []
          document.querySelectorAll("[id*='grd_DynamicFilter'][id*='dyn_Field_drp']").forEach(el => { if (el.id) r.push(el.id) })
          return r
        }).catch(() => [])
        if (gridSelects.length > 0) {
          stFieldId = gridSelects[0]
          onProgress({ type: "log", message: `Status via grid scan: ${stFieldId}` })
          break
        }
      }
    }

    if (!stFieldId) {
      onProgress({ type: "log", message: `WARNING: Status field gak ada di grid. SKIP status filter.` })
    } else {
      onProgress({ type: "log", message: `Status field: ${stFieldId}` })
      await waitForElement(page, stFieldId, TIMEOUT)
      await smartWait(page, 500)
      const frame = await findFrame(page, stFieldId)
      const st = frame.locator(`#${stFieldId}`).first()
      const currentSt = await st.inputValue()
      onProgress({ type: "log", message: `Status: "${currentSt}" → "A"` })
      if (currentSt !== "A") {
        await st.selectOption("A")
        await smartWait(page, 1500)
      }
      const verifySt = await st.inputValue()
      if (verifySt !== "A") {
        onProgress({ type: "log", message: `WARNING: Status masih "${verifySt}".` })
      } else {
        onProgress({ type: "log", message: `Status = "${verifySt}" OK` })
      }
    }

    onProgress({ type: "log", message: "Semua field terkonfigurasi. Klik Add..." })
    await waitForElement(page, "pag_FW_SYS_INTF_JOB_DTL_PopupNew_btn_Add_Value", TIMEOUT)
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
  } finally {
    // Selalu tutup browser / turunkan refCount jika berhasil
    await closeBrowser(creds.username)
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

      const frame = await findFrame(page, "pag_I_StkAdj_NewGeneral_sel_PRD_CD_Value")

      // Cek dan handle popup peringatan (seperti peringatan item inactive) yang mungkin muncul dari baris sebelumnya
      const isPopupVisible = await frame.evaluate(() => {
        const bg = document.querySelector(".Popup_Background");
        return bg && (bg as HTMLElement).offsetHeight > 0;
      }).catch(() => false);

      if (isPopupVisible) {
        onProgress({ type: "log", message: "Popup peringatan terdeteksi, mengonfirmasi (Yes)..." })
        await frame.evaluate(() => {
          const yesBtns = document.querySelectorAll("[id$='pag_PopUp_YesNo_btn_Yes_Value']");
          for (let i = 0; i < yesBtns.length; i++) {
            if ((yesBtns[i] as HTMLElement).offsetHeight > 0) {
              (yesBtns[i] as HTMLElement).click();
              return;
            }
          }
        }).catch(() => {});
        await smartWait(page);
      }

      // Input SKU dengan simulasi ketikan asli (pressSequentially) supaya semua event JS di webforms ketrigger
      const skuInput = frame.locator("#pag_I_StkAdj_NewGeneral_sel_PRD_CD_Value")
      await skuInput.click({ force: true }) // Gunakan force agar tidak tertahan kalau ada sisa overlay animasi
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
