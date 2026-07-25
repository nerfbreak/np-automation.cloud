import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { executeStockAdjustment, closeBrowser, BotProgressEvent } from './lib/newspage-bot'
import { supabaseAdmin } from './lib/supabase'
import { decrypt } from './lib/crypto'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables from .env.local for standalone worker execution
dotenv.config({ path: '.env.local' })

const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
})

console.log("Starting BullMQ Worker for inventory adjustments...")
console.log("Concurrency set to 1. Waiting for jobs...")

const worker = new Worker(
  'inventory-adjustment-queue',
  async (job) => {
    const { rows, remark, distributorUsername } = job.data
    const startTime = Date.now()
    let distributorName = ""

    console.log(`[Job ${job.id}] Started execution for distributor: ${distributorUsername}`)

    try {
      // 1. Update status to RUNNING
      await supabaseAdmin
        .from('jobs')
        .update({ status: 'RUNNING', result_summary: null, updated_at: new Date().toISOString() })
        .eq('job_id', job.id?.toString())

      // 2. Fetch distributor credentials
      const { data: distributor, error: distError } = await supabaseAdmin
        .from('distributors')
        .select('username, password_encrypted, name')
        .eq('username', distributorUsername)
        .single()

      if (distError || !distributor) {
        throw new Error(`Distributor ${distributorUsername} not found or error fetching.`)
      }

      // 3. Decrypt password
      if (distributor.name) { distributorName = distributor.name }
      const plainPassword = decrypt(distributor.password_encrypted)

      // 4. Progress callback
      const onProgress = (event: BotProgressEvent) => {
        if (event.type === "log" || event.type === "error" || event.type === "done") {
          console.log(`[Job ${job.id}] ${event.message}`)
        }
        if (event.type === "progress" && event.index !== undefined && event.total) {
          supabaseAdmin
            .from('jobs')
            .update({ 
              status: 'RUNNING',
              result_summary: `Memproses SKU ${event.index + 1} dari ${event.total} (${event.sku})`,
              updated_at: new Date().toISOString() 
            })
            .eq('job_id', job.id?.toString())
            .then()
        }
      }

      // 5. Execute Bot
      const { screenshotBase64, adjustedCount, failedSkus } = await executeStockAdjustment(
        { username: distributor.username, password: plainPassword },
        rows,
        remark,
        onProgress
      )

      // Save screenshot file to disk
      if (screenshotBase64) {
        try {
          const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots')
          fs.mkdirSync(screenshotsDir, { recursive: true })
          const screenshotPath = path.join(screenshotsDir, `${job.id}.png`)
          fs.writeFileSync(screenshotPath, Buffer.from(screenshotBase64, 'base64'))
          try {
            fs.chmodSync(screenshotPath, 0o644)
          } catch (chmodErr) {
            console.error(`[Job ${job.id}] Failed to chmod screenshot:`, chmodErr)
          }

          // Cleanup screenshots older than 1 hour
          try {
            const files = fs.readdirSync(screenshotsDir)
            const now = Date.now()
            files.forEach((file: string) => {
              if (file.endsWith('.png')) {
                const filePath = path.join(screenshotsDir, file)
                const stat = fs.statSync(filePath)
                if (now - stat.mtimeMs > 3600000) {
                  fs.unlinkSync(filePath)
                  console.log(`Deleted old screenshot: ${file}`)
                }
              }
            })
          } catch (cleanupErr) {
            console.error(`[Job ${job.id}] Failed to cleanup old screenshots:`, cleanupErr)
          }
        } catch (fsErr) {
          console.error(`[Job ${job.id}] Failed to save screenshot to disk:`, fsErr)
        }
      }

      // Kill browser setelah job selesai untuk free RAM di VPS
      await closeBrowser(distributor.username, true).catch(() => {})

      const isPartial = failedSkus && failedSkus.length > 0
      const failedListStr = isPartial ? failedSkus.map(item => item.sku).join(', ') : ''
      const summaryMsgBase = isPartial
        ? `⚠️ Partial: ${adjustedCount} dari ${rows.length} SKU berhasil. Gagal ${failedSkus.length} SKU (${failedListStr}).`
        : `Successfully adjusted all ${adjustedCount} rows.`


      const summaryMsg = screenshotBase64 
        ? `${summaryMsgBase} [SCREENSHOT_READY]` 
        : summaryMsgBase

      // 6. Update status to COMPLETED
      await supabaseAdmin
        .from('jobs')
        .update({ 
          status: 'COMPLETED',
          result_summary: summaryMsg,
          updated_at: new Date().toISOString() 
          // In a real scenario, you could save the screenshotBase64 to Supabase Storage
          // and save the URL here.
        })
        .eq('job_id', job.id?.toString())

      // Telegram notification
      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
      const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        try {
          const diffSecs = Math.floor((Date.now() - startTime) / 1000)
          const mins = Math.floor(diffSecs / 60)
          const secs = diffSecs % 60
          const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

          const distributorDisplay = distributorName
            ? `${distributorName} (${distributorUsername})`
            : distributorUsername
          const caption = `✅ Stok Adjustment Report\nDistributor: ${distributorDisplay}\nStatus: ${summaryMsg}\nDuration: ${durationStr}`

          if (screenshotBase64) {
            const formData = new FormData()
            formData.append('chat_id', TELEGRAM_CHAT_ID)
            formData.append('caption', caption)

            const byteCharacters = atob(screenshotBase64)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: 'image/png' })

            formData.append('photo', blob, 'screenshot.png')
            formData.append('reply_markup', JSON.stringify({
              inline_keyboard: [
                [
                  { text: "🔨 Build & Fix Web", callback_data: "build_web" },
                  { text: "⏳ Restart Web", callback_data: "restart_web" }
                ],
                [
                  { text: "📊 Status", callback_data: "pm2_status" },
                  { text: "📋 Web Logs", callback_data: "web_logs" }
                ]
              ]
            }))

            const tgResp = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
              method: 'POST',
              body: formData
            })

            if (tgResp.ok) {
              console.log(`[Job ${job.id}] Sent photo notification to Telegram`)
            } else {
              console.error(`[Job ${job.id}] Telegram API returned status ${tgResp.status}`)
            }
          } else {
            // No screenshot, send simple text message
            const tgResp = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: caption,
                reply_markup: {
                  inline_keyboard: [
                    [
                      { text: "🔨 Build & Fix Web", callback_data: "build_web" },
                      { text: "⏳ Restart Web", callback_data: "restart_web" }
                    ],
                    [
                      { text: "📊 Status", callback_data: "pm2_status" },
                      { text: "📋 Web Logs", callback_data: "web_logs" }
                    ]
                  ]
                }
              }),
            })
            if (tgResp.ok) {
              console.log(`[Job ${job.id}] Sent text notification to Telegram`)
            } else {
              console.error(`[Job ${job.id}] Telegram API returned status ${tgResp.status}`)
            }
          }
        } catch (tgErr: any) {
          console.error(`[Job ${job.id}] Failed to send Telegram message:`, tgErr.message)
        }
      }

      console.log(`[Job ${job.id}] Completed successfully.`)
      return { success: true }
    } catch (error: any) {
      console.error(`[Job ${job.id}] Failed:`, error.message)
      
      // Force close browser saat error — buang session stale agar job berikutnya fresh
      await closeBrowser(distributorUsername, true).catch(() => {})

      // Update status to FAILED
      await supabaseAdmin
        .from('jobs')
        .update({ 
          status: 'FAILED',
          result_summary: `Error: ${error.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('job_id', job.id?.toString())

      // Send failure notification to Telegram
      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
      const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        try {
          const diffSecs = Math.floor((Date.now() - startTime) / 1000)
          const mins = Math.floor(diffSecs / 60)
          const secs = diffSecs % 60
          const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

          const distributorDisplay = distributorName
            ? `${distributorName} (${distributorUsername})`
            : distributorUsername
          const caption = `❌ Stok Adjustment FAILED\nDistributor: ${distributorDisplay}\nError: ${error.message}\nDuration: ${durationStr}`

          const tgResp = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: TELEGRAM_CHAT_ID,
              text: caption,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "🔨 Build & Fix Web", callback_data: "build_web" },
                    { text: "⏳ Restart Web", callback_data: "restart_web" }
                  ],
                  [
                    { text: "📊 Status", callback_data: "pm2_status" },
                    { text: "📋 Web Logs", callback_data: "web_logs" }
                  ]
                ]
              }
            }),
          })
          if (tgResp.ok) {
            console.log(`[Job ${job.id}] Sent failure notification to Telegram`)
          } else {
            console.error(`[Job ${job.id}] Telegram API returned status ${tgResp.status}`)
          }
        } catch (tgErr: any) {
          console.error(`[Job ${job.id}] Failed to send Telegram failure message:`, tgErr.message)
        }
      }

      throw error
    }
  },
  {
    connection,
    concurrency: 1, // Harus 1 agar eksekusi bergiliran dan bisa aman menggunakan 1 browser (Singleton)
  }
)

worker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} failed with reason: ${err.message}`)
})

worker.on('error', err => {
  console.error("Worker error:", err)
})


import { exec, spawn } from 'child_process'

async function handleTelegramUpdate(update: any) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return

  console.log(`[TelegramBot] Received update:`, JSON.stringify(update))
  console.log(`[TelegramBot] Configured ChatID: "${TELEGRAM_CHAT_ID}"`)

  const chatId = update.message?.chat?.id?.toString() || update.callback_query?.message?.chat?.id?.toString()
  const fromId = update.message?.from?.id?.toString() || update.callback_query?.from?.id?.toString()

  console.log(`[TelegramBot] Detected chatId: "${chatId}", fromId: "${fromId}"`)

  if (chatId !== TELEGRAM_CHAT_ID && fromId !== TELEGRAM_CHAT_ID) {
    console.log(`[TelegramBot] Unauthorized message/callback from chat:${chatId}, user:${fromId}`);
    return
  }

  if (update.callback_query) {
    const cq = update.callback_query
    const data = cq.data
    const cbQueryId = cq.id

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: cbQueryId }),
      signal: AbortSignal.timeout(5000)
    }).catch(() => {})

    if (data === "restart_web") {
      console.log("[TelegramBot] Restart Web triggered via button")
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, "⏳ Menjalankan `pm2 restart np-web` di VPS...")
      exec("pm2 restart np-web", (err, stdout, stderr) => {
        if (err) {
          sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, `❌ Gagal restart: ${err.message}`)
        } else {
          sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, `✅ Berhasil restart 'np-web'!\n${stdout || stderr}`)
        }
      })
    } else if (data === "pm2_status") {
      console.log("[TelegramBot] PM2 Status triggered via button")
      exec("pm2 status", (err, stdout, stderr) => {
        const output = stdout || stderr || "No output"
        const cleanOutput = output.substring(0, 3000)
        sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, `📊 **PM2 Status:**\n\`\`\`\n${cleanOutput}\n\`\`\``)
      })
    } else if (data === "web_logs") {
      console.log("[TelegramBot] Web Logs triggered via button")
      exec("tail -n 25 /home/rizki/logs/web-error.log", (err, stdout, stderr) => {
        const output = stdout || stderr || "No logs found or error"
        const cleanOutput = output.substring(0, 3000) || "Empty log file"
        sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, `📋 **Web Error Logs (Last 25 lines):**\n\`\`\`\n${cleanOutput}\n\`\`\``)
      })
    } else if (data === "build_web") {
      console.log("[TelegramBot] Build Web triggered via button")
      executeBuildPipeline(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)
    } else if (data === "ai_autofix") {
      console.log("[TelegramBot] AI Auto-Fix triggered via button")
      if (!lastBuildError) {
        await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, "❌ **Tidak ada cache error log terakhir.** Silakan jalankan `/build` terlebih dahulu.")
        return
      }

      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, `🔮 **Menghubungi AI (OmniRoute)...**\nMenganalisis error di file \`${path.basename(lastBuildError.filePath)}\`...`)
      
      const fileToFix = lastBuildError.filePath
      const oldCode = lastBuildError.fileContent
      const compilerError = lastBuildError.errorMsg

      const payload = {
        model: "auto",
        messages: [
          {
            role: "system",
            content: "You are a professional Next.js & TypeScript compiler fixer. Your task is to fix the compiler query errors in the provided source file. You must return ONLY the complete corrected TSX/TS code. Do NOT wrap your output in conversational markdown, explanation, or notes. Do NOT include markdown code blocks like ```typescript or ``` unless for the code output, but it is preferred to output raw file content directly."
          },
          {
            role: "user",
            content: `Source File Path: ${fileToFix}\n\nCompiler Error Log:\n${compilerError}\n\nOriginal Code:\n\`\`\`typescript\n${oldCode}\n\`\`\``
          }
        ],
        temperature: 0.1
      }

      try {
        const aiResp = await fetch("http://localhost:20128/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(180000)
        })

        if (!aiResp.ok) {
          throw new Error(`OmniRoute returned status ${aiResp.status}`)
        }

        const dataJson: any = await aiResp.json()
        let resultText = dataJson.choices?.[0]?.message?.content
        if (!resultText) {
          throw new Error("Empty completion result from OmniRoute.")
        }

        // Bersihkan Markdown block ```typescript .... ``` jika disisipkan oleh model LLM
        if (resultText.includes("```")) {
          // Cari block pembuka
          const openMatch = resultText.match(/```[a-zA-Z0-9]*\r?\n/)
          if (openMatch) {
            const startIdx = resultText.indexOf(openMatch[0]) + openMatch[0].length
            const endIdx = resultText.lastIndexOf("```")
            if (endIdx > startIdx) {
              resultText = resultText.substring(startIdx, endIdx).trim()
            }
          } else {
            // Hapus semua strip backticks
            resultText = resultText.replace(/```/g, "").trim()
          }
        }

        // Tulis kembali file yang diperbaiki
        fs.writeFileSync(fileToFix, resultText, "utf-8")
        
        await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, `🔧 **AI berhasil menulis perbaikan ke \`${path.basename(fileToFix)}\`!**\nMenjalankan build ulang otomatis untuk memverifikasi...`)
        
        // Picu build ulang
        executeBuildPipeline(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)

      } catch (err: any) {
        console.error("AI Auto-Fix error:", err)
        await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, `❌ **AI Auto-Fix Gagal:**\n${err.message}`)
      }
    }
  }

  if (update.message?.text) {
    const text = update.message.text.trim().toLowerCase()
    
    if (text.startsWith("/restart") || text === "restart" || text === "fix" || text.includes("502")) {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, "⏳ Menjalankan `pm2 restart np-web` di VPS...")
      exec("pm2 restart np-web", (err, stdout, stderr) => {
        if (err) {
          sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, `❌ Gagal restart: ${err.message}`)
        } else {
          sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, `✅ Berhasil restart 'np-web'!\n${stdout || stderr}`)
        }
      })
    } else if (text.startsWith("/status") || text === "status" || text === "pm2") {
      exec("pm2 status", (err, stdout, stderr) => {
        const output = stdout || stderr || "No output"
        const cleanOutput = output.substring(0, 3000)
        sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, `📊 **PM2 Status:**\n\`\`\`\n${cleanOutput}\n\`\`\``)
      })
    } else if (text.startsWith("/logs") || text === "logs" || text.includes("error") || text.includes("log")) {
      exec("tail -n 25 /home/rizki/logs/web-error.log", (err, stdout, stderr) => {
        const output = stdout || stderr || "No logs found or error"
        const cleanOutput = output.substring(0, 3000) || "Empty log file"
        sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, `📋 **Web Error Logs (Last 25 lines):**\n\`\`\`\n${cleanOutput}\n\`\`\``)
      })
    } else if (text.startsWith("/build") || text === "build") {
      executeBuildPipeline(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)
    } else if (text.startsWith("/help") || text === "help") {
      const helpMsg = `🤖 **NP Automation Admin Bot**\nKirim perintah berikut untuk mengoperasikan VPS:\n- /restart atau tulis "restart": Restart web server\n- /status atau tulis "pm2": Cek status PM2\n- /logs atau tulis "logs": Tampilkan log error terkini web server\n- /build atau tulis "build": Build & fix NextJS (Fix 502 build error)\n- /help: Tampilkan menu bantuan ini`
      sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, helpMsg)
    }
  }
}

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown"
    }),
    signal: AbortSignal.timeout(5000)
  }).catch(err => console.error("Failed to send message:", err))
}

let lastUpdateId = 0
async function startTelegramPoller() {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("[TelegramBot] Poller skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured.")
    return
  }
  
  console.log("[TelegramBot] Starting long poller for admin commands...")
  
  // Skip old updates by getting the latest update first
  try {
    const initResp = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=-1&limit=1`)
    if (initResp.ok) {
      const initData = await initResp.json()
      if (initData.ok && initData.result && initData.result.length > 0) {
        lastUpdateId = initData.result[0].update_id
        console.log(`[TelegramBot] Initialized lastUpdateId to ${lastUpdateId} (skipping old updates)`);
      }
    }
  } catch (initErr) {
    console.error("[TelegramBot] Failed to skip old updates:", initErr)
  }

  // Send startup message to confirm bot is running and variables are correct
  await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, "🤖 **NP Automation Admin Bot Aktif!**\nKirim /help atau ketik `pm2` untuk melihat daftar status.")
  
  while (true) {
    try {
      const resp = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`, {
        signal: AbortSignal.timeout(35000)
      })
      if (!resp.ok) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        continue
      }
      const data = await resp.json()
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          lastUpdateId = Math.max(lastUpdateId, update.update_id)
          await handleTelegramUpdate(update)
        }
      }
    } catch (err: any) {
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
}

startTelegramPoller()

let lastBuildError: { filePath: string; fileContent: string; errorMsg: string } | null = null;


async function executeBuildPipeline(token: string, chatId: string) {
  await sendTelegramMessage(token, chatId, "🔨 **Mulai Proses Build di VPS...**\n`1/2: Menghapus cache & compiler build lama...`")
  
  // spawn agar luwes membaca output stdout/stderr per line secara live
  const child = spawn("npm", ["run", "build"], {
    cwd: "/home/rizki/np-automation",
    shell: true,
    env: { ...process.env, NODE_ENV: "production" }
  })

  let outputLog = ""

  child.stdout.on("data", (data) => {
    const chunk = data.toString()
    console.log("[Build Stdout]", chunk)
    outputLog += chunk
  })

  child.stderr.on("data", (data) => {
    const chunk = data.toString()
    console.error("[Build Stderr]", chunk)
    outputLog += chunk
  })

  child.on("close", (code) => {
    console.log(`[Build Closed] Exit code: ${code}`)
    if (code === 0) {
      // Clear error on success
      lastBuildError = null
      sendTelegramMessage(token, chatId, `✅ **Build NextJS Berhasil!**\n\`2/2: Merestart service web...\``)
      exec("pm2 restart np-web", (pm2Err, pm2Out, pm2Stderr) => {
        if (pm2Err) {
          sendTelegramMessage(token, chatId, `❌ **Gagal Restart:**\n${pm2Err.message}`)
        } else {
          sendTelegramMessage(token, chatId, `🎉 **Selesai!** Website np-automation.cloud kini sudah aktif & bebas dari 502 Bad Gateway.`)
        }
      })
    } else {
      // Deteksi letak file error via regex
      // Contoh: /home/rizki/np-automation/src/worker.ts:22:21 atau src/components/Badge.tsx
      const errorSample = outputLog.substring(outputLog.length - 2000) || "No error log detail"
      
      let detectedPath: string | null = null
      // Regex mencari path file yang bermasalah di folder src/
      const match = outputLog.match(/(?:\/home\/rizki\/np-automation\/)?(src\/[a-zA-Z0-9_\-\/]+\.[tjs]sx?)/)
      if (match && match[1]) {
        detectedPath = match[1].startsWith("/") ? match[1] : `/home/rizki/np-automation/${match[1]}`
      }

      if (detectedPath && fs.existsSync(detectedPath)) {
        try {
          const rawContent = fs.readFileSync(detectedPath, "utf-8")
          lastBuildError = {
            filePath: detectedPath,
            fileContent: rawContent,
            errorMsg: outputLog
          }

          // Kirim pesan failure dengan opsi Auto-Fix
          fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `❌ **Build NextJS Gagal (Exit Code ${code})**\n\nTerdeteksi error di file: \`${path.basename(detectedPath)}\`\n\`\`\`\n${errorSample}\n\`\`\``,
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "🔮 AI Auto-Fix (OmniRoute)", callback_data: "ai_autofix" }
                  ],
                  [
                    { text: "🔄 Restart Web", callback_data: "restart_web" },
                    { text: "📊 Status", callback_data: "pm2_status" },
                    { text: "📋 Web Logs", callback_data: "web_logs" }
                  ]
                ]
              }
            })
          }).catch(err => console.error("Failed to send fail message:", err))
          return
        } catch (readErr: any) {
          console.error("Failed to read error file for caching:", readErr)
        }
      }

      // Jika file bermasalah tidak terdeteksi, kirim pesan default
      sendTelegramMessage(token, chatId, `❌ **Build NextJS Gagal (Exit Code ${code})**\nLog error terakhir:\n\`\`\`\n${errorSample}\n\`\`\``)
    }
  })

  child.on("error", (err) => {
    console.error("[Build process error]", err)
    sendTelegramMessage(token, chatId, `❌ **Proses Build Error:**\n${err.message}`)
  })
}
