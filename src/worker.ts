import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { executeStockAdjustment, closeBrowser, BotProgressEvent } from './lib/newspage-bot'
import { supabaseAdmin } from './lib/supabase'
import { decrypt } from './lib/crypto'
import dotenv from 'dotenv'

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
    console.log([Job $job.id] Started execution for distributor: $distributorUsername)
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
        throw new Error(Distributor $distributorUsername not found or error fetching.)
      }

      const plainPassword = decrypt(distributor.password_encrypted)

      const onProgress = (event: BotProgressEvent) => {
        if (event.type === "log" || event.type === "error" || event.type === "done") {
          console.log([Job $job.id] $event.message)
        }
        if (event.type === "progress" && event.index !== undefined && event.total) {
          supabaseAdmin
            .from('jobs')
            .update({ 
              status: 'RUNNING',
              result_summary: Memproses SKU $event.index + 1 dari $event.total ($event.sku) 
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

      if (screenshotBase64) {
        const fs = require('fs')
        const path = require('path')
        const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots')
        fs.mkdirSync(screenshotsDir, { recursive: true })
        const screenshotPath = path.join(screenshotsDir, ${job.id}.png)
        fs.writeFileSync(screenshotPath, Buffer.from(screenshotBase64, 'base64'))
        fs.chmodSync(screenshotPath, 0o644) 

        try {
          const files = fs.readdirSync(screenshotsDir)
          const now = Date.now()
          files.forEach((file: string) => {
            if (file.endsWith('.png')) {
              const filePath = path.join(screenshotsDir, file)
              const stat = fs.statSync(filePath)
              if (now - stat.mtimeMs > 3600000) {
                fs.unlinkSync(filePath)
                console.log(Deleted old screenshot: $file)
              }
            }
          })
        } catch (cleanupErr) {
          console.error("Failed to cleanup old screenshots:", cleanupErr)
        }
      }

      const summaryMsg = screenshotBase64 
        ? Successfully adjusted $adjustedCount rows. [SCREENSHOT_READY] 
        : Successfully adjusted $adjustedCount rows.

      await supabaseAdmin
        .from('jobs')
        .update({ 
          status: 'COMPLETED',
          result_summary: summaryMsg,
          updated_at: new Date().toISOString()
        })
        .eq('job_id', job.id?.toString())

      console.log([Job $job.id] Completed successfully.)

      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
      const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

      if (screenshotBase64 && TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        try {
          const diffSecs = Math.floor((Date.now() - startTime) / 1000);
          const mins = Math.floor(diffSecs / 60);
          const secs = diffSecs % 60;
          const durationStr = mins > 0 ? ${mins}m ${secs}s : ${secs}s;
          
          const distributorDisplay = distributor.name ? ${distributor.name} (${distributorUsername}) : distributorUsername;
          const caption = Stok Adjustment Report\nDistributor: $distributorDisplay\nStatus: $summaryMsg\nDuration: $durationStr;

          const formData = new FormData();
          formData.append('chat_id', TELEGRAM_CHAT_ID);
          formData.append('caption', caption);
          
          const byteCharacters = atob(screenshotBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/png' });
          
          formData.append('photo', blob, 'screenshot.png');

          const tgResp = await fetch(https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto, {
            method: 'POST',
            body: formData
          });
          
          if (tgResp.ok) {
            console.log([Job $job.id] Sent notification to Telegram);
          } else {
            console.error([Job $job.id] Telegram API returned $tgResp.status);
          }
        } catch (tgErr: any) {
          console.error([Job $job.id] Failed to send Telegram message:, tgErr.message);
        }
      }

      await closeBrowser(distributor.username, true).catch(() => {})

      return { success: true }
    } catch (error: any) {
      console.error([Job $job.id] Failed:, error.message)
      
      await closeBrowser(distributorUsername, true).catch(() => {})

      const { data: jobInfo } = await supabaseAdmin
        .from('jobs')
        .select('status')
        .eq('job_id', job.id?.toString())
        .single()

      if (jobInfo && jobInfo.status !== 'FAILED') {
        await supabaseAdmin
          .from('jobs')
          .update({ 
            status: 'FAILED',
            result_summary: Error: $error.message
          })
          .eq('job_id', job.id?.toString())
      }

      throw error
    }
  },
  {
    connection,
    concurrency: 1, 
  }
)

worker.on('failed', (job, err) => {
  console.log(Job $job?.id failed with reason: $err.message)
})

worker.on('error', err => {
  console.error("Worker error:", err)
})
