import { Worker } from 'bullmq'
import { connection, INVENTORY_QUEUE_NAME } from './queue'
import { executeStockAdjustment, closeBrowser, BotProgressEvent } from './newspage-bot'
import { supabaseAdmin } from './supabase'
import { decrypt } from './crypto'

const globalAny: any = globalThis

if (globalAny.inventoryWorker) {
  console.log("Stopping old embedded BullMQ Worker to pick up latest code...")
  globalAny.inventoryWorker.close()
}

console.log("Starting embedded BullMQ Worker inside Next.js...")

globalAny.inventoryWorker = new Worker(
    INVENTORY_QUEUE_NAME,
    async (job) => {
      const { rows, remark, distributorUsername } = job.data
      console.log(`[Job ${job.id}] Started execution for distributor: ${distributorUsername}`)
      const startTime = Date.now();

      try {
        await supabaseAdmin
          .from('jobs')
          .update({ status: 'RUNNING', result_summary: null })
          .eq('job_id', job.id?.toString())

        const { data: distributor, error: distError } = await supabaseAdmin
          .from('distributors')
          .select('username, password_encrypted, name')
          .eq('username', distributorUsername)
          .single()

        if (distError || !distributor) {
          throw new Error(`Distributor ${distributorUsername} not found.`)
        }

        const plainPassword = decrypt(distributor.password_encrypted)

        const onProgress = (event: BotProgressEvent) => {
          if (event.type === "log" || event.type === "error" || event.type === "done") {
            console.log(`[Job ${job.id}] ${event.message}`)
          }
          if (event.type === "progress" && event.index !== undefined && event.total) {
            supabaseAdmin
              .from('jobs')
              .update({ 
                status: 'RUNNING',
                result_summary: `Memproses SKU ${event.index + 1} dari ${event.total} (${event.sku})` 
              })
              .eq('job_id', job.id?.toString())
              .then()
          }
        }

        const { screenshotBase64, adjustedCount } = await executeStockAdjustment(
          { username: distributor.username, password: plainPassword },
          rows,
          remark,
          onProgress
        )

        // Save screenshot to public folder
        if (screenshotBase64) {
          const fs = require('fs')
          const path = require('path')
          const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots')
          fs.mkdirSync(screenshotsDir, { recursive: true }) // Buat folder kalau belum ada
          const screenshotPath = path.join(screenshotsDir, `${job.id}.png`)
          fs.writeFileSync(screenshotPath, Buffer.from(screenshotBase64, 'base64'))
          fs.chmodSync(screenshotPath, 0o644) // Pastikan Nginx bisa baca file

          // Auto-cleanup: Hapus screenshot yang umurnya lebih dari 1 jam (3600000 ms)
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
            console.error('Failed to cleanup old screenshots:', cleanupErr)
          }
        }

        // Gunakan adjustedCount (actual) bukan rows.length (input) untuk akurasi
        const isPartial = adjustedCount < rows.length
        const summaryMsg = isPartial
          ? `⚠️ Partial: ${adjustedCount} dari ${rows.length} baris berhasil disesuaikan.`
          : `Successfully adjusted ${adjustedCount} rows.`

        await supabaseAdmin
          .from('jobs')
          .update({ 
            status: 'COMPLETED',
            result_summary: summaryMsg,
            updated_at: new Date().toISOString()
          })
          .eq('job_id', job.id?.toString())

        console.log(`[Job ${job.id}] Completed successfully.`)

        // Send to Telegram
        if (screenshotBase64) {
          try {
            const diffSecs = Math.floor((Date.now() - startTime) / 1000);
            const mins = Math.floor(diffSecs / 60);
            const secs = diffSecs % 60;
            const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
            
            const distributorDisplay = distributor.name ? `${distributor.name} (${distributorUsername})` : distributorUsername;
            const caption = `Stok Adjustment Report\nDistributor: ${distributorDisplay}\nStatus: ${summaryMsg}\nDuration: ${durationStr}`;

            const formData = new FormData();
            formData.append('chat_id', '8686752536');
            formData.append('caption', caption);
            
            const byteCharacters = atob(screenshotBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });
            
            formData.append('photo', blob, 'screenshot.png');

            const tgResp = await fetch(`https://api.telegram.org/bot8269241555:AAHuPl-a39zJ8u4snDlJGyzQKdMna9dBMto/sendPhoto`, {
              method: 'POST',
              body: formData
            });
            
            if (tgResp.ok) {
              console.log(`[Job ${job.id}] Sent notification to Telegram`);
            } else {
              console.error(`[Job ${job.id}] Telegram API returned ${tgResp.status}`);
            }
          } catch (tgErr: any) {
            console.error(`[Job ${job.id}] Failed to send Telegram message:`, tgErr.message);
          }
        }

        // Kill browser setelah job selesai untuk free RAM di VPS
        await closeBrowser(distributor.username)
        console.log(`[Job ${job.id}] Browser closed.`)

        return { success: true }
      } catch (error: any) {
        console.error(`[Job ${job.id}] Failed:`, error.message)
        // Force close browser saat error — buang session stale agar job berikutnya fresh
        await closeBrowser(distributorUsername, true).catch(() => {})
        await supabaseAdmin
          .from('jobs')
          .update({ 
            status: 'FAILED',
            result_summary: `Error: ${error.message}`
          })
          .eq('job_id', job.id?.toString())
        throw error
      }
    },
    {
      connection,
      concurrency: 1, // Strictly 1 concurrency to avoid browser issues
    }
  )

  globalAny.inventoryWorker.on('failed', (job: any, err: any) => {
    console.error(`[Job ${job?.id}] has failed with ${err.message}`)
  })

export const worker = globalAny.inventoryWorker
