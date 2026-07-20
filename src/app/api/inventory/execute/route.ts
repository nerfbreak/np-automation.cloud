import { NextRequest, NextResponse } from "next/server"
import { inventoryQueue } from "@/lib/queue"
import { supabaseAdmin } from "@/lib/supabase"
import { logAudit } from "@/lib/audit"
import { AdjustmentRow } from "@/lib/newspage-bot"
// NOTE: Worker runs as a SEPARATE process via `npm run worker`.
// DO NOT import worker-setup here — embedding BullMQ Worker inside Next.js causes
// duplicate job execution on multi-instance deployments and crashes on hot-reload.

export async function POST(req: NextRequest) {
  const { rows, remark, distributorUsername, userId }: { 
    rows: AdjustmentRow[]; 
    remark: string; 
    distributorUsername: string;
    userId: string; 
  } = await req.json()

  if (!rows?.length || !remark || !distributorUsername) {
    return NextResponse.json({ error: "Missing required fields (rows, remark, distributorUsername)" }, { status: 400 })
  }

  try {
    // 1. Enqueue job to BullMQ
    const job = await inventoryQueue.add("adjustment", {
      rows,
      remark,
      distributorUsername,
      userId
    })

    if (!job.id) {
      throw new Error("Failed to get Job ID from BullMQ")
    }

    // 2. Save job to Supabase
    const { error: dbError } = await supabaseAdmin.from('jobs').insert({
      job_id: job.id.toString(),
      user_id: userId || '00000000-0000-0000-0000-000000000000', // Default UUID if not provided yet
      distributor_username: distributorUsername,
      status: 'PENDING',
      result_summary: `Queued ${rows.length} rows for adjustment. Remark: ${remark}`
    })

    if (dbError) {
      console.error("Supabase Error saving Job:", dbError)
      // We don't fail the request, the job is still queued. 
      // But it won't show up in the history tab cleanly.
    }

    // 3. Log Audit
    await logAudit(
      "Execute Template",
      userId || "System User",
      "Inventory Adjustment",
      `Queued ${rows.length} rows for distributor ${distributorUsername}. Remark: ${remark}`
    )

    return NextResponse.json({ 
      success: true, 
      message: "Job berhasil masuk antrian",
      jobId: job.id 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
