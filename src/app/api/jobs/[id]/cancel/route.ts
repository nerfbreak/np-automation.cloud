import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const jobId = params.id

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
  }

  try {
    // Force mark the job as FAILED
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
