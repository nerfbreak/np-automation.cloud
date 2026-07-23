import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      throw error
    }

    const { data: distributors, error: distError } = await supabaseAdmin
      .from('distributors')
      .select('username, name')
      
    if (distError) throw distError
    
    const distMap = new Map(distributors.map(d => [d.username, d.name]))
    
    const mappedJobs = jobs.map(job => ({
      ...job,
      distributor_name: distMap.get(job.distributor_username) || job.distributor_username
    }))

    return NextResponse.json({ jobs: mappedJobs })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
