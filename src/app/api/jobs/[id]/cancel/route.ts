import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { inventoryQueue } from '@/lib/queue'
import { closeBrowser } from '@/lib/newspage-bot'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
  }

  try {
    // 1. Get job details from Supabase
    const { data: jobInfo, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select('distributor_username, status')
      .eq('job_id', jobId)
      .single()

    if (fetchError || !jobInfo) {
      throw new Error("Job not found in database")
    }

    // 2. Try to remove from BullMQ if it's waiting/delayed
    try {
      const bullJob = await inventoryQueue.getJob(jobId)
      if (bullJob) {
        // We only remove if it's not active, or we can just call remove() and see
        const state = await bullJob.getState()
        if (state === 'waiting' || state === 'delayed') {
          await bullJob.remove()
        }
      }
    } catch (qErr) {
      console.error(`Failed to remove job ${jobId} from queue:`, qErr)
    }

    // 3. If running, force close browser to kill the Playwright process
    if (jobInfo.status === 'RUNNING' && jobInfo.distributor_username) {
      try {
        await closeBrowser(jobInfo.distributor_username, true)
      } catch (e) {
        console.error(`Failed to close browser for ${jobInfo.distributor_username}:`, e)
      }
    }

    // 4. Force mark the job as FAILED
    const { error } = await supabaseAdmin
      .from('jobs')
      .update({
        status: 'FAILED',
        result_summary: 'Dibatalkan oleh user (Force Cancelled)',
        updated_at: new Date().toISOString()
      })
      .eq('job_id', jobId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(`Failed to cancel job ${jobId}:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
