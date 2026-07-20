import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("sku_multipliers")
      .select(`
        id, 
        sku, 
        multiplier, 
        distributor_username,
        created_at,
        distributors!inner (name)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error
    
    // Map response to flatten the distributor name
    const formattedData = data.map((d: any) => ({
      ...d,
      distributor_name: d.distributors?.name
    }))
    
    return NextResponse.json({ data: formattedData })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { distributor_username, sku, multiplier } = body

    if (!distributor_username || !sku || !multiplier) {
      return NextResponse.json({ error: "distributor_username, sku, and multiplier are required" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("sku_multipliers")
      .upsert({ distributor_username, sku, multiplier }, { onConflict: 'distributor_username,sku' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("sku_multipliers")
      .delete()
      .eq("id", id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
