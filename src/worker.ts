import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { executeStockAdjustment, BotProgressEvent } from './lib/newspage-bot'
import { supabaseAdmin } from './lib/supabase'
import { decrypt } from './lib/crypto'
import dotenv from 'dotenv'

// Load environment variables from .env.local for standalone worker execution
dotenv.config({ path: '.env.local' })

const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
})

console.log("Starting BullMQ Worker for inventory adjustments...")
console.log("Concurrency set to 3. Waiting for jobs...")

const worker = new Worker(
  'inventory-adjustment-queue',
  async (job) => {
    const { rows, remark, distributorUsername } = job.data

    console.log(`[Job ${job.id}] Started execution for distributor: ${distributorUsername}`)

    try {
      // 1. Update status to RUNNING
      await supabaseAdmin
        .from('jobs')
        .update({ status: 'RUNNING', result_summary: null })
        .eq('job_id', job.id?.toString())

      // 2. Fetch distributor credentials
      const { data: distributor, error: distError } = await supabaseAdmin
        .from('distributors')
        .select('username, password_encrypted')
        .eq('username', distributorUsername)
        .single()

      if (distError || !distributor) {
        throw new Error(`Distributor ${distributorUsername} not found or error fetching.`)
      }

      // 3. Decrypt password
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
              result_summary: `Memproses SKU ${event.index + 1} dari ${event.total} (${event.sku})` 
            })
            .eq('job_id', job.id?.toString())
            .then()
        }
      }

      // 5. Execute Bot
      const screenshotBase64 = await executeStockAdjustment(
        { username: distributor.username, password: plainPassword },
        rows,
        remark,
        onProgress
      )

      // 6. Update status to COMPLETED
      await supabaseAdmin
        .from('jobs')
        .update({ 
          status: 'COMPLETED',
          result_summary: `Successfully adjusted ${rows.length} rows.` 
          // In a real scenario, you could save the screenshotBase64 to Supabase Storage
          // and save the URL here.
        })
        .eq('job_id', job.id?.toString())

      console.log(`[Job ${job.id}] Completed successfully.`)
      return { success: true }
    } catch (error: any) {
      console.error(`[Job ${job.id}] Failed:`, error.message)
      
      // Update status to FAILED
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
    concurrency: 1, // Harus 1 agar eksekusi bergiliran dan bisa aman menggunakan 1 browser (Singleton)
  }
)

worker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} failed with reason: ${err.message}`)
})

worker.on('error', err => {
  console.error("Worker error:", err)
})
