import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const distributorUsername = searchParams.get('username')

    if (!distributorUsername) {
      return NextResponse.json({ error: 'Missing distributor username' }, { status: 400 })
    }

    // Fetch globally applied SKU exceptions (zero padding rules)
    const { data: exceptions, error: err1 } = await supabaseAdmin
      .from('sku_exceptions')
      .select('sku_correct')

    if (err1) throw err1

    // Fetch multiplier rules specific to this distributor
    const { data: multipliers, error: err2 } = await supabaseAdmin
      .from('sku_multipliers')
      .select('sku, multiplier')
      .eq('distributor_username', distributorUsername)

    if (err2) throw err2

    return NextResponse.json({ 
      exceptions: exceptions.map(e => e.sku_correct), 
      multipliers 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
